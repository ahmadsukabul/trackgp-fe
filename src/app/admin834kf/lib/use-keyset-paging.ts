"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiResponse } from "../lib/api";

export const ADMIN_PAGE_LIMIT = 20;

/**
 * useKeysetPaging — paging keyset ala Terachat untuk halaman admin.
 *
 * Backend memakai cursor `last_id` (id baris terakhir halaman sebelumnya) dan
 * `limit`, tanpa COUNT(*). FE menyimpan cache per halaman + last_id-nya supaya
 * tombol Prev tidak perlu request ulang.
 *
 * rows  = data halaman aktif
 * load  = panggil ulang halaman aktif (setelah simpan/hapus)
 * reset = kembali ke halaman 1 (setelah filter berubah)
 */
export function useKeysetPaging<T>({
  fetchPage,
  enabled = true,
}: {
  fetchPage: (params: { last_id: number; limit: number }) => Promise<ApiResponse<T[]>>;
  enabled?: boolean;
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

  const loadPage = useCallback(async (targetPage: number, silent = false) => {
    const cached = cache.current.get(targetPage);
    if (cached && !silent) {
      setRows(cached.rows);
      setHasNext(cached.hasNext);
      setPage(targetPage);
      setLoading(false);
      return;
    }

    const lastID = targetPage <= 1 ? 0 : cache.current.get(targetPage - 1)?.lastID ?? 0;
    setLoading(true);
    setError(null);

    const res = await fetchRef.current({ last_id: lastID, limit: ADMIN_PAGE_LIMIT });
    if (res.status === 1 && Array.isArray(res.data)) {
      const data = res.data;
      const nextHasNext = data.length >= ADMIN_PAGE_LIMIT;
      const nextCursor = data.length > 0 ? Number((data[data.length - 1] as { id?: number }).id ?? 0) : lastID;

      cache.current.set(targetPage, { lastID: nextCursor, rows: data, hasNext: nextHasNext });
      setRows(data);
      setHasNext(nextHasNext);
      setPage(targetPage);
      setMaxVisitedPage((prev) => Math.max(prev, targetPage));
    } else if (res.status !== 1) {
      setError(res.error_msg || "Gagal memuat data.");
    }
    setLoading(false);
  }, []);

  // Muat ulang halaman aktif tanpa cache (setelah insert/update/delete).
  const reload = useCallback(async () => {
    const current = page;
    cache.current.delete(current);
    await loadPage(current, true);
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
  }, [enabled, loadPage, fetchRef]);

  return {
    rows,
    loading,
    error,
    setError,
    page,
    hasNext,
    maxVisitedPage,
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
