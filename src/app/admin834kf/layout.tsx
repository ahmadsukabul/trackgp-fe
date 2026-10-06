"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Car,
  Users,
  UserCog,
  Radio,
  MapPin,
  Route,
  LogOut,
  Menu,
  ChevronLeft,
  Camera,
  ReceiptText,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { getAdminToken, clearAdminToken } from "./lib/api";

type SidebarItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

type SidebarGroup = {
  title: string;
  items: SidebarItem[];
};

const sidebarGroups: SidebarGroup[] = [
  {
    title: "UTAMA",
    items: [{ name: "Dashboard", href: "/admin834kf", icon: LayoutDashboard }],
  },
  {
    title: "MASTER DATA",
    items: [
      { name: "Bisnis", href: "/admin834kf/bisnis", icon: Building2 },
      { name: "Kendaraan", href: "/admin834kf/vehicle", icon: Car },
      { name: "Pengemudi", href: "/admin834kf/driver", icon: UserCog },
      { name: "Pengguna", href: "/admin834kf/user", icon: Users },
    ],
  },
  {
    title: "PERANGKAT",
    items: [
      { name: "GPS", href: "/admin834kf/device", icon: Radio },
      { name: "Kamera", href: "/admin834kf/camera", icon: Camera },
    ],
  },
  {
    title: "PEMANTAUAN",
    items: [
      { name: "Posisi", href: "/admin834kf/positions", icon: MapPin },
      { name: "Geofence", href: "/admin834kf/geofence", icon: Route },
    ],
  },
  {
    title: "KEUANGAN",
    items: [{ name: "Invoice", href: "/admin834kf/invoice", icon: ReceiptText }],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [adminName, setAdminName] = useState("Admin");

  	const isLoginPage = pathname === "/admin834kf/login";

  useEffect(() => {
    if (isLoginPage) return;
    const token = getAdminToken();
    if (!token) {
      router.replace("/admin834kf/login");
      return;
    }
    const name = localStorage.getItem("admin_name");
    if (name) setAdminName(name);
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  function handleLogout() {
    clearAdminToken();
    router.replace("/admin834kf/login");
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0a0a0b] text-gray-900 dark:text-gray-100 overflow-hidden font-sans">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative flex flex-col h-full bg-white dark:bg-[#0f1419] border-r border-gray-200 dark:border-gray-800/60 z-50 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "w-[72px]" : "w-[260px]"
        } ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="h-[60px] sm:h-[70px] flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800/60">
          <Link
            href="/admin834kf"
            className={`flex items-center gap-3 ${sidebarCollapsed ? "justify-center" : ""}`}
          >
            {!sidebarCollapsed && (
              <>
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white">
                  <MapPin className="w-5 h-5" />
                </span>
                <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                  TrackGPS
                </span>
              </>
            )}
          </Link>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors hidden lg:flex"
          >
            {sidebarCollapsed ? (
              <ChevronLeft className="w-4 h-4 rotate-180" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-6">
            {sidebarGroups.map((group, idx) => (
              <div key={idx}>
                {!sidebarCollapsed && (
                  <h3 className="text-[10px] font-semibold text-gray-500 dark:text-gray-500 tracking-wider uppercase mb-2 px-3">
                    {group.title}
                  </h3>
                )}
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive =
                      item.href === "/admin834kf"
                        ? pathname === "/admin834kf"
                        : pathname === item.href ||
                          pathname?.startsWith(item.href + "/");
                    const Icon = item.icon;

                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`group flex items-center gap-3 rounded-lg transition-all duration-150 relative ${
                            sidebarCollapsed ? "px-3 py-2 justify-center" : "px-3 py-2"
                          } ${
                            isActive
                              ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/40 hover:text-gray-900 dark:hover:text-gray-200 font-medium"
                          }`}
                          title={sidebarCollapsed ? item.name : undefined}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-blue-500 rounded-r-full" />
                          )}
                          <div
                            className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
                              isActive
                                ? "bg-blue-500 text-white"
                                : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                            }`}
                          >
                            <Icon className="w-[16px] h-[16px]" strokeWidth={2} />
                          </div>
                          {!sidebarCollapsed && (
                            <span className="text-[13px]">{item.name}</span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800/60">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors w-full"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-[60px] sm:h-[70px] flex items-center justify-between gap-2 px-3 sm:px-6 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800/60 z-10">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
              TrackGPS Admin
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 pl-1 pr-2 sm:pr-4 py-1 bg-[#2964e7] rounded-full text-white cursor-pointer hover:bg-[#2150c5] transition-colors"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border border-white/20 bg-white/10 text-[13px] font-bold">
                  {adminName ? adminName.charAt(0).toUpperCase() : "A"}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-[13px] font-bold leading-tight">{adminName}</p>
                  <p className="text-[10px] text-white/80 leading-tight">Platform Admin</p>
                </div>
              </button>

              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 z-40 bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 min-w-[180px]">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-[13px] font-semibold text-gray-900 dark:text-white">
                        {adminName}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Platform Admin
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
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