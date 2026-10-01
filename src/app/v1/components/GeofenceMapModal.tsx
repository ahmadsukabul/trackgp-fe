"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, MapPin, Undo2, RotateCcw } from "lucide-react";
import { getApiErrorMessage } from "../lib/api";
import {
  geofenceCreate,
  geofenceUpdate,
  type Geofence,
} from "../lib/client";

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

interface Props {
  open: boolean;
  onClose: () => void;
  /** Mode edit — isi untuk edit geofence yang sudah ada. */
  editGeofence?: Geofence | null;
  onSaved: () => void;
}

/**
 * GeofenceMapModal (v1) — gambar / edit polygon geofence di peta OpenStreetMap.
 * Klik = tambah titik (bebas), double-click = tutup polygon, Undo/Reset tersedia.
 * Mode edit memuat polygon lama lalu menyimpannya lewat /client/geofence/update.
 */
export default function GeofenceMapModal({ open, onClose, editGeofence, onSaved }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<import("leaflet").Map | null>(null);
  const drawLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const pointsCountRef = useRef(0);
  const closedRef = useRef(false);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [polygonPoints, setPolygonPoints] = useState<import("leaflet").LatLng[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [status, setStatus] = useState(1);
  const [minFixes, setMinFixes] = useState(2);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!editGeofence;

  // ---- Redraw draw layer setiap polygonPoints / color berubah ----
  useEffect(() => {
    const layer = drawLayerRef.current;
    if (!layer || !L) return;

    layer.clearLayers();

    polygonPoints.forEach((pt) => {
      L!.circleMarker(pt, { radius: 4, color, fillColor: color, fillOpacity: 1 }).addTo(layer);
    });

    if (polygonPoints.length >= 2 && !closedRef.current) {
      const line = L!.polyline(polygonPoints, { color, weight: 2, dashArray: "6 4" });
      (line as unknown as Record<string, unknown>)._isLine = true;
      line.addTo(layer);
    }

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

      // Pusat awal: centroid polygon existing (mode edit) atau Jakarta.
      let initCenter: [number, number] = [-6.21, 106.84];
      let initZoom = 11;

      if (editGeofence?.polygon_coords) {
        try {
          const coords: { lat: number; lng: number }[] = JSON.parse(editGeofence.polygon_coords);
          if (coords.length > 0) {
            const avgLat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;
            const avgLng = coords.reduce((s, c) => s + c.lng, 0) / coords.length;
            initCenter = [avgLat, avgLng];
            initZoom = 14;
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

      // Muat polygon existing (mode edit).
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

      // ---- Klik: tambah titik (bebas) ----
      map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        if (closedRef.current) {
          if (clickTimerRef.current) { clearTimeout(clickTimerRef.current); clickTimerRef.current = null; }
          closedRef.current = false;
          pointsCountRef.current = 1;
          setPolygonPoints([e.latlng]);
          return;
        }

        const count = pointsCountRef.current;

        // 3+ titik: tunda sebentar untuk cek apakah disusul double-click (tutup polygon).
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

        pointsCountRef.current++;
        setPolygonPoints((prev) => [...prev, e.latlng]);
      });

      // ---- Double-click: tutup polygon ----
      map.on("dblclick", () => {
        if (clickTimerRef.current) { clearTimeout(clickTimerRef.current); clickTimerRef.current = null; }
        if (pointsCountRef.current < 3) return;
        closedRef.current = true;
        setPolygonPoints((prev) => [...prev]);
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
  }, [open, editGeofence]);

  // ---- Reset form saat buka / ganti mode ----
  useEffect(() => {
    if (!open) return;
    if (editGeofence) {
      setName(editGeofence.name || "");
      setDescription(editGeofence.description || "");
      setColor(editGeofence.color || COLORS[0]);
      setStatus(editGeofence.status ?? 1);
      setMinFixes(editGeofence.min_fixes && editGeofence.min_fixes >= 1 ? editGeofence.min_fixes : 2);
    } else {
      setName("");
      setDescription("");
      setColor(COLORS[0]);
      setStatus(1);
      setMinFixes(2);
    }
    closedRef.current = false;
    setPolygonPoints([]);
    pointsCountRef.current = 0;
    setError(null);
  }, [open, editGeofence]);

  function resetDrawing() {
    closedRef.current = false;
    setPolygonPoints([]);
    pointsCountRef.current = 0;
  }

  function undoPoint() {
    if (closedRef.current) closedRef.current = false;
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
    if (polygonPoints.length < 3) {
      setError("Polygon minimal 3 titik. Klik di peta untuk menambah titik, double-click untuk menutup.");
      return;
    }

    setSaving(true);
    setError(null);

    const polygonCoords = JSON.stringify(polygonPoints.map((p) => ({ lat: p.lat, lng: p.lng })));

    const res = isEdit
      ? await geofenceUpdate({
          geofence_id: editGeofence!.geofence_id,
          name: name.trim(),
          description: description.trim(),
          color,
          area_type: "polygon",
          polygon_coords: polygonCoords,
          status,
          min_fixes: minFixes,
        })
      : await geofenceCreate({
          name: name.trim(),
          description: description.trim(),
          area_type: "polygon",
          color,
          polygon_coords: polygonCoords,
          min_fixes: minFixes,
        });

    setSaving(false);
    if (res.status !== 1) {
      setError(getApiErrorMessage(res, isEdit ? "Gagal update geofence" : "Gagal membuat geofence"));
      return;
    }

    onSaved();
    onClose();
  }, [name, description, color, status, minFixes, polygonPoints, isEdit, editGeofence, onSaved, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-xl flex flex-col overflow-hidden"
        style={{ background: "var(--v1-surface)", border: "1px solid var(--v1-border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--v1-border-subtle)" }}
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" style={{ color: "var(--v1-accent)" }} />
            <h2
              className="text-[15px] font-bold"
              style={{ color: "var(--v1-ink)", fontFamily: "var(--v1-font-display)" }}
            >
              {isEdit ? "Edit Geofence" : "Tambah Geofence"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--v1-ink-faint)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          {/* Peta */}
          <div className="flex-1 relative min-h-[280px]">
            <div ref={mapRef} className="absolute inset-0" />

            {/* Tombol aksi */}
            <div className="absolute top-3 left-3 z-[1000] flex items-center gap-1">
              {polygonPoints.length > 0 && (
                <>
                  <button
                    onClick={undoPoint}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-lg shadow-lg"
                    style={{
                      background: "var(--v1-surface)",
                      border: "1px solid var(--v1-border)",
                      color: "var(--v1-ink-muted)",
                    }}
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    Undo ({polygonPoints.length})
                  </button>
                  <button
                    onClick={resetDrawing}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-lg shadow-lg"
                    style={{
                      background: "var(--v1-surface)",
                      border: "1px solid var(--v1-border)",
                      color: "var(--v1-danger)",
                    }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                </>
              )}
            </div>

            {/* Hint */}
            <div
              className="absolute bottom-3 left-3 z-[1000] px-3 py-1.5 text-[11px] rounded-lg"
              style={{ background: "oklch(18% 0.02 260 / 0.9)", border: "1px solid var(--v1-border)", color: "var(--v1-ink-muted)" }}
            >
              {polygonPoints.length === 0
                ? "Klik di peta untuk menambah titik"
                : !closedRef.current
                  ? polygonPoints.length < 3
                    ? `Klik ${3 - polygonPoints.length}× lagi untuk bisa tutup polygon`
                    : "Double-click untuk tutup polygon"
                  : `Polygon tertutup (${polygonPoints.length} titik) — klik lagi untuk mulai baru`}
            </div>
          </div>

          {/* Sidebar form */}
          <div
            className="w-full md:w-72 shrink-0 flex flex-col overflow-y-auto"
            style={{ borderLeft: "1px solid var(--v1-border-subtle)" }}
          >
            <div className="p-4 space-y-4">
              <div>
                <label className="block mb-1.5 text-[12px] font-semibold" style={{ color: "var(--v1-ink-muted)" }}>
                  Nama Geofence <span style={{ color: "var(--v1-danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Area Gudang"
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] focus:outline-none"
                  style={{
                    color: "var(--v1-ink)",
                    background: "var(--v1-surface-raised)",
                    border: "1px solid var(--v1-border)",
                  }}
                />
              </div>

              <div>
                <label className="block mb-1.5 text-[12px] font-semibold" style={{ color: "var(--v1-ink-muted)" }}>
                  Deskripsi
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Opsional"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] focus:outline-none resize-none"
                  style={{
                    color: "var(--v1-ink)",
                    background: "var(--v1-surface-raised)",
                    border: "1px solid var(--v1-border)",
                  }}
                />
              </div>

              <div>
                <label className="block mb-1.5 text-[12px] font-semibold" style={{ color: "var(--v1-ink-muted)" }}>
                  Warna
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="w-6 h-6 rounded-full transition-all"
                      style={{
                        backgroundColor: c,
                        border: color === c ? "2px solid var(--v1-ink)" : "2px solid transparent",
                        transform: color === c ? "scale(1.1)" : "none",
                      }}
                    />
                  ))}
                </div>
              </div>

              {isEdit && (
                <div>
                  <label className="block mb-1.5 text-[12px] font-semibold" style={{ color: "var(--v1-ink-muted)" }}>
                    Status
                  </label>
                  <select
                    value={String(status)}
                    onChange={(e) => setStatus(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl text-[13px] focus:outline-none"
                    style={{
                      color: "var(--v1-ink)",
                      background: "var(--v1-surface-raised)",
                      border: "1px solid var(--v1-border)",
                    }}
                  >
                    <option value="1">Aktif</option>
                    <option value="0">Nonaktif</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block mb-1.5 text-[12px] font-semibold" style={{ color: "var(--v1-ink-muted)" }}>
                  Minimal Fix Berturut
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={minFixes}
                  onChange={(e) => setMinFixes(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] focus:outline-none"
                  style={{
                    color: "var(--v1-ink)",
                    background: "var(--v1-surface-raised)",
                    border: "1px solid var(--v1-border)",
                  }}
                />
                <p className="mt-1 text-[11px]" style={{ color: "var(--v1-ink-faint)" }}>
                  Jumlah titik GPS berturut-turut sebelum event masuk/keluar dicatat. Naikkan (2–3) untuk mencegah log palsu di tepi area.
                </p>
              </div>

              {/* Ringkasan */}
              <div
                className="rounded-xl p-3"
                style={{ background: "var(--v1-surface-raised)", border: "1px solid var(--v1-border-subtle)" }}
              >
                <p className="text-[11px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: "var(--v1-ink-faint)" }}>
                  Ringkasan
                </p>
                <div className="space-y-1 text-[12px]">
                  <div className="flex justify-between">
                    <span style={{ color: "var(--v1-ink-faint)" }}>Mode</span>
                    <span style={{ color: "var(--v1-ink)", fontWeight: 600 }}>{isEdit ? "Edit" : "Baru"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--v1-ink-faint)" }}>Titik</span>
                    <span style={{ color: "var(--v1-ink)", fontWeight: 600 }}>{polygonPoints.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--v1-ink-faint)" }}>Status</span>
                    <span style={{ color: closedRef.current ? "var(--v1-success)" : "var(--v1-warning)", fontWeight: 600 }}>
                      {closedRef.current ? "Tertutup" : "Menggambar"}
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <p
                  className="text-[12px] px-3 py-2 rounded-xl"
                  style={{
                    background: "var(--v1-danger-bg)",
                    border: "1px solid var(--v1-danger-border)",
                    color: "var(--v1-danger)",
                  }}
                >
                  {error}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="p-4 mt-auto" style={{ borderTop: "1px solid var(--v1-border-subtle)" }}>
              <button
                onClick={() => void handleSubmit()}
                disabled={saving || !name.trim()}
                className="w-full px-4 py-2.5 text-[13px] font-semibold text-white rounded-xl transition-colors disabled:opacity-50"
                style={{ background: "var(--v1-accent)" }}
              >
                {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Buat Geofence"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
