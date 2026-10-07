"use client";

import { useState } from "react";
import { Plus, RefreshCw, Search } from "lucide-react";

/** Field yang ditampilkan sebagai kolom tabel. */
export type Column<T> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

/**
 * CrudPage — kerangka standar halaman daftar: judul, pencarian, tombol refresh +
 * tambah, tabel, dan empty/loading state. Semua halaman domain (gps, camera,
 * vehicle, driver, team) memakainya supaya tampilannya konsisten.
 */
export default function CrudPage<T>({
  title,
  description,
  columns,
  rows,
  loading,
  error,
  searchPlaceholder = "Cari...",
  addLabel = "Tambah",
  canAdd = true,
  rowKey,
  onSearch,
  onAdd,
  onRefresh,
  onEdit,
  onDelete,
  extraActions,
}: {
  title: string;
  description?: string;
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  error?: string;
  searchPlaceholder?: string;
  addLabel?: string;
  canAdd?: boolean;
  rowKey: (row: T) => string;
  onSearch?: (value: string) => void;
  onAdd?: () => void;
  onRefresh?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  extraActions?: (row: T) => React.ReactNode;
}) {
  const [query, setQuery] = useState("");

  const filtered = !onSearch && query
    ? rows.filter((r) => JSON.stringify(r).toLowerCase().includes(query.toLowerCase()))
    : rows;

  return (
    <div className="max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--v1-ink)", fontFamily: "var(--v1-font-display)" }}>
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-[13px]" style={{ color: "var(--v1-ink-faint)" }}>{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onSearch ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--v1-ink-faint)" }} />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  onSearch(e.target.value);
                }}
                placeholder={searchPlaceholder}
                className="w-[180px] sm:w-[240px] pl-9 pr-3 py-2 rounded-xl text-[13px] focus:outline-none"
                style={{
                  color: "var(--v1-ink)",
                  background: "var(--v1-surface-raised)",
                  border: "1px solid var(--v1-border)",
                }}
              />
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--v1-ink-faint)" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-[180px] sm:w-[240px] pl-9 pr-3 py-2 rounded-xl text-[13px] focus:outline-none"
                style={{
                  color: "var(--v1-ink)",
                  background: "var(--v1-surface-raised)",
                  border: "1px solid var(--v1-border)",
                }}
              />
            </div>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Muat ulang"
              className="p-2 rounded-xl transition-colors"
              style={{ border: "1px solid var(--v1-border)", color: "var(--v1-ink-muted)" }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          )}
          {canAdd && onAdd && (
            <button
              onClick={onAdd}
              className="flex items-center gap-1.5 px-4 py-2 text-white text-[13px] font-semibold rounded-xl transition-colors"
              style={{ background: "var(--v1-accent)" }}
            >
              <Plus className="w-4 h-4" />
              {addLabel}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-xl text-[13px] font-medium"
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
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--v1-surface)", border: "1px solid var(--v1-border)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="border-b"
                style={{ borderBottomColor: "var(--v1-border-subtle)", background: "var(--v1-surface-raised)" }}
              >
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap"
                    style={{ color: "var(--v1-ink-faint)", fontFamily: "var(--v1-font-display)" }}
                  >
                    {c.label}
                  </th>
                ))}
                {(onEdit || onDelete || extraActions) && (
                  <th
                    className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-right"
                    style={{ color: "var(--v1-ink-faint)", fontFamily: "var(--v1-font-display)" }}
                  >
                    Aksi
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr
                    key={i}
                    className="border-b last:border-0"
                    style={{ borderBottomColor: "var(--v1-border-subtle)" }}
                  >
                    {columns.map((c) => (
                      <td key={c.key} className="px-4 py-3.5">
                        <div className="h-3.5 rounded animate-pulse" style={{ background: "var(--v1-border)" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-16 text-center">
                    <p className="text-[13px]" style={{ color: "var(--v1-ink-faint)" }}>Belum ada data.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={rowKey(row)}
                    className="border-b last:border-0 transition-colors"
                    style={{ borderBottomColor: "var(--v1-border-subtle)" }}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={`px-4 py-3.5 text-[13px] ${c.className ?? ""}`}
                        style={{ color: "var(--v1-ink)" }}
                      >
                        {c.render
                          ? c.render(row)
                          : String((row as Record<string, unknown>)[c.key] ?? "-")}
                      </td>
                    ))}
                    {(onEdit || onDelete || extraActions) && (
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {extraActions?.(row)}
                          {onEdit && (
                            <button
                              onClick={() => onEdit(row)}
                              className="px-2.5 py-1.5 text-[12px] font-semibold rounded-lg transition-colors"
                              style={{ color: "var(--v1-accent)" }}
                            >
                              Edit
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(row)}
                              className="px-2.5 py-1.5 text-[12px] font-semibold rounded-lg transition-colors"
                              style={{ color: "var(--v1-danger)" }}
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-[12px]" style={{ color: "var(--v1-ink-faint)" }}>
        {filtered.length} data
      </p>
    </div>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const online = ["online", "aktif", "1"].includes(String(value).toLowerCase());
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{
        background: online ? "var(--v1-success-bg)" : "var(--v1-surface-raised)",
        color: online ? "var(--v1-success)" : "var(--v1-ink-faint)",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: online ? "var(--v1-success)" : "var(--v1-ink-faint)" }}
      />
      {value || "unknown"}
    </span>
  );
}
