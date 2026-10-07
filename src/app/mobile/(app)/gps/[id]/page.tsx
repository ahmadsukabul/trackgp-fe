"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MapPin, RefreshCw, Camera as CameraIcon, ReceiptText, Gauge, Battery, Power } from "lucide-react";
import type { MapMarker } from "../../../../v1/components/MapCanvas";
import { useBusiness } from "../../../../v1/lib/BusinessContext";
import { MENU } from "../../../../v1/lib/menu";
import { getApiErrorMessage } from "../../../../v1/lib/api";
import {
  deviceDetail,
  devicePositions,
  cameraList,
  geofenceEvents,
  type Device,
  type Camera,
  type GPSEvent,
  type DevicePosition,
} from "../../../../v1/lib/client";
import { formatDate, formatDateTimeSec, formatRelative } from "@/lib/format-date";
import { expiryDaysLeft, expiryStatus } from "@/lib/expiry";
import { MStatus } from "../../../_ui";

const Map = dynamic(() => import("@/app/v1/components/MapCanvas"), {
  ssr: false,
  loading: () => <div style={{ height: 240, background: "var(--v1-surface-raised)" }} />,
});

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="m-row-between" style={{ padding: "11px 0", borderBottom: "1px solid var(--v1-border-subtle)" }}>
      <span className="m-faint" style={{ fontSize: 12 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, textAlign: "right", maxWidth: "60%", wordBreak: "break-word" }}>{value || "-"}</span>
    </div>
  );
}

