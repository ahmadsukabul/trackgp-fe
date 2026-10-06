"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  Shield,
  MapPin,
  LogIn,
  LogOut,
  RefreshCw,
  Navigation,
  Hash,
  Activity,
  Layers,
  Clock,
  MapPinned,
} from "lucide-react";
import { adminFetch, getApiErrorMessage } from "../../lib/api";
import { Section, StatCard, EmptyState } from "../../components/section";
import { StatusBadge } from "../../components/data-table";
import { PaginationBar } from "../../components/pagination";
import { useKeysetPaging, ADMIN_PAGE_LIMIT } from "../../lib/use-keyset-paging";
import GeofenceEventMapModal from "../../components/geofence-event-map-modal";
import DateInput from "../../components/date-input";
import { formatDateTimeSec } from "@/lib/format-date";

// ---- Tipe data ---------------------------------------------------------------

type Geofence = {
  id: number;
  geofence_id: string;
  bisnis_id: string;
  name: string;
  description: string;
  area: string;
  area_type: string;
  center_lat: number;
  center_lng: number;
  radius: number;
  polygon_coords: string;
  color: string;
  min_fixes: number;
  status: number;
  created_at: string;
  updated_at?: string;
};

type GeofenceEvent = {
  id: number;
  event_id: string;
  device_id: string;
  bisnis_id: string;
  event_type: string;
  event_time: string;
  geofence_id: string;
  message: string;
  attributes_json: string;
};

const TYPE_OPTIONS = [
  { label: "Semua Tipe", value: "" },
  { label: "Masuk Area", value: "geofenceEnter" },
  { label: "Keluar Area", value: "geofenceExit" },
];

// ---- Helper ------------------------------------------------------------------

