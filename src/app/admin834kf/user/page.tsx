"use client";

import { useRef, useState } from "react";
import { adminFetch, getApiErrorMessage } from "../lib/api";
import { DataTable, Column, StatusBadge, Modal, FormField, Input, Select } from "../components/data-table";
import { useKeysetPaging, ADMIN_PAGE_LIMIT } from "../lib/use-keyset-paging";
import { Edit2, Trash2 } from "lucide-react";

type User = {
  id: number;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  disabled: number;
  created_at: string;
};

// Form daftar: user + bisnis barunya dibuat sekaligus oleh BE dalam satu transaction.
type RegisterForm = {
  name: string;
  email: string;
  phone: string;
  password: string;
  bisnis_name: string;
  bisnis_email: string;
  bisnis_phone: string;
  address: string;
};

// Form edit: hanya profil user. Keanggotaan bisnis diatur terpisah (tbl_bisnis_user).
type EditForm = {
  id: number;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  disabled: string;
};

const STATUS_OPTIONS = [
  { label: "Semua Status", value: "" },
  { label: "Aktif", value: "0" },
  { label: "Nonaktif", value: "1" },
];

const emptyRegister: RegisterForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  bisnis_name: "",
  bisnis_email: "",
  bisnis_phone: "",
  address: "",
};

