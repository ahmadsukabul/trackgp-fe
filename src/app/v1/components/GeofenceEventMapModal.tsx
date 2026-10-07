"use client";

import { useEffect } from "react";
import { X, MapPin, LogIn, LogOut, Navigation } from "lucide-react";
import GeofenceAreaMap from "./GeofenceAreaMap";
import { formatDateTimeSec } from "@/lib/format-date";

export interface EventMapGeofence {
  name: string;
  color: string;
  polygon_coords: string;
}

export interface EventMapPoint {
  event_type: string;
  event_time: string;
  device_id: string;
  message: string;
  /** Titik GPS saat event — null bila event tidak menyimpan koordinat. */
  lat: number | null;
  lng: number | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** null = area tidak tersedia (mis. geofence sudah dihapus) — peta tetap tampil dengan titiknya. */
  geofence: EventMapGeofence | null;
  event: EventMapPoint | null;
  /**
   * Keterangan kecil di atas peta, mis. "Area saat event" (snapshot) atau
   * "Area terkini (log lama)". Kosong = tidak ditampilkan.
   */
  areaNote?: string;
}

/** InfoCell — satu sel label/value untuk grid informasi. */
function InfoCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p
        className="text-[11px] uppercase tracking-wider font-medium mb-0.5"
        style={{ color: "var(--v1-ink-faint)", fontFamily: "var(--v1-font-display)" }}
      >
        {label}
      </p>
      <p
        className={`text-[12px] truncate ${mono ? "font-mono" : ""}`}
        style={{ color: "var(--v1-ink)" }}
        title={value}
      >
        {value || "-"}
      </p>
    </div>
  );
}

/**
 * GeofenceEventMapModal (v1) — viewer read-only: menggambar polygon geofence
 * lalu menandai titik GPS saat event masuk/keluar terjadi. Dipakai halaman log
 * geofence supaya user bisa memastikan sendiri bahwa kendaraan benar-benar
 * berada di dalam area (masuk) atau di luar area (keluar) saat event.
 */
export default function GeofenceEventMapModal({ open, onClose, geofence, event, areaNote }: Props) {
  const hasPoint = event?.lat != null && event?.lng != null;
  const isEnter = event?.event_type === "geofenceEnter";
  const accent = isEnter ? "var(--v1-success)" : "var(--v1-danger)";

  // Tutup dengan tombol Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !event) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden"
        style={{ background: "var(--v1-surface)", border: "1px solid var(--v1-border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between gap-3 px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--v1-border-subtle)" }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 shrink-0" style={{ color: "var(--v1-accent)" }} />
            <h2
              className="text-[15px] font-bold truncate"
              style={{ color: "var(--v1-ink)", fontFamily: "var(--v1-font-display)" }}
            >
              Area Geofence
            </h2>
            <span
              className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
              style={{
                background: isEnter ? "var(--v1-success-bg)" : "var(--v1-danger-bg)",
                color: isEnter ? "var(--v1-success)" : "var(--v1-danger)",
              }}
            >
              {isEnter ? <LogIn className="w-3 h-3" /> : <LogOut className="w-3 h-3" />}
              {isEnter ? "Masuk" : "Keluar"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors shrink-0"
            style={{ color: "var(--v1-ink-faint)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Map */}
        <div className="relative flex-1 min-h-[340px]">
          <GeofenceAreaMap
            className="absolute inset-0"
            geofence={geofence}
            note={areaNote}
            point={{ lat: event.lat, lng: event.lng, label: isEnter ? "Titik masuk" : "Titik keluar", color: accent }}
          />
        </div>

        {/* Ringkasan */}
        <div className="shrink-0 px-5 py-3" style={{ borderTop: "1px solid var(--v1-border-subtle)" }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2">
            <InfoCell
              label="Koordinat"
              mono
              value={hasPoint ? `${(event.lat as number).toFixed(6)}, ${(event.lng as number).toFixed(6)}` : "-"}
            />
            <InfoCell label="GPS" value={event.device_id} />
            <InfoCell label="Waktu" value={formatDateTimeSec(event.event_time)} />
            <div className="min-w-0">
              <p
                className="text-[11px] uppercase tracking-wider font-medium mb-0.5 flex items-center gap-1"
                style={{ color: "var(--v1-ink-faint)", fontFamily: "var(--v1-font-display)" }}
              >
                <Navigation className="w-3 h-3" />
                Pesan
              </p>
              <p className="text-[12px] truncate" style={{ color: "var(--v1-ink)" }} title={event.message}>
                {event.message || "-"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
