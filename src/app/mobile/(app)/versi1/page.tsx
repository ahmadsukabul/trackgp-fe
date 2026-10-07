"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  BellRing,
  Car,
  ChevronRight,
  Route,
  TrendingUp,
} from "lucide-react";
import { useBusiness } from "../../../v1/lib/BusinessContext";
import { MENU } from "../../../v1/lib/menu";
import { getApiErrorMessage } from "../../../v1/lib/api";
import {
  dashboardStats,
  devicePositions,
  geofenceEvents,
  type DashboardStats,
  type DevicePosition,
  type GPSEvent,
} from "../../../v1/lib/client";
import { formatDateTimeSec, formatRelative } from "@/lib/format-date";
import BottomSheet from "../../_shell/bottom-sheet";
import { classifyDevice, hasValidCoord, FLEET_COLOR, FLEET_LABEL, type Fleet } from "../../_lib/fleet";

/**
 * Versi 1 — eksperimen tampilan beranda mobile.
 *
 * Mengikuti mock: header sapaan + bell + avatar, kartu jarak mingguan dengan
 * line chart, kartu donut status armada, dua kartu ringkas, lalu daftar trip.
 *
 * Catatan data:
 * - Donut, "Trip aktif", dan "Alert hari ini" memakai data nyata dari
 *   /client/device/positions & /client/geofence/events.
 * - Kartu "Total jarak minggu ini" BELUM punya endpoint laporan di sisi client,
 *   jadi angkanya masih contoh (ditandai "contoh").
 */

const REFRESH_MS = 60_000;

