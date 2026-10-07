"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserCog, MapPin, Users, Video, Settings, LogOut, ChevronRight, Building2, Globe } from "lucide-react";
import { useBusiness } from "../../../v1/lib/BusinessContext";
import { MENU } from "../../../v1/lib/menu";
import { clearAuthData } from "../../../v1/lib/api";
import { InstallButton } from "../../_shell/install-banner";

export default function MobileAkunPage() {
  const router = useRouter();
  const { can, activeBusiness, activeRole } = useBusiness();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    setName(localStorage.getItem("user_name") || "User");
    setEmail(localStorage.getItem("user_email") || "");
  }, []);

  function handleLogout() {
    clearAuthData();
    router.replace("/mobile/login");
  }

  const links = [
    { href: "/mobile/driver", label: "Supir", icon: UserCog, menu: MENU.driver },
    { href: "/mobile/geofence", label: "Geofence", icon: MapPin, menu: MENU.geofence },
    { href: "/mobile/team", label: "Tim & Role", icon: Users, menu: MENU.team },
    { href: "/mobile/camera", label: "Kamera", icon: Video, menu: MENU.camera },
    { href: "/mobile/pengaturan", label: "Profil Bisnis", icon: Settings, menu: MENU.bisnis },
  ].filter((l) => can(l.menu));

  return (
    <>
      <div className="m-card m-card-pad m-row" style={{ gap: 14 }}>
        <span
          className="flex items-center justify-center shrink-0"
          style={{ width: 52, height: 52, background: "var(--v1-ink)", color: "#fff", fontSize: 20, fontWeight: 700 }}
        >
          {(name || "U").charAt(0).toUpperCase()}
        </span>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 16, fontWeight: 700 }}>{name}</p>
          <p className="m-faint" style={{ fontSize: 12 }}>{email || "-"}</p>
        </div>
      </div>

      <div className="m-card m-card-pad m-row" style={{ gap: 10 }}>
        <Building2 className="w-4 h-4" style={{ color: "var(--v1-accent)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600 }}>{activeBusiness?.name || "Bisnis aktif"}</p>
          <p className="m-faint" style={{ fontSize: 11 }}>Peran: {activeRole || "-"}</p>
        </div>
      </div>

      <InstallButton />

      {links.length > 0 && (
        <div className="m-card">
          <div className="m-list">
            {links.map((l) => {
              const Icon = l.icon;
              return (
                <Link key={l.href} href={l.href} className="m-list-item">
                  <Icon className="w-[18px] h-[18px]" style={{ color: "var(--v1-ink-muted)" }} />
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{l.label}</span>
                  <ChevronRight className="w-4 h-4" style={{ color: "var(--v1-ink-faint)" }} />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="m-card">
        <div className="m-list">
          <Link href="/" className="m-list-item">
            <Globe className="w-[18px] h-[18px]" style={{ color: "var(--v1-ink-muted)" }} />
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>Halaman utama</span>
            <ChevronRight className="w-4 h-4" style={{ color: "var(--v1-ink-faint)" }} />
          </Link>
          <button
            type="button"
            className="m-list-item"
            style={{ width: "100%", background: "none", border: "none", textAlign: "left" }}
            onClick={handleLogout}
          >
            <LogOut className="w-[18px] h-[18px]" style={{ color: "var(--v1-danger)" }} />
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--v1-danger)" }}>Keluar</span>
          </button>
        </div>
      </div>

      <p className="m-faint" style={{ fontSize: 11, textAlign: "center" }}>TrackGPS Mobile</p>
    </>
  );
}
