"use client";

import { useEffect, useRef, useState } from "react";

type Snap = 0 | 1 | 2; // 0 = peek, 1 = half, 2 = full

/**
 * MapDrawer — panel bawah peta dengan tiga titik henti (peek / half / full).
 *
 * Menempel di atas bottom nav, jadi peta tetap terlihat di belakangnya.
 * Drag dilakukan lewat area grip/head; saat dilepas, drawer duduk di titik
 * terdekat. Semua gerak memakai transisi `.m-drawer` (mobile.css).
 */
export default function MapDrawer({
  head,
  children,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
}) {
  const [vh, setVh] = useState(0);
  const [snap, setSnap] = useState<Snap>(0);
  const [translate, setTranslate] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ startY: number; startT: number } | null>(null);

  useEffect(() => {
    const measure = () => setVh(window.innerHeight);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const height = vh ? Math.round(vh * 0.82) : 620;
  const PEEK = 132;
  const visible = (s: Snap) => (s === 0 ? PEEK : s === 1 ? Math.round(vh * 0.46) : height);
  const target = (s: Snap) => Math.max(0, height - visible(s));

  // Dudukkan drawer di titik henti saat ukuran viewport berubah.
  useEffect(() => {
    if (!vh) return;
    setTranslate(target(snap));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vh, snap]);

  function onDown(e: React.PointerEvent<HTMLDivElement>) {
    if (translate === null) return;
    drag.current = { startY: e.clientY, startT: translate };
    setDragging(true);
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      /* pointer capture tidak selalu tersedia */
    }
  }

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const dy = e.clientY - drag.current.startY;
    const max = target(0);
    setTranslate(Math.min(max, Math.max(0, drag.current.startT + dy)));
  }

  function onUp() {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    const cur = translate ?? target(snap);
    let best: Snap = 0;
    let bestDist = Infinity;
    for (const s of [0, 1, 2] as Snap[]) {
      const d = Math.abs(target(s) - cur);
      if (d < bestDist) {
        bestDist = d;
        best = s;
      }
    }
    setSnap(best);
    setTranslate(target(best));
  }

  // translate null → masih mengukur; taruh di luar layar agar masuk dengan animasi.
  const ty = translate === null ? height : translate;

  return (
    <section
      className={`m-drawer${dragging ? " dragging" : ""}`}
      style={{ height, transform: `translateY(${ty}px)` }}
      aria-label="Daftar perangkat"
    >
      <div
        className="m-drawer-head"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div className="m-sheet-grip" />
        {head}
      </div>
      <div className="m-drawer-body">{children}</div>
    </section>
  );
}
