"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

// ---- Dynamic import Leaflet (no SSR) ----
let L: typeof import("leaflet") | null = null;

async function loadLeaflet() {
  if (L) return L;
  L = await import("leaflet");
  delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
  return L;
}

export interface RoutePoint {
  lat: number;
  lng: number;
  /** km/h */
  speed: number;
  /** waktu (opsional, untuk readout). */
  time?: string;
}

interface Props {
  /** Titik rute berurutan (kronologis). */
  points: RoutePoint[];
  /**
   * Ambang kecepatan km/h. Bila <= 0, kecepatan DIABAIKAN: rute digambar satu
   * warna tanpa segmen/label kecepatan.
   */
  threshold: number;
  className?: string;
}

// Durasi memutar seluruh rute pada kecepatan 1x (detik).
const BASE_PLAY_SECONDS = 20;
const SPEED_OPTIONS = [1, 2, 4, 8];

// Warna garis rute.
const COLOR_BASE = "#9ca3af"; // abu — belum dilalui
const COLOR_TRAVEL = "#2964e7"; // biru — sudah dilalui
const COLOR_SPEED = "#dc2626"; // merah — dilalui saat melewati ambang speed
const COLOR_START = "#16a34a"; // hijau — titik mulai
const COLOR_END = "#fb923c"; // oren pudar — titik selesai

/** Jarak dua koordinat (meter) — haversine sederhana. */
function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Rentang indeks (inklusif) titik-titik yang kecepatannya melewati threshold. */
function overspeedRuns(points: RoutePoint[], threshold: number): Array<[number, number]> {
  if (threshold <= 0) return [];
  const runs: Array<[number, number]> = [];
  let start = -1;
  for (let i = 0; i < points.length - 1; i++) {
    const over = Math.max(points[i].speed, points[i + 1].speed) > threshold;
    if (over && start === -1) start = i;
    if (!over && start !== -1) {
      runs.push([start, i]);
      start = -1;
    }
  }
  if (start !== -1) runs.push([start, points.length - 1]);
  return runs;
}

export interface RouteStats {
  distanceMeters: number;
  maxSpeed: number;
  /** Jumlah segmen berurutan yang melewati threshold (0 bila threshold diabaikan). */
  overspeedRuns: number;
}

/** Ringkasan rute: jarak tempuh, kecepatan maksimum, jumlah segmen ngebut. */
export function routeStats(points: RoutePoint[], threshold: number): RouteStats {
  let distanceMeters = 0;
  let maxSpeed = 0;
  for (let i = 0; i < points.length; i++) {
    if (points[i].speed > maxSpeed) maxSpeed = points[i].speed;
    if (i > 0) {
      distanceMeters += haversineMeters(
        points[i - 1].lat,
        points[i - 1].lng,
        points[i].lat,
        points[i].lng,
      );
    }
  }
  return { distanceMeters, maxSpeed, overspeedRuns: overspeedRuns(points, threshold).length };
}

/** Satu ruas rute dengan warna seragam (normal / melewati ambang speed). */
interface TravelRun {
  startIdx: number;
  endIdx: number;
  speeding: boolean;
  latlngs: [number, number][];
  line: import("leaflet").Polyline | null;
  lastTarget: [number, number][] | null;
}

/** Array kosong yang referensinya stabil (untuk deteksi perubahan). */
const EMPTY_LATLNGS: [number, number][] = [];

/**
 * Pecah rute menjadi ruas-ruas berwarna seragam. Dua titik berurutan dianggap
 * "speeding" bila salah satu kecepatannya melewati threshold.
 */
function buildRuns(pts: RoutePoint[], threshold: number): TravelRun[] {
  const n = pts.length;
  if (n < 2) return [];
  const speedingAt = (i: number) =>
    threshold > 0 && Math.max(pts[i].speed, pts[i + 1].speed) > threshold;

  const make = (startIdx: number, endIdx: number, speeding: boolean): TravelRun => ({
    startIdx,
    endIdx,
    speeding,
    latlngs: pts.slice(startIdx, endIdx + 1).map((p) => [p.lat, p.lng] as [number, number]),
    line: null,
    lastTarget: null,
  });

  const runs: TravelRun[] = [];
  let start = 0;
  let cur = speedingAt(0);
  for (let i = 1; i <= n - 2; i++) {
    const s = speedingAt(i);
    if (s !== cur) {
      runs.push(make(start, i, cur));
      start = i;
      cur = s;
    }
  }
  runs.push(make(start, n - 1, cur));
  return runs;
}

