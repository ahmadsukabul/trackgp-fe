"use client";

import { useEffect, useRef, useState } from "react";
import { Search, ChevronDown, Loader2, Check } from "lucide-react";
import { adminFetch } from "../lib/api";

type Bisnis = { bisnis_id: string; name: string };

interface Props {
  /** bisnis_id terpilih */
  value: string;
  /** dipanggil saat memilih: (bisnis_id, name) */
  onChange: (id: string, name: string) => void;
  /** nama awal untuk menampilkan pilihan yang sudah ada (mode edit) */
  initialName?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * BisnisSelect — dropdown bisnis yang bisa dicari berdasarkan nama.
 * Sumber data: GET /adminx8/bisnis?name=<q>&limit=20 (server-side search).
 */
export default function BisnisSelect({
  value,
  onChange,
  initialName = "",
  placeholder = "Cari nama bisnis...",
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<Bisnis[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedName, setSelectedName] = useState(initialName);

  const boxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSelectedName(initialName);
  }, [initialName]);

  // Tutup saat klik di luar.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Ambil daftar bisnis (debounce) ketika dropdown dibuka / query berubah.
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("limit", "20");
      const q = query.trim();
      if (q) params.set("name", q);
      const res = await adminFetch<Bisnis[]>(`/bisnis?${params}`);
      setOptions(res.status === 1 && Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [open, query]);

  const display = selectedName || value;

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-[13px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
      >
        <span className={`truncate ${display ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
          {display || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-[60] mt-1 w-full bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-gray-800/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ketik nama bisnis..."
                className="w-full pl-8 pr-2 py-1.5 text-[13px] bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-3 text-[12px] text-gray-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Memuat...
              </div>
            ) : options.length === 0 ? (
              <div className="px-3 py-3 text-[12px] text-gray-400">Bisnis tidak ditemukan</div>
            ) : (
              options.map((b) => (
                <button
                  key={b.bisnis_id}
                  type="button"
                  onClick={() => {
                    onChange(b.bisnis_id, b.name);
                    setSelectedName(b.name);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <span className="min-w-0">
                    <span className="block text-[13px] text-gray-900 dark:text-white truncate">{b.name}</span>
                    <span className="block text-[11px] text-gray-400 font-mono truncate">{b.bisnis_id}</span>
                  </span>
                  {value === b.bisnis_id && <Check className="w-3.5 h-3.5 text-[#2964e7] shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
