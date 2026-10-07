"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { useBusiness } from "../../../v1/lib/BusinessContext";
import { MENU, ALL_MENU_KEYS, MENU_LABELS } from "../../../v1/lib/menu";
import { getApiErrorMessage } from "../../../v1/lib/api";
import { bisnisDetail, type Bisnis } from "../../../v1/lib/client";

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="m-row-between" style={{ padding: "11px 0", borderBottom: "1px solid var(--v1-border-subtle)" }}>
      <span className="m-faint" style={{ fontSize: 12 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, textAlign: "right", maxWidth: "62%" }}>{value || "-"}</span>
    </div>
  );
}

export default function MobilePengaturanPage() {
  const { can, isOwner, menuKeys } = useBusiness();
  const allowed = can(MENU.bisnis);
  const [data, setData] = useState<Bisnis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!allowed) {
      setLoading(false);
      setError("Akun ini tidak punya akses ke menu Profil Bisnis.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await bisnisDetail();
    if (res.status === 1 && res.data) setData(res.data);
    else setError(getApiErrorMessage(res, "Gagal memuat profil bisnis."));
    setLoading(false);
  }, [allowed]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      {error && <div className="m-error">{error}</div>}

      <div className="m-card m-card-pad">
        <p className="m-row m-section-title" style={{ gap: 8 }}>
          <Building2 className="w-4 h-4" style={{ color: "var(--v1-accent)" }} /> Identitas bisnis
        </p>
        {loading ? (
          <div className="animate-pulse" style={{ height: 120, background: "var(--v1-border)" }} />
        ) : (
          <>
            <Row label="Nama" value={data?.name} />
            <Row label="ID" value={data?.bisnis_id} />
            <Row label="Email" value={data?.email} />
            <Row label="Telepon" value={data?.phone} />
            <Row label="Alamat" value={data?.address} />
            <Row label="Status" value={data?.status === 1 ? "Aktif" : "Nonaktif"} />
          </>
        )}
      </div>

      <div className="m-card m-card-pad">
        <p className="m-section-title">Akses Anda di bisnis ini</p>
        <p className="m-faint" style={{ fontSize: 12, marginBottom: 10 }}>
          {isOwner ? "Sebagai owner, seluruh menu tersedia." : "Ditentukan oleh role granular Anda."}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {ALL_MENU_KEYS.map((key) => {
            const has = isOwner || menuKeys.includes(key);
            return (
              <span
                key={key}
                style={{
                  padding: "3px 9px",
                  fontSize: 12,
                  fontWeight: 500,
                  background: has ? "var(--v1-accent-light)" : "var(--v1-surface-raised)",
                  color: has ? "var(--v1-accent-dim)" : "var(--v1-ink-faint)",
                  textDecoration: has ? "none" : "line-through",
                }}
              >
                {MENU_LABELS[key]}
              </span>
            );
          })}
        </div>
      </div>
    </>
  );
}
