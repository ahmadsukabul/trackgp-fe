"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ModalForm, { type Field } from "../components/ModalForm";
import ConfirmModal from "../components/ConfirmModal";
import { useBusiness } from "../lib/BusinessContext";
import { MENU } from "../lib/menu";
import { ALL_MENU_KEYS, MENU_LABELS } from "../lib/menu";
import { getApiErrorMessage } from "../lib/api";
import {
  memberList,
  memberAdd,
  memberUpdate,
  memberDelete,
  roleList,
  roleCreate,
  roleUpdate,
  roleDelete,
  type Member,
  type Role,
} from "../lib/client";

type Tab = "member" | "role";
type FormState = Record<string, string>;

const TABS: { id: Tab; label: string }[] = [
  { id: "member", label: "Anggota" },
  { id: "role", label: "Role" },
];

/** Badge kecil untuk daftar menu_keys. */
function MenuChips({ keys }: { keys: string[] }) {
  if (!keys?.length)
    return <span style={{ color: "var(--v1-ink-faint)" }}>-</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {keys.map((k) => (
        <span
          key={k}
          className="px-1.5 py-0.5 rounded-md text-[11px] font-medium"
          style={{
            background: "var(--v1-surface-raised)",
            color: "var(--v1-ink-muted)",
          }}
        >
          {MENU_LABELS[k] ?? k}
        </span>
      ))}
    </div>
  );
}

