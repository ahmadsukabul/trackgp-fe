"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar } from "lucide-react";

/**
 * DateInput — input tanggal berformat **dd/mm/yyyy** (tanggal/bulan/tahun)
 * supaya urutannya tidak membingungkan pengguna Indonesia.
 *
 * Nilai tetap disimpan sebagai ISO `yyyy-mm-dd` agar konsisten dengan query API.
 * Pengguna bisa mengetik langsung (mis. `6/10/2026`) atau membuka kalender
 * bawaan browser lewat ikon di kiri.
 */

/** ISO `yyyy-mm-dd` → `dd/mm/yyyy`. */
export function isoToDmy(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

/** `dd/mm/yyyy` → ISO `yyyy-mm-dd`; "" bila belum/tidak valid. */
export function dmyToIso(dmy: string): string {
  const m = dmy.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!m) return "";
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  if (y < 1900 || y > 2200) return "";
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}-${pad(mo)}-${pad(d)}`;
}

const BASE_CLS =
  "pl-8 pr-3 py-2 text-[13px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2964e7]/30";

interface Props {
  /** Nilai ISO `yyyy-mm-dd`; "" = kosong. */
  value: string;
  /** Dipanggil dengan ISO `yyyy-mm-dd` saat tanggal valid dipilih/diketik. */
  onChange: (iso: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function DateInput({
  value,
  onChange,
  className,
  placeholder = "hh/bb/tttt",
  disabled,
}: Props) {
  const [text, setText] = useState(isoToDmy(value));
  const [focused, setFocused] = useState(false);
  const pickerRef = useRef<HTMLInputElement>(null);

  // Sinkronkan tampilan saat nilai eksternal berubah (mis. reset) — kecuali
  // sedang diketik agar kursor tidak melompat.
  useEffect(() => {
    if (!focused) setText(isoToDmy(value));
  }, [value, focused]);

  function openPicker() {
    const el = pickerRef.current as
      | (HTMLInputElement & { showPicker?: () => void })
      | null;
    if (!el) return;
    if (typeof el.showPicker === "function") el.showPicker();
    else el.focus();
  }

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Buka kalender"
        onClick={openPicker}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
      >
        <Calendar className="w-3.5 h-3.5" />
      </button>

      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d/.-]/g, "");
          setText(raw);
          const iso = dmyToIso(raw);
          if (iso) onChange(iso);
          else if (raw === "") onChange("");
        }}
        onBlur={() => {
          setFocused(false);
          const iso = dmyToIso(text);
          if (iso) onChange(iso);
          setText(isoToDmy(iso || value));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className={className ?? BASE_CLS}
      />

      {/* Input date native tersembunyi: sumber kalender browser. */}
      <input
        ref={pickerRef}
        type="date"
        value={value}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          onChange(e.target.value);
          setText(isoToDmy(e.target.value));
        }}
        className="absolute right-0 bottom-0 w-px h-px opacity-0 pointer-events-none"
      />
    </div>
  );
}
