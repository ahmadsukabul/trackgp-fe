"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { useBusiness } from "../lib/BusinessContext";
import { MENU } from "../lib/menu";
import { ALL_MENU_KEYS, MENU_LABELS } from "../lib/menu";
import { getApiErrorMessage } from "../lib/api";
import { bisnisDetail, type Bisnis } from "../lib/client";

export default function PengaturanPage() {
  const { can, isOwner, menuKeys } = useBusiness();
  const allowed = can(MENU.bisnis);

  const [data, setData] = useState<Bisnis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    const res = await bisnisDetail();
    if (res.status === 1 && res.data) {
      setData(res.data);
    } else {
      setError(getApiErrorMessage(res, "Gagal memuat profil bisnis."));
    }
    setLoading(false);
  }, [allowed]);

  useEffect(() => {
    load();
  }, [load]);

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl text-[13px] disabled:opacity-60 cursor-default";
  const inputStyle = {
    background: "var(--v1-surface-raised)",
    border: "1px solid var(--v1-border)",
    color: "var(--v1-ink)",
  };
  const labelCls = "block mb-1.5 text-[12px] font-semibold";
  const labelStyle = {
    color: "var(--v1-ink-muted)",
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-6 w-48 rounded animate-pulse" style={{ background: "var(--v1-border)" }} />
        <div className="h-64 rounded-2xl animate-pulse" style={{ background: "var(--v1-border)" }} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--v1-ink)" }}>
          Profil Bisnis
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: "var(--v1-ink-faint)" }}>
          Data bisnis aktif
          {data?.bisnis_id ? <span className="font-mono ml-1" style={{ color: "var(--v1-ink-faint)", fontFamily: "var(--v1-font-display)" }}>· {data.bisnis_id}</span> : null}
        </p>
      </div>

      {!allowed ? (
        <div className="px-4 py-3 rounded-xl text-[13px] font-medium" style={{ background: "var(--v1-danger-bg)", border: "1px solid var(--v1-danger-border)", color: "var(--v1-danger)" }}>
          Akun ini tidak punya akses ke menu Profil Bisnis.
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-[13px] font-medium" style={{ background: "var(--v1-danger-bg)", border: "1px solid var(--v1-danger-border)", color: "var(--v1-danger)" }}>
              {error}
            </div>
          )}

          <div className="rounded-2xl p-6 space-y-4" style={{ background: "var(--v1-surface)", border: "1px solid var(--v1-border)" }}>
            <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid var(--v1-border-subtle)" }}>
              <Building2 className="w-4 h-4" style={{ color: "var(--v1-accent)" }} />
              <h2 className="text-[14px] font-bold" style={{ color: "var(--v1-ink)" }}>Identitas</h2>
            </div>

            <div>
              <label className={labelCls} style={labelStyle}>Nama bisnis</label>
              <input value={data?.name ?? ""} disabled className={inputCls} style={inputStyle} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls} style={labelStyle}>Email</label>
                <input value={data?.email ?? ""} disabled className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Telepon</label>
                <input value={data?.phone ?? ""} disabled className={inputCls} style={inputStyle} />
              </div>
            </div>

            <div>
              <label className={labelCls} style={labelStyle}>Alamat</label>
              <textarea
                rows={3}
                value={data?.address ?? ""}
                disabled
                className={`${inputCls} resize-none`}
                style={inputStyle}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2" style={{ borderTop: "1px solid var(--v1-border-subtle)" }}>
              <div>
                <label className={labelCls} style={labelStyle}>Batas perangkat GPS</label>
                <input
                  value={data?.device_limit ? String(data.device_limit) : "0"}
                  disabled
                  className={inputCls}
                  style={inputStyle}
                />
                <p className="mt-1 text-[11px]" style={{ color: "var(--v1-ink-faint)" }}>0 = tanpa batas.</p>
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Status bisnis</label>
                <input
                  value={data?.status === 1 ? "Aktif" : `Nonaktif${data?.expired_at ? ` · ${data.expired_at}` : ""}`}
                  disabled
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Akses efektif di bisnis ini */}
          <div className="mt-6 rounded-2xl p-6" style={{ background: "var(--v1-surface)", border: "1px solid var(--v1-border)" }}>
            <h2 className="text-[14px] font-bold mb-1" style={{ color: "var(--v1-ink)" }}>
              Akses Anda di bisnis ini
            </h2>
            <p className="text-[12px] mb-4" style={{ color: "var(--v1-ink-faint)" }}>
              {isOwner
                ? "Sebagai owner, seluruh menu tersedia."
                : "Ditentukan oleh role granular yang melekat pada keanggotaan Anda."}
            </p>
            <div className="flex flex-wrap gap-2">
              {ALL_MENU_KEYS.map((key) => {
                const has = isOwner || menuKeys.includes(key);
                return (
                  <span
                    key={key}
                    className="px-2.5 py-1 rounded-lg text-[12px] font-medium"
                    style={
                      has
                        ? { background: "var(--v1-accent-light)", color: "var(--v1-accent)" }
                        : { background: "var(--v1-surface-raised)", color: "var(--v1-ink-faint)", textDecoration: "line-through" }
                    }
                  >
                    {MENU_LABELS[key]}
                  </span>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
