// Menu key harus sama dengan entities/role_permission.go di BE.
export const MENU = {
  dashboard: "dashboard",
  bisnis: "bisnis",
  team: "team",
  gps: "gps",
  camera: "camera",
  vehicle: "vehicle",
  driver: "driver",
  geofence: "geofence",
  maintenance: "maintenance",
  report: "report",
  command: "command",
  log: "log",
  invoice: "invoice",
} as const;

export type MenuKey = (typeof MENU)[keyof typeof MENU];

/** Label menu_key untuk UI CRUD role (checkbox list). */
export const MENU_LABELS: Record<string, string> = {
  [MENU.dashboard]: "Dashboard",
  [MENU.bisnis]: "Profil Bisnis",
  [MENU.team]: "Tim & Role",
  [MENU.gps]: "GPS / Perangkat",
  [MENU.camera]: "Kamera",
  [MENU.vehicle]: "Kendaraan",
  [MENU.driver]: "Supir",
  [MENU.geofence]: "Geofence",
  [MENU.maintenance]: "Maintenance",
  [MENU.report]: "Laporan",
  [MENU.command]: "Perintah",
  [MENU.log]: "Log Aktivitas",
  [MENU.invoice]: "Langganan & Invoice",
};

export const ALL_MENU_KEYS = Object.keys(MENU_LABELS);
