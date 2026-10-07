"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { UserCog, RefreshCw, Phone } from "lucide-react";
import { useBusiness } from "../../../v1/lib/BusinessContext";
import { MENU } from "../../../v1/lib/menu";
import { getApiErrorMessage } from "../../../v1/lib/api";
import { driverList, type Driver } from "../../../v1/lib/client";
import { MSearch, MEmpty } from "../../_ui";

export default function MobileDriverPage() {
  const { can } = useBusiness();
  const allowed = can(MENU.driver);
  const [rows, setRows] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    if (!allowed) {
      setLoading(false);
      setError("Akun ini tidak punya akses ke menu Supir.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await driverList();
    if (res.status === 1 && Array.isArray(res.data)) setRows(res.data);
    else setError(getApiErrorMessage(res, "Gagal memuat supir."));
    setLoading(false);
  }, [allowed]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((d) => [d.name, d.phone, d.email].some((x) => (x || "").toLowerCase().includes(q)));
  }, [rows, query]);

  return (
    <>
      <MSearch value={query} onChange={setQuery} placeholder="Cari nama atau telepon..." />
      {error && <div className="m-error">{error}</div>}

      <div className="m-row-between">
        <span className="m-faint" style={{ fontSize: 12 }}>{filtered.length} supir</span>
        <button type="button" className="m-iconbtn" aria-label="Muat ulang" onClick={load}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && rows.length === 0 ? (
        <div className="m-list">{[0, 1, 2].map((i) => <div key={i} className="m-list-item"><div className="animate-pulse" style={{ width: 36, height: 36, background: "var(--v1-border)" }} /><div className="animate-pulse" style={{ flex: 1, height: 14, background: "var(--v1-border)" }} /></div>)}</div>
      ) : filtered.length === 0 ? (
        <MEmpty text={error ? "Tidak bisa memuat data." : "Belum ada supir."} />
      ) : (
        <div className="m-list">
          {filtered.map((d) => (
            <div key={d.driver_id} className="m-list-item">
              <span className="flex items-center justify-center shrink-0" style={{ width: 36, height: 36, background: "var(--v1-accent-light)", color: "var(--v1-accent-dim)" }}>
                <UserCog className="w-[18px] h-[18px]" />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{d.name || "-"}</p>
                <p className="m-faint" style={{ fontSize: 11 }}>
                  {[d.license_no, d.license_exp].filter(Boolean).join(" · ") || "-"}
                </p>
              </div>
              {d.phone && (
                <a href={`tel:${d.phone}`} className="m-iconbtn" aria-label="Telepon" style={{ color: "var(--v1-accent-dim)" }}>
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