export default function MobileGpsDetailPage() {
  const params = useParams();
  const deviceId = decodeURIComponent(String(params?.id ?? ""));
  const { can } = useBusiness();

  const [device, setDevice] = useState<Device | null>(null);
  const [pos, setPos] = useState<DevicePosition | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [events, setEvents] = useState<GPSEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    setError("");
    const [dRes, pRes, cRes, eRes] = await Promise.all([
      deviceDetail(deviceId),
      devicePositions(),
      can(MENU.camera) ? cameraList(deviceId) : Promise.resolve({ status: 1, rc: 200, data: [] as Camera[] }),
      can(MENU.geofence)
        ? geofenceEvents({ device_id: deviceId, limit: 20 })
        : Promise.resolve({ status: 1, rc: 200, data: [] as GPSEvent[] }),
    ]);

    if (dRes.status === 1 && dRes.data) setDevice(dRes.data);
    else setError(getApiErrorMessage(dRes, "Gagal memuat perangkat."));

    if (pRes.status === 1 && Array.isArray(pRes.data)) {
      setPos(pRes.data.find((p) => p.device_id === deviceId) ?? null);
    }
    if (cRes.status === 1 && Array.isArray(cRes.data)) setCameras(cRes.data);
    if (eRes.status === 1 && Array.isArray(eRes.data)) setEvents(eRes.data);

    setLoading(false);
  }, [deviceId, can]);

  useEffect(() => {
    load();
  }, [load]);

  const hasPos = !!pos && (pos.latitude !== 0 || pos.longitude !== 0);
  const markers: MapMarker[] = hasPos
    ? [
        {
          id: deviceId,
          name: device?.name || deviceId,
          latitude: pos!.latitude,
          longitude: pos!.longitude,
          status: device?.status || pos!.status || "",
          ignition: pos!.ignition,
          speed: pos!.speed,
          plate: device?.protocol,
          lastSeen: formatDateTimeSec(pos!.device_time || pos!.last_seen_at),
        },
      ]
    : [];

  const expStatus = expiryStatus(device?.expired_at);
  const daysLeft = expiryDaysLeft(device?.expired_at);

  return (
    <>
      {error && <div className="m-error">{error}</div>}

      <div className="m-card">
        {hasPos ? (
          <Map markers={markers} height={240} onSelect={() => undefined} />
        ) : (
          <div className="m-empty" style={{ border: "none" }}>
            <MapPin className="w-6 h-6" />
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--v1-ink-muted)" }}>
              {loading ? "Memuat posisi..." : "Belum ada posisi terakhir."}
            </p>
          </div>
        )}

        <div className="m-card-pad" style={{ borderTop: "1px solid var(--v1-border)" }}>
          <div className="m-row-between">
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 16, fontWeight: 700 }}>{device?.name || deviceId}</p>
              <p className="m-faint" style={{ fontSize: 11, fontFamily: "var(--v1-font-display)" }}>{device?.unique_id || "-"}</p>
            </div>
            {device && <MStatus value={device.status} />}
          </div>

          {hasPos && (
            <div className="m-stat-grid" style={{ marginTop: 14 }}>
              <Metric icon={Gauge} label="Kecepatan" value={`${Math.round(pos!.speed || 0)} km/j`} />
              <Metric icon={Power} label="Mesin" value={pos!.ignition ? "Menyala" : "Mati"} />
              <Metric icon={Battery} label="Baterai" value={device?.battery_level ? `${device.battery_level}%` : "-"} />
              <Metric icon={MapPin} label="Koordinat" value={`${pos!.latitude.toFixed(4)}, ${pos!.longitude.toFixed(4)}`} />
            </div>
          )}

          {hasPos && pos!.address && (
            <p className="m-faint m-row" style={{ gap: 6, fontSize: 12, marginTop: 12 }}>
              <MapPin className="w-3.5 h-3.5 shrink-0" /> {pos!.address}
            </p>
          )}

          <div className="m-row" style={{ gap: 8, marginTop: 12 }}>
            <button type="button" className="m-iconbtn" aria-label="Muat ulang" onClick={load}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <span className="m-faint" style={{ fontSize: 11 }}>
              Terakhir online {device?.last_seen_at ? `${formatDateTimeSec(device.last_seen_at)} · ${formatRelative(device.last_seen_at)}` : "-"}
            </span>
          </div>
        </div>
      </div>

      <div className="m-card m-card-pad">
        <p className="m-section-title">Info perangkat</p>
        <InfoRow label="ID perangkat" value={device?.device_id} />
        <InfoRow label="IMEI" value={device?.unique_id} />
        <InfoRow label="Protokol" value={device?.protocol?.toUpperCase()} />
        <InfoRow label="Model" value={device?.model} />
        <InfoRow label="Kategori" value={device?.category} />
        <InfoRow
          label="Langganan"
          value={
            device?.expired_at ? (
              <span style={{ color: expStatus === "blocked" ? "var(--v1-danger)" : expStatus === "soon" || expStatus === "grace" ? "var(--v1-warning)" : "var(--v1-ink)" }}>
                {formatDate(device.expired_at)}
                {daysLeft !== null && (
                  <span style={{ fontWeight: 500 }}> · {daysLeft >= 0 ? `${daysLeft} hari lagi` : `${Math.abs(daysLeft)} hari lalu`}</span>
                )}
              </span>
            ) : "-"
          }
        />
        {can(MENU.invoice) && (
          <Link
            href={`/mobile/invoice?device_id=${encodeURIComponent(deviceId)}`}
            className="m-btn m-btn-block"
            style={{ marginTop: 14 }}
          >
            <ReceiptText size={16} /> Lihat langganan
          </Link>
        )}
      </div>

      {can(MENU.camera) && (
        <div className="m-card m-card-pad">
          <p className="m-section-title">Kamera ({cameras.length})</p>
          {cameras.length === 0 ? (
            <p className="m-faint" style={{ fontSize: 13 }}>Belum ada kamera terhubung.</p>
          ) : (
            <div className="m-list" style={{ border: "none" }}>
              {cameras.map((cam) => (
                <div key={cam.camera_id} className="m-list-item" style={{ paddingLeft: 0, paddingRight: 0 }}>
                  <span className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, background: "var(--v1-surface-raised)", color: "var(--v1-ink-muted)" }}>
                    <CameraIcon className="w-4 h-4" />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{cam.name}</p>
                    <p className="m-faint" style={{ fontSize: 11 }}>ch {cam.channel}{cam.stream_url ? ` · ${cam.stream_url}` : ""}</p>
                  </div>
                  <MStatus value={cam.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {can(MENU.geofence) && (
        <div className="m-card m-card-pad">
          <p className="m-section-title">Event geofence</p>
          {events.length === 0 ? (
            <p className="m-faint" style={{ fontSize: 13 }}>Belum ada event.</p>
          ) : (
            <div className="m-list" style={{ border: "none" }}>
              {events.map((ev) => (
                <div key={ev.event_id} className="m-list-item" style={{ paddingLeft: 0, paddingRight: 0, flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{ev.message || ev.event_type}</p>
                  <p className="m-faint" style={{ fontSize: 11 }}>{formatDateTimeSec(ev.event_time || ev.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function Metric({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="m-row" style={{ gap: 8, padding: "10px 12px", background: "var(--v1-surface-raised)" }}>
      <Icon className="w-4 h-4" />
      <div>
        <p className="m-faint" style={{ fontSize: 10 }}>{label}</p>
        <p style={{ fontSize: 13, fontWeight: 700 }}>{value}</p>
      </div>
    </div>
  );
}
