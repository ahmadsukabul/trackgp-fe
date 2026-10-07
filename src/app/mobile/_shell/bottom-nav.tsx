"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Radio, Car, ReceiptText, User } from "lucide-react";

/**
 * Bottom navigation mobile — 5 tab utama.
 * Tab "Akun" juga menyorot saat berada di halaman turunannya (Supir, Geofence,
 * Tim, Pengaturan, Kamera) supaya konteks navigasi tetap jelas.
 */

const AKUN_SUB = [
  "/mobile/akun",
  "/mobile/driver",
  "/mobile/geofence",
  "/mobile/team",
  "/mobile/pengaturan",
  "/mobile/camera",
];

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: (path: string) => boolean;
};

const ITEMS: Item[] = [
  { href: "/mobile", label: "Beranda", icon: LayoutDashboard, active: (p) => p === "/mobile" || p === "/mobile/versi1" },
  { href: "/mobile/gps", label: "Perangkat", icon: Radio, active: (p) => p.startsWith("/mobile/gps") },
  { href: "/mobile/vehicle", label: "Kendaraan", icon: Car, active: (p) => p.startsWith("/mobile/vehicle") },
  { href: "/mobile/invoice", label: "Langganan", icon: ReceiptText, active: (p) => p.startsWith("/mobile/invoice") },
  { href: "/mobile/akun", label: "Akun", icon: User, active: (p) => AKUN_SUB.some((s) => p === s || p.startsWith(s + "/")) },
];

export default function BottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="m-nav" aria-label="Navigasi utama">
      {ITEMS.map((it) => {
        const isActive = it.active(pathname);
        const Icon = it.icon;
        return (
          <Link
            key={it.href}
            href={it.href}
            prefetch={false}
            className={`m-nav-item${isActive ? " is-active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="m-nav-ico">
              <Icon className="w-[20px] h-[20px]" />
            </span>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
