"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import "./preview4.css";

/* === Data ================================================================ */

const HERO_STATS = [
  { label: "Kendaraan", value: "120rb+" },
  { label: "Uptime", value: "99.9%" },
  { label: "Kota", value: "60+" },
  { label: "Rating", value: "4.9" },
];

const TESTIMONIALS = [
  {
    quote:
      "Sebelum pakai TrackGPS, kami rekap perjalanan manual di spreadsheet dan sering telat tahu ada kendaraan keluar jalur. Sekarang semua rute dan status mesin terlihat langsung di satu dashboard. Keputusan operasional jadi jauh lebih cepat.",
    name: "Budi Santoso",
    role: "Manajer Operasional",
    company: "PT Logistik Nusantara",
    photo: "",
  },
  {
    quote:
      "Fitur matikan mesin dan geofence sangat membantu. Kami pernah kehilangan unit di luar jam kerja, sekarang bisa langsung tahu dan bertindak.",
    name: "Siti Rahmawati",
    role: "Owner",
    company: "CV Trans Sejahtera",
    photo: "",
  },
  {
    quote:
      "Pemasangan cepat, timnya responsif, dan laporannya rapi. Hemat waktu administrasi kami setiap bulan.",
    name: "Andi Pratama",
    role: "Kepala Armada",
    company: "PT Karya Mandiri",
    photo: "",
  },
];

type Category = "Pelacakan" | "Keamanan" | "Operasional" | "Layanan";

const FEATURES: { icon: string; title: string; desc: string; cat: Category }[] = [
  { icon: "📍", title: "Pelacakan Real-Time", desc: "Pantau posisi kendaraan di peta — kecepatan, arah, status mesin secara langsung.", cat: "Pelacakan" },
  { icon: "🕒", title: "Riwayat Perjalanan", desc: "Rekam rute dan titik berhenti kendaraan untuk audit operasional jangka panjang.", cat: "Pelacakan" },
  { icon: "🛰️", title: "Posisi Terakhir", desc: "Ketahui titik terakhir perangkat walau sedang offline atau kehilangan sinyal.", cat: "Pelacakan" },
  { icon: "🛡️", title: "Geofence & Peringatan", desc: "Tetapkan area aman, dapatkan notifikasi saat kendaraan keluar jalur.", cat: "Keamanan" },
  { icon: "🔐", title: "Akses terlindungi", desc: "Login aman dengan hak akses berjenjang — setiap staf hanya melihat yang perlu dilihat.", cat: "Keamanan" },
  { icon: "🔔", title: "Peringatan Perangkat", desc: "Notifikasi saat perangkat offline, baterai lemah, atau langganan berakhir.", cat: "Keamanan" },
  { icon: "📊", title: "Laporan Otomatis", desc: "Data perjalanan, konsumsi BBM, dan performa driver siap diekspor.", cat: "Operasional" },
  { icon: "👥", title: "Multi-peran & Multi-bisnis", desc: "Satu akun bisa jadi Owner di satu bisnis dan Staff di bisnis lain.", cat: "Operasional" },
  { icon: "🔧", title: "Pemasangan oleh Tim", desc: "Tim teknisi TrackGPS memasang dan mengonfigurasi perangkat di lokasi Anda — langsung siap pakai.", cat: "Layanan" },
];

const CATEGORIES: ("Semua" | Category)[] = [
  "Semua",
  "Pelacakan",
  "Keamanan",
  "Operasional",
  "Layanan",
];

const KEMUDAHAN = [
  {
    title: "Monitoring kendaraan",
    desc: "Semua kendaraan tampil di satu peta — posisi, kecepatan, arah, dan status mesin, diperbarui langsung.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
        <path d="M9 4v14M15 6v14" />
      </svg>
    ),
  },
  {
    title: "Kemudahan integrasi",
    desc: "Perangkat dipasang tim kami dan langsung terhubung ke dashboard. Tanpa setup rumit — begitu terpasang, armada langsung terpantau.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="18" cy="6" r="2.5" />
        <circle cx="18" cy="18" r="2.5" />
        <path d="M8.2 10.8 15.8 7.2M8.2 13.2l7.6 3.6" />
      </svg>
    ),
  },
  {
    title: "Dalam genggaman",
    desc: "Pantau dan kelola armada langsung dari HP atau tablet, kapan pun dan di mana pun.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="7" y="3" width="10" height="18" rx="2" />
        <path d="M11 18h2" />
      </svg>
    ),
  },
];

const KONSUL_LANGKAH = [
  {
    title: "Hubungi kami",
    desc: "Ceritakan jenis dan jumlah kendaraan yang ingin dipantau.",
  },
  {
    title: "Kami petakan kebutuhan",
    desc: "Rekomendasi perangkat, skema pemasangan, dan konfigurasi server.",
  },
  {
    title: "Tim kami pasang & aktifkan",
    desc: "Perangkat dipasang di lokasi Anda — armada siap dipantau.",
  },
];

const KONTAK = [
  {
    label: "WhatsApp",
    value: "+62 812-3456-7890",
    href: "https://wa.me/6281234567890",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.5-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1l-.6.8c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.5-.6c.1-.2.1-.3 0-.5l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 2.2.9 2.6.7 3.1.7.5 0 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1z" />
      </svg>
    ),
  },
  {
    label: "Email",
    value: "halo@trackgp.id",
    href: "mailto:halo@trackgp.id",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="5" width="18" height="14" />
        <path d="M3 7l9 6 9-6" />
      </svg>
    ),
  },
  {
    label: "Telegram",
    value: "@trackgp",
    href: "https://t.me/trackgp",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M21 4L3 11l5 2 2 6 3-4 5 3z" />
      </svg>
    ),
  },
];

