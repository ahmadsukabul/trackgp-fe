"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CrudPage, { StatusBadge, type Column } from "../components/CrudPage";
import ModalForm, { type Field } from "../components/ModalForm";
import { useBusiness } from "../lib/BusinessContext";
import { useBasePath } from "../lib/base-path";
import { MENU } from "../lib/menu";
import { getApiErrorMessage } from "../lib/api";
import { formatDate, formatDateTimeSec, formatRelative } from "@/lib/format-date";
import { expiryDaysLeft, expiryStatus, type ExpiryStatus } from "@/lib/expiry";
import {
  deviceList,
  cameraList,
  cameraCreate,
  type Device,
  type Camera,
} from "../lib/client";

type FormState = Record<string, string>;

/** Warna status langganan device untuk kolom "Berakhir". */
const EXPIRY_COLOR: Record<ExpiryStatus, string> = {
  none: "var(--v1-ink-faint)",
  active: "var(--v1-success, #16a34a)",
  soon: "#d97706",
  grace: "#d97706",
  blocked: "var(--v1-danger)",
};

/** Sel "Berakhir": tanggal + label relatif ("30 hari lagi" / "2 hari lalu"). */
function ExpiryCell({ expiredAt }: { expiredAt?: string }) {
  if (!expiredAt) return <span style={{ color: "var(--v1-ink-faint)" }}>-</span>;
  const status = expiryStatus(expiredAt);
  const days = expiryDaysLeft(expiredAt);
  const rel =
    days === null
      ? ""
      : days === 0
        ? "hari ini"
        : days > 0
          ? `${days} hari lagi`
          : `${Math.abs(days)} hari lalu`;
  return (
    <div className="leading-tight">
      <p className="text-[13px]" style={{ color: "var(--v1-ink)" }}>{formatDate(expiredAt)}</p>
      <p className="text-[11px] font-medium" style={{ color: EXPIRY_COLOR[status] }}>{rel}</p>
    </div>
  );
}

