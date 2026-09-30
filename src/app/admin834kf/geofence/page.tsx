"use client";

import { useRef, useState } from "react";
import { adminFetch, getApiErrorMessage } from "../lib/api";
import { DataTable, Column, StatusBadge, Modal, FormField, Input, Select } from "../components/data-table";
import { useKeysetPaging, ADMIN_PAGE_LIMIT } from "../lib/use-keyset-paging";
import { Edit2, Map, Trash2 } from "lucide-react";

type Geofence = {
  id: number;
  bisnis_id: string;
  name: string;
  description: string;
  area_type: string;
  center_lat: number;
  center_lng: number;
  radius: number;
  polygon_coords: string;
  color: string;
  status: number;
  created_at: string;
};

type GeofenceForm = {
  id?: number;
  bisnis_id: string;
  name: string;
  description: string;
  area_type: string;
  center_lat: string;
  center_lng: string;
  radius: string;
  polygon_coords: string;
  color: string;
  status: string;
};

const emptyForm: GeofenceForm = {
  bisnis_id: "",
  name: "",
  description: "",
  area_type: "polygon",
  center_lat: "",
  center_lng: "",
  radius: "",
  polygon_coords: "",
  color: "#FF0000",
  status: "1",
};

const STATUS_OPTIONS = [
  { label: "Semua Status", value: "" },
  { label: "Aktif", value: "1" },
  { label: "Nonaktif", value: "0" },
];

export default function GeofencePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<GeofenceForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const searchRef = useRef<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState("");

  const paging = useKeysetPaging<Geofence>({
    fetchPage: ({ last_id, limit }) => {
      const params = new URLSearchParams();
      params.set("last_id", String(last_id));
      params.set("limit", String(limit));
      for (const [k, v] of Object.entries(searchRef.current)) {
        if (v) params.set(k, v);
      }
      if (statusFilter) params.set("status", statusFilter);
      return adminFetch<Geofence[]>(`/geofence?${params}`);
    },
  });

  const isCircle = form.area_type === "circle";

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

  function openEdit(g: Geofence) {
    setForm({
      id: g.id,
      bisnis_id: g.bisnis_id || "",
      name: g.name,
      description: g.description || "",
      area_type: g.area_type || "polygon",
      center_lat: g.center_lat ? String(g.center_lat) : "",
      center_lng: g.center_lng ? String(g.center_lng) : "",
      radius: g.radius ? String(g.radius) : "",
      polygon_coords: g.polygon_coords || "",
      color: g.color || "#FF0000",
      status: String(g.status ?? 1),
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
      description: form.description,
      color: form.color,
    };
    if (form.id) {
      payload.status = Number(form.status);
      const res = await adminFetch(`/geofence/${form.id}`, { method: "PUT", body: payload });
      if (res.status !== 1) {
        setError(getApiErrorMessage(res, "Gagal update"));
        setSaving(false);
        return;
      }
    } else {
      payload.bisnis_id = form.bisnis_id;
      payload.area_type = form.area_type;
      if (isCircle) {
        payload.center_lat = form.center_lat ? Number(form.center_lat) : 0;
        payload.center_lng = form.center_lng ? Number(form.center_lng) : 0;
        payload.radius = form.radius ? Number(form.radius) : 0;
      } else {
        payload.polygon_coords = form.polygon_coords;
      }
      const res = await adminFetch("/geofence", { method: "POST", body: payload });
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
    const res = await adminFetch(`/geofence/${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    if (res.status === 1) await paging.reload();
  }

  const columns: Column<Geofence>[] = [
    {
      key: "id",
      header: "ID",
      className: "w-16",
      render: (g) => <span className="text-gray-400 text-[12px]">#{g.id}</span>,
    },
    {
      key: "name",
      header: "Nama Geofence",
      render: (g) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{g.name}</p>
          <p className="text-[12px] text-gray-500">{g.description || "-"}</p>
        </div>
      ),
    },
    {
      key: "area_type",
      header: "Tipe",
      render: (g) => (
        <span className="inline-flex items-center gap-1 text-[12px] px-2 py-0.5 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 rounded-full">
          <Map className="w-3 h-3" />
          {g.area_type || "polygon"}
        </span>
      ),
    },
    {
      key: "color",
      header: "Warna",
      render: (g) => (
        <span className="inline-flex items-center gap-2 text-[13px] font-mono">
          <span
            className="w-3.5 h-3.5 rounded-full border border-gray-200 dark:border-gray-700"
            style={{ backgroundColor: g.color || "#FF0000" }}
          />
          {g.color || "-"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (g) => <StatusBadge status={g.status} />,
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
          <button onClick={() => setDeleteId(g.id)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title="Manajemen Geofence"
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
        addLabel="Tambah Geofence"
        searchFields={[
          { key: "name", label: "Nama" },
          { key: "geofence_id", label: "Geofence ID" },
        ]}
        onSearch={handleSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOptions={STATUS_OPTIONS}
        onReset={handleReset}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? "Edit Geofence" : "Tambah Geofence"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-[13px] text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          <FormField label="Nama Geofence" required>
            <Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Kawasan Pabrik A" />
          </FormField>
          <FormField label="Deskripsi">
            <Input value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Deskripsi area geofence" />
          </FormField>
          {!form.id && (
            <>
              <FormField label="Bisnis ID" required>
                <Input value={form.bisnis_id} onChange={(v) => setForm({ ...form, bisnis_id: v })} placeholder="ID bisnis pemilik geofence" />
              </FormField>
              <FormField label="Tipe Area">
                <Select
                  value={form.area_type}
                  onChange={(v) => setForm({ ...form, area_type: v })}
                  options={[
                    { label: "Polygon", value: "polygon" },
                    { label: "Circle", value: "circle" },
                  ]}
                />
              </FormField>
              {isCircle ? (
                <div className="grid grid-cols-3 gap-3">
                  <FormField label="Center Lat" required>
                    <Input value={form.center_lat} onChange={(v) => setForm({ ...form, center_lat: v })} placeholder="-6.200000" />
                  </FormField>
                  <FormField label="Center Lng" required>
                    <Input value={form.center_lng} onChange={(v) => setForm({ ...form, center_lng: v })} placeholder="106.816666" />
                  </FormField>
                  <FormField label="Radius (m)" required>
                    <Input value={form.radius} onChange={(v) => setForm({ ...form, radius: v })} placeholder="500" />
                  </FormField>
                </div>
              ) : (
                <FormField label="Polygon Coords (JSON)">
                  <textarea
                    value={form.polygon_coords}
                    onChange={(e) => setForm({ ...form, polygon_coords: e.target.value })}
                    placeholder='[[lat,lng],[lat,lng],...]'
                    rows={3}
                    className="w-full px-3 py-2 text-[12px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                </FormField>
              )}
            </>
          )}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Warna">
              <Input value={form.color} onChange={(v) => setForm({ ...form, color: v })} placeholder="#FF0000" />
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

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Geofence">
        <p className="text-[13px] text-gray-600 dark:text-gray-300 mb-4">
          Yakin hapus geofence ini? Tindakan ini tidak bisa dibatalkan.
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
