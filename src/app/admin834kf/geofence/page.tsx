"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { adminFetch, getApiErrorMessage } from "../lib/api";
import { DataTable, Column, Modal, StatusSwitch } from "../components/data-table";
import { useKeysetPaging, ADMIN_PAGE_LIMIT } from "../lib/use-keyset-paging";
import GeofenceMapModal, { type GeofenceData } from "../components/geofence-map-modal";
import { useToast, Toast } from "../components/toast";
import { Edit2, Map, Trash2 } from "lucide-react";

type Geofence = {
  id: number;
  geofence_id: string;
  bisnis_id: string;
  bisnis?: { bisnis_id: string; name: string };
  name: string;
  description: string;
  area_type: string;
  center_lat: number;
  center_lng: number;
  radius: number;
  polygon_coords: string;
  color: string;
  min_fixes: number;
  status: number;
  created_at: string;
  updated_at?: string;
};

const STATUS_OPTIONS = [
  { label: "Semua Status", value: "" },
  { label: "Aktif", value: "1" },
  { label: "Nonaktif", value: "0" },
];

export default function GeofencePage() {
  const [geoModalOpen, setGeoModalOpen] = useState(false);
  const [geoEdit, setGeoEdit] = useState<GeofenceData | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { toast, showToast } = useToast();

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
    setGeoEdit(null);
    setGeoModalOpen(true);
  }

  function openEdit(g: Geofence) {
    setGeoEdit({
      geofence_id: g.geofence_id,
      name: g.name,
      description: g.description || "",
      area_type: g.area_type || "polygon",
      color: g.color || "#FF0000",
      status: g.status ?? 1,
      polygon_coords: g.polygon_coords || "",
      min_fixes: g.min_fixes ?? 2,
    });
    setGeoModalOpen(true);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const res = await adminFetch(`/geofence/${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    if (res.status === 1) {
      showToast("Geofence berhasil dihapus");
      await paging.reload();
    } else {
      showToast(getApiErrorMessage(res, "Gagal menghapus geofence"), "error");
    }
  }

  // Update status cepat via switch — optimistis, balik kalau gagal.
  async function toggleStatus(g: Geofence, next: boolean) {
    const nextStatus = next ? 1 : 0;
    setTogglingId(g.geofence_id);
    paging.patchRows((r) => r.geofence_id === g.geofence_id, { status: nextStatus });
    const res = await adminFetch(`/geofence/${g.geofence_id}`, {
      method: "PUT",
      body: { status: nextStatus },
    });
    setTogglingId(null);
    if (res.status === 1) {
      showToast(next ? "Geofence diaktifkan" : "Geofence dinonaktifkan");
    } else {
      // Balikkan ke status semula kalau gagal.
      paging.patchRows((r) => r.geofence_id === g.geofence_id, { status: g.status });
      showToast(getApiErrorMessage(res, "Gagal update status"), "error");
    }
  }

  const columns: Column<Geofence>[] = [
    {
      key: "id",
      header: "ID",
      className: "w-16",
      render: (g) => (
        <Link
          href={`/admin834kf/geofence/${g.geofence_id}`}
          className="text-gray-400 hover:text-[#2964e7] text-[12px] transition-colors"
        >
          #{g.id}
        </Link>
      ),
    },
    {
      key: "name",
      header: "Nama Geofence",
      render: (g) => (
        <Link href={`/admin834kf/geofence/${g.geofence_id}`} className="block group">
          <p className="font-medium text-[#2964e7] group-hover:text-[#2150c5] transition-colors">{g.name}</p>
          <p className="text-[12px] text-[#2964e7]/70 font-mono group-hover:text-[#2964e7]/90 transition-colors">
            {g.geofence_id}
          </p>
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
      render: (g) => (
        <div className="flex items-center gap-2">
          <StatusSwitch
            checked={g.status === 1}
            loading={togglingId === g.geofence_id}
            onChange={(next) => void toggleStatus(g, next)}
            title={g.status === 1 ? "Nonaktifkan" : "Aktifkan"}
          />
          <span className={`text-[12px] ${g.status === 1 ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>
            {g.status === 1 ? "Aktif" : "Nonaktif"}
          </span>
        </div>
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
          <button onClick={() => setDeleteId(g.geofence_id)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
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

      <GeofenceMapModal
        open={geoModalOpen}
        onClose={() => {
          setGeoModalOpen(false);
          setGeoEdit(null);
        }}
        editGeofence={geoEdit}
        bisnisId=""
        onSaved={() => {
          showToast(geoEdit ? "Geofence berhasil diupdate" : "Geofence berhasil dibuat");
          void paging.reload();
        }}
      />

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

      <Toast toast={toast} />
    </>
  );
}
