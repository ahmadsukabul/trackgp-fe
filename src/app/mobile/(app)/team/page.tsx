"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Users, Shield } from "lucide-react";
import { useBusiness } from "../../../v1/lib/BusinessContext";
import { MENU } from "../../../v1/lib/menu";
import { getApiErrorMessage } from "../../../v1/lib/api";
import { memberList, roleList, type Member, type Role } from "../../../v1/lib/client";
import { MEmpty } from "../../_ui";

export default function MobileTeamPage() {
  const { can } = useBusiness();
  const allowed = can(MENU.team);
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"member" | "role">("member");

  const load = useCallback(async () => {
    if (!allowed) {
      setLoading(false);
      setError("Akun ini tidak punya akses ke menu Tim.");
      return;
    }
    setLoading(true);
    setError("");
    const [mRes, rRes] = await Promise.all([memberList(), roleList()]);
    if (mRes.status === 1 && Array.isArray(mRes.data)) setMembers(mRes.data);
    else setError(getApiErrorMessage(mRes, "Gagal memuat anggota."));
    if (rRes.status === 1 && Array.isArray(rRes.data)) setRoles(rRes.data);
    setLoading(false);
  }, [allowed]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <div className="m-row" style={{ gap: 8 }}>
        <button
          type="button"
          className="m-btn"
          style={{ flex: 1, background: tab === "member" ? "var(--v1-ink)" : "var(--v1-surface)", color: tab === "member" ? "#fff" : "var(--v1-ink)" }}
          onClick={() => setTab("member")}
        >
          Anggota ({members.length})
        </button>
        <button
          type="button"
          className="m-btn"
          style={{ flex: 1, background: tab === "role" ? "var(--v1-ink)" : "var(--v1-surface)", color: tab === "role" ? "#fff" : "var(--v1-ink)" }}
          onClick={() => setTab("role")}
        >
          Role ({roles.length})
        </button>
      </div>

      {error && <div className="m-error">{error}</div>}

      <div className="m-row-between">
        <span className="m-faint" style={{ fontSize: 12 }}>{tab === "member" ? "Daftar anggota" : "Role granular"}</span>
        <button type="button" className="m-iconbtn" aria-label="Muat ulang" onClick={load}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {tab === "member" &&
        (members.length === 0 ? (
          <MEmpty text="Belum ada anggota." />
        ) : (
          <div className="m-list">
            {members.map((m) => (
              <div key={m.bu_id} className="m-list-item">
                <span className="flex items-center justify-center shrink-0" style={{ width: 36, height: 36, background: "var(--v1-accent-light)", color: "var(--v1-accent-dim)", fontWeight: 700 }}>
                  {(m.name || "U").charAt(0).toUpperCase()}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>{m.name || "-"}</p>
                  <p className="m-faint" style={{ fontSize: 11 }}>{m.email || m.phone || "-"}</p>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: m.role === "owner" ? "var(--v1-accent-dim)" : "var(--v1-ink-faint)" }}>
                  {m.role === "owner" ? "Owner" : m.role_name || "Tim"}
                </span>
              </div>
            ))}
          </div>
        ))}

      {tab === "role" &&
        (roles.length === 0 ? (
          <MEmpty text="Belum ada role." />
        ) : (
          <div className="m-list">
            {roles.map((r) => (
              <div key={r.role_id} className="m-list-item" style={{ alignItems: "flex-start" }}>
                <span className="flex items-center justify-center shrink-0" style={{ width: 36, height: 36, background: "var(--v1-surface-raised)", color: "var(--v1-ink-muted)" }}>
                  <Shield className="w-[18px] h-[18px]" />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</p>
                  <p className="m-faint" style={{ fontSize: 11 }}>{r.description || "-"}</p>
                  <p className="m-faint" style={{ fontSize: 11 }}>{r.menu_keys?.length ?? 0} menu · {r.member_count ?? 0} anggota</p>
                </div>
              </div>
            ))}
          </div>
        ))}
    </>
  );
}
