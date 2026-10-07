"use client";

import { Search } from "lucide-react";

/** Pill status (online/offline/dll) untuk daftar mobile. */
export function MStatus({ value }: { value: string }) {
  const online = ["online", "aktif", "1"].includes(String(value).toLowerCase());
  return (
    <span
      className="inline-flex items-center gap-1.5"
      style={{
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 600,
        background: online ? "var(--v1-success-bg)" : "var(--v1-surface-raised)",
        color: online ? "var(--v1-success)" : "var(--v1-ink-faint)",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          background: online ? "var(--v1-success)" : "var(--v1-ink-faint)",
        }}
      />
      {value || "unknown"}
    </span>
  );
}

/** Kolom pencarian mobile. */
export function MSearch({
  value,
  onChange,
  placeholder = "Cari...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ position: "relative" }}>
      <Search
        className="w-4 h-4"
        style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--v1-ink-faint)" }}
      />
      <input
        className="m-input"
        style={{ paddingLeft: 36 }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

/** Kartu ringkas untuk daftar. */
export function MCard({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      className="m-card m-card-pad"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      style={{ cursor: onClick ? "pointer" : undefined }}
    >
      {children}
    </div>
  );
}

export function MEmpty({ text = "Belum ada data." }: { text?: string }) {
  return <div className="m-empty">{text}</div>;
}
