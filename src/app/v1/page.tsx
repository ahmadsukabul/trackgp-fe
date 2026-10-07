"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Radio, Car, Users, UserCog, Building2, MapPin } from "lucide-react";
import Link from "next/link";
import type { MapMarker } from "./components/MapCanvas";
import { useBusiness } from "./lib/BusinessContext";
import {
  dashboardStats,
  devicePositions,
  type DashboardStats,
  type DevicePosition,
} from "./lib/client";
import { getApiErrorMessage } from "./lib/api";
import { useBasePath } from "./lib/base-path";
import { MENU } from "./lib/menu";
import { formatDateTimeSec } from "@/lib/format-date";

// MapLibre menyentuh window/document saat import, jadi hanya boleh dimuat di browser.
const Map = dynamic(() => import("./components/MapCanvas"), {
  ssr: false,
  loading: () => <div className="h-105 rounded-xl animate-pulse" style={{ background: "var(--v1-surface-raised)" }} />,
});

// Peta dimuat ulang tiap interval ini supaya posisi marker mengikuti laporan GPS
// terbaru tanpa perlu refresh halaman.
const REFRESH_MS = 60_000;

export default function DashboardPage() {
  const { can, activeBusiness, loading: bizLoading, activeBusinessId } = useBusiness();
  const base = useBasePath();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [points, setPoints] = useState<DevicePosition[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
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
    if (res.status === 1) {
      setStats(res.data);
    } else {
      setError(getApiErrorMessage(res, "Gagal memuat statistik."));
    }
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

  // Muat + auto-refresh; jalan ulang saat bisnis aktif berganti.
  useEffect(() => {
    if (!showMap || !activeBusinessId) return;
    setMapLoading(true);
    loadMap();
    const timer = window.setInterval(loadMap, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [showMap, activeBusinessId, loadMap]);

  // Titik di peta: kalau ada device yang dipilih, tampilkan satu itu saja.
  // Kalau tidak ada (atau "all"), tampilkan semua yang punya koordinat valid.
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

  // Auto-select kalau cuma 1 device yang punya posisi.
  useEffect(() => {
    if (validPoints.length === 1 && !selectedDeviceId) {
      setSelectedDeviceId(validPoints[0].device_id);
    }
  }, [validPoints, selectedDeviceId]);

  const markers: MapMarker[] = useMemo(() => {
    const source = selectedDeviceId
      ? validPoints.filter((p) => p.device_id === selectedDeviceId)
      : validPoints;
    return source.map((p) => ({
      id: p.device_id,
      name: p.name,
      latitude: p.latitude,
      longitude: p.longitude,
      status: p.status,
      ignition: p.ignition,
      speed: p.speed,
      plate: p.model ? `${p.protocol || "GPS"} · ${p.model}` : p.protocol,
      lastSeen: p.device_time || p.last_seen_at ? formatDateTimeSec(p.device_time || p.last_seen_at) : undefined,
    }));
  }, [validPoints, selectedDeviceId]);

  const mappedCount = markers.length;
  const reportedCount = points.filter((p) => p.last_seen_at).length;

  const cards = [
    { label: "Perangkat GPS", value: stats?.total_devices ?? 0, href: `${base}/gps`, icon: Radio, menu: MENU.gps },
    { label: "Kendaraan", value: stats?.total_vehicles ?? 0, href: `${base}/vehicle`, icon: Car, menu: MENU.vehicle },
    { label: "Supir", value: stats?.total_drivers ?? 0, href: `${base}/driver`, icon: UserCog, menu: MENU.driver },
    { label: "Anggota Tim", value: stats?.total_users ?? 0, href: `${base}/team`, icon: Users, menu: MENU.team },
  ].filter((c) => can(c.menu));

  return (
    <div className="max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--v1-ink)", fontFamily: "var(--v1-font-display)" }}>Dashboard</h1>
        <p className="mt-1 text-[13px] flex items-center gap-1.5" style={{ color: "var(--v1-ink-faint)" }}>
          <Building2 className="w-3.5 h-3.5" />
          {stats?.bisnis_name || activeBusiness?.name || "Bisnis aktif"}
          {(stats?.member_role || activeBusiness?.role) && (
            <span style={{ color: "var(--v1-ink-faint)" }}>· {stats?.member_role || activeBusiness?.role}</span>
          )}
        </p>
      </div>

      {error && (
        <div
          className="mb-6 px-4 py-3 rounded-xl text-[13px] font-medium"
          style={{
            background: "var(--v1-danger-bg)",
            border: "1px solid var(--v1-danger-border)",
            color: "var(--v1-danger)",
          }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.href}
              href={c.href}
              className="group rounded-2xl p-5 transition-colors"
              style={{
                background: "var(--v1-surface)",
                border: "1px solid var(--v1-border)",
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--v1-accent-light)", color: "var(--v1-accent)" }}
                >
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                {loading ? (
                  <span className="h-7 w-10 rounded animate-pulse" style={{ background: "var(--v1-border)" }} />
                ) : (
                  <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--v1-ink)", fontFamily: "var(--v1-font-display)" }}>
                    {c.value}
                  </span>
                )}
              </div>
              <p className="mt-4 text-[13px] font-semibold" style={{ color: "var(--v1-ink-muted)" }}>
                {c.label}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Peta perangkat — posisi terakhir tiap GPS (POST /client/device/positions) */}
      {can(MENU.gps) && (
        <div
          className="rounded-2xl p-5 mb-6"
          style={{
            background: "var(--v1-surface)",
            border: "1px solid var(--v1-border)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" style={{ color: "var(--v1-accent)" }} />
              <h2 className="text-[14px] font-bold" style={{ color: "var(--v1-ink)", fontFamily: "var(--v1-font-display)" }}>Peta perangkat</h2>
            </div>
            <div className="flex items-center gap-3 text-[12px]" style={{ color: "var(--v1-ink-faint)" }}>
              <span>{mappedCount} titik di peta</span>
              <span style={{ color: "var(--v1-border)" }}>·</span>
              <span>{reportedCount} pernah lapor</span>
              <button
                onClick={loadMap}
                disabled={mapLoading}
                className="px-2.5 py-1 text-[12px] font-semibold rounded-lg transition-colors disabled:opacity-50"
                style={{ color: "var(--v1-accent)" }}
              >
                {mapLoading ? "Memuat..." : "Muat ulang"}
              </button>
            </div>
          </div>

          {validPoints.length > 0 && (() => {
            const selected = selectedDeviceId
              ? validPoints.find((p) => p.device_id === selectedDeviceId)
              : null;
            return (
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Radio className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--v1-ink-faint)" }} />
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="px-3 py-1.5 text-[13px] font-medium rounded-lg focus:outline-none cursor-pointer max-w-[280px] truncate"
                  style={{
                    color: "var(--v1-ink)",
                    background: "var(--v1-surface-raised)",
                    border: "1px solid var(--v1-border)",
                  }}
                >
                  <option value="">Semua perangkat</option>
                  {validPoints.map((p) => (
                    <option key={p.device_id} value={p.device_id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {selectedDeviceId && (
                  <button
                    onClick={() => setSelectedDeviceId("")}
                    className="text-[12px] transition-colors"
                    style={{ color: "var(--v1-ink-faint)" }}
                  >
                    Reset
                  </button>
                )}
                {selected && selected.address && (
                  <span className="text-[12px] flex items-center gap-1" style={{ color: "var(--v1-ink-faint)" }} title={selected.address}>
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>{selected.address}</span>
                  </span>
                )}
              </div>
            );
          })()}

          {mapError && (
            <div
              className="mb-3 px-4 py-3 rounded-xl text-[13px] font-medium"
              style={{
                background: "var(--v1-danger-bg)",
                border: "1px solid var(--v1-danger-border)",
                color: "var(--v1-danger)",
              }}
            >
              {mapError}
            </div>
          )}

          {mappedCount === 0 && !mapLoading ? (
            <div
              className="h-[420px] flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center px-6"
              style={{ borderColor: "var(--v1-border)" }}
            >
              <MapPin className="w-6 h-6" style={{ color: "var(--v1-ink-faint)" }} />
              <p className="text-[13px] font-semibold" style={{ color: "var(--v1-ink-muted)" }}>
                Belum ada posisi untuk ditampilkan.
              </p>
              <p className="text-[12px] max-w-sm leading-relaxed" style={{ color: "var(--v1-ink-faint)" }}>
                Daftarkan perangkat di menu{" "}
                <Link href={`${base}/gps`} className="font-semibold hover:underline" style={{ color: "var(--v1-accent)" }}>
                  GPS
                </Link>
                , lalu nyalakan tracker-nya. Marker muncul begitu perangkat mengirim koordinat
                pertamanya.
              </p>
            </div>
          ) : (
            <Map markers={markers} onSelect={() => undefined} />
          )}
        </div>
      )}
    </div>
  );
}
