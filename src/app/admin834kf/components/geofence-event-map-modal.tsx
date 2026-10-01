"use client";

import { useEffect } from "react";
import { X, MapPin, LogIn, LogOut, Navigation } from "lucide-react";
import GeofenceAreaMap from "./geofence-area-map";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** Format "2006-01-02 15:04:05" → "02 Okt 14:32" (aman terhadap data rusak). */
function formatEventTime(value: string): string {
  if (!value) return "-";
  const d = new Date(value.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return value;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${hh}:${mm}`;
}

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
}

/**
 * GeofenceEventMapModal — viewer read-only: menggambar polygon geofence lalu
 * menandai titik GPS saat event masuk/keluar terjadi. Dipakai halaman detail
 * geofence supaya admin bisa memastikan sendiri bahwa kendaraan benar-benar
 * berada di dalam area (enter) atau di luar area (exit) pada saat event.
 *
 * Hanya mendukung area_type polygon (sesuai keputusan admin panel).
 */
export default function GeofenceEventMapModal({ open, onClose, geofence, event }: Props) {
  const hasPoint = event?.lat != null && event?.lng != null;
  const isEnter = event?.event_type === "geofenceEnter";
  const accent = isEnter ? "#16a34a" : "#dc2626";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#1a1a1c] rounded-2xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800/60 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              Area Geofence
            </h2>
            <span
              className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                isEnter
                  ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                  : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
              }`}
            >
              {isEnter ? <LogIn className="w-3 h-3" /> : <LogOut className="w-3 h-3" />}
              {isEnter ? "Masuk" : "Keluar"}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Map */}
        <div className="relative flex-1 min-h-[360px]">
          <GeofenceAreaMap
            className="absolute inset-0"
            geofence={geofence}
            point={{ lat: event.lat, lng: event.lng, label: isEnter ? "Titik masuk" : "Titik keluar", color: accent }}
          />
        </div>

        {/* Ringkasan */}
        <div className="shrink-0 border-t border-gray-100 dark:border-gray-800/60 px-5 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-x-6 gap-y-2">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-0.5">Koordinat</p>
              <p className="text-[12px] font-mono text-gray-900 dark:text-white truncate">
                {hasPoint
                  ? `${(event.lat as number).toFixed(6)}, ${(event.lng as number).toFixed(6)}`
                  : "-"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-0.5">GPS</p>
              <p className="text-[12px] text-gray-900 dark:text-white truncate">
                {event.device_id || "-"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-0.5">Waktu</p>
              <p className="text-[12px] text-gray-900 dark:text-white truncate">
                {formatEventTime(event.event_time)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-0.5 flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                Pesan
              </p>
              <p className="text-[12px] text-gray-900 dark:text-white truncate" title={event.message}>
                {event.message || "-"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
