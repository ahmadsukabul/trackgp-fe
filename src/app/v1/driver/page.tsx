"use client";

import { useCallback, useEffect, useState } from "react";
import CrudPage, { type Column } from "../components/CrudPage";
import ModalForm, { type Field } from "../components/ModalForm";
import ConfirmModal from "../components/ConfirmModal";
import { useBusiness } from "../lib/BusinessContext";
import { MENU } from "../lib/menu";
import { getApiErrorMessage } from "../lib/api";
import { formatDate } from "@/lib/format-date";
import {
  driverList,
  driverCreate,
  driverUpdate,
  driverDelete,
  driverAssignVehicles,
  driverVehicles,
  vehicleList,
  type Driver,
  type Vehicle,
} from "../lib/client";
import { Car } from "lucide-react";

type FormState = Record<string, string>;

const STATUS_OPTIONS = [
  { value: "1", label: "Aktif" },
  { value: "0", label: "Nonaktif" },
];

export default function DriverPage() {
  const { can } = useBusiness();
  const allowed = can(MENU.driver);

  const [rows, setRows] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState<FormState>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [toDelete, setToDelete] = useState<Driver | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ---- vehicle assignment ---- */
  const [vehicleModal, setVehicleModal] = useState<Driver | null>(null);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [vehicleSaving, setVehicleSaving] = useState(false);
  const [driverVehicleMap, setDriverVehicleMap] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    if (!allowed) {
      setLoading(false);
      setError("Akun ini tidak punya akses ke menu Supir.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await driverList();
    if (res.status === 1 && Array.isArray(res.data)) setRows(res.data);
    else setError(getApiErrorMessage(res, "Gagal memuat data supir."));
    setLoading(false);
  }, [allowed]);

  useEffect(() => {
    load();
  }, [load]);

  // Muat jumlah kendaraan per supir saat data supir tersedia.
  useEffect(() => {
    if (!rows.length) return;
    let cancelled = false;
    async function fetchCounts() {
      const map: Record<string, number> = {};
      await Promise.all(
        rows.map(async (d) => {
          const res = await driverVehicles(d.driver_id);
          if (!cancelled && res.status === 1 && Array.isArray(res.data)) {
            map[d.driver_id] = res.data.length;
          }
        }),
      );
      if (!cancelled) setDriverVehicleMap(map);
    }
    fetchCounts();
    return () => { cancelled = true; };
  }, [rows]);

  function openAdd() {
    setEditing(null);
    setForm({ status: "1" });
    setFormError("");
    setOpen(true);
  }

  function openEdit(d: Driver) {
    setEditing(d);
    setForm({
      name: d.name ?? "",
      phone: d.phone ?? "",
      email: d.email ?? "",
      license_no: d.license_no ?? "",
      license_exp: (d.license_exp ?? "").slice(0, 10),
      ibutton_id: d.ibutton_id ?? "",
      status: String(d.status ?? 1),
    });
    setFormError("");
    setOpen(true);
  }

  async function submit() {
    setSubmitting(true);
    setFormError("");

    const shared = {
      name: form.name,
      phone: form.phone,
      email: form.email,
      license_no: form.license_no,
      license_exp: form.license_exp,
      ibutton_id: form.ibutton_id,
    };

    const res = editing
      ? await driverUpdate({ ...shared, driver_id: editing.driver_id })
      : await driverCreate(shared);

    if (res.status === 1) {
      setOpen(false);
      await load();
    } else {
      setFormError(getApiErrorMessage(res, "Gagal menyimpan data supir."));
    }
    setSubmitting(false);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const res = await driverDelete(toDelete.driver_id);
    setDeleting(false);
    setToDelete(null);
    if (res.status === 1) await load();
    else setError(getApiErrorMessage(res, "Gagal menghapus supir."));
  }

  /* ---- vehicle assignment handlers ---- */

  async function openVehicleModal(d: Driver) {
    setVehicleModal(d);
    setVehicleLoading(true);
    setAssignedIds(new Set());

    const [vehRes, assignRes] = await Promise.all([vehicleList(), driverVehicles(d.driver_id)]);
    if (vehRes.status === 1 && Array.isArray(vehRes.data)) setAllVehicles(vehRes.data);
    if (assignRes.status === 1 && Array.isArray(assignRes.data)) {
      setAssignedIds(new Set(assignRes.data.map((a) => a.vehicle_id)));
    }
    setVehicleLoading(false);
  }

  function toggleVehicle(vid: string) {
    setAssignedIds((prev) => {
      const next = new Set(prev);
      if (next.has(vid)) next.delete(vid);
      else next.add(vid);
      return next;
    });
  }

  async function saveVehicleAssignment() {
    if (!vehicleModal) return;
    setVehicleSaving(true);
    const res = await driverAssignVehicles(vehicleModal.driver_id, Array.from(assignedIds));
    setVehicleSaving(false);
    if (res.status === 1) {
      setVehicleModal(null);
      await load();
    } else {
      setError(getApiErrorMessage(res, "Gagal menyimpan kendaraan."));
    }
  }

  const columns: Column<Driver>[] = [
    {
      key: "name",
      label: "Nama",
      render: (d) => (
        <div>
          <p className="font-semibold" style={{ color: "var(--v1-ink)" }}>{d.name}</p>
          <p className="text-[12px]" style={{ color: "var(--v1-ink-faint)" }}>{d.phone || "-"}</p>
        </div>
      ),
    },
    { key: "email", label: "Email", render: (d) => d.email || "-" },
    {
      key: "license_no",
      label: "SIM",
      render: (d) => (
        <div>
          <p className="font-mono text-[12px]" style={{ color: "var(--v1-ink-muted)" }}>{d.license_no || "-"}</p>
          {d.license_exp && <p className="text-[11px]" style={{ color: "var(--v1-ink-faint)" }}>exp {formatDate(d.license_exp)}</p>}
        </div>
      ),
    },
    {
      key: "vehicles",
      label: "Kendaraan",
      render: (d) => {
        const count = driverVehicleMap[d.driver_id] ?? 0;
        return (
          <button
            onClick={() => openVehicleModal(d)}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[12px] font-semibold transition-colors"
            style={{ color: "var(--v1-accent)" }}
          >
            <Car className="w-3.5 h-3.5" />
            {count > 0 ? (
              <span>{count} kendaraan</span>
            ) : (
              <span style={{ color: "var(--v1-ink-faint)" }}>Hubungkan</span>
            )}
          </button>
        );
      },
    },
    { key: "ibutton_id", label: "iButton", render: (d) => d.ibutton_id || "-" },
    {
      key: "status",
      label: "Status",
      render: (d) => (
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
          style={{
            background: d.status === 1 ? "var(--v1-success-bg)" : "var(--v1-surface-raised)",
            color: d.status === 1 ? "var(--v1-success)" : "var(--v1-ink-faint)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: d.status === 1 ? "var(--v1-success)" : "var(--v1-ink-faint)" }}
          />
          {d.status === 1 ? "aktif" : "nonaktif"}
        </span>
      ),
    },
  ];

  const fields: Field[] = [
    { name: "name", label: "Nama supir", required: true, placeholder: "Budi Santoso" },
    { name: "phone", label: "Nomor telepon", placeholder: "0812xxxxxxx" },
    { name: "email", label: "Email", type: "email" },
    { name: "license_no", label: "Nomor SIM" },
    { name: "license_exp", label: "Masa berlaku SIM", type: "date" },
    { name: "ibutton_id", label: "iButton ID", hint: "Kunci perangkat / absensi supir." },
    { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
  ];

  return (
    <>
      <CrudPage<Driver>
        title="Supir"
        description="Data pengemudi yang bisa ditugaskan ke kendaraan di bisnis aktif."
        columns={columns}
        rows={rows}
        loading={loading}
        error={allowed ? error : ""}
        searchPlaceholder="Cari nama atau SIM..."
        addLabel="Tambah Supir"
        canAdd={allowed}
        rowKey={(d) => d.driver_id}
        onRefresh={load}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={(d) => setToDelete(d)}
      />

      <ModalForm
        open={open}
        title={editing ? "Edit Supir" : "Tambah Supir"}
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
        title="Hapus supir?"
        message={`Supir "${toDelete?.name}" akan dihapus permanen dari bisnis ini.`}
        confirmLabel="Hapus"
        submitting={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />

      {/* ---- Modal Hubungkan Kendaraan ---- */}
      {vehicleModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !vehicleSaving && setVehicleModal(null)}
          />
          <div className="relative my-8 w-full max-w-lg rounded-2xl shadow-xl"
            style={{ background: "var(--v1-surface)", border: "1px solid var(--v1-border)" }}>
            <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--v1-border-subtle)" }}>
              <h2 className="text-[16px] font-bold" style={{ color: "var(--v1-ink)" }}>
                Hubungkan Kendaraan
              </h2>
              <p className="mt-0.5 text-[12px]" style={{ color: "var(--v1-ink-faint)" }}>
                Pilih kendaraan yang akan dihubungkan ke <strong>{vehicleModal.name}</strong>.
              </p>
            </div>

            <div className="px-6 py-5 max-h-80 overflow-y-auto">
              {vehicleLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: "var(--v1-surface-raised)" }} />
                  ))}
                </div>
              ) : allVehicles.length === 0 ? (
                <p className="text-[13px] text-center py-8" style={{ color: "var(--v1-ink-faint)" }}>
                  Belum ada kendaraan. Tambah kendaraan terlebih dahulu.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {allVehicles.map((v) => {
                    const checked = assignedIds.has(v.vehicle_id);
                    return (
                      <label
                        key={v.vehicle_id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] cursor-pointer transition-colors"
                        style={{
                          border: checked ? "1px solid var(--v1-accent)" : "1px solid var(--v1-border)",
                          background: checked ? "var(--v1-accent-light)" : "transparent",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleVehicle(v.vehicle_id)}
                          className="w-3.5 h-3.5"
                          style={{ accentColor: "var(--v1-accent)" }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate" style={{ color: "var(--v1-ink)" }}>
                            {v.name}
                          </p>
                          <p className="text-[11px] truncate" style={{ color: "var(--v1-ink-faint)" }}>
                            {v.license_plate || "-"} · {v.brand} {v.model}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: "1px solid var(--v1-border-subtle)" }}>
              <span className="text-[12px]" style={{ color: "var(--v1-ink-faint)" }}>
                {assignedIds.size} dipilih
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVehicleModal(null)}
                  disabled={vehicleSaving}
                  className="px-4 py-2.5 text-[13px] font-semibold rounded-xl transition-colors"
                  style={{ color: "var(--v1-ink-muted)" }}
                >
                  Batal
                </button>
                <button
                  onClick={saveVehicleAssignment}
                  disabled={vehicleSaving || vehicleLoading}
                  className="px-4 py-2.5 text-[13px] font-semibold text-white rounded-xl transition-colors disabled:opacity-50"
                  style={{ background: "var(--v1-accent)" }}
                >
                  {vehicleSaving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