export default function GpsPage() {
  const { can } = useBusiness();
  const base = useBasePath();
  const allowed = can(MENU.gps);
  const router = useRouter();

  const [rows, setRows] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Kamera yang menempel ke satu perangkat (panel detail).
  const [camerasOf, setCamerasOf] = useState<Device | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraForm, setCameraForm] = useState<FormState>({});
  const [cameraError, setCameraError] = useState("");
  const [cameraBusy, setCameraBusy] = useState(false);

  const load = useCallback(async () => {
    if (!allowed) {
      setLoading(false);
      setError("Akun ini tidak punya akses ke menu GPS.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await deviceList();
    if (res.status === 1 && Array.isArray(res.data)) setRows(res.data);
    else setError(getApiErrorMessage(res, "Gagal memuat perangkat."));
    setLoading(false);
  }, [allowed]);

  useEffect(() => {
    load();
  }, [load]);

  async function openCameras(d: Device) {
    setCamerasOf(d);
    setCameras([]);
    setCameraError("");
    const res = await cameraList(d.device_id);
    if (res.status === 1 && Array.isArray(res.data)) setCameras(res.data);
    else setCameraError(getApiErrorMessage(res, "Gagal memuat kamera."));
  }

  async function submitCamera() {
    if (!camerasOf) return;
    setCameraBusy(true);
    setCameraError("");
    const channel = Number(cameraForm.channel) || 1;
    const res = await cameraCreate({
      device_id: camerasOf.device_id,
      name: cameraForm.name,
      serial_number: cameraForm.serial_number,
      stream_url: cameraForm.stream_url,
      channel,
    });

    if (res.status === 1) {
      setCameraOpen(false);
      const list = await cameraList(camerasOf.device_id);
      if (list.status === 1 && Array.isArray(list.data)) setCameras(list.data);
    } else {
      setCameraError(getApiErrorMessage(res, "Gagal menyimpan kamera."));
    }
    setCameraBusy(false);
  }

  const columns: Column<Device>[] = [
    {
      key: "device_id",
      label: "ID",
      render: (d) => (
        <div className="leading-tight">
          <button
            type="button"
            onClick={() => router.push(`${base}/gps/${encodeURIComponent(d.device_id)}`)}
            title="Lihat detail perangkat"
            className="font-semibold text-[13px] text-left hover:underline"
            style={{ color: "var(--v1-link)", fontFamily: "var(--v1-font-display)" }}
          >
            {d.device_id || "-"}
          </button>
          {d.name ? (
            <p className="text-[11px]" style={{ color: "var(--v1-ink-faint)" }}>{d.name}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "unique_id",
      label: "IMEI",
      render: (d) => (
        <span style={{ color: "var(--v1-ink-muted)" }}>{d.unique_id || "-"}</span>
      ),
    },
    { key: "protocol", label: "Protokol", render: (d) => d.protocol?.toUpperCase() || "-" },
    { key: "status", label: "Status", render: (d) => <StatusBadge value={d.status} /> },
    {
      key: "expired_at",
      label: "Berakhir",
      render: (d) => <ExpiryCell expiredAt={d.expired_at} />,
    },
    {
      key: "last_seen_at",
      label: "Terakhir online",
      render: (d) =>
        d.last_seen_at ? (
          <div className="leading-tight">
            <p className="text-[13px]" style={{ color: "var(--v1-ink)" }}>{formatDateTimeSec(d.last_seen_at)}</p>
            <p className="text-[11px]" style={{ color: "var(--v1-ink-faint)" }}>{formatRelative(d.last_seen_at)}</p>
          </div>
        ) : (
          <span style={{ color: "var(--v1-ink-faint)" }}>-</span>
        ),
    },
  ];

  const cameraFields: Field[] = [
    { name: "name", label: "Nama kamera", required: true, placeholder: "Kamera Depan" },
    { name: "serial_number", label: "Serial number" },
    { name: "stream_url", label: "URL stream", placeholder: "rtsp://..." },
    { name: "channel", label: "Channel", type: "number", placeholder: "1" },
  ];

  return (
    <>
      <CrudPage<Device>
        title="Perangkat GPS"
        description="Daftar perangkat GPS milik bisnis aktif. Kamera dipasang menempel ke salah satu perangkat ini."
        columns={columns}
        rows={rows}
        loading={loading}
        error={allowed ? error : ""}
        searchPlaceholder="Cari ID atau nama..."
        rowKey={(d) => d.device_id}
        onRefresh={load}
        extraActions={(d) => (
          <>
            {can(MENU.invoice) && (
              <button
                onClick={() => router.push(`${base}/invoice?device_id=${encodeURIComponent(d.device_id)}`)}
                className="px-2.5 py-1.5 text-[12px] font-semibold rounded-lg transition-colors"
                style={{ color: "var(--v1-accent)" }}
              >
                Langganan
              </button>
            )}
            <button
              onClick={() => openCameras(d)}
              className="px-2.5 py-1.5 text-[12px] font-semibold rounded-lg transition-colors"
              style={{ color: "var(--v1-ink-muted)" }}
            >
              Kamera
            </button>
          </>
        )}
      />

      {/* Panel daftar kamera milik satu perangkat */}
      {camerasOf && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCamerasOf(null)} />
          <div className="relative w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden" style={{ background: "var(--v1-surface)", border: "1px solid var(--v1-border)" }}>
            <div className="flex items-start justify-between px-6 py-5" style={{ borderBottom: "1px solid var(--v1-border-subtle)" }}>
              <div>
                <h2 className="text-[16px] font-bold" style={{ color: "var(--v1-ink)" }}>
                  Kamera · {camerasOf.name || camerasOf.unique_id}
                </h2>
                <p className="mt-0.5 text-[12px]" style={{ color: "var(--v1-ink-faint)", fontFamily: "var(--v1-font-display)" }}>{camerasOf.unique_id}</p>
              </div>
              <div className="flex items-center gap-2">
                {can(MENU.camera) && (
                  <button
                    onClick={() => {
                      setCameraForm({ channel: "1" });
                      setCameraError("");
                      setCameraOpen(true);
                    }}
                    className="px-3 py-1.5 text-white text-[12px] font-semibold rounded-lg transition-colors"
                    style={{ background: "var(--v1-accent)" }}
                  >
                    Tambah Kamera
                  </button>
                )}
                <button
                  onClick={() => setCamerasOf(null)}
                  className="px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-colors"
                  style={{ color: "var(--v1-ink-faint)" }}
                >
                  Tutup
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[50vh] overflow-y-auto">
              {cameraError && !cameraOpen && (
                <div className="mb-4 px-4 py-3 rounded-xl text-[13px]" style={{ background: "var(--v1-danger-bg)", border: "1px solid var(--v1-danger-border)", color: "var(--v1-danger)" }}>
                  {cameraError}
                </div>
              )}
              {cameras.length === 0 ? (
                <p className="text-[13px] text-center py-8" style={{ color: "var(--v1-ink-faint)" }}>
                  Belum ada kamera terhubung ke GPS ini.
                </p>
              ) : (
                <ul className="space-y-2">
                  {cameras.map((cam) => (
                    <li
                      key={cam.camera_id}
                      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
                      style={{ border: "1px solid var(--v1-border)" }}
                    >
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
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge value={cam.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <ModalForm
        open={cameraOpen}
        title="Tambah Kamera"
        description={`Dipasang pada GPS: ${camerasOf?.name ?? ""}`}
        fields={cameraFields}
        values={cameraForm}
        submitting={cameraBusy}
        error={cameraError}
        submitLabel="Simpan Kamera"
        onChange={(name, value) => setCameraForm((f) => ({ ...f, [name]: value }))}
        onSubmit={submitCamera}
        onClose={() => setCameraOpen(false)}
      />
    </>
  );
}
