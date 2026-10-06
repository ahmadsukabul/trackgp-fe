"use client";

import { useEffect, useState, useRef } from "react";
import { adminFetch, getApiErrorMessage } from "../lib/api";
import { DataTable, Column, StatusBadge, Modal, FormField, Input, Select } from "../components/data-table";
import { useKeysetPaging, ADMIN_PAGE_LIMIT } from "../lib/use-keyset-paging";
import { Edit2, Trash2, Truck, X } from "lucide-react";
import Link from "next/link";
import { formatDateTimeSec } from "@/lib/format-date";

type Vehicle = {
  id: number;
  bisnis_id: string;
  vehicle_id: string;
  name: string;
  license_plate: string;
  vehicle_type: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  vin_number: string;
  current_driver: string;
  device_id: string;
  odometer_km: number;
  status: number;
  created_at: string;
};

type VehicleForm = {
  id: number;
  name: string;
  license_plate: string;
  vehicle_type: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  vin_number: string;
  odometer_km: string;
  status: string;
};

const emptyForm: VehicleForm = {
  id: 0,
  name: "",
  license_plate: "",
  vehicle_type: "Mobil",
  brand: "",
  model: "",
  year: "",
  color: "",
  vin_number: "",
  odometer_km: "",
  status: "1",
};

const VEHICLE_TYPE_OPTIONS = [
  { label: "Mobil", value: "Mobil" },
  { label: "Truck", value: "Truck" },
  { label: "Motor", value: "Motor" },
];

const STATUS_OPTIONS = [
  { label: "Semua Status", value: "" },
  { label: "Aktif", value: "1" },
  { label: "Nonaktif", value: "0" },
];

