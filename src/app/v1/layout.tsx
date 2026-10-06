"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radio,
  Video,
  Car,
  UserCog,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
  MapPin,
  ChevronDown,
  ReceiptText,
} from "lucide-react";

import { clearAuthData, getAuthToken } from "./lib/api";
import { BusinessProvider, refreshMe, useBusiness } from "./lib/BusinessContext";
import BusinessSwitcher from "./components/BusinessSwitcher";
import { MENU, type MenuKey } from "./lib/menu";
import "./v1.css";

type SidebarItem = {
  name: string;
  href: string;
  menu: MenuKey;
  icon: React.ComponentType<{ className?: string }>;
};
type SidebarGroup = { title: string; items: SidebarItem[] };

const sidebarGroups: SidebarGroup[] = [
  {
    title: "UTAMA",
    items: [{ name: "Dashboard", href: "/v1", menu: MENU.dashboard, icon: LayoutDashboard }],
  },
  {
    title: "ARMADA",
    items: [
      { name: "GPS", href: "/v1/gps", menu: MENU.gps, icon: Radio },
      { name: "Kamera", href: "/v1/camera", menu: MENU.camera, icon: Video },
      { name: "Kendaraan", href: "/v1/vehicle", menu: MENU.vehicle, icon: Car },
      { name: "Supir", href: "/v1/driver", menu: MENU.driver, icon: UserCog },
    ],
  },
  {
    title: "MANAJEMEN",
    items: [
      { name: "Geofence", href: "/v1/geofence", menu: MENU.geofence, icon: MapPin },
      { name: "Langganan", href: "/v1/invoice", menu: MENU.invoice, icon: ReceiptText },
      { name: "Tim", href: "/v1/team", menu: MENU.team, icon: Users },
      { name: "Pengaturan", href: "/v1/pengaturan", menu: MENU.bisnis, icon: Settings },
    ],
  },
];

