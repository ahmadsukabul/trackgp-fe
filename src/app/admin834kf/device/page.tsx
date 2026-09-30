"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { adminFetch, getApiErrorMessage } from "../lib/api";
import { DataTable, Column, Modal, FormField, Input } from "../components/data-table";
import { useKeysetPaging, ADMIN_PAGE_LIMIT } from "../lib/use-keyset-paging";
import {
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  BatteryWarning,
  Battery,
  Navigation,
  CircleHelp,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
  SignalZero,
  Edit2,
  Trash2,
} from "lucide-react";

type Gps = {
  id: number;
  device_id: string;
  bisnis_id: string;
  bisnis?: { bisnis_id: string; name: string } | null;
  name: string;
  unique_id: string;
  protocol: string;
  model: string;
  category: string;
  sim_number: string;
  phone_number: string;
  battery_level: number;
  course: number;
  ignition: number;
  signal_level: number;
  last_address: string;
  speed_threshold: number;
  status: string;
  last_seen_at: string;
  created_at: string;
};

type GpsForm = {
  id?: number;
  device_id: string;
  bisnis_id: string;
  name: string;
  unique_id: string;
  protocol: string;
  model: string;
  category: string;
  sim_number: string;
  phone_number: string;
  speed_threshold: string;
};

const emptyForm: GpsForm = {
  device_id: "",
  bisnis_id: "",
  name: "",
  unique_id: "",
  protocol: "gt06",
  model: "",
  category: "",
  sim_number: "",
  phone_number: "",
  speed_threshold: "0",
};

const STATUS_OPTIONS = [
  { label: "Semua Status", value: "" },
  { label: "Online", value: "online" },
  { label: "Offline", value: "offline" },
];

// --- Ikon indikator perangkat ---------------------------------------------
// BE mengirim -1 untuk nilai yang belum diketahui (belum ada laporan GPS),
// jadi kasus itu dibedakan dari nilai 0 yang valid.

/** Baterai: -1 = unknown (device belum lapor). */
function BatteryIcon({ level }: { level: number }) {
  if (level < 0) {
    return (
      <span title="Level baterai belum diketahui" className="inline-flex text-gray-300 dark:text-gray-600">
        <Battery className="w-4 h-4" />
      </span>
    );
  }

  const isLow = level <= 20;
  const Icon = level <= 10 ? BatteryWarning : level <= 20 ? BatteryLow : level <= 60 ? BatteryMedium : BatteryFull;
  const color = isLow ? "text-red-500" : level <= 60 ? "text-yellow-500" : "text-green-500";

  return (
    <span title={`Baterai ${level.toFixed(0)}%`} className={`inline-flex ${color}`}>
      <Icon className="w-4 h-4" />
    </span>
  );
}

/** Arah: -1 = unknown (tanda tanya). Panah diputar sesuai heading (0 = utara). */
function CourseIcon({ course }: { course: number }) {
  if (course < 0) {
    return (
      <span title="Arah belum diketahui" className="inline-flex text-gray-300 dark:text-gray-600">
        <CircleHelp className="w-4 h-4" />
      </span>
    );
  }
  return (
    <span
      title={`Arah ${course.toFixed(0)}°`}
      className="inline-flex text-blue-500"
      style={{ transform: `rotate(${course}deg)` }}
    >
      <Navigation className="w-4 h-4" />
    </span>
  );
}

/** Signal Level: -1 = unknown (CircleHelp), 0 none, 1 weak, 2 medium, 3 strong. */
function SignalLevelIcon({ level }: { level: number }) {
  if (level < 0) {
    return (
      <span title="Sinyal belum diketahui" className="inline-flex text-gray-300 dark:text-gray-600">
        <CircleHelp className="w-4 h-4" />
      </span>
    );
  }
  const Icon = level >= 3 ? Signal : level === 2 ? SignalHigh : level === 1 ? SignalMedium : SignalLow;
  const color = level >= 3 ? "text-green-500" : level === 2 ? "text-green-400" : level === 1 ? "text-yellow-500" : "text-red-500";
  return (
    <span title={`Sinyal GSM ${level === 3 ? "Kuat" : level === 2 ? "Sedang" : level === 1 ? "Lemah" : "Tidak ada"}`} className={`inline-flex ${color}`}>
      <Icon className="w-4 h-4" />
    </span>
  );
}

