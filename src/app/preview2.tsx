"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "./preview2.css";

const BENTO_ITEMS = [
  {
    icon: "📍",
    title: "Pelacakan Real-Time",
    desc: "Lihat posisi kendaraan di peta interaktif — kecepatan, arah, dan status mesin secara langsung.",
    stat: null,
    wide: false,
    featured: false,
  },
  {
    icon: "🕒",
    title: "Riwayat Perjalanan",
    desc: "Rekam rute, jarak tempuh, dan titik berhenti kendaraan untuk audit operasional.",
    stat: null,
    wide: true,
    featured: false,
  },
  {
    icon: "🛡️",
    title: "Geofence & Peringatan",
    desc: "Tetapkan area aman. Dapatkan notifikasi otomatis saat kendaraan keluar jalur.",
    stat: null,
    wide: false,
    featured: false,
  },
  {
    icon: "🚚",
    title: "Manajemen Armada",
    desc: "Satu dashboard untuk GPS, kamera, kendaraan, dan pengemudi — multi-bisnis.",
    stat: null,
    wide: false,
    featured: true,
  },
  {
    icon: "⚡",
    title: "Uptime Tinggi",
    desc: "Server monitoring stabil dan selalu aktif.",
    stat: "99.9%",
    wide: false,
    featured: false,
  },
  {
    icon: "🌍",
    title: "Cakupan Luas",
    desc: "Aktif di lebih dari 60 kota di seluruh Indonesia.",
    stat: "60+",
    wide: false,
    featured: false,
  },
];

const STEPS = [
  {
    num: "01",
    title: "Pasang GPS",
    desc: "Tim kami pasang perangkat GPS di kendaraan Anda. Kompatibel dengan semua jenis kendaraan.",
  },
  {
    num: "02",
    title: "Hubungkan ke Server",
    desc: "Perangkat langsung terhubung ke server monitoring real-time kami. Tidak perlu konfigurasi rumit.",
  },
  {
    num: "03",
    title: "Pantau dari Dashboard",
    desc: "Akses semua data kendaraan — posisi, rute, kamera, driver — dari satu tempat.",
  },
];

