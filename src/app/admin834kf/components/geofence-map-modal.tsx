"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, MapPin, Undo2, RotateCcw } from "lucide-react";
import { adminFetch, getApiErrorMessage } from "../lib/api";
import BisnisSelect from "./bisnis-select";

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

const COLORS = ["#FF0000", "#2964e7", "#16a34a", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

export interface GeofenceData {
  geofence_id: string;
  name: string;
  description: string;
  area_type: string;
  color: string;
  status: number;
  polygon_coords: string;
  min_fixes?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Mode edit — isi untuk edit geofence yang sudah ada */
  editGeofence?: GeofenceData | null;
  /** bisnis_id pemilik geofence (wajib) */
  bisnisId: string;
  /** nama bisnis, ditampilkan saat pilihan bisnis dikunci */
  bisnisName?: string;
  /** kunci pilihan bisnis (mis. dibuka dari halaman detail bisnis) */
  lockBisnis?: boolean;
  centerLat?: number;
  centerLng?: number;
  onSaved: () => void;
}

export default function GeofenceMapModal({
  open,
  onClose,
  editGeofence,
  bisnisId,
  bisnisName = "",
  lockBisnis = false,
  centerLat = -6.21,
  centerLng = 106.84,
  onSaved,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<import("leaflet").Map | null>(null);
  const drawLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const pointsCountRef = useRef(0);
  const closedRef = useRef(false); // true after dblclick closes the polygon
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [polygonPoints, setPolygonPoints] = useState<import("leaflet").LatLng[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [status, setStatus] = useState("1");
  const [minFixes, setMinFixes] = useState("2");
  const [bisnis, setBisnis] = useState(bisnisId);
  const [bisnisLabel, setBisnisLabel] = useState(bisnisName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!editGeofence;
  const hasDevicePos = centerLat !== -6.21 && centerLng !== 106.84;

  // ---- Redraw draw layer whenever polygonPoints or color changes ----
  useEffect(() => {
    const layer = drawLayerRef.current;
    if (!layer || !L) return;

    layer.clearLayers();

    // Markers
    polygonPoints.forEach((pt) => {
      L!.circleMarker(pt, { radius: 4, color, fillColor: color, fillOpacity: 1 }).addTo(layer);
    });

    // Dashed line between points (2+, before polygon is closed)
    if (polygonPoints.length >= 2 && !closedRef.current) {
      const line = L!.polyline(polygonPoints, { color, weight: 2, dashArray: "6 4" });
      (line as unknown as Record<string, unknown>)._isLine = true;
      line.addTo(layer);
    }

    // Filled polygon (after dblclick closes it)
    if (closedRef.current && polygonPoints.length >= 3) {
      L!.polygon(polygonPoints, { color, fillColor: color, fillOpacity: 0.15, weight: 2 }).addTo(layer);
    }
  }, [polygonPoints, color]);

  // ---- Init map ----
  useEffect(() => {
    if (!open || !mapRef.current || mapInstance.current) return;
    let cancelled = false;

    (async () => {
      const leaflet = await loadLeaflet();
      if (cancelled || !mapRef.current) return;

      let initCenter: [number, number] = [centerLat, centerLng];
      let initZoom = 14;

      if (editGeofence?.polygon_coords) {
        try {
          const coords: { lat: number; lng: number }[] = JSON.parse(editGeofence.polygon_coords);
          if (coords.length > 0) {
            const avgLat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;
            const avgLng = coords.reduce((s, c) => s + c.lng, 0) / coords.length;
            initCenter = [avgLat, avgLng];
            initZoom = 15;
          }
        } catch { /* ignore */ }
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

      const drawLayer = leaflet.layerGroup().addTo(map);
      drawLayerRef.current = drawLayer;
      mapInstance.current = map;

      // Device location marker
      if (centerLat !== -6.21 && centerLng !== 106.84) {
        leaflet.circleMarker([centerLat, centerLng], {
          radius: 7,
          color: "#2964e7",
          fillColor: "#2964e7",
          fillOpacity: 0.9,
          weight: 2,
          pane: "markerPane",
        }).addTo(map).bindTooltip("Lokasi GPS", { permanent: true, direction: "top", offset: [0, -8], className: "text-[11px]" });
      }

      // Load existing polygon (edit mode)
      if (editGeofence?.polygon_coords) {
        try {
          const coords: { lat: number; lng: number }[] = JSON.parse(editGeofence.polygon_coords);
          if (coords.length >= 3) {
            const latLngs = coords.map((c) => leaflet.latLng(c.lat, c.lng));
            closedRef.current = true;
            setPolygonPoints(latLngs);
            pointsCountRef.current = latLngs.length;
            map.fitBounds(leaflet.latLngBounds(latLngs), { padding: [40, 40] });
          }
        } catch { /* ignore */ }
      }

      // ---- Click: add point (unlimited) ----
      map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        // Polygon was closed by dblclick — start fresh
        if (closedRef.current) {
          if (clickTimerRef.current) { clearTimeout(clickTimerRef.current); clickTimerRef.current = null; }
          closedRef.current = false;
          pointsCountRef.current = 1;
          setPolygonPoints([e.latlng]);
          return;
        }

        const count = pointsCountRef.current;

        // 3+ points — delay to check if dblclick follows (to close polygon)
        if (count >= 3) {
          if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
          const latlng = e.latlng;
          clickTimerRef.current = setTimeout(() => {
            pointsCountRef.current++;
            setPolygonPoints((prev) => [...prev, latlng]);
            clickTimerRef.current = null;
          }, 200);
          return;
        }

        // <3 points — add immediately (no dblclick possible yet)
        pointsCountRef.current++;
        setPolygonPoints((prev) => [...prev, e.latlng]);
      });

      // ---- Double-click: close polygon ----
      map.on("dblclick", () => {
        // Cancel the pending click (extra point from click event before dblclick)
        if (clickTimerRef.current) { clearTimeout(clickTimerRef.current); clickTimerRef.current = null; }
        if (pointsCountRef.current < 3) return;
        closedRef.current = true;
        setPolygonPoints((prev) => [...prev]); // trigger redraw with filled polygon
      });
    })();

    return () => {
      cancelled = true;
      if (clickTimerRef.current) { clearTimeout(clickTimerRef.current); clickTimerRef.current = null; }
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, centerLat, centerLng, editGeofence]);

  // ---- Reset form when switching between create/edit ----
  useEffect(() => {
    if (!open) return;
    if (editGeofence) {
      setName(editGeofence.name || "");
      setDescription(editGeofence.description || "");
      setColor(editGeofence.color || COLORS[0]);
      setStatus(String(editGeofence.status ?? 1));
      setMinFixes(String(editGeofence.min_fixes ?? 2));
    } else {
      setName("");
      setDescription("");
      setColor(COLORS[0]);
      setStatus("1");
      setMinFixes("2");
    }
    setBisnis(bisnisId);
    setBisnisLabel(bisnisName);
    closedRef.current = false;
    setPolygonPoints([]);
    pointsCountRef.current = 0;
    setError(null);
  }, [open, editGeofence, bisnisId, bisnisName]);

  // ---- Undo / Reset ----
  function resetDrawing() {
    closedRef.current = false;
    setPolygonPoints([]);
    pointsCountRef.current = 0;
  }

  function undoPoint() {
    if (closedRef.current) {
      // If polygon was closed, undo re-opens it for editing
      closedRef.current = false;
    }
    setPolygonPoints((prev) => {
      const next = prev.slice(0, -1);
      pointsCountRef.current = next.length;
      return next;
    });
  }

  // ---- Submit ----
  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      setError("Nama geofence harus diisi");
      return;
    }
    if (!isEdit && !bisnis) {
      setError("Bisnis harus dipilih");
      return;
    }
    if (polygonPoints.length < 3) {
      setError("Polygon minimal 3 titik. Klik di map untuk menambah titik, double-click untuk menutup.");
      return;
    }

    setSaving(true);
    setError(null);

    const polygonCoords = JSON.stringify(polygonPoints.map((p) => ({ lat: p.lat, lng: p.lng })));

    if (isEdit) {
      const res = await adminFetch(`/geofence/${editGeofence!.geofence_id}`, {
        method: "PUT",
        body: {
          name: name.trim(),
          description: description.trim(),
          color,
          status: Number(status),
          min_fixes: Number(minFixes) || 2,
          area_type: "polygon",
          polygon_coords: polygonCoords,
        },
      });
      setSaving(false);
      if (res.status !== 1) {
        setError(getApiErrorMessage(res, "Gagal update geofence"));
        return;
      }
    } else {
      const createRes = await adminFetch<{ geofence_id: string }>("/geofence", {
        method: "POST",
        body: {
          bisnis_id: bisnis,
          name: name.trim(),
          description: description.trim(),
          area_type: "polygon",
          color,
          min_fixes: Number(minFixes) || 2,
          polygon_coords: polygonCoords,
        },
      });

      setSaving(false);
      if (createRes.status !== 1 || !createRes.data) {
        setError(getApiErrorMessage(createRes, "Gagal membuat geofence"));
        return;
      }
    }

    onSaved();
    onClose();
  }, [name, description, color, status, minFixes, bisnis, polygonPoints, isEdit, editGeofence, onSaved, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#1a1a1c] rounded-2xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800/60 shrink-0">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {isEdit ? "Edit Geofence Polygon" : "Buat Geofence Polygon"}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Map */}
          <div className="flex-1 relative">
            <div ref={mapRef} className="absolute inset-0" />

            {/* Action buttons */}
            <div className="absolute top-3 left-3 z-[1000] flex items-center gap-1">
              {polygonPoints.length > 0 && (
                <>
                  <button
                    onClick={undoPoint}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-[#1a1a1c] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    Undo ({polygonPoints.length})
                  </button>
                  <button
                    onClick={resetDrawing}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-red-500 bg-white dark:bg-[#1a1a1c] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                </>
              )}
            </div>

            {/* Hint */}
            <div className="absolute bottom-3 left-3 z-[1000] px-3 py-1.5 bg-black/70 text-white text-[11px] rounded-lg">
              {polygonPoints.length === 0
                ? "Klik di map untuk menambah titik"
                : !closedRef.current
                  ? polygonPoints.length < 3
                    ? `Klik ${3 - polygonPoints.length}× lagi untuk bisa tutup polygon`
                    : "Double-click untuk tutup polygon"
                  : `Polygon tertutup (${polygonPoints.length} titik) — klik lagi untuk mulai baru`}
            </div>

            {/* Device location badge — click to zoom */}
            {hasDevicePos && (
              <button
                onClick={() => mapInstance.current?.setView([centerLat, centerLng], 16)}
                className="absolute top-3 right-14 z-[1000] px-2 py-1 bg-[#2964e7] text-white text-[10px] font-medium rounded-md shadow hover:bg-[#2150c5] transition-colors cursor-pointer"
              >
                📍 Lokasi GPS
              </button>
            )}
          </div>

          {/* Sidebar form */}
          <div className="w-72 shrink-0 border-l border-gray-100 dark:border-gray-800/60 flex flex-col overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Bisnis — hanya saat membuat baru */}
              {!isEdit && (
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1">Bisnis *</label>
                  {lockBisnis ? (
                    <div className="w-full px-3 py-2 text-[13px] bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 truncate">
                      {bisnisLabel || bisnis || "-"}
                    </div>
                  ) : (
                    <BisnisSelect
                      value={bisnis}
                      initialName={bisnisLabel}
                      onChange={(id, nm) => {
                        setBisnis(id);
                        setBisnisLabel(nm);
                      }}
                    />
                  )}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1">Nama Geofence *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Area Gudang"
                  className="w-full px-3 py-2 text-[13px] bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2964e7]/30"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1">Deskripsi</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Opsional"
                  rows={2}
                  className="w-full px-3 py-2 text-[13px] bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2964e7]/30 resize-none"
                />
              </div>

              {/* Status + Min Fixes */}
              <div className="grid grid-cols-2 gap-3">
                {isEdit && (
                  <div>
                    <label className="block text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 text-[13px] bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2964e7]/30"
                    >
                      <option value="1">Aktif</option>
                      <option value="0">Nonaktif</option>
                    </select>
                  </div>
                )}
                <div className={isEdit ? "" : "col-span-2"}>
                  <label className="block text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1">Min Fixes</label>
                  <input
                    type="number"
                    min={1}
                    value={minFixes}
                    onChange={(e) => setMinFixes(e.target.value)}
                    placeholder="2"
                    className="w-full px-3 py-2 text-[13px] bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2964e7]/30"
                  />
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1">Warna</label>
                <div className="flex items-center gap-1.5">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        color === c ? "border-gray-900 dark:border-white scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-700/50 p-3">
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium mb-1.5">Ringkasan</p>
                <div className="space-y-1 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mode</span>
                    <span className="text-gray-900 dark:text-white font-medium">{isEdit ? "Edit" : "Baru"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Titik</span>
                    <span className="text-gray-900 dark:text-white font-medium">{polygonPoints.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className={`font-medium ${closedRef.current ? "text-green-600" : "text-amber-600"}`}>
                      {closedRef.current ? "Tertutup" : "Menggambar"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Warna</span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-gray-900 dark:text-white font-mono text-[11px]">{color}</span>
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-[12px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
              )}
            </div>

            {/* Submit */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800/60 mt-auto">
              <button
                onClick={() => void handleSubmit()}
                disabled={saving || !name.trim() || (!isEdit && !bisnis)}
                className="w-full px-4 py-2.5 text-[13px] font-medium text-white bg-[#2964e7] rounded-lg hover:bg-[#2150c5] disabled:opacity-50 transition-colors"
              >
                {saving ? "Menyimpan..." : isEdit ? "Update Geofence" : "Buat Geofence"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
