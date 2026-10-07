"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch, getApiErrorMessage } from "./lib/api";
import { useAutoRefresh } from "./lib/use-auto-refresh";
import AutoRefreshBadge from "./components/auto-refresh-badge";
import { formatDate } from "@/lib/format-date";
import {
  Building2,
  Car,
  Radio,
  Users,
  UserCog,
  Camera,
  Activity,
  Shield,
  Banknote,
  ReceiptText,
  RefreshCw,
  ChevronRight,
} from "lucide-react";

type RevenuePoint = { date: string; amount: number };
type ExpirySummary = { active: number; soon: number; grace: number; blocked: number; unset: number };
type InvoiceRow = {
  invoice_id: string;
  bisnis_id: string;
  device_id: string;
  status: string;
  amount: number;
  months: number;
  created_at: string;
  device?: { device_id: string; name: string; unique_id: string } | null;
  bisnis?: { bisnis_id: string; name: string } | null;
};
type DashboardStats = {
  total_bisnis: number;
  bisnis_aktif: number;
  bisnis_nonaktif: number;
  total_devices: number;
  device_online: number;
  device_offline: number;
  device_pending: number;
  device_unassigned: number;
  device_billable: number;
  total_vehicles: number;
  total_users: number;
  total_drivers: number;
  total_cameras: number;
  events_today: number;
  expiry: ExpirySummary;
  invoice_pending: number;
  invoice_paid: number;
  invoice_overdue: number;
  invoice_cancelled: number;
  revenue_today: number;
  revenue_month: number;
  revenue_total: number;
  revenue_series: RevenuePoint[];
  recent_invoices: InvoiceRow[];
};

const IDR = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const REFRESH_MS = 30000;

