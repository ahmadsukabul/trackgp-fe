"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import BusinessSwitcher from "../../v1/components/BusinessSwitcher";
import BottomNav from "./bottom-nav";
import PwaRegister from "./pwa-register";
import InstallBanner from "./install-banner";

/**
 * MobileShell — kerangka app mobile: app bar atas (judul + pemilih bisnis),
 * konten scroll, dan bottom nav. Penjagaan sesi ada di MobileGate.
 */

type Meta = { title: string; back?: string };

function pageMeta(path: string): Meta {
  if (path === "/mobile") return { title: "TrackGPS" };
  if (path.startsWith("/mobile/gps/")) return { title: "Detail Perangkat", back: "/mobile/gps" };
  if (path === "/mobile/gps") return { title: "Perangkat GPS" };
  if (path === "/mobile/vehicle") return { title: "Kendaraan" };
  if (path === "/mobile/invoice") return { title: "Langganan" };
  if (path === "/mobile/akun") return { title: "Akun" };
  if (path === "/mobile/driver") return { title: "Supir", back: "/mobile/akun" };
  if (path === "/mobile/geofence") return { title: "Geofence", back: "/mobile/akun" };
  if (path === "/mobile/team") return { title: "Tim & Role", back: "/mobile/akun" };
  if (path === "/mobile/pengaturan") return { title: "Pengaturan", back: "/mobile/akun" };
  if (path === "/mobile/camera") return { title: "Kamera", back: "/mobile/akun" };
  return { title: "TrackGPS" };
}

export default function MobileShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const meta = pageMeta(pathname);

  return (
    <div className="m-shell">
      <header className="m-appbar">
        {meta.back ? (
          <button
            type="button"
            className="m-iconbtn"
            aria-label="Kembali"
            onClick={() => router.push(meta.back as string)}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        ) : (
          <Link
            href="/mobile"
            aria-label="Beranda"
            className="flex items-center justify-center w-[34px] h-[34px] shrink-0 text-[11px] font-extrabold"
            style={{ background: "var(--v1-ink)", color: "#fff" }}
          >
            TG
          </Link>
        )}

        <h1 className="m-appbar-title" style={{ flex: "1 1 auto", minWidth: 0 }}>
          {meta.title}
        </h1>

        <div style={{ flex: "0 1 auto", minWidth: 0 }}>
          <BusinessSwitcher />
        </div>
      </header>

      <main className="m-main">{children}</main>

      <BottomNav />
      <InstallBanner />
      <PwaRegister />
    </div>
  );
}