/** Ignition: -1 = unknown, 0 = mati, 1 = menyala. */
function DeviceStatusIcon({ ignition }: { ignition: number }) {
  if (ignition < 0) {
    return (
      <span title="Ignition belum diketahui" className="inline-block w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
    );
  }

  const isOn = ignition === 1;
  return (
    <span
      title={isOn ? "Ignition menyala" : "Ignition mati"}
      className={`inline-block w-2.5 h-2.5 rounded-full ${isOn ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}
    />
  );
}

function formatRelative(value: string): string {
  if (!value) return "-";
  const parsed = new Date(value.replace(" ", "T"));
  const ts = parsed.getTime();
  if (Number.isNaN(ts)) return value || "-";
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 0) return "baru saja";
  if (seconds < 60) return "baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit yang lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam yang lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari yang lalu`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} bulan yang lalu`;
  return `${Math.floor(months / 12)} tahun yang lalu`;
}

export default function GpsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<GpsForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ---- Server-side search ----
  const searchRef = useRef<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState("");

  const paging = useKeysetPaging<Gps>({
    fetchPage: ({ last_id, limit }) => {
      const params = new URLSearchParams();
      params.set("last_id", String(last_id));
      params.set("limit", String(limit));
      for (const [k, v] of Object.entries(searchRef.current)) {
        if (v) params.set(k, v);
      }
      if (statusFilter) params.set("status", statusFilter);
      return adminFetch<Gps[]>(`/device?${params}`);
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

  function openEdit(g: Gps) {
    setForm({
      id: g.id,
      device_id: g.device_id,
      bisnis_id: g.bisnis_id || "",
      name: g.name,
      unique_id: g.unique_id || "",
      protocol: g.protocol || "gt06",
      model: g.model || "",
      category: g.category || "",
      sim_number: g.sim_number || "",
      phone_number: g.phone_number || "",
      speed_threshold: String(g.speed_threshold ?? 0),
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
      protocol: form.protocol,
      model: form.model,
      category: form.category,
      sim_number: form.sim_number,
      phone_number: form.phone_number,
    };
    if (form.id) {
      payload.speed_threshold = form.speed_threshold ? Number(form.speed_threshold) : 0;
      const res = await adminFetch(`/device/${form.device_id}`, { method: "PUT", body: payload });
      if (res.status !== 1) {
        setError(getApiErrorMessage(res, "Gagal update"));
        setSaving(false);
        return;
      }
    } else {
      payload.bisnis_id = form.bisnis_id;
      payload.unique_id = form.unique_id;
      const res = await adminFetch("/device", { method: "POST", body: payload });
      if (res.status !== 1) {
        setError(getApiErrorMessage(res, "Gagal simpan"));
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    setModalOpen(false);
    await paging.reload();
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const res = await adminFetch(`/device/${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    if (res.status === 1) await paging.reload();
  }

  const columns: Column<Gps>[] = [
    {
      key: "indicators",
      header: "Perangkat",
      className: "w-28",
      render: (g) => (
        <div className="flex items-center gap-2.5">
          <BatteryIcon level={Number(g.battery_level ?? -1)} />
          <SignalLevelIcon level={Number(g.signal_level ?? -1)} />
          <CourseIcon course={Number(g.course ?? -1)} />
          <DeviceStatusIcon ignition={Number(g.ignition ?? -1)} />
        </div>
      ),
    },
    {
      key: "id",
      header: "ID",
      className: "w-16",
      render: (g) => <span className="text-gray-400 text-[12px]">#{g.id}</span>,
    },
    {
      key: "name",
      header: "Nama GPS",
      render: (g) => (
        <Link href={`/admin834kf/device/${g.device_id}`} className="block group">
          <p className="font-medium text-[#2964e7] group-hover:text-[#2150c5] dark:text-[#5b93f5] dark:group-hover:text-[#7dabfa] transition-colors">
            {g.name}
          </p>
          <p className="text-[12px] text-gray-500 font-mono">{g.unique_id}</p>
        </Link>
      ),
    },
    {
      key: "bisnis",
      header: "Bisnis",
      render: (g) =>
        g.bisnis_id ? (
          <Link
            href={`/admin834kf/bisnis/${g.bisnis_id}`}
            className="text-[13px] text-[#2964e7] hover:underline"
          >
            {g.bisnis?.name || g.bisnis_id}
          </Link>
        ) : (
          <span className="text-[13px] text-gray-400">-</span>
        ),
    },
    {
      key: "last_address",
      header: "Lokasi",
      render: (g) => (
        <span className="text-[12px] text-gray-500 dark:text-gray-400 max-w-[220px] truncate block" title={g.last_address || ""}>
          {g.last_address || "-"}
        </span>
      ),
    },
    {
      key: "protocol",
      header: "Protocol",
      render: (g) => <span className="text-[13px]">{g.protocol || "-"}</span>,
    },
    {
      key: "last_seen_at",
      header: "Terakhir Online",
      render: (g) => (
        <span className="text-[12px] text-gray-500" title={g.last_seen_at || ""}>
          {mounted ? formatRelative(g.last_seen_at) : ""}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-20",
      render: (g) => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={() => openEdit(g)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setDeleteId(g.device_id)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title="Manajemen Perangkat GPS"
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
        emptyMessage="Belum ada perangkat GPS terdaftar"
        searchFields={[
          { key: "device_id", placeholder: "Device ID", width: "w-[160px]" },
          { key: "unique_id", placeholder: "IMEI", width: "w-[170px]" },
          { key: "name", placeholder: "Nama", width: "w-[160px]" },
        ]}
        onSearch={handleSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOptions={STATUS_OPTIONS}
        onReset={handleReset}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? "Edit GPS" : "Daftarkan GPS"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-[13px] text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          <FormField label="Nama GPS" required>
            <Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="GPS Truck 01" />
          </FormField>
          {!form.id && (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Bisnis ID" required>
                <Input value={form.bisnis_id} onChange={(v) => setForm({ ...form, bisnis_id: v })} placeholder="ID bisnis pemilik" />
              </FormField>
              <FormField label="IMEI / Unique ID" required>
                <Input value={form.unique_id} onChange={(v) => setForm({ ...form, unique_id: v })} placeholder="123456789012345" />
              </FormField>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Protocol">
              <Input value={form.protocol} onChange={(v) => setForm({ ...form, protocol: v })} placeholder="gt06" />
            </FormField>
            <FormField label="Model">
              <Input value={form.model} onChange={(v) => setForm({ ...form, model: v })} placeholder="GT06N" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Nomor SIM">
              <Input value={form.sim_number} onChange={(v) => setForm({ ...form, sim_number: v })} placeholder="08xxxxxxxxxx" />
            </FormField>
            <FormField label="Nomor Telepon">
              <Input value={form.phone_number} onChange={(v) => setForm({ ...form, phone_number: v })} placeholder="08xxxxxxxxxx" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Kategori">
              <Input value={form.category} onChange={(v) => setForm({ ...form, category: v })} placeholder="default" />
            </FormField>
            {form.id && (
              <FormField label="Batas Kecepatan (km/h)">
                <Input value={form.speed_threshold} onChange={(v) => setForm({ ...form, speed_threshold: v })} placeholder="0 = nonaktif" />
              </FormField>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={saving || !form.name.trim()} className="px-4 py-2 text-[13px] font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus GPS">
        <p className="text-[13px] text-gray-600 dark:text-gray-300 mb-4">
          Yakin hapus perangkat GPS ini? Kamera yang menempel padanya juga akan kehilangan induknya.
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
