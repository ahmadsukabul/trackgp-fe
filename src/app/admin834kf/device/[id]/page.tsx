"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

// useLayoutEffect jalan sinkron sebelum paint — ideal untuk auto-scroll chat
// agar scrollHeight sudah diukur setelah DOM attach tapi sebelum browser
// paint frame. Di Next.js (client component), useLayoutEffect aman dipakai.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  Cpu,
  Camera as CameraIcon,
  Truck,
  Shield,
  Terminal,
  Battery,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  BatteryWarning,
  Navigation,
  CircleHelp,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Send,
  Zap,
  ZapOff,
  X,
  MessageSquare,
  Plus,
  Edit2,
  Trash2,
  Users,
  RefreshCw,
  History,
  MapPinned,
  LogIn,
  LogOut,
  Route,
  Maximize2,
} from "lucide-react";
import { adminFetch, getApiErrorMessage } from "../../lib/api";
import { Section, StatCard, EmptyState } from "../../components/section";
import { StatusBadge } from "../../components/data-table";
import { PaginationBar } from "../../components/pagination";
import { useKeysetPaging, ADMIN_PAGE_LIMIT } from "../../lib/use-keyset-paging";
import { useAutoRefresh } from "../../lib/use-auto-refresh";
import { formatDate, formatDateTimeSec, nowLocalString } from "@/lib/format-date";
import GeofenceMapModal, { type GeofenceData } from "../../components/geofence-map-modal";
import GeofenceEventMapModal from "../../components/geofence-event-map-modal";
import GeofenceAreaMap from "../../components/geofence-area-map";
import RouteMap, { type RoutePoint, routeStats } from "../../components/route-map";
import DateInput from "../../components/date-input";
import AutoRefreshBadge from "../../components/auto-refresh-badge";

// ---- Tipe data dari BE ------------------------------------------------------

const IDR = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

type Gps = {
  id: number;
  device_id: string;
  bisnis_id: string;
  bisnis?: { bisnis_id: string; name: string } | null;
  name: string;
  unique_id: string;
  protocol: string;
  model: string;
  manufacturer: string;
  category: string;
  sim_number: string;
  phone_number: string;
  status: string;
  disabled: number;
  battery_level: number;
  course: number;
  ignition: number;
  signal_level: number;
  last_address: string;
  speed_threshold: number;
  price: number;
  expired_at: string;
  defense_state: number;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
};

type Camera = {
  camera_id: string;
  device_id: string;
  name: string;
  serial_number: string;
  stream_url: string;
  channel: number;
  status: string;
  disabled: number;
  created_at: string;
};

type Vehicle = {
  vehicle_id: string;
  bisnis_id: string;
  name: string;
  license_plate: string;
  vehicle_type: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  vin_number: string;
  odometer_km: number;
  status: number;
  device_id: string;
  created_at: string;
};

type Position = {
  device_id: string;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  course: number;
  accuracy: number;
  ignition: number;
  motion: number;
  battery_level: number;
  satellites: number;
  address: string;
  protocol: string;
  device_time: string;
  server_time: string;
  updated_at: string;
};

type PositionHistory = {
  id: number;
  device_id: string;
  bisnis_id: string;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  course: number;
  accuracy: number;
  ignition: number;
  motion: number;
  battery_level: number;
  gps_valid: number;
  satellites: number;
  address: string;
  protocol: string;
  device_time: string;
  server_time: string;
  attributes_json: string;
  created_at: string;
};

type GPSEvent = {
  id: number;
  event_id: string;
  device_id: string;
  bisnis_id: string;
  event_type: string;
  event_time: string;
  geofence_id: string;
  message: string;
  is_read: number;
  attributes_json: string;
  created_at: string;
};

type DeviceCommand = {
  command_id: string;
  command_type: string;
  text_channel: number;
  status: string;
  response_json: string;
  attributes_json: string;
  sent_by: string;
  sent_at: string;
  delivered_at: string;
  created_at: string;
};

type Geofence = {
  geofence_id: string;
  name: string;
  description: string;
  area_type: string;
  color: string;
  status: number;
  center_lat: number;
  center_lng: number;
  radius: number;
  polygon_coords: string;
};

type Driver = {
  driver_id: string;
  name: string;
  phone: string;
  license_no: string;
  status: number;
};

// ---- Helper tampilan --------------------------------------------------------

// Section Geofence di detail device disembunyikan sementara: geofence kini
// dikelola global per bisnis di halaman /admin834kf/geofence. Ubah ke true bila
// ingin menampilkannya lagi.
const SHOW_GEOFENCE_SECTION = false;

// Batas titik rute per request (harus sama dengan RouteMaxPoints di BE).
const ROUTE_LIMIT = 5000;

// Interval auto-refresh untuk tab Log Posisi (ms).
const POS_AUTO_REFRESH_MS = 15000;

// Style input untuk filter rentang waktu di section Riwayat Posisi.
const ROUTE_INPUT_CLS =
  "pl-8 pr-3 py-2 text-[13px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2964e7]/30";

