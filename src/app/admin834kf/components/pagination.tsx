"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * PaginationBar — kontrol paging keyset (last_id + limit) yang selalu tampil
 * di bawah tabel, sama seperti konsep paging Terachat. Tidak ada total data,
 * jadi tombol "Next" aktif hanya kalau halaman berjalan terisi penuh.
 */
export function PaginationBar({
  page,
  limit,
  canPrev,
  canNext,
  loading,
  onPrev,
  onNext,
  onPageJump,
  maxVisitedPage = 1,
}: {
  page: number;
  limit: number;
  canPrev: boolean;
  canNext: boolean;
  loading?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPageJump?: (page: number) => void;
  maxVisitedPage?: number;
}) {
  // Guard hidrasi: nomor halaman diturunkan dari state yang hanya akurat setelah
  // data pertama dimuat. Menahan render kontrol paging sampai mounted membuat
  // markup server & client identik sehingga tidak ada hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Nomor halaman yang bisa dituju langsung (maks 5, di sekitar halaman aktif).
  const windowSize = 5;
  const start = Math.max(1, Math.min(page - 2, maxVisitedPage - windowSize + 1));
  const pages: number[] = [];
  for (let i = 0; i < windowSize; i++) {
    const p = start + i;
    if (p > maxVisitedPage) break;
    pages.push(p);
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700/50">
      <p className="text-[12px] text-gray-500 dark:text-gray-400">
        Halaman {page} · {limit} data per halaman
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onPrev}
          disabled={!mounted || loading || !canPrev}
          className="h-8 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-[13px] font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
        >
          <span className="inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Prev
          </span>
        </button>

        {onPageJump &&
          mounted &&
          pages.map((p) => (
            <button
              key={p}
              onClick={() => onPageJump(p)}
              disabled={!mounted || loading || p > maxVisitedPage}
              className={`h-8 min-w-8 px-3 rounded-lg text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                p === page
                  ? "bg-[#2964e7] text-white"
                  : "border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {p}
            </button>
          ))}

        <button
          onClick={onNext}
          disabled={!mounted || loading || !canNext}
          className="h-8 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-[13px] font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
        >
          <span className="inline-flex items-center gap-1">
            {mounted && loading ? "Memuat..." : "Next"}
            <ChevronRight className="w-4 h-4" />
          </span>
        </button>
      </div>
    </div>
  );
}
