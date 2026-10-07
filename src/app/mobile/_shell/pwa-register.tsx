"use client";

import { useEffect } from "react";

/** Daftarkan service worker PWA (scope /mobile/). */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    // Di mode dev, SW malah menyajikan chunk lama (nama file Turbopack tidak
    // selalu ber-hash) sehingga perubahan kode tidak terlihat. Nonaktifkan.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .catch(() => {
          /* diabaikan */
        });
      return;
    }

    navigator.serviceWorker
      .register("/mobile/sw.js", { scope: "/mobile/" })
      .catch(() => {
        /* diabaikan — prompt pasang tetap jalan tanpa SW di beberapa browser */
      });
  }, []);

  return null;
}
