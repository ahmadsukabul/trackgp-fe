"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export type MapMarker = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  /** online | offline | pending — menentukan warna border/icon. */
  status: string;
  ignition?: number;
  speed?: number;
  plate?: string;
  lastSeen?: string;
};

const COLOR: Record<string, string> = {
  online: "#10b981",
  offline: "#9ca3af",
  pending: "#f59e0b",
};

/**
 * Style OSM raster — sama seperti traccar-web. Gratis, ada jalan, cover seluruh dunia.
 * https://tile.openstreetmap.org/{z}/{x}/{y}.png
 */
function osmStyle(): maplibregl.StyleSpecification {
  return {
    version: 8 as const,
    sources: {
      osm: {
        type: "raster" as const,
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    },
    layers: [
      {
        id: "osm",
        type: "raster",
        source: "osm",
      },
    ],
  };
}

/**
 * MapCanvas — pembungkus MapLibre GL yang aman untuk Next App Router:
 * peta baru dibuat sekali per mount, marker disinkronkan tiap `markers` berubah,
 * dan peta ikut resize saat sidebar collapse (ResizeObserver).
 */
export default function MapCanvas({
  markers,
  height = 420,
  onSelect,
  fallbackCenter = [106.85, -6.2],
  fallbackZoom = 10,
}: {
  markers: MapMarker[];
  height?: number;
  onSelect?: (id: string) => void;
  fallbackCenter?: [number, number];
  fallbackZoom?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Init peta sekali — pakai OSM raster style.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: osmStyle() as unknown as string,
      center: fallbackCenter,
      zoom: fallbackZoom,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("error", () => {
      /* style offline / tile gagal tidak boleh melempar uncaught error */
    });
    mapRef.current = map;

    const el = containerRef.current;
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(el);

    return () => {
      ro.disconnect();
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sinkronkan marker + auto-fit ketika data berubah.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const paint = () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const pts = markers.filter(
        (m) => Number.isFinite(m.latitude) && Number.isFinite(m.longitude),
      );

      for (const pt of pts) {
        const isOff = pt.ignition === 0;
        const isParked = pt.ignition === 2;
        const statusColor = COLOR[pt.status] ?? COLOR.offline;
        // ignition off: body abu-abu, border hijau (menandakan mesin mati)
        // ignition parkir: body oren pudar, border oren (mesin hidup tapi diam)
        // ignition jalan: body warna status, border putih
        const bodyColor = isOff ? "#9ca3af" : isParked ? "#fdba74" : statusColor;
        const borderColor = isOff ? "#10b981" : isParked ? "#f97316" : "#ffffff";

        const dot = document.createElement("div");
        dot.style.cssText = "cursor:pointer";
        dot.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 1px 3px rgba(0,0,0,.4))">
          <path d="M5 11h14l-1.5-5H6.5L5 11Z" fill="${bodyColor}" stroke="${borderColor}" stroke-width="0.5"/>
          <rect x="3" y="11" width="18" height="6" rx="2" fill="${bodyColor}" stroke="${borderColor}" stroke-width="0.5"/>
          <circle cx="7.5" cy="18" r="1.5" fill="${borderColor}"/>
          <circle cx="16.5" cy="18" r="1.5" fill="${borderColor}"/>
          <rect x="6" y="12.5" width="3" height="2" rx="0.5" fill="#fff" opacity="0.9"/>
          <rect x="10.5" y="12.5" width="3" height="2" rx="0.5" fill="#fff" opacity="0.9"/>
          ${isOff ? `<circle cx="20" cy="9" r="2" fill="#ef4444" opacity="0.9"/>` : ""}
        </svg>`;

        const popup = new maplibregl.Popup({ offset: 20, closeButton: false }).setHTML(
          `<div style="font:12px/1.5 system-ui;padding:2px 4px">
             <strong>${escapeHtml(pt.name)}</strong><br/>
             ${pt.plate ? `${escapeHtml(pt.plate)} · ` : ""}${escapeHtml(pt.status)}
             ${typeof pt.speed === "number" ? ` · ${Math.round(pt.speed)} km/j` : ""}
             ${pt.lastSeen ? `<br/><span style="opacity:.7">${escapeHtml(pt.lastSeen)}</span>` : ""}
           </div>`,
        );

        const marker = new maplibregl.Marker({ element: dot })
          .setLngLat([pt.longitude, pt.latitude])
          .setPopup(popup)
          .addTo(map);

        if (onSelectRef.current) {
          dot.addEventListener("click", () => onSelectRef.current?.(pt.id));
        }
        markersRef.current.push(marker);
      }

      if (pts.length > 1) {
        const bounds = new maplibregl.LngLatBounds();
        pts.forEach((p) => bounds.extend([p.longitude, p.latitude]));
        map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 600 });
      } else if (pts.length === 1) {
        map.setCenter([pts[0].longitude, pts[0].latitude]).setZoom(14);
      }
    };

    if (map.isStyleLoaded()) paint();
    else map.once("load", paint);
  }, [markers]);

  return (
    <div className="relative overflow-hidden rounded-xl" style={{ border: "1px solid var(--v1-border)" }}>
      <div ref={containerRef} style={{ height, width: "100%" }} />
      <div
        className="absolute left-3 bottom-3 z-10 flex items-center gap-3 px-3 py-1.5 rounded-lg backdrop-blur"
        style={{
          background: "oklch(18% 0.02 260 / 0.85)",
          border: "1px solid var(--v1-border)",
        }}
      >
        {(
          [
            ["online", "Online"],
            ["offline", "Offline"],
            ["pending", "Pending"],
          ] as const
        ).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--v1-ink-muted)" }}>
            <span className="w-2 h-2 rounded-full" style={{ background: COLOR[key] }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}