/**
 * Terapkan progress ke garis "sudah dilalui": ruas sebelum titik aktif penuh,
 * ruas aktif sebagian, ruas sesudahnya kosong. Hanya polyline yang berubah yang
 * di-set ulang agar tetap ringan saat playback.
 */
function renderTravel(runs: TravelRun[], idx: number) {
  for (const run of runs) {
    let target: [number, number][];
    if (run.endIdx <= idx) target = run.latlngs;
    else if (run.startIdx > idx) target = EMPTY_LATLNGS;
    else target = run.latlngs.slice(0, idx - run.startIdx + 1);

    if (target === run.lastTarget) continue;
    run.line?.setLatLngs(target);
    run.lastTarget = target;
  }
}

/**
 * Format waktu titik untuk readout: `2026-10-04T21:03:07+07:00` atau
 * `2026-10-04 21:03:07` → `2026-10-04 21:03:07` (YYYY-MM-DD HH:MM:SS).
 */
function formatPointTime(value?: string): string {
  if (!value) return "-";
  return value.slice(0, 19).replace("T", " ");
}

/** Ikon mobil untuk penanda playback. */
function carIcon(leaflet: typeof import("leaflet")) {
  return leaflet.divIcon({
    className: "route-car-icon",
    html: `<div class="route-car-badge"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

/**
 * Gambar layer rute statis: garis dasar abu-abu (belum dilalui), marker
 * mulai/selesai, dan label kecepatan di titik puncak tiap segmen ngebut.
 */
function drawBase(
  leaflet: typeof import("leaflet"),
  map: import("leaflet").Map,
  layer: import("leaflet").LayerGroup,
  points: RoutePoint[],
  threshold: number,
) {
  layer.clearLayers();

  const valid = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  if (valid.length === 0) return;
  const latlngs = valid.map((p) => leaflet.latLng(p.lat, p.lng));

  // Garis dasar abu-abu: seluruh rute, sebagai "belum dilalui".
  if (latlngs.length >= 2) {
    leaflet
      .polyline(latlngs, { color: COLOR_BASE, weight: 4, opacity: 0.9, pane: "routeBasePane" })
      .addTo(layer);
  }

  // Label kecepatan di titik puncak tiap segmen ngebut.
  for (const [s, e] of overspeedRuns(valid, threshold)) {
    let peak = s;
    for (let i = s; i <= e; i++) if (valid[i].speed > valid[peak].speed) peak = i;
    const p = valid[peak];
    leaflet
      .circleMarker([p.lat, p.lng], {
        radius: 7,
        color: "#ffffff",
        weight: 2,
        fillColor: COLOR_SPEED,
        fillOpacity: 1,
        pane: "markerPane",
      })
      .addTo(layer)
      .bindTooltip(`⚠ ${p.speed.toFixed(0)} km/h`, {
        permanent: true,
        direction: "top",
        offset: [0, -8],
        className: "route-speed-label",
      });
  }

  // Marker mulai (hijau) & selesai (oren pudar).
  leaflet
    .circleMarker(latlngs[0], {
      radius: 8,
      color: "#ffffff",
      weight: 2,
      fillColor: COLOR_START,
      fillOpacity: 1,
      pane: "markerPane",
    })
    .addTo(layer)
    .bindTooltip("Mulai", { permanent: true, direction: "top", offset: [0, -8], className: "text-[11px]" });

  if (latlngs.length >= 2) {
    leaflet
      .circleMarker(latlngs[latlngs.length - 1], {
        radius: 8,
        color: "#ffffff",
        weight: 2,
        fillColor: COLOR_END,
        fillOpacity: 1,
        pane: "markerPane",
      })
      .addTo(layer)
      .bindTooltip("Selesai", { permanent: true, direction: "top", offset: [0, -8], className: "text-[11px]" });
  }

  const bounds = leaflet.latLngBounds(latlngs);
  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
  }
}

/**
 * RouteMap — peta read-only untuk rute perjalanan + playback.
 *
 * Skema warna garis:
 * - abu-abu  : belum dilalui
 * - biru     : sudah dilalui
 * - merah    : sudah dilalui saat melewati ambang kecepatan
 *
 * Bila `threshold <= 0`, kecepatan diabaikan: garis cukup abu → biru.
 * Container WAJIB punya tinggi eksplisit; peta mengisi lewat `absolute inset-0`.
 */
export default function RouteMap({ points, threshold, className }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const travelLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const carMarkerRef = useRef<import("leaflet").Marker | null>(null);
  const runsRef = useRef<TravelRun[]>([]);

  // Titik valid (terfilter) — dihitung dari props agar perubahan data memicu
  // re-render (ref saja tidak cukup untuk menampilkan UI).
  const validPoints = useMemo(
    () => points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)),
    [points],
  );
  const validPointsRef = useRef<RoutePoint[]>([]);
  const playRef = useRef({ progress: 0, speedMul: 1 });

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speedMul, setSpeedMul] = useState(1);

  // Nilai terbaru dipakai saat map selesai init.
  const pointsRef = useRef(points);
  const thresholdRef = useRef(threshold);
  pointsRef.current = points;
  thresholdRef.current = threshold;
  validPointsRef.current = validPoints;

  /** Bangun ulang ruas berwarna + polyline-nya (dipanggil saat data berubah). */
  const rebuildTravel = useCallback(() => {
    const leaflet = L;
    const layer = travelLayerRef.current;
    if (!leaflet || !layer) return;

    layer.clearLayers();
    const runs = buildRuns(validPointsRef.current, thresholdRef.current);
    for (const run of runs) {
      run.line = leaflet
        .polyline([], {
          color: run.speeding ? COLOR_SPEED : COLOR_TRAVEL,
          weight: 5,
          opacity: 0.95,
          pane: "routeTravelPane",
        })
        .addTo(layer);
    }
    runsRef.current = runs;
  }, []);

  /**
   * Terapkan progress [0..1] ke peta: posisi mobil + garis "sudah dilalui".
   * `follow` = geser peta bila mobil keluar dari layar (dipakai saat playing).
   */
  const applyProgress = useCallback((p: number, follow = false) => {
    const leaflet = L;
    const map = mapInstance.current;
    const pts = validPointsRef.current;
    if (!leaflet || !map || pts.length === 0) return;

    const idx = Math.min(pts.length - 1, Math.max(0, Math.round(p * (pts.length - 1))));
    const cur = pts[idx];

    const car = carMarkerRef.current;
    if (car) {
      car.setLatLng([cur.lat, cur.lng]);
      car.setOpacity(1);
    }

    renderTravel(runsRef.current, idx);

    if (follow && !map.getBounds().pad(-0.15).contains([cur.lat, cur.lng])) {
      map.panTo([cur.lat, cur.lng]);
    }
  }, []);

  // ---- Init map sekali ----
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    let cancelled = false;

    (async () => {
      const leaflet = await loadLeaflet();
      if (cancelled || !mapRef.current) return;

      const map = leaflet.map(mapRef.current, {
        center: [-6.21, 106.84],
        zoom: 12,
        zoomControl: false,
      });
      leaflet.control.zoom({ position: "topright" }).addTo(map);
      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        })
        .addTo(map);

      // Pane khusus untuk urutan gambar: rute dasar < sudah dilalui < mobil.
      // (markerPane default = 600 untuk marker & label.)
      map.createPane("routeBasePane").style.zIndex = "400";
      map.createPane("routeTravelPane").style.zIndex = "410";
      map.createPane("routeCarPane").style.zIndex = "620";

      const layer = leaflet.layerGroup().addTo(map);
      layerRef.current = layer;
      travelLayerRef.current = leaflet.layerGroup().addTo(map);
      mapInstance.current = map;

      carMarkerRef.current = leaflet
        .marker([0, 0], { icon: carIcon(leaflet), pane: "routeCarPane", interactive: false, opacity: 0 })
        .addTo(map);

      drawBase(leaflet, map, layer, pointsRef.current, thresholdRef.current);
      rebuildTravel();
      applyProgress(0);

      window.setTimeout(() => {
        if (!cancelled) map.invalidateSize();
      }, 0);
    })();

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        layerRef.current = null;
        travelLayerRef.current = null;
        carMarkerRef.current = null;
        runsRef.current = [];
      }
    };
  }, [applyProgress, rebuildTravel]);

  // ---- Redraw + reset playback saat data berubah ----
  useEffect(() => {
    playRef.current.progress = 0;
    setPlaying(false);
    setProgress(0);

    const map = mapInstance.current;
    const layer = layerRef.current;
    if (!map || !layer || !L) return;
    drawBase(L, map, layer, points, threshold);
    rebuildTravel();
    applyProgress(0);
  }, [points, threshold, applyProgress, rebuildTravel]);

  // ---- Loop animasi saat playing ----
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = 0;

    const step = (ts: number) => {
      if (last === 0) last = ts;
      const dt = Math.min(0.1, (ts - last) / 1000);
      last = ts;

      if (validPointsRef.current.length < 2) {
        setPlaying(false);
        return;
      }

      let p = playRef.current.progress + (dt / BASE_PLAY_SECONDS) * playRef.current.speedMul;
      if (p >= 1) p = 1;
      playRef.current.progress = p;
      applyProgress(p, true);
      setProgress(p);

      if (p >= 1) {
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, applyProgress]);

  function togglePlay() {
    if (validPointsRef.current.length < 2) return;
    if (!playing && playRef.current.progress >= 1) {
      playRef.current.progress = 0;
      applyProgress(0);
      setProgress(0);
    }
    setPlaying((v) => !v);
  }

  function scrub(p: number) {
    playRef.current.progress = p;
    applyProgress(p);
    setProgress(p);
  }

  function resetPlayback() {
    setPlaying(false);
    playRef.current.progress = 0;
    applyProgress(0);
    setProgress(0);
  }

  const pts = validPoints;
  const idx = pts.length ? Math.min(pts.length - 1, Math.round(progress * (pts.length - 1))) : 0;
  const cur = pts[idx];
  const canPlay = pts.length >= 2;

  return (
    <div className={className ?? "relative h-full w-full"}>
      <div ref={mapRef} className="absolute inset-0" />

      {pts.length > 0 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-2 max-w-[calc(100%-1.5rem)]">
          {cur && (
            <div className="px-3 py-1 bg-white/95 dark:bg-[#1a1a1c]/95 rounded-full shadow border border-gray-100 dark:border-gray-800/60 text-[11px] text-gray-600 dark:text-gray-300 whitespace-nowrap">
              <span className="font-medium text-gray-900 dark:text-white">{formatPointTime(cur.time)}</span>
              <span className="mx-1.5 text-gray-300 dark:text-gray-600">·</span>
              {cur.speed.toFixed(1)} km/h
            </div>
          )}

          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white/95 dark:bg-[#1a1a1c]/95 rounded-full shadow-lg border border-gray-100 dark:border-gray-800/60">
            <button
              type="button"
              onClick={togglePlay}
              disabled={!canPlay}
              aria-label={playing ? "Jeda" : "Putar"}
              className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white bg-[#2964e7] hover:bg-[#2150c5] disabled:opacity-40 transition-colors shrink-0"
            >
              {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <input
              type="range"
              min={0}
              max={1000}
              step={1}
              value={Math.round(progress * 1000)}
              onChange={(e) => scrub(Number(e.target.value) / 1000)}
              disabled={!canPlay}
              aria-label="Progress rute"
              className="w-36 sm:w-56 accent-[#2964e7] cursor-pointer"
            />

            <span className="text-[11px] tabular-nums text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {idx + 1}/{pts.length}
            </span>

            <select
              value={speedMul}
              onChange={(e) => {
                const m = Number(e.target.value);
                playRef.current.speedMul = m;
                setSpeedMul(m);
              }}
              aria-label="Kecepatan putar"
              className="px-1.5 py-1 text-[11px] bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-200 focus:outline-none"
            >
              {SPEED_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}x
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={resetPlayback}
              disabled={!canPlay}
              aria-label="Ulang dari awal"
              className="inline-flex items-center justify-center w-7 h-7 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
