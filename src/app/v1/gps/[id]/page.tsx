"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Cpu,
  Navigation,
  CreditCard,
  Truck,
  Camera as CameraIcon,
  History,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  LogIn,
  LogOut,
  MapPinned,
  Gauge,
  Battery,
  Power,
  Signal,
  Compass,
  Satellite,
  ReceiptText,
} from "lucide-react";
import { useBusiness } from "../../lib/BusinessContext";
import { useBasePath } from "../../lib/base-path";
import { MENU } from "../../lib/menu";
import { getApiErrorMessage } from "../../lib/api";
import { formatDate, formatDateTimeSec, formatRelative } from "@/lib/format-date";
import { expiryDaysLeft, expiryStatus, type ExpiryStatus } from "@/lib/expiry";
import {
  deviceDetail,
  devicePositions,
  cameraList,
  vehicleList,
  geofenceList,
  geofenceEvents,
  type Device,
  type DevicePosition,
  type Camera,
  type Vehicle,
  type Geofence,
  type GPSEvent,
} from "../../lib/client";
import { useKeysetPaging } from "../../lib/use-keyset-paging";
import { StatusBadge } from "../../components/CrudPage";
import MapCanvas, { type MapMarker } from "../../components/MapCanvas";
import PaginationBar from "../../components/PaginationBar";
import GeofenceEventMapModal from "../../components/GeofenceEventMapModal";
import { Section, InfoRow, StatCard, EmptyState } from "../../components/Section";
import { eventArea, eventPoint, fenceName } from "../../lib/geofence-event";

/** Jumlah baris log per halaman. */
const LOG_PAGE_LIMIT = 20;

const IDR = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const EXPIRY_COLOR: Record<ExpiryStatus, string> = {
  none: "var(--v1-ink-faint)",
  active: "var(--v1-success)",
  soon: "var(--v1-warning)",
  grace: "var(--v1-warning)",
  blocked: "var(--v1-danger)",
};

/** Label status mesin dari nilai ignition device. */
function ignitionLabel(v?: number): string {
  if (v === 1) return "Menyala";
  if (v === 2) return "Parkir";
  if (v === 0) return "Mati";
  return "Tidak diketahui";
}

/** Label kekuatan sinyal GSM. */
function signalLabel(v?: number): string {
  switch (v) {
    case 0:
      return "Tidak ada";
    case 1:
      return "Lemah";
    case 2:
      return "Sedang";
    case 3:
      return "Kuat";
    default:
      return "Tidak diketahui";
  }
}

/** "30 hari lagi" / "2 hari lalu" dari tanggal langganan. */
function expiryRelative(expiredAt?: string): string {
  const days = expiryDaysLeft(expiredAt);
  if (days === null) return "";
  if (days === 0) return "berakhir hari ini";
  return days > 0 ? `${days} hari lagi` : `${days * -1} hari lalu`;
}