/** Hitung jumlah titik polygon dari polygon_coords JSON (aman terhadap data rusak). */
function countPoints(polygonCoords: string): number {
  if (!polygonCoords) return 0;
  try {
    const arr = JSON.parse(polygonCoords);
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}

/** Ambil nama device dari attributes_json bila ada (fallback "-"). */
function deviceLabel(ev: GeofenceEvent): string {
  if (ev.attributes_json) {
    try {
      const attrs = JSON.parse(ev.attributes_json);
      const name = attrs?.device_name || attrs?.name;
      if (typeof name === "string" && name) return name;
    } catch { /* ignore */ }
  }
  return ev.device_id;
}

/**
 * Titik GPS saat event. Engine geofence menulis {lat,lng} ke attributes_json
 * setiap kali fire, jadi koordinatnya selalu ada untuk event di halaman ini.
 * Kembalikan null bila data hilang/rusak supaya modal tetap bisa dibuka.
 */
function eventPoint(ev: GeofenceEvent): { lat: number | null; lng: number | null } {
  if (ev.attributes_json) {
    try {
      const attrs = JSON.parse(ev.attributes_json);
      const lat = Number(attrs?.lat);
      const lng = Number(attrs?.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
        return { lat, lng };
      }
    } catch { /* ignore */ }
  }
  return { lat: null, lng: null };
}

/**
 * Area geofence yang dirender di peta log. Prioritas:
 *  1. Snapshot di attributes_json (kondisi area SAAT event terjadi) — akurat
 *     walau geofence kemudian diedit/dihapus.
 *  2. Record geofence terkini — fallback untuk event lama yang belum punya
 *     snapshot.
 * `snapshot` = true berarti area berasal dari snapshot.
 */
function eventArea(
  ev: GeofenceEvent,
  current: Geofence,
): { geofence: { name: string; color: string; polygon_coords: string }; snapshot: boolean } {
  if (ev.attributes_json) {
    try {
      const attrs = JSON.parse(ev.attributes_json);
      const poly = typeof attrs?.fence_polygon === "string" ? attrs.fence_polygon : "";
      if (poly) {
        return {
          geofence: {
            name: typeof attrs?.fence_name === "string" && attrs.fence_name ? attrs.fence_name : current.name,
            color: typeof attrs?.fence_color === "string" && attrs.fence_color ? attrs.fence_color : current.color,
            polygon_coords: poly,
          },
          snapshot: true,
        };
      }
    } catch { /* ignore */ }
  }
  return {
    geofence: { name: current.name, color: current.color, polygon_coords: current.polygon_coords },
    snapshot: false,
  };
}

/** InfoCell — satu sel label/value untuk grid informasi. */
function InfoCell({
  label,
  value,
  custom,
  mono,
  icon,
}: {
  label: string;
  value?: React.ReactNode;
  custom?: React.ReactNode;
  mono?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium mb-0.5 flex items-center gap-1">
        {icon}
        {label}
      </p>
      {custom ?? (
        <p className={`text-[13px] text-gray-900 dark:text-white truncate ${mono ? "font-mono" : ""}`}>
          {value || value === 0 ? value : "-"}
        </p>
      )}
    </div>
  );
}

// ---- Halaman -----------------------------------------------------------------

export default function GeofenceDetailPage() {
  const params = useParams();
  const geofenceId = typeof params?.id === "string" ? params.id : "";

  const [geofence, setGeofence] = useState<Geofence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter log
  const filtersRef = useRef<{ date: string; type: string }>({ date: "", type: "" });
  const [dateFilter, setDateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Event yang sedang dilihat di peta (null = modal tertutup).
  const [mapEvent, setMapEvent] = useState<GeofenceEvent | null>(null);

  const paging = useKeysetPaging<GeofenceEvent>({
    enabled: !!geofenceId,
    fetchPage: ({ last_id, limit }) => {
      const p = new URLSearchParams();
      p.set("geofence_id", geofenceId);
      p.set("last_id", String(last_id));
      p.set("limit", String(limit));
      if (filtersRef.current.date) p.set("date", filtersRef.current.date);
      if (filtersRef.current.type) p.set("type", filtersRef.current.type);
      return adminFetch<GeofenceEvent[]>(`/geofence/events?${p}`);
    },
  });

  const load = useCallback(async () => {
    if (!geofenceId) {
      setLoading(false);
      setError("Geofence tidak ditemukan");
      return;
    }
    setLoading(true);
    setError("");
    const res = await adminFetch<Geofence>(`/geofence/${encodeURIComponent(geofenceId)}`);
    if (res.status === 1 && res.data) {
      setGeofence(res.data);
    } else {
      setGeofence(null);
      setError(getApiErrorMessage(res, "Geofence tidak ditemukan"));
    }
    setLoading(false);
  }, [geofenceId]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyFilters(next: { date?: string; type?: string }) {
    filtersRef.current = { ...filtersRef.current, ...next };
    paging.reset();
  }

  function handleResetFilter() {
    filtersRef.current = { date: "", type: "" };
    setDateFilter("");
    setTypeFilter("");
    paging.reset();
  }

  const enterCount = paging.rows.filter((e) => e.event_type === "geofenceEnter").length;
  const exitCount = paging.rows.filter((e) => e.event_type === "geofenceExit").length;

  // ---- Loading skeleton ----
  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-[14px] animate-pulse" />
          ))}
        </div>
        <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-[14px] animate-pulse" />
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-[14px] animate-pulse" />
      </div>
    );
  }

  // ---- Error / not found ----
  if (error || !geofence) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 font-medium">{error || "Geofence tidak ditemukan"}</p>
          <Link href="/admin834kf/geofence" className="mt-4 inline-block text-[13px] text-[#2964e7] hover:underline">
            Kembali ke daftar geofence
          </Link>
        </div>
      </div>
    );
  }

  const points = countPoints(geofence.polygon_coords);
  const mapArea = mapEvent ? eventArea(mapEvent, geofence) : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/admin834kf/geofence"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div
          className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: geofence.color || "#2964e7" }}
        >
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight truncate">
            {geofence.name}
          </h1>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 font-mono truncate">
            {geofence.geofence_id}
          </p>
        </div>
        <StatusBadge status={geofence.status} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Activity className="w-4 h-4" />} label="Log (halaman ini)" value={paging.rows.length} />
        <StatCard icon={<LogIn className="w-4 h-4" />} label="Masuk" value={enterCount} />
        <StatCard icon={<LogOut className="w-4 h-4" />} label="Keluar" value={exitCount} />
        <StatCard icon={<Layers className="w-4 h-4" />} label="Titik Polygon" value={points} />
      </div>

      {/* Informasi Geofence */}
      <Section icon={<MapPin className="w-4 h-4" />} title="Informasi Geofence">
        <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-700/50 divide-y divide-gray-100 dark:divide-gray-700/30">
          <div className="grid grid-cols-2 gap-x-6 px-3 py-2.5">
            <InfoCell label="Nama" value={geofence.name} />
            <InfoCell label="Geofence ID" value={geofence.geofence_id} mono icon={<Hash className="w-3 h-3" />} />
          </div>
          <div className="grid grid-cols-2 gap-x-6 px-3 py-2.5">
            <InfoCell label="Tipe Area" value={geofence.area_type || "polygon"} />
            <InfoCell label="Warna" custom={
              <span className="inline-flex items-center gap-2 text-[13px] font-mono text-gray-900 dark:text-white">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-gray-200 dark:border-gray-700"
                  style={{ backgroundColor: geofence.color || "#FF0000" }}
                />
                {geofence.color || "-"}
              </span>
            } />
          </div>
          <div className="grid grid-cols-2 gap-x-6 px-3 py-2.5">
            <InfoCell label="Minimal Fix Berturut" value={geofence.min_fixes ?? 2} />
            <InfoCell label="Jumlah Titik" value={points} />
          </div>
          <div className="grid grid-cols-2 gap-x-6 px-3 py-2.5">
            <InfoCell label="Bisnis ID" value={geofence.bisnis_id} mono />
            <InfoCell label="Status" custom={<StatusBadge status={geofence.status} />} />
          </div>
          <div className="grid grid-cols-2 gap-x-6 px-3 py-2.5">
            <InfoCell label="Dibuat" value={formatDateTimeSec(geofence.created_at)} icon={<Clock className="w-3 h-3" />} />
            <InfoCell label="Diperbarui" value={geofence.updated_at ? formatDateTimeSec(geofence.updated_at) : "-"} />
          </div>
          <div className="px-3 py-2.5">
            <InfoCell label="Deskripsi" value={geofence.description || "-"} />
          </div>
        </div>
      </Section>

      {/* Log Masuk / Keluar Area */}
      <Section
        icon={<Navigation className="w-4 h-4" />}
        title="Log Masuk / Keluar Area"
        headerRight={
          <button
            onClick={() => void paging.reload()}
            className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${paging.loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      >
        {/* Toolbar filter */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <DateInput
            value={dateFilter}
            onChange={(iso) => {
              setDateFilter(iso);
              applyFilters({ date: iso });
            }}
          />
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              applyFilters({ type: e.target.value });
            }}
            className="px-3 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {(dateFilter || typeFilter) && (
            <button
              onClick={handleResetFilter}
              className="px-3 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {paging.error ? (
          <p className="text-[13px] text-red-600 dark:text-red-400 py-3">{paging.error}</p>
        ) : !paging.loading && paging.rows.length === 0 ? (
          <EmptyState
            icon={<Navigation className="w-8 h-8" />}
            message="Belum ada kendaraan yang masuk/keluar area ini."
          />
        ) : (
          <>
            <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
              <div className="grid grid-cols-12 text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium pb-2 px-1">
                <span className="col-span-3">Waktu</span>
                <span className="col-span-2">Tipe</span>
                <span className="col-span-4">GPS</span>
                <span className="col-span-3">Pesan</span>
              </div>
              {paging.loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={`sk-${i}`} className="grid grid-cols-12 items-center gap-2 py-3 px-1">
                      <span className="col-span-3">
                        <span className="block h-3.5 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                      </span>
                      <span className="col-span-2">
                        <span className="block h-3.5 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                      </span>
                      <span className="col-span-4">
                        <span className="block h-3.5 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                      </span>
                      <span className="col-span-3">
                        <span className="block h-3.5 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                      </span>
                    </div>
                  ))
                : paging.rows.map((ev) => {
                    const isEnter = ev.event_type === "geofenceEnter";
                    const pt = eventPoint(ev);
                    const hasPoint = pt.lat !== null && pt.lng !== null;
                    return (
                      <div
                        key={ev.event_id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setMapEvent(ev)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setMapEvent(ev);
                          }
                        }}
                        title={hasPoint ? "Lihat titik di peta" : "Event ini tidak menyimpan koordinat"}
                        className="w-full text-left grid grid-cols-12 items-center gap-2 py-2.5 px-1 -mx-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40 focus:outline-none focus:ring-2 focus:ring-[#2964e7]/30 transition-colors group cursor-pointer"
                      >
                        <span className="col-span-3 text-[12px] text-gray-500 dark:text-gray-400 truncate">
                          {formatDateTimeSec(ev.event_time)}
                        </span>
                        <span className="col-span-2 flex items-center gap-1.5 min-w-0">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              isEnter
                                ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                                : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                            }`}
                          >
                            {isEnter ? <LogIn className="w-3 h-3" /> : <LogOut className="w-3 h-3" />}
                            {isEnter ? "Masuk" : "Keluar"}
                          </span>
                          <MapPinned
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              hasPoint
                                ? "text-gray-400 group-hover:text-[#2964e7] dark:text-gray-500 dark:group-hover:text-[#2964e7]"
                                : "text-gray-200 dark:text-gray-700"
                            }`}
                          />
                        </span>
                        <span className="col-span-4 min-w-0">
                          <Link
                            href={`/admin834kf/device/${ev.device_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="block text-[13px] text-[#2964e7] hover:text-[#2150c5] truncate"
                          >
                            {deviceLabel(ev)}
                          </Link>
                          <span className="block text-[11px] text-gray-400 font-mono truncate">{ev.device_id}</span>
                        </span>
                        <span className="col-span-3 text-[12px] text-gray-500 dark:text-gray-400 truncate">
                          {ev.message || "-"}
                        </span>
                      </div>
                    );
                  })}
            </div>

            {/* Pagination */}
            <div className="mt-2 -mx-5 -mb-5">
              <PaginationBar
                page={paging.page}
                limit={ADMIN_PAGE_LIMIT}
                canPrev={paging.page > 1}
                canNext={paging.hasNext}
                loading={paging.loading}
                maxVisitedPage={paging.maxVisitedPage}
                onPrev={paging.goPrev}
                onNext={paging.goNext}
                onPageJump={paging.goPage}
              />
            </div>
          </>
        )}
      </Section>

      {/* Peta: area geofence (snapshot saat event) + titik GPS saat event */}
      <GeofenceEventMapModal
        open={!!mapEvent}
        onClose={() => setMapEvent(null)}
        geofence={mapArea ? mapArea.geofence : null}
        areaNote={mapArea ? (mapArea.snapshot ? "Area saat event" : "Area terkini (log lama)") : undefined}
        event={
          mapEvent
            ? {
                event_type: mapEvent.event_type,
                event_time: mapEvent.event_time,
                device_id: mapEvent.device_id,
                message: mapEvent.message,
                ...eventPoint(mapEvent),
              }
            : null
        }
      />
    </div>
  );
}
