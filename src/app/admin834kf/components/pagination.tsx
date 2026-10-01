"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * PaginationBar — kontrol paging keyset (last_id + limit) dengan nomor halaman
 * 1, 2, 3, ... mengikuti konsep list admin Terachat.
 *
 * Karena tidak ada COUNT(*), jumlah halaman tidak diketahui di awal. Nomor
 * halaman muncul bertahap: halaman yang sudah pernah dikunjungi (maxVisitedPage)
 * plus satu halaman berikutnya bila halaman aktif masih terisi penuh (canNext).
 * Itu sebabnya tombol nomor di atas maxVisitedPage dinonaktifkan.
 *
 * Kalau nomornya sudah banyak, bagian tengah diringkas jadi elipsis supaya bar
 * tidak melebar — pola halaman 1 … n-1 n n+1 … terakhir.
 */
const ELLIPSIS_THRESHOLD = 7;

function buildPages(page: number, visiblePageCount: number): (number | "gap")[] {
  if (visiblePageCount <= ELLIPSIS_THRESHOLD) {
    return Array.from({ length: visiblePageCount }, (_, i) => i + 1);
  }

  const items: (number | "gap")[] = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(visiblePageCount - 1, page + 1);

  if (from > 2) items.push("gap");
  for (let p = from; p <= to; p++) items.push(p);
  if (to < visiblePageCount - 1) items.push("gap");
  items.push(visiblePageCount);

  return items;
}

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

  // Nomor halaman yang ditampilkan: semua halaman yang pernah dikunjungi, plus
  // satu halaman berikutnya kalau halaman aktif masih punya lanjutan.
  const visiblePageCount = canNext ? Math.max(maxVisitedPage, page + 1) : maxVisitedPage;
  const pages = buildPages(page, Math.max(1, visiblePageCount));

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-700/50">
      <p className="text-[12px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
        Halaman {page} · {limit} data per halaman
      </p>
      <div className="flex items-center gap-1.5 flex-wrap justify-end">
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
          pages.map((p, idx) =>
            p === "gap" ? (
              <span
                key={`gap-${idx}`}
                className="h-8 min-w-8 px-1 inline-flex items-center justify-center text-[13px] font-semibold text-gray-400 dark:text-gray-600 select-none"
              >
                …
              </span>
            ) : (
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
            ),
          )}

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
