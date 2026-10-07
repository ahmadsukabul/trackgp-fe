"use client";

import { usePathname } from "next/navigation";
import { Download, Share, X } from "lucide-react";
import { useInstallPrompt } from "../lib/pwa";
import { isIOS } from "../lib/mobile-detect";

/**
 * Banner pasang PWA — muncul otomatis sekali di Home.
 *
 * - Android/Chrome: tombol "Pasang" memanggil prompt bawaan.
 * - iOS Safari: tidak ada prompt; tampilkan panduan Bagikan → Tambah ke Layar Utama.
 * - Bisa ditutup permanen (flag localStorage).
 */
export default function InstallBanner() {
  const pathname = usePathname() ?? "";
  const { ready, canPrompt, installed, dismissed, promptInstall, dismiss } = useInstallPrompt();

  // Hanya di Home, setelah state terbaca, belum terpasang & belum ditolak.
  if (pathname !== "/mobile") return null;
  if (!ready || installed || dismissed) return null;
  // Android: perlu prompt tersedia. iOS: selalu bisa (panduan manual).
  if (!canPrompt && !isIOS()) return null;

  return (
    <div className="m-install" role="dialog" aria-label="Pasang aplikasi">
      <span
        className="m-install-btn"
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 8, background: "rgba(255,255,255,0.12)" }}
      >
        {canPrompt ? <Download size={18} /> : <Share size={18} />}
      </span>
      <div className="m-install-text">
        <p className="m-install-title">Pasang TrackGPS</p>
        <p className="m-install-sub">
          {canPrompt
            ? "Buka lebih cepat dari layar utama."
            : "Ketuk Bagikan, lalu “Tambah ke Layar Utama”."}
        </p>
      </div>
      {canPrompt && (
        <button type="button" className="m-install-btn" onClick={() => void promptInstall()}>
          Pasang
        </button>
      )}
      <button type="button" className="m-install-close" aria-label="Tutup" onClick={dismiss}>
        <X size={16} />
      </button>
    </div>
  );
}

/** Tombol/kartu pasang untuk halaman Akun. */
export function InstallButton() {
  const { ready, canPrompt, installed, promptInstall } = useInstallPrompt();

  if (!ready || installed) return null;

  if (canPrompt) {
    return (
      <button
        type="button"
        className="m-btn m-btn-primary m-btn-block"
        onClick={() => void promptInstall()}
      >
        <Download size={16} />
        Pasang aplikasi
      </button>
    );
  }

  if (isIOS()) {
    return (
      <div className="m-card m-card-pad">
        <p className="m-row" style={{ gap: 8, fontWeight: 600, fontSize: 13 }}>
          <Share size={16} /> Pasang di iPhone/iPad
        </p>
        <p className="m-faint" style={{ fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>
          Buka di Safari, ketuk ikon Bagikan, lalu pilih “Tambah ke Layar Utama”.
        </p>
      </div>
    );
  }

  return null;
}
