"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Radio, Car, UserCog, Users, MapPin, RefreshCw } from "lucide-react";
import type { MapMarker } from "../../v1/components/MapCanvas";
import { useBusiness } from "../../v1/lib/BusinessContext";
import { MENU } from "../../v1/lib/menu";
import { getApiErrorMessage } from "../../v1/lib/api";
import {
  dashboardStats,
  devicePositions,
  type DashboardStats,
  type DevicePosition,
} from "../../v1/lib/client";
import { formatDateTimeSec } from "@/lib/format-date";

const Map = dynamic(() => import("../../v1/components/MapCanvas"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 260, background: "var(--v1-surface-raised)" }} />
  ),
});

const REFRESH_MS = 60_000;

export default function MobileHomePage() {
  const { can, activeBusiness, loading: bizLoading, activeBusinessId } = useBusiness();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [points, setPoints] = useState<DevicePosition[]>([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState("");

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

  const showMap = can(MENU.gps) && !bizLoading;

  const loadMap = useCallback(async () => {
    if (!showMap) {
      setMapLoading(false);
      return;
    }
    setMapError("");
    const res = await devicePositions();
    if (res.status === 1 && Array.isArray(res.data)) setPoints(res.data);
    else setMapError(getApiErrorMessage(res, "Gagal memuat posisi perangkat."));
    setMapLoading(false);
  }, [showMap]);

  useEffect(() => {
    if (!showMap || !activeBusinessId) return;
    setMapLoading(true);
    loadMap();
    const timer = window.setInterval(loadMap, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [showMap, activeBusinessId, loadMap]);

  const validPoints = useMemo(
    () =>
      points.filter(
        (p) =>
          (p.latitude !== 0 || p.longitude !== 0) &&
          Math.abs(p.latitude) <= 90 &&
          Math.abs(p.longitude) <= 180,
      ),
    [points],
  );

  const markers: MapMarker[] = useMemo(
    () =>
      validPoints.map((p) => ({
        id: p.device_id,
        name: p.name,
        latitude: p.latitude,
        longitude: p.longitude,
        status: p.status,
        ignition: p.ignition,
        speed: p.speed,
        plate: p.protocol,
        lastSeen:
          p.device_time || p.last_seen_at
            ? formatDateTimeSec(p.device_time || p.last_seen_at)
            : undefined,
      })),
    [validPoints],
  );

  const cards = [
    { label: "Perangkat GPS", value: stats?.total_devices ?? 0, href: "/mobile/gps", icon: Radio, menu: MENU.gps },
    { label: "Kendaraan", value: stats?.total_vehicles ?? 0, href: "/mobile/vehicle", icon: Car, menu: MENU.vehicle },
    { label: "Supir", value: stats?.total_drivers ?? 0, href: "/mobile/driver", icon: UserCog, menu: MENU.driver },
    { label: "Anggota Tim", value: stats?.total_users ?? 0, href: "/mobile/team", icon: Users, menu: MENU.team },
  ].filter((c) => can(c.menu));

  return (
    <>
      <div>
        <p className="m-faint" style={{ fontSize: 12 }}>
          {stats?.bisnis_name || activeBusiness?.name || "Bisnis aktif"}
          {(stats?.member_role || activeBusiness?.role) && (
            <> · {stats?.member_role || activeBusiness?.role}</>
          )}
        </p>
      </div>

      {error && <div className="m-error">{error}</div>}

      <div className="m-stat-grid">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.href} href={c.href} className="m-stat">
              <span
                className="flex items-center justify-center"
                style={{ width: 34, height: 34, background: "var(--v1-accent-light)", color: "var(--v1-accent-dim)" }}
              >
                <Icon className="w-[18px] h-[18px]" />
              </span>
              {loading ? (
                <span className="animate-pulse" style={{ height: 26, width: 40, background: "var(--v1-border)" }} />
              ) : (
                <span className="m-stat-value">{c.value}</span>
              )}
              <span className="m-stat-label">{c.label}</span>
            </Link>
          );
        })}
      </div>

      {can(MENU.gps) && (
        <div className="m-card">
          <div className="m-card-pad m-row-between" style={{ paddingBottom: 10 }}>
            <span className="m-row" style={{ gap: 8, fontWeight: 700, fontSize: 14 }}>
              <MapPin className="w-4 h-4" style={{ color: "var(--v1-accent)" }} />
              Peta perangkat
            </span>
            <button
              type="button"
              className="m-iconbtn"
              aria-label="Muat ulang peta"
              onClick={loadMap}
              disabled={mapLoading}
            >
              <RefreshCw className={`w-4 h-4 ${mapLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {mapError && <div className="m-error" style={{ margin: 16, marginTop: 0 }}>{mapError}</div>}

          {markers.length === 0 && !mapLoading ? (
            <div className="m-empty" style={{ border: "none", borderTop: "1px solid var(--v1-border)" }}>
              <MapPin className="w-6 h-6" />
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--v1-ink-muted)" }}>
                Belum ada posisi untuk ditampilkan.
              </p>
            </div>
          ) : (
            <Map markers={markers} height={280} onSelect={() => undefined} />
          )}
        </div>
      )}
    </>
  );
}
