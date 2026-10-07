"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Car, RefreshCw } from "lucide-react";
import { useBusiness } from "../../../v1/lib/BusinessContext";
import { MENU } from "../../../v1/lib/menu";
import { getApiErrorMessage } from "../../../v1/lib/api";
import { vehicleList, type Vehicle } from "../../../v1/lib/client";
import { MSearch, MEmpty } from "../../_ui";

export default function MobileVehiclePage() {
  const { can } = useBusiness();
  const allowed = can(MENU.vehicle);
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    if (!allowed) {
      setLoading(false);
      setError("Akun ini tidak punya akses ke menu Kendaraan.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await vehicleList();
    if (res.status === 1 && Array.isArray(res.data)) setRows(res.data);
    else setError(getApiErrorMessage(res, "Gagal memuat kendaraan."));
    setLoading(false);
  }, [allowed]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((v) =>
      [v.name, v.license_plate, v.brand, v.model].some((x) => (x || "").toLowerCase().includes(q)),
    );
  }, [rows, query]);

  return (
    <>
      <MSearch value={query} onChange={setQuery} placeholder="Cari nama atau plat..." />
      {error && <div className="m-error">{error}</div>}

      <div className="m-row-between">
        <span className="m-faint" style={{ fontSize: 12 }}>{filtered.length} kendaraan</span>
        <button type="button" className="m-iconbtn" aria-label="Muat ulang" onClick={load}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && rows.length === 0 ? (
        <div className="m-list">{[0, 1, 2].map((i) => <div key={i} className="m-list-item"><div className="animate-pulse" style={{ width: 36, height: 36, background: "var(--v1-border)" }} /><div className="animate-pulse" style={{ flex: 1, height: 14, background: "var(--v1-border)" }} /></div>)}</div>
      ) : filtered.length === 0 ? (
        <MEmpty text={error ? "Tidak bisa memuat data." : "Belum ada kendaraan."} />
      ) : (
        <div className="m-list">
          {filtered.map((v) => (
            <div key={v.vehicle_id} className="m-list-item">
              <span className="flex items-center justify-center shrink-0" style={{ width: 36, height: 36, background: "var(--v1-accent-light)", color: "var(--v1-accent-dim)" }}>
                <Car className="w-[18px] h-[18px]" />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{v.name || "-"}</p>
                <p className="m-faint" style={{ fontSize: 11 }}>
                  {[v.license_plate, v.vehicle_type, v.brand].filter(Boolean).join(" · ") || "-"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
