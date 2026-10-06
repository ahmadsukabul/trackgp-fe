"use client";

import { useCallback, useEffect, useState } from "react";
import CrudPage, { StatusBadge, type Column } from "../components/CrudPage";
import ModalForm, { type Field } from "../components/ModalForm";
import ConfirmModal from "../components/ConfirmModal";
import { useBusiness } from "../lib/BusinessContext";
import { MENU } from "../lib/menu";
import { getApiErrorMessage } from "../lib/api";
import { formatDateTimeSec } from "@/lib/format-date";
import {
  deviceList,
  deviceCreate,
  deviceUpdate,
  deviceDelete,
  cameraList,
  cameraCreate,
  cameraUpdate,
  cameraDelete,
  type Device,
  type Camera,
} from "../lib/client";

const PROTOCOLS = ["gt06", "tk103", "teltonika", "queclink", "others"].map((p) => ({
  value: p,
  label: p.toUpperCase(),
}));

type FormState = Record<string, string>;

export default function GpsPage() {
  const { can } = useBusiness();
  const allowed = can(MENU.gps);

  const [rows, setRows] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Device | null>(null);
  const [form, setForm] = useState<FormState>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [toDelete, setToDelete] = useState<Device | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Kamera yang menempel ke satu perangkat (panel detail).
  const [camerasOf, setCamerasOf] = useState<Device | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraForm, setCameraForm] = useState<FormState>({});
  const [cameraEditing, setCameraEditing] = useState<Camera | null>(null);
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

  function openAdd() {
    setEditing(null);
    setForm({});
    setFormError("");
    setOpen(true);
  }

  function openEdit(d: Device) {
    setEditing(d);
    setForm({
      name: d.name ?? "",
      unique_id: d.unique_id ?? "",
      protocol: d.protocol ?? "",
      model: d.model ?? "",
      category: d.category ?? "",
      sim_number: d.sim_number ?? "",
      phone_number: d.phone_number ?? "",
      speed_threshold: d.speed_threshold ? String(d.speed_threshold) : "",
    });
    setFormError("");
    setOpen(true);
  }

  async function submit() {
    setSubmitting(true);
    setFormError("");
    const res = editing
      ? await deviceUpdate({
          device_id: editing.device_id,
          name: form.name,
          protocol: form.protocol,
          model: form.model,
          category: form.category,
          sim_number: form.sim_number,
          phone_number: form.phone_number,
          speed_threshold: Number(form.speed_threshold) || 0,
        })
      : await deviceCreate({
          name: form.name,
          unique_id: form.unique_id,
          protocol: form.protocol,
          model: form.model,
          category: form.category,
          sim_number: form.sim_number,
          phone_number: form.phone_number,
        });

    if (res.status === 1) {
      setOpen(false);
      await load();
    } else {
      setFormError(getApiErrorMessage(res, "Gagal menyimpan perangkat."));
    }
    setSubmitting(false);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const res = await deviceDelete(toDelete.device_id);
    setDeleting(false);
    setToDelete(null);
    if (res.status === 1) await load();
    else setError(getApiErrorMessage(res, "Gagal menghapus perangkat."));
  }

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
    const res = cameraEditing
      ? await cameraUpdate({
          camera_id: cameraEditing.camera_id,
          name: cameraForm.name,
          serial_number: cameraForm.serial_number,
          stream_url: cameraForm.stream_url,
          channel,
        })
      : await cameraCreate({
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
      key: "name",
      label: "Nama",
      render: (d) => (
        <div>
          <p className="font-semibold" style={{ color: "var(--v1-ink)" }}>{d.name}</p>
          <p className="text-[12px] font-mono" style={{ color: "var(--v1-ink-faint)", fontFamily: "var(--v1-font-display)" }}>{d.unique_id}</p>
        </div>
      ),
    },
    { key: "protocol", label: "Protokol", render: (d) => d.protocol?.toUpperCase() || "-" },
    { key: "model", label: "Model", render: (d) => d.model || "-" },
    { key: "sim_number", label: "SIM", render: (d) => d.sim_number || "-" },
    { key: "status", label: "Status", render: (d) => <StatusBadge value={d.status} /> },
    {
      key: "last_seen_at",
      label: "Terakhir online",
      render: (d) => <span style={{ color: "var(--v1-ink-faint)" }}>{d.last_seen_at ? formatDateTimeSec(d.last_seen_at) : "-"}</span>,
    },
  ];

  const fields: Field[] = [
    { name: "name", label: "Nama perangkat", required: true, placeholder: "GPS Mobil B-1234" },
    {
      name: "unique_id",
      label: "IMEI / Unique ID",
      required: !editing,
      disabled: !!editing,
      placeholder: "860000000000000",
      hint: editing ? "IMEI tidak bisa diubah." : "Nomor identitas hardware perangkat.",
    },
    { name: "protocol", label: "Protokol", type: "select", options: PROTOCOLS },
    { name: "model", label: "Model", placeholder: "GT06" },
    { name: "category", label: "Kategori", placeholder: "car / truck / motorcycle" },
    { name: "sim_number", label: "Nomor SIM", placeholder: "0812xxxxxxx" },
    { name: "phone_number", label: "Nomor telepon perangkat", placeholder: "0812xxxxxxx" },
  ];
  if (editing) {
    fields.push({
      name: "speed_threshold",
      label: "Batas kecepatan (km/h)",
      type: "number",
      hint: "0 = nonaktif",
    });
  }

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
        searchPlaceholder="Cari nama atau IMEI..."
        addLabel="Tambah GPS"
        canAdd={allowed}
        rowKey={(d) => d.device_id}
        onRefresh={load}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={(d) => setToDelete(d)}
        extraActions={(d) => (
          <button
            onClick={() => openCameras(d)}
            className="px-2.5 py-1.5 text-[12px] font-semibold rounded-lg transition-colors"
            style={{ color: "var(--v1-ink-muted)" }}
          >
            Kamera
          </button>
        )}
      />

      <ModalForm
        open={open}
        title={editing ? "Edit Perangkat GPS" : "Tambah Perangkat GPS"}
        fields={fields}
        values={form}
        submitting={submitting}
        error={formError}
        onChange={(name, value) => setForm((f) => ({ ...f, [name]: value }))}
        onSubmit={submit}
        onClose={() => setOpen(false)}
      />

      <ConfirmModal
        open={!!toDelete}
        danger
        title="Hapus perangkat GPS?"
        message={`Perangkat "${toDelete?.name}" akan dihapus permanen dari bisnis ini.`}
        confirmLabel="Hapus"
        submitting={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />

      {/* Panel daftar kamera milik satu perangkat */}
      {camerasOf && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCamerasOf(null)} />
          <div className="relative w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden" style={{ background: "var(--v1-surface)", border: "1px solid var(--v1-border)" }}>
            <div className="flex items-start justify-between px-6 py-5" style={{ borderBottom: "1px solid var(--v1-border-subtle)" }}>
              <div>
                <h2 className="text-[16px] font-bold" style={{ color: "var(--v1-ink)" }}>
                  Kamera · {camerasOf.name}
                </h2>
                <p className="mt-0.5 text-[12px] font-mono" style={{ color: "var(--v1-ink-faint)", fontFamily: "var(--v1-font-display)" }}>{camerasOf.unique_id}</p>
              </div>
              <div className="flex items-center gap-2">
                {can(MENU.camera) && (
                  <button
                    onClick={() => {
                      setCameraEditing(null);
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
                        {can(MENU.camera) && (
                          <button
                            onClick={() => {
                              setCameraEditing(cam);
                              setCameraForm({
                                name: cam.name ?? "",
                                serial_number: cam.serial_number ?? "",
                                stream_url: cam.stream_url ?? "",
                                channel: String(cam.channel ?? 1),
                              });
                              setCameraError("");
                              setCameraOpen(true);
                            }}
                            className="px-2.5 py-1 text-[12px] font-semibold rounded-lg transition-colors"
                            style={{ color: "var(--v1-accent)" }}
                          >
                            Edit
                          </button>
                        )}
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
        title={cameraEditing ? "Edit Kamera" : "Tambah Kamera"}
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