export default function UserPage() {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerForm, setRegisterForm] = useState<RegisterForm>(emptyRegister);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const searchRef = useRef<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState("");

  const paging = useKeysetPaging<User>({
    fetchPage: ({ last_id, limit }) => {
      const params = new URLSearchParams();
      params.set("last_id", String(last_id));
      params.set("limit", String(limit));
      for (const [k, v] of Object.entries(searchRef.current)) {
        if (v) params.set(k, v);
      }
      if (statusFilter) params.set("disabled", statusFilter);
      return adminFetch<User[]>(`/user?${params}`);
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

  function openRegister() {
    setRegisterForm(emptyRegister);
    setError(null);
    setRegisterOpen(true);
  }

  function openEdit(u: User) {
    setEditForm({
      id: u.id,
      user_id: u.user_id,
      name: u.name,
      email: u.email || "",
      phone: u.phone || "",
      role: u.role || "tim",
      disabled: String(u.disabled ?? 0),
    });
    setError(null);
  }

  // Daftar pengguna baru: BE otomatis membuat bisnis, membership owner, dan
  // role bawaan. Admin tidak perlu (dan tidak boleh) mengetik bisnis_id manual.
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await adminFetch("/user/register", {
      method: "POST",
      body: {
        name: registerForm.name,
        email: registerForm.email,
        phone: registerForm.phone,
        password: registerForm.password,
        bisnis_name: registerForm.bisnis_name,
        bisnis_email: registerForm.bisnis_email,
        bisnis_phone: registerForm.bisnis_phone,
        address: registerForm.address,
      },
    });
    if (res.status !== 1) {
      setError(getApiErrorMessage(res, "Gagal mendaftarkan pengguna"));
      setSaving(false);
      return;
    }
    setSaving(false);
    setRegisterOpen(false);
    await paging.reload();
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm) return;
    setSaving(true);
    setError(null);
    const res = await adminFetch(`/user/${editForm.user_id}`, {
      method: "PUT",
      body: {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        role: editForm.role,
        disabled: Number(editForm.disabled),
      },
    });
    if (res.status !== 1) {
      setError(getApiErrorMessage(res, "Gagal update"));
      setSaving(false);
      return;
    }
    setSaving(false);
    setEditForm(null);
    await paging.reload();
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const res = await adminFetch(`/user/${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    if (res.status === 1) await paging.reload();
  }

  const columns: Column<User>[] = [
    {
      key: "id",
      header: "ID",
      className: "w-16",
      render: (u) => <span className="text-gray-400 text-[12px]">#{u.id}</span>,
    },
    {
      key: "name",
      header: "Nama",
      render: (u) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{u.name}</p>
          <p className="text-[12px] text-gray-500">{u.email || "-"}</p>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Telepon",
      render: (u) => <span className="text-[13px]">{u.phone || "-"}</span>,
    },
    {
      key: "role",
      header: "Role",
      render: (u) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
          {u.role || "tim"}
        </span>
      ),
    },
    {
      key: "disabled",
      header: "Status",
      render: (u) => <StatusBadge status={u.disabled === 0} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-20",
      render: (u) => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setDeleteId(u.user_id)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title="Manajemen Pengguna"
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
        onAdd={openRegister}
        addLabel="Tambah Pengguna"
        searchFields={[
          { key: "name", label: "Nama" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Telepon" },
        ]}
        onSearch={handleSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOptions={STATUS_OPTIONS}
        onReset={handleReset}
      />

      {/* Register: user + bisnis baru dalam satu transaction */}
      <Modal open={registerOpen} onClose={() => setRegisterOpen(false)} title="Daftarkan Pengguna Baru">
        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-[13px] text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          <FormField label="Nama Lengkap" required>
            <Input value={registerForm.name} onChange={(v) => setRegisterForm({ ...registerForm, name: v })} placeholder="Nama lengkap" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email" required>
              <Input value={registerForm.email} onChange={(v) => setRegisterForm({ ...registerForm, email: v })} type="email" placeholder="email@contoh.com" />
            </FormField>
            <FormField label="Telepon">
              <Input value={registerForm.phone} onChange={(v) => setRegisterForm({ ...registerForm, phone: v })} placeholder="08xxxxxxxxxx" />
            </FormField>
          </div>
          <FormField label="Password" required>
            <Input value={registerForm.password} onChange={(v) => setRegisterForm({ ...registerForm, password: v })} type="password" placeholder="Minimal 6 karakter" />
          </FormField>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-700/50">
            <p className="text-[12px] text-gray-500 dark:text-gray-400 mb-3">
              Bisnis untuk pengguna ini dibuat otomatis. Pengguna terdaftar sebagai owner.
            </p>
            <FormField label="Nama Bisnis" required>
              <Input value={registerForm.bisnis_name} onChange={(v) => setRegisterForm({ ...registerForm, bisnis_name: v })} placeholder="PT. Contoh Sejahtera" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email Bisnis">
              <Input value={registerForm.bisnis_email} onChange={(v) => setRegisterForm({ ...registerForm, bisnis_email: v })} placeholder="Kosongkan = ikut email pengguna" />
            </FormField>
            <FormField label="Telepon Bisnis">
              <Input value={registerForm.bisnis_phone} onChange={(v) => setRegisterForm({ ...registerForm, bisnis_phone: v })} placeholder="Kosongkan = ikut telepon pengguna" />
            </FormField>
          </div>
          <FormField label="Alamat Bisnis">
            <Input value={registerForm.address} onChange={(v) => setRegisterForm({ ...registerForm, address: v })} placeholder="Alamat lengkap" />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setRegisterOpen(false)} className="px-4 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || !registerForm.name.trim() || !registerForm.email.trim() || registerForm.password.length < 6 || !registerForm.bisnis_name.trim()}
              className="px-4 py-2 text-[13px] font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Mendaftarkan..." : "Daftarkan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit: profil user saja */}
      <Modal open={!!editForm} onClose={() => setEditForm(null)} title="Edit Pengguna">
        {editForm && (
          <form onSubmit={handleUpdate} className="space-y-4">
            {error && (
              <div className="px-3 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-[13px] text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            <FormField label="Nama Lengkap" required>
              <Input value={editForm.name} onChange={(v) => setEditForm({ ...editForm, name: v })} placeholder="Nama lengkap" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Email" required>
                <Input value={editForm.email} onChange={(v) => setEditForm({ ...editForm, email: v })} type="email" placeholder="email@contoh.com" />
              </FormField>
              <FormField label="Telepon">
                <Input value={editForm.phone} onChange={(v) => setEditForm({ ...editForm, phone: v })} placeholder="08xxxxxxxxxx" />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Role">
                <Select
                  value={editForm.role}
                  onChange={(v) => setEditForm({ ...editForm, role: v })}
                  options={[
                    { label: "Owner", value: "owner" },
                    { label: "Tim", value: "tim" },
                  ]}
                />
              </FormField>
              <FormField label="Status">
                <Select
                  value={editForm.disabled}
                  onChange={(v) => setEditForm({ ...editForm, disabled: v })}
                  options={[
                    { label: "Aktif", value: "0" },
                    { label: "Nonaktif", value: "1" },
                  ]}
                />
              </FormField>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditForm(null)} className="px-4 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                Batal
              </button>
              <button type="submit" disabled={saving || !editForm.name.trim() || !editForm.email.trim()} className="px-4 py-2 text-[13px] font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Pengguna">
        <p className="text-[13px] text-gray-600 dark:text-gray-300 mb-4">
          Yakin hapus pengguna ini? Tindakan ini tidak bisa dibatalkan.
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
