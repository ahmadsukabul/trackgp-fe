"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, RefreshCw, Radio } from "lucide-react";
import { useBusiness } from "../../../v1/lib/BusinessContext";
import { MENU } from "../../../v1/lib/menu";
import { getApiErrorMessage } from "../../../v1/lib/api";
import { deviceList, type Device } from "../../../v1/lib/client";
import { formatDateTimeSec, formatRelative } from "@/lib/format-date";
import { expiryDaysLeft, expiryStatus } from "@/lib/expiry";
import { MStatus, MSearch, MEmpty } from "../../_ui";

function expiryLabel(d?: string) {
  const days = expiryDaysLeft(d);
  if (days === null) return "";
  if (days === 0) return "berakhir hari ini";
  return days > 0 ? `${days} hari lagi` : `${Math.abs(days)} hari lalu`;
}

export default function MobileGpsPage() {
  const { can } = useBusiness();
  const allowed = can(MENU.gps);
  const [rows, setRows] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    if (!allowed) {
      setLoading(false);
      setError("Akun ini tidak punya akses ke menu GPS.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await deviceList();
    if (res.status === 1 && Array.isArray(res.data)) setRows(res.data);
    else setError(getApiErrorMessage(res, "Gagal memuat perangkat."));
    setLoading(false);
  }, [allowed]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((d) =>
      [d.name, d.device_id, d.unique_id].some((v) => (v || "").toLowerCase().includes(q)),
    );
  }, [rows, query]);

  return (
    <>
      <MSearch value={query} onChange={setQuery} placeholder="Cari nama, ID, atau IMEI..." />

      {error && <div className="m-error">{error}</div>}

      <div className="m-row-between">
        <span className="m-faint" style={{ fontSize: 12 }}>{filtered.length} perangkat</span>
        <button type="button" className="m-iconbtn" aria-label="Muat ulang" onClick={load}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && rows.length === 0 ? (
        <div className="m-list">
          {[0, 1, 2].map((i) => (
            <div key={i} className="m-list-item">
              <div className="animate-pulse" style={{ width: 34, height: 34, background: "var(--v1-border)" }} />
              <div className="animate-pulse" style={{ flex: 1, height: 14, background: "var(--v1-border)" }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <MEmpty text={error ? "Tidak bisa memuat data." : "Belum ada perangkat."} />
      ) : (
        <div className="m-list">
          {filtered.map((d) => {
            const st = expiryStatus(d.expired_at);
            return (
              <Link key={d.device_id} href={`/mobile/gps/${encodeURIComponent(d.device_id)}`} className="m-list-item">
                <span
                  className="flex items-center justify-center shrink-0"
                  style={{ width: 36, height: 36, background: "var(--v1-accent-light)", color: "var(--v1-accent-dim)" }}
                >
                  <Radio className="w-[18px] h-[18px]" />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {d.name || d.device_id}
                  </p>
                  <p className="m-faint" style={{ fontSize: 11, fontFamily: "var(--v1-font-display)" }}>
                    {d.unique_id || d.device_id}
                  </p>
                  {d.last_seen_at && (
                    <p className="m-faint" style={{ fontSize: 11 }}>
                      {formatDateTimeSec(d.last_seen_at)} · {formatRelative(d.last_seen_at)}
                    </p>
                  )}
                  {d.expired_at && (
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: st === "blocked" ? "var(--v1-danger)" : st === "soon" || st === "grace" ? "var(--v1-warning)" : "var(--v1-ink-faint)",
                      }}
                    >
                      Berakhir {expiryLabel(d.expired_at)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <MStatus value={d.status} />
                  <ChevronRight className="w-4 h-4" style={{ color: "var(--v1-ink-faint)" }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
