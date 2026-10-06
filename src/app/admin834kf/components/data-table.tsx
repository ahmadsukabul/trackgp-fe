"use client";

import { useState } from "react";
import { Search, Plus, RefreshCw, Inbox, RotateCcw } from "lucide-react";
import { PaginationBar } from "./pagination";
import AutoRefreshBadge from "./auto-refresh-badge";

/**
 * Jumlah baris minimum di dalam tabel. Kalau data kurang dari ini, sisa barisnya
 * diisi baris kosong setinggi baris data supaya area list tidak terlihat pendek
 * dan bar paging selalu berada di bawah, seperti konsep list Terachat.
 */
const MIN_ROWS = 8;

export type Column<T> = {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
};

type FilterOption = { label: string; value: string };

type SearchField = {
  /** Key yang dikirim ke API, misal "name", "bisnis_id", "unique_id" */
  key: string;
  /** Label / placeholder input */
  label?: string;
  /** Placeholder input (fallback ke label) */
  placeholder?: string;
  /** Lebar input (Tailwind class), default w-[160px] */
  width?: string;
};

type DataTableProps<T> = {
  title: string;
  columns: Column<T>[];
  data: T[];
  loading: boolean;
  currentPage?: number;
  onRefresh?: () => void;
  onAdd?: () => void;
  addLabel?: string;
  emptyMessage?: string;

  // --- Multi-field search ---
  searchFields?: SearchField[];
  onSearch?: (filters: Record<string, string>) => void;

  // --- Filter dropdown ---
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  statusOptions?: FilterOption[];
  onReset?: () => void;

  // --- Paging keyset (last_id + limit), lihat useKeysetPaging ---
  pageSize?: number;
  hasNext?: boolean;
  maxVisitedPage?: number;
  onPrev?: () => void;
  onNext?: () => void;
  onPageJump?: (page: number) => void;

  // --- Auto-refresh ---
  autoRefresh?: {
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
    /** Timestamp refresh terakhir (ms), null = belum pernah. */
    lastAt: number | null;
    /** Interval polling (ms), untuk tooltip. */
    intervalMs: number;
  };
};

/**
 * DataTable — tabel list generik halaman admin: header + toolbar pencarian,
 * filter status, tombol refresh/auto-refresh, badan tabel, dan bar paging keyset.
 */
export function DataTable<T extends Record<string, unknown>>({
  title,
  columns,
  data,
  loading,
  onRefresh,
  onAdd,
  addLabel = "Tambah",
  emptyMessage = "Tidak ada data",
  searchFields,
  onSearch,
  statusFilter,
  onStatusFilterChange,
  statusOptions,
  onReset,
  pageSize = 20,
  hasNext = false,
  maxVisitedPage = 1,
  currentPage = 1,
  onPrev,
  onNext,
  onPageJump,
  autoRefresh,
}: DataTableProps<T>) {
  // State untuk setiap search field
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    searchFields?.forEach((f) => { init[f.key] = ""; });
    return init;
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    // Kirim hanya field yang isiannya tidak kosong
    const filters: Record<string, string> = {};
    for (const [k, v] of Object.entries(fieldValues)) {
      if (v.trim()) filters[k] = v.trim();
    }
    onSearch?.(filters);
  }

  const hasToolbar = (searchFields && searchFields.length > 0) || statusOptions;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        <div className="flex items-center gap-2">
          {autoRefresh && (
            <AutoRefreshBadge
              enabled={autoRefresh.enabled}
              onToggle={autoRefresh.onToggle}
              lastAt={autoRefresh.lastAt}
              intervalMs={autoRefresh.intervalMs}
            />
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          )}
          {onAdd && (
            <button
              onClick={onAdd}
              className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {addLabel}
            </button>
          )}
        </div>
      </div>

      {/* Toolbar: Multi-field Search + Status Filter + Reset */}
      {hasToolbar && (
        <div className="flex flex-wrap items-center gap-3">
          {searchFields && searchFields.length > 0 && onSearch && (
            <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
              {searchFields.map((field) => (
                <div key={field.key} className={`relative ${field.width || "w-[160px]"}`}>
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={fieldValues[field.key] || ""}
                    onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSearch(e); }}
                    placeholder={field.label || field.placeholder}
                    className="w-full pl-8 pr-2 py-2 text-[13px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2964e7]/30 focus:border-[#2964e7]"
                  />
                </div>
              ))}
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-white bg-[#2964e7] hover:bg-[#2150c5] rounded-lg transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                Cari
              </button>
            </form>
          )}
          {statusOptions && (
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange?.(e.target.value)}
              className="px-3 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
          {onReset && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700/50">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[11px] ${col.className || ""}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center gap-3 py-16">
                      <Inbox className="w-10 h-10 text-gray-300 dark:text-gray-700" />
                      <p className="text-[14px] font-medium text-gray-400 dark:text-gray-500">
                        {emptyMessage}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {data.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      {columns.map((col) => (
                        <td key={col.key} className={`px-4 py-3 text-gray-700 dark:text-gray-300 ${col.className || ""}`}>
                          {col.render
                            ? col.render(item)
                            : String(item[col.key] ?? "-")}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Baris kosong pengisi: memakai tinggi baris data (h-[46px])
                      supaya tabel tidak terlihat pendek saat data hanya 1-2 baris. */}
                  {Array.from({ length: Math.max(0, MIN_ROWS - data.length) }).map((_, i) => (
                    <tr key={`filler-${i}`} aria-hidden>
                      <td colSpan={columns.length} className="h-[46px]" />
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination — selalu tampil supaya area list terlihat rapi walau kosong */}
        {onPrev && onNext && (
          <PaginationBar
            page={currentPage}
            limit={pageSize}
            canPrev={currentPage > 1}
            canNext={hasNext}
            loading={loading}
            onPrev={onPrev}
            onNext={onNext}
            onPageJump={onPageJump}
            maxVisitedPage={maxVisitedPage}
          />
        )}
      </div>
    </div>
  );
}

// Status badge
export function StatusBadge({ status }: { status: string | number | boolean }) {
  let label: string;
  let color: string;

  if (typeof status === "boolean") {
    label = status ? "Aktif" : "Nonaktif";
    color = status
      ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
      : "bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400";
  } else if (typeof status === "number") {
    label = status === 1 ? "Aktif" : status === 0 ? "Nonaktif" : String(status);
    color =
      status === 1
        ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
        : "bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400";
  } else {
    label = status;
    const s = String(status).toLowerCase();
    if (s === "online" || s === "active" || s === "active_xml") {
      color = "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400";
    } else if (s === "offline" || s === "inactive") {
      color = "bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400";
    } else {
      color = "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400";
    }
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${color}`}>
      {label}
    </span>
  );
}

// StatusSwitch — toggle on/off untuk update status cepat di list.
export function StatusSwitch({
  checked,
  onChange,
  disabled,
  loading,
  title,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      title={title}
      disabled={disabled || loading}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

// Modal
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700/50">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

// Form input
export function FormField({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3 py-2 text-[13px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
    />
  );
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-[13px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
