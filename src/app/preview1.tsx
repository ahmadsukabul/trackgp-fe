"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "./preview1.css";

const FEATURES = [
  {
    icon: "📍",
    title: "Pelacakan Real-Time",
    desc: "Pantau posisi setiap kendaraan di peta interaktif — lengkap dengan kecepatan, arah, dan status mesin.",
  },
  {
    icon: "🕒",
    title: "Riwayat Perjalanan",
    desc: "Rekam rute, jarak tempuh, dan titik berhenti kendaraan hingga berbulan-bulan untuk audit operasional.",
  },
  {
    icon: "🛡️",
    title: "Geofence & Peringatan",
    desc: "Tetapkan area aman dan dapatkan notifikasi otomatis saat kendaraan keluar jalur.",
  },
  {
    icon: "🚚",
    title: "Manajemen Armada",
    desc: "Kelola GPS, kamera, kendaraan, dan pengemudi dalam satu dashboard multi-bisnis.",
  },
];

const STATS = [
  { label: "Kendaraan Terpantau", value: "120rb+" },
  { label: "Uptime Server", value: "99.9%" },
  { label: "Kota Aktif", value: "60+" },
  { label: "Rating Pengguna", value: "4.9" },
];

export function Preview1() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="p1-root">
      {/* NAV — N5 Floating Pill */}
      <nav className="p1-nav">
        <div className="p1-nav-inner">
          <Link href="/" className="p1-nav-brand">
            <span className="p1-nav-brand-icon">TG</span>
            TrackGPS
          </Link>
          <ul className="p1-nav-links">
            <li><a href="#features">Fitur</a></li>
            <li><a href="#advantages">Keunggulan</a></li>
            <li><a href="#konsultasi">Konsultasi</a></li>
          </ul>
          <div className="p1-nav-actions">
            <Link href="/login" className="p1-btn-ghost">Masuk</Link>
            <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="p1-btn-primary">Hubungi Kami</a>
          </div>
        </div>
      </nav>

      {/* HERO — Stat-Led */}
      <section className="p1-hero">
        <div className="p1-hero-grid" style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
          transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          <div>
            <span className="p1-hero-eyebrow">
              <span className="p1-hero-eyebrow-dot" />
              GPS Tracking & Monitoring
            </span>
            <h1>
              Pantau seluruh armada Anda <span>dari satu tempat</span>
            </h1>
            <p className="p1-hero-desc">
              TrackGPS menyediakan jasa pemasangan GPS di semua jenis kendaraan
              dilengkapi server monitoring real-time. Satu dashboard untuk seluruh
              operasional armada Anda.
            </p>
            <div className="p1-hero-actions">
              <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="p1-btn-primary" style={{ height: 44, padding: "0 28px", fontSize: 14 }}>
                Hubungi Kami →
              </a>
              <a href="#features" className="p1-btn-ghost" style={{ height: 44, padding: "0 28px", fontSize: 14 }}>
                Lihat Fitur
              </a>
            </div>
            <ul className="p1-hero-checks">
              <li>Pemasangan GPS untuk semua jenis kendaraan</li>
              <li>Server monitoring real-time 24/7</li>
              <li>Satu akun kelola beberapa bisnis</li>
            </ul>
          </div>

          {/* Dashboard mockup */}
          <div style={{
            background: "var(--p1-surface)",
            border: "1px solid var(--p1-border)",
            borderRadius: "var(--p1-radius-lg)",
            padding: 24,
            boxShadow: "var(--p1-shadow-lg)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--p1-ink-faint)" }}>Dashboard</p>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--p1-ink)", fontFamily: "var(--p1-font-display)" }}>PT Maju Jaya Logistik</p>
              </div>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "3px 10px", borderRadius: 999,
                background: "oklch(90% 0.06 155)", color: "oklch(45% 0.14 155)",
                fontSize: 11, fontWeight: 600,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "oklch(60% 0.16 155)" }} />
                Live
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {[
                { label: "GPS", value: "48" },
                { label: "Kamera", value: "32" },
                { label: "Kendaraan", value: "25" },
                { label: "Driver", value: "17" },
              ].map((cell) => (
                <div key={cell.label} style={{
                  background: "var(--p1-paper-alt)",
                  borderRadius: "var(--p1-radius-sm)",
                  padding: "12px 10px",
                  textAlign: "center",
                }}>
                  <p style={{ fontSize: 10, color: "var(--p1-ink-faint)", marginBottom: 2 }}>{cell.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: "var(--p1-ink)", fontFamily: "var(--p1-font-display)" }}>{cell.value}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { plate: "B 9012 KJA", status: "Bergerak", speed: "62 km/j", color: "var(--p1-success)" },
                { plate: "L 8844 XY", status: "Parkir", speed: "0 km/j", color: "var(--p1-warning)" },
                { plate: "D 7733 ABC", status: "Offline", speed: "—", color: "var(--p1-ink-faint)" },
              ].map((row) => (
                <div key={row.plate} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "var(--p1-paper-alt)",
                  borderRadius: "var(--p1-radius-sm)",
                  padding: "10px 12px",
                  fontSize: 13,
                }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 500, color: "var(--p1-ink)" }}>{row.plate}</span>
                  <span style={{ color: "var(--p1-ink-faint)" }}>{row.speed}</span>
                  <span style={{ color: row.color, fontWeight: 600, fontSize: 12 }}>{row.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STATS — Stat-Led core */}
      <section className="p1-stats">
        <div className="p1-stats-grid">
          {STATS.map((s) => (
            <div key={s.label} className="p1-stat-cell">
              <p className="p1-stat-value">{s.value}</p>
              <p className="p1-stat-label">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="p1-features">
        <div className="p1-features-inner">
          <div className="p1-section-header">
            <p className="p1-section-tag">Fitur</p>
            <h2 className="p1-section-title">Semua yang armada Anda butuhkan</h2>
            <p className="p1-section-desc">
              Dirancang untuk operator logistik, rental, dan distribusi yang butuh
              visibilitas penuh atas pergerakan kendaraannya.
            </p>
          </div>
          <div className="p1-features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="p1-feature-card">
                <div className="p1-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ADVANTAGES */}
      <section id="advantages" className="p1-advantages">
        <div className="p1-section-header" style={{ marginBottom: 32 }}>
          <p className="p1-section-tag">Keunggulan</p>
          <h2 className="p1-section-title">Dibangun untuk tim yang tumbuh</h2>
          <p className="p1-section-desc">
            Mulai dari satu armada kecil sampai ratusan unit di banyak kota.
          </p>
        </div>
        <div className="p1-advantages-grid">
          {[
            { icon: "👥", title: "Multi-bisnis & Multi-peran", desc: "Satu akun bisa jadi Owner di satu bisnis dan Staff di bisnis lain, masing-masing dengan menu yang berbeda." },
            { icon: "🔐", title: "Aman oleh Design", desc: "Semua endpoint bertoken JWT dan divalidasi terhadap bisnis aktif, jadi data antar-tenant tidak bisa saling lihat." },
            { icon: "📷", title: "Perangkat Terhubung", desc: "Kamera dipilih dan dikaitkan ke GPS induk, sehingga detail kendaraan menampilkan seluruh perangkat sekaligus." },
          ].map((item) => (
            <div key={item.title} className="p1-adv-card">
              <div className="p1-adv-icon">{item.icon}</div>
              <div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* KONSULTASI */}
      <section id="konsultasi" className="p1-consult">
        <div className="p1-consult-inner">
          <div className="p1-section-header">
            <p className="p1-section-tag">KONSULTASI</p>
            <h2 className="p1-section-title">Butuh rekomendasi untuk armada Anda?</h2>
            <p style={{ marginTop: 8, fontSize: 14, color: "var(--p1-ink-muted)", maxWidth: 480, lineHeight: 1.65 }}>
              Tim kami bantu pilih perangkat GPS yang tepat, skema pemasangan, dan konfigurasi server sesuai kebutuhan bisnis Anda.
            </p>
          </div>

          <div className="p1-consult-grid">
            {[
              { icon: "🛰️", title: "Pemilihan Perangkat", desc: "Konsultasi tipe GPS yang cocok untuk jenis kendaraan dan operasional Anda." },
              { icon: "📐", title: "Rencana Pemasangan", desc: "Tim teknisi merencanakan lokasi dan metode pemasangan tanpa ganggu operasional." },
              { icon: "🖥️", title: "Konfigurasi Server", desc: "Setup dashboard, geofence, alert, dan hak akses sesuai kebutuhan tim Anda." },
              { icon: "💰", title: "Estimasi Biaya", desc: "Transparansi biaya perangkat, pemasangan, dan langganan server bulanan." },
            ].map((item) => (
              <div key={item.title} className="p1-consult-card">
                <div className="p1-consult-icon">{item.icon}</div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p1-consult-cta">
            <a href="https://wa.me/6281234567890?text=Halo%2C%20saya%20ingin%20konsultasi%20GPS%20tracking%20untuk%20armada%20saya." target="_blank" rel="noopener noreferrer" className="p1-btn-primary" style={{ height: 42, padding: "0 24px", fontSize: 13 }}>
              Konsultasi Gratis via WhatsApp →
            </a>
            <span style={{ fontSize: 12, color: "var(--p1-ink-faint)" }}>Respon dalam 1×24 jam</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="p1-cta">
        <div className="p1-cta-inner">
          <h2>Siap memantau armada Anda?</h2>
          <p>
            Pasang GPS di kendaraan Anda, hubungkan ke server monitoring kami,
            dan lihat armada bergerak dalam hitungan menit.
          </p>
          <div className="p1-cta-actions">
            <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="p1-btn-primary">Hubungi Kami</a>
            <a href="#features" className="p1-btn-ghost">Pelajari Fitur</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="p1-footer">
        <div className="p1-footer-inner">
          {/* Top row */}
          <div className="p1-footer-cols">
            {/* Brand */}
            <div className="p1-footer-brand-col">
              <div className="p1-footer-brand">
                <span className="p1-footer-brand-icon">TG</span>
                <span className="p1-footer-brand-name">TrackGPS</span>
              </div>
              <p className="p1-footer-desc">
                Penyedia jasa pemasangan GPS tracking dan server monitoring real-time untuk semua jenis kendaraan.
              </p>
            </div>

            {/* Product */}
            <div className="p1-footer-col">
              <p className="p1-footer-heading">Produk</p>
              <ul className="p1-footer-list">
                <li><a href="#features" className="p1-footer-link">Fitur</a></li>
                <li><a href="#advantages" className="p1-footer-link">Keunggulan</a></li>
                <li><a href="#konsultasi" className="p1-footer-link">Konsultasi</a></li>
                <li><Link href="/login" className="p1-footer-link">Dashboard</Link></li>
              </ul>
            </div>

            {/* Services */}
            <div className="p1-footer-col">
              <p className="p1-footer-heading">Layanan</p>
              <ul className="p1-footer-list">
                <li><span className="p1-footer-link">Pemasangan GPS</span></li>
                <li><span className="p1-footer-link">Server Monitoring</span></li>
                <li><span className="p1-footer-link">Kamera Kendaraan</span></li>
                <li><span className="p1-footer-link">Geofence & Alert</span></li>
              </ul>
            </div>

            {/* Company */}
            <div className="p1-footer-col">
              <p className="p1-footer-heading">Perusahaan</p>
              <ul className="p1-footer-list">
                <li><span className="p1-footer-link">Tentang Kami</span></li>
                <li><span className="p1-footer-link">Kontak</span></li>
                <li><span className="p1-footer-link">Blog</span></li>
                <li><span className="p1-footer-link">Karir</span></li>
              </ul>
            </div>

            {/* Legal */}
            <div className="p1-footer-col">
              <p className="p1-footer-heading">Legal</p>
              <ul className="p1-footer-list">
                <li><span className="p1-footer-link">Kebijakan Privasi</span></li>
                <li><span className="p1-footer-link">Syarat & Ketentuan</span></li>
                <li><span className="p1-footer-link">Kebijakan Cookie</span></li>
              </ul>
            </div>
          </div>

          {/* Bottom row */}
          <div className="p1-footer-bottom">
            <span className="p1-footer-copy">© {new Date().getFullYear()} TrackGPS. Hak cipta dilindungi.</span>
            <div className="p1-footer-links">
              <a href="#features">Fitur</a>
              <a href="#advantages">Keunggulan</a>
              <a href="#konsultasi">Konsultasi</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
