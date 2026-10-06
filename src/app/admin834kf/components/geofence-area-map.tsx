"use client";

import { useEffect, useRef } from "react";

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

export interface AreaMapGeofence {
  name: string;
  color: string;
  polygon_coords: string;
}

export interface AreaMapPoint {
  /** Titik GPS. null = event tidak menyimpan koordinat (marker tidak digambar). */
  lat: number | null;
  lng: number | null;
  /** Label tooltip di marker, mis. "Titik masuk". */
  label?: string;
  /** Warna marker; default hijau. */
  color?: string;
}

interface Props {
  /** Area geofence (polygon). null = peta hanya menampilkan titik GPS. */
  geofence: AreaMapGeofence | null;
  /** Titik GPS yang ditandai. null = tidak ada marker sama sekali. */
  point: AreaMapPoint | null;
  /**
   * Class untuk container peta. Wajib memberi tinggi + positioning
   * (mis. "relative h-[320px] w-full"); default "relative h-full w-full".
   */
  className?: string;
  /**
   * Keterangan kecil di atas peta (mis. "Area saat event"). Ditampilkan hanya
   * bila polygon ada. Berguna untuk menandai bahwa area yang digambar adalah
   * snapshot historis, bukan area terkini.
   */
  note?: string;
}

/**
 * GeofenceAreaMap — peta read-only yang menggambar polygon geofence lalu
 * menandai satu titik GPS di atasnya. Dipakai inline (preview di bawah list
 * event) maupun di dalam modal. Hanya mendukung area_type polygon.
 *
 * Container WAJIB punya tinggi eksplisit; peta mengisi container lewat
 * `absolute inset-0`.
 */
export default function GeofenceAreaMap({ geofence, point, className, note }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").CircleMarker | null>(null);

  const hasPoint = point?.lat != null && point?.lng != null;
  const accent = point?.color || "#16a34a";

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    let cancelled = false;

    (async () => {
      const leaflet = await loadLeaflet();
      if (cancelled || !mapRef.current) return;

      // Titik polygon geofence (area_type polygon).
      let polyLatLngs: import("leaflet").LatLng[] = [];
      if (geofence?.polygon_coords) {
        try {
          const coords: { lat: number; lng: number }[] = JSON.parse(geofence.polygon_coords);
          polyLatLngs = coords.map((c) => leaflet.latLng(c.lat, c.lng));
        } catch {
          // Data polygon rusak — biarkan peta tampil tanpa area.
        }
      }

      // Pusat awal: rata-rata titik polygon, atau titik GPS bila polygon kosong.
      let initCenter: [number, number] = [-6.21, 106.84];
      let initZoom = 14;
      if (polyLatLngs.length > 0) {
        const avgLat = polyLatLngs.reduce((s, c) => s + c.lat, 0) / polyLatLngs.length;
        const avgLng = polyLatLngs.reduce((s, c) => s + c.lng, 0) / polyLatLngs.length;
        initCenter = [avgLat, avgLng];
        initZoom = 15;
      } else if (hasPoint) {
        initCenter = [point!.lat as number, point!.lng as number];
        initZoom = 16;
      }

      const map = leaflet.map(mapRef.current, {
        center: initCenter,
        zoom: initZoom,
        zoomControl: false,
      });
      leaflet.control.zoom({ position: "topright" }).addTo(map);

      leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const bounds = leaflet.latLngBounds([]);

      // Polygon area geofence.
      if (polyLatLngs.length >= 3) {
        const color = geofence?.color || "#FF0000";
        leaflet
          .polygon(polyLatLngs, { color, fillColor: color, fillOpacity: 0.15, weight: 2 })
          .addTo(map)
          .bindTooltip(geofence?.name || "Geofence", { sticky: true });
        polyLatLngs.forEach((p) => bounds.extend(p));
      }

      // Titik GPS.
      if (hasPoint) {
        const lat = point!.lat as number;
        const lng = point!.lng as number;
        markerRef.current = leaflet
          .circleMarker([lat, lng], {
            radius: 8,
            color: "#ffffff",
            weight: 2,
            fillColor: accent,
            fillOpacity: 1,
            pane: "markerPane",
          })
          .addTo(map)
          .bindTooltip(point!.label || "Titik GPS", {
            permanent: true,
            direction: "top",
            offset: [0, -8],
            className: "text-[11px]",
          });
        bounds.extend([lat, lng]);
      }

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
      }

      mapInstance.current = map;
      // Container bisa belum punya ukuran final saat mount — hitung ulang.
      window.setTimeout(() => {
        if (!cancelled) map.invalidateSize();
      }, 0);
    })();

    return () => {
      cancelled = true;
      markerRef.current = null;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
    // Sengaja hanya bergantung pada nilai primitif: prop geofence/point adalah
    // objek baru tiap render, kalau dimasukkan ke deps peta akan di-rebuild terus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geofence?.name, geofence?.color, geofence?.polygon_coords, point?.lat, point?.lng, point?.label, accent]);

  return (
    <div className={className ?? "relative h-full w-full"}>
      <div ref={mapRef} className="absolute inset-0" />

      <div className="absolute top-3 left-3 z-[1000] flex flex-col items-start gap-1.5">
        {note && geofence && (
          <div className="px-2 py-1 bg-black/70 text-white text-[10px] font-medium rounded-md shadow">
            {note}
          </div>
        )}
        {hasPoint && (
          <button
            type="button"
            onClick={() => mapInstance.current?.setView([point!.lat as number, point!.lng as number], 17)}
            className="px-2 py-1 text-white text-[10px] font-medium rounded-md shadow transition-colors"
            style={{ backgroundColor: accent }}
          >
            📍 Titik GPS
          </button>
        )}
      </div>

      {point && !hasPoint && (
        <div className="absolute bottom-3 left-3 z-[1000] px-3 py-1.5 bg-black/70 text-white text-[11px] rounded-lg">
          Event ini tidak menyimpan koordinat.
        </div>
      )}
    </div>
  );
}
