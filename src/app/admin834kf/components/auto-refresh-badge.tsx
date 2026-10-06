"use client";

import { useEffect, useState } from "react";

/**
 * AutoRefreshBadge — tombol toggle auto-refresh + indikator waktu.
 *
 * Dibuat komponen terpisah agar tick 1 detik (label "x dtk") hanya me-render
 * badge ini, bukan seluruh tabel/daftar induknya. Dipakai bersama oleh
 * DataTable (halaman list) dan panel log di halaman detail device.
 */
export default function AutoRefreshBadge({
  enabled,
  onToggle,
  lastAt,
  intervalMs,
}: {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  /** Timestamp refresh terakhir (ms), null = belum pernah. */
  lastAt: number | null;
  /** Interval polling (ms), untuk tooltip. */
  intervalMs: number;
}) {
  const [, tick] = useState(0);

  // Update label "x dtk lalu" tiap detik — hanya saat aktif.
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [enabled]);

  const seconds = lastAt ? Math.max(0, Math.floor((Date.now() - lastAt) / 1000)) : null;
  const secondsLabel =
    seconds == null ? "" : seconds < 60 ? `${seconds} dtk` : `${Math.floor(seconds / 60)} mnt`;

  return (
    <button
      type="button"
      onClick={() => onToggle(!enabled)}
      title={
        enabled
          ? `Auto-refresh aktif tiap ${Math.round(intervalMs / 1000)} dtk — klik untuk mematikan`
          : "Auto-refresh nonaktif — klik untuk mengaktifkan"
      }
      className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-lg transition-colors ${
        enabled
          ? "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 hover:bg-green-100 dark:hover:bg-green-500/20"
          : "text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
      }`}
    >
      <span className="relative flex h-2 w-2">
        {enabled && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            enabled ? "bg-green-500" : "bg-gray-400 dark:bg-gray-500"
          }`}
        />
      </span>
      Auto
      {enabled && secondsLabel && (
        <span className="text-[11px] font-normal text-green-600/80 dark:text-green-400/70">{secondsLabel}</span>
      )}
    </button>
  );
}
