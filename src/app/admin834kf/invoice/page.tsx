"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { adminFetch, getApiErrorMessage } from "../lib/api";
import { DataTable, Column, Modal, FormField, Input, Select } from "../components/data-table";
import { useKeysetPaging, ADMIN_PAGE_LIMIT } from "../lib/use-keyset-paging";
import { formatDate, formatDateTimeSec } from "@/lib/format-date";
import { CheckCircle2 } from "lucide-react";

type Invoice = {
  id: number;
  invoice_id: string;
  bisnis_id: string;
  device_id: string;
  kategori: string;
  months: number;
  amount: number;
  biaya_admin: number;
  total_transfer: number;
  due_date: string;
  status: string;
  metode_id: string;
  paid_at: string;
  created_at: string;
  device?: { device_id: string; name: string; unique_id: string } | null;
  bisnis?: { bisnis_id: string; name: string } | null;
};

const IDR = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const STATUS_OPTIONS = [
  { label: "Semua Status", value: "" },
  { label: "Menunggu bayar", value: "pending" },
  { label: "Lunas", value: "paid" },
  { label: "Terlambat", value: "overdue" },
  { label: "Dibatalkan", value: "cancelled" },
];

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "Menunggu bayar", cls: "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400" },
  paid: { label: "Lunas", cls: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400" },
  overdue: { label: "Terlambat", cls: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400" },
  cancelled: { label: "Dibatalkan", cls: "bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400" },
};

function InvoiceStatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status || "unknown", cls: "bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${meta.cls}`}>{meta.label}</span>;
}

type CreateForm = {
  device_id: string;
  months: string;
  kategori: string;
};

const emptyCreate: CreateForm = { device_id: "", months: "1", kategori: "perpanjang" };

export default function InvoicePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CreateForm>(emptyCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const searchRef = useRef<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState("");

  const paging = useKeysetPaging<Invoice>({
    fetchPage: ({ last_id, limit }) => {
      const params = new URLSearchParams();
      params.set("last_id", String(last_id));
      params.set("limit", String(limit));
      for (const [k, v] of Object.entries(searchRef.current)) {
        if (v) params.set(k, v);
      }
      if (statusFilter) params.set("status", statusFilter);
      return adminFetch<Invoice[]>(`/invoice?${params}`);
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

  function openCreate() {
    setForm(emptyCreate);
    setError(null);
    setModalOpen(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await adminFetch("/invoice", {
      method: "POST",
      body: {
        device_id: form.device_id.trim(),
        months: Number(form.months) || 1,
        kategori: form.kategori,
      },
    });
    setSaving(false);
    if (res.status !== 1) {
      setError(getApiErrorMessage(res, "Gagal membuat invoice."));
      return;
    }
    setModalOpen(false);
    await paging.reload();
  }

  async function approve(inv: Invoice) {
    setBusyId(inv.invoice_id);
    const res = await adminFetch(`/invoice/${inv.invoice_id}/approve`, { method: "PUT" });
    setBusyId(null);
    if (res.status === 1) await paging.reload();
    else setError(getApiErrorMessage(res, "Gagal menyetujui invoice."));
  }

  const columns: Column<Invoice>[] = [
    {
      key: "invoice_id",
      header: "Invoice",
      render: (inv) => (
        <div className="leading-tight">
          <p className="text-[12px] font-mono font-medium text-gray-900 dark:text-white">{inv.invoice_id}</p>
          <p className="text-[11px] text-gray-400">{inv.kategori === "register" ? "Registrasi" : "Perpanjangan"}</p>
        </div>
      ),
    },
    {
      key: "bisnis",
      header: "Bisnis",
      render: (inv) =>
        inv.bisnis_id ? (
          <Link href={`/admin834kf/bisnis/${inv.bisnis_id}`} className="text-[13px] text-[#2964e7] hover:underline">
            {inv.bisnis?.name || inv.bisnis_id}
          </Link>
        ) : (
          <span className="text-[13px] text-gray-400">-</span>
        ),
    },
    {
      key: "device",
      header: "Perangkat",
      render: (inv) => (
        <div className="leading-tight">
          <p className="text-[13px] text-gray-900 dark:text-white">{inv.device?.name || inv.device_id}</p>
          <p className="text-[11px] text-gray-400 font-mono">{inv.device?.unique_id || ""}</p>
        </div>
      ),
    },
    { key: "months", header: "Durasi", render: (inv) => <span className="text-[13px]">{inv.months} bulan</span> },
    {
      key: "total_transfer",
      header: "Nominal",
      render: (inv) => <span className="text-[13px] tabular-nums">{IDR.format(inv.total_transfer || inv.amount)}</span>,
    },
    { key: "status", header: "Status", render: (inv) => <InvoiceStatusBadge status={inv.status} /> },
    {
      key: "due_date",
      header: "Jatuh Tempo",
      render: (inv) => <span className="text-[12px] text-gray-500">{inv.due_date ? formatDate(inv.due_date) : "-"}</span>,
    },
    {
      key: "created_at",
      header: "Dibuat",
      render: (inv) => <span className="text-[12px] text-gray-500">{inv.created_at ? formatDateTimeSec(inv.created_at) : "-"}</span>,
    },
    {
      key: "actions",
      header: "",
      className: "w-28",
      render: (inv) =>
        inv.status === "pending" || inv.status === "overdue" ? (
          <div className="flex items-center gap-1 justify-end">
            <button
              onClick={() => approve(inv)}
              disabled={busyId === inv.invoice_id}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              title="Tandai lunas"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {busyId === inv.invoice_id ? "..." : "Setujui"}
            </button>
          </div>
        ) : (
          <div className="text-right text-[12px] text-gray-400">{inv.paid_at ? formatDate(inv.paid_at) : "-"}</div>
        ),
    },
  ];

  return (
    <>
      <DataTable
        title="Invoice Langganan"
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
        onAdd={openCreate}
        addLabel="Buat Invoice"
        emptyMessage="Belum ada invoice"
        searchFields={[
          { key: "invoice_id", placeholder: "Invoice ID", width: "w-[200px]" },
          { key: "bisnis_id", placeholder: "Bisnis ID", width: "w-[160px]" },
          { key: "device_id", placeholder: "Device ID", width: "w-[160px]" },
        ]}
        onSearch={handleSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOptions={STATUS_OPTIONS}
        onReset={handleReset}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Buat Invoice">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-[13px] text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          <FormField label="Device ID" required>
            <Input value={form.device_id} onChange={(v) => setForm({ ...form, device_id: v })} placeholder="DEV_..." />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Durasi (bulan)" required>
              <Input value={form.months} onChange={(v) => setForm({ ...form, months: v })} type="number" placeholder="1" />
            </FormField>
            <FormField label="Kategori">
              <Select
                value={form.kategori}
                onChange={(v) => setForm({ ...form, kategori: v })}
                options={[
                  { label: "Perpanjangan", value: "perpanjang" },
                  { label: "Registrasi", value: "register" },
                ]}
              />
            </FormField>
          </div>
          <p className="text-[12px] text-gray-400">
            Nominal dihitung otomatis dari harga langganan perangkat × durasi.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || !form.device_id.trim()}
              className="px-4 py-2 text-[13px] font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Menyimpan..." : "Buat"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
