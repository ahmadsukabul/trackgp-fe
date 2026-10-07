"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MapPin, RefreshCw, Circle, Hexagon } from "lucide-react";
import { useBusiness } from "../../../v1/lib/BusinessContext";
import { MENU } from "../../../v1/lib/menu";
import { getApiErrorMessage } from "../../../v1/lib/api";
import { geofenceList, geofenceEvents, type Geofence, type GPSEvent } from "../../../v1/lib/client";
import { formatDateTimeSec } from "@/lib/format-date";
import { MSearch, MEmpty } from "../../_ui";

export default function MobileGeofencePage() {
  const { can } = useBusiness();
  const allowed = can(MENU.geofence);
  const [rows, setRows] = useState<Geofence[]>([]);
  const [events, setEvents] = useState<GPSEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"area" | "log">("area");

  const load = useCallback(async () => {
    if (!allowed) {
      setLoading(false);
      setError("Akun ini tidak punya akses ke menu Geofence.");
      return;
    }
    setLoading(true);
    setError("");
    const [gRes, eRes] = await Promise.all([geofenceList(), geofenceEvents({ limit: 30 })]);
    if (gRes.status === 1 && Array.isArray(gRes.data)) setRows(gRes.data);
    else setError(getApiErrorMessage(gRes, "Gagal memuat geofence."));
    if (eRes.status === 1 && Array.isArray(eRes.data)) setEvents(eRes.data);
    setLoading(false);
  }, [allowed]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((g) => (g.name || "").toLowerCase().includes(q));
  }, [rows, query]);

  return (
    <>
      <div className="m-row" style={{ gap: 8 }}>
        <button
          type="button"
          className="m-btn"
          style={{ flex: 1, background: tab === "area" ? "var(--v1-ink)" : "var(--v1-surface)", color: tab === "area" ? "#fff" : "var(--v1-ink)" }}
          onClick={() => setTab("area")}
        >
          Area ({rows.length})
        </button>
        <button
          type="button"
          className="m-btn"
          style={{ flex: 1, background: tab === "log" ? "var(--v1-ink)" : "var(--v1-surface)", color: tab === "log" ? "#fff" : "var(--v1-ink)" }}
          onClick={() => setTab("log")}
        >
          Log ({events.length})
        </button>
      </div>

      {error && <div className="m-error">{error}</div>}

      {tab === "area" && (
        <>
          <MSearch value={query} onChange={setQuery} placeholder="Cari nama area..." />
          <div className="m-row-between">
            <span className="m-faint" style={{ fontSize: 12 }}>{filtered.length} area</span>
            <button type="button" className="m-iconbtn" aria-label="Muat ulang" onClick={load}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          {filtered.length === 0 ? (
            <MEmpty text="Belum ada area geofence." />
          ) : (
            <div className="m-list">
              {filtered.map((g) => (
                <div key={g.geofence_id} className="m-list-item">
                  <span className="flex items-center justify-center shrink-0" style={{ width: 36, height: 36, background: "var(--v1-surface-raised)", color: g.color || "var(--v1-accent-dim)" }}>
                    {g.area_type === "polygon" ? <Hexagon className="w-[18px] h-[18px]" /> : <Circle className="w-[18px] h-[18px]" />}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>{g.name || "-"}</p>
                    <p className="m-faint" style={{ fontSize: 11 }}>
                      {g.area_type === "polygon" ? "Poligon" : `Radius ${g.radius} m`}
                      {g.description ? ` · ${g.description}` : ""}
                    </p>
                  </div>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      background: g.status ? "var(--v1-success)" : "var(--v1-ink-faint)",
                    }}
                    title={g.status ? "aktif" : "nonaktif"}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "log" && (
        <>
          <div className="m-row-between">
            <span className="m-faint" style={{ fontSize: 12 }}>{events.length} event terbaru</span>
            <button type="button" className="m-iconbtn" aria-label="Muat ulang" onClick={load}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          {events.length === 0 ? (
            <MEmpty text="Belum ada event geofence." />
          ) : (
            <div className="m-list">
              {events.map((ev) => (
                <div key={ev.event_id} className="m-list-item" style={{ alignItems: "flex-start" }}>
                  <span className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, background: "var(--v1-surface-raised)", color: "var(--v1-ink-muted)" }}>
                    <MapPin className="w-4 h-4" />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{ev.message || ev.event_type}</p>
                    <p className="m-faint" style={{ fontSize: 11 }}>{formatDateTimeSec(ev.event_time || ev.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
