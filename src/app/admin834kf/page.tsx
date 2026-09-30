"use client";

import { useEffect, useState } from "react";
import { adminFetch, getApiErrorMessage } from "./lib/api";
import {
  Building2,
  Car,
  Radio,
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
} from "lucide-react";

type DashboardStats = {
  total_bisnis: number;
  total_devices: number;
  total_vehicles: number;
  total_users: number;
  total_drivers: number;
};

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color: "blue" | "green" | "red" | "purple" | "yellow" | "cyan";
};

function StatCard({ title, value, subtitle, icon, trend, trendValue, color }: StatCardProps) {
  const colorMap = {
    blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20",
    green: "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-500/20",
    red: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20",
    purple: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-500/20",
    yellow: "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-500/20",
    cyan: "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-500/20",
  };

  return (
    <div className="bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-gray-700/50 rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
            {value}
          </p>
          {subtitle && (
            <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-[12px] font-medium ${
              trend === "up" ? "text-green-600 dark:text-green-400" :
              trend === "down" ? "text-red-600 dark:text-red-400" :
              "text-gray-500 dark:text-gray-400"
            }`}>
              {trend === "up" ? <TrendingUp className="w-3 h-3" /> :
               trend === "down" ? <TrendingDown className="w-3 h-3" /> :
               <Activity className="w-3 h-3" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    setError(null);
    const res = await adminFetch<DashboardStats>("/dashboard/stats");
    if (res.status === 1 && res.data) {
      setStats(res.data);
    } else {
      setError(getApiErrorMessage(res, "Gagal memuat statistik"));
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Gagal Memuat Data
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm">{error}</p>
        <button
          onClick={loadStats}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const s = stats!;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Ringkasan statistik platform GPS tracking
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Bisnis"
          value={s.total_bisnis}
          subtitle="Tenant terdaftar"
          icon={<Building2 className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="blue"
        />
        <StatCard
          title="Total Kendaraan"
          value={s.total_vehicles}
          subtitle="Kendaraan terdaftar"
          icon={<Car className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="green"
        />
        <StatCard
          title="Total GPS"
          value={s.total_devices}
          subtitle="Perangkat GPS"
          icon={<Radio className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="cyan"
        />
        <StatCard
          title="Total Pengemudi"
          value={s.total_drivers}
          subtitle={`${s.total_users} pengguna`}
          icon={<Users className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="purple"
        />
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-gray-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Ringkasan Platform
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Bisnis</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {s.total_bisnis}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Perangkat GPS</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {s.total_devices}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Kendaraan</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {s.total_vehicles}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Pengemudi</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {s.total_drivers}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Pengguna</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {s.total_users}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-gray-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Cara Kerja
          </h3>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
            Satu <span className="font-medium text-gray-700 dark:text-gray-200">perangkat GPS</span> dapat
            dipasang pada satu kendaraan, dan perangkat lain seperti kamera menempel pada GPS
            tersebut. Untuk melihat perangkat yang terhubung, buka detail GPS pada menu Perangkat.
          </p>
        </div>
      </div>
    </div>
  );
}
