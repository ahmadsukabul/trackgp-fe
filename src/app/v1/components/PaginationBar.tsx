"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * PaginationBar (v1) — kontrol paging keyset (last_id + limit) dengan nomor
 * halaman 1, 2, 3, ... mengikuti konsep list admin Terachat.
 *
 * Karena tidak ada COUNT(*), jumlah halaman tidak diketahui di awal. Nomor
 * halaman muncul bertahap: halaman yang sudah pernah dikunjungi (maxVisitedPage)
 * plus satu halaman berikutnya bila halaman aktif masih terisi penuh (canNext).
 * Itu sebabnya tombol nomor di atas maxVisitedPage dinonaktifkan.
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

export default function PaginationBar({
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

  const visiblePageCount = canNext ? Math.max(maxVisitedPage, page + 1) : maxVisitedPage;
  const pages = buildPages(page, Math.max(1, visiblePageCount));

  const navBtn =
    "h-8 px-3 rounded-lg text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3"
      style={{ borderTop: "1px solid var(--v1-border-subtle)" }}
    >
      <p className="text-[12px] whitespace-nowrap" style={{ color: "var(--v1-ink-faint)" }}>
        Halaman {page} · {limit} data per halaman
      </p>
      <div className="flex items-center gap-1.5 flex-wrap justify-end">
        <button
          onClick={onPrev}
          disabled={!mounted || loading || !canPrev}
          className={navBtn}
          style={{ border: "1px solid var(--v1-border)", color: "var(--v1-ink-muted)" }}
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
                className="h-8 min-w-8 px-1 inline-flex items-center justify-center text-[13px] font-semibold select-none"
                style={{ color: "var(--v1-ink-faint)" }}
              >
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageJump(p)}
                disabled={!mounted || loading || p > maxVisitedPage}
                className={`h-8 min-w-8 px-3 rounded-lg text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40`}
                style={
                  p === page
                    ? { background: "var(--v1-accent)", color: "#ffffff" }
                    : { border: "1px solid var(--v1-border)", color: "var(--v1-ink-muted)" }
                }
              >
                {p}
              </button>
            ),
          )}

        <button
          onClick={onNext}
          disabled={!mounted || loading || !canNext}
          className={navBtn}
          style={{ border: "1px solid var(--v1-border)", color: "var(--v1-ink-muted)" }}
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
