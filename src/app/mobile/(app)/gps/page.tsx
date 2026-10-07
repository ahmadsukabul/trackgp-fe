"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ChevronRight, RefreshCw, Radio, Search, SlidersHorizontal, X } from "lucide-react";
import { useBusiness } from "../../../v1/lib/BusinessContext";
import { MENU } from "../../../v1/lib/menu";
import { getApiErrorMessage } from "../../../v1/lib/api";
import {
  deviceList,
  devicePositions,
  type Device,
  type DevicePosition,
} from "../../../v1/lib/client";
import { formatDateTimeSec, formatRelative } from "@/lib/format-date";
import { expiryDaysLeft, expiryStatus } from "@/lib/expiry";
import { MStatus } from "../../_ui";
import MapDrawer from "../../_shell/map-drawer";
import { classifyDevice, hasValidCoord, FLEET_COLOR, FLEET_LABEL, type Fleet } from "../../_lib/fleet";
import type { MapMarker } from "../../../v1/components/MapCanvas";

const MapView = dynamic(() => import("../../../v1/components/MapCanvas"), {
  ssr: false,
  loading: () => null,
});

const REFRESH_MS = 60_000;

type Filter = "all" | Fleet;

function expiryLabel(d?: string) {
  const days = expiryDaysLeft(d);
  if (days === null) return "";
  if (days === 0) return "berakhir hari ini";
  return days > 0 ? `${days} hari lagi` : `${Math.abs(days)} hari lalu`;
}