export function Preview2() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="p2-root">
      {/* NAV — N1b Three-section */}
      <header className="p2-nav">
        <div className="p2-nav-inner">
          <Link href="/" className="p2-nav-brand">
            <span className="p2-nav-brand-icon">TG</span>
            TrackGPS
          </Link>
          <ul className="p2-nav-center">
            <li><a href="#features">Fitur</a></li>
            <li><a href="#how">Cara Kerja</a></li>
            <li><a href="#konsultasi">Konsultasi</a></li>
          </ul>
          <div className="p2-nav-right">
            <Link href="/login" className="p2-btn-ghost">Masuk</Link>
            <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="p2-btn-primary">Hubungi Kami</a>
          </div>
        </div>
      </header>

      {/* HERO — Centered */}
      <section className="p2-hero">
        <div style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
          transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          <span className="p2-hero-eyebrow">
            Jasa Pemasangan GPS & Monitoring
          </span>
          <h1>
            Kendaraan terpantau, <span>armada terkendali</span>
          </h1>
          <p className="p2-hero-desc">
            Kami pasang GPS di kendaraan Anda dan sediakan server monitoring real-time.
            Semua data armada — posisi, rute, kamera — tersedia dari satu dashboard.
          </p>
          <div className="p2-hero-actions">
            <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="p2-btn-primary">Hubungi Kami →</a>
            <a href="#features" className="p2-btn-ghost">Lihat Fitur</a>
          </div>
        </div>
      </section>

      {/* BENTO GRID */}
      <section id="features" className="p2-bento">
        <div className="p2-bento-grid">
          {BENTO_ITEMS.map((item) => (
            <div
              key={item.title}
              className={`p2-bento-card ${item.wide ? "p2-bento-card--wide" : ""} ${item.featured ? "p2-bento-card--featured" : ""}`}
            >
              <div className="p2-bento-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
              {item.stat && (
                <p className="p2-bento-stat">{item.stat}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="p2-how">
        <div className="p2-how-inner">
          <div className="p2-section-header">
            <p className="p2-section-tag">Cara Kerja</p>
            <h2 className="p2-section-title">Tiga langkah mulai dari sekarang</h2>
          </div>
          <div className="p2-how-steps">
            {STEPS.map((step) => (
              <div key={step.num} className="p2-how-step">
                <div className="p2-how-step-num">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KONSULTASI */}
      <section id="konsultasi" className="p2-consult">
        <div className="p2-consult-inner">
          <div className="p2-section-header">
            <p className="p2-section-tag">KONSULTASI</p>
            <h2 className="p2-section-title">Butuh rekomendasi untuk armada Anda?</h2>
            <p style={{ marginTop: 8, fontSize: 14, color: "var(--p2-ink-muted)", maxWidth: 480, lineHeight: 1.65 }}>
              Tim kami bantu pilih perangkat GPS yang tepat, skema pemasangan, dan konfigurasi server sesuai kebutuhan bisnis Anda.
            </p>
          </div>

          <div className="p2-consult-grid">
            {[
              { icon: "🛰️", title: "Pemilihan Perangkat", desc: "Konsultasi tipe GPS yang cocok untuk jenis kendaraan dan operasional Anda." },
              { icon: "📐", title: "Rencana Pemasangan", desc: "Tim teknisi merencanakan lokasi dan metode pemasangan tanpa ganggu operasional." },
              { icon: "🖥️", title: "Konfigurasi Server", desc: "Setup dashboard, geofence, alert, dan hak akses sesuai kebutuhan tim Anda." },
              { icon: "💰", title: "Estimasi Biaya", desc: "Transparansi biaya perangkat, pemasangan, dan langganan server bulanan." },
            ].map((item) => (
              <div key={item.title} className="p2-consult-card">
                <div className="p2-consult-icon">{item.icon}</div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p2-consult-cta">
            <a href="https://wa.me/6281234567890?text=Halo%2C%20saya%20ingin%20konsultasi%20GPS%20tracking%20untuk%20armada%20saya." target="_blank" rel="noopener noreferrer" className="p2-btn-primary" style={{ height: 42, padding: "0 24px", fontSize: 13 }}>
              Konsultasi Gratis via WhatsApp →
            </a>
            <span style={{ fontSize: 12, color: "var(--p2-ink-faint)" }}>Respon dalam 1×24 jam</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="p2-cta">
        <h2>Siap memantau armada Anda?</h2>
        <p>
          Daftar sekarang, pasang GPS di kendaraan Anda, dan mulai pantau
          seluruh armada dari satu dashboard.
        </p>
        <div className="p2-cta-actions">
          <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="p2-btn-primary">Hubungi Kami</a>
          <a href="#features" className="p2-btn-ghost">Pelajari Fitur</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="p2-footer">
        <div className="p2-footer-inner">
          <div className="p2-footer-cols">
            {/* Brand */}
            <div className="p2-footer-brand-col">
              <div className="p2-footer-brand">
                <span className="p2-footer-brand-icon">TG</span>
                <span className="p2-footer-tagline">TrackGPS</span>
              </div>
              <p className="p2-footer-desc">
                Jasa pemasangan GPS tracking dan server monitoring real-time untuk semua jenis kendaraan.
              </p>
            </div>

            {/* Produk */}
            <div className="p2-footer-col">
              <p className="p2-footer-heading">Produk</p>
              <ul className="p2-footer-list">
                <li><a href="#features" className="p2-footer-link">Fitur</a></li>
                <li><a href="#how" className="p2-footer-link">Cara Kerja</a></li>
                <li><a href="#konsultasi" className="p2-footer-link">Konsultasi</a></li>
                <li><Link href="/login" className="p2-footer-link">Dashboard</Link></li>
              </ul>
            </div>

            {/* Layanan */}
            <div className="p2-footer-col">
              <p className="p2-footer-heading">Layanan</p>
              <ul className="p2-footer-list">
                <li><span className="p2-footer-link">Pemasangan GPS</span></li>
                <li><span className="p2-footer-link">Server Monitoring</span></li>
                <li><span className="p2-footer-link">Kamera Kendaraan</span></li>
                <li><span className="p2-footer-link">Geofence & Alert</span></li>
              </ul>
            </div>

            {/* Perusahaan */}
            <div className="p2-footer-col">
              <p className="p2-footer-heading">Perusahaan</p>
              <ul className="p2-footer-list">
                <li><span className="p2-footer-link">Tentang Kami</span></li>
                <li><span className="p2-footer-link">Kontak</span></li>
                <li><span className="p2-footer-link">Blog</span></li>
                <li><span className="p2-footer-link">Karir</span></li>
              </ul>
            </div>

            {/* Legal */}
            <div className="p2-footer-col">
              <p className="p2-footer-heading">Legal</p>
              <ul className="p2-footer-list">
                <li><span className="p2-footer-link">Kebijakan Privasi</span></li>
                <li><span className="p2-footer-link">Syarat & Ketentuan</span></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="p2-footer-bottom">
            <span className="p2-footer-copy">© {new Date().getFullYear()} TrackGPS. Hak cipta dilindungi.</span>
            <div className="p2-footer-links">
              <a href="#features">Fitur</a>
              <a href="#how">Cara Kerja</a>
              <a href="#konsultasi">Konsultasi</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
