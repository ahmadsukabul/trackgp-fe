"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authMyBisnis, type MembershipItem } from "./client";
import {
  apiFetchRaw,
  getActiveBusinessId,
  setActiveBusinessId,
  restoreLastActiveBusiness,
  setBusinessIdGetter,
} from "./api";

interface BusinessContextValue {
  businesses: MembershipItem[];
  activeBusinessId: string;
  activeBusiness: MembershipItem | null;
  activeRole: string; // owner | tim
  menuKeys: string[];
  isOwner: boolean;
  switchBusiness: (bisnisId: string) => void;
  can: (menuKey: string) => boolean;
  loading: boolean;
  reload: () => void;
}

const BusinessContext = createContext<BusinessContextValue>({
  businesses: [],
  activeBusinessId: "",
  activeBusiness: null,
  activeRole: "",
  menuKeys: [],
  isOwner: false,
  switchBusiness: () => {},
  can: () => false,
  loading: true,
  reload: () => {},
});

export function useBusiness() {
  return useContext(BusinessContext);
}

/**
 * BusinessProvider memuat daftar bisnis milik user login (POST /client/auth/bisnis),
 * memilih bisnis aktif, dan menyuntiknya ke setiap request lewat header bisnis_id.
 * Menu key yang dikembalikan BE dipakai untuk menyembunyikan sidebar/route yang
 * tidak diizinkan — pengecekan sebenarnya tetap ada di BE (WithPermission).
 */
export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [businesses, setBusinesses] = useState<MembershipItem[]>([]);
  const [activeBusinessId, setActiveBusinessIdState] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authMyBisnis();
      const list: MembershipItem[] =
        res.status === 1 && Array.isArray(res.data) ? res.data : [];
      setBusinesses(list);

      // Prioritas: tersimpan > terakhir dipakai (dari logout) > item pertama.
      const stored = getActiveBusinessId();
      const lastActive = restoreLastActiveBusiness();
      const targetId = stored || lastActive;
      const match = targetId ? list.find((b) => b.bisnis_id === targetId) : null;
      const nextId = match?.bisnis_id ?? list[0]?.bisnis_id ?? "";

      setActiveBusinessIdState(nextId);
      setActiveBusinessId(nextId);
    } catch {
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  useEffect(() => {
    setBusinessIdGetter(() => activeBusinessId);
  }, [activeBusinessId]);

  const switchBusiness = useCallback((bisnisId: string) => {
    setActiveBusinessIdState(bisnisId);
    setActiveBusinessId(bisnisId);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("business:changed", { detail: { bisnisId } }));
    }
  }, []);

  const activeBusiness = businesses.find((b) => b.bisnis_id === activeBusinessId) ?? null;
  const menuKeys = activeBusiness?.menu_keys ?? [];
  const isOwner = activeBusiness?.role === "owner";

  // Owner selalu punya segalanya; tim dibatasi menu_keys dari BE.
  const can = useCallback(
    (menuKey: string) => isOwner || menuKeys.includes(menuKey),
    [isOwner, menuKeys],
  );

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        activeBusinessId,
        activeBusiness,
        activeRole: activeBusiness?.role ?? "",
        menuKeys,
        isOwner,
        switchBusiness,
        can,
        loading,
        reload: fetchBusinesses,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

/**
 * Refresh data user setelah hard reload (localStorage bisa basi/hilang sebagian).
 * Dipakai layout saat email belum ada di localStorage.
 */
export async function refreshMe() {
  const res = await apiFetchRaw("/client/auth/me", {});
  if (res.status !== 1 || !res.data) return null;
  const d = res.data as { user_id?: string; name?: string; email?: string };
  if (typeof window !== "undefined") {
    if (d.user_id) localStorage.setItem("user_id", d.user_id);
    if (d.name) localStorage.setItem("user_name", d.name);
    if (d.email) localStorage.setItem("user_email", d.email);
  }
  return d;
}
