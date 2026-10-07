"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "password" | "email" | "number" | "select" | "textarea" | "date";
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  hint?: string;
  options?: { value: string; label: string }[];
  /** Lebar penuh (mis. textarea) di grid 2 kolom. */
  full?: boolean;
};

/**
 * ModalForm — dialog input standar untuk seluruh CRUD halaman /v1.
 * Nilai form dikendalikan dari halaman lewat `values` + `onChange` supaya
 * logika submit (create vs update) tetap berada di halaman tersebut.
 */
export default function ModalForm({
  open,
  title,
  description,
  fields,
  values,
  submitting = false,
  error = "",
  submitLabel = "Simpan",
  onChange,
  onSubmit,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  fields: Field[];
  values: Record<string, string>;
  submitting?: boolean;
  error?: string;
  submitLabel?: string;
  onChange: (name: string, value: string) => void;
  onSubmit: () => void;
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

  const missing = fields
    .filter((f) => f.required && !(values[f.name] ?? "").trim())
    .map((f) => f.name);

  const canSubmit = missing.length === 0 && !submitting;

  function renderField(f: Field) {
    const value = values[f.name] ?? "";

    return (
      <div key={f.name} className={f.full || f.type === "textarea" ? "sm:col-span-2" : ""}>
        <label className="block mb-1.5 text-[12px] font-semibold" style={{ color: "var(--v1-ink-muted)" }}>
          {f.label}
          {f.required && <span className="ml-0.5" style={{ color: "var(--v1-danger)" }}>*</span>}
        </label>

        {f.type === "select" ? (
          <select
            value={value}
            disabled={f.disabled}
            onChange={(e) => onChange(f.name, e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-[13px] focus:outline-none disabled:opacity-60"
            style={{
              color: "var(--v1-ink)",
              background: "var(--v1-surface-raised)",
              border: "1px solid var(--v1-border)",
            }}
          >
            <option value="">— pilih —</option>
            {(f.options ?? []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : f.type === "textarea" ? (
          <textarea
            value={value}
            rows={3}
            disabled={f.disabled}
            placeholder={f.placeholder}
            onChange={(e) => onChange(f.name, e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-[13px] focus:outline-none disabled:opacity-60 resize-y"
            style={{
              color: "var(--v1-ink)",
              background: "var(--v1-surface-raised)",
              border: "1px solid var(--v1-border)",
            }}
          />
        ) : (
          <input
            type={f.type ?? "text"}
            value={value}
            disabled={f.disabled}
            placeholder={f.placeholder}
            onChange={(e) => onChange(f.name, e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-[13px] focus:outline-none disabled:opacity-60"
            style={{
              color: "var(--v1-ink)",
              background: "var(--v1-surface-raised)",
              border: "1px solid var(--v1-border)",
            }}
          />
        )}

        {f.hint && <p className="mt-1 text-[11px]" style={{ color: "var(--v1-ink-faint)" }}>{f.hint}</p>}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative my-8 w-full max-w-lg rounded-2xl shadow-xl"
        style={{ background: "var(--v1-surface)", border: "1px solid var(--v1-border)" }}
      >
        <div
          className="flex items-start justify-between gap-3 px-6 py-5"
          style={{ borderBottom: "1px solid var(--v1-border-subtle)" }}
        >
          <div>
            <h2 className="text-[16px] font-bold" style={{ color: "var(--v1-ink)", fontFamily: "var(--v1-font-display)" }}>
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-[12px]" style={{ color: "var(--v1-ink-faint)" }}>{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--v1-ink-faint)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) onSubmit();
          }}
        >
          <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(renderField)}
          </div>

          {error && (
            <div
              className="mx-6 mb-4 px-4 py-3 rounded-xl text-[13px]"
              style={{
                background: "var(--v1-danger-bg)",
                border: "1px solid var(--v1-danger-border)",
                color: "var(--v1-danger)",
              }}
            >
              {error}
            </div>
          )}

          <div
            className="flex items-center justify-end gap-2 px-6 py-4"
            style={{ borderTop: "1px solid var(--v1-border-subtle)" }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 text-[13px] font-semibold rounded-xl transition-colors"
              style={{ color: "var(--v1-ink-muted)" }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-4 py-2.5 text-[13px] font-semibold text-white rounded-xl transition-colors disabled:opacity-50"
              style={{ background: "var(--v1-accent)" }}
            >
              {submitting ? "Menyimpan..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