// --- Contoh data jarak harian (Sen–Min) sampai endpoint laporan tersedia. ---
const SAMPLE_DISTANCE = [150, 180, 160, 190, 200, 220, 184];
const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "TG";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function isToday(s: string): boolean {
  if (!s) return false;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return false;
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

/** Line chart SVG sederhana — titik + area + label hari. */
function DistanceChart({ values }: { values: number[] }) {
  const W = 320;
  const H = 140;
  const padX = 12;
  const padTop = 14;
  const padBottom = 26;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;

  const pts = values.map((v, i) => {
    const x = padX + (innerW * i) / (values.length - 1);
    const y = padTop + innerH * (1 - (v - min) / span);
    return [x, y] as const;
  });

  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const baseY = H - padBottom;
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${baseY} L${pts[0][0].toFixed(1)} ${baseY} Z`;
  const peak = values.indexOf(max);

  return (
    <svg
      className="mv1-chart"
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Grafik jarak harian seminggu"
    >
      <defs>
        <linearGradient id="mv1-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--v1-accent)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--v1-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 0.5, 1].map((t) => (
        <line
          key={t}
          x1={padX}
          x2={W - padX}
          y1={padTop + innerH * t}
          y2={padTop + innerH * t}
          stroke="var(--v1-border-subtle)"
          strokeWidth="1"
        />
      ))}

      <path d={area} fill="url(#mv1-area)" />
      <path
        d={line}
        fill="none"
        stroke="var(--v1-accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p[0]}
          cy={p[1]}
          r={i === peak ? 5.5 : 4}
          fill="var(--v1-surface)"
          stroke="var(--v1-accent)"
          strokeWidth={i === peak ? 3 : 2.5}
        />
      ))}

      {DAY_LABELS.map((d, i) => (
        <text
          key={d}
          x={pts[i][0]}
          y={H - 8}
          textAnchor="middle"
          fontSize="11"
          fill="var(--v1-ink-faint)"
        >
          {d}
        </text>
      ))}
    </svg>
  );
}

/** Donut status armada. */
function StatusDonut({ fleet, total }: { fleet: Record<Fleet, number>; total: number }) {
  const size = 132;
  const r = 52;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const safeTotal = total || 1;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Status armada">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--v1-border-subtle)" strokeWidth="16" />
      {(["online", "parkir", "offline"] as Fleet[]).map((k) => {
        const len = (fleet[k] / safeTotal) * circ;
        const dash = `${len} ${circ - len}`;
        const el = (
          <circle
            key={k}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={FLEET_COLOR[k]}
            strokeWidth="16"
            strokeDasharray={dash}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
        offset += len;
        return el;
      })}
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="26" fontWeight="800" fill="var(--v1-ink)">
        {total}
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize="11" fill="var(--v1-ink-faint)">
        kendaraan
      </text>
    </svg>
  );
}

export default function MobileVersi1Page() {
  const { can, activeBusiness, activeBusinessId, loading: bizLoading } = useBusiness();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [points, setPoints] = useState<DevicePosition[]>([]);
  const [events, setEvents] = useState<GPSEvent[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

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
    setError("");
    const [statsRes, posRes, evRes] = await Promise.all([
      dashboardStats(),
      canGps ? devicePositions() : Promise.resolve(null),
      canGeofence ? geofenceEvents({ limit: 20 }) : Promise.resolve(null),
    ]);
    if (statsRes.status === 1) setStats(statsRes.data);
    else setError(getApiErrorMessage(statsRes, "Gagal memuat ringkasan."));
    if (posRes && posRes.status === 1 && Array.isArray(posRes.data)) setPoints(posRes.data);
    if (evRes && evRes.status === 1 && Array.isArray(evRes.data)) setEvents(evRes.data);
    setLoading(false);
  }, [bizLoading, can, canGps, canGeofence]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!activeBusinessId) return;
    const t = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(t);
  }, [activeBusinessId, load]);

  const valid = useMemo(() => points.filter(hasValidCoord), [points]);

  const fleet = useMemo(() => {
    const c: Record<Fleet, number> = { online: 0, parkir: 0, offline: 0 };
    for (const p of valid) c[classifyDevice(p)] += 1;
    return c;
  }, [valid]);

  const totalKendaraan = stats?.total_devices ?? valid.length;
  const moving = useMemo(() => valid.filter((p) => p.speed > 0), [valid]);
  const alertsToday = useMemo(() => events.filter((ev) => isToday(ev.event_time)).length, [events]);

  const distanceTotal = SAMPLE_DISTANCE.reduce((a, b) => a + b, 0);

  const trips = moving.slice(0, 3);

  return (
    <>
      {/* Header: sapaan + bell + avatar */}
      <header className="mv1-head">
        <div style={{ minWidth: 0 }}>
          <p className="mv1-hello">{greeting()} 👋</p>
          <h1 className="mv1-name">{name || activeBusiness?.name || "TrackGPS"}</h1>
        </div>
        <div className="mv1-head-actions">
          <button
            type="button"
            className="mv1-square"
            aria-label="Peringatan"
            onClick={() => setSheetOpen(true)}
          >
            <Bell className="w-5 h-5" />
            {alertsToday > 0 && <span className="mv1-dot" />}
          </button>
          <span className="mv1-square mv1-avatar" aria-hidden="true">
            {initials(name || "TrackGPS")}
          </span>
        </div>
      </header>

      {error && <div className="m-error">{error}</div>}

      {/* Kartu jarak mingguan */}
      <section className="mv1-card">
        <div className="mv1-metric">
          <div>
            <p className="mv1-label">
              Total jarak minggu ini <span className="mv1-sample">contoh</span>
            </p>
            <p className="mv1-value" style={{ marginTop: 8 }}>
              {distanceTotal.toLocaleString("id-ID")} km
            </p>
          </div>
          <span className="mv1-pill">
            <TrendingUp className="w-4 h-4" />
            +12,4%
          </span>
        </div>
        <DistanceChart values={SAMPLE_DISTANCE} />
      </section>

      {/* Donut status armada */}
      <section className="mv1-card">
        <div className="mv1-donut-row">
          <StatusDonut fleet={fleet} total={totalKendaraan} />
          <div className="mv1-legend">
            {(["online", "parkir", "offline"] as Fleet[]).map((k) => (
              <div key={k} className="mv1-legend-item">
                <span className="mv1-legend-dot" style={{ background: FLEET_COLOR[k] }} />
                {FLEET_LABEL[k]}
                <span className="mv1-legend-val">
                  {loading && valid.length === 0 ? (
                    <span className="m-skel" style={{ display: "inline-block", width: 20, height: 15 }} />
                  ) : (
                    fleet[k]
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dua kartu ringkas */}
      <div className="mv1-grid2">
        <Link href="/mobile/gps" className="mv1-card mv1-mini">
          <div className="mv1-mini-top">
            <span className="mv1-mini-ico" style={{ background: "var(--v1-accent-light)", color: "var(--v1-success)" }}>
              <Route className="w-5 h-5" />
            </span>
            <span className="mv1-mini-val">{moving.length}</span>
          </div>
          <span className="mv1-mini-label">Trip aktif</span>
        </Link>

        <Link href="/mobile/geofence" className="mv1-card mv1-mini">
          <div className="mv1-mini-top">
            <span className="mv1-mini-ico" style={{ background: "var(--v1-danger-bg)", color: "var(--v1-danger)" }}>
              <BellRing className="w-5 h-5" />
            </span>
            <span className="mv1-mini-val">{alertsToday}</span>
          </div>
          <span className="mv1-mini-label">Alert hari ini</span>
        </Link>
      </div>

      {/* Trip sedang berjalan */}
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="mv1-sec-head">
          <h2 className="mv1-sec-title">Trip sedang berjalan</h2>
          <Link href="/mobile/gps" className="mv1-link">
            Lihat semua
          </Link>
        </div>

        {loading && trips.length === 0 ? (
          <div className="mv1-card">
            {[0, 1].map((i) => (
              <div key={i} style={{ marginBottom: i === 0 ? 16 : 0 }}>
                <div className="m-skel" style={{ width: "60%", height: 15 }} />
                <div className="m-skel" style={{ width: "40%", height: 12, marginTop: 8 }} />
                <div className="m-skel" style={{ width: "100%", height: 7, marginTop: 12, borderRadius: 999 }} />
              </div>
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="m-empty">
            <Car className="w-6 h-6" />
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--v1-ink-muted)" }}>
              Tidak ada kendaraan yang sedang bergerak.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {trips.map((t) => (
              <Link key={t.device_id} href={`/mobile/gps/${encodeURIComponent(t.device_id)}`} className="mv1-card mv1-trip">
                <div className="mv1-trip-row">
                  <span className="mv1-trip-ico">
                    <Car className="w-5 h-5" />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span className="mv1-trip-name" style={{ display: "block" }}>
                      {t.name || t.device_id}
                    </span>
                    <span className="mv1-trip-sub" style={{ display: "block" }}>
                      {t.address || `Diperbarui ${formatRelative(t.device_time || t.last_seen_at)}`}
                    </span>
                  </span>
                  <span className="mv1-trip-right">{t.speed} km/j</span>
                </div>
                <div className="mv1-bar" aria-hidden="true">
                  <div className="mv1-bar-fill" style={{ width: `${Math.min(100, (t.speed / 80) * 100)}%` }} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Peringatan */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Peringatan">
        {events.length === 0 ? (
          <div className="m-empty">
            <BellRing className="w-6 h-6" />
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--v1-ink-muted)" }}>
              Belum ada peringatan.
            </p>
          </div>
        ) : (
          <div className="m-list" style={{ boxShadow: "none" }}>
            {events.slice(0, 10).map((ev) => (
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
                <ChevronRight className="w-4 h-4" style={{ color: "var(--v1-ink-faint)" }} />
              </div>
            ))}
          </div>
        )}
      </BottomSheet>
    </>
  );
}
