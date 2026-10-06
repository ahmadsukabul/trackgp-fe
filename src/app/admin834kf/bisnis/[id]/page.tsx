"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  Building2,
  Navigation,
  Truck,
  Users,
  Shield,
  MapPin,
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Map as MapIcon,
  Plus,
  Search,
  X,
} from "lucide-react";
import { adminFetch, getApiErrorMessage } from "../../lib/api";
import { Section, StatCard, EmptyState } from "../../components/section";
import { StatusBadge, StatusSwitch } from "../../components/data-table";
import { useToast, Toast } from "../../components/toast";
import GeofenceMapModal, { type GeofenceData } from "../../components/geofence-map-modal";
import { formatDateTimeSec, formatDate, isPastDate } from "@/lib/format-date";

// ---- Tipe data ---------------------------------------------------------------

type Bisnis = {
  id: number;
  bisnis_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  reseller_id: string;
  device_limit: number;
  expired_at: string;
  status: number;
  created_at: string;
  updated_at?: string;
};

type Gps = {
  device_id: string;
  name: string;
  unique_id: string;
  protocol: string;
  status: string;
  last_seen_at: string;
};

type Vehicle = {
  vehicle_id: string;
  name: string;
  license_plate: string;
  vehicle_type: string;
  status: number;
};

type Driver = {
  id: number;
  driver_id?: string;
  name: string;
  phone: string;
  license_no: string;
  status: number;
};

type User = {
  id: number;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  disabled: number;
};

type Geofence = {
  id: number;
  geofence_id: string;
  name: string;
  description?: string;
  area_type: string;
  color: string;
  status: number;
  polygon_coords?: string;
  min_fixes?: number;
};

// ---- Helper ------------------------------------------------------------------

function toneClasses(tone: "gray" | "green"): string {
  if (tone === "green") return "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400";
  return "bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400";
}

