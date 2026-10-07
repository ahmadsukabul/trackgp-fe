"use client";

import { useEffect } from "react";

/** Daftarkan service worker PWA (scope /mobile/). */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/mobile/sw.js", { scope: "/mobile/" })
      .catch(() => {
        /* diabaikan — prompt pasang tetap jalan tanpa SW di beberapa browser */
      });
  }, []);

  return null;
}