/** Tanggal hari ini dalam format YYYY-MM-DD (waktu lokal browser). */
function todayStr(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Label baterai: -1 = perangkat belum lapor. */
function batteryLabel(level: number): string {
  if (level < 0) return "Belum diketahui";
  return `${level.toFixed(0)}%`;
}

/**
 * attributes_json berisi map {"text": "...", "raw_hex": "..."}. Untuk chat,
 * kita hanya butuh teks perintah asli (mis. "STATUS#"); bila gagal parse,
 * fallback ke response_json atau command_type.
 */
function extractCommandText(cmd: DeviceCommand): string {
  if (cmd.attributes_json) {
    try {
      const obj = JSON.parse(cmd.attributes_json);
      if (obj && typeof obj.text === "string" && obj.text.trim()) {
        return obj.text;
      }
    } catch {
      // JSON rusak / format tak dikenal — fallback ke field lain.
    }
  }
  return cmd.command_type || "(perintah)";
}

/**
 * response_json dari BE berbentuk {"result": "...", "raw_hex": "..."}. Untuk
 * tampilan chat kita hanya tampilkan teks 'result' (mis. "Battery:4.04V,...")
 * supaya bubble bersih tanpa JSON literal. Fallback ke string mentah kalau
 * field result tidak ada / JSON rusak.
 */
function extractReplyText(cmd: DeviceCommand): string {
  if (!cmd.response_json) return "";
  try {
    const obj = JSON.parse(cmd.response_json);
    if (obj && typeof obj.result === "string" && obj.result.trim()) {
      return obj.result;
    }
  } catch {
    // Bukan JSON (kompabilitas mundur dengan balasan lama) — tampilkan apa adanya.
    return cmd.response_json;
  }
  return cmd.response_json;
}

/** Label status command untuk badge di chat. */
function commandStatusLabel(status: string): string {
  switch ((status || "").toLowerCase()) {
    case "queued":
      return "Antri";
    case "sent":
      return "Terkirim";
    case "delivered":
      return "Dibalas";
    case "failed":
      return "Gagal";
    default:
      return status || "Unknown";
  }
}

function commandStatusTone(
  status: string,
): "gray" | "yellow" | "blue" | "green" | "red" {
  switch ((status || "").toLowerCase()) {
    case "queued":
      return "yellow";
    case "sent":
      return "blue";
    case "delivered":
      return "green";
    case "failed":
      return "red";
    default:
      return "gray";
  }
}

// ---- Helper event GPS (tbl_gps_event) ---------------------------------------

/** Label tipe event yang ramah dibaca (fallback: tipe mentah). */
const EVENT_TYPE_LABELS: Record<string, string> = {
  geofenceEnter: "Masuk Area",
  geofenceExit: "Keluar Area",
  sos: "SOS",
  overspeed: "Melebihi Kecepatan",
  vibration: "Getaran",
  lowBattery: "Baterai Lemah",
  powerCut: "Adaptor Dicabut",
  powerOff: "Adaptor Dicabut",
  removing: "Dibongkar",
  tampering: "Manipulasi",
  fallDown: "Terjatuh",
  door: "Pintu",
  lock: "Dikunci",
  unlock: "Dibuka",
  accident: "Kecelakaan",
  tow: "Digandeng",
  idle: "Idle",
  hardAcceleration: "Akselerasi Mendadak",
  hardBraking: "Pengereman Mendadak",
  hardCornering: "Belokan Tajam",
  jamming: "Sinyal Diblokir",
  temperature: "Suhu",
  fuelLeak: "Kebocoran BBM",
  general: "Alarm Umum",
  alarm: "Alarm",
};

function eventTypeLabel(type: string): string {
  if (!type) return "Event";
  return EVENT_TYPE_LABELS[type] || type;
}

function eventTone(type: string): "gray" | "yellow" | "blue" | "green" | "red" {
  switch (type) {
    case "geofenceEnter":
      return "green";
    case "geofenceExit":
    case "sos":
    case "powerCut":
    case "powerOff":
    case "removing":
    case "accident":
      return "red";
    case "overspeed":
    case "vibration":
    case "lowBattery":
    case "hardAcceleration":
    case "hardBraking":
    case "hardCornering":
      return "yellow";
    default:
      return "gray";
  }
}

/** Event yang terkait geofence (masuk/keluar area). */
function isGeofenceEvent(ev: GPSEvent): boolean {
  return ev.event_type === "geofenceEnter" || ev.event_type === "geofenceExit";
}

/**
 * Titik GPS saat event. Engine geofence menulis {lat,lng} ke attributes_json;
 * event dari sisi perangkat (alarm GT06) tidak. Kembalikan null kalau tidak ada
 * supaya peta tetap bisa tampil tanpa marker.
 */
function eventPoint(ev: GPSEvent): { lat: number | null; lng: number | null } {
  if (ev.attributes_json) {
    try {
      const attrs = JSON.parse(ev.attributes_json);
      const lat = Number(attrs?.lat);
      const lng = Number(attrs?.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
        return { lat, lng };
      }
    } catch {
      // JSON rusak — anggap tidak ada koordinat.
    }
  }
  return { lat: null, lng: null };
}

/**
 * Area geofence yang di-snapshot saat event terjadi (dibaca dari
 * attributes_json.fence_polygon). null = event lama belum menyimpan snapshot,
 * sehingga pemanggil harus fallback ke record geofence terkini.
 */
function eventAreaSnapshot(ev: GPSEvent): { name: string; color: string; polygon_coords: string } | null {
  if (!ev.attributes_json) return null;
  try {
    const attrs = JSON.parse(ev.attributes_json);
    const poly = typeof attrs?.fence_polygon === "string" ? attrs.fence_polygon : "";
    if (!poly) return null;
    return {
      name: typeof attrs?.fence_name === "string" && attrs.fence_name ? attrs.fence_name : "Geofence",
      color: typeof attrs?.fence_color === "string" && attrs.fence_color ? attrs.fence_color : "#FF0000",
      polygon_coords: poly,
    };
  } catch {
    return null;
  }
}


/** Baterai: -1 = perangkat belum lapor. Warna mengikuti level. */
function BatteryIcon({ level }: { level: number }) {
  if (level < 0) {
    return (
      <span
        title="Level baterai belum diketahui"
        className="inline-flex text-gray-300 dark:text-gray-600"
      >
        <Battery className="w-4 h-4" />
      </span>
    );
  }

  const isLow = level <= 20;
  const Icon =
    level <= 10
      ? BatteryWarning
      : level <= 20
        ? BatteryLow
        : level <= 60
          ? BatteryMedium
          : BatteryFull;
  const color = isLow ? "text-red-500" : level <= 60 ? "text-yellow-500" : "text-green-500";

  return (
    <span title={`Baterai ${level.toFixed(0)}%`} className={`inline-flex ${color}`}>
      <Icon className="w-4 h-4" />
    </span>
  );
}

/** Sinyal GSM: -1 = unknown (CircleHelp), 0 none, 1 weak, 2 medium, 3 strong. */
function SignalLevelIcon({ level }: { level: number }) {
  if (level < 0) {
    return (
      <span
        title="Sinyal belum diketahui"
        className="inline-flex text-gray-300 dark:text-gray-600"
      >
        <CircleHelp className="w-4 h-4" />
      </span>
    );
  }
  const Icon =
    level >= 3 ? Signal : level === 2 ? SignalHigh : level === 1 ? SignalMedium : SignalLow;
  const color =
    level >= 3
      ? "text-green-500"
      : level === 2
        ? "text-green-400"
        : level === 1
          ? "text-yellow-500"
          : "text-red-500";
  const label = level === 3 ? "Kuat" : level === 2 ? "Sedang" : level === 1 ? "Lemah" : "Tidak ada";
  return (
    <span title={`Sinyal GSM ${label}`} className={`inline-flex ${color}`}>
      <Icon className="w-4 h-4" />
    </span>
  );
}

/** Warna badge tone (untuk status command). */
function toneClasses(tone: "gray" | "yellow" | "blue" | "green" | "red"): string {
  switch (tone) {
    case "green":
      return "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400";
    case "blue":
      return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";
    case "yellow":
      return "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400";
    case "red":
      return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400";
  }
}

function HeaderBadge({ label, tone }: { label: string; tone: "green" | "gray" | "yellow" }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${toneClasses(tone)}`}>
      {label}
    </span>
  );
}

/**
 * Shortcut command GT06 yang sering dipakai admin. Klik chip = langsung kirim
 * tanpa ngetik — berguna untuk cek status cepat. Tambahkan di sini kalau
 * ada command lain yang ingin dijadikan shortcut.
 */
const COMMAND_SHORTCUTS: { label: string; command: string; hint?: string }[] = [
  { label: "STATUS#", command: "STATUS#", hint: "Status perangkat (ACC, defense, GPS, GSM)" },
  { label: "PARAM#", command: "PARAM#", hint: "Param konfigurasi GT06" },
];

/**
 * Jumlah maksimum riwayat command yang dimuat ke FE dari endpoint.
 * BE default 50, tapi di UI chat kita tampilkan sebagian kecil agar scroll
 * tetap nyaman dan DOM bubble tidak menumpuk. Naikkan kalau perlu, misal
 * untuk halaman arsip.
 */
const COMMAND_HISTORY_LIMIT = 8;

// ---- Halaman ----------------------------------------------------------------

export default function GpsDetailPage() {
  const params = useParams<{ id: string }>();
  const deviceId = params?.id ?? "";

  const [gps, setGps] = useState<Gps | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [position, setPosition] = useState<Position | null>(null);
  const [commands, setCommands] = useState<DeviceCommand[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- Riwayat Posisi (rute di peta) ----
  // Rentang waktu memakai created_at (waktu server/WIB). Default: hari ini
  // 00:00–23:59. Tanggal & jam mulai/selesai dipilih terpisah sehingga bisa
  // menampilkan rute lintas hari. Threshold kecepatan diambil dari
  // gps.speed_threshold; 0 = kecepatan diabaikan (tanpa segmen/label ngebut).
  const [routeStartDate, setRouteStartDate] = useState(todayStr());
  const [routeStart, setRouteStart] = useState("00:00");
  const [routeEndDate, setRouteEndDate] = useState(todayStr());
  const [routeEnd, setRouteEnd] = useState("23:59");
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeTruncated, setRouteTruncated] = useState(false);
  const [routeLoaded, setRouteLoaded] = useState(false);
  const [posMapOpen, setPosMapOpen] = useState(false);

  // ---- Log perangkat (tab: GPS Event / Log Posisi) ----
  // Dua sumber data digabung dalam satu Section dengan tab. Tab GPS Event
  // tampil lebih dulu karena event (alarm/geofence) yang biasanya dicari admin.
  const [logTab, setLogTab] = useState<"event" | "position">("event");

  // Event GPS (tbl_gps_event) — seluruh tipe event milik device ini.
  const [evDateFilter, setEvDateFilter] = useState("");
  const evDateRef = useRef("");
  const evPaging = useKeysetPaging<GPSEvent>({
    enabled: !!deviceId && logTab === "event",
    fetchPage: ({ last_id, limit }) => {
      const p = new URLSearchParams();
      p.set("device_id", deviceId);
      p.set("last_id", String(last_id));
      p.set("limit", String(limit));
      if (evDateRef.current) p.set("date", evDateRef.current);
      return adminFetch<GPSEvent[]>(`/events/all?${p}`);
    },
  });

  // Modal peta untuk event geofence — persis seperti di halaman detail geofence.
  // Area dicari dulu di daftar geofence device (instan), lalu fallback ke
  // /geofence/:id kalau tidak ada (mis. assignment sudah dilepas).
  const [mapEvent, setMapEvent] = useState<GPSEvent | null>(null);
  const [mapGeofence, setMapGeofence] = useState<{
    name: string;
    color: string;
    polygon_coords: string;
  } | null>(null);
  // true = area berasal dari snapshot saat event (bukan record terkini).
  const [mapAreaSnapshot, setMapAreaSnapshot] = useState(false);
  const mapReqRef = useRef(0);

  const openEventMap = useCallback(
    async (ev: GPSEvent) => {
      if (!isGeofenceEvent(ev)) return;
      setMapEvent(ev);

      // 1. Snapshot area saat event terjadi — paling akurat, tak terpengaruh
      //    edit/hapus geofence. Dipakai lebih dulu bila tersedia.
      const snap = eventAreaSnapshot(ev);
      if (snap) {
        setMapGeofence(snap);
        setMapAreaSnapshot(true);
        return;
      }

      // 2. Fallback: record geofence terkini dari list lokal.
      const local = geofences.find((g) => g.geofence_id === ev.geofence_id);
      if (local) {
        setMapGeofence({
          name: local.name,
          color: local.color,
          polygon_coords: local.polygon_coords,
        });
        setMapAreaSnapshot(false);
        return;
      }
      setMapGeofence(null);
      setMapAreaSnapshot(false);
      if (!ev.geofence_id) {
        // Event geofence dari sisi perangkat tidak menyimpan geofence_id,
        // jadi areanya tidak bisa diambil — peta tetap tampil dengan titiknya.
        return;
      }
      const reqId = ++mapReqRef.current;
      const res = await adminFetch<Geofence>(`/geofence/${encodeURIComponent(ev.geofence_id)}`);
      if (mapReqRef.current !== reqId) return;
      setMapGeofence(
        res.status === 1 && res.data
          ? { name: res.data.name, color: res.data.color, polygon_coords: res.data.polygon_coords }
          : null,
      );
    },
    [geofences],
  );

  // ---- Log posisi mentah (tbl_position_history) ----
  // Section di bawah halaman: semua fix GPS yang pernah diterima device ini.
  const [posDateFilter, setPosDateFilter] = useState("");
  const posDateRef = useRef("");
  const posPaging = useKeysetPaging<PositionHistory>({
    enabled: !!deviceId && logTab === "position",
    fetchPage: ({ last_id, limit }) => {
      const p = new URLSearchParams();
      p.set("device_id", deviceId);
      p.set("last_id", String(last_id));
      p.set("limit", String(limit));
      if (posDateRef.current) p.set("date", posDateRef.current);
      return adminFetch<PositionHistory[]>(`/positions/history?${p}`);
    },
  });

  // Auto-refresh tab Log Posisi: segarkan daftar tiap 15 dtk tanpa spinner agar
  // fix GPS baru muncul sendiri. Hanya jalan saat tab "Log Posisi" aktif dan
  // otomatis berhenti saat tab browser tidak dilihat (lihat useAutoRefresh).
  const posAutoRefresh = useAutoRefresh({
    intervalMs: POS_AUTO_REFRESH_MS,
    paused: logTab !== "position",
    onRefresh: () => posPaging.silentRefresh(),
  });

  // Muat rute pada rentang tanggal + jam mulai/selesai yang dipilih.
  async function loadRoute() {
    if (!deviceId) return;
    const start = `${routeStartDate} ${routeStart}:00`;
    const end = `${routeEndDate} ${routeEnd}:59`;
    if (start > end) {
      setRoutePoints([]);
      setRouteLoaded(false);
      setRouteTruncated(false);
      setRouteError("Waktu selesai harus setelah waktu mulai.");
      return;
    }
    setRouteLoading(true);
    setRouteError(null);
    setRouteTruncated(false);
    const p = new URLSearchParams();
    p.set("device_id", deviceId);
    p.set("start", start);
    p.set("end", end);
    p.set("limit", String(ROUTE_LIMIT));
    const res = await adminFetch<PositionHistory[]>(`/positions/route?${p}`);
    setRouteLoading(false);
    setRouteLoaded(true);
    if (res.status !== 1 || !Array.isArray(res.data)) {
      setRoutePoints([]);
      setRouteError(getApiErrorMessage(res, "Gagal memuat rute"));
      return;
    }
    setRoutePoints(
      res.data.map((ph) => ({
        lat: ph.latitude,
        lng: ph.longitude,
        speed: ph.speed,
        time: ph.created_at || ph.device_time,
      })),
    );
    setRouteTruncated(res.data.length >= ROUTE_LIMIT);
  }

  function resetRoute() {
    setRoutePoints([]);
    setRouteLoaded(false);
    setRouteError(null);
    setRouteTruncated(false);
  }

  // State UI kirim command kustom. Pesan balasan GPS bersifat async — masuk
  // lewat TCP kemudian di-update ke baris command oleh BE. Kita re-fetch
  // riwayat setelah beberapa detik agar reply terlihat di tabel.
  const [cmdInput, setCmdInput] = useState("");
  const [cmdSending, setCmdSending] = useState(false);
  const [cmdError, setCmdError] = useState<string | null>(null);
  const [cmdSuccess, setCmdSuccess] = useState<string | null>(null);

  // Untuk feel chat: saat admin tekan Enter, langsung tambahkan bubble optimistik
  // dengan status 'sending' agar animasi muncul + scroll bawah terjadi instan.
  // Nanti di-replace dengan baris asli dari API.
  const [pendingCmd, setPendingCmd] = useState<{
    command_id: string;
    text: string;
    sent_at: string;
  } | null>(null);

  // Drawer riwayat command — slide dari kanan saat tombol diklik. ESC menutup.
  const [cmdDrawerOpen, setCmdDrawerOpen] = useState(false);

  // ---- Modal Tambah Kendaraan ----
  const [vehModalOpen, setVehModalOpen] = useState(false);
  const [vehSaving, setVehSaving] = useState(false);
  const [vehError, setVehError] = useState<string | null>(null);
  const [vehEditingId, setVehEditingId] = useState<string | null>(null); // null = create, string = edit
  const [vehDeleteId, setVehDeleteId] = useState<string | null>(null);
  const [vehDeleting, setVehDeleting] = useState(false);
  const [vehForm, setVehForm] = useState({
    name: "",
    license_plate: "",
    vehicle_type: "Mobil",
    brand: "",
    model: "",
    year: "",
    color: "",
    vin_number: "",
    odometer_km: "",
    driver_ids: [] as string[],
  });
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // ---- Device drivers (supir yang terassign ke kendaraan di device ini) ----
  const [deviceDrivers, setDeviceDrivers] = useState<Driver[]>([]);
  const [drvModalOpen, setDrvModalOpen] = useState(false);
  const [allBisnisDrivers, setAllBisnisDrivers] = useState<Driver[]>([]);
  const [loadingDrvList, setLoadingDrvList] = useState(false);
  const [assigningDrv, setAssigningDrv] = useState<string | null>(null);
  const [drvVehicleId, setDrvVehicleId] = useState<string>("");
  const [drvSelectedIds, setDrvSelectedIds] = useState<string[]>([]);

  // ---- Geofence map modal ----
  const [geoModalOpen, setGeoModalOpen] = useState(false);
  const [geoEdit, setGeoEdit] = useState<GeofenceData | null>(null);

  // ---- Toast ----
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3000);
  }

  // ---- Drawer detail kendaraan ----
  const [vehDrawer, setVehDrawer] = useState<Vehicle | null>(null);
  useEffect(() => {
    if (!vehDrawer) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setVehDrawer(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [vehDrawer]);

    // ESC menutup drawer command. Hanya dipasang saat drawer terbuka.
    useEffect(() => {
      if (!cmdDrawerOpen) return;
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setCmdDrawerOpen(false);
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [cmdDrawerOpen]);

    // Ref untuk auto-scroll bubble chat ke pesan terbaru. Tujuan:
    //   - Saat drawer pertama mount → scroll ke bawah (buka chat di pesan terbaru).
    //   - Saat ada bubble baru masuk (commands.length/pendingCmd) → scroll bawah.
    //   - Saat balasan baru masuk (delivered_at baru) → scroll bawah.
    //   - TIDAK scroll kalau hanya field lain berubah agar tidak ganggu baca user.
    const chatScrollRef = useRef<HTMLDivElement | null>(null);
    const prevCmdCountRef = useRef<number>(-1);
    const lastDeliveredAtRef = useRef<string>("");
    const prevDrawerOpenRef = useRef<boolean>(false);
    useIsomorphicLayoutEffect(() => {
      // Update drawer ref lebih dulu — saat drawer unmount, el=null dan kita
      // skip scroll, tapi tetap harus update ref agar pembukaan berikutnya
      // terdeteksi sebagai transisi false→true.
      const wasOpen = prevDrawerOpenRef.current;
      prevDrawerOpenRef.current = cmdDrawerOpen;

      const el = chatScrollRef.current;
      if (!el) return;

      // Saat drawer transisi false→true, selalu scroll bawah (auto-position
      // chat di pesan terbaru). Tanpa ini, prevCmdCountRef sudah sama dengan
      // commands.length dari render sebelumnya jadi tidak trigger.
      const justOpened = cmdDrawerOpen && !wasOpen;

      // Cari delivered_at terbaru di antara bubble. Saat reply masuk, BE men-set
      // delivered_at ke timestamp baru — ini menjadi penanda 'ada balasan baru'.
      const latestDelivered = commands.reduce<string>(
        (acc, c) => (c.delivered_at && c.delivered_at > acc ? c.delivered_at : acc),
        "",
      );
      const newReply = latestDelivered !== "" && latestDelivered !== lastDeliveredAtRef.current;
      const newBubble = commands.length !== prevCmdCountRef.current;
      const isOptimistic = !!pendingCmd;

      if (justOpened || newBubble || isOptimistic || newReply) {
        const scrollToBottom = () => {
          el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        };
        scrollToBottom();
        const raf = requestAnimationFrame(scrollToBottom);
        prevCmdCountRef.current = commands.length;
        lastDeliveredAtRef.current = latestDelivered;
        return () => cancelAnimationFrame(raf);
      }
      prevCmdCountRef.current = commands.length;
      lastDeliveredAtRef.current = latestDelivered;
      // commands dibaca untuk kalkulasi latestDelivered.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [commands.length, pendingCmd, commands, cmdDrawerOpen]);

  const refreshCommands = useCallback(async () => {
    const cmdRes = await adminFetch<DeviceCommand[]>(
      `/gps/commands?device_id=${deviceId}&limit=${COMMAND_HISTORY_LIMIT}`,
    );
    if (cmdRes.status === 1 && Array.isArray(cmdRes.data)) {
      setCommands(cmdRes.data);
    }
  }, [deviceId]);

  // Inti pengiriman command. Dipakai oleh form input (text dari cmdInput)
  // dan shortcut chip (text lewat parameter). Mengembalikan Promise supaya
  // caller bisa await (berguna saat dipicu dari chip).
  const dispatchCommand = useCallback(
    async (text: string) => {
      if (!gps) return;
      text = text.trim();
      if (!text) {
        setCmdError("Perintah tidak boleh kosong.");
        return;
      }
      // Perintah destruktif (misal RELAY,1#) butuh konfirmasi admin agar tak
      // sengaja memicu pemadaman mesin. Hanya satu konfirmasi inline, tanpa modal.
      const destructive = /^RELAY\s*,\s*[01]\s*#?$/i.test(text);
      if (destructive) {
        const ok = window.confirm(
          `Perintah "${text}" akan dikirim ke perangkat. Lanjutkan?`,
        );
        if (!ok) return;
      }

      setCmdError(null);
      setCmdSuccess(null);
      setCmdSending(true);
      // Tampilkan bubble optimistik seketika agar animasi + auto-scroll langsung
      // terasa seperti chat beneran. Kita hapus bubble ini begitu API refresh
      // pertama selesai (baris asli dari BE sudah menggantikan).
      const tempId = `pending-${Date.now()}`;
      setPendingCmd({
        command_id: tempId,
        text,
        sent_at: nowLocalString(),
      });
      try {
        const res = await adminFetch<{ imei: string; command: string }>(`/gps/command`, {
          method: "POST",
          body: {
            imei: gps.unique_id,
            command: text,
          },
        });
        if (res.status !== 1) {
          setCmdError(getApiErrorMessage(res, "Gagal mengirim perintah."));
          setPendingCmd(null);
        } else {
          setCmdSuccess(`Perintah "${text}" terkirim. Menunggu balasan perangkat…`);
          setCmdInput("");
          // Tunda refresh 1.5 detik agar baris baru sudah di-insert oleh BE.
          window.setTimeout(() => {
            void refreshCommands().finally(() => setPendingCmd(null));
          }, 1500);
          // Refresh kedua untuk menangkap reply yang masuk di detik-detik berikutnya.
          window.setTimeout(() => {
            void refreshCommands();
          }, 4000);
        }
      } catch (e) {
        setCmdError(e instanceof Error ? e.message : "Gagal mengirim perintah.");
      } finally {
        setCmdSending(false);
      }
    },
    [gps, refreshCommands],
  );

  // Wrapper untuk form input (ambil teks dari state cmdInput).
  const sendCustomCommand = useCallback(() => {
    void dispatchCommand(cmdInput);
  }, [dispatchCommand, cmdInput]);

  // ---- Modal Kendaraan (create / edit) -------------------------------------------
  async function openVehicleModal() {
    if (!gps) return;
    setVehEditingId(null);
    setVehForm({
      name: "",
      license_plate: "",
      vehicle_type: "Mobil",
      brand: "",
      model: "",
      year: "",
      color: "",
      vin_number: "",
      odometer_km: "",
      driver_ids: [],
    });
    setVehError(null);
    setVehModalOpen(true);
    // Fetch drivers milik bisnis yang sama
    if (gps.bisnis_id) {
      const res = await adminFetch<Driver[]>(`/driver?bisnis_id=${gps.bisnis_id}&limit=100`);
      setDrivers(res.status === 1 && Array.isArray(res.data) ? res.data : []);
    }
  }

  async function openEditVehicleModal(v: Vehicle) {
    if (!gps) return;
    setVehEditingId(v.vehicle_id);
    setVehForm({
      name: v.name,
      license_plate: v.license_plate,
      vehicle_type: v.vehicle_type || "Mobil",
      brand: v.brand || "",
      model: v.model || "",
      year: String(v.year || ""),
      color: v.color || "",
      vin_number: v.vin_number || "",
      odometer_km: String(v.odometer_km || ""),
      driver_ids: [],
    });
    setVehError(null);
    setVehModalOpen(true);
    // Fetch drivers + assigned drivers
    if (gps.bisnis_id) {
      const [drvRes, assignedRes] = await Promise.all([
        adminFetch<Driver[]>(`/driver?bisnis_id=${gps.bisnis_id}&limit=100`),
        adminFetch<{ vehicle_id: string; driver_id: string }[]>(`/vehicle/${v.vehicle_id}/drivers`),
      ]);
      setDrivers(drvRes.status === 1 && Array.isArray(drvRes.data) ? drvRes.data : []);
      if (assignedRes.status === 1 && Array.isArray(assignedRes.data)) {
        setVehForm((prev) => ({ ...prev, driver_ids: assignedRes.data.map((d) => d.driver_id) }));
      }
    }
  }

  async function handleSaveVehicle(e: React.FormEvent) {
    e.preventDefault();
    if (!gps) return;
    setVehSaving(true);
    setVehError(null);
    const payload: Record<string, unknown> = {
      name: vehForm.name,
      license_plate: vehForm.license_plate,
      vehicle_type: vehForm.vehicle_type,
      brand: vehForm.brand,
      model: vehForm.model,
      year: vehForm.year ? Number(vehForm.year) : 0,
      color: vehForm.color,
      vin_number: vehForm.vin_number,
      odometer_km: vehForm.odometer_km ? Number(vehForm.odometer_km) : 0,
      driver_ids: vehForm.driver_ids,
    };

    let res;
    if (vehEditingId) {
      res = await adminFetch(`/vehicle/${vehEditingId}`, { method: "PUT", body: payload });
    } else {
      res = await adminFetch(`/device/${gps.device_id}/vehicle`, { method: "POST", body: payload });
    }

    setVehSaving(false);
    if (res.status !== 1) {
      setVehError(getApiErrorMessage(res, "Gagal simpan"));
      return;
    }
    setVehModalOpen(false);
    showToast(vehEditingId ? "Kendaraan berhasil diupdate" : "Kendaraan berhasil dibuat");
    await load();
  }

  async function handleDeleteVehicle() {
    if (!vehDeleteId) return;
    setVehDeleting(true);
    const res = await adminFetch(`/vehicle/${vehDeleteId}`, { method: "DELETE" });
    setVehDeleting(false);
    setVehDeleteId(null);
    if (res.status === 1) {
      showToast("Kendaraan berhasil dihapus");
      await load();
    }
  }

  // ---- Geofence ----
  function openGeoModal(edit?: GeofenceData) {
    setGeoEdit(edit || null);
    setGeoModalOpen(true);
  }

  async function handleUnassignGeofence(geofenceId: string) {
    if (!deviceId) return;
    const res = await adminFetch(`/device/${deviceId}/geofences/${geofenceId}`, { method: "DELETE" });
    if (res.status === 1) {
      showToast("Geofence di-unassign dari device");
      await load();
    } else {
      showToast(getApiErrorMessage(res, "Gagal unassign"), "error");
    }
  }

  // ---- Supir assign ----
  async function openDrvModal() {
    if (!gps?.bisnis_id) return;
    setDrvModalOpen(true);
    setDrvSelectedIds([]);
    setDrvVehicleId(vehicles[0]?.vehicle_id || "");
    setLoadingDrvList(true);
    const res = await adminFetch<Driver[]>(`/driver?bisnis_id=${gps.bisnis_id}&limit=100`);
    setAllBisnisDrivers(res.status === 1 && Array.isArray(res.data) ? res.data : []);
    setLoadingDrvList(false);
  }

  // Driver dari bisnis yang belum di-assign ke kendaraan ini
  const assignedDrvIds = deviceDrivers.map((d) => d.driver_id);
  const availableDrivers = allBisnisDrivers.filter((d) => !assignedDrvIds.includes(d.driver_id));

  async function handleAssignDriver() {
    if (!drvVehicleId || drvSelectedIds.length === 0) return;
    setAssigningDrv("saving");

    // Ambil driver yang sudah di-assign ke kendaraan ini
    const existingRes = await adminFetch<{ driver_id: string }[]>(`/vehicle/${drvVehicleId}/drivers`);
    const existingIds = existingRes.status === 1 && Array.isArray(existingRes.data)
      ? existingRes.data.map((d) => d.driver_id)
      : [];

    // Gabungkan yang lama + baru (unique)
    const mergedIds = [...new Set([...existingIds, ...drvSelectedIds])];

    const res = await adminFetch(`/vehicle/${drvVehicleId}/drivers`, {
      method: "PUT",
      body: { driver_ids: mergedIds },
    });

    setAssigningDrv(null);
    if (res.status === 1) {
      showToast("Supir berhasil di-assign");
      setDrvModalOpen(false);
      await load();
    } else {
      showToast(getApiErrorMessage(res, "Gagal assign supir"), "error");
    }
  }

  // Endpoint detail device hanya mengembalikan baris tbl_device, sedangkan
  // relasinya (kamera, kendaraan, geofence) dicari lewat device_id yang sama.
  const load = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    setError(null);

    const detailRes = await adminFetch<Gps>(`/device/${deviceId}`);
    if (detailRes.status !== 1 || !detailRes.data) {
      setError(getApiErrorMessage(detailRes, "Gagal memuat detail GPS."));
      setLoading(false);
      return;
    }
    setGps(detailRes.data);
    const bisnisID = detailRes.data.bisnis_id;

    // Panggilan relasi bersifat best-effort: satu endpoint gagal tidak boleh
    // menggagalkan seluruh halaman, jadi tiap hasil dicek sendiri.
    const [camRes, vehRes, cmdRes, posRes, geoRes, drvRes] = await Promise.all([
      adminFetch<Camera[]>(`/camera?device_id=${deviceId}`),
      adminFetch<Vehicle[]>(bisnisID ? `/vehicle?bisnis_id=${bisnisID}&limit=100` : "/vehicle?limit=100"),
      adminFetch<DeviceCommand[]>(`/gps/commands?device_id=${deviceId}&limit=${COMMAND_HISTORY_LIMIT}`),
      adminFetch<Position[]>(`/positions/all?device_id=${deviceId}&limit=1`),
      adminFetch<Geofence[]>(bisnisID ? `/geofence?bisnis_id=${encodeURIComponent(bisnisID)}&limit=100` : "/geofence?limit=100"),
      adminFetch<Driver[]>(`/device/${deviceId}/drivers`),
    ]);

    setCameras(camRes.status === 1 && Array.isArray(camRes.data) ? camRes.data : []);

    // /vehicle hanya memfilter per bisnis, jadi kendaraan yang benar-benar
    // memakai GPS ini disaring di sisi klien.
    setVehicles(
      vehRes.status === 1 && Array.isArray(vehRes.data)
        ? vehRes.data.filter((v) => v.device_id === deviceId)
        : [],
    );

    setCommands(cmdRes.status === 1 && Array.isArray(cmdRes.data) ? cmdRes.data : []);
    setPosition(posRes.status === 1 && Array.isArray(posRes.data) ? (posRes.data[0] ?? null) : null);

    setGeofences(geoRes.status === 1 && Array.isArray(geoRes.data) ? geoRes.data : []);
    setDeviceDrivers(drvRes.status === 1 && Array.isArray(drvRes.data) ? drvRes.data : []);

    setLoading(false);
  }, [deviceId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" />
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-[14px] animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-52 bg-gray-200 dark:bg-gray-700 rounded-[14px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !gps) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 font-medium">{error || "GPS tidak ditemukan"}</p>
          <Link
            href="/admin834kf/device"
            className="mt-4 inline-block text-[13px] text-[#2964e7] hover:underline"
          >
            Kembali ke daftar GPS
          </Link>
        </div>
      </div>
    );
  }

  const status = (gps.status || "").toLowerCase();
  const isOnline = status === "online";
  const hasFix = !!position && (position.latitude !== 0 || position.longitude !== 0);

  // Threshold kecepatan rute: diambil dari device; 0 = kecepatan diabaikan.
  const speedThreshold = gps.speed_threshold ?? 0;
  const routeStat = routeStats(routePoints, speedThreshold);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/admin834kf/device"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#2964e7] to-[#1f4fc4] flex items-center justify-center">
            <Navigation className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{gps.name}</h1>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 font-mono truncate">
              {gps.device_id}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <HeaderBadge
                label={isOnline ? "Online" : status === "pending" ? "Pending" : "Offline"}
                tone={isOnline ? "green" : status === "pending" ? "yellow" : "gray"}
              />
              {gps.disabled === 1 && <HeaderBadge label="Nonaktif" tone="gray" />}
              {gps.bisnis?.name && (
                <Link href={`/admin834kf/bisnis/${gps.bisnis_id}`}>
                  <HeaderBadge label={gps.bisnis.name} tone="gray" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Tombol Command — nempel ke kanan header, buka drawer riwayat chat.
            Badge 'pending' muncul bila ada command yang belum dibalas. */}
        <button
          type="button"
          onClick={() => setCmdDrawerOpen(true)}
          className="shrink-0 ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1c] text-[13px] font-medium text-gray-700 dark:text-gray-200 hover:border-[#2964e7]/40 hover:bg-[#2964e7]/5 dark:hover:bg-[#2964e7]/10 transition-colors"
        >
          <MessageSquare className="w-4 h-4 text-[#2964e7]" />
          Command
          {commands.some((c) => c.status === "queued" || c.status === "sent") && (
            <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#2964e7] text-white text-[10px] font-semibold">
              {commands.filter((c) => c.status === "queued" || c.status === "sent").length}
            </span>
          )}
        </button>
      </div>

      {/* Ringkasan — 4 stat utama (Baterai, Sinyal, Ignition, Arah) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<BatteryIcon level={Number(gps.battery_level ?? -1)} />}
          label="Baterai"
          value={batteryLabel(gps.battery_level)}
        />
        <StatCard
          icon={<SignalLevelIcon level={Number(gps.signal_level ?? -1)} />}
          label="Sinyal GSM"
          value={
            gps.signal_level < 0
              ? "Belum diketahui"
              : gps.signal_level === 3
                ? "Kuat"
                : gps.signal_level === 2
                  ? "Sedang"
                  : gps.signal_level === 1
                    ? "Lemah"
                    : "Tidak ada"
          }
        />
        <StatCard
          icon={
            gps.ignition < 0 ? (
              <CircleHelp className="w-4 h-4 text-gray-300 dark:text-gray-600" />
            ) : gps.ignition === 1 ? (
              <Zap className="w-4 h-4 text-green-500" />
            ) : gps.ignition === 2 ? (
              <Zap className="w-4 h-4 text-orange-300 dark:text-orange-400/70" />
            ) : (
              <ZapOff className="w-4 h-4 text-gray-400" />
            )
          }
          label="Ignition"
          value={
            gps.ignition < 0
              ? "Belum diketahui"
              : gps.ignition === 1
                ? "Hidup berjalan"
                : gps.ignition === 2
                  ? "Hidup parkir"
                  : "Mati"
          }
        />
        <StatCard
          icon={
            gps.course < 0 ? (
              <CircleHelp className="w-4 h-4 text-gray-300 dark:text-gray-600" />
            ) : (
              <span className="inline-flex" style={{ transform: `rotate(${gps.course}deg)` }}>
                <Navigation className="w-4 h-4" />
              </span>
            )
          }
          label="Arah"
          value={gps.course < 0 ? "Belum diketahui" : `${gps.course.toFixed(0)}°`}
        />
      </div>

      {/* Identitas perangkat — full width, 2 kolom data */}
      <Section icon={<Cpu className="w-4 h-4" />} title="Identitas Perangkat">
        <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-700/50 p-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
            <DevInfoCell label="IMEI / Unique ID" value={gps.unique_id} mono />
            <DevInfoCell label="Protokol" value={gps.protocol} />
            <DevInfoCell label="Model" value={gps.model} />
            <DevInfoCell label="Manufaktur" value={gps.manufacturer} />
            <DevInfoCell label="Kategori" value={gps.category} />
            <DevInfoCell label="Nomor SIM" value={gps.sim_number} mono />
            <DevInfoCell label="Nomor Telepon" value={gps.phone_number} mono />
            <DevInfoCell
              label="Batas Kecepatan"
              value={gps.speed_threshold > 0 ? `${gps.speed_threshold.toFixed(0)} km/h` : null}
              fallback="Nonaktif"
            />
            <DevInfoCell
              label="Harga Langganan"
              value={gps.price > 0 ? `${IDR.format(gps.price)}/bulan` : null}
              fallback="Belum diatur"
            />
            <DevInfoCell
              label="Berakhir"
              value={gps.expired_at ? formatDate(gps.expired_at) : null}
              fallback="Belum diatur"
            />
            <DevInfoCell
              label="Defense"
              value={gps.defense_state < 0 ? null : gps.defense_state === 1 ? "Aktif" : "Nonaktif"}
              fallback="Belum diketahui"
            />
          </div>
        </div>
      </Section>

      {/* Kepemilikan & Posisi — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Kepemilikan & waktu */}
        <Section icon={<Shield className="w-4 h-4" />} title="Kepemilikan & Waktu">
          <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-700/50 divide-y divide-gray-100 dark:divide-gray-700/30">
            <DevInfoCell
              label="Bisnis"
              value={gps.bisnis?.name || null}
              fallback="Belum di-assign"
              link={gps.bisnis_id ? `/admin834kf/bisnis/${gps.bisnis_id}` : undefined}
            />
            <DevInfoCell label="Bisnis ID" value={gps.bisnis_id} mono />
            <DevInfoCell
              label="Status"
              custom={<StatusBadge status={gps.status || "unknown"} />}
            />
            <DevInfoCell label="Terakhir Online" value={formatDateTimeSec(gps.last_seen_at)} />
            <DevInfoCell label="Didaftarkan" value={formatDateTimeSec(gps.created_at)} />
          </div>
        </Section>

        {/* Posisi terakhir */}
        <Section icon={<Navigation className="w-4 h-4" />} title="Posisi Terakhir">
          {!hasFix ? (
            <EmptyState
              icon={<Navigation className="w-8 h-8" />}
              message="Perangkat belum pernah mengirim koordinat valid."
            />
          ) : (
            <div className="space-y-3">
              <div className="relative isolate rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700/50 h-48">
                <GeofenceAreaMap
                  className="absolute inset-0"
                  geofence={null}
                  point={{
                    lat: position!.latitude,
                    lng: position!.longitude,
                    label: "Lokasi terkini",
                    color: "#2964e7",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setPosMapOpen(true)}
                  className="absolute top-3 right-3 z-[1000] inline-flex items-center gap-1 px-2 py-1 bg-white/90 dark:bg-[#1a1a1c]/90 text-[11px] font-medium text-gray-700 dark:text-gray-200 rounded-md shadow hover:bg-white dark:hover:bg-[#1a1a1c] transition-colors"
                >
                  <Maximize2 className="w-3 h-3" />
                  Perbesar
                </button>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-700/50 divide-y divide-gray-100 dark:divide-gray-700/30">
                <DevInfoCell label="Koordinat" value={`${position!.latitude.toFixed(6)}, ${position!.longitude.toFixed(6)}`} mono />
                <DevInfoCell label="Alamat" value={position!.address || null} fallback="-" />
                <DevInfoCell label="Kecepatan" value={`${position!.speed.toFixed(1)} km/h`} />
                <DevInfoCell label="Ketinggian" value={`${position!.altitude.toFixed(0)} m`} />
                <DevInfoCell label="Akurasi" value={`${position!.accuracy.toFixed(0)} m`} />
                <DevInfoCell label="Satelit" value={String(position!.satellites)} />
                <DevInfoCell label="Waktu Perangkat" value={formatDateTimeSec(position!.device_time)} />
              </div>
            </div>
          )}
        </Section>
      </div>

      {/* Riwayat Posisi — rute perjalanan di peta */}
      <Section icon={<Route className="w-4 h-4" />} title="Riwayat Posisi">
        <div className="flex flex-wrap items-end gap-2 mb-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-1">Tanggal Mulai</label>
            <DateInput value={routeStartDate} onChange={setRouteStartDate} className={ROUTE_INPUT_CLS} />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-1">Jam Mulai</label>
            <input
              type="time"
              value={routeStart}
              onChange={(e) => setRouteStart(e.target.value)}
              className={ROUTE_INPUT_CLS}
            />
          </div>
          <span className="self-end pb-2 text-gray-300 dark:text-gray-600">—</span>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-1">Tanggal Selesai</label>
            <DateInput value={routeEndDate} onChange={setRouteEndDate} className={ROUTE_INPUT_CLS} />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-1">Jam Selesai</label>
            <input
              type="time"
              value={routeEnd}
              onChange={(e) => setRouteEnd(e.target.value)}
              className={ROUTE_INPUT_CLS}
            />
          </div>
          <button
            type="button"
            onClick={() => void loadRoute()}
            disabled={routeLoading || !routeStartDate || !routeEndDate}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-white bg-[#2964e7] rounded-lg hover:bg-[#2150c5] disabled:opacity-50 transition-colors"
          >
            <Route className="w-3.5 h-3.5" />
            {routeLoading ? "Memuat..." : "Tampilkan Rute"}
          </button>
          {routeLoaded && (
            <button
              type="button"
              onClick={resetRoute}
              className="px-3 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {speedThreshold <= 0 && (
          <p className="mb-3 text-[12px] text-gray-500 dark:text-gray-400">
            Threshold kecepatan device belum diisi — penanda kecepatan tidak ditampilkan.
          </p>
        )}

        {routeError && (
          <p className="text-[13px] text-red-600 dark:text-red-400 py-3">{routeError}</p>
        )}

        {routeLoaded && !routeLoading && routePoints.length === 0 && !routeError && (
          <EmptyState
            icon={<Route className="w-8 h-8" />}
            message="Tidak ada data posisi pada rentang waktu ini."
          />
        )}

        {routePoints.length > 0 && (
          <>
            <div className="relative isolate rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700/50 h-[420px]">
              <RouteMap className="absolute inset-0" points={routePoints} threshold={speedThreshold} />
              <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-3 px-3 py-2 bg-white/90 dark:bg-[#1a1a1c]/90 rounded-lg shadow text-[11px] text-gray-600 dark:text-gray-300">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-4 h-1 rounded-full" style={{ backgroundColor: "#9ca3af" }} />
                  Belum dilalui
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-4 h-1 rounded-full" style={{ backgroundColor: "#2964e7" }} />
                  Sudah dilalui
                </span>
                {speedThreshold > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-4 h-1 rounded-full" style={{ backgroundColor: "#dc2626" }} />
                    &gt; {speedThreshold.toFixed(0)} km/h
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#16a34a" }} />
                  Mulai
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#fb923c" }} />
                  Selesai
                </span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-700/50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">Jarak</p>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white">
                  {(routeStat.distanceMeters / 1000).toFixed(2)} km
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-700/50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">Kecepatan Maks</p>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white">
                  {routeStat.maxSpeed.toFixed(1)} km/h
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-700/50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">Segmen Ngebut</p>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white">
                  {speedThreshold > 0 ? routeStat.overspeedRuns : "-"}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-700/50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">Total Titik</p>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white">{routePoints.length}</p>
              </div>
            </div>

            {routeTruncated && (
              <p className="mt-2 text-[12px] text-amber-600 dark:text-amber-400">
                Rute dipotong pada {ROUTE_LIMIT} titik pertama. Persempit rentang waktu untuk detail penuh.
              </p>
            )}
          </>
        )}
      </Section>

      {/* Kamera, Kendaraan, Geofence, Supir — 4 kolom di layar besar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Kamera */}
        <Section
          icon={<CameraIcon className="w-4 h-4" />}
          title={`Kamera (${cameras.length})`}
        >
          {cameras.length === 0 ? (
            <EmptyState
              icon={<CameraIcon className="w-8 h-8" />}
              message="Belum ada kamera."
            />
          ) : (
            <ul className="space-y-1">
              {cameras.map((cam) => (
                <li
                  key={cam.camera_id}
                  className="flex items-center gap-2 text-[13px] px-2 py-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/30"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-violet-500 flex items-center justify-center text-white shrink-0">
                    <CameraIcon className="w-3 h-3" />
                  </div>
                  <span className="text-gray-900 dark:text-white truncate min-w-0">
                    {cam.name}
                  </span>
                  <span className="font-mono text-[11px] text-gray-400 shrink-0">
                    CH{cam.channel}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Kendaraan */}
        <Section icon={<Truck className="w-4 h-4" />} title={`Kendaraan (${vehicles.length})`}>
          <div className="flex justify-end mb-2">
            <button
              onClick={openVehicleModal}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#2964e7] hover:bg-[#2964e7]/10 rounded-md transition-colors"
            >
              <Plus className="w-3 h-3" />
              Tambah
            </button>
          </div>
          {vehicles.length === 0 ? (
            <EmptyState
              icon={<Truck className="w-8 h-8" />}
              message="Belum ada kendaraan."
            />
          ) : (
            <ul className="space-y-1">
              {vehicles.map((v) => (
                <li
                  key={v.vehicle_id}
                  className="relative flex items-center justify-between gap-2 text-[13px] px-2 py-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/30 group"
                >
                  <button
                    onClick={() => setVehDrawer(v)}
                    className="flex items-center gap-2 min-w-0 flex-1 text-left"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      <Truck className="w-3 h-3" />
                    </div>
                    <span className="text-gray-900 dark:text-white truncate group-hover:text-[#2964e7] transition-colors">
                      {v.name}
                    </span>
                    <span className="font-mono text-[11px] text-gray-400 shrink-0">
                      {v.license_plate || "-"}
                    </span>
                  </button>
                  {/* Action buttons — absolute right, appear on row hover */}
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-[#1a1a1c] rounded shadow-sm border border-gray-100 dark:border-gray-700 px-1 py-0.5">
                    <button
                      onClick={() => openEditVehicleModal(v)}
                      className="p-1 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setVehDeleteId(v.vehicle_id)}
                      className="p-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Geofence */}
        {SHOW_GEOFENCE_SECTION && (
        <Section
          icon={<Shield className="w-4 h-4" />}
          title={`Geofence (${geofences.length})`}
          headerRight={
            <button
              onClick={() => openGeoModal()}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#2964e7] hover:bg-[#2964e7]/10 rounded-md transition-colors"
            >
              <Plus className="w-3 h-3" />
              Tambah
            </button>
          }
        >
          {geofences.length === 0 ? (
            <EmptyState
              icon={<Shield className="w-8 h-8" />}
              message="Belum ada geofence."
            />
          ) : (
            <ul className="space-y-1">
              {geofences.map((g) => (
                <li
                  key={g.geofence_id}
                  className="relative flex items-center justify-between gap-2 text-[13px] px-2 py-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/30 group"
                >
                  <button
                    onClick={() => openGeoModal(g)}
                    className="flex items-center gap-2 min-w-0 flex-1 text-left"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: g.color || "#FF0000" }}
                    />
                    <span className="text-gray-900 dark:text-white truncate group-hover:text-[#2964e7] transition-colors">
                      {g.name}
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono shrink-0">
                      {g.area_type}
                    </span>
                  </button>
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-[#1a1a1c] rounded shadow-sm border border-gray-100 dark:border-gray-700 px-1 py-0.5">
                    <button
                      onClick={() => openGeoModal(g)}
                      className="p-1 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => void handleUnassignGeofence(g.geofence_id)}
                      className="p-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
        )}

        {/* Supir */}
        <Section
          icon={<Users className="w-4 h-4" />}
          title={`Supir (${deviceDrivers.length})`}
          headerRight={
            <button
              onClick={() => void openDrvModal()}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#2964e7] hover:bg-[#2964e7]/10 rounded-md transition-colors"
            >
              <Plus className="w-3 h-3" />
              Tambah
            </button>
          }
        >
          {deviceDrivers.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              message="Belum ada supir."
            />
          ) : (
            <ul className="space-y-1">
              {deviceDrivers.map((d) => (
                <li
                  key={d.driver_id}
                  className="flex items-center gap-2 text-[13px] px-2 py-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/30"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {d.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <span className="text-gray-900 dark:text-white truncate">
                    {d.name}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {/* Log perangkat — GPS Event + Log Posisi dalam satu Section bertab */}
      <Section icon={<History className="w-4 h-4" />} title="Log">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4 border-b border-gray-100 dark:border-gray-800/60">
          <button
            type="button"
            onClick={() => setLogTab("event")}
            className={`inline-flex items-center gap-1.5 px-3 py-2 -mb-px text-[13px] font-medium border-b-2 transition-colors ${
              logTab === "event"
                ? "border-[#2964e7] text-[#2964e7]"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            GPS Event
          </button>
          <button
            type="button"
            onClick={() => setLogTab("position")}
            className={`inline-flex items-center gap-1.5 px-3 py-2 -mb-px text-[13px] font-medium border-b-2 transition-colors ${
              logTab === "position"
                ? "border-[#2964e7] text-[#2964e7]"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            Log Posisi
          </button>
        </div>

        {logTab === "event" ? (
          <>
            {/* Filter tanggal + refresh */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <DateInput
                value={evDateFilter}
                onChange={(iso) => {
                  setEvDateFilter(iso);
                  evDateRef.current = iso;
                  setMapEvent(null);
                  setMapGeofence(null);
                  evPaging.reset();
                }}
              />
              {evDateFilter && (
                <button
                  onClick={() => {
                    setEvDateFilter("");
                    evDateRef.current = "";
                    setMapEvent(null);
                    setMapGeofence(null);
                    evPaging.reset();
                  }}
                  className="px-3 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Reset
                </button>
              )}
              <button
                onClick={() => void evPaging.reload()}
                className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${evPaging.loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {evPaging.error ? (
              <p className="text-[13px] text-red-600 dark:text-red-400 py-3">{evPaging.error}</p>
            ) : !evPaging.loading && evPaging.rows.length === 0 ? (
              <EmptyState
                icon={<AlertTriangle className="w-8 h-8" />}
                message="Belum ada event untuk perangkat ini."
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <div className="min-w-[720px] divide-y divide-gray-100 dark:divide-gray-800/60">
                    <div className="grid grid-cols-12 gap-2 text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium pb-2 px-1">
                      <span className="col-span-2">Waktu</span>
                      <span className="col-span-3">Tipe</span>
                      <span className="col-span-7">Pesan</span>
                    </div>

                    {evPaging.loading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <div key={`ev-sk-${i}`} className="grid grid-cols-12 items-center gap-2 py-3 px-1">
                            <span className="col-span-2">
                              <span className="block h-3.5 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                            </span>
                            <span className="col-span-3">
                              <span className="block h-3.5 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                            </span>
                            <span className="col-span-7">
                              <span className="block h-3.5 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                            </span>
                          </div>
                        ))
                      : evPaging.rows.map((ev) => {
                          const geo = isGeofenceEvent(ev);
                          const selected = mapEvent?.event_id === ev.event_id;
                          return (
                            <div
                              key={ev.event_id}
                              role={geo ? "button" : undefined}
                              tabIndex={geo ? 0 : undefined}
                              onClick={geo ? () => void openEventMap(ev) : undefined}
                              onKeyDown={
                                geo
                                  ? (e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        void openEventMap(ev);
                                      }
                                    }
                                  : undefined
                              }
                              title={geo ? "Lihat area geofence di peta" : undefined}
                              className={`grid grid-cols-12 items-center gap-2 py-2.5 px-1 -mx-1 rounded-lg transition-colors ${
                                geo
                                  ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 focus:outline-none focus:ring-2 focus:ring-[#2964e7]/30 group"
                                  : ""
                              } ${selected ? "bg-[#2964e7]/5 dark:bg-[#2964e7]/10" : ""}`}
                            >
                              <span className="col-span-2 text-[12px] text-gray-500 dark:text-gray-400">
                                {formatDateTimeSec(ev.event_time)}
                              </span>
                              <span className="col-span-3 flex items-center gap-1.5 min-w-0">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${toneClasses(
                                    eventTone(ev.event_type),
                                  )}`}
                                >
                                  {ev.event_type === "geofenceEnter" ? (
                                    <LogIn className="w-3 h-3" />
                                  ) : ev.event_type === "geofenceExit" ? (
                                    <LogOut className="w-3 h-3" />
                                  ) : null}
                                  {eventTypeLabel(ev.event_type)}
                                </span>
                                {geo && (
                                  <MapPinned
                                    className={`w-4 h-4 shrink-0 transition-colors ${
                                      eventPoint(ev).lat !== null
                                        ? selected
                                          ? "text-[#2964e7]"
                                          : "text-gray-400 group-hover:text-[#2964e7] dark:text-gray-500 dark:group-hover:text-[#2964e7]"
                                        : "text-gray-200 dark:text-gray-700"
                                    }`}
                                  />
                                )}
                              </span>
                              <span
                                className="col-span-7 text-[12px] text-gray-500 dark:text-gray-400 truncate"
                                title={ev.message}
                              >
                                {ev.message || "-"}
                              </span>
                            </div>
                          );
                        })}
                  </div>
                </div>

                {/* Pagination */}
                <div className="mt-2 -mx-5 -mb-5">
                  <PaginationBar
                    page={evPaging.page}
                    limit={ADMIN_PAGE_LIMIT}
                    canPrev={evPaging.page > 1}
                    canNext={evPaging.hasNext}
                    loading={evPaging.loading}
                    maxVisitedPage={evPaging.maxVisitedPage}
                    onPrev={evPaging.goPrev}
                    onNext={evPaging.goNext}
                    onPageJump={evPaging.goPage}
                  />
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <DateInput
                value={posDateFilter}
                onChange={(iso) => {
                  setPosDateFilter(iso);
                  posDateRef.current = iso;
                  posPaging.reset();
                }}
              />
              {posDateFilter && (
                <button
                  onClick={() => {
                    setPosDateFilter("");
                    posDateRef.current = "";
                    posPaging.reset();
                  }}
                  className="px-3 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Reset
                </button>
              )}
              <button
                onClick={() => void posPaging.reload()}
                className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${posPaging.loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <AutoRefreshBadge
                enabled={posAutoRefresh.enabled}
                onToggle={posAutoRefresh.setEnabled}
                lastAt={posAutoRefresh.lastAt}
                intervalMs={POS_AUTO_REFRESH_MS}
              />
            </div>

            {posPaging.error ? (
              <p className="text-[13px] text-red-600 dark:text-red-400 py-3">{posPaging.error}</p>
            ) : !posPaging.loading && posPaging.rows.length === 0 ? (
              <EmptyState
                icon={<History className="w-8 h-8" />}
                message="Belum ada log posisi untuk perangkat ini."
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <div className="min-w-[760px] divide-y divide-gray-100 dark:divide-gray-800/60">
                    <div className="grid grid-cols-12 gap-2 text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium pb-2 px-1">
                      <span className="col-span-3">Waktu</span>
                      <span className="col-span-3">Koordinat</span>
                      <span className="col-span-2">Alamat</span>
                      <span className="col-span-1 text-right">Kecepatan</span>
                      <span className="col-span-1 text-right">Akurasi</span>
                      <span className="col-span-1 text-center">Satelit</span>
                      <span className="col-span-1 text-center">Ignition</span>
                    </div>

                    {posPaging.loading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <div key={`pos-sk-${i}`} className="grid grid-cols-12 items-center gap-2 py-3 px-1">
                            <span className="col-span-3">
                              <span className="block h-3.5 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                            </span>
                            <span className="col-span-3">
                              <span className="block h-3.5 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                            </span>
                            <span className="col-span-2">
                              <span className="block h-3.5 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                            </span>
                            <span className="col-span-1">
                              <span className="block h-3.5 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                            </span>
                            <span className="col-span-1">
                              <span className="block h-3.5 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                            </span>
                            <span className="col-span-1">
                              <span className="block h-3.5 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                            </span>
                            <span className="col-span-1">
                              <span className="block h-3.5 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                            </span>
                          </div>
                        ))
                      : posPaging.rows.map((ph) => {
                          const ignitionMoving = ph.ignition === 1;
                          const ignitionParked = ph.ignition === 2;
                          const ignitionOff = ph.ignition === 0;
                          return (
                            <div
                              key={ph.id}
                              className="grid grid-cols-12 items-center gap-2 py-2.5 px-1 -mx-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                            >
                              <span className="col-span-3 text-[12px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                {formatDateTimeSec(ph.created_at || ph.device_time)}
                              </span>
                              <span className="col-span-3 text-[12px] font-mono text-gray-900 dark:text-white truncate">
                                {ph.latitude.toFixed(6)}, {ph.longitude.toFixed(6)}
                              </span>
                              <span className="col-span-2 text-[12px] text-gray-500 dark:text-gray-400 truncate" title={ph.address || ""}>
                                {ph.address || "-"}
                              </span>
                              <span className="col-span-1 text-[12px] text-right text-gray-700 dark:text-gray-300">
                                {ph.speed.toFixed(1)}
                              </span>
                              <span className="col-span-1 text-[12px] text-right text-gray-500 dark:text-gray-400">
                                {ph.accuracy.toFixed(0)}
                              </span>
                              <span className="col-span-1 text-[12px] text-center text-gray-500 dark:text-gray-400">
                                {ph.satellites}
                              </span>
                              <span className="col-span-1 flex justify-center">
                                <span
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                                    ignitionMoving
                                      ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                                      : ignitionParked
                                        ? "bg-orange-50 text-orange-600 dark:bg-orange-400/10 dark:text-orange-300"
                                        : ignitionOff
                                          ? "bg-gray-100 text-gray-500 dark:bg-gray-700/40 dark:text-gray-400"
                                          : "bg-gray-50 text-gray-400 dark:bg-gray-800/40"
                                  }`}
                                >
                                  {ignitionMoving ? "JALAN" : ignitionParked ? "PARKIR" : ignitionOff ? "OFF" : "-"}
                                </span>
                              </span>
                            </div>
                          );
                        })}
                  </div>
                </div>

                {/* Pagination */}
                <div className="mt-2 -mx-5 -mb-5">
                  <PaginationBar
                    page={posPaging.page}
                    limit={ADMIN_PAGE_LIMIT}
                    canPrev={posPaging.page > 1}
                    canNext={posPaging.hasNext}
                    loading={posPaging.loading}
                    maxVisitedPage={posPaging.maxVisitedPage}
                    onPrev={posPaging.goPrev}
                    onNext={posPaging.goNext}
                    onPageJump={posPaging.goPage}
                  />
                </div>
              </>
            )}
          </>
        )}
      </Section>

      {cmdDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Riwayat perintah"
        >
          {/* Backdrop — klik menutup drawer */}
          <button
            type="button"
            aria-label="Tutup drawer"
            onClick={() => setCmdDrawerOpen(false)}
            className="flex-1 bg-black/40 backdrop-blur-[1px] animate-[fadeIn_150ms_ease-out]"
          />
          {/* Panel — 420px wide di desktop, full-width di mobile. Slide dari kanan. */}
          <aside className="w-full sm:w-[420px] sm:max-w-[90vw] bg-white dark:bg-[#1a1a1c] shadow-2xl flex flex-col h-full animate-[slideInRight_220ms_ease-out]">
            {/* Header drawer */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800/60">
              <div className="flex items-center gap-2 min-w-0">
                <Terminal className="w-4 h-4 text-gray-400 shrink-0" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  Riwayat Perintah
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setCmdDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
                title="Tutup (ESC)"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Body drawer — list chat scrollable. ref di sini (scroll container)
                agar scrollTop bisa di-set ke scrollHeight saat pesan baru masuk.
                Inner div hanya wrapper layout (space-y), tidak punya scroll sendiri. */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto pl-4 pr-2 py-3">
              {commands.length === 0 && !pendingCmd ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <Terminal className="w-8 h-8 text-gray-300 dark:text-gray-700" />
                  <p className="text-[13px] text-gray-400 dark:text-gray-500">
                    Belum ada perintah yang dikirim ke perangkat ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 py-1">
                  {[...commands].reverse().map((cmd) => {
              const text = extractCommandText(cmd);
              const tone = commandStatusTone(cmd.status);
              const isDelivered = cmd.status === "delivered";
              const isFailed = cmd.status === "failed";
              return (
                <div
                                  key={cmd.command_id}
                                  className="space-y-1.5 animate-[fadeInUp_220ms_ease-out]"
                                >
                  {/* Baris admin (kanan). Container luar full-width lalu konten ditarik
                      ke kanan dengan `ml-auto`. Tanpa `max-w` di container luar
                      sehingga anchor kanan baris = tepi dalam drawer (kebetulan
                      sama dengan posisi badge 'Dibalas' di baris balasan di
                      bawahnya yang juga full-width + `justify-between`). */}
                  <div className="flex justify-end">
                    <div className="max-w-[78%] ml-auto space-y-1 text-right">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        {formatDateTimeSec(cmd.sent_at || cmd.created_at)}
                      </p>
                      <div className="flex items-center justify-end gap-1.5">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${toneClasses(tone)}`}
                          title={`Status: ${cmd.status}`}
                        >
                          {commandStatusLabel(cmd.status)}
                        </span>
                      </div>
                      <div className="inline-block px-3 py-2 rounded-2xl rounded-tr-sm bg-[#2964e7] text-white text-[13px] font-mono whitespace-pre-wrap break-words">
                        {text}
                      </div>
                    </div>
                  </div>
                  {/* Bubble balasan device (kiri) — hanya jika ada response_json. Badge
                      status 'Dibalas' ditempel di kanan container agar sejajar
                      dengan bubble admin di atasnya. */}
                  {cmd.response_json ? (
                    <div className="flex items-start justify-between gap-2">
                      <div className="max-w-[78%] space-y-1">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                          {formatDateTimeSec(cmd.delivered_at)}
                        </p>
                        <div className="inline-block px-3 py-2 rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-[13px] font-mono whitespace-pre-wrap break-words">
                          {extractReplyText(cmd)}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 mt-5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${toneClasses(tone)}`}
                        title={`Status: ${cmd.status}`}
                      >
                        {commandStatusLabel(cmd.status)}
                      </span>
                    </div>
                  ) : isFailed ? (
                    <div className="flex justify-start">
                      <div className="px-3 py-2 rounded-2xl rounded-tl-sm bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-[12px] italic">
                        Gagal mengirim: perangkat tidak terhubung.
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-start">
                      <div className="px-3 py-2 rounded-2xl rounded-tl-sm bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 text-[12px] italic">
                        {cmd.status === "queued"
                          ? "Antri: perintah akan dikirim saat perangkat online."
                          : "Menunggu balasan perangkat…"}
                      </div>
                    </div>
                  )}
                  {/* Garis pemisah halus antar percakapan */}
                  <div className="h-px bg-gray-100 dark:bg-gray-800/60 mt-2" />
                </div>
              );
            })}

            {/* Bubble optimistik — tampil instan saat user tekan Enter, sebelum
                API pertama selesai. Status 'sending' (abu-abu) sampai replaced. */}
            {pendingCmd && (
              <div
                key={pendingCmd.command_id}
                className="space-y-1.5 animate-[fadeInUp_220ms_ease-out]"
              >
                <div className="flex justify-end">
                <div className="max-w-[78%] ml-auto space-y-1 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        Mengirim…
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {formatDateTimeSec(pendingCmd.sent_at)}
                      </span>
                    </div>
                    <div className="inline-block px-3 py-2 rounded-2xl rounded-tr-sm bg-[#2964e7]/70 text-white text-[13px] font-mono whitespace-pre-wrap break-words">
                      {pendingCmd.text}
                    </div>
                  </div>
                </div>
                <div className="h-px bg-gray-100 dark:bg-gray-800/60 mt-2" />
              </div>
            )}
                </div>
              )}
            </div>

            {/* Footer drawer — shortcut chip + form input, sticky di bawah */}
            <div className="border-t border-gray-100 dark:border-gray-800/60 px-4 py-3 bg-white dark:bg-[#1a1a1c]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendCustomCommand();
                }}
              >
                {/* Shortcut command — chip sekali klik untuk kirim command umum */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COMMAND_SHORTCUTS.map((s) => (
                    <button
                      key={s.command}
                      type="button"
                      disabled={cmdSending}
                      onClick={() => void dispatchCommand(s.command)}
                      title={s.hint || s.command}
                      className="inline-flex items-center px-2.5 py-1 text-[11px] font-mono rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-[#2964e7]/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={cmdInput}
                      onChange={(e) => setCmdInput(e.target.value)}
                      placeholder="Ketik perintah GT06, mis. STATUS# lalu Enter…"
                      disabled={cmdSending}
                      className="w-full px-4 py-2.5 text-[13px] font-mono rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2964e7]/40 focus:border-[#2964e7] disabled:opacity-50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={cmdSending || !cmdInput.trim()}
                    className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#2964e7] text-white hover:bg-[#1f4fc4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Kirim perintah"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                {cmdError && (
                  <p className="mt-2 text-[12px] text-red-600 dark:text-red-400">{cmdError}</p>
                )}
                {cmdSuccess && (
                  <p className="mt-2 text-[12px] text-green-600 dark:text-green-400">{cmdSuccess}</p>
                )}
              </form>
            </div>
          </aside>
        </div>
      )}

      {/* Modal Tambah/Edit Kendaraan */}
      {vehModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setVehModalOpen(false)} />
          <div className="relative bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700/50">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{vehEditingId ? "Edit Kendaraan" : "Tambah Kendaraan"}</h3>
              <button onClick={() => setVehModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveVehicle} className="px-6 py-4 space-y-4">
              {vehError && (
                <div className="px-3 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-[13px] text-red-600 dark:text-red-400">
                  {vehError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Kendaraan <span className="text-red-500">*</span></label>
                  <input type="text" value={vehForm.name} onChange={(e) => setVehForm({ ...vehForm, name: e.target.value })} placeholder="Truck Fuso 01" className="w-full px-3 py-2 text-[13px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1">Plat Nomor <span className="text-red-500">*</span></label>
                  <input type="text" value={vehForm.license_plate} onChange={(e) => setVehForm({ ...vehForm, license_plate: e.target.value })} placeholder="B 1234 XYZ" className="w-full px-3 py-2 text-[13px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1">Tipe Kendaraan</label>
                  <select value={vehForm.vehicle_type} onChange={(e) => setVehForm({ ...vehForm, vehicle_type: e.target.value })} className="w-full px-3 py-2 text-[13px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                    <option value="Mobil">Mobil</option>
                    <option value="Truck">Truck</option>
                    <option value="Motor">Motor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1">Brand</label>
                  <input type="text" value={vehForm.brand} onChange={(e) => setVehForm({ ...vehForm, brand: e.target.value })} placeholder="Mitsubishi" className="w-full px-3 py-2 text-[13px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1">Model</label>
                  <input type="text" value={vehForm.model} onChange={(e) => setVehForm({ ...vehForm, model: e.target.value })} placeholder="Fuso FE 74" className="w-full px-3 py-2 text-[13px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1">Tahun</label>
                  <input type="text" value={vehForm.year} onChange={(e) => setVehForm({ ...vehForm, year: e.target.value })} placeholder="2023" className="w-full px-3 py-2 text-[13px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1">Warna</label>
                  <input type="text" value={vehForm.color} onChange={(e) => setVehForm({ ...vehForm, color: e.target.value })} placeholder="Putih" className="w-full px-3 py-2 text-[13px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1">VIN Number</label>
                  <input type="text" value={vehForm.vin_number} onChange={(e) => setVehForm({ ...vehForm, vin_number: e.target.value })} placeholder="JH4DA9340PS000001" className="w-full px-3 py-2 text-[13px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1">Odometer (km)</label>
                  <input type="text" value={vehForm.odometer_km} onChange={(e) => setVehForm({ ...vehForm, odometer_km: e.target.value })} placeholder="50000" className="w-full px-3 py-2 text-[13px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
              </div>
              {/* Multi-select Driver */}
              <div>
                <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1">Driver</label>
                {drivers.length === 0 ? (
                  <p className="text-[12px] text-gray-400 dark:text-gray-500 py-2">Tidak ada driver untuk bisnis ini.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                    {drivers.map((drv) => (
                      <label key={drv.driver_id} className="flex items-center gap-2 text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded px-1 py-0.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={vehForm.driver_ids.includes(drv.driver_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setVehForm({ ...vehForm, driver_ids: [...vehForm.driver_ids, drv.driver_id] });
                            } else {
                              setVehForm({ ...vehForm, driver_ids: vehForm.driver_ids.filter((id) => id !== drv.driver_id) });
                            }
                          }}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="truncate">{drv.name}</span>
                        {drv.license_no && <span className="text-[11px] text-gray-400 shrink-0">({drv.license_no})</span>}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {/* Readonly info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1">Bisnis</label>
                  <input type="text" value={gps.bisnis?.name || gps.bisnis_id} disabled className="w-full px-3 py-2 text-[13px] bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1">Device ID</label>
                  <input type="text" value={gps.device_id} disabled className="w-full px-3 py-2 text-[13px] bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 font-mono" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setVehModalOpen(false)} className="px-4 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={vehSaving || !vehForm.name.trim() || !vehForm.license_plate.trim()} className="px-4 py-2 text-[13px] font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {vehSaving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- Modal Hapus Kendaraan ---- */}
      {vehDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setVehDeleteId(null)} />
          <div className="relative bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-full max-w-sm mx-4">
            <div className="px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Hapus Kendaraan</h3>
              <p className="text-[13px] text-gray-600 dark:text-gray-300">Yakin hapus kendaraan ini? Tindakan ini tidak bisa dibatalkan.</p>
            </div>
            <div className="flex justify-end gap-2 px-6 py-3 border-t border-gray-100 dark:border-gray-700/50">
              <button onClick={() => setVehDeleteId(null)} className="px-4 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                Batal
              </button>
              <button onClick={handleDeleteVehicle} disabled={vehDeleting} className="px-4 py-2 text-[13px] font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                {vehDeleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Drawer Detail Kendaraan ---- */}
      {vehDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px]" onClick={() => setVehDrawer(null)} />
          <aside className="relative w-full sm:w-[420px] sm:max-w-[90vw] bg-white dark:bg-[#1a1a1c] shadow-2xl flex flex-col h-full animate-[slideInRight_220ms_ease-out]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800/60">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-bold text-gray-900 dark:text-white truncate">{vehDrawer.name}</h2>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono truncate">{vehDrawer.vehicle_id}</p>
                  </div>
                </div>
                <button onClick={() => setVehDrawer(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0" title="Tutup (ESC)">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusBadge status={vehDrawer.status} />
                {vehDrawer.vehicle_type && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                    {vehDrawer.vehicle_type}
                  </span>
                )}
                {vehDrawer.license_plate && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 font-mono">
                    {vehDrawer.license_plate}
                  </span>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {/* Identitas */}
              <div className="px-5 py-4">
                <h4 className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Identitas</h4>
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-700/50 divide-y divide-gray-100 dark:divide-gray-700/30">
                  <DevInfoCell label="Plat Nomor" value={vehDrawer.license_plate} mono />
                  <DevInfoCell label="VIN Number" value={vehDrawer.vin_number} mono />
                  <DevInfoCell label="Tahun" value={vehDrawer.year ? String(vehDrawer.year) : null} />
                  <DevInfoCell label="Warna" value={vehDrawer.color} />
                </div>
              </div>

              {/* Spesifikasi */}
              <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800/60">
                <h4 className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Spesifikasi</h4>
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-700/50 divide-y divide-gray-100 dark:divide-gray-700/30">
                  <DevInfoCell label="Brand" value={vehDrawer.brand} />
                  <DevInfoCell label="Model" value={vehDrawer.model} />
                  <DevInfoCell label="Odometer" value={vehDrawer.odometer_km ? `${vehDrawer.odometer_km.toLocaleString()} km` : null} />
                </div>
              </div>

              {/* Relasi */}
              <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800/60">
                <h4 className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Relasi</h4>
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-700/50 divide-y divide-gray-100 dark:divide-gray-700/30">
                  <DevInfoCell label="GPS Device" value={vehDrawer.device_id} mono />
                  <DevInfoCell label="Bisnis" value={vehDrawer.bisnis_id} mono />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 dark:border-gray-800/60 px-5 py-3 flex items-center justify-between">
              <button onClick={() => { setVehDeleteId(vehDrawer.vehicle_id); setVehDrawer(null); }} className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
              <button onClick={() => { openEditVehicleModal(vehDrawer); setVehDrawer(null); }} className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-white bg-[#2964e7] hover:bg-[#2150c5] rounded-lg transition-colors">
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ---- Modal Tambah Geofence (Map) — hanya saat section geofence tampil ---- */}
      {SHOW_GEOFENCE_SECTION && (
        <GeofenceMapModal
          open={geoModalOpen}
          onClose={() => { setGeoModalOpen(false); setGeoEdit(null); }}
          editGeofence={geoEdit}
          bisnisId={gps?.bisnis_id || ""}
          bisnisName={gps?.bisnis?.name || ""}
          lockBisnis
          centerLat={position?.latitude}
          centerLng={position?.longitude}
          onSaved={() => void load()}
        />
      )}

      {/* ---- Modal peta event geofence (sama seperti halaman detail geofence) ---- */}
      <GeofenceEventMapModal
        open={!!mapEvent}
        onClose={() => {
          setMapEvent(null);
          setMapGeofence(null);
          setMapAreaSnapshot(false);
        }}
        geofence={mapGeofence}
        areaNote={
          mapGeofence
            ? mapAreaSnapshot
              ? "Area saat event"
              : "Area terkini (log lama)"
            : undefined
        }
        event={
          mapEvent
            ? {
                event_type: mapEvent.event_type,
                event_time: mapEvent.event_time,
                device_id: mapEvent.device_id,
                message: mapEvent.message,
                ...eventPoint(mapEvent),
              }
            : null
        }
      />

      {/* ---- Modal Tambah Supir ---- */}
      {drvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDrvModalOpen(false)} />
          <div className="relative bg-white dark:bg-[#1a1a1c] rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800/60">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Tambah Supir</h2>
              </div>
              <button onClick={() => setDrvModalOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Pilih Kendaraan */}
              {vehicles.length > 1 && (
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1">Pilih Kendaraan</label>
                  <select
                    value={drvVehicleId}
                    onChange={(e) => setDrvVehicleId(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2964e7]/30"
                  >
                    {vehicles.map((v) => (
                      <option key={v.vehicle_id} value={v.vehicle_id}>
                        {v.name} {v.license_plate ? `(${v.license_plate})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* List supir */}
              {loadingDrvList ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800/60 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : availableDrivers.length === 0 ? (
                <div className="py-10 text-center">
                  <Users className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                  <p className="text-[13px] text-gray-400">
                    Semua supir sudah terassign ke device ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {availableDrivers.map((d) => {
                    const selected = drvSelectedIds.includes(d.driver_id);
                    return (
                      <button
                        key={d.driver_id}
                        onClick={() => {
                          setDrvSelectedIds((prev) =>
                            selected ? prev.filter((id) => id !== d.driver_id) : [...prev, d.driver_id],
                          );
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                          selected
                            ? "bg-[#2964e7]/10 border border-[#2964e7]/30"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/40 border border-transparent"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                          {d.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{d.name}</p>
                          <p className="text-[11px] text-gray-400">{d.phone || d.license_no || d.driver_id}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          selected ? "border-[#2964e7] bg-[#2964e7]" : "border-gray-300 dark:border-gray-600"
                        }`}>
                          {selected && (
                            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 dark:border-gray-800/60 px-5 py-3 flex items-center justify-between">
              <span className="text-[12px] text-gray-400">
                {drvSelectedIds.length > 0 ? `${drvSelectedIds.length} supir dipilih` : "Pilih supir yang ingin di-assign"}
              </span>
              <button
                onClick={() => void handleAssignDriver()}
                disabled={assigningDrv !== null || drvSelectedIds.length === 0 || !drvVehicleId}
                className="px-4 py-2 text-[13px] font-medium text-white bg-[#2964e7] rounded-lg hover:bg-[#2150c5] disabled:opacity-50 transition-colors"
              >
                {assigningDrv ? "Menyimpan..." : "Assign Supir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Modal perbesar peta lokasi terkini ---- */}
      {posMapOpen && hasFix && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setPosMapOpen(false)} />
          <div className="relative bg-white dark:bg-[#1a1a1c] rounded-2xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800/60 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Navigation className="w-4 h-4 text-gray-400 shrink-0" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">Lokasi GPS Terkini</h2>
              </div>
              <button
                onClick={() => setPosMapOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="relative flex-1 min-h-[420px]">
              <GeofenceAreaMap
                className="absolute inset-0"
                geofence={null}
                point={{
                  lat: position!.latitude,
                  lng: position!.longitude,
                  label: "Lokasi terkini",
                  color: "#2964e7",
                }}
              />
            </div>
            <div className="shrink-0 border-t border-gray-100 dark:border-gray-800/60 px-5 py-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-0.5">Koordinat</p>
                  <p className="text-[12px] font-mono text-gray-900 dark:text-white truncate">
                    {position!.latitude.toFixed(6)}, {position!.longitude.toFixed(6)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-0.5">Alamat</p>
                  <p className="text-[12px] text-gray-900 dark:text-white truncate" title={position!.address || ""}>
                    {position!.address || "-"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-0.5">Waktu Perangkat</p>
                  <p className="text-[12px] text-gray-900 dark:text-white truncate">
                    {formatDateTimeSec(position!.device_time)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- Toast ---- */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] animate-[slideUp_300ms_ease-out]">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}>
            {toast.type === "success" ? "✓" : "✕"} {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Helper untuk section detail device ----
function DevInfoCell({
  label,
  value,
  mono,
  fallback,
  link,
  custom,
}: {
  label: string;
  value?: string | number | null;
  mono?: boolean;
  fallback?: string;
  link?: string;
  custom?: React.ReactNode;
}) {
  let display: React.ReactNode;
  if (custom) {
    display = custom;
  } else if (value != null && value !== "") {
    display = String(value);
  } else {
    display = <span className="text-gray-300 dark:text-gray-600">{fallback || "—"}</span>;
  }

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <span className="text-[12px] text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
      {link ? (
        <Link href={link} className={`text-[13px] text-[#2964e7] hover:underline text-right min-w-0 truncate ${mono ? "font-mono text-[12px]" : ""}`}>
          {display}
        </Link>
      ) : (
        <span className={`text-[13px] text-gray-900 dark:text-white text-right min-w-0 truncate ${mono ? "font-mono text-[12px]" : ""}`}>
          {display}
        </span>
      )}
    </div>
  );
}
