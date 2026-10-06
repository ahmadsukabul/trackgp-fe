"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useAutoRefresh — polling berkala untuk menyegarkan data di latar belakang.
 *
 * Fitur:
 * - `enabled`  : bisa dimatikan user lewat tombol toggle di UI.
 * - `paused`   : menahan polling saat ada modal/dialog terbuka (agar edit yang
 *                sedang berjalan tidak terganggu).
 * - Page Visibility API: polling otomatis berhenti saat tab tidak aktif, lalu
 *                lanjut lagi saat tab kembali dilihat. Ini menghemat request.
 * - Anti tumpang-tindih: bila satu siklus belum selesai, tick berikutnya
 *                dilewati (tidak menumpuk request).
 *
 * `lastAt` berisi timestamp refresh terakhir yang sukses, untuk ditampilkan
 * sebagai indikator "baru saja diperbarui".
 */
export function useAutoRefresh({
  onRefresh,
  intervalMs = 15000,
  paused = false,
  defaultEnabled = true,
}: {
  onRefresh: () => void | Promise<void>;
  intervalMs?: number;
  paused?: boolean;
  defaultEnabled?: boolean;
}) {
  const [enabled, setEnabled] = useState(defaultEnabled);
  const [lastAt, setLastAt] = useState<number | null>(null);
  const [visible, setVisible] = useState(true);

  // onRefresh terbaru dipakai tanpa memasukkan ke dependency interval.
  const refreshRef = useRef(onRefresh);
  refreshRef.current = onRefresh;
  // Penjaga agar tidak ada dua request berjalan bersamaan.
  const runningRef = useRef(false);

  // Pantau visibilitas tab.
  useEffect(() => {
    const onChange = () => setVisible(!document.hidden);
    onChange();
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  const refreshNow = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    try {
      await refreshRef.current();
      setLastAt(Date.now());
    } catch {
      // Polling latar tidak boleh melempar ke window (mis. saat backend mati).
      // Error load awal tetap ditampilkan lewat state di hook paging.
    } finally {
      runningRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled || paused || !visible) return;
    const id = window.setInterval(() => {
      void refreshNow();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, paused, visible, intervalMs, refreshNow]);

  return { enabled, setEnabled, lastAt, refreshNow, visible };
}