const INVOICE_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Menunggu", cls: "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400" },
  paid: { label: "Lunas", cls: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400" },
  overdue: { label: "Terlambat", cls: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400" },
  cancelled: { label: "Batal", cls: "bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400" },
};

function InvoiceBadge({ status }: { status: string }) {
  const meta = INVOICE_STATUS[status] ?? { label: status, cls: "bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

function dayLabel(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", { weekday: "short" });
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "cyan" | "purple" | "yellow";
}) {
  const colorMap = {
    blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20",
    green: "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-500/20",
    cyan: "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-500/20",
    purple: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-500/20",
    yellow: "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-500/20",
  };
  return (
    <div className="bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-gray-700/50 rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">{value}</p>
          {subtitle && <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-gray-700/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function BarRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[13px] text-gray-600 dark:text-gray-300">{label}</span>
        <span className="text-[13px] font-semibold text-gray-900 dark:text-white tabular-nums">
          {value} <span className="text-[11px] font-normal text-gray-400">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700/60 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function RevenueChart({ series }: { series: RevenuePoint[] }) {
  const max = Math.max(1, ...series.map((p) => p.amount));
  return (
    <div className="flex items-end justify-between gap-2 h-44">
      {series.map((p) => {
        const h = Math.max(2, Math.round((p.amount / max) * 100));
        return (
          <div key={p.date} className="flex-1 flex flex-col items-center justify-end gap-1.5 min-w-0" title={`${formatDate(p.date)} · ${IDR.format(p.amount)}`}>
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 tabular-nums truncate max-w-full">
              {p.amount > 0 ? IDR.format(p.amount).replace("Rp", "").trim() : ""}
            </span>
            <div
              className={`w-full rounded-t-md ${p.amount > 0 ? "bg-blue-500 dark:bg-blue-400" : "bg-gray-200 dark:bg-gray-700"}`}
              style={{ height: `${h}%` }}
            />
            <span className="text-[11px] text-gray-400">{dayLabel(p.date)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setError(null);
    const res = await adminFetch<DashboardStats>("/dashboard/stats");
    if (res.status === 1 && res.data) {
      setStats(res.data);
    } else {
      setError(getApiErrorMessage(res, "Gagal memuat statistik"));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const { enabled, setEnabled, lastAt } = useAutoRefresh({
    onRefresh: loadStats,
    intervalMs: REFRESH_MS,
  });

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

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Gagal Memuat Data</h3>
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
  const expiryTotal = s.expiry.active + s.expiry.soon + s.expiry.grace + s.expiry.blocked + s.expiry.unset;
  const invoiceTotal = s.invoice_pending + s.invoice_paid + s.invoice_overdue + s.invoice_cancelled;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ringkasan platform GPS tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <AutoRefreshBadge enabled={enabled} onToggle={setEnabled} lastAt={lastAt} intervalMs={REFRESH_MS} />
          <button
            onClick={loadStats}
            className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {error && stats && (
        <div className="px-3 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-[13px] text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pendapatan Bulan Ini"
          value={IDR.format(s.revenue_month)}
          subtitle={`Hari ini ${IDR.format(s.revenue_today)}`}
          icon={<Banknote className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="green"
        />
        <StatCard
          title="Total GPS"
          value={s.total_devices}
          subtitle={`${s.device_online} online · ${s.device_offline} offline`}
          icon={<Radio className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="cyan"
        />
        <StatCard
          title="Bisnis Aktif"
          value={s.bisnis_aktif}
          subtitle={`${s.total_bisnis} total tenant`}
          icon={<Building2 className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="blue"
        />
        <StatCard
          title="Invoice Menunggu"
          value={s.invoice_pending + s.invoice_overdue}
          subtitle={`${s.invoice_overdue} terlambat`}
          icon={<ReceiptText className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="yellow"
        />
      </div>

      {/* Pendapatan + Status GPS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section
          title="Pendapatan 7 Hari Terakhir"
          action={<span className="text-[12px] text-gray-400">Total {IDR.format(s.revenue_total)}</span>}
        >
          {s.revenue_series.length > 0 ? (
            <RevenueChart series={s.revenue_series} />
          ) : (
            <p className="text-[13px] text-gray-400 py-8 text-center">Belum ada data pendapatan</p>
          )}
        </Section>

        <Section title="Status GPS">
          <div className="space-y-4">
            <BarRow label="Online" value={s.device_online} total={s.total_devices} color="bg-green-500" />
            <BarRow label="Offline" value={s.device_offline} total={s.total_devices} color="bg-gray-400" />
            <BarRow label="Menunggu approve" value={s.device_pending} total={s.total_devices} color="bg-yellow-500" />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50 grid grid-cols-2 gap-3 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Sudah berharga</span>
              <span className="font-semibold text-gray-900 dark:text-white">{s.device_billable}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Belum di-assign</span>
              <span className="font-semibold text-gray-900 dark:text-white">{s.device_unassigned}</span>
            </div>
          </div>
        </Section>
      </div>

      {/* Langganan + Invoice */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Masa Aktif Langganan">
          <div className="space-y-4">
            <BarRow label="Aktif (> 3 hari)" value={s.expiry.active} total={expiryTotal} color="bg-green-500" />
            <BarRow label="Segera berakhir (≤ 3 hari)" value={s.expiry.soon} total={expiryTotal} color="bg-yellow-500" />
            <BarRow label="Masa tenggang" value={s.expiry.grace} total={expiryTotal} color="bg-orange-500" />
            <BarRow label="Berakhir (dihentikan)" value={s.expiry.blocked} total={expiryTotal} color="bg-red-500" />
            <BarRow label="Belum diatur" value={s.expiry.unset} total={expiryTotal} color="bg-gray-400" />
          </div>
        </Section>

        <Section
          title="Ringkasan Invoice"
          action={
            <Link href="/admin834kf/invoice" className="inline-flex items-center text-[12px] font-medium text-blue-600 dark:text-blue-400 hover:underline">
              Lihat semua <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Menunggu", value: s.invoice_pending, cls: "text-yellow-600 dark:text-yellow-400" },
              { label: "Lunas", value: s.invoice_paid, cls: "text-green-600 dark:text-green-400" },
              { label: "Terlambat", value: s.invoice_overdue, cls: "text-red-600 dark:text-red-400" },
              { label: "Dibatalkan", value: s.invoice_cancelled, cls: "text-gray-500 dark:text-gray-400" },
            ].map((it) => (
              <div key={it.label} className="rounded-lg border border-gray-100 dark:border-gray-700/50 p-3">
                <p className="text-[12px] text-gray-500 dark:text-gray-400">{it.label}</p>
                <p className={`text-xl font-bold tabular-nums ${it.cls}`}>{it.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between text-[13px]">
            <span className="text-gray-500 dark:text-gray-400">Total pendapatan</span>
            <span className="font-semibold text-gray-900 dark:text-white tabular-nums">{IDR.format(s.revenue_total)}</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">dari {invoiceTotal} invoice</p>
        </Section>
      </div>

      {/* Invoice terbaru */}
      <Section
        title="Invoice Terbaru"
        action={
          <Link href="/admin834kf/invoice" className="inline-flex items-center text-[12px] font-medium text-blue-600 dark:text-blue-400 hover:underline">
            Kelola <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        {s.recent_invoices.length === 0 ? (
          <p className="text-[13px] text-gray-400 py-6 text-center">Belum ada invoice</p>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-gray-700/50">
                  <th className="px-5 py-2 font-medium">Invoice</th>
                  <th className="px-3 py-2 font-medium">Bisnis</th>
                  <th className="px-3 py-2 font-medium">Perangkat</th>
                  <th className="px-3 py-2 font-medium text-right">Nominal</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium text-right">Dibuat</th>
                </tr>
              </thead>
              <tbody>
                {s.recent_invoices.map((inv) => (
                  <tr key={inv.invoice_id} className="border-b border-gray-50 dark:border-gray-800/60 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-5 py-2.5">
                      <span className="text-[12px] font-mono text-gray-700 dark:text-gray-300">{inv.invoice_id}</span>
                    </td>
                    <td className="px-3 py-2.5 text-[13px] text-gray-700 dark:text-gray-300">{inv.bisnis?.name || inv.bisnis_id}</td>
                    <td className="px-3 py-2.5 text-[13px] text-gray-700 dark:text-gray-300">{inv.device?.name || inv.device_id}</td>
                    <td className="px-3 py-2.5 text-[13px] text-right tabular-nums text-gray-900 dark:text-white">{IDR.format(inv.amount)}</td>
                    <td className="px-3 py-2.5"><InvoiceBadge status={inv.status} /></td>
                    <td className="px-5 py-2.5 text-[12px] text-right text-gray-400">{inv.created_at ? formatDate(inv.created_at) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Ringkasan platform */}
      <Section title="Ringkasan Platform">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Bisnis", value: s.total_bisnis, icon: <Building2 className="w-4 h-4" /> },
            { label: "Kendaraan", value: s.total_vehicles, icon: <Car className="w-4 h-4" /> },
            { label: "Pengguna", value: s.total_users, icon: <Users className="w-4 h-4" /> },
            { label: "Pengemudi", value: s.total_drivers, icon: <UserCog className="w-4 h-4" /> },
            { label: "Kamera", value: s.total_cameras, icon: <Camera className="w-4 h-4" /> },
            { label: "Event Hari Ini", value: s.events_today, icon: <Activity className="w-4 h-4" /> },
          ].map((it) => (
            <div key={it.label} className="rounded-lg border border-gray-100 dark:border-gray-700/50 p-3">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                {it.icon}
                <span className="text-[11px] uppercase tracking-wide">{it.label}</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{it.value}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