const COMPARE_BEFORE = [
  {
    label: "Tak terpantau",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 3l18 18" />
        <path d="M10.6 5.1A9.8 9.8 0 0 1 12 5c5 0 9 4.5 9 7a11 11 0 0 1-2.2 3.3" />
        <path d="M6.6 6.6A11.6 11.6 0 0 0 3 12c0 2.5 4 7 9 7a9.8 9.8 0 0 0 4.2-.9" />
        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      </svg>
    ),
  },
  {
    label: "Riwayat hilang",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    label: "Rekap lambat",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v4h4" />
        <path d="M9 12h6M9 16h6" />
      </svg>
    ),
  },
  {
    label: "Telat tahu",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" />
        <path d="M10.5 19a1.8 1.8 0 0 0 3 0" />
        <path d="M3 3l18 18" />
      </svg>
    ),
  },
];

const COMPARE_AFTER = [
  {
    label: "Real-time",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    ),
  },
  {
    label: "Tersimpan",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="4" width="18" height="4" />
        <path d="M5 8v12h14V8" />
        <path d="M10 12h4" />
      </svg>
    ),
  },
  {
    label: "Otomatis",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
      </svg>
    ),
  },
  {
    label: "Peringatan dini",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" />
        <path d="M10.5 19a1.8 1.8 0 0 0 3 0" />
      </svg>
    ),
  },
];

const SECURITY = [
  {
    title: "Enkripsi menyeluruh",
    desc: "Posisi kendaraan dikirim lewat koneksi terenkripsi dan disimpan dengan aman di server kami.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
        <path d="M9.5 12l1.8 1.8L15 10" />
      </svg>
    ),
  },
  {
    title: "Isolasi antar-bisnis",
    desc: "Setiap bisnis berdiri sendiri. Riwayat satu bisnis tidak pernah bercampur dengan bisnis lain.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="4" y="4" width="7" height="7" />
        <rect x="13" y="4" width="7" height="7" />
        <rect x="4" y="13" width="7" height="7" />
        <rect x="13" y="13" width="7" height="7" />
      </svg>
    ),
  },
  {
    title: "Kendali penuh di tangan Anda",
    desc: "Ekspor riwayat kapan saja. Tidak ada lock-in — Anda pegang kendali penuh.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 3v12" />
        <path d="M7 10l5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
    ),
  },
];

/* === Live-tracking simulation =========================================== */

type Pt = [number, number];

type Device = {
  plate: string;
  route: string;
  kind: string;
  base: number;
  /** kekuatan sinyal 1–4 */
  signal: number;
  pts: Pt[];
  /** rentang `t` (0–1) saat kendaraan melebihi batas kecepatan */
  zones: [number, number][];
};

const MAP_W = 320;
const MAP_H = 150;

/* Ambang batas kecepatan untuk simulasi indikasi speeding (km/j) */
const SPEED_LIMIT = 75;

const DEVICES: Device[] = [
  {
    plate: "D 7733 ABC",
    route: "Rute Bandung Raya",
    kind: "Pickup",
    base: 64,
    signal: 4,
    pts: [
      [40, 130], [76, 115], [70, 90], [104, 76], [142, 85], [176, 65],
      [212, 74], [248, 55], [282, 63],
    ],
    zones: [
      [0.04, 0.15],
      [0.28, 0.4],
    ],
  },
  {
    plate: "L 8844 XY",
    route: "Distribusi Surabaya",
    kind: "Van niaga",
    base: 58,
    signal: 3,
    pts: [
      [30, 41], [70, 33], [112, 42], [150, 30], [196, 40], [238, 27],
      [280, 40], [292, 75], [258, 95], [214, 86], [176, 104], [134, 94],
      [96, 108], [58, 95], [36, 71],
    ],
    zones: [
      [0.06, 0.17],
      [0.3, 0.42],
    ],
  },
  {
    plate: "B 9012 KJA",
    route: "Dinas Jakarta → Bandung",
    kind: "Truk boks",
    base: 72,
    signal: 4,
    pts: [
      [24, 124], [58, 112], [96, 116], [134, 98], [172, 86], [210, 80],
      [248, 66], [278, 56], [292, 45],
    ],
    zones: [
      [0.05, 0.16],
      [0.29, 0.41],
    ],
  },
];

/* === Helpers ============================================================= */

function makeSegments(pts: Pt[]) {
  const seg: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0];
    const dy = pts[i][1] - pts[i - 1][1];
    seg.push(seg[i - 1] + Math.hypot(dx, dy));
  }
  return seg;
}

function pointAt(pts: Pt[], seg: number[], t: number) {
  const total = seg[seg.length - 1] || 1;
  const d = Math.max(0, Math.min(1, t)) * total;
  let i = 1;
  while (i < seg.length - 1 && seg[i] < d) i++;
  const segLen = seg[i] - seg[i - 1] || 1;
  const local = (d - seg[i - 1]) / segLen;
  const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * local;
  const y = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * local;
  const angle =
    (Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]) * 180) /
    Math.PI;
  return { x, y, angle };
}

function traveledPath(pts: Pt[], seg: number[], t: number) {
  const total = seg[seg.length - 1] || 1;
  const d = Math.max(0, Math.min(1, t)) * total;
  let path = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    if (seg[i] <= d) {
      path += ` L ${pts[i][0]} ${pts[i][1]}`;
    } else {
      const p = pointAt(pts, seg, t);
      path += ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      break;
    }
  }
  return path;
}