export default function VehiclePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<VehicleForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ---- Drawer detail ----
  const [drawer, setDrawer] = useState<Vehicle | null>(null);

  // ESC menutup drawer
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawer(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  // ---- Server-side search state ----
  const searchRef = useRef<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState("");

  const paging = useKeysetPaging<Vehicle>({
    fetchPage: ({ last_id, limit }) => {
      const params = new URLSearchParams();
      params.set("last_id", String(last_id));
      params.set("limit", String(limit));
      for (const [k, v] of Object.entries(searchRef.current)) {
        if (v) params.set(k, v);
      }
      if (statusFilter) params.set("status", statusFilter);
      return adminFetch<Vehicle[]>(`/vehicle?${params}`);
    },
  });

  function handleSearch(filters: Record<string, string>) {
    searchRef.current = filters;
    paging.reset();
  }

  function handleReset() {
    searchRef.current = {};
    setStatusFilter("");
    paging.reset();
  }

  function openEdit(v: Vehicle) {
    setForm({
      id: v.id,
      name: v.name,
      license_plate: v.license_plate,
      vehicle_type: v.vehicle_type || "Mobil",
      brand: v.brand || "",
      model: v.model || "",
      year: String(v.year || ""),
      color: v.color || "",
      vin_number: v.vin_number || "",
      odometer_km: String(v.odometer_km || ""),
      status: String(v.status ?? 1),
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload: Record<string, unknown> = {
      name: form.name,
      license_plate: form.license_plate,
      vehicle_type: form.vehicle_type,
      brand: form.brand,
      model: form.model,
      year: form.year ? Number(form.year) : 0,
      color: form.color,
      vin_number: form.vin_number,
      odometer_km: form.odometer_km ? Number(form.odometer_km) : 0,
      status: Number(form.status),
    };
    const res = await adminFetch(`/vehicle/${form.id}`, { method: "PUT", body: payload });
    if (res.status !== 1) {
      setError(getApiErrorMessage(res, "Gagal update"));
      setSaving(false);
      return;
    }
    setSaving(false);
    setModalOpen(false);
    // Update drawer jika sedang terbuka
    if (drawer && drawer.id === form.id) {
      setDrawer({ ...drawer, ...payload, status: Number(form.status) } as Vehicle);
    }
    await paging.reload();
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const res = await adminFetch(`/vehicle/${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    if (res.status === 1) {
      if (drawer && drawer.id === deleteId) setDrawer(null);
      await paging.reload();
    }
  }

  const columns: Column<Vehicle>[] = [
    {
      key: "id",
      header: "ID",
      className: "w-16",
      render: (v) => (
        <button
          onClick={() => setDrawer(v)}
          className="text-[12px] font-mono text-[#2964e7] hover:underline cursor-pointer"
        >
          #{v.id}
        </button>
      ),
    },
    {
      key: "name",
      header: "Kendaraan",
      render: (v) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{v.name}</p>
          <p className="text-[12px] text-gray-500">{v.license_plate}</p>
        </div>
      ),
    },
    {
      key: "vehicle_type",
      header: "Tipe",
      render: (v) => <span className="text-[13px]">{v.vehicle_type || "-"}</span>,
    },
    {
      key: "brand",
      header: "Brand/Model",
      render: (v) => <span className="text-[13px]">{[v.brand, v.model].filter(Boolean).join(" ") || "-"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (v) => <StatusBadge status={v.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-20",
      render: (v) => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setDeleteId(v.id)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title="Manajemen Kendaraan"
        columns={columns}
        data={paging.rows}
        loading={paging.loading}
        pageSize={ADMIN_PAGE_LIMIT}
        currentPage={paging.page}
        hasNext={paging.hasNext}
        maxVisitedPage={paging.maxVisitedPage}
        onPrev={paging.goPrev}
        onNext={paging.goNext}
        onPageJump={paging.goPage}
        onRefresh={paging.reload}
        searchFields={[
          { key: "license_plate", placeholder: "Plat Nomor", width: "w-[160px]" },
          { key: "name", placeholder: "Nama", width: "w-[180px]" },
          { key: "brand", placeholder: "Brand", width: "w-[140px]" },
        ]}
        onSearch={handleSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOptions={STATUS_OPTIONS}
        onReset={handleReset}
      />

      {/* ---- Drawer Detail Kendaraan ---- */}
      {drawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px]" onClick={() => setDrawer(null)} />
          <aside className="relative w-full sm:w-[420px] sm:max-w-[90vw] bg-white dark:bg-[#1a1a1c] shadow-2xl flex flex-col h-full animate-[slideInRight_220ms_ease-out]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800/60">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-bold text-gray-900 dark:text-white truncate">{drawer.name}</h2>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono truncate">{drawer.vehicle_id}</p>
                  </div>
                </div>
                <button onClick={() => setDrawer(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0" title="Tutup (ESC)">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              {/* Badge bar */}
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusBadge status={drawer.status} />
                {drawer.vehicle_type && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                    {drawer.vehicle_type}
                  </span>
                )}
                {drawer.license_plate && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 font-mono">
                    {drawer.license_plate}
                  </span>
                )}
              </div>
            </div>

            {/* Body — grouped sections */}
            <div className="flex-1 overflow-y-auto">
              {/* Section: Identitas */}
              <div className="px-5 py-4">
                <h4 className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Identitas</h4>
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-700/50 divide-y divide-gray-100 dark:divide-gray-700/30">
                  <InfoCell label="Plat Nomor" value={drawer.license_plate} mono />
                  <InfoCell label="VIN Number" value={drawer.vin_number} mono />
                  <InfoCell label="Tahun" value={drawer.year ? String(drawer.year) : null} />
                  <InfoCell label="Warna" value={drawer.color} />
                </div>
              </div>

              {/* Section: Spesifikasi */}
              <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800/60">
                <h4 className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Spesifikasi</h4>
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-700/50 divide-y divide-gray-100 dark:divide-gray-700/30">
                  <InfoCell label="Brand" value={drawer.brand} />
                  <InfoCell label="Model" value={drawer.model} />
                  <InfoCell label="Odometer" value={drawer.odometer_km ? `${drawer.odometer_km.toLocaleString()} km` : null} />
                </div>
              </div>

              {/* Section: Relasi */}
              <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800/60">
                <h4 className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Relasi</h4>
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-700/50 divide-y divide-gray-100 dark:divide-gray-700/30">
                  <InfoCell
                    label="GPS Device"
                    value={drawer.device_id}
                    link={drawer.device_id ? `/admin834kf/device/${drawer.device_id}` : undefined}
                    mono
                  />
                  <InfoCell
                    label="Bisnis"
                    value={drawer.bisnis_id}
                    link={drawer.bisnis_id ? `/admin834kf/bisnis/${drawer.bisnis_id}` : undefined}
                    mono
                  />
                </div>
              </div>

              {/* Section: Waktu */}
              <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800/60">
                <h4 className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Waktu</h4>
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-700/50 divide-y divide-gray-100 dark:divide-gray-700/30">
                  <InfoCell label="Dibuat" value={formatDateTimeSec(drawer.created_at)} />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 dark:border-gray-800/60 px-5 py-3 flex items-center justify-between">
              <button onClick={() => { setDeleteId(drawer.id); setDrawer(null); }} className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
              <button onClick={() => { openEdit(drawer); setDrawer(null); }} className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-white bg-[#2964e7] hover:bg-[#2150c5] rounded-lg transition-colors">
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ---- Modal Edit ---- */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Edit Kendaraan">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-[13px] text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          <FormField label="Nama Kendaraan" required>
            <Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Truck Fuso 01" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Plat Nomor" required>
              <Input value={form.license_plate} onChange={(v) => setForm({ ...form, license_plate: v })} placeholder="B 1234 XYZ" />
            </FormField>
            <FormField label="Tipe Kendaraan">
              <Select value={form.vehicle_type} onChange={(v) => setForm({ ...form, vehicle_type: v })} options={VEHICLE_TYPE_OPTIONS} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Brand">
              <Input value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} placeholder="Mitsubishi" />
            </FormField>
            <FormField label="Model">
              <Input value={form.model} onChange={(v) => setForm({ ...form, model: v })} placeholder="Fuso FE 74" />
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Tahun">
              <Input value={form.year} onChange={(v) => setForm({ ...form, year: v })} placeholder="2023" />
            </FormField>
            <FormField label="Warna">
              <Input value={form.color} onChange={(v) => setForm({ ...form, color: v })} placeholder="Putih" />
            </FormField>
            <FormField label="Odometer (km)">
              <Input value={form.odometer_km} onChange={(v) => setForm({ ...form, odometer_km: v })} placeholder="50000" />
            </FormField>
          </div>
          <FormField label="VIN Number">
            <Input value={form.vin_number} onChange={(v) => setForm({ ...form, vin_number: v })} placeholder="JH4DA9340PS000001" />
          </FormField>
          <FormField label="Status">
            <Select value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={[{ label: "Aktif", value: "1" }, { label: "Nonaktif", value: "0" }]} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={saving || !form.name.trim() || !form.license_plate.trim()} className="px-4 py-2 text-[13px] font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ---- Modal Hapus ---- */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Kendaraan">
        <p className="text-[13px] text-gray-600 dark:text-gray-300 mb-4">
          Yakin hapus kendaraan ini? Tindakan ini tidak bisa dibatalkan.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            Batal
          </button>
          <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-[13px] font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
            {deleting ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </Modal>
    </>
  );
}

// ---- Helper components ----
function InfoCell({
  label,
  value,
  mono,
  link,
}: {
  label: string;
  value: string | number | null | undefined;
  mono?: boolean;
  link?: string;
}) {
  const display = value != null && value !== "" ? String(value) : <span className="text-gray-300 dark:text-gray-600">—</span>;
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <span className="text-[12px] text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
      {link ? (
        <Link href={link} className={`text-[13px] text-[#2964e7] hover:underline text-right min-w-0 truncate ${mono ? "font-mono text-[12px]" : ""}`}>
          {display}
        </Link>
      ) : (
        <span className={`text-[13px] text-gray-900 dark:text-white text-right min-w-0 truncate ${mono ? "font-mono text-[12px]" : ""}`}>
          {display}
        </span>
      )}
    </div>
  );
}
