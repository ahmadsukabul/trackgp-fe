"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiResponse } from "./api";

/**
 * CLIENT_PAGE_LIMIT — jumlah baris per halaman untuk list client (selaras
 * LIST_LIMIT di client.ts). BE hanya memasang LIMIT kalau limit > 0.
 */
export const CLIENT_PAGE_LIMIT = 100;

/**
 * useKeysetPaging — paging keyset (last_id + limit) untuk halaman client.
 *
 * Backend memakai cursor `last_id` (id baris terakhir halaman sebelumnya) dan
 * `limit`, tanpa COUNT(*). FE menyimpan cache per halaman + last_id-nya supaya
 * tombol Prev tidak perlu request ulang.
 *
 * rows  = data halaman aktif
 * reload = panggil ulang halaman aktif (setelah filter berubah)
 * reset  = kembali ke halaman 1 (setelah filter berubah)
 */
export function useKeysetPaging<T>({
  fetchPage,
  enabled = true,
  limit = CLIENT_PAGE_LIMIT,
}: {
  fetchPage: (params: { last_id: number; limit: number }) => Promise<ApiResponse<T[]>>;
  enabled?: boolean;
  limit?: number;
}) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [maxVisitedPage, setMaxVisitedPage] = useState(1);

  // Cache per halaman: { last_id yang dikirim, data hasilnya }.
  const cache = useRef<Map<number, { lastID: number; rows: T[]; hasNext: boolean }>>(new Map());
  // fetchPage terbaru dipakai di dalam callback, tanpa memicu re-render.
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  /**
   * loadPage memuat satu halaman.
   *   bypassCache = true → paksa ambil dari server (dipakai reload)
   *   quiet       = true → jangan nyalakan spinner
   */
  const loadPage = useCallback(
    async (targetPage: number, opts?: { bypassCache?: boolean; quiet?: boolean }) => {
      const bypassCache = opts?.bypassCache ?? false;
      const quiet = opts?.quiet ?? false;

      const cached = cache.current.get(targetPage);
      if (cached && !bypassCache) {
        setRows(cached.rows);
        setHasNext(cached.hasNext);
        setPage(targetPage);
        setLoading(false);
        return;
      }

      const lastID = targetPage <= 1 ? 0 : cache.current.get(targetPage - 1)?.lastID ?? 0;
      if (!quiet) setLoading(true);
      setError(null);

      // Minta limit+1 baris: satu baris ekstra hanya dipakai untuk memastikan
      // masih ada halaman berikutnya. Tanpa ini, halaman terakhir yang isinya pas
      // (mis. tepat 100 baris) akan tetap menyalakan tombol Next.
      const res = await fetchRef.current({ last_id: lastID, limit: limit + 1 });
      if (res.status === 1 && Array.isArray(res.data)) {
        const raw = res.data;
        const nextHasNext = raw.length > limit;
        const data = nextHasNext ? raw.slice(0, limit) : raw;
        // Cursor = id baris terakhir yang benar-benar ditampilkan (bukan baris probe).
        const nextCursor = data.length > 0 ? Number((data[data.length - 1] as { id?: number }).id ?? 0) : lastID;

        cache.current.set(targetPage, { lastID: nextCursor, rows: data, hasNext: nextHasNext });
        setRows(data);
        setHasNext(nextHasNext);
        setPage(targetPage);
        setMaxVisitedPage((prev) => Math.max(prev, targetPage));
      } else if (res.status !== 1) {
        setError(res.error_msg || "Gagal memuat data.");
      }
      if (!quiet) setLoading(false);
    },
    [limit],
  );

  // Muat ulang halaman aktif tanpa cache (setelah insert/update/delete).
  const reload = useCallback(async () => {
    await loadPage(page, { bypassCache: true });
  }, [page, loadPage]);

  // Reset filter: bersihkan cache & kembali ke halaman 1.
  const reset = useCallback(() => {
    cache.current.clear();
    setMaxVisitedPage(1);
    void loadPage(1);
  }, [loadPage]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    cache.current.clear();
    setMaxVisitedPage(1);
    void loadPage(1);
  }, [enabled, loadPage]);

  return {
    rows,
    loading,
    error,
    page,
    hasNext,
    maxVisitedPage,
    limit,
    reload,
    reset,
    goPrev: () => {
      if (page > 1) void loadPage(page - 1);
    },
    goNext: () => {
      if (hasNext) void loadPage(page + 1);
    },
    goPage: (p: number) => {
      if (p >= 1 && p <= maxVisitedPage) void loadPage(p);
    },
  };
}
