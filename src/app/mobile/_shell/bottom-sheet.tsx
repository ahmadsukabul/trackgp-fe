"use client";

import { useEffect, useRef, useState } from "react";

/**
 * BottomSheet — panel yang naik dari bawah, khas aplikasi native.
 *
 * Dipakai ulang untuk pemilih bisnis, panduan pasang PWA, dan action sheet.
 * Mendukung drag-to-dismiss lewat grip; backdrop menutup saat diketuk.
 * Animasi masuk/keluar memakai kelas `.m-sheet` (lihat mobile.css).
 */
export default function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startY = useRef<number | null>(null);

  // Kelola siklus mount supaya animasi keluar tetap jalan.
  // Pakai setTimeout (bukan rAF) agar tetap andal saat tab tidak aktif.
  useEffect(() => {
    if (open) {
      setMounted(true);
      const r = window.setTimeout(() => setVisible(true), 20);
      return () => window.clearTimeout(r);
    }
    setVisible(false);
    const t = window.setTimeout(() => setMounted(false), 380);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    startY.current = e.clientY;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (startY.current === null) return;
    setDragY(Math.max(0, e.clientY - startY.current));
  }
  function onPointerUp() {
    if (startY.current === null) return;
    const shouldClose = dragY > 90;
    startY.current = null;
    setDragY(0);
    if (shouldClose) onClose();
  }

  return (
    <>
      <div
        className={`m-sheet-backdrop${visible ? " is-open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`m-sheet${visible ? " is-open" : ""}`}
        style={dragY ? { transform: `translateY(${dragY}px)`, transition: "none" } : undefined}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div
          className="m-sheet-grip"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
        {title && (
          <div className="m-sheet-head">
            <h2 className="m-sheet-title">{title}</h2>
          </div>
        )}
        <div className="m-sheet-body">{children}</div>
      </div>
    </>
  );
}
