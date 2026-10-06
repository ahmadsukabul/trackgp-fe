"use client";

import { useRef, useState } from "react";
import { adminFetch, getApiErrorMessage } from "../lib/api";
import { DataTable, Column, StatusBadge, Modal, FormField, Input, Select } from "../components/data-table";
import { useKeysetPaging, ADMIN_PAGE_LIMIT } from "../lib/use-keyset-paging";
import { formatDate } from "@/lib/format-date";
import { Edit2, Trash2 } from "lucide-react";

type Driver = {
  id: number;
  bisnis_id: string;
  name: string;
  phone: string;
  email: string;
  license_no: string;
  license_exp: string;
  ibutton_id: string;
  status: number;
  created_at: string;
};

type DriverForm = {
  id?: number;
  bisnis_id: string;
  name: string;
  phone: string;
  email: string;
  license_no: string;
  license_exp: string;
  ibutton_id: string;
  status: string;
};

const emptyForm: DriverForm = {
  bisnis_id: "",
  name: "",
  phone: "",
  email: "",
  license_no: "",
  license_exp: "",
  ibutton_id: "",
  status: "1",
};

const STATUS_OPTIONS = [
  { label: "Semua Status", value: "" },
  { label: "Aktif", value: "1" },
  { label: "Nonaktif", value: "0" },
];

export default function DriverPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<DriverForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const searchRef = useRef<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState("");

  const paging = useKeysetPaging<Driver>({
    fetchPage: ({ last_id, limit }) => {
      const params = new URLSearchParams();
      params.set("last_id", String(last_id));
      params.set("limit", String(limit));
      for (const [k, v] of Object.entries(searchRef.current)) {
        if (v) params.set(k, v);
      }
      if (statusFilter) params.set("status", statusFilter);
      return adminFetch<Driver[]>(`/driver?${params}`);
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

  function openEdit(d: Driver) {
    setForm({
      id: d.id,
      bisnis_id: d.bisnis_id || "",
      name: d.name,
      phone: d.phone || "",
      email: d.email || "",
      license_no: d.license_no || "",
      license_exp: d.license_exp || "",
      ibutton_id: d.ibutton_id || "",
      status: String(d.status ?? 1),
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
      phone: form.phone,
      email: form.email,
      license_no: form.license_no,
      license_exp: form.license_exp,
      ibutton_id: form.ibutton_id,
    };
    if (form.id) {
      payload.status = Number(form.status);
      const res = await adminFetch(`/driver/${form.id}`, { method: "PUT", body: payload });
      if (res.status !== 1) {
        setError(getApiErrorMessage(res, "Gagal update"));
        setSaving(false);
        return;
      }
    } else {
      payload.bisnis_id = form.bisnis_id;
      const res = await adminFetch("/driver", { method: "POST", body: payload });
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
    const res = await adminFetch(`/driver/${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    if (res.status === 1) await paging.reload();
  }

  const columns: Column<Driver>[] = [
    {
      key: "id",
      header: "ID",
      className: "w-16",
      render: (d) => <span className="text-gray-400 text-[12px]">#{d.id}</span>,
    },
    {
      key: "name",
      header: "Nama Pengemudi",
      render: (d) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{d.name}</p>
          <p className="text-[12px] text-gray-500">{d.phone || "-"}</p>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (d) => <span className="text-[13px]">{d.email || "-"}</span>,
    },
    {
      key: "license_no",
      header: "No. Lisensi",
      render: (d) => <span className="text-[13px]">{d.license_no || "-"}</span>,
    },
    {
      key: "license_exp",
      header: "Exp. Lisensi",
      render: (d) => <span className="text-[13px]">{d.license_exp ? formatDate(d.license_exp) : "-"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (d) => <StatusBadge status={d.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-20",
      render: (d) => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setDeleteId(d.id)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title="Manajemen Pengemudi"
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
        addLabel="Tambah Pengemudi"
        searchFields={[
          { key: "name", label: "Nama" },
          { key: "phone", label: "Telepon" },
          { key: "license_no", label: "No. SIM" },
        ]}
        onSearch={handleSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOptions={STATUS_OPTIONS}
        onReset={handleReset}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? "Edit Pengemudi" : "Tambah Pengemudi"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-[13px] text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          <FormField label="Nama Lengkap" required>
            <Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Budi Santoso" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Telepon">
              <Input value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="08xxxxxxxxxx" />
            </FormField>
            <FormField label="Email">
              <Input value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" placeholder="email@contoh.com" />
            </FormField>
          </div>
          {!form.id && (
            <FormField label="Bisnis ID" required>
              <Input value={form.bisnis_id} onChange={(v) => setForm({ ...form, bisnis_id: v })} placeholder="ID bisnis pemilik pengemudi" />
            </FormField>
          )}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="No. Lisensi">
              <Input value={form.license_no} onChange={(v) => setForm({ ...form, license_no: v })} placeholder="123456789" />
            </FormField>
            <FormField label="Exp. Lisensi">
              <Input value={form.license_exp} onChange={(v) => setForm({ ...form, license_exp: v })} placeholder="2025-12-31" />
            </FormField>
          </div>
          <FormField label="iButton ID">
            <Input value={form.ibutton_id} onChange={(v) => setForm({ ...form, ibutton_id: v })} placeholder="ID iButton" />
          </FormField>
          {form.id && (
            <FormField label="Status">
              <Select value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={[{ label: "Aktif", value: "1" }, { label: "Nonaktif", value: "0" }]} />
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

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Pengemudi">
        <p className="text-[13px] text-gray-600 dark:text-gray-300 mb-4">
          Yakin hapus pengemudi ini? Tindakan ini tidak bisa dibatalkan.
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
