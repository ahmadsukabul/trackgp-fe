"use client";

import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import BottomNav from "./bottom-nav";
import PwaRegister from "./pwa-register";
import InstallBanner from "./install-banner";

/**
 * MobileShell — kerangka app mobile.
 *
 * - Home: tanpa app bar; halaman menggambar header (greeting) sendiri.
 * - Sub-halaman: app bar dengan tombol kembali + judul.
 * - Transisi antar halaman halus lewat `.m-fade` yang di-remount per pathname.
 * - Penjagaan sesi ada di MobileGate.
 */

function pageTitle(path: string): string {
  if (path.startsWith("/mobile/gps/")) return "Detail Perangkat";
  if (path === "/mobile/gps") return "Peta Perangkat";
  if (path === "/mobile/vehicle") return "Kendaraan";
  if (path === "/mobile/invoice") return "Langganan";
  if (path === "/mobile/akun") return "Akun";
  if (path === "/mobile/driver") return "Supir";
  if (path === "/mobile/geofence") return "Geofence";
  if (path === "/mobile/team") return "Tim & Role";
  if (path === "/mobile/pengaturan") return "Pengaturan";
  if (path === "/mobile/camera") return "Kamera";
  return "TrackGPS";
}

/** Halaman yang menampilkan app bar (Home & peta penuh tidak). */
function hasAppBar(path: string): boolean {
  if (path === "/mobile") return false;
  if (path === "/mobile/versi1") return false;
  if (path === "/mobile/gps") return false;
  return true;
}

export default function MobileShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const showBar = hasAppBar(pathname);
  const title = pageTitle(pathname);

  return (
    <div className="m-shell">
      {showBar && (
        <header className="m-appbar has-line">
          <button
            type="button"
            className="m-iconbtn"
            aria-label="Kembali"
            onClick={() => (window.history.length > 1 ? router.back() : router.push("/mobile"))}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="m-appbar-title" style={{ flex: "1 1 auto", textAlign: "center" }}>
            {title}
          </h1>
          <span style={{ width: 40, flex: "0 0 auto" }} aria-hidden="true" />
        </header>
      )}

      <main key={pathname} className="m-main m-fade">
        {children}
      </main>

      <BottomNav />
      <InstallBanner />
      <PwaRegister />
    </div>
  );
}
