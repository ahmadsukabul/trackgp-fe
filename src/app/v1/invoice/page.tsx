"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import CrudPage, { type Column } from "../components/CrudPage";
import { useBusiness } from "../lib/BusinessContext";
import { MENU } from "../lib/menu";
import { getApiErrorMessage } from "../lib/api";
import { formatDate } from "@/lib/format-date";
import {
  invoiceList,
  invoiceDetail,
  invoiceRequestPayment,
  metodePembayaranList,
  type Invoice,
  type MetodePembayaran,
  type PaymentResult,
} from "../lib/client";

const IDR = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: "Menunggu bayar", bg: "var(--v1-surface-raised)", color: "var(--v1-ink-muted)" },
  paid: { label: "Lunas", bg: "var(--v1-success-bg, #dcfce7)", color: "var(--v1-success, #16a34a)" },
  overdue: { label: "Terlambat", bg: "var(--v1-danger-bg)", color: "var(--v1-danger)" },
  cancelled: { label: "Dibatalkan", bg: "var(--v1-surface-raised)", color: "var(--v1-ink-faint)" },
};

function InvoiceStatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status || "unknown", bg: "var(--v1-surface-raised)", color: "var(--v1-ink-faint)" };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: meta.bg, color: meta.color }}>
      {meta.label}
    </span>
  );
}

