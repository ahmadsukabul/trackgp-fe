"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Radio,
  Car,
  UserCog,
  Users,
  Map,
  ReceiptText,
  ShieldAlert,
  RefreshCw,
  ChevronRight,
  BellRing,
  type LucideIcon,
} from "lucide-react";
import { useBusiness } from "../../v1/lib/BusinessContext";
import { MENU } from "../../v1/lib/menu";
import { getApiErrorMessage } from "../../v1/lib/api";
import {
  dashboardStats,
  devicePositions,
  geofenceEvents,
  type DashboardStats,
  type DevicePosition,
  type GPSEvent,
} from "../../v1/lib/client";
import { formatRelative, formatDateTimeSec } from "@/lib/format-date";
import MobileBusinessSwitcher from "../_shell/business-switcher";
import { classifyDevice, hasValidCoord, FLEET_COLOR, type Fleet } from "../_lib/fleet";

const REFRESH_MS = 60_000;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}

/** Style stagger untuk animasi masuk berurutan. */
function rise(i: number): React.CSSProperties {
  return { "--i": i } as React.CSSProperties;
}

export default function MobileHomePage() {
  const { can, activeBusiness, loading: bizLoading, activeBusinessId } = useBusiness();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [points, setPoints] = useState<DevicePosition[]>([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string>("");

  const [events, setEvents] = useState<GPSEvent[]>([]);

  const [name, setName] = useState("");

  useEffect(() => {
    setName(localStorage.getItem("user_name") || "");
  }, []);

  const canGps = can(MENU.gps);
  const canGeofence = can(MENU.geofence);

  const load = useCallback(async () => {
    if (bizLoading) return;
    if (!can(MENU.dashboard)) {
      setError("Akun ini tidak punya akses ke dashboard.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    const res = await dashboardStats();
    if (res.status === 1) setStats(res.data);
    else setError(getApiErrorMessage(res, "Gagal memuat statistik."));
    setLoading(false);
  }, [bizLoading, can]);

  useEffect(() => {
    load();
  }, [load]);

  const loadFleet = useCallback(async () => {
    if (!canGps) {
      setMapLoading(false);
      return;
    }
    const res = await devicePositions();
    if (res.status === 1 && Array.isArray(res.data)) setPoints(res.data);
    setUpdatedAt(new Date().toISOString());
    setMapLoading(false);
  }, [canGps]);

  useEffect(() => {
    if (!canGps || !activeBusinessId) return;
    setMapLoading(true);
    loadFleet();
    const t = window.setInterval(loadFleet, REFRESH_MS);
    return () => window.clearInterval(t);
  }, [canGps, activeBusinessId, loadFleet]);

  useEffect(() => {
    if (!canGeofence || !activeBusinessId) return;
    let alive = true;
    geofenceEvents({ limit: 4 }).then((res) => {
      if (alive && res.status === 1 && Array.isArray(res.data)) setEvents(res.data);
    });
    return () => {
      alive = false;
    };
  }, [canGeofence, activeBusinessId]);

  const valid = useMemo(
    () => points.filter(hasValidCoord),
    [points],
  );

  const fleet = useMemo(() => {
    const c = { online: 0, parkir: 0, offline: 0 };
    for (const p of valid) c[classifyDevice(p)] += 1;
    return c;
  }, [valid]);

  const totalDevices = stats?.total_devices ?? valid.length;
  const tracked = valid.length;
  const pct = tracked > 0 ? (fleet.online / tracked) * 100 : 0;

  const stats2 = [
    { label: "Perangkat", value: stats?.total_devices ?? 0, href: "/mobile/gps", icon: Radio, menu: MENU.gps },
    { label: "Kendaraan", value: stats?.total_vehicles ?? 0, href: "/mobile/vehicle", icon: Car, menu: MENU.vehicle },
    { label: "Supir", value: stats?.total_drivers ?? 0, href: "/mobile/driver", icon: UserCog, menu: MENU.driver },
    { label: "Anggota Tim", value: stats?.total_users ?? 0, href: "/mobile/team", icon: Users, menu: MENU.team },
  ].filter((s) => can(s.menu));

  const quick = [
    { label: "Peta", href: "/mobile/gps", icon: Map, menu: MENU.gps },
    { label: "Kendaraan", href: "/mobile/vehicle", icon: Car, menu: MENU.vehicle },
    { label: "Geofence", href: "/mobile/geofence", icon: ShieldAlert, menu: MENU.geofence },
    { label: "Langganan", href: "/mobile/invoice", icon: ReceiptText, menu: MENU.invoice },
  ].filter((q) => can(q.menu));

  const preview = useMemo(
    () => valid.slice(0, 4),
    [valid],
  );

  return (
    <>
      {/* Header: greeting + pemilih bisnis */}
      <header className="m-home-head m-rise" style={rise(0)}>
        <div style={{ minWidth: 0 }}>
          <h1 className="m-greeting">
            {greeting()}
            {name ? `, ${name.split(" ")[0]}` : ""}
          </h1>
          <p className="m-greeting-sub">
            <span className="m-live-dot" style={{ width: 6, height: 6 }} />
            {stats?.bisnis_name || activeBusiness?.name || "Bisnis aktif"}
            {(stats?.member_role || activeBusiness?.role) && (
              <> · {stats?.member_role === "owner" || activeBusiness?.role === "owner" ? "Owner" : "Anggota"}</>
            )}
          </p>
        </div>
        <MobileBusinessSwitcher />
      </header>

      {error && <div className="m-error m-rise" style={rise(1)}>{error}</div>}

      {/* Hero status armada */}
      {canGps && (
        <section className="m-hero m-rise" style={rise(1)} aria-label="Status armada">
          <div className="m-hero-top">
            <span className="m-hero-eyebrow">Status armada</span>
            <span className="m-live">
              <span className="m-live-dot" />
              Live
            </span>
          </div>

          <div className="m-hero-figure">
            {mapLoading && tracked === 0 ? (
              <span className="m-skel" style={{ width: 56, height: 46, background: "rgba(255,255,255,.14)" }} />
            ) : (
              <span className="m-hero-value">{fleet.online}</span>
            )}
            <span className="m-hero-of">dari {totalDevices} perangkat online</span>
          </div>

          <div className="m-hero-bar" aria-hidden="true">
            {tracked === 0 ? (
              <span className="m-hero-seg" style={{ flex: 1, background: "rgba(255,255,255,.14)" }} />
            ) : (
              (["online", "parkir", "offline"] as Fleet[]).map((k) =>
                fleet[k] > 0 ? (
                  <span
                    key={k}
                    className="m-hero-seg"
                    style={{ width: `${(fleet[k] / tracked) * 100}%`, background: FLEET_COLOR[k] }}
                  />
                ) : null,
              )
            )}
          </div>

          <div className="m-hero-legend">
            {(["online", "parkir", "offline"] as Fleet[]).map((k) => (
              <span key={k}>
                <span className="m-hero-dot" style={{ background: FLEET_COLOR[k] }} />
                {fleet[k]} {k}
              </span>
            ))}
          </div>

          <div className="m-hero-foot">
            <span>
              {updatedAt ? `Diperbarui ${formatRelative(updatedAt)}` : "Menyinkronkan…"}
              {pct > 0 ? ` · ${Math.round(pct)}% aktif` : ""}
            </span>
            <button type="button" className="m-hero-refresh" aria-label="Segarkan" onClick={loadFleet}>
              <RefreshCw className={`w-4 h-4 ${mapLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </section>
      )}

      {/* Aksi cepat */}
      {quick.length > 0 && (
        <section className="m-rise" style={rise(2)}>
          <p className="m-section-title">Aksi cepat</p>
          <div className="m-quick">
            {quick.map((q) => {
              const Icon = q.icon as LucideIcon;
              return (
                <Link key={q.href} href={q.href} className="m-quick-item">
                  <span className="m-quick-ico">
                    <Icon className="w-5 h-5" />
                  </span>
                  {q.label}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Ringkasan */}
      {stats2.length > 0 && (
        <section className="m-rise" style={rise(3)}>
          <p className="m-section-title">Ringkasan</p>
          <div className="m-stat-grid">
            {stats2.map((s) => {
              const Icon = s.icon;
              return (
                <Link key={s.href} href={s.href} className="m-stat">
                  <span className="m-stat-ico">
                    <Icon className="w-[19px] h-[19px]" />
                  </span>
                  {loading ? (
                    <span className="m-skel" style={{ width: 44, height: 28 }} />
                  ) : (
                    <span className="m-stat-value">{s.value}</span>
                  )}
                  <span className="m-stat-label">{s.label}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Preview perangkat */}
      {canGps && (
        <section className="m-rise" style={rise(4)}>
          <div className="m-row-between" style={{ marginBottom: 10 }}>
            <p className="m-section-title" style={{ margin: 0 }}>
              Perangkat
            </p>
            <Link href="/mobile/gps" className="m-row" style={{ gap: 2, fontSize: 13, fontWeight: 600, color: "var(--v1-accent-dim)", textDecoration: "none" }}>
              Lihat semua <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {mapLoading && preview.length === 0 ? (
            <div className="m-list">
              {[0, 1, 2].map((i) => (
                <div key={i} className="m-list-item">
                  <span className="m-skel" style={{ width: 40, height: 40, borderRadius: 999 }} />
                  <span style={{ flex: 1 }}>
                    <span className="m-skel" style={{ display: "block", width: "55%", height: 14 }} />
                    <span className="m-skel" style={{ display: "block", width: "35%", height: 11, marginTop: 6 }} />
                  </span>
                </div>
              ))}
            </div>
          ) : preview.length === 0 ? (
            <div className="m-empty">
              <Radio className="w-6 h-6" />
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--v1-ink-muted)" }}>
                Belum ada posisi perangkat.
              </p>
            </div>
          ) : (
            <div className="m-list">
              {preview.map((p) => {
                const k = classifyDevice(p);
                const when = p.device_time || p.last_seen_at;
                return (
                  <Link
                    key={p.device_id}
                    href={`/mobile/gps/${encodeURIComponent(p.device_id)}`}
                    className="m-list-item"
                  >
                    <span
                      className="m-avatar"
                      style={{ background: `${FLEET_COLOR[k]}22`, color: FLEET_COLOR[k] }}
                    >
                      <Radio className="w-[18px] h-[18px]" />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name || p.device_id}
                      </span>
                      <span className="m-faint" style={{ display: "block", fontSize: 11.5 }}>
                        {k} · {when ? formatRelative(when) : "belum ada data"}
                      </span>
                    </span>
                    <ChevronRight className="w-4 h-4" style={{ color: "var(--v1-ink-faint)" }} />
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Peringatan */}
      {canGeofence && events.length > 0 && (
        <section className="m-rise" style={rise(5)}>
          <p className="m-section-title">Peringatan</p>
          <div className="m-list">
            {events.map((ev) => (
              <div key={ev.event_id} className="m-list-item" style={{ alignItems: "flex-start" }}>
                <span className="m-list-ico" style={{ background: "var(--v1-warning-bg)", color: "var(--v1-warning)" }}>
                  <BellRing className="w-[18px] h-[18px]" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13.5, fontWeight: 600 }}>
                    {ev.message || ev.event_type}
                  </span>
                  <span className="m-faint" style={{ display: "block", fontSize: 11.5 }}>
                    {formatDateTimeSec(ev.event_time || ev.created_at)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