export default function V1Layout({ children }: { children: React.ReactNode }) {
  return (
    <BusinessProvider>
      <Shell>{children}</Shell>
    </BusinessProvider>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { loading, can } = useBusiness();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Guard: belum login -> ke /login. Nama/email basi -> tarik ulang dari BE.
  useEffect(() => {
    if (!getAuthToken()) {
      router.replace("/login");
      return;
    }
    setUserName(localStorage.getItem("user_name") || "");
    setUserEmail(localStorage.getItem("user_email") || "");
    if (!localStorage.getItem("user_email")) {
      refreshMe().then((me: { name?: string; email?: string } | null) => {
        if (me) {
          setUserName(me.name || "");
          setUserEmail(me.email || "");
        }
      });
    }
  }, [router]);

  // Ganti bisnis = semua data halaman harus dimuat ulang.
  useEffect(() => {
    function onChange() {
      setMobileOpen(false);
    }
    window.addEventListener("business:changed", onChange);
    return () => window.removeEventListener("business:changed", onChange);
  }, []);

  function handleLogout() {
    clearAuthData();
    window.location.href = "/login";
  }

  const visibleGroups = sidebarGroups
    .map((g) => ({ ...g, items: g.items.filter((it) => can(it.menu)) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="v1-root flex h-screen overflow-hidden">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative flex flex-col h-full z-50 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "w-[72px]" : "w-[260px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{
          background: "var(--v1-surface)",
          borderRight: "1px solid var(--v1-border)",
        }}
      >
        <div
          className="h-[60px] sm:h-[70px] flex items-center justify-between px-4"
          style={{ borderBottom: "1px solid var(--v1-border-subtle)" }}
        >
          <Link href="/v1" className={`flex items-center gap-2.5 ${sidebarCollapsed ? "justify-center w-full" : ""}`}>
            <span
              className="flex items-center justify-center w-8 h-8 rounded-lg text-[12px] font-extrabold shrink-0"
              style={{ background: "var(--v1-accent)", color: "var(--v1-paper)", fontFamily: "var(--v1-font-display)" }}
            >
              TG
            </span>
            {!sidebarCollapsed && (
              <span
                className="text-[17px] font-bold tracking-tight"
                style={{ color: "var(--v1-ink)", fontFamily: "var(--v1-font-display)" }}
              >
                TrackGPS
              </span>
            )}
          </Link>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg transition-colors hidden lg:flex"
            style={{ color: "var(--v1-ink-faint)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {sidebarCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg lg:hidden"
            style={{ color: "var(--v1-ink-faint)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {loading ? (
            <div className="space-y-6 px-2">
              {[1, 2].map((g) => (
                <div key={g}>
                  {!sidebarCollapsed && (
                    <div className="h-2 rounded w-16 mb-3 px-3 animate-pulse" style={{ background: "var(--v1-border)" }} />
                  )}
                  <ul className="space-y-1">
                    {[1, 2, 3].map((i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl animate-pulse"
                      >
                        <div className="w-5 h-5 rounded" style={{ background: "var(--v1-border)" }} />
                        {!sidebarCollapsed && (
                          <div
                            className="h-3 rounded"
                            style={{ width: `${60 + i * 12}px` }}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {visibleGroups.map((group) => (
                <div key={group.title}>
                  {!sidebarCollapsed && (
                    <h3
                      className="text-[10px] font-semibold tracking-wider uppercase mb-2 px-3"
                      style={{ color: "var(--v1-ink-faint)", fontFamily: "var(--v1-font-display)" }}
                    >
                      {group.title}
                    </h3>
                  )}
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            title={sidebarCollapsed ? item.name : undefined}
                            className="group flex items-center rounded-lg transition-all duration-150 relative"
                            style={{
                              padding: sidebarCollapsed ? "8px" : "8px 12px",
                              justifyContent: sidebarCollapsed ? "center" : "flex-start",
                              background: isActive ? "var(--v1-surface-raised)" : "transparent",
                              color: isActive ? "var(--v1-ink)" : "var(--v1-ink-muted)",
                              fontWeight: isActive ? 600 : 500,
                              fontSize: 13,
                            }}
                          >
                            {isActive && (
                              <div
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full"
                                style={{ background: "var(--v1-accent)" }}
                              />
                            )}
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
                                style={{
                                  background: isActive ? "var(--v1-accent)" : "transparent",
                                  color: isActive ? "var(--v1-paper)" : "var(--v1-ink-faint)",
                                }}
                              >
                                <Icon className="w-[16px] h-[16px]" />
                              </div>
                              {!sidebarCollapsed && (
                                <span className="text-[13px] truncate">{item.name}</span>
                              )}
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              {visibleGroups.length === 0 && !sidebarCollapsed && (
                <p className="px-3 text-[12px] leading-relaxed" style={{ color: "var(--v1-ink-faint)" }}>
                  Akun ini belum punya izin menu apa pun di bisnis aktif. Minta owner menambahkan
                  role di menu Tim.
                </p>
              )}
            </div>
          )}
        </nav>

        {!sidebarCollapsed && (
          <div className="p-4" style={{ borderTop: "1px solid var(--v1-border-subtle)" }}>
            <div className="flex items-center gap-3 px-2 min-w-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                style={{
                  background: "var(--v1-accent-light)",
                  color: "var(--v1-accent)",
                  fontFamily: "var(--v1-font-display)",
                }}
              >
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: "var(--v1-ink)" }}>
                  {userName || "User"}
                </p>
                <p className="text-[11px] truncate" style={{ color: "var(--v1-ink-faint)" }}>{userEmail}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header
          className="h-[60px] sm:h-[70px] flex items-center justify-between gap-2 px-3 sm:px-6 z-10"
          style={{
            background: "var(--v1-surface)",
            borderBottom: "1px solid var(--v1-border)",
          }}
        >
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-shrink">
            <button
              className="lg:hidden p-2 rounded-lg flex-shrink-0"
              style={{ color: "var(--v1-ink-muted)" }}
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0 max-w-[200px] sm:max-w-none">
              <BusinessSwitcher />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-1 pr-2 sm:pr-4 py-1 rounded-full ml-1 sm:ml-2 cursor-pointer transition-colors"
                style={{
                  background: "var(--v1-accent)",
                  color: "white",
                }}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border border-white/20 bg-white/10 text-[13px] font-bold">
                  {userName ? userName.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-[13px] font-bold leading-tight max-w-[120px] truncate">
                    {userName || "User"}
                  </p>
                  <p className="text-[10px] text-white/80 leading-tight max-w-[120px] truncate">
                    {userEmail}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-white/70 hidden sm:block" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                  <div
                    className="absolute right-0 top-full mt-2 z-40 py-1 min-w-[180px] rounded-xl shadow-lg"
                    style={{
                      background: "var(--v1-surface)",
                      border: "1px solid var(--v1-border)",
                    }}
                  >
                    <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--v1-border-subtle)" }}>
                      <p className="text-[13px] font-semibold truncate" style={{ color: "var(--v1-ink)" }}>
                        {userName || "User"}
                      </p>
                      <p className="text-[11px] truncate" style={{ color: "var(--v1-ink-faint)" }}>
                        {userEmail}
                      </p>
                    </div>
                    <Link
                      href="/"
                      className="block px-4 py-2.5 text-[13px] font-medium transition-colors"
                      style={{ color: "var(--v1-ink-muted)" }}
                    >
                      Halaman Utama
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors"
                      style={{ color: "var(--v1-danger)" }}
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
