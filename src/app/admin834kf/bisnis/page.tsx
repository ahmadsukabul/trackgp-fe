"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { adminFetch, getApiErrorMessage } from "../lib/api";
import { DataTable, Column, StatusBadge, Modal, FormField, Input, Select } from "../components/data-table";
import { useKeysetPaging, ADMIN_PAGE_LIMIT } from "../lib/use-keyset-paging";
import { Edit2, Trash2 } from "lucide-react";

type Bisnis = {
  id: number;
  bisnis_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  reseller_id: string;
  device_limit: number;
  status: number;
  created_at: string;
};

type BisnisForm = {
  id?: number;
  bisnis_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  reseller_id: string;
  device_limit: string;
  status: string;
};

const emptyForm: BisnisForm = {
  bisnis_id: "",
  name: "",
  email: "",
  phone: "",
  address: "",
  reseller_id: "",
  device_limit: "",
  status: "1",
};

const STATUS_OPTIONS = [
  { label: "Semua Status", value: "" },
  { label: "Aktif", value: "1" },
  { label: "Nonaktif", value: "0" },
];

export default function BisnisPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<BisnisForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ---- Server-side search ----
  const searchRef = useRef<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState("");

  const paging = useKeysetPaging<Bisnis>({
    fetchPage: ({ last_id, limit }) => {
      const params = new URLSearchParams();
      params.set("last_id", String(last_id));
      params.set("limit", String(limit));
      // Server-side search: tambahkan filter dari searchRef
      for (const [k, v] of Object.entries(searchRef.current)) {
        if (v) params.set(k, v);
      }
      if (statusFilter) params.set("status", statusFilter);
      return adminFetch<Bisnis[]>(`/bisnis?${params}`);
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

  function openEdit(b: Bisnis) {
    setForm({
      id: b.id,
      bisnis_id: b.bisnis_id || "",
      name: b.name,
      email: b.email || "",
      phone: b.phone || "",
      address: b.address || "",
      reseller_id: b.reseller_id || "",
      device_limit: String(b.device_limit || ""),
      status: String(b.status ?? 1),
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
      email: form.email,
      phone: form.phone,
      address: form.address,
      device_limit: form.device_limit ? Number(form.device_limit) : 0,
    };
    if (form.id) {
      payload.status = Number(form.status);
      const res = await adminFetch(`/bisnis/${form.bisnis_id}`, { method: "PUT", body: payload });
      if (res.status !== 1) {
        setError(getApiErrorMessage(res, "Gagal update"));
        setSaving(false);
        return;
      }
    } else {
      payload.reseller_id = form.reseller_id;
      const res = await adminFetch("/bisnis", { method: "POST", body: payload });
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
    const res = await adminFetch(`/bisnis/${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    if (res.status === 1) await paging.reload();
  }

  const columns: Column<Bisnis>[] = [
    {
      key: "id",
      header: "ID",
      className: "w-16",
      render: (b) => <span className="text-gray-400 text-[12px]">#{b.id}</span>,
    },
    {
      key: "name",
      header: "Nama",
      render: (b) => (
        <Link href={`/admin834kf/bisnis/${b.bisnis_id}`} className="block group">
          <p className="font-medium text-[#2964e7] group-hover:text-[#2150c5] transition-colors">{b.name}</p>
          <p className="text-[12px] text-[#2964e7]/70 font-mono group-hover:text-[#2964e7]/90 transition-colors">{b.bisnis_id}</p>
        </Link>
      ),
    },
    { key: "email", header: "Email", render: (b) => b.email || "-" },
    { key: "phone", header: "Telepon", render: (b) => b.phone || "-" },
    { key: "device_limit", header: "Limit GPS", render: (b) => b.device_limit ?? "-" },
    {
      key: "status",
      header: "Status",
      render: (b) => <StatusBadge status={b.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-20",
      render: (b) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={() => openEdit(b)}
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeleteId(b.bisnis_id)}
            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title="Manajemen Bisnis"
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
        addLabel="Tambah Bisnis"
        searchFields={[
          { key: "bisnis_id", placeholder: "Bisnis ID", width: "w-[160px]" },
          { key: "name", placeholder: "Nama", width: "w-[180px]" },
          { key: "phone", placeholder: "Telepon", width: "w-[160px]" },
        ]}
        onSearch={handleSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOptions={STATUS_OPTIONS}
        onReset={handleReset}
      />

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "Edit Bisnis" : "Tambah Bisnis"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-[13px] text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          <FormField label="Nama Bisnis" required>
            <Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="PT. Contoh" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email">
              <Input value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" placeholder="email@contoh.com" />
            </FormField>
            <FormField label="Telepon">
              <Input value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="08xxxxxxxxxx" />
            </FormField>
          </div>
          <FormField label="Alamat">
            <Input value={form.address} onChange={(v) => setForm({ ...form, address: v })} placeholder="Alamat lengkap" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Limit GPS">
              <Input value={form.device_limit} onChange={(v) => setForm({ ...form, device_limit: v })} placeholder="10" />
            </FormField>
            {form.id && (
              <FormField label="Status">
                <Select
                  value={form.status}
                  onChange={(v) => setForm({ ...form, status: v })}
                  options={[
                    { label: "Aktif", value: "1" },
                    { label: "Nonaktif", value: "0" },
                  ]}
                />
              </FormField>
            )}
          </div>
          {!form.id && (
            <FormField label="Reseller ID">
              <Input value={form.reseller_id} onChange={(v) => setForm({ ...form, reseller_id: v })} placeholder="Kosongkan jika bukan reseller" />
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

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Bisnis">
        <p className="text-[13px] text-gray-600 dark:text-gray-300 mb-4">
          Yakin hapus bisnis ini? Tindakan ini tidak bisa dibatalkan.
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
