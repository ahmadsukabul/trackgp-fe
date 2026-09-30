"use client";

import { useCallback, useEffect, useState } from "react";
import CrudPage, { type Column } from "../components/CrudPage";
import ModalForm, { type Field } from "../components/ModalForm";
import ConfirmModal from "../components/ConfirmModal";
import { useBusiness } from "../lib/BusinessContext";
import { MENU } from "../lib/menu";
import { getApiErrorMessage } from "../lib/api";
import {
  vehicleList,
  vehicleCreate,
  vehicleUpdate,
  vehicleDelete,
  vehicleUpdate as vehicleUpdateApi,
  deviceList,
  type Vehicle,
  type Device,
} from "../lib/client";
import { Radio } from "lucide-react";

type FormState = Record<string, string>;

const VEHICLE_TYPES = ["sedan", "pickup", "truck", "bus", "motorcycle", "other"].map((v) => ({
  value: v,
  label: v.charAt(0).toUpperCase() + v.slice(1),
}));

/** 1 = aktif, 0 = nonaktif (kolom status tinyint di BE). */
const STATUS_OPTIONS = [
  { value: "1", label: "Aktif" },
  { value: "0", label: "Nonaktif" },
];

export default function VehiclePage() {
  const { can } = useBusiness();
  const allowed = can(MENU.vehicle);

  const [rows, setRows] = useState<Vehicle[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<FormState>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [toDelete, setToDelete] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ---- device picker ---- */
  const [deviceModal, setDeviceModal] = useState<Vehicle | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [deviceSaving, setDeviceSaving] = useState(false);

  const load = useCallback(async () => {
    if (!allowed) {
      setLoading(false);
      setError("Akun ini tidak punya akses ke menu Kendaraan.");
      return;
    }
    setLoading(true);
    setError("");

    const [vehRes, devRes] = await Promise.all([vehicleList(), deviceList()]);

    if (vehRes.status === 1 && Array.isArray(vehRes.data)) setRows(vehRes.data);
    else setError(getApiErrorMessage(vehRes, "Gagal memuat kendaraan."));
    if (devRes.status === 1 && Array.isArray(devRes.data)) setDevices(devRes.data);
    setLoading(false);
  }, [allowed]);

  useEffect(() => {
    load();
  }, [load]);

  const deviceOptions = devices.map((d) => ({ value: d.device_id, label: `${d.name} · ${d.unique_id}` }));
  const deviceName = (id: string) => devices.find((d) => d.device_id === id)?.name ?? id;

  function openAdd() {
    setEditing(null);
    setForm({ status: "1" });
    setFormError("");
    setOpen(true);
  }

  function openEdit(v: Vehicle) {
    setEditing(v);
    setForm({
      name: v.name ?? "",
      license_plate: v.license_plate ?? "",
      vehicle_type: v.vehicle_type ?? "",
      brand: v.brand ?? "",
      model: v.model ?? "",
      year: v.year ? String(v.year) : "",
      color: v.color ?? "",
      vin_number: v.vin_number ?? "",
      device_id: v.device_id ?? "",
      odometer_km: v.odometer_km ? String(v.odometer_km) : "",
      status: String(v.status ?? 1),
    });
    setFormError("");
    setOpen(true);
  }

  async function submit() {
    setSubmitting(true);
    setFormError("");

    const shared = {
      name: form.name,
      license_plate: form.license_plate,
      vehicle_type: form.vehicle_type,
      brand: form.brand,
      model: form.model,
      year: Number(form.year) || 0,
      color: form.color,
      vin_number: form.vin_number,
      device_id: form.device_id,
      odometer_km: Number(form.odometer_km) || 0,
    };

    const res = editing
      ? await vehicleUpdate({ ...shared, vehicle_id: editing.vehicle_id, status: Number(form.status) || 0 })
      : await vehicleCreate(shared);

    if (res.status === 1) {
      setOpen(false);
      await load();
    } else {
      setFormError(getApiErrorMessage(res, "Gagal menyimpan kendaraan."));
    }
    setSubmitting(false);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const res = await vehicleDelete(toDelete.vehicle_id);
    setDeleting(false);
    setToDelete(null);
    if (res.status === 1) await load();
    else setError(getApiErrorMessage(res, "Gagal menghapus kendaraan."));
  }

  /* ---- device picker handlers ---- */

  function openDeviceModal(v: Vehicle) {
    setDeviceModal(v);
    setSelectedDeviceId(v.device_id ?? "");
  }

  async function saveDeviceLink() {
    if (!deviceModal || !selectedDeviceId) return;
    setDeviceSaving(true);
    const res = await vehicleUpdateApi({
      vehicle_id: deviceModal.vehicle_id,
      device_id: selectedDeviceId,
    });
    setDeviceSaving(false);
    if (res.status === 1) {
      setDeviceModal(null);
      await load();
    } else {
      setError(getApiErrorMessage(res, "Gagal menghubungkan GPS."));
    }
  }

  const columns: Column<Vehicle>[] = [
    {
      key: "name",
      label: "Kendaraan",
      render: (v) => (
        <div>
          <p className="font-semibold" style={{ color: "var(--v1-ink)" }}>{v.name}</p>
          <p className="text-[12px] font-mono" style={{ color: "var(--v1-ink-faint)" }}>{v.license_plate || "-"}</p>
        </div>
      ),
    },
    {
      key: "brand",
      label: "Merek / Tipe",
      render: (v) => (
        <span style={{ color: "var(--v1-ink-muted)" }}>
          {[v.brand, v.model].filter(Boolean).join(" ") || "-"}
        </span>
      ),
    },
    { key: "vehicle_type", label: "Kategori", render: (v) => v.vehicle_type || "-" },
    {
      key: "device_id",
      label: "GPS",
      render: (v) =>
        v.device_id ? (
          <span style={{ color: "var(--v1-ink-muted)" }}>{deviceName(v.device_id)}</span>
        ) : (
          <button
            onClick={() => openDeviceModal(v)}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[12px] font-semibold transition-colors"
            style={{ color: "var(--v1-accent)" }}
          >
            <Radio className="w-3.5 h-3.5" />
            <span style={{ color: "var(--v1-ink-faint)" }}>Hubungkan</span>
          </button>
        ),
    },
    {
      key: "status",
      label: "Status",
      render: (v) => (
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
          style={{
            background: v.status === 1 ? "var(--v1-success-bg)" : "var(--v1-surface-raised)",
            color: v.status === 1 ? "var(--v1-success)" : "var(--v1-ink-faint)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: v.status === 1 ? "var(--v1-success)" : "var(--v1-ink-faint)" }}
          />
          {v.status === 1 ? "aktif" : "nonaktif"}
        </span>
      ),
    },
  ];

  const fields: Field[] = [
    { name: "name", label: "Nama kendaraan", required: true, placeholder: "Trenggo 01" },
    { name: "license_plate", label: "Nomor polisi", placeholder: "B 9012 KJA" },
    { name: "vehicle_type", label: "Kategori", type: "select", options: VEHICLE_TYPES },
    { name: "brand", label: "Merek", placeholder: "Mitsubishi" },
    { name: "model", label: "Model", placeholder: "Colt Diesel" },
    { name: "year", label: "Tahun", type: "number", placeholder: "2021" },
    { name: "color", label: "Warna", placeholder: "Putih" },
    { name: "vin_number", label: "Nomor rangka (VIN)" },
    {
      name: "device_id",
      label: "Perangkat GPS",
      type: "select",
      options: deviceOptions,
      hint: "Pasangkan salah satu perangkat GPS milik bisnis ini.",
    },
    { name: "odometer_km", label: "Odometer (km)", type: "number", placeholder: "0" },
    { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
  ];

  return (
    <>
      <CrudPage<Vehicle>
        title="Kendaraan"
        description="Armada milik bisnis aktif, lengkap dengan pasangan GPS dan supirnya."
        columns={columns}
        rows={rows}
        loading={loading}
        error={allowed ? error : ""}
        searchPlaceholder="Cari nama atau nopol..."
        addLabel="Tambah Kendaraan"
        canAdd={allowed}
        rowKey={(v) => v.vehicle_id}
        onRefresh={load}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={(v) => setToDelete(v)}
      />

      <ModalForm
        open={open}
        title={editing ? "Edit Kendaraan" : "Tambah Kendaraan"}
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
        title="Hapus kendaraan?"
        message={`Kendaraan "${toDelete?.name}" akan dihapus permanen dari bisnis ini.`}
        confirmLabel="Hapus"
        submitting={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />

      {/* ---- Modal Hubungkan GPS ---- */}
      {deviceModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !deviceSaving && setDeviceModal(null)}
          />
          <div
            className="relative my-8 w-full max-w-md rounded-2xl shadow-xl"
            style={{ background: "var(--v1-surface)", border: "1px solid var(--v1-border)" }}
          >
            <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--v1-border-subtle)" }}>
              <h2 className="text-[16px] font-bold" style={{ color: "var(--v1-ink)", fontFamily: "var(--v1-font-display)" }}>
                Hubungkan GPS
              </h2>
              <p className="mt-0.5 text-[12px]" style={{ color: "var(--v1-ink-faint)" }}>
                Pilih perangkat GPS untuk <strong>{deviceModal.name}</strong>.
              </p>
            </div>

            <div className="px-6 py-5">
              {devices.length === 0 ? (
                <p className="text-[13px] text-center py-8" style={{ color: "var(--v1-ink-faint)" }}>
                  Belum ada perangkat GPS. Tambah GPS terlebih dahulu.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {devices.map((d) => {
                    const checked = selectedDeviceId === d.device_id;
                    return (
                      <label
                        key={d.device_id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl border text-[13px] cursor-pointer transition-colors"
                        style={{
                          borderColor: checked ? "var(--v1-accent)" : "var(--v1-border)",
                          background: checked ? "var(--v1-accent-light)" : "transparent",
                          color: "var(--v1-ink)",
                        }}
                      >
                        <input
                          type="radio"
                          name="device-pick"
                          checked={checked}
                          onChange={() => setSelectedDeviceId(d.device_id)}
                          className="w-3.5 h-3.5"
                          style={{ accentColor: "var(--v1-accent)" }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">
                            {d.name || "GPS"}
                          </p>
                          <p className="text-[11px] truncate" style={{ color: "var(--v1-ink-faint)" }}>
                            {d.unique_id}
                          </p>
                        </div>
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: d.status === "online" ? "var(--v1-success)" : "var(--v1-ink-faint)" }}
                        />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4" style={{ borderTop: "1px solid var(--v1-border-subtle)" }}>
              <button
                onClick={() => setDeviceModal(null)}
                disabled={deviceSaving}
                className="px-4 py-2.5 text-[13px] font-semibold rounded-xl transition-colors"
                style={{ color: "var(--v1-ink-muted)" }}
              >
                Batal
              </button>
              <button
                onClick={saveDeviceLink}
                disabled={deviceSaving || !selectedDeviceId}
                className="px-4 py-2.5 text-[13px] font-semibold text-white rounded-xl transition-colors disabled:opacity-50"
                style={{ background: "var(--v1-accent)" }}
              >
                {deviceSaving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