function routePath(pts: Pt[]) {
  return pts.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ");
}

function fmtClock(sec: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(sec / 3600) % 24)}:${pad(Math.floor(sec / 60) % 60)}:${pad(
    Math.floor(sec) % 60,
  )}`;
}

/* Tata letak label speeding: tiap titik punya label, digeser bila bertumpuk */
const SPEED_LABEL_W = 100;
const SPEED_LABEL_H = 15;
const SPEED_LABEL_TAIL = 6;

function layoutSpeedLabels(marks: { p: { x: number; y: number } }[]) {
  const placed: { boxX: number; boxY: number; above: boolean; tailX: number; tailY: number }[] = [];
  for (const m of marks) {
    const above = m.p.y - SPEED_LABEL_H - 10 >= 0;
    let boxY = above ? m.p.y - SPEED_LABEL_H - 10 : m.p.y + 10;
    const boxX = Math.max(2, Math.min(MAP_W - SPEED_LABEL_W - 2, m.p.x - SPEED_LABEL_W / 2));
    for (const prev of placed) {
      if (
        Math.abs(prev.boxX - boxX) < SPEED_LABEL_W &&
        Math.abs(prev.boxY - boxY) < SPEED_LABEL_H + 4
      ) {
        boxY += above ? -(SPEED_LABEL_H + 4) : SPEED_LABEL_H + 4;
      }
    }
    boxY = Math.max(2, Math.min(MAP_H - SPEED_LABEL_H - 2, boxY));
    placed.push({
      boxX,
      boxY,
      above,
      tailX: Math.max(boxX + 7, Math.min(boxX + SPEED_LABEL_W - 7, m.p.x)),
      tailY: above ? boxY + SPEED_LABEL_H : boxY,
    });
  }
  return placed;
}

/* === Component =========================================================== */

type TrackingSimProps = {
  device: Device;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
};

function TrackingSim({ device, index, total, onPrev, onNext }: TrackingSimProps) {
  const seg = useMemo(() => makeSegments(device.pts), [device]);

  const [t, setT] = useState(0);
  const tRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [engineOn, setEngineOn] = useState(true);
  const [audioOn, setAudioOn] = useState(false);
  const [audioSec, setAudioSec] = useState(0);
  const [arrived, setArrived] = useState(false);
  const [reduced, setReduced] = useState(false);

  /* Preferensi gerak + auto-play setelah mount (aman untuk SSR) */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    if (!mq.matches) setPlaying(true);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  /* Animasi pergerakan kendaraan (dijalankan saat pengguna menekan play) */
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      tRef.current = Math.min(1, tRef.current + dt * 0.045);
      setT(tRef.current);
      if (tRef.current >= 1) {
        setPlaying(false);
        setArrived(true);
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  /* Timer "dengarkan percakapan" */
  useEffect(() => {
    if (!audioOn) return;
    const id = window.setInterval(() => setAudioSec((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [audioOn]);

  const togglePlay = () => {
    if (arrived) {
      tRef.current = 0;
      setT(0);
      setArrived(false);
      if (!engineOn) setEngineOn(true);
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  };

  const toggleEngine = () => {
    if (engineOn) {
      setEngineOn(false);
      setPlaying(false);
    } else {
      setEngineOn(true);
      if (!arrived) setPlaying(true);
    }
  };

  const toggleAudio = () => {
    const next = !audioOn;
    setAudioOn(next);
    if (next) setAudioSec(0);
  };

  const pos = pointAt(device.pts, seg, t);
  const traveled = traveledPath(device.pts, seg, t);
  const routeD = routePath(device.pts);
  const lastPt = device.pts[device.pts.length - 1];
  const firstPt = device.pts[0];
  const moving = engineOn && playing && !arrived;
  const speeding =
    moving && device.zones.some(([a, b]) => t >= a && t <= b);
  const speed = moving
    ? Math.round(
        speeding
          ? SPEED_LIMIT + 5 + 8 * Math.abs(Math.sin(t * 23))
          : Math.min(device.base, SPEED_LIMIT - 6) + 3 * Math.sin(t * 17),
      )
    : 0;
  const speedMarks = device.zones
    .filter(([a]) => t >= a)
    .map(([a, b]) => ({
      p: pointAt(device.pts, seg, a),
      active: t >= a && t <= b,
    }));
  const facingLeft = Math.cos((pos.angle * Math.PI) / 180) < 0;
  const signalBars = device.signal;
  const signalLabel = signalBars >= 4 ? "Kuat" : signalBars >= 3 ? "Sedang" : "Lemah";
  const engineLabel = !engineOn ? "Mati" : arrived ? "Idle" : "Hidup";

  return (
    <div className="p4-sim">
      {/* Header */}
      <div className="p4-sim-head">
        <div className="p4-sim-id">
          <span className="p4-sim-plate">{device.plate}</span>
          <span className="p4-sim-route">{device.route}</span>
        </div>
        <div className="p4-sim-ctrls">
          <span className="p4-sim-count">
            {index + 1} / {total}
          </span>
          <button
            type="button"
            className={`p4-icon-btn${playing ? " p4-icon-btn--active" : ""}`}
            onClick={togglePlay}
            aria-label={arrived ? "Ulangi perjalanan" : playing ? "Jeda simulasi" : "Jalankan simulasi"}
          >
            {arrived ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 3-6.7" />
                <path d="M3 4v4h4" />
              </svg>
            ) : playing ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" />
                <rect x="14" y="5" width="4" height="14" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 5l12 7-12 7z" />
              </svg>
            )}
          </button>
          <button type="button" className="p4-icon-btn" onClick={onPrev} aria-label="Perangkat sebelumnya">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button type="button" className="p4-icon-btn" onClick={onNext} aria-label="Perangkat berikutnya">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Peta */}
      <div className="p4-sim-map">
        <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} role="img" aria-label={`Peta simulasi rute ${device.plate}`}>
          <defs>
            <pattern id="p4mapgrid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#e8e8e3" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={MAP_W} height={MAP_H} fill="#f7f7f6" />
          <rect width={MAP_W} height={MAP_H} fill="url(#p4mapgrid)" />
          {/* blok bangunan dekoratif */}
          <g fill="#efefe9">
            <rect x="104" y="10" width="40" height="16" />
            <rect x="232" y="108" width="56" height="24" />
            <rect x="150" y="122" width="40" height="18" />
          </g>

          {/* rute penuh (belum dilalui) */}
          <path d={routeD} fill="none" stroke="#d6d6cf" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* rute yang sudah dilalui */}
          <path d={traveled} fill="none" stroke="#76b900" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* penanda titik melebihi batas kecepatan */}
          {speedMarks.map((m, i) => (
            <g key={i} transform={`translate(${m.p.x.toFixed(1)} ${m.p.y.toFixed(1)})`}>
              {m.active && <circle r="9" fill="#953b3b" opacity="0.16" className="p4-marker-ring" />}
              <circle r="4" fill="#ffffff" stroke="#953b3b" strokeWidth="2" />
              <circle r="1.7" fill="#953b3b" />
            </g>
          ))}

          {/* titik awal & tujuan */}
          <circle cx={firstPt[0]} cy={firstPt[1]} r="3.5" fill="#ffffff" stroke="#9a998e" strokeWidth="1.5" />
          <g>
            <circle cx={lastPt[0]} cy={lastPt[1]} r="6" fill="#76b900" opacity="0.18" />
            <circle cx={lastPt[0]} cy={lastPt[1]} r="3" fill="#ffffff" stroke="#76b900" strokeWidth="2" />
          </g>

          {/* marker kendaraan — mobil tampak samping, menghadap arah gerak */}
          <g transform={`translate(${pos.x.toFixed(1)} ${pos.y.toFixed(1)})`}>
            <circle r="13" fill="#76b900" opacity="0.14" className="p4-marker-ring" />
            <circle r="11" fill="#ffffff" stroke="#d6d6cf" strokeWidth="1" />
            <g transform={facingLeft ? "scale(-1 1)" : undefined}>
              {/* roda */}
              <circle cx="-4.2" cy="2.5" r="2" fill="#2a2a26" />
              <circle cx="4" cy="2.5" r="2" fill="#2a2a26" />
              {/* badan mobil */}
              <path
                d="M -7 2.5 L 7 2.5 L 7 -1 L 4 -1.8 L 1.8 -4.2 L -3.4 -4.2 L -5.6 -1.8 L -7 -1 Z"
                fill="#76b900"
              />
              {/* kaca */}
              <path d="M -3 -1.7 L 0.7 -1.7 L 1.5 -3.5 L -2.6 -3.5 Z" fill="#ffffff" opacity="0.9" />
              {/* lampu depan */}
              <rect x="6" y="-0.9" width="1" height="1.4" rx="0.4" fill="#ffffff" opacity="0.95" />
            </g>
          </g>

          {/* label status peta */}
          <text x="12" y={MAP_H - 6} fontSize="9" fill="#9a998e" fontFamily="var(--p4-mono)">
            {arrived ? "TIBA DI TUJUAN" : moving ? "DALAM PERJALANAN" : engineOn ? "SIAGA" : "MESIN MATI"}
          </text>

          {/* label speeding — menempel di tiap titik, menumpuk & tidak hilang */}
          {(() => {
            const boxes = layoutSpeedLabels(speedMarks);
            return speedMarks.map((m, i) => {
              const b = boxes[i];
              return (
                <g key={i}>
                  <path
                    d={
                      b.above
                        ? `M ${b.tailX - 4} ${b.tailY} L ${b.tailX + 4} ${b.tailY} L ${b.tailX} ${b.tailY + SPEED_LABEL_TAIL} Z`
                        : `M ${b.tailX - 4} ${b.tailY} L ${b.tailX + 4} ${b.tailY} L ${b.tailX} ${b.tailY - SPEED_LABEL_TAIL} Z`
                    }
                    fill="#953b3b"
                  />
                  <rect x={b.boxX} y={b.boxY} width={SPEED_LABEL_W} height={SPEED_LABEL_H} fill="#953b3b" />
                  <text
                    x={b.boxX + SPEED_LABEL_W / 2}
                    y={b.boxY + 10.5}
                    fontSize="8"
                    fontWeight="700"
                    fill="#ffffff"
                    textAnchor="middle"
                    fontFamily="var(--p4-mono)"
                    letterSpacing="0.3"
                  >
                    SPEEDING · 75 KM/J
                  </text>
                </g>
              );
            });
          })()}
        </svg>
      </div>

      {/* Strip status */}
      <div className="p4-sim-status">
        <div className="p4-status-cell">
          <div className="p4-status-label">Kecepatan</div>
          <div className={`p4-status-value p4-num${speeding ? " p4-status-value--alert" : ""}`}>
            {speed}
            <span className="p4-status-unit">km/j</span>
          </div>
        </div>
        <div className="p4-status-cell">
          <div className="p4-status-label">Mesin</div>
          <div className="p4-status-value">
            <span className={`p4-dot${engineOn ? " p4-dot--ok" : " p4-dot--off"}`} />
            {engineLabel}
          </div>
        </div>
        <div className="p4-status-cell">
          <div className="p4-status-label">GPS</div>
          <div className="p4-status-value">
            <span className="p4-dot p4-dot--ok" />
            Fix
          </div>
        </div>
        <div className="p4-status-cell">
          <div className="p4-status-label">Sinyal</div>
          <div className="p4-status-value">
            <span
              className="p4-signal"
              role="img"
              aria-label={`Sinyal ${signalBars} dari 4`}
            >
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`p4-signal-bar${i < signalBars ? " p4-signal-bar--on" : ""}`}
                />
              ))}
            </span>
            {signalLabel}
          </div>
        </div>
      </div>

      {/* Aksi */}
      <div className="p4-sim-actions">
        <button
          type="button"
          className={`p4-btn p4-btn--sm ${engineOn ? "p4-btn-danger" : "p4-btn-primary"}`}
          onClick={toggleEngine}
          aria-pressed={!engineOn}
        >
          <svg className="p4-ico p4-ico--scale" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M8 1.5v5" />
            <path d="M4.2 3.8a5.2 5.2 0 1 0 7.6 0" />
          </svg>
          {engineOn ? "Matikan mesin" : "Nyalakan mesin"}
        </button>
        <button
          type="button"
          className={`p4-btn p4-btn--sm ${audioOn ? "p4-btn-dark" : "p4-btn-ghost"}`}
          onClick={toggleAudio}
          aria-pressed={audioOn}
        >
          {audioOn ? (
            <svg className="p4-ico p4-ico--scale" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="4" y="4" width="8" height="8" />
            </svg>
          ) : (
            <svg className="p4-ico p4-ico--scale" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M2.5 6v4h2.5l3.5 3V3L5 6H2.5z" />
              <path d="M11 5.5a3.5 3.5 0 0 1 0 5" />
            </svg>
          )}
          {audioOn ? "Hentikan" : "Dengarkan percakapan"}
        </button>
      </div>

      {/* Bar audio */}
      {audioOn && (
        <div className="p4-audio">
          <div className="p4-audio-wave" aria-hidden="true">
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className="p4-audio-bar" style={{ animationDelay: `${(i % 8) * 0.09}s` }} />
            ))}
          </div>
          <div className="p4-audio-info">
            <span className="p4-audio-label">
              <span className="p4-dot p4-dot--rec" />
              Mendengarkan kabin
            </span>
            <span className="p4-audio-time p4-num">{fmtClock(audioSec)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* Pembungkus device: pindah device = remount TrackingSim (device lama berhenti & reset) */
function HeroSim() {
  const [deviceIdx, setDeviceIdx] = useState(0);
  const go = (dir: number) =>
    setDeviceIdx((i) => (i + dir + DEVICES.length) % DEVICES.length);
  return (
    <TrackingSim
      key={deviceIdx}
      device={DEVICES[deviceIdx]}
      index={deviceIdx}
      total={DEVICES.length}
      onPrev={() => go(-1)}
      onNext={() => go(1)}
    />
  );
}

export function Preview4() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("Semua");
  const [navOpen, setNavOpen] = useState(false);
  const [stabilo, setStabilo] = useState<"A" | "B" | "C" | "D">("A");
  const rootRef = useRef<HTMLDivElement>(null);

  /* Animasi masuk: elemen [data-reveal] tampil saat masuk layar */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    const reveal = (el: HTMLElement) => el.classList.add("is-in");

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      els.forEach(reveal);
      return;
    }

    /* useEffect jalan setelah paint pertama, jadi keadaan awal (opacity 0)
       sudah sempat dilukis — kelas bisa langsung ditambahkan. */
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const pending: HTMLElement[] = [];
    els.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) reveal(el);
      else pending.push(el);
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            reveal(en.target as HTMLElement);
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    pending.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FEATURES.filter((f) => {
      const matchCat = cat === "Semua" || f.cat === cat;
      const matchQ =
        !q ||
        f.title.toLowerCase().includes(q) ||
        f.desc.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [query, cat]);

  return (
    <div className="p4-root" ref={rootRef} data-stabilo={stabilo}>
      {/* 1 · NAV */}
      <header className="p4-nav">
        <div className="p4-container p4-nav-inner">
          <Link href="/" className="p4-brand">
            <span className="p4-brand-mark">TG</span>
            TrackGPS
          </Link>
          <ul className="p4-nav-links">
            <li><a href="#fitur">Fitur</a></li>
            <li><a href="#testimoni">Testimoni</a></li>
            <li><a href="#keamanan">Keamanan</a></li>
            <li><a href="#konsultasi">Konsultasi</a></li>
          </ul>
          <div className="p4-nav-right">
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="p4-btn p4-btn-primary"
            >
              Hubungi kami
              <svg className="p4-ico p4-ico--right" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 8h9" />
                <path d="M8 4l4 4-4 4" />
              </svg>
            </a>
            <button
              type="button"
              className="p4-nav-toggle"
              aria-label="Buka menu"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((v) => !v)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                {navOpen ? <path d="M3 3l10 10M13 3L3 13" /> : <path d="M2 4h12M2 8h12M2 12h12" />}
              </svg>
            </button>
          </div>
        </div>
        {navOpen && (
          <div className="p4-container" style={{ paddingBottom: 14 }}>
            <ul className="p4-nav-links p4-nav-links--open">
              <li><a href="#fitur" onClick={() => setNavOpen(false)}>Fitur</a></li>
              <li><a href="#testimoni" onClick={() => setNavOpen(false)}>Testimoni</a></li>
              <li><a href="#keamanan" onClick={() => setNavOpen(false)}>Keamanan</a></li>
              <li><a href="#konsultasi" onClick={() => setNavOpen(false)}>Konsultasi</a></li>
            </ul>
          </div>
        )}
      </header>

      {/* 2 · HERO */}
      <section className="p4-hero">
        <div className="p4-container">
          <div className="p4-hero-grid">
          <div className="p4-hero-lead">
            <span className="p4-hero-badge" data-reveal>
              <span className="p4-hero-badge-dot" />
              Platform GPS tracking untuk armada & aset
            </span>
            <h1 className="p4-h1" data-reveal style={{ animationDelay: "60ms" }}>
              Pantau setiap kendaraan,<br />detik demi detik.
            </h1>
            <p className="p4-sub" data-reveal style={{ marginTop: 18, maxWidth: 560, animationDelay: "120ms" }}>
              Kami pasang perangkat GPS di semua jenis kendaraan Anda dan
              sediakan server monitoring yang selalu aktif. Semua data — posisi,
              kecepatan, rute, dan status mesin — dari satu dashboard.
            </p>
            <div className="p4-hero-actions" data-reveal style={{ animationDelay: "180ms" }}>
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="p4-btn p4-btn-primary"
              >
                Hubungi Kami
                <svg className="p4-ico p4-ico--right" width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M3 8h9" />
                  <path d="M8 4l4 4-4 4" />
                </svg>
              </a>
              <a href="#fitur" className="p4-btn p4-btn-ghost">
                Lihat Fitur
                <svg className="p4-ico p4-ico--right" width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="2.5" y="2.5" width="4.5" height="4.5" />
                  <rect x="9" y="2.5" width="4.5" height="4.5" />
                  <rect x="2.5" y="9" width="4.5" height="4.5" />
                  <rect x="9" y="9" width="4.5" height="4.5" />
                </svg>
              </a>
            </div>
          </div>

          <div className="p4-hero-visual" data-reveal style={{ animationDelay: "140ms" }}>
            <HeroSim />
          </div>
          </div>

          <div className="p4-hero-meta" data-reveal style={{ animationDelay: "240ms" }}>
            {HERO_STATS.map((s) => (
              <div key={s.label} className="p4-hero-meta-item">
                <span className="p4-hero-meta-value p4-num">{s.value}</span>
                <span className="p4-hero-meta-label">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="p4-pills" data-reveal style={{ animationDelay: "300ms" }}>
            <span className="p4-pill"><b>Pemasangan</b> semua jenis kendaraan</span>
            <span className="p4-pill"><b>Server</b> monitoring 24/7</span>
            <span className="p4-pill"><b>Dashboard</b> multi-bisnis & hak akses per menu</span>
            <span className="p4-pill"><b>Dukungan</b> WhatsApp · Email · Telegram</span>
          </div>
        </div>
      </section>

      {/* 3 · TESTIMONIALS */}
      <section className="p4-section" style={{ paddingTop: 64 }} id="testimoni">
        <div className="p4-container">
          <div className="p4-section-head" data-reveal>
            <p className="p4-eyebrow">Kata pelanggan</p>
            <h2 className="p4-h2">Dipercaya tim operasional di lapangan</h2>
            <p className="p4-sub">
              Dari logistik, distribusi, sampai armada perusahaan — begini kata
              mereka setelah memakai TrackGPS.
            </p>
          </div>

          <div className="p4-testi" data-reveal style={{ animationDelay: "80ms" }}>
            {/* Unggulan */}
            <figure className="p4-testi-feature">
              <div className="p4-testi-photo p4-testi-photo--lg">
                {TESTIMONIALS[0].photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={TESTIMONIALS[0].photo} alt={TESTIMONIALS[0].name} />
                ) : (
                  <span className="p4-testi-photo-empty">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="5" width="18" height="14" />
                      <circle cx="9" cy="10" r="2" />
                      <path d="M4 17l4.5-4.5L12 16l3-3 5 5" />
                    </svg>
                    Foto pelanggan
                  </span>
                )}
              </div>
              <div className="p4-testi-body">
                <span className="p4-testi-mark" aria-hidden="true">&ldquo;</span>
                <blockquote className="p4-testi-quote p4-testi-quote--lg">
                  {TESTIMONIALS[0].quote}
                </blockquote>
                <figcaption className="p4-testi-author">
                  <span className="p4-testi-name">{TESTIMONIALS[0].name}</span>
                  <span className="p4-testi-role">
                    {TESTIMONIALS[0].role} · {TESTIMONIALS[0].company}
                  </span>
                </figcaption>
              </div>
            </figure>

            {/* Dua kartu kecil */}
            <div className="p4-testi-side">
              {TESTIMONIALS.slice(1).map((t) => (
                <figure key={t.name} className="p4-testi-card">
                  <div className="p4-testi-photo p4-testi-photo--sm">
                    {t.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.photo} alt={t.name} />
                    ) : (
                      <span className="p4-testi-photo-empty">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="5" width="18" height="14" />
                          <circle cx="9" cy="10" r="2" />
                          <path d="M4 17l4.5-4.5L12 16l3-3 5 5" />
                        </svg>
                        Foto
                      </span>
                    )}
                  </div>
                  <div className="p4-testi-body">
                    <blockquote className="p4-testi-quote">{t.quote}</blockquote>
                    <figcaption className="p4-testi-author">
                      <span className="p4-testi-name">{t.name}</span>
                      <span className="p4-testi-role">
                        {t.role} · {t.company}
                      </span>
                    </figcaption>
                  </div>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4 · COMPARISON */}
      <section className="p4-section p4-section--alt">
        <div className="p4-container">
          <div className="p4-section-head" data-reveal>
            <p className="p4-eyebrow">Selalu terhubung</p>
            <h2 className="p4-h2">Satu dashboard untuk seluruh armada</h2>
            <p className="p4-sub">
              Tanpa sistem, data kendaraan tersebar di banyak tempat. Dengan
              TrackGPS, semuanya mengalir ke satu dashboard yang bisa diakses
              seluruh tim.
            </p>
          </div>

          <div className="p4-compare" data-reveal style={{ animationDelay: "80ms" }}>
            <div className="p4-compare-col">
              <div className="p4-compare-tag p4-compare-tag--muted">Tanpa TrackGPS</div>
              <div className="p4-compare-note">Data terpencar, rekap manual, keputusan lambat.</div>
              <div className="p4-replicas">
                {COMPARE_BEFORE.map((c) => (
                  <div key={c.label} className="p4-replica">
                    <span className="p4-replica-icon">{c.icon}</span>
                    <span className="p4-replica-label">{c.label}</span>
                  </div>
                ))}
              </div>
              <p className="p4-compare-foot">4 celah · baru ketahuan belakangan</p>
            </div>

            <div className="p4-compare-col">
              <div className="p4-compare-tag p4-compare-tag--good">Dengan TrackGPS</div>
              <div className="p4-compare-note">Satu dashboard, semua perangkat, selalu sinkron.</div>
              <div className="p4-replicas">
                {COMPARE_AFTER.map((c) => (
                  <div key={c.label} className="p4-replica p4-replica--warm">
                    <span className="p4-replica-icon">{c.icon}</span>
                    <span className="p4-replica-label">{c.label}</span>
                  </div>
                ))}
              </div>
              <p className="p4-compare-foot">1 dashboard · serba otomatis</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5 · KEMUDAHAN */}
      <section className="p4-section">
        <div className="p4-container">
          <div className="p4-section-head" data-reveal>
            <p className="p4-eyebrow">Kemudahan</p>
            <h2 className="p4-h2">Terpantau, terhubung, dalam genggaman</h2>
          </div>
          <div className="p4-ease-grid" data-reveal style={{ animationDelay: "80ms" }}>
            {KEMUDAHAN.map((e) => (
              <div key={e.title} className="p4-ease-card">
                <div className="p4-ease-icon">{e.icon}</div>
                <h3>{e.title}</h3>
                <p>{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6 · FEATURE LIBRARY */}
      <section className="p4-section p4-section--alt" id="fitur">
        <div className="p4-container">
          <div className="p4-section-head" data-reveal>
            <p className="p4-eyebrow">Perpustakaan fitur</p>
            <h2 className="p4-h2">Semua yang kendaraan Anda butuhkan</h2>
          </div>

          <div className="p4-lib-toolbar" data-reveal style={{ animationDelay: "80ms" }}>
            <div className="p4-search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                type="search"
                placeholder="Cari fitur…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Cari fitur"
              />
            </div>
            <div className="p4-chips">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`p4-chip${cat === c ? " p4-chip--active" : ""}`}
                  onClick={() => setCat(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <span className="p4-lib-count p4-num">{filtered.length} fitur</span>
          </div>

          <div className="p4-lib-grid" data-reveal style={{ animationDelay: "140ms" }}>
            {filtered.length === 0 ? (
              <div className="p4-lib-empty">Tidak ada fitur yang cocok dengan pencarian Anda.</div>
            ) : (
              filtered.map((f) => (
                <div key={f.title} className="p4-lib-card">
                  <div className="p4-lib-icon">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 7 · KONSULTASI */}
      <section className="p4-section" id="konsultasi">
        <div className="p4-container">
          <div className="p4-konsul">
            <div className="p4-konsul-info" data-reveal>
              <p className="p4-eyebrow">Konsultasi</p>
              <h2 className="p4-h2" style={{ marginTop: 12 }}>
                Konsultasikan kebutuhan armada Anda
              </h2>
              <p className="p4-sub" style={{ marginTop: 12 }}>
                Setiap armada berbeda, jadi kami tidak menyediakan paket
                instan. Ceritakan kebutuhan Anda — tim kami bantu tentukan
                perangkat, pemasangan, dan biayanya.
              </p>

              <ol className="p4-konsul-steps">
                {KONSUL_LANGKAH.map((s, i) => (
                  <li key={s.title} className="p4-konsul-step">
                    <span className="p4-konsul-num p4-num">{String(i + 1).padStart(2, "0")}</span>
                    <span>
                      <span className="p4-konsul-step-title">{s.title}</span>
                      <span className="p4-konsul-step-desc">{s.desc}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="p4-konsul-contact" data-reveal style={{ animationDelay: "80ms" }}>
              <div className="p4-konsul-contact-head">
                <p className="p4-konsul-contact-title">Hubungi tim kami</p>
                <p className="p4-konsul-contact-sub">
                  Pilih kanal yang paling nyaman untuk Anda.
                </p>
              </div>
              <div className="p4-kontak-list">
                {KONTAK.map((k) => (
                  <a
                    key={k.label}
                    href={k.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p4-kontak-row"
                  >
                    <span className="p4-kontak-icon">{k.icon}</span>
                    <span className="p4-kontak-text">
                      <span className="p4-kontak-label">{k.label}</span>
                      <span className="p4-kontak-value">{k.value}</span>
                    </span>
                  </a>
                ))}
              </div>
              <a
                href="https://wa.me/6281234567890?text=Halo%2C%20saya%20ingin%20konsultasi%20GPS%20tracking%20untuk%20armada%20saya."
                target="_blank"
                rel="noopener noreferrer"
                className="p4-btn p4-btn-primary"
                style={{ width: "100%", height: 42, marginTop: "auto" }}
              >
                Mulai konsultasi
                <svg className="p4-ico p4-ico--right" width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M3 8h9" />
                  <path d="M8 4l4 4-4 4" />
                </svg>
              </a>
              <p className="p4-konsul-note">Gratis, tanpa komitmen · respon 1×24 jam</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8 · SECURITY */}
      <section className="p4-section p4-section--alt" id="keamanan">
        <div className="p4-container">
          <div className="p4-section-head" data-reveal>
            <p className="p4-eyebrow">Keamanan</p>
            <h2 className="p4-h2">Aman dari perangkat hingga dashboard</h2>
          </div>
          <div className="p4-sec-grid" data-reveal style={{ animationDelay: "80ms" }}>
            {SECURITY.map((s) => (
              <div key={s.title} className="p4-sec-card">
                <div className="p4-sec-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9 · CTA */}
      <section className="p4-cta" id="mulai">
        <div className="p4-container">
          <h2 className="p4-h2" data-reveal>Siap memantau armada Anda?</h2>
          <p className="p4-sub" data-reveal style={{ animationDelay: "80ms" }}>
            Pasang GPS, hubungkan ke server kami, dan mulai pantau seluruh
            kendaraan dari satu dashboard.
          </p>
          <div className="p4-cta-actions" data-reveal style={{ animationDelay: "140ms" }}>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="p4-btn p4-btn-primary"
              style={{ height: 44, padding: "0 22px" }}
            >
              Hubungi kami
              <svg className="p4-ico p4-ico--right" width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 8h9" />
                <path d="M8 4l4 4-4 4" />
              </svg>
            </a>
            <a href="#fitur" className="p4-btn p4-btn-ghost" style={{ height: 44, padding: "0 22px" }}>
              Pelajari fitur
              <svg className="p4-ico p4-ico--right" width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="2.5" y="2.5" width="4.5" height="4.5" />
                <rect x="9" y="2.5" width="4.5" height="4.5" />
                <rect x="2.5" y="9" width="4.5" height="4.5" />
                <rect x="9" y="9" width="4.5" height="4.5" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* 10 · FOOTER */}
      <footer className="p4-footer">
        <div className="p4-container">
          <div className="p4-footer-cols">
            <div>
              <div className="p4-footer-brand">
                <span className="p4-footer-brand-mark">TG</span>
                TrackGPS
              </div>
              <p className="p4-footer-desc">
                Pemasangan GPS & server monitoring real-time untuk semua jenis
                kendaraan.
              </p>
              <div className="p4-footer-badges">
                <span className="p4-footer-badge">Uptime 99.9%</span>
                <span className="p4-footer-badge">Data terisolasi</span>
                <span className="p4-footer-badge">Made in Indonesia</span>
              </div>
            </div>

            <div>
              <p className="p4-footer-heading">Produk</p>
              <ul className="p4-footer-list">
                <li><a href="#fitur">Fitur</a></li>
                <li><a href="#testimoni">Testimoni</a></li>
                <li><a href="#konsultasi">Konsultasi</a></li>
                <li><a href="#keamanan">Keamanan</a></li>
                <li><Link href="/login">Dashboard</Link></li>
              </ul>
            </div>

            <div>
              <p className="p4-footer-heading">Layanan</p>
              <ul className="p4-footer-list">
                <li><span>Pemasangan GPS</span></li>
                <li><span>Server Monitoring</span></li>
                <li><span>Kamera Kendaraan</span></li>
                <li><span>Geofence & Alert</span></li>
              </ul>
            </div>

            <div>
              <p className="p4-footer-heading">Perusahaan</p>
              <ul className="p4-footer-list">
                <li><span>Tentang Kami</span></li>
                <li><span>Kontak</span></li>
                <li><span>Blog</span></li>
                <li><span>Karir</span></li>
              </ul>
            </div>

            <div>
              <p className="p4-footer-heading">Legal</p>
              <ul className="p4-footer-list">
                <li><span>Kebijakan Privasi</span></li>
                <li><span>Syarat & Ketentuan</span></li>
              </ul>
            </div>
          </div>

          <div className="p4-footer-bottom">
            <span>© {new Date().getFullYear()} TrackGPS. Hak cipta dilindungi.</span>
            <div className="p4-footer-social">
              <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.5-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1l-.6.8c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.5-.6c.1-.2.1-.3 0-.5l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 2.2.9 2.6.7 3.1.7.5 0 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1z" />
                </svg>
              </a>
              <a href="#" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM10 9h3.8v1.7h.1c.5-.9 1.8-1.9 3.7-1.9 4 0 4.7 2.6 4.7 6V21h-4v-5.3c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8V21h-4z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Pemilih stabilo — disembunyikan (opsi A/B/C/D tetap tersimpan di CSS) */}
      {/*
      <div className="p4-sk-picker" role="group" aria-label="Pilih gaya stabilo menu">
        <span className="p4-sk-picker-label">Stabilo</span>
        {([
          ["A", "Sorot huruf"],
          ["B", "Sapuan bawah"],
          ["C", "Marker lebar"],
          ["D", "Goresan"],
        ] as const).map(([v, label]) => (
          <button
            key={v}
            type="button"
            className={`p4-sk-opt${stabilo === v ? " is-active" : ""}`}
            onClick={() => setStabilo(v)}
            aria-pressed={stabilo === v}
          >
            {v} · {label}
          </button>
        ))}
      </div>
      */}
    </div>
  );
}