function InvoiceContent() {
  const { can } = useBusiness();
  const allowed = can(MENU.invoice);
  const searchParams = useSearchParams();
  const deviceFilter = searchParams.get("device_id") || "";

  const [rows, setRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pembayaran
  const [payFor, setPayFor] = useState<Invoice | null>(null);
  const [metodes, setMetodes] = useState<MetodePembayaran[]>([]);
  const [metodeId, setMetodeId] = useState("");
  const [payResult, setPayResult] = useState<PaymentResult | null>(null);
  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState("");
  const [paidNow, setPaidNow] = useState(false);

  const load = useCallback(async () => {
    if (!allowed) {
      setLoading(false);
      setError("Akun ini tidak punya akses ke menu Langganan.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await invoiceList(deviceFilter ? { device_id: deviceFilter } : {});
    if (res.status === 1 && Array.isArray(res.data)) setRows(res.data);
    else setError(getApiErrorMessage(res, "Gagal memuat invoice."));
    setLoading(false);
  }, [allowed, deviceFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function openPay(inv: Invoice) {
    setPayFor(inv);
    setPayResult(null);
    setPayError("");
    setPaidNow(false);
    setMetodeId("");
    const res = await metodePembayaranList();
    if (res.status === 1 && Array.isArray(res.data)) {
      setMetodes(res.data);
      if (res.data.length > 0) setMetodeId(res.data[0].metode_id);
    } else {
      setPayError(getApiErrorMessage(res, "Gagal memuat metode pembayaran."));
    }
  }

  async function requestPayment() {
    if (!payFor || !metodeId) return;
    setPayBusy(true);
    setPayError("");
    const res = await invoiceRequestPayment(payFor.invoice_id, metodeId);
    setPayBusy(false);
    if (res.status === 1 && res.data) {
      setPayResult(res.data);
      if (res.data.link_pay) window.open(res.data.link_pay, "_blank", "noopener");
    } else {
      setPayError(getApiErrorMessage(res, "Gagal membuat pembayaran."));
    }
  }

  // Poll status invoice tiap 5 dtk selama modal bayar terbuka & belum lunas.
  useEffect(() => {
    if (!payFor || paidNow) return;
    const id = setInterval(async () => {
      const res = await invoiceDetail(payFor.invoice_id);
      if (res.status === 1 && res.data && res.data.status === "paid") {
        setPaidNow(true);
        setPayFor(res.data);
        load();
      }
    }, 5000);
    return () => clearInterval(id);
  }, [payFor, paidNow, load]);

  const columns: Column<Invoice>[] = [
    {
      key: "invoice_id",
      label: "Invoice",
      render: (inv) => (
        <div className="leading-tight">
          <p className="font-semibold font-mono text-[12px]" style={{ color: "var(--v1-ink)" }}>{inv.invoice_id}</p>
          <p className="text-[11px]" style={{ color: "var(--v1-ink-faint)" }}>{inv.kategori === "register" ? "Registrasi" : "Perpanjangan"}</p>
        </div>
      ),
    },
    {
      key: "device",
      label: "Perangkat",
      render: (inv) => (
        <div className="leading-tight">
          <p className="text-[13px]" style={{ color: "var(--v1-ink)" }}>{inv.device?.name || inv.device_id}</p>
          <p className="text-[11px] font-mono" style={{ color: "var(--v1-ink-faint)" }}>{inv.device?.unique_id || ""}</p>
        </div>
      ),
    },
    { key: "months", label: "Durasi", render: (inv) => `${inv.months} bulan` },
    { key: "amount", label: "Nominal", render: (inv) => IDR.format(inv.total_transfer || inv.amount) },
    { key: "status", label: "Status", render: (inv) => <InvoiceStatusBadge status={inv.status} /> },
    {
      key: "due_date",
      label: "Jatuh tempo",
      render: (inv) => <span style={{ color: "var(--v1-ink-faint)" }}>{inv.due_date ? formatDate(inv.due_date) : "-"}</span>,
    },
  ];

  return (
    <>
      <CrudPage<Invoice>
        title="Langganan & Invoice"
        description={
          deviceFilter
            ? "Invoice untuk perangkat terpilih. Bayar untuk memperpanjang masa aktif."
            : "Daftar tagihan langganan perangkat. Bayar untuk memperpanjang masa aktif."
        }
        columns={columns}
        rows={rows}
        loading={loading}
        error={allowed ? error : ""}
        searchPlaceholder="Cari invoice..."
        canAdd={false}
        rowKey={(inv) => inv.invoice_id}
        onRefresh={load}
        extraActions={(inv) =>
          inv.status === "pending" || inv.status === "overdue" ? (
            <button
              onClick={() => openPay(inv)}
              className="px-2.5 py-1.5 text-[12px] font-semibold rounded-lg transition-colors"
              style={{ color: "var(--v1-accent)" }}
            >
              Bayar
            </button>
          ) : (
            <button
              onClick={() => openPay(inv)}
              className="px-2.5 py-1.5 text-[12px] font-semibold rounded-lg transition-colors"
              style={{ color: "var(--v1-ink-muted)" }}
            >
              Detail
            </button>
          )
        }
      />

      {payFor && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPayFor(null)} />
          <div className="relative w-full max-w-md rounded-2xl shadow-xl overflow-hidden" style={{ background: "var(--v1-surface)", border: "1px solid var(--v1-border)" }}>
            <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--v1-border-subtle)" }}>
              <h2 className="text-[16px] font-bold" style={{ color: "var(--v1-ink)" }}>
                {paidNow || payFor.status === "paid" ? "Pembayaran Lunas" : "Bayar Invoice"}
              </h2>
              <p className="mt-0.5 text-[12px] font-mono" style={{ color: "var(--v1-ink-faint)" }}>{payFor.invoice_id}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px]" style={{ color: "var(--v1-ink-faint)" }}>Nominal</span>
                <span className="text-[15px] font-bold" style={{ color: "var(--v1-ink)" }}>{IDR.format(payResult?.total_bayar ?? payFor.total_transfer ?? payFor.amount)}</span>
              </div>

              {paidNow || payFor.status === "paid" ? (
                <div className="px-4 py-3 rounded-xl text-[13px] font-medium" style={{ background: "var(--v1-success-bg, #dcfce7)", color: "var(--v1-success, #16a34a)" }}>
                  Pembayaran berhasil diterima. Masa aktif perangkat sudah diperpanjang.
                </div>
              ) : payResult ? (
                <div className="space-y-3">
                  {payResult.qr_link && (
                    <div className="flex flex-col items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={payResult.qr_link} alt="QR pembayaran" className="w-52 h-52 object-contain rounded-xl" style={{ border: "1px solid var(--v1-border)" }} />
                      <p className="text-[12px]" style={{ color: "var(--v1-ink-faint)" }}>Scan QR untuk membayar</p>
                    </div>
                  )}
                  {payResult.nomor_va && (
                    <div className="px-4 py-3 rounded-xl" style={{ background: "var(--v1-surface-raised)" }}>
                      <p className="text-[11px]" style={{ color: "var(--v1-ink-faint)" }}>Nomor Virtual Account</p>
                      <p className="text-[15px] font-bold font-mono tracking-wide" style={{ color: "var(--v1-ink)" }}>{payResult.nomor_va}</p>
                    </div>
                  )}
                  {payResult.link_pay && (
                    <a href={payResult.link_pay} target="_blank" rel="noopener noreferrer" className="block text-center px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white" style={{ background: "var(--v1-accent)" }}>
                      Buka halaman pembayaran
                    </a>
                  )}
                  <p className="text-[12px] text-center" style={{ color: "var(--v1-ink-faint)" }}>
                    Menunggu pembayaran... status diperbarui otomatis.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "var(--v1-ink-muted)" }}>Metode pembayaran</label>
                    <select
                      value={metodeId}
                      onChange={(e) => setMetodeId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-[13px] focus:outline-none"
                      style={{ color: "var(--v1-ink)", background: "var(--v1-surface-raised)", border: "1px solid var(--v1-border)" }}
                    >
                      {metodes.map((m) => (
                        <option key={m.metode_id} value={m.metode_id}>
                          {m.label} ({m.kategori})
                        </option>
                      ))}
                    </select>
                  </div>
                  {payError && (
                    <div className="px-4 py-3 rounded-xl text-[13px]" style={{ background: "var(--v1-danger-bg)", border: "1px solid var(--v1-danger-border)", color: "var(--v1-danger)" }}>
                      {payError}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 px-6 py-4" style={{ borderTop: "1px solid var(--v1-border-subtle)" }}>
              <button onClick={() => setPayFor(null)} className="px-4 py-2 text-[13px] font-semibold rounded-xl" style={{ color: "var(--v1-ink-muted)", border: "1px solid var(--v1-border)" }}>
                Tutup
              </button>
              {!paidNow && payFor.status !== "paid" && !payResult && (
                <button
                  onClick={requestPayment}
                  disabled={payBusy || !metodeId}
                  className="px-4 py-2 text-[13px] font-semibold text-white rounded-xl disabled:opacity-50"
                  style={{ background: "var(--v1-accent)" }}
                >
                  {payBusy ? "Memproses..." : "Bayar sekarang"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={null}>
      <InvoiceContent />
    </Suspense>
  );
}
