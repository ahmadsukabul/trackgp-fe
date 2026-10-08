/**
 * Helper parsing event geofence (dipakai halaman Geofence & detail GPS).
 *
 * Engine geofence menulis detail ke `attributes_json` setiap kali event fire:
 *   { fence_name, fence_color, fence_polygon, lat, lng, ... }
 * Semua fungsi di sini defensif terhadap JSON rusak / field hilang supaya UI
 * tidak pernah error hanya karena satu baris log lama.
 */

import type { Geofence, GPSEvent } from "./client";

/** Hitung jumlah titik dari polygon_coords JSON (aman terhadap data rusak). */
export function countPoints(polygonCoords: string): number {
  if (!polygonCoords) return 0;
  try {
    const arr = JSON.parse(polygonCoords);
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}

/** Ambil nama geofence dari attributes_json event (fallback "-"). */
export function fenceName(attributesJson: string): string {
  if (!attributesJson) return "-";
  try {
    const attrs = JSON.parse(attributesJson);
    return attrs?.fence_name || "-";
  } catch {
    return "-";
  }
}

/** Ambil nama device dari attributes_json bila ada (fallback device_id). */
export function deviceLabel(ev: GPSEvent): string {
  if (ev.attributes_json) {
    try {
      const attrs = JSON.parse(ev.attributes_json);
      const name = attrs?.device_name || attrs?.name;
      if (typeof name === "string" && name) return name;
    } catch {
      /* ignore */
    }
  }
  return ev.device_id;
}

/**
 * Titik GPS saat event. Engine geofence menulis {lat,lng} ke attributes_json
 * setiap kali fire, jadi koordinatnya selalu ada untuk event baru. Kembalikan
 * null bila data hilang/rusak supaya modal tetap bisa dibuka.
 */
export function eventPoint(ev: GPSEvent): { lat: number | null; lng: number | null } {
  if (ev.attributes_json) {
    try {
      const attrs = JSON.parse(ev.attributes_json);
      const lat = Number(attrs?.lat);
      const lng = Number(attrs?.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
        return { lat, lng };
      }
    } catch {
      /* ignore */
    }
  }
  return { lat: null, lng: null };
}

/**
 * Area geofence yang dirender di peta log. Prioritas:
 *  1. Snapshot di attributes_json (kondisi area SAAT event terjadi) — akurat
 *     walau geofence kemudian diedit/dihapus.
 *  2. Record geofence terkini — fallback untuk event lama yang belum punya
 *     snapshot.
 * `snapshot` =true berarti area berasal dari snapshot.
 */
export function eventArea(
  ev: GPSEvent,
  list: Geofence[],
): { geofence: { name: string; color: string; polygon_coords: string }; snapshot: boolean } | null {
  if (ev.attributes_json) {
    try {
      const attrs = JSON.parse(ev.attributes_json);
      const poly = typeof attrs?.fence_polygon === "string" ? attrs.fence_polygon : "";
      if (poly) {
        return {
          geofence: {
            name: typeof attrs?.fence_name === "string" && attrs.fence_name ? attrs.fence_name : "Geofence",
            color: typeof attrs?.fence_color === "string" && attrs.fence_color ? attrs.fence_color : "#FF0000",
            polygon_coords: poly,
          },
          snapshot:true,
        };
      }
    } catch {
      /* ignore */
    }
  }

  const current = list.find((g) => g.geofence_id === ev.geofence_id);
  if (!current) return null;
  return {
    geofence: { name: current.name, color: current.color, polygon_coords: current.polygon_coords },
    snapshot:false,
  };
}
