"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ReceiptText, RefreshCw, X } from "lucide-react";
import { useBusiness } from "../../../v1/lib/BusinessContext";
import { MENU } from "../../../v1/lib/menu";
import { getApiErrorMessage } from "../../../v1/lib/api";
import {
  invoiceList,
  invoiceDetail,
  invoiceRequestPayment,
  metodePembayaranList,
  type Invoice,
  type MetodePembayaran,
  type PaymentResult,
} from "../../../v1/lib/client";
import { formatDate } from "@/lib/format-date";
import { MSearch, MEmpty } from "../../_ui";

const IDR = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Menunggu bayar", color: "var(--v1-ink-muted)", bg: "var(--v1-surface-raised)" },
  paid: { label: "Lunas", color: "var(--v1-success)", bg: "var(--v1-success-bg)" },
  overdue: { label: "Terlambat", color: "var(--v1-danger)", bg: "var(--v1-danger-bg)" },
  cancelled: { label: "Dibatalkan", color: "var(--v1-ink-faint)", bg: "var(--v1-surface-raised)" },
};

function nominal(inv: Pick<Invoice, "total_transfer" | "amount">): number {
  return inv.total_transfer || inv.amount || 0;
}

function StatusPill({ status }: { status: string }) {
  const m = STATUS[status] ?? { label: status || "unknown", color: "var(--v1-ink-faint)", bg: "var(--v1-surface-raised)" };
  return (
    <span style={{ padding: "2px 8px", fontSize: 11, fontWeight: 600, color: m.color, background: m.bg }}>{m.label}</span>
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
  const [query, setQuery] = useState("");

  const [payFor, setPayFor] = useState<Invoice | null>(null);
  const [metodes, setMetodes] = useState<MetodePembayaran[]>([]);
  const [metodeId, setMetodeId] = useState("");
  const [payResult, setPayResult] = useState<PaymentResult | null>(null);
  const [payError, setPayError] = useState("");
  const [payBusy, setPayBusy] = useState(false);
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

  const q = query.trim().toLowerCase();
  const filtered = q
    ? rows.filter((inv) => [inv.invoice_id, inv.device?.name, inv.device_id].some((v) => (v || "").toLowerCase().includes(q)))
    : rows;

  return (
    <>
      <MSearch value={query} onChange={setQuery} placeholder="Cari invoice atau perangkat..." />
      {error && <div className="m-error">{error}</div>}

      <div className="m-row-between">
        <span className="m-faint" style={{ fontSize: 12 }}>{filtered.length} invoice</span>
        <button type="button" className="m-iconbtn" aria-label="Muat ulang" onClick={load}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && rows.length === 0 ? (
        <div className="m-list">{[0, 1].map((i) => <div key={i} className="m-list-item"><div className="animate-pulse" style={{ flex: 1, height: 40, background: "var(--v1-border)" }} /></div>)}</div>
      ) : filtered.length === 0 ? (
        <MEmpty text="Belum ada invoice." />
      ) : (
        <div className="m-list">
          {filtered.map((inv) => (
            <div key={inv.invoice_id} className="m-list-item" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
              <div className="m-row-between">
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--v1-font-display)" }}>{inv.invoice_id}</span>
                <StatusPill status={inv.status} />
              </div>
              <div className="m-row-between">
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{inv.device?.name || inv.device_id}</p>
                  <p className="m-faint" style={{ fontSize: 11 }}>
                    {inv.kategori === "register" ? "Registrasi" : "Perpanjangan"} · {inv.months} bulan
                    {inv.due_date ? ` · jatuh tempo ${formatDate(inv.due_date)}` : ""}
                  </p>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{IDR.format(nominal(inv))}</span>
              </div>
              <button
                type="button"
                className="m-btn m-btn-block"
                style={{ minHeight: 38 }}
                onClick={() => openPay(inv)}
              >
                <ReceiptText size={15} />
                {inv.status === "pending" || inv.status === "overdue" ? "Bayar" : "Detail"}
              </button>
            </div>
          ))}
        </div>
      )}

      {payFor && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "flex-end" }}>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)" }} onClick={() => setPayFor(null)} />
          <div
            style={{
              position: "relative",
              width: "100%",
              maxHeight: "88dvh",
              overflowY: "auto",
              background: "var(--v1-surface)",
              borderTop: "1px solid var(--v1-border)",
              paddingBottom: "calc(var(--m-safe-b) + 16px)",
            }}
          >
            <div className="m-row-between" style={{ padding: "16px", borderBottom: "1px solid var(--v1-border-subtle)", position: "sticky", top: 0, background: "var(--v1-surface)" }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700 }}>
                  {paidNow || payFor.status === "paid" ? "Pembayaran Lunas" : "Bayar Invoice"}
                </p>
                <p className="m-faint" style={{ fontSize: 11, fontFamily: "var(--v1-font-display)" }}>{payFor.invoice_id}</p>
              </div>
              <button type="button" className="m-iconbtn" aria-label="Tutup" onClick={() => setPayFor(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="m-card-pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="m-row-between">
                <span className="m-faint" style={{ fontSize: 13 }}>Nominal</span>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{IDR.format(payResult?.total_bayar || nominal(payFor))}</span>
              </div>

              {payError && <div className="m-error">{payError}</div>}

              {paidNow || payFor.status === "paid" ? (
                <div style={{ padding: "12px 14px", fontSize: 13, background: "var(--v1-success-bg)", color: "var(--v1-success)" }}>
                  Pembayaran berhasil diterima. Masa aktif perangkat sudah diperpanjang.
                </div>
              ) : payResult ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {payResult.qr_link && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={payResult.qr_link} alt="QR pembayaran" style={{ width: 200, height: 200, objectFit: "contain", border: "1px solid var(--v1-border)" }} />
                      <p className="m-faint" style={{ fontSize: 12 }}>Scan QR untuk membayar</p>
                    </div>
                  )}
                  {payResult.nomor_va && (
                    <div style={{ padding: "12px 14px", background: "var(--v1-surface-raised)" }}>
                      <p className="m-faint" style={{ fontSize: 11 }}>Nomor Virtual Account</p>
                      <p style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--v1-font-display)" }}>{payResult.nomor_va}</p>
                    </div>
                  )}
                  {payResult.link_pay && (
                    <a href={payResult.link_pay} target="_blank" rel="noopener noreferrer" className="m-btn m-btn-primary m-btn-block">
                      Buka halaman pembayaran
                    </a>
                  )}
                  <p className="m-faint" style={{ fontSize: 12, textAlign: "center" }}>
                    Menunggu pembayaran... status diperbarui otomatis.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="m-label">Metode pembayaran</label>
                    <select
                      className="m-input"
                      value={metodeId}
                      onChange={(e) => setMetodeId(e.target.value)}
                    >
                      {metodes.map((m) => (
                        <option key={m.metode_id} value={m.metode_id}>
                          {m.label} ({m.kategori})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    className="m-btn m-btn-primary m-btn-block"
                    disabled={payBusy || !metodeId}
                    onClick={requestPayment}
                  >
                    {payBusy ? "Memproses..." : "Bayar sekarang"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function MobileInvoicePage() {
  return (
    <Suspense fallback={null}>
      <InvoiceContent />
    </Suspense>
  );
}
