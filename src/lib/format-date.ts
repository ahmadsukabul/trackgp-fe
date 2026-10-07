/**
 * Util format tanggal/waktu untuk seluruh halaman (admin & client).
 *
 * Prinsip: tampilkan angka jam "wall-clock" apa adanya dari string server,
 * TANPA konversi timezone. Backend mengirim waktu WIB; kalau kita pakai
 * `toLocaleString`/`new Date` + getter, hasilnya bergeser mengikuti timezone
 * browser dan bisa memicu hydration mismatch. Karena itu komponen tanggal/jam
 * diambil langsung dari string.
 *
 * Format masukan yang didukung:
 *   - "2026-10-06 16:22:06"        (spasi)
 *   - "2026-10-06T16:22:06"        (ISO polos)
 *   - "2026-10-06T16:22:06+07:00"  (ISO + offset — offset diabaikan)
 *   - "2026-10-06"                 (tanggal saja)
 */

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

type DateParts = {
  year: number;
  month: number; // 0-11
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Ambil komponen waktu dari string; null bila format tidak dikenali. */
export function parseDateParts(value: string): DateParts | null {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return null;
  return {
    year: Number(m[1]),
    month: Number(m[2]) - 1,
    day: Number(m[3]),
    hour: m[4] ? Number(m[4]) : 0,
    minute: m[5] ? Number(m[5]) : 0,
    second: m[6] ? Number(m[6]) : 0,
  };
}

/** "6 Okt 2026 16:22" */
export function formatDateTime(value: string): string {
  if (!value) return "-";
  const p = parseDateParts(value);
  if (!p) return value;
  return `${p.day} ${MONTHS[p.month]} ${p.year} ${pad(p.hour)}:${pad(p.minute)}`;
}

/** "6 Okt 2026 16:22:06" */
export function formatDateTimeSec(value: string): string {
  if (!value) return "-";
  const p = parseDateParts(value);
  if (!p) return value;
  return `${p.day} ${MONTHS[p.month]} ${p.year} ${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
}

/** "6 Okt 2026" */
export function formatDate(value: string): string {
  if (!value) return "-";
  const p = parseDateParts(value);
  if (!p) return value;
  return `${p.day} ${MONTHS[p.month]} ${p.year}`;
}

/**
 * Label relatif terhadap sekarang, mis. "3 menit yang lalu" / "2 hari lagi".
 * Dipakai sebagai keterangan tambahan di bawah tanggal agar lebih informatif.
 * Waktu diperlakukan sebagai wall-clock (tanpa konversi timezone).
 */
export function formatRelative(value: string): string {
  const p = parseDateParts(value);
  if (!p) return "";
  const then = new Date(p.year, p.month, p.day, p.hour, p.minute, p.second).getTime();
  const diffMs = Date.now() - then;
  const future = diffMs < 0;
  const abs = Math.abs(diffMs);

  const minutes = Math.floor(abs / 60000);
  if (minutes < 1) return "baru saja";

  const hours = Math.floor(abs / 3600000);
  const days = Math.floor(abs / 86400000);

  let label: string;
  if (minutes < 60) label = `${minutes} menit`;
  else if (hours < 24) label = `${hours} jam`;
  else if (days < 30) label = `${days} hari`;
  else if (days < 365) label = `${Math.floor(days / 30)} bulan`;
  else label = `${Math.floor(days / 365)} tahun`;

  return future ? `${label} lagi` : `${label} yang lalu`;
}

/**
 * Waktu lokal sekarang sebagai "YYYY-MM-DD HH:mm:ss" memakai komponen lokal
 * (bukan `toISOString` yang UTC). Dipakai untuk timestamp optimistik di FE.
 */
export function nowLocalString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * True bila tanggal (tanpa jam) sudah lewat hari ini — dibandingkan pada
 * granularitas hari memakai komponen lokal, bukan `new Date` mentah, supaya
 * tidak terpengaruh timezone browser.
 */
export function isPastDate(value: string): boolean {
  const p = parseDateParts(value);
  if (!p) return false;
  const today = new Date();
  const todayKey = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const valueKey = p.year * 10000 + (p.month + 1) * 100 + p.day;
  return valueKey < todayKey;
}