export default function TeamPage() {
  const { can, isOwner } = useBusiness();
  const allowed = can(MENU.team);

  const [tab, setTab] = useState<Tab>("member");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  /* ---- modal anggota ---- */
  const [memberOpen, setMemberOpen] = useState(false);
  const [memberEditing, setMemberEditing] = useState<Member | null>(null);
  const [memberForm, setMemberForm] = useState<FormState>({});
  const [memberBusy, setMemberBusy] = useState(false);
  const [memberError, setMemberError] = useState("");
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState(false);

  /* ---- modal role ---- */
  const [roleOpen, setRoleOpen] = useState(false);
  const [roleEditing, setRoleEditing] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState<FormState>({});
  const [roleMenus, setRoleMenus] = useState<string[]>([]);
  const [roleBusy, setRoleBusy] = useState(false);
  const [roleError, setRoleError] = useState("");
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState(false);

  const load = useCallback(async () => {
    if (!allowed) {
      setLoading(false);
      setError("Akun ini tidak punya akses ke menu Tim.");
      return;
    }
    setLoading(true);
    setError("");
    const [mRes, rRes] = await Promise.all([memberList(), roleList()]);
    if (mRes.status === 1 && Array.isArray(mRes.data)) setMembers(mRes.data);
    else setError(getApiErrorMessage(mRes, "Gagal memuat anggota."));
    if (rRes.status === 1 && Array.isArray(rRes.data)) setRoles(rRes.data);
    setLoading(false);
  }, [allowed]);

  useEffect(() => {
    load();
  }, [load]);

  const roleOptions = useMemo(
    () => roles.map((r) => ({ value: r.role_id, label: r.name })),
    [roles],
  );
  const roleName = (id: string) => roles.find((r) => r.role_id === id)?.name ?? "-";

  /* ================= ANGGOTA ================= */

  function openAddMember() {
    setMemberEditing(null);
    setMemberForm({ role: "tim" });
    setMemberError("");
    setMemberOpen(true);
  }

  function openEditMember(m: Member) {
    setMemberEditing(m);
    setMemberForm({
      email: m.email ?? "",
      role: m.role ?? "tim",
      role_id: m.role_id ?? "",
      status: m.status ?? "aktif",
    });
    setMemberError("");
    setMemberOpen(true);
  }

  async function submitMember() {
    setMemberBusy(true);
    setMemberError("");
    const role = memberForm.role || "tim";
    const roleId = role === "tim" ? memberForm.role_id || null : null;

    const res = memberEditing
      ? await memberUpdate({
          bu_id: memberEditing.bu_id,
          role,
          role_id: roleId,
          status: memberForm.status,
        })
      : await memberAdd({ email: memberForm.email, role, role_id: roleId });

    if (res.status === 1) {
      setMemberOpen(false);
      await load();
    } else {
      setMemberError(getApiErrorMessage(res, "Gagal menyimpan anggota."));
    }
    setMemberBusy(false);
  }

  async function confirmDeleteMember() {
    if (!memberToDelete) return;
    setDeletingMember(true);
    const res = await memberDelete(memberToDelete.bu_id);
    setDeletingMember(false);
    setMemberToDelete(null);
    if (res.status === 1) await load();
    else setError(getApiErrorMessage(res, "Gagal menghapus anggota."));
  }

  const memberFields: Field[] = [
    ...(memberEditing
      ? []
      : [
          {
            name: "email",
            label: "Email user terdaftar",
            type: "email" as const,
            required: true,
            full: true,
            placeholder: "budi@perusahaan.com",
            hint: "User harus sudah punya akun TrackGPS. Minta mereka mendaftar dulu bila belum.",
          },
        ]),
    {
      name: "role",
      label: "Kedudukan",
      type: "select",
      required: true,
      options: [
        { value: "tim", label: "Tim (pakai role granular)" },
        { value: "owner", label: "Owner (semua akses)" },
      ],
      hint: memberEditing ? "Ubah kedudukan dengan hati-hati; owner terakhir tidak bisa dihapus." : undefined,
    },
    ...(memberForm.role === "owner"
      ? []
      : [
          {
            name: "role_id",
            label: "Role granular",
            type: "select" as const,
            required: true,
            options: roleOptions,
            hint: "Menentukan menu yang bisa dibuka.",
          },
        ]),
    ...(memberEditing
      ? [
          {
            name: "status",
            label: "Status",
            type: "select" as const,
            options: [
              { value: "aktif", label: "Aktif" },
              { value: "nonaktif", label: "Nonaktif" },
            ],
            hint: "Nonaktif menghentikan akses tanpa menghapus keanggotaan.",
          },
        ]
      : []),
  ];

  /* ================= ROLE ================= */

  function openAddRole() {
    setRoleEditing(null);
    setRoleForm({});
    setRoleMenus(["dashboard"]);
    setRoleError("");
    setRoleOpen(true);
  }

  function openEditRole(r: Role) {
    setRoleEditing(r);
    setRoleForm({ name: r.name ?? "", description: r.description ?? "" });
    setRoleMenus(r.menu_keys ?? []);
    setRoleError("");
    setRoleOpen(true);
  }

  function toggleMenu(key: string) {
    setRoleMenus((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  async function submitRole() {
    setRoleBusy(true);
    setRoleError("");
    if (!roleMenus.length) {
      setRoleError("Pilih minimal satu menu.");
      setRoleBusy(false);
      return;
    }

    const res = roleEditing
      ? await roleUpdate({
          role_id: roleEditing.role_id,
          name: roleForm.name,
          description: roleForm.description,
          menu_keys: roleMenus,
        })
      : await roleCreate({
          name: roleForm.name,
          description: roleForm.description,
          menu_keys: roleMenus,
        });

    if (res.status === 1) {
      setRoleOpen(false);
      await load();
    } else {
      setRoleError(getApiErrorMessage(res, "Gagal menyimpan role."));
    }
    setRoleBusy(false);
  }

  async function confirmDeleteRole() {
    if (!roleToDelete) return;
    setDeletingRole(true);
    const res = await roleDelete(roleToDelete.role_id);
    setDeletingRole(false);
    setRoleToDelete(null);
    if (res.status === 1) await load();
    else setError(getApiErrorMessage(res, "Gagal menghapus role."));
  }

  /* ================= Render ================= */

  const headCls =
    "px-4 py-3 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap text-left";
  const headStyle: React.CSSProperties = { color: "var(--v1-ink-faint)" };
  const cellCls = "px-4 py-3.5 text-[13px]";
  const rowCls =
    "border-b last:border-0 transition-colors";
  const rowStyle: React.CSSProperties = { borderBottomColor: "var(--v1-border-subtle)" };
  const editBtn =
    "px-2.5 py-1.5 text-[12px] font-semibold rounded-lg transition-colors";
  const editBtnStyle: React.CSSProperties = { color: "var(--v1-accent)" };
  const delBtn =
    "px-2.5 py-1.5 text-[12px] font-semibold rounded-lg transition-colors";
  const delBtnStyle: React.CSSProperties = { color: "var(--v1-danger)" };
  const addBtn =
    "px-4 py-2 text-white text-[13px] font-semibold rounded-xl transition-colors disabled:opacity-50";
  const addBtnStyle: React.CSSProperties = { background: "var(--v1-accent)" };

  if (!allowed) {
    return (
      <div className="max-w-[1400px] mx-auto">
        <h1
          className="text-xl font-bold tracking-tight"
          style={{ color: "var(--v1-ink)", fontFamily: "var(--v1-font-display)" }}
        >
          Tim &amp; Role
        </h1>
        <div
          className="mt-4 px-4 py-3 rounded-xl text-[13px] font-medium"
          style={{
            background: "var(--v1-danger-bg)",
            border: "1px solid var(--v1-danger-border)",
            color: "var(--v1-danger)",
          }}
        >
          {error || "Akun ini tidak punya akses ke menu Tim."}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: "var(--v1-ink)", fontFamily: "var(--v1-font-display)" }}
          >
            Tim &amp; Role
          </h1>
          <p
            className="mt-1 text-[13px]"
            style={{ color: "var(--v1-ink-faint)" }}
          >
            Kelola anggota bisnis aktif dan hak akses menu per role.
          </p>
        </div>
        {isOwner || can(MENU.team) ? (
          <button
            onClick={tab === "member" ? openAddMember : openAddRole}
            className={addBtn}
            style={addBtnStyle}
          >
            {tab === "member" ? "Tambah Anggota" : "Tambah Role"}
          </button>
        ) : null}
      </div>

      <div
        className="flex items-center gap-1 mb-5 p-1 rounded-xl w-fit"
        style={{ background: "var(--v1-surface-raised)" }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-1.5 text-[13px] font-semibold rounded-lg transition-colors"
            style={
              tab === t.id
                ? {
                    background: "var(--v1-surface)",
                    color: "var(--v1-ink)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  }
                : { color: "var(--v1-ink-faint)" }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-xl text-[13px] font-medium"
          style={{
            background: "var(--v1-danger-bg)",
            border: "1px solid var(--v1-danger-border)",
            color: "var(--v1-danger)",
          }}
        >
          {error}
        </div>
      )}

      {/* ---------- Tab Anggota ---------- */}
      {tab === "member" && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--v1-surface)",
            border: "1px solid var(--v1-border)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr
                  className="border-b"
                  style={{ borderBottomColor: "var(--v1-border-subtle)", background: "var(--v1-surface-raised)" }}
                >
                  <th className={headCls} style={headStyle}>Anggota</th>
                  <th className={headCls} style={headStyle}>Level</th>
                  <th className={headCls} style={headStyle}>Role</th>
                  <th className={headCls} style={headStyle}>Akses menu</th>
                  <th className={headCls} style={headStyle}>Status</th>
                  <th className={`${headCls} text-right`} style={headStyle}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading && members.length === 0 ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className={rowCls} style={rowStyle}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className={cellCls}>
                          <div
                            className="h-3.5 rounded animate-pulse"
                            style={{ background: "var(--v1-surface-raised)" }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <p className="text-[13px]" style={{ color: "var(--v1-ink-faint)" }}>Belum ada anggota.</p>
                    </td>
                  </tr>
                ) : (
                  members.map((m) => (
                    <tr key={m.bu_id} className={rowCls} style={rowStyle}>
                      <td className={cellCls}>
                        <p className="font-semibold" style={{ color: "var(--v1-ink)" }}>{m.name}</p>
                        <p className="text-[12px]" style={{ color: "var(--v1-ink-faint)" }}>{m.email}</p>
                      </td>
                      <td className={cellCls}>
                        <span
                          className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                          style={
                            m.role === "owner"
                              ? { background: "var(--v1-warning-bg)", color: "var(--v1-warning)" }
                              : { background: "var(--v1-accent-light)", color: "var(--v1-accent)" }
                          }
                        >
                          {m.role}
                        </span>
                      </td>
                      <td className={cellCls} style={{ color: "var(--v1-ink-muted)" }}>
                        {m.role === "owner" ? "Semua akses" : roleName(m.role_id)}
                      </td>
                      <td className={cellCls}>
                        <MenuChips keys={m.menu_keys} />
                      </td>
                      <td className={cellCls}>
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                          style={
                            m.status === "aktif"
                              ? { background: "var(--v1-success-bg)", color: "var(--v1-success)" }
                              : { background: "var(--v1-surface-raised)", color: "var(--v1-ink-faint)" }
                          }
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              background: m.status === "aktif" ? "var(--v1-success)" : "var(--v1-ink-faint)",
                            }}
                          />
                          {m.status}
                        </span>
                      </td>
                      <td className={`${cellCls} text-right whitespace-nowrap`}>
                        {m.role !== "owner" && (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => openEditMember(m)}
                              className={editBtn}
                              style={editBtnStyle}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setMemberToDelete(m)}
                              className={delBtn}
                              style={delBtnStyle}
                            >
                              Hapus
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------- Tab Role ---------- */}
      {tab === "role" && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--v1-surface)",
            border: "1px solid var(--v1-border)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr
                  className="border-b"
                  style={{ borderBottomColor: "var(--v1-border-subtle)", background: "var(--v1-surface-raised)" }}
                >
                  <th className={headCls} style={headStyle}>Role</th>
                  <th className={headCls} style={headStyle}>Akses menu</th>
                  <th className={headCls} style={headStyle}>Anggota</th>
                  <th className={`${headCls} text-right`} style={headStyle}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading && roles.length === 0 ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className={rowCls} style={rowStyle}>
                      {Array.from({ length: 4 }).map((__, j) => (
                        <td key={j} className={cellCls}>
                          <div
                            className="h-3.5 rounded animate-pulse"
                            style={{ background: "var(--v1-surface-raised)" }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : roles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-16 text-center">
                      <p className="text-[13px]" style={{ color: "var(--v1-ink-faint)" }}>
                        Belum ada role. Buat role dulu sebelum menambahkan anggota tim.
                      </p>
                    </td>
                  </tr>
                ) : (
                  roles.map((r) => (
                    <tr key={r.role_id} className={rowCls} style={rowStyle}>
                      <td className={cellCls}>
                        <p className="font-semibold" style={{ color: "var(--v1-ink)" }}>{r.name}</p>
                        {r.description && (
                          <p className="text-[12px]" style={{ color: "var(--v1-ink-faint)" }}>{r.description}</p>
                        )}
                      </td>
                      <td className={cellCls}>
                        <MenuChips keys={r.menu_keys} />
                      </td>
                      <td className={cellCls} style={{ color: "var(--v1-ink-muted)" }}>
                        {r.member_count}
                      </td>
                      <td className={`${cellCls} text-right whitespace-nowrap`}>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openEditRole(r)}
                            className={editBtn}
                            style={editBtnStyle}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setRoleToDelete(r)}
                            className={delBtn}
                            style={delBtnStyle}
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-3 text-[12px]" style={{ color: "var(--v1-ink-faint)" }}>
        {tab === "member" ? `${members.length} anggota` : `${roles.length} role`}
      </p>

      {/* Modal anggota */}
      <ModalForm
        open={memberOpen}
        title={memberEditing ? "Edit Anggota" : "Tambah Anggota"}
        description={memberEditing ? memberEditing.name : undefined}
        fields={memberFields}
        values={memberForm}
        submitting={memberBusy}
        error={memberError}
        onChange={(name, value) => setMemberForm((f) => ({ ...f, [name]: value }))}
        onSubmit={submitMember}
        onClose={() => setMemberOpen(false)}
      />

      <ConfirmModal
        open={!!memberToDelete}
        danger
        title="Hapus anggota?"
        message={`${memberToDelete?.name} akan kehilangan akses ke bisnis ini. Akun mereka tidak terhapus.`}
        confirmLabel="Hapus"
        submitting={deletingMember}
        onConfirm={confirmDeleteMember}
        onClose={() => setMemberToDelete(null)}
      />

      {/* Modal role — nama/deskripsi lewat ModalForm, grid checkbox menu custom */}
      {roleOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRoleOpen(false)} />
          <div
            className="relative my-8 w-full max-w-lg rounded-2xl shadow-xl"
            style={{
              background: "var(--v1-surface)",
              border: "1px solid var(--v1-border)",
            }}
          >
            <div
              className="px-6 py-5 border-b"
              style={{ borderBottomColor: "var(--v1-border-subtle)" }}
            >
              <h2
                className="text-[16px] font-bold"
                style={{ color: "var(--v1-ink)", fontFamily: "var(--v1-font-display)" }}
              >
                {roleEditing ? "Edit Role" : "Tambah Role"}
              </h2>
              <p className="mt-0.5 text-[12px]" style={{ color: "var(--v1-ink-faint)" }}>
                Pilih menu yang boleh dibuka anggota dengan role ini.
              </p>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label
                  className="block mb-1.5 text-[12px] font-semibold"
                  style={{ color: "var(--v1-ink-muted)" }}
                >
                  Nama role<span className="ml-0.5" style={{ color: "var(--v1-danger)" }}>*</span>
                </label>
                <input
                  value={roleForm.name ?? ""}
                  onChange={(e) => setRoleForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Supervisor Armada"
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] focus:outline-none"
                  style={{
                    background: "var(--v1-surface-raised)",
                    border: "1px solid var(--v1-border)",
                    color: "var(--v1-ink)",
                  }}
                />
              </div>
              <div>
                <label
                  className="block mb-1.5 text-[12px] font-semibold"
                  style={{ color: "var(--v1-ink-muted)" }}
                >
                  Deskripsi
                </label>
                <input
                  value={roleForm.description ?? ""}
                  onChange={(e) => setRoleForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Opsional"
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] focus:outline-none"
                  style={{
                    background: "var(--v1-surface-raised)",
                    border: "1px solid var(--v1-border)",
                    color: "var(--v1-ink)",
                  }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    className="text-[12px] font-semibold"
                    style={{ color: "var(--v1-ink-muted)" }}
                  >
                    Menu yang bisa diakses
                  </label>
                  <button
                    type="button"
                    onClick={() => setRoleMenus(roleMenus.length === ALL_MENU_KEYS.length ? [] : [...ALL_MENU_KEYS])}
                    className="text-[11px] font-semibold hover:underline"
                    style={{ color: "var(--v1-accent)" }}
                  >
                    {roleMenus.length === ALL_MENU_KEYS.length ? "Kosongkan" : "Pilih semua"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_MENU_KEYS.map((key) => {
                    const checked = roleMenus.includes(key);
                    return (
                      <label
                        key={key}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border text-[13px] cursor-pointer transition-colors"
                        style={
                          checked
                            ? {
                                borderColor: "var(--v1-accent)",
                                background: "var(--v1-accent-light)",
                                color: "var(--v1-ink)",
                                fontWeight: 600,
                              }
                            : {
                                borderColor: "var(--v1-border)",
                                color: "var(--v1-ink-muted)",
                              }
                        }
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleMenu(key)}
                          className="w-3.5 h-3.5"
                          style={{ accentColor: "var(--v1-accent)" }}
                        />
                        {MENU_LABELS[key]}
                      </label>
                    );
                  })}
                </div>
              </div>

              {roleError && (
                <div
                  className="px-4 py-3 rounded-xl text-[13px]"
                  style={{
                    background: "var(--v1-danger-bg)",
                    border: "1px solid var(--v1-danger-border)",
                    color: "var(--v1-danger)",
                  }}
                >
                  {roleError}
                </div>
              )}
            </div>

            <div
              className="flex items-center justify-end gap-2 px-6 py-4 border-t"
              style={{ borderTopColor: "var(--v1-border-subtle)" }}
            >
              <button
                onClick={() => setRoleOpen(false)}
                disabled={roleBusy}
                className="px-4 py-2.5 text-[13px] font-semibold rounded-xl transition-colors"
                style={{ color: "var(--v1-ink-muted)" }}
              >
                Batal
              </button>
              <button
                onClick={submitRole}
                disabled={roleBusy || !(roleForm.name ?? "").trim() || roleMenus.length === 0}
                className="px-4 py-2.5 text-[13px] font-semibold text-white rounded-xl transition-colors disabled:opacity-50"
                style={{ background: "var(--v1-accent)" }}
              >
                {roleBusy ? "Menyimpan..." : "Simpan Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!roleToDelete}
        danger
        title="Hapus role?"
        message={`Role "${roleToDelete?.name}" akan dihapus. Anggota yang masih memakai role ini harus dipindah ke role lain terlebih dahulu.`}
        confirmLabel="Hapus"
        submitting={deletingRole}
        onConfirm={confirmDeleteRole}
        onClose={() => setRoleToDelete(null)}
      />
    </div>
  );
}