export default function MobileGpsPage() {
  const { can, activeBusinessId } = useBusiness();
  const allowed = can(MENU.gps);

  const [rows, setRows] = useState<Device[]>([]);
  const [points, setPoints] = useState<DevicePosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [ready, setReady] = useState(false);
  const [updatedAt, setUpdatedAt] = useState("");

  const load = useCallback(async () => {
    if (!allowed) {
      setLoading(false);
      setError("Akun ini tidak punya akses ke menu GPS.");
      return;
    }
    setError("");
    const [listRes, posRes] = await Promise.all([deviceList(), devicePositions()]);
    if (listRes.status === 1 && Array.isArray(listRes.data)) setRows(listRes.data);
    else setError(getApiErrorMessage(listRes, "Gagal memuat perangkat."));
    if (posRes.status === 1 && Array.isArray(posRes.data)) setPoints(posRes.data);
    setUpdatedAt(new Date().toISOString());
    setLoading(false);
  }, [allowed]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!allowed || !activeBusinessId) return;
    const t = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(t);
  }, [allowed, activeBusinessId, load]);

  const posById = useMemo(() => {
    const m = new Map<string, DevicePosition>();
    for (const p of points) m.set(p.device_id, p);
    return m;
  }, [points]);

  const markers = useMemo<MapMarker[]>(
    () =>
      points
        .filter(hasValidCoord)
        .map((p) => ({
          id: p.device_id,
          name: p.name || p.device_id,
          latitude: p.latitude,
          longitude: p.longitude,
          status: p.status,
          ignition: p.ignition,
          speed: p.speed,
          lastSeen: p.device_time || p.last_seen_at,
        })),
    [points],
  );

  const fleetCount = useMemo(() => {
    const c: Record<Fleet, number> = { online: 0, parkir: 0, offline: 0 };
    for (const p of points) if (hasValidCoord(p)) c[classifyDevice(p)] += 1;
    return c;
  }, [points]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((d) => {
      if (q) {
        const hit = [d.name, d.device_id, d.unique_id].some((v) =>
          (v || "").toLowerCase().includes(q),
        );
        if (!hit) return false;
      }
      if (filter !== "all") {
        const p = posById.get(d.device_id);
        if (!p || classifyDevice(p) !== filter) return false;
      }
      return true;
    });
  }, [rows, query, filter, posById]);

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "Semua", count: rows.length },
    { key: "online", label: "Online", count: fleetCount.online },
    { key: "parkir", label: "Parkir", count: fleetCount.parkir },
    { key: "offline", label: "Offline", count: fleetCount.offline },
  ];

  return (
    <>
      {/* Peta full-screen */}
      <div className="m-map-page">
        <div className={`m-map-canvas${ready ? " is-ready" : ""}`}>
          <MapView
            markers={markers}
            height="100%"
            className="h-full"
            rounded={false}
            showLegend={false}
            showControls={false}
            onLoad={() => setReady(true)}
          />
        </div>

        <div className={`m-map-skeleton${ready ? " is-hidden" : ""}`} aria-hidden={ready}>
          <span className="m-live-dot" style={{ background: "var(--v1-accent)" }} />
          Memuat peta…
        </div>

        <div className="m-map-topbar">
          <div className="m-map-search">
            <Search className="w-4 h-4" style={{ color: "var(--v1-ink-faint)" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari perangkat…"
              aria-label="Cari perangkat"
            />
            {query && (
              <button type="button" className="m-iconbtn" style={{ width: 28, height: 28 }} aria-label="Bersihkan" onClick={() => setQuery("")}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Drawer aksi & daftar perangkat */}
      <MapDrawer
        head={
          <div style={{ padding: "4px 20px 12px" }}>
            <div className="m-row-between">
              <div>
                <h2 className="m-sheet-title">Perangkat</h2>
                <p className="m-faint" style={{ fontSize: 12, marginTop: 3 }}>
                  {fleetCount.online} online · {fleetCount.parkir} parkir · {fleetCount.offline} offline
                </p>
              </div>
              <button type="button" className="m-iconbtn" aria-label="Muat ulang" onClick={load}>
                <RefreshCw className={`w-[18px] h-[18px] ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="m-chip-row" style={{ marginTop: 12 }}>
              {filters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={`m-chip${filter === f.key ? " is-active" : ""}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.key !== "all" && (
                    <span
                      className="m-hero-dot"
                      style={{ width: 7, height: 7, background: FLEET_COLOR[f.key as Fleet] }}
                    />
                  )}
                  {f.label}
                  <span style={{ opacity: 0.6 }}>{f.count}</span>
                </button>
              ))}
            </div>

            {updatedAt && (
              <p className="m-faint" style={{ fontSize: 11, marginTop: 8 }}>
                Diperbarui {formatRelative(updatedAt)}
              </p>
            )}
          </div>
        }
      >
        {error && <div className="m-error" style={{ margin: "4px 4px 12px" }}>{error}</div>}

        {loading && rows.length === 0 ? (
          <div className="m-list">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="m-list-item">
                <span className="m-skel" style={{ width: 40, height: 40, borderRadius: 999 }} />
                <span style={{ flex: 1 }}>
                  <span className="m-skel" style={{ display: "block", width: "55%", height: 14 }} />
                  <span className="m-skel" style={{ display: "block", width: "35%", height: 11, marginTop: 6 }} />
                </span>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="m-empty" style={{ margin: "4px" }}>
            <SlidersHorizontal className="w-6 h-6" />
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--v1-ink-muted)" }}>
              {query || filter !== "all" ? "Tidak ada perangkat yang cocok." : "Belum ada perangkat."}
            </p>
          </div>
        ) : (
          <div className="m-list">
            {filtered.map((d) => {
              const st = expiryStatus(d.expired_at);
              const p = posById.get(d.device_id);
              const k = p ? classifyDevice(p) : null;
              return (
                <Link
                  key={d.device_id}
                  href={`/mobile/gps/${encodeURIComponent(d.device_id)}`}
                  className="m-list-item"
                >
                  <span
                    className="m-list-ico"
                    style={k ? { background: `${FLEET_COLOR[k]}1f`, color: FLEET_COLOR[k] } : undefined}
                  >
                    <Radio className="w-[18px] h-[18px]" />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {d.name || d.device_id}
                    </span>
                    <span className="m-faint" style={{ display: "block", fontSize: 11 }}>
                      {d.unique_id || d.device_id}
                    </span>
                    {(d.last_seen_at || p?.device_time) && (
                      <span className="m-faint" style={{ display: "block", fontSize: 11 }}>
                        {formatDateTimeSec(d.last_seen_at || p?.device_time || "")} ·{" "}
                        {formatRelative(d.last_seen_at || p?.device_time || "")}
                      </span>
                    )}
                    {d.expired_at && (
                      <span
                        style={{
                          display: "block",
                          fontSize: 11,
                          fontWeight: 600,
                          color:
                            st === "blocked"
                              ? "var(--v1-danger)"
                              : st === "soon" || st === "grace"
                                ? "var(--v1-warning)"
                                : "var(--v1-ink-faint)",
                        }}
                      >
                        Berakhir {expiryLabel(d.expired_at)}
                      </span>
                    )}
                  </span>
                  <span className="flex flex-col items-end gap-1 shrink-0">
                    <MStatus value={p?.status || d.status} />
                    <ChevronRight className="w-4 h-4" style={{ color: "var(--v1-ink-faint)" }} />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </MapDrawer>
    </>
  );
}
