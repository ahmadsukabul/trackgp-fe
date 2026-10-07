import type { DevicePosition } from "../../v1/lib/client";

/** Kondisi armada yang dipakai di Home & peta Perangkat. */
export type Fleet = "online" | "parkir" | "offline";

export const FLEET_COLOR: Record<Fleet, string> = {
  online: "#76b900",
  parkir: "#f59e0b",
  offline: "#9ca3af",
};

export const FLEET_LABEL: Record<Fleet, string> = {
  online: "Online",
  parkir: "Parkir",
  offline: "Offline",
};

/** Tentukan kondisi perangkat dari status + ignition. */
export function classifyDevice(p: DevicePosition): Fleet {
  const s = (p.status || "").toLowerCase();
  if (s === "offline") return "offline";
  if (p.ignition === 2 || s === "pending") return "parkir";
  return "online";
}

/** Buang titik yang tidak valid (0,0 / di luar rentang koordinat). */
export function hasValidCoord(p: { latitude: number; longitude: number }): boolean {
  return (
    (p.latitude !== 0 || p.longitude !== 0) &&
    Math.abs(p.latitude) <= 90 &&
    Math.abs(p.longitude) <= 180
  );
}