export default function GpsDetailPage() {
  const params = useParams();
  const deviceId = decodeURIComponent(String(params?.id ?? ""));
  const base = useBasePath();
  const { can } = useBusiness();

  const allowed = can(MENU.gps);
  const canCamera = can(MENU.camera);
  const canVehicle = can(MENU.vehicle);
  const canInvoice = can(MENU.invoice);
  const canGeofence = can(MENU.geofence);

  const [device, setDevice] = useState<Device | null>(null);
  const [pos, setPos] = useState<DevicePosition | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Event yang sedang dilihat di peta (klik baris log).
  const [mapEvent, setMapEvent] = useState<GPSEvent | null>(null);
  const [showLog, setShowLog] = useState(true);

  const load = useCallback(async () => {
    if (!deviceId) return;
    if (!allowed) {
      setLoading(false);
      setError("Akun ini tidak punya akses ke menu GPS.");
      return;
    }
    setLoading(true);
    setError("");

    const [dRes, pRes, cRes, vRes, gRes] = await Promise.all([
      deviceDetail(deviceId),
      devicePositions(),
      canCamera ? cameraList(deviceId) : Promise.resolve(null),
      canVehicle ? vehicleList() : Promise.resolve(null),
      canGeofence ? geofenceList() : Promise.resolve(null),
    ]);

    if (dRes.status === 1 && dRes.data) setDevice(dRes.data);
    else setError(getApiErrorMessage(dRes, "Gagal memuat perangkat."));

    if (pRes.status === 1 && Array.isArray(pRes.data)) {
      setPos(pRes.data.find((p) => p.device_id === deviceId) ?? null);
    }
    if (cRes && cRes.status === 1 && Array.isArray(cRes.data)) setCameras(cRes.data);
    if (vRes && vRes.status === 1 && Array.isArray(vRes.data)) {
      setVehicles(vRes.data.filter((v) => v.device_id === deviceId));
    }
    if (gRes && gRes.status === 1 && Array.isArray(gRes.data)) setGeofences(gRes.data);

    setLoading(false);
  }, [deviceId, allowed, canCamera, canVehicle, canGeofence]);

  useEffect(() => {
    load();
  }, [load]);

  // Log masuk/keluar area khusus device ini (keyset paging).
  const paging = useKeysetPaging<GPSEvent>({
    enabled: allowed && canGeofence,
    limit: LOG_PAGE_LIMIT,
    fetchPage: ({ last_id, limit }) => geofenceEvents({ device_id: deviceId, last_id, limit }),
  });

  const hasPos = !!pos && (pos.latitude !== 0 || pos.longitude !== 0);

  const markers = useMemo<MapMarker[]>(() => {
    if (!hasPos || !pos) return [];
    return [
      {
        id: deviceId,
        name: device?.name || deviceId,
        latitude: pos.latitude,
        longitude: pos.longitude,
        status: device?.status || pos.status || "",
        ignition: pos.ignition,
        speed: pos.speed,
        lastSeen: formatDateTimeSec(pos.device_time || pos.last_seen_at),
      },
    ];
  }, [hasPos, pos, device, deviceId]);

  const expStatus = expiryStatus(device?.expired_at);
  const mapArea = mapEvent ? eventArea(mapEvent, geofences) : null;

  return (
    <div className="max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
        <div className="min-w-0">
          <Link
            href={`${base}/gps`}
            className="inline-flex items-center gap-1 text-[12px] font-semibold mb-2 transition-colors"
            style={{ color: "var(--v1-ink-faint)" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Perangkat GPS
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1
              className="text-xl font-bold tracking-tight truncate"
              style={{ color: "var(--v1-ink)", fontFamily: "var(--v1-font-display)" }}
            >
              {device?.name || deviceId || "Detail Perangkat"}
            </h1>
            {device && <StatusBadge value={device.status} />}
          </div>
          <p
            className="mt-1 text-[12px]"
            style={{ color: "var(--v1-ink-faint)", fontFamily: "var(--v1-font-display)" }}
          >
            {deviceId}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {canInvoice && (
            <Link
              href={`${base}/invoice?device_id=${encodeURIComponent(deviceId)}`}
              className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold rounded-xl transition-colors"
              style={{ border: "1px solid var(--v1-border)", color: "var(--v1-ink-muted)" }}
            >
              <ReceiptText className="w-4 h-4" />
              Langganan
            </Link>
          )}
          <button
            onClick={load}
            title="Muat ulang"
            className="p-2 rounded-xl transition-colors"
            style={{ border: "1px solid var(--v1-border)", color: "var(--v1-ink-muted)" }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div
          className="mb-5 px-4 py-3 rounded-xl text-[13px] font-medium"
          style={{
            background: "var(--v1-danger-bg)",
            border: "1px solid var(--v1-danger-border)",
            color: "var(--v1-danger)",
          }}
        >
          {error}
        </div>
      )}

      {/* Baris statistik */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
        <StatCard
          icon={<Gauge className="w-4 h-4" />}
          label="Kecepatan"
          value={hasPos ? `${Math.round(pos!.speed || 0)} km/j` : "-"}
        />
        <StatCard
          icon={<Power className="w-4 h-4" />}
          label="Mesin"
          value={ignitionLabel(pos?.ignition)}
        />
        <StatCard
          icon={<Battery className="w-4 h-4" />}
          label="Baterai"
          value={device && device.battery_level >= 0 ? `${Math.round(device.battery_level)}%` : "-"}
        />
        <StatCard
          icon={<Satellite className="w-4 h-4" />}
          label="Satelit"
          value={device && device.satellites >= 0 ? String(device.satellites) : "-"}
        />
        <StatCard
          icon={<Signal className="w-4 h-4" />}
          label="Sinyal"
          value={signalLabel(device?.signal_level)}
        />
        <StatCard
          icon={<Compass className="w-4 h-4" />}
          label="Arah"
          value={device && device.course >= 0 ? `${Math.round(device.course)}°` : "-"}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Posisi terakhir */}
        <Section icon={<Navigation className="w-4 h-4" />} title="Posisi Terakhir">
          {hasPos ? (
            <>
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid var(--v1-border)" }}
              >
                <MapCanvas markers={markers} height={320} onSelect={() => undefined} />
              </div>
              <dl className="mt-3 divide-y divide-(--v1-border-subtle)">
                <InfoRow label="Alamat">{pos!.address || "-"}</InfoRow>
                <InfoRow label="Koordinat">
                  <span className="font-mono">
                    {pos!.latitude.toFixed(6)}, {pos!.longitude.toFixed(6)}
                  </span>
                </InfoRow>
                <InfoRow label="Waktu perangkat">
                  {pos!.device_time ? formatDateTimeSec(pos!.device_time) : "-"}
                </InfoRow>
                <InfoRow label="Terakhir online">
                  {device?.last_seen_at ? (
                    <>
                      {formatDateTimeSec(device.last_seen_at)}
                      <span style={{ color: "var(--v1-ink-faint)" }}> · {formatRelative(device.last_seen_at)}</span>
                    </>
                  ) : (
                    "-"
                  )}
                </InfoRow>
              </dl>
            </>
          ) : (
            <EmptyState
              icon={<MapPinned className="w-7 h-7" />}
              message={loading ? "Memuat posisi..." : "Belum ada posisi terakhir untuk perangkat ini."}
            />
          )}
        </Section>

        <div className="flex flex-col gap-5">
          {/* Identitas perangkat */}
          <Section icon={<Cpu className="w-4 h-4" />} title="Identitas Perangkat">
            <dl className="divide-y divide-(--v1-border-subtle)">
              <InfoRow label="ID Perangkat">{device?.device_id || deviceId}</InfoRow>
              <InfoRow label="IMEI">{device?.unique_id || "-"}</InfoRow>
              <InfoRow label="Protokol">{device?.protocol ? device.protocol.toUpperCase() : "-"}</InfoRow>
              <InfoRow label="Model">{device?.model || "-"}</InfoRow>
              <InfoRow label="Produsen">{device?.manufacturer || "-"}</InfoRow>
              <InfoRow label="Kategori">{device?.category || "-"}</InfoRow>
              <InfoRow label="Nomor SIM">{device?.sim_number || "-"}</InfoRow>
              <InfoRow label="Nomor HP">{device?.phone_number || "-"}</InfoRow>
            </dl>
          </Section>

          {/* Langganan */}
          <Section icon={<CreditCard className="w-4 h-4" />} title="Langganan">
            <dl className="divide-y divide-(--v1-border-subtle)">
              <InfoRow label="Berakhir">
                {device?.expired_at ? (
                  <span style={{ color: EXPIRY_COLOR[expStatus], fontWeight: 600 }}>
                    {formatDate(device.expired_at)}
                    <span style={{ fontWeight: 400 }}> · {expiryRelative(device.expired_at)}</span>
                  </span>
                ) : (
                  "-"
                )}
              </InfoRow>
              <InfoRow label="Harga / bulan">
                {device?.price ? IDR.format(device.price) : "-"}
              </InfoRow>
            </dl>
            {canInvoice && (
              <Link
                href={`${base}/invoice?device_id=${encodeURIComponent(deviceId)}`}
                className="mt-3 flex items-center justify-center gap-2 w-full h-9 text-[13px] font-semibold rounded-xl transition-colors"
                style={{ border: "1px solid var(--v1-border)", color: "var(--v1-ink-muted)" }}
              >
                <ReceiptText className="w-4 h-4" />
                Lihat tagihan langganan
              </Link>
            )}
          </Section>
        </div>
      </div>

      {/* Kendaraan terkait */}
      {canVehicle && (
        <div className="mt-5">
          <Section
            icon={<Truck className="w-4 h-4" />}
            title={`Kendaraan Terkait (${vehicles.length})`}
          >
            {vehicles.length === 0 ? (
              <EmptyState
                icon={<Truck className="w-7 h-7" />}
                message="Belum ada kendaraan yang memasang perangkat ini."
              />
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {vehicles.map((v) => (
                  <li
                    key={v.vehicle_id}
                    className="rounded-xl px-4 py-3"
                    style={{ border: "1px solid var(--v1-border)" }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[13px] font-semibold truncate" style={{ color: "var(--v1-ink)" }}>
                        {v.name}
                      </p>
                      <span
                        className="shrink-0 text-[12px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: "var(--v1-surface-raised)",
                          color: "var(--v1-ink-muted)",
                          fontFamily: "var(--v1-font-display)",
                        }}
                      >
                        {v.license_plate || "-"}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px]" style={{ color: "var(--v1-ink-faint)" }}>
                      {[v.vehicle_type, v.brand, v.model, v.year ? String(v.year) : ""]
                        .filter(Boolean)
                        .join(" · ") || "-"}
                    </p>
                    <p className="mt-0.5 text-[12px]" style={{ color: "var(--v1-ink-faint)" }}>
                      Odometer {Math.round(v.odometer_km || 0).toLocaleString("id-ID")} km
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      )}

      {/* Kamera */}
      {canCamera && (
        <div className="mt-5">
          <Section icon={<CameraIcon className="w-4 h-4" />} title={`Kamera (${cameras.length})`}>
            {cameras.length === 0 ? (
              <EmptyState
                icon={<CameraIcon className="w-7 h-7" />}
                message="Belum ada kamera terhubung ke perangkat ini."
              />
            ) : (
              <ul className="divide-y divide-(--v1-border-subtle)">
                {cameras.map((cam) => (
                  <li key={cam.camera_id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold truncate" style={{ color: "var(--v1-ink)" }}>
                        {cam.name}
                      </p>
                      <p className="text-[12px] truncate" style={{ color: "var(--v1-ink-faint)" }}>
                        ch {cam.channel}
                        {cam.serial_number ? ` · ${cam.serial_number}` : ""}
                        {cam.stream_url ? ` · ${cam.stream_url}` : ""}
                      </p>
                    </div>
                    <StatusBadge value={cam.status} />
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      )}

      {/* Log masuk/keluar area */}
      {canGeofence && (
        <div className="mt-5">
          <section
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--v1-surface)", border: "1px solid var(--v1-border)" }}
          >
            <button
              type="button"
              onClick={() => setShowLog((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-3.5"
            >
              <span
                className="flex items-center gap-2 text-[14px] font-bold"
                style={{ color: "var(--v1-ink)", fontFamily: "var(--v1-font-display)" }}
              >
                <History className="w-4 h-4" style={{ color: "var(--v1-ink-faint)" }} />
                Log Masuk / Keluar Area
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
                  style={{ background: "var(--v1-surface-raised)", color: "var(--v1-ink-muted)" }}
                >
                  {paging.rows.length}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    void paging.reload();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                      void paging.reload();
                    }
                  }}
                  className="p-1.5 rounded-lg"
                  style={{ color: "var(--v1-ink-faint)" }}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${paging.loading ? "animate-spin" : ""}`} />
                </span>
                {showLog ? (
                  <ChevronUp className="w-4 h-4" style={{ color: "var(--v1-ink-faint)" }} />
                ) : (
                  <ChevronDown className="w-4 h-4" style={{ color: "var(--v1-ink-faint)" }} />
                )}
              </span>
            </button>

            {showLog && (
              <div style={{ borderTop: "1px solid var(--v1-border-subtle)" }}>
                {paging.error ? (
                  <p className="px-5 py-3 text-[12px]" style={{ color: "var(--v1-danger)" }}>
                    {paging.error}
                  </p>
                ) : paging.rows.length === 0 ? (
                  <p className="px-5 py-8 text-center text-[12px]" style={{ color: "var(--v1-ink-faint)" }}>
                    {paging.loading ? "Memuat..." : "Belum ada kendaraan yang masuk/keluar area."}
                  </p>
                ) : (
                  <>
                    <ul>
                      {paging.rows.map((ev) => {
                        const isEnter = ev.event_type === "geofenceEnter";
                        const pt = eventPoint(ev);
                        const hasPoint = pt.lat !== null && pt.lng !== null;
                        return (
                          <li
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
                            className="group flex items-center gap-3 px-5 py-2.5 border-b last:border-0 cursor-pointer transition-colors hover:bg-(--v1-surface-raised) focus:outline-none"
                            style={{ borderBottomColor: "var(--v1-border-subtle)" }}
                          >
                            <span
                              className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full"
                              style={{
                                background: isEnter ? "var(--v1-success-bg)" : "var(--v1-danger-bg)",
                                color: isEnter ? "var(--v1-success)" : "var(--v1-danger)",
                              }}
                            >
                              {isEnter ? <LogIn className="w-3.5 h-3.5" /> : <LogOut className="w-3.5 h-3.5" />}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] truncate" style={{ color: "var(--v1-ink)" }}>
                                <span className="font-semibold">{fenceName(ev.attributes_json)}</span>
                                <span style={{ color: "var(--v1-ink-muted)" }}>
                                  {" — "}
                                  {isEnter ? "masuk" : "keluar"}
                                </span>
                              </p>
                              {ev.message && (
                                <p className="text-[11px] truncate" style={{ color: "var(--v1-ink-faint)" }}>
                                  {ev.message}
                                </p>
                              )}
                            </div>
                            <span className="shrink-0 text-[11px]" style={{ color: "var(--v1-ink-faint)" }}>
                              {formatDateTimeSec(ev.event_time)}
                            </span>
                            <MapPinned
                              className="w-4 h-4 shrink-0"
                              style={{ color: hasPoint ? "var(--v1-ink-faint)" : "var(--v1-border)" }}
                            />
                          </li>
                        );
                      })}
                    </ul>

                    <PaginationBar
                      page={paging.page}
                      limit={paging.limit}
                      canPrev={paging.page > 1}
                      canNext={paging.hasNext}
                      loading={paging.loading}
                      maxVisitedPage={paging.maxVisitedPage}
                      onPrev={paging.goPrev}
                      onNext={paging.goNext}
                      onPageJump={paging.goPage}
                    />
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Peta area geofence + titik event */}
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
