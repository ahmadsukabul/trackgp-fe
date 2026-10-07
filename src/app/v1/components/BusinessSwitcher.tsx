"use client";

import { Building2 } from "lucide-react";
import { useBusiness } from "../lib/BusinessContext";

/**
 * BusinessSwitcher — select dropdown untuk memilih bisnis aktif (multi-tenant).
 * Mengirim event "business:changed" supaya halaman reload data tenant-nya.
 */
export default function BusinessSwitcher() {
  const { businesses, activeBusinessId, activeRole, switchBusiness, loading } = useBusiness();

  if (loading) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg animate-pulse"
        style={{ background: "var(--v1-surface-raised)" }}
      >
        <div className="w-4 h-4 rounded" style={{ background: "var(--v1-border)" }} />
        <div className="w-24 h-4 rounded" style={{ background: "var(--v1-border)" }} />
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-[13px]" style={{ color: "var(--v1-ink-faint)" }}>
        <Building2 className="w-4 h-4" />
        Belum ada bisnis
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="w-4 h-4 flex-shrink-0" style={{ color: "var(--v1-accent)" }} />
      <select
        value={activeBusinessId}
        onChange={(e) => switchBusiness(e.target.value)}
        className="px-3 py-1.5 text-[13px] font-semibold rounded-lg focus:outline-none transition-colors cursor-pointer max-w-[200px] sm:max-w-[280px] truncate"
        style={{
          color: "var(--v1-ink)",
          background: "var(--v1-surface-raised)",
          border: "1px solid var(--v1-border)",
        }}
      >
        {businesses.map((b) => (
          <option key={b.bisnis_id} value={b.bisnis_id}>
            {b.name || b.bisnis_id}
          </option>
        ))}
      </select>
      {activeRole && (
        <span
          className="hidden sm:inline text-[10px] font-semibold uppercase tracking-wide flex-shrink-0"
          style={{ color: "var(--v1-accent-dim)" }}
        >
          {activeRole}
        </span>
      )}
    </div>
  );
}
