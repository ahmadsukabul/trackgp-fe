"use client";

import { createContext, useContext } from "react";

/**
 * Base path aplikasi client ("/v1" atau "/v2").
 *
 * Halaman v1 dipakai ulang oleh v2, jadi link internal tidak boleh hardcode "/v1"
 * — ambil dari context ini supaya navigasi tetap di dalam app yang sedang aktif.
 * Default "/v1" supaya halaman v1 tetap berperilaku sama meski tanpa provider.
 */
const BasePathContext = createContext("/v1");

export function BasePathProvider({ base, children }: { base: string; children: React.ReactNode }) {
  return <BasePathContext.Provider value={base}>{children}</BasePathContext.Provider>;
}

export function useBasePath(): string {
  return useContext(BasePathContext);
}
