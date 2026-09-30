"use client";

import { useRef, useState } from "react";
import { adminFetch, getApiErrorMessage } from "../lib/api";
import { DataTable, Column, StatusBadge, Modal, FormField, Input, Select } from "../components/data-table";
import { useKeysetPaging, ADMIN_PAGE_LIMIT } from "../lib/use-keyset-paging";
import { Edit2, Trash2 } from "lucide-react";

type Camera = {
  id: number;
  camera_id: string;
  bisnis_id: string;
  device_id: string;
  name: string;
  serial_number: string;
  stream_url: string;
  channel: number;
  status: string;
  disabled: number;
  created_at: string;
};

type CameraForm = {
  id?: number;
  camera_id: string;
  bisnis_id: string;
  device_id: string;
  name: string;
  serial_number: string;
  stream_url: string;
  channel: string;
  disabled: string;
};

const emptyForm: CameraForm = {
  camera_id: "",
  bisnis_id: "",
  device_id: "",
  name: "",
  serial_number: "",
  stream_url: "",
  channel: "1",
  disabled: "0",
};

const STATUS_OPTIONS = [
  { label: "Semua Status", value: "" },
  { label: "Online", value: "online" },
  { label: "Offline", value: "offline" },
];

export default function CameraPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CameraForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const searchRef = useRef<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState("");

  const paging = useKeysetPaging<Camera>({
    fetchPage: ({ last_id, limit }) => {
      const params = new URLSearchParams();
      params.set("last_id", String(last_id));
      params.set("limit", String(limit));
      for (const [k, v] of Object.entries(searchRef.current)) {
        if (v) params.set(k, v);
      }
      if (statusFilter) params.set("status", statusFilter);
      return adminFetch<Camera[]>(`/camera?${params}`);
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

  function openAdd() {
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(c: Camera) {
    setForm({
      id: c.id,
      camera_id: c.camera_id,
      bisnis_id: c.bisnis_id || "",
      device_id: c.device_id || "",
      name: c.name,
      serial_number: c.serial_number || "",
      stream_url: c.stream_url || "",
      channel: String(c.channel ?? 1),
      disabled: String(c.disabled ?? 0),
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
      serial_number: form.serial_number,
      stream_url: form.stream_url,
      channel: form.channel ? Number(form.channel) : 1,
    };
    if (form.id) {
      payload.disabled = Number(form.disabled);
      const res = await adminFetch(`/camera/${form.camera_id}`, { method: "PUT", body: payload });
      if (res.status !== 1) {
        setError(getApiErrorMessage(res, "Gagal update"));
        setSaving(false);
        return;
      }
    } else {
      payload.bisnis_id = form.bisnis_id;
      payload.device_id = form.device_id;
      const res = await adminFetch("/camera", { method: "POST", body: payload });
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
    const res = await adminFetch(`/camera/${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    if (res.status === 1) await paging.reload();
  }

  const columns: Column<Camera>[] = [
    {
      key: "id",
      header: "ID",
      className: "w-16",
      render: (c) => <span className="text-gray-400 text-[12px]">#{c.id}</span>,
    },
    {
      key: "name",
      header: "Kamera",
      render: (c) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{c.name}</p>
          <p className="text-[12px] text-gray-500 font-mono">{c.camera_id}</p>
        </div>
      ),
    },
    {
      key: "device_id",
      header: "GPS Induk",
      render: (c) => <span className="text-[13px] font-mono">{c.device_id || "-"}</span>,
    },
    {
      key: "channel",
      header: "Channel",
      render: (c) => <span className="text-[13px]">{c.channel ?? "-"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (c) => <StatusBadge status={c.disabled === 1 ? 0 : c.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-20",
      render: (c) => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setDeleteId(c.camera_id)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title="Manajemen Kamera"
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
        onAdd={openAdd}
        addLabel="Tambah Kamera"
        searchFields={[
          { key: "name", label: "Nama" },
          { key: "serial_number", label: "Serial Number" },
          { key: "device_id", label: "Device ID" },
        ]}
        onSearch={handleSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOptions={STATUS_OPTIONS}
        onReset={handleReset}
        emptyMessage="Belum ada kamera terdaftar"
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? "Edit Kamera" : "Tambah Kamera"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-[13px] text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          <FormField label="Nama Kamera" required>
            <Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Kamera Kabin" />
          </FormField>
          {!form.id && (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Bisnis ID" required>
                <Input value={form.bisnis_id} onChange={(v) => setForm({ ...form, bisnis_id: v })} placeholder="ID bisnis" />
              </FormField>
              <FormField label="GPS ID (induk)" required>
                <Input value={form.device_id} onChange={(v) => setForm({ ...form, device_id: v })} placeholder="device_id GPS" />
              </FormField>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Serial Number">
              <Input value={form.serial_number} onChange={(v) => setForm({ ...form, serial_number: v })} placeholder="SN kamera" />
            </FormField>
            <FormField label="Channel">
              <Input value={form.channel} onChange={(v) => setForm({ ...form, channel: v })} placeholder="1" />
            </FormField>
          </div>
          <FormField label="Stream URL">
            <Input value={form.stream_url} onChange={(v) => setForm({ ...form, stream_url: v })} placeholder="rtsp://user:pass@host:554/stream" />
          </FormField>
          {form.id && (
            <FormField label="Status">
              <Select
                value={form.disabled}
                onChange={(v) => setForm({ ...form, disabled: v })}
                options={[
                  { label: "Aktif", value: "0" },
                  { label: "Nonaktif", value: "1" },
                ]}
              />
            </FormField>
          )}
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

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Kamera">
        <p className="text-[13px] text-gray-600 dark:text-gray-300 mb-4">
          Yakin hapus kamera ini? Tindakan ini tidak bisa dibatalkan.
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