function HeaderBadge({ label, tone }: { label: string; tone: "gray" | "green" }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${toneClasses(tone)}`}>
      {label}
    </span>
  );
}

function CountBadge({ count, limit }: { count: number; limit: number }) {
  const isCapped = limit > 0 && count >= limit;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
      {isCapped ? `${count}+` : count}
    </span>
  );
}

function isExpired(dateStr: string): boolean {
  return isPastDate(dateStr);
}

const RELATED_LIMIT = 100;

// ---- Halaman -----------------------------------------------------------------

export default function BisnisDetailPage() {
  const params = useParams<{ id: string }>();
  const bisnisId = params?.id ?? "";

  const [bisnis, setBisnis] = useState<Bisnis | null>(null);
  const [devices, setDevices] = useState<Gps[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- Modal Tambah GPS ----
  const [modalOpen, setModalOpen] = useState(false);
  const [unassignedDevices, setUnassignedDevices] = useState<Gps[]>([]);
  const [loadingUnassigned, setLoadingUnassigned] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ---- Modal Geofence (map) ----
  const [geoModalOpen, setGeoModalOpen] = useState(false);
  const [geoEdit, setGeoEdit] = useState<GeofenceData | null>(null);
  const [togglingGeoId, setTogglingGeoId] = useState<string | null>(null);

  const { toast, showToast } = useToast();

  // Update status geofence cepat via switch — optimistis, balik kalau gagal.
  async function toggleGeoStatus(g: Geofence, next: boolean) {
    const nextStatus = next ? 1 : 0;
    setTogglingGeoId(g.geofence_id);
    setGeofences((prev) =>
      prev.map((r) => (r.geofence_id === g.geofence_id ? { ...r, status: nextStatus } : r)),
    );
    const res = await adminFetch(`/geofence/${g.geofence_id}`, {
      method: "PUT",
      body: { status: nextStatus },
    });
    setTogglingGeoId(null);
    if (res.status === 1) {
      showToast(next ? "Geofence diaktifkan" : "Geofence dinonaktifkan");
    } else {
      // Balikkan ke status semula kalau gagal.
      setGeofences((prev) =>
        prev.map((r) => (r.geofence_id === g.geofence_id ? { ...r, status: g.status } : r)),
      );
      showToast(getApiErrorMessage(res, "Gagal update status"), "error");
    }
  }

  function openGeoModal(g?: Geofence) {
    if (g) {
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
    } else {
      setGeoEdit(null);
    }
    setGeoModalOpen(true);
  }

  const load = useCallback(async () => {
    if (!bisnisId) return;
    setLoading(true);
    setError(null);

    const detailRes = await adminFetch<Bisnis>(`/bisnis/${bisnisId}`);
    if (detailRes.status !== 1 || !detailRes.data) {
      setError(getApiErrorMessage(detailRes, "Gagal memuat detail bisnis."));
      setLoading(false);
      return;
    }
    setBisnis(detailRes.data);

    const [devRes, vehRes, drvRes, usrRes, geoRes] = await Promise.all([
      adminFetch<Gps[]>(`/device?bisnis_id=${encodeURIComponent(bisnisId)}&limit=${RELATED_LIMIT}`),
      adminFetch<Vehicle[]>(`/vehicle?bisnis_id=${encodeURIComponent(bisnisId)}&limit=${RELATED_LIMIT}`),
      adminFetch<Driver[]>(`/driver?bisnis_id=${encodeURIComponent(bisnisId)}&limit=${RELATED_LIMIT}`),
      adminFetch<User[]>(`/user?bisnis_id=${encodeURIComponent(bisnisId)}&limit=${RELATED_LIMIT}`),
      adminFetch<Geofence[]>(`/geofence?bisnis_id=${encodeURIComponent(bisnisId)}&limit=${RELATED_LIMIT}`),
    ]);

    setDevices(devRes.status === 1 && Array.isArray(devRes.data) ? devRes.data : []);
    setVehicles(vehRes.status === 1 && Array.isArray(vehRes.data) ? vehRes.data : []);
    setDrivers(drvRes.status === 1 && Array.isArray(drvRes.data) ? drvRes.data : []);
    setUsers(usrRes.status === 1 && Array.isArray(usrRes.data) ? usrRes.data : []);
    setGeofences(geoRes.status === 1 && Array.isArray(geoRes.data) ? geoRes.data : []);

    setLoading(false);
  }, [bisnisId]);

  useEffect(() => {
    void load();
  }, [load]);

  // ---- Modal Tambah GPS -------------------------------------------------------
  async function openAddGpsModal() {
    setModalOpen(true);
    setSearchQuery("");
    setLoadingUnassigned(true);
    const res = await adminFetch<Gps[]>(`/device/unassigned?limit=${RELATED_LIMIT}`);
    setUnassignedDevices(res.status === 1 && Array.isArray(res.data) ? res.data : []);
    setLoadingUnassigned(false);
  }

  async function handleAssign(deviceId: string) {
    if (!bisnisId) return;
    setAssigning(deviceId);
    const res = await adminFetch(`/device/${deviceId}/assign`, {
      method: "PUT",
      body: { bisnis_id: bisnisId },
    });
    setAssigning(null);
    if (res.status === 1) {
      setModalOpen(false);
      await load();
    }
  }

  const filteredDevices = unassignedDevices.filter(
    (d) =>
      d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.device_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.unique_id?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ---- Loading skeleton ------------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" />
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-[14px] animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-[14px] animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-[14px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ---- Error / not found -----------------------------------------------------
  if (error || !bisnis) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 font-medium">{error || "Bisnis tidak ditemukan"}</p>
          <Link href="/admin834kf/bisnis" className="mt-4 inline-block text-[13px] text-[#2964e7] hover:underline">
            Kembali ke daftar bisnis
          </Link>
        </div>
      </div>
    );
  }

  const isOnline = devices.some((d) => d.status?.toLowerCase() === "online");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/admin834kf/bisnis"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#2964e7] to-[#1f4fc4] flex items-center justify-center">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight truncate">{bisnis.name}</h1>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 font-mono truncate">{bisnis.bisnis_id}</p>
        </div>
        <HeaderBadge
          label={bisnis.status === 1 ? "Aktif" : "Nonaktif"}
          tone={bisnis.status === 1 ? "green" : "gray"}
        />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Navigation className="w-4 h-4" />} label="GPS" value={devices.length} />
        <StatCard icon={<Truck className="w-4 h-4" />} label="Kendaraan" value={vehicles.length} />
        <StatCard icon={<Users className="w-4 h-4" />} label="Supir" value={drivers.length} />
        <StatCard icon={<Shield className="w-4 h-4" />} label="Limit GPS" value={bisnis.device_limit ?? "-"} />
      </div>

      {/* Informasi bisnis — 2 kolom data + garis pemisah */}
      <Section icon={<Building2 className="w-4 h-4" />} title="Informasi Bisnis">
        <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-700/50 divide-y divide-gray-100 dark:divide-gray-700/30">
          <div className="grid grid-cols-2 gap-x-6 px-3 py-2.5">
            <BisnisInfoCell label="Nama" value={bisnis.name} />
            <BisnisInfoCell label="Email" value={bisnis.email} icon={<Mail className="w-3 h-3" />} mono />
          </div>
          <div className="grid grid-cols-2 gap-x-6 px-3 py-2.5">
            <BisnisInfoCell label="Telepon" value={bisnis.phone} icon={<Phone className="w-3 h-3" />} mono />
            <BisnisInfoCell label="Alamat" value={bisnis.address} icon={<MapPin className="w-3 h-3" />} />
          </div>
          <div className="grid grid-cols-2 gap-x-6 px-3 py-2.5">
            <BisnisInfoCell label="Reseller ID" value={bisnis.reseller_id} mono />
            <BisnisInfoCell
              label="Status"
              custom={<StatusBadge status={bisnis.status} />}
            />
          </div>
          <div className="grid grid-cols-2 gap-x-6 px-3 py-2.5">
            <BisnisInfoCell label="Limit GPS" value={bisnis.device_limit ?? "-"} />
            <BisnisInfoCell
              label="Expired"
              custom={
                <span className="inline-flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isExpired(bisnis.expired_at) ? "bg-red-500" : "bg-green-500"}`} />
                  <span className={isExpired(bisnis.expired_at) ? "text-red-600 dark:text-red-400 font-medium" : ""}>
                    {bisnis.expired_at ? formatDate(bisnis.expired_at) : "-"}
                  </span>
                  {bisnis.expired_at && isExpired(bisnis.expired_at) && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400">
                      Expired
                    </span>
                  )}
                </span>
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-x-6 px-3 py-2.5">
            <BisnisInfoCell label="Dibuat" value={formatDateTimeSec(bisnis.created_at)} />
            <BisnisInfoCell label="Diperbarui" value={bisnis.updated_at ? formatDateTimeSec(bisnis.updated_at) : null} fallback="-" />
          </div>
        </div>
      </Section>

      {/* Perangkat GPS */}
      <Section
        icon={<Navigation className="w-4 h-4" />}
        title="Perangkat GPS"
        headerRight={
          <div className="flex items-center gap-2">
            <CountBadge count={devices.length} limit={RELATED_LIMIT} />
            <button
              onClick={() => void openAddGpsModal()}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium text-white bg-[#2964e7] rounded-lg hover:bg-[#2150c5] transition-colors"
            >
              <Plus className="w-3 h-3" />
              Tambah
            </button>
          </div>
        }
      >
        {devices.length === 0 ? (
          <EmptyState icon={<Navigation className="w-8 h-8" />} message="Belum ada perangkat GPS." />
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
            <div className="grid grid-cols-12 text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium pb-2 px-1">
              <span className="col-span-4">Nama</span>
              <span className="col-span-3">Device ID</span>
              <span className="col-span-3">Protokol</span>
              <span className="col-span-2 text-right">Status</span>
            </div>
            {devices.map((d) => (
              <Link
                key={d.device_id}
                href={`/admin834kf/device/${d.device_id}`}
                className="grid grid-cols-12 items-center gap-2 py-2.5 px-1 -mx-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
              >
                <span className="col-span-4 text-[13px] font-medium text-[#2964e7] group-hover:text-[#2150c5] dark:text-[#5b93f5] dark:group-hover:text-[#7dabfa] truncate">{d.name}</span>
                <span className="col-span-3 text-[12px] text-gray-500 font-mono truncate">{d.device_id}</span>
                <span className="col-span-3 text-[12px] text-gray-500 truncate">{d.protocol || "-"}</span>
                <span className="col-span-2 flex justify-end">
                  <StatusBadge status={d.status} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* Kendaraan + Supir (2 kolom) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section
          icon={<Truck className="w-4 h-4" />}
          title="Kendaraan"
          headerRight={<CountBadge count={vehicles.length} limit={RELATED_LIMIT} />}
        >
          {vehicles.length === 0 ? (
            <EmptyState icon={<Truck className="w-8 h-8" />} message="Belum ada kendaraan." />
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {vehicles.map((v) => (
                <div key={v.vehicle_id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{v.name}</p>
                    <p className="text-[12px] text-gray-500 truncate">{v.license_plate || "-"} &middot; {v.vehicle_type || "-"}</p>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section
          icon={<Users className="w-4 h-4" />}
          title="Supir"
          headerRight={<CountBadge count={drivers.length} limit={RELATED_LIMIT} />}
        >
          {drivers.length === 0 ? (
            <EmptyState icon={<Users className="w-8 h-8" />} message="Belum ada supir." />
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {drivers.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{d.name}</p>
                    <p className="text-[12px] text-gray-500 truncate">{d.phone || "-"} &middot; {d.license_no || "-"}</p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* User + Geofence (2 kolom) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section
          icon={<UserIcon className="w-4 h-4" />}
          title="User"
          headerRight={<CountBadge count={users.length} limit={RELATED_LIMIT} />}
        >
          {users.length === 0 ? (
            <EmptyState icon={<UserIcon className="w-8 h-8" />} message="Belum ada user." />
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {users.map((u) => (
                <div key={u.user_id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{u.name}</p>
                    <p className="text-[12px] text-gray-500 truncate">{u.email || "-"} &middot; {u.role || "-"}</p>
                  </div>
                  <StatusBadge status={u.disabled ? 0 : 1} />
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section
          icon={<MapIcon className="w-4 h-4" />}
          title="Geofence"
          headerRight={
            <div className="flex items-center gap-2">
              <CountBadge count={geofences.length} limit={RELATED_LIMIT} />
              <button
                onClick={() => openGeoModal()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium text-white bg-[#2964e7] rounded-lg hover:bg-[#2150c5] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah
              </button>
            </div>
          }
        >
          {geofences.length === 0 ? (
            <EmptyState icon={<MapIcon className="w-8 h-8" />} message="Belum ada geofence." />
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {geofences.map((g) => (
                <div
                  key={g.geofence_id}
                  className="flex items-center justify-between gap-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors px-2 -mx-2"
                >
                  <button
                    type="button"
                    onClick={() => openGeoModal(g)}
                    className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: g.color || "#6b7280" }}
                    />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{g.name}</p>
                      <p className="text-[12px] text-gray-500 truncate">{g.area_type || "-"}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusSwitch
                      checked={g.status === 1}
                      loading={togglingGeoId === g.geofence_id}
                      onChange={(next) => void toggleGeoStatus(g, next)}
                      title={g.status === 1 ? "Nonaktifkan" : "Aktifkan"}
                    />
                    <span className={`text-[12px] w-14 text-right ${g.status === 1 ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>
                      {g.status === 1 ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Modal Tambah GPS */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white dark:bg-[#1a1a1c] rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800/60">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Tambah GPS ke {bisnis?.name}</h2>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="px-5 pt-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, device ID, atau IMEI..."
                  className="w-full pl-9 pr-3 py-2 text-[13px] bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2964e7]/30"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3">
              {loadingUnassigned ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800/60 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filteredDevices.length === 0 ? (
                <div className="py-10 text-center">
                  <Navigation className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                  <p className="text-[13px] text-gray-400">
                    {searchQuery ? "GPS tidak ditemukan." : "Semua GPS sudah terdaftar ke bisnis."}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredDevices.map((d) => (
                    <div
                      key={d.device_id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{d.name}</p>
                        <p className="text-[12px] text-gray-500 font-mono truncate">{d.device_id}</p>
                        <p className="text-[11px] text-gray-400 truncate">IMEI: {d.unique_id}</p>
                      </div>
                      <button
                        onClick={() => void handleAssign(d.device_id)}
                        disabled={assigning === d.device_id}
                        className="shrink-0 px-3 py-1.5 text-[12px] font-medium text-white bg-[#2964e7] rounded-lg hover:bg-[#2150c5] disabled:opacity-50 transition-colors"
                      >
                        {assigning === d.device_id ? "..." : "Daftarkan"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Geofence (map) — bisnis terkunci ke bisnis ini */}
      <GeofenceMapModal
        open={geoModalOpen}
        onClose={() => {
          setGeoModalOpen(false);
          setGeoEdit(null);
        }}
        editGeofence={geoEdit}
        bisnisId={bisnisId}
        bisnisName={bisnis?.name || ""}
        lockBisnis
        onSaved={() => void load()}
      />

      <Toast toast={toast} />
    </div>
  );
}

// ---- Helper untuk section detail bisnis ----
function BisnisInfoCell({
  label,
  value,
  mono,
  fallback,
  icon,
  custom,
}: {
  label: string;
  value?: string | number | null;
  mono?: boolean;
  fallback?: string;
  icon?: React.ReactNode;
  custom?: React.ReactNode;
}) {
  let display: React.ReactNode;
  if (custom) {
    display = custom;
  } else if (value != null && value !== "") {
    display = (
      <span className="inline-flex items-center gap-1.5">
        {icon && <span className="text-gray-400">{icon}</span>}
        {String(value)}
      </span>
    );
  } else {
    display = <span className="text-gray-300 dark:text-gray-600">{fallback || "—"}</span>;
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px] text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
      <span className={`text-[13px] text-gray-900 dark:text-white text-right min-w-0 truncate ${mono ? "font-mono text-[12px]" : ""}`}>
        {display}
      </span>
    </div>
  );
}
