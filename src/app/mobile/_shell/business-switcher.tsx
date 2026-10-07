"use client";

import { useState } from "react";
import { Building2, ChevronsUpDown, Check } from "lucide-react";
import { useBusiness } from "../../v1/lib/BusinessContext";
import BottomSheet from "./bottom-sheet";

/**
 * MobileBusinessSwitcher — pengganti <select> v1.
 * Chip ringkas di app bar; bila bisnis > 1, membuka bottom sheet daftar bisnis.
 */
export default function MobileBusinessSwitcher() {
  const { businesses, activeBusiness, activeBusinessId, switchBusiness, loading } = useBusiness();
  const [open, setOpen] = useState(false);

  if (loading) {
    return <span className="m-skel" style={{ width: 120, height: 32, borderRadius: 999 }} />;
  }
  if (businesses.length === 0) return null;

  const multi = businesses.length > 1;

  return (
    <>
      <button
        type="button"
        className="m-chip"
        onClick={() => multi && setOpen(true)}
        style={{ maxWidth: 190, cursor: multi ? "pointer" : "default" }}
        aria-label={multi ? "Ganti bisnis" : "Bisnis aktif"}
      >
        <Building2 className="w-3.5 h-3.5 shrink-0" />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {activeBusiness?.name ?? "Bisnis"}
        </span>
        {multi && <ChevronsUpDown className="w-3.5 h-3.5 shrink-0" />}
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Pilih bisnis">
        <div className="m-list" style={{ boxShadow: "none" }}>
          {businesses.map((b) => {
            const active = b.bisnis_id === activeBusinessId;
            return (
              <button
                key={b.bisnis_id}
                type="button"
                className="m-list-item"
                style={{ width: "100%", background: "none", border: "none", textAlign: "left", cursor: "pointer", font: "inherit" }}
                onClick={() => {
                  switchBusiness(b.bisnis_id);
                  setOpen(false);
                }}
              >
                <span
                  className="m-list-ico"
                  style={
                    active
                      ? { background: "var(--v1-accent-light)", color: "var(--v1-accent-dim)" }
                      : undefined
                  }
                >
                  <Building2 className="w-[18px] h-[18px]" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>{b.name}</span>
                  <span className="m-faint" style={{ display: "block", fontSize: 11.5 }}>
                    {b.role === "owner" ? "Owner" : "Anggota"}
                    {b.role_name ? ` · ${b.role_name}` : ""}
                  </span>
                </span>
                {active && <Check className="w-4 h-4" style={{ color: "var(--v1-accent-dim)" }} />}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
}
