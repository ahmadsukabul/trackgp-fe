"use client";

import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

/**
 * ConfirmModal — pola konfirmasi standar (terlihat seperti dialog di terachat-fe).
 * danger=true untuk aksi hapus: tombol utama jadi merah.
 */
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Konfirmasi",
  danger = false,
  submitting = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  submitting?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl shadow-xl p-6"
        style={{ background: "var(--v1-surface)", border: "1px solid var(--v1-border)" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--v1-ink-faint)" }}
        >
          <X className="w-4 h-4" />
        </button>

        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
          style={{
            background: danger ? "var(--v1-danger-bg)" : "var(--v1-accent-light)",
          }}
        >
          <AlertTriangle
            className="w-6 h-6"
            style={{ color: danger ? "var(--v1-danger)" : "var(--v1-accent)" }}
          />
        </div>

        <h2 className="text-[16px] font-bold mb-1" style={{ color: "var(--v1-ink)", fontFamily: "var(--v1-font-display)" }}>
          {title}
        </h2>
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--v1-ink-muted)" }}>
          {message}
        </p>

        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 text-[13px] font-semibold rounded-xl transition-colors"
            style={{ color: "var(--v1-ink-muted)" }}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="px-4 py-2.5 text-[13px] font-semibold text-white rounded-xl transition-colors disabled:opacity-50"
            style={{ background: danger ? "var(--v1-danger)" : "var(--v1-accent)" }}
          >
            {submitting ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
