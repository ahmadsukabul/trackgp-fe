"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/components/theme-provider";
import "./preview3.css";

const FEATURES = [
  { icon: "📍", title: "Pelacakan Real-Time", desc: "Pantau posisi kendaraan di peta — kecepatan, arah, status mesin secara langsung." },
  { icon: "🕒", title: "Riwayat Perjalanan", desc: "Rekam rute dan titik berhenti kendaraan untuk audit operasional jangka panjang." },
  { icon: "🛡️", title: "Geofence & Peringatan", desc: "Tetapkan area aman, dapatkan notifikasi saat kendaraan keluar jalur." },
  { icon: "📷", title: "Kamera Terhubung", desc: "Kamera dikaitkan ke GPS induk — lihat semua perangkat kendaraan sekaligus." },
  { icon: "👥", title: "Multi-peran & Multi-bisnis", desc: "Satu akun bisa jadi Owner di satu bisnis dan Staff di bisnis lain." },
  { icon: "🔐", title: "Keamanan Data", desc: "Endpoint bertoken JWT, data antar-tenant terisolasi sepenuhnya." },
];

const STATS = [
  { label: "Kendaraan", value: "120rb+" },
  { label: "Uptime", value: "99.9%" },
  { label: "Kota", value: "60+" },
  { label: "Rating", value: "4.9" },
];

const VEHICLES = [
  { plate: "B 9012 KJA", status: "Bergerak", statusClass: "moving", speed: "62 km/j" },
  { plate: "L 8844 XY", status: "Parkir", statusClass: "parked", speed: "0 km/j" },
  { plate: "D 7733 ABC", status: "Offline", statusClass: "offline", speed: "—" },
  { plate: "B 5567 DEF", status: "Bergerak", statusClass: "moving", speed: "48 km/j" },
  { plate: "A 3321 GH", status: "Parkir", statusClass: "parked", speed: "0 km/j" },
];

export function Preview3() {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="p3-root">
      {/* NAV — N9 Edge-aligned */}
      <header className="p3-nav">
        <div className="p3-nav-inner">
          <Link href="/" className="p3-nav-brand">
            <span className="p3-nav-brand-icon">TG</span>
            TrackGPS
          </Link>
          <ul className="p3-nav-links">
            <li><a href="#features">Fitur</a></li>
            <li><a href="#perangkat">Perangkat</a></li>
            <li><a href="#aplikasi">Aplikasi</a></li>
            <li><a href="#advantages">Keunggulan</a></li>
            <li><a href="#konsultasi">Konsultasi</a></li>
          </ul>
          <div className="p3-nav-right">
            <Link href="/login" className="p3-btn-ghost">Masuk</Link>
            <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="p3-btn-primary">Hubungi Kami</a>
          </div>
        </div>
      </header>

      {/* HERO — Workbench: text left, dashboard panel right */}
      <section className="p3-hero">
        <div className="p3-hero-grid" style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
          transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          <div>
            <span className="p3-hero-badge">
              <span className="p3-hero-badge-dot" />
              GPS Tracking Platform
            </span>
            <h1>
              Pemasangan GPS & <span>server monitoring</span> real-time
            </h1>
            <p className="p3-hero-desc">
              Kami pasang perangkat GPS di semua jenis kendaraan Anda dan
              sediakan server monitoring yang selalu aktif. Semua data dari
              satu terminal.
            </p>
            <div className="p3-hero-actions">
              <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="p3-btn-primary">Hubungi Kami →</a>
              <a href="#features" className="p3-btn-ghost">Lihat Fitur</a>
            </div>
            <ul className="p3-hero-checks">
              <li>Pemasangan GPS untuk semua jenis kendaraan</li>
              <li>Server monitoring 24/7</li>
              <li>Dashboard multi-bisnis dengan hak akses per menu</li>
            </ul>
          </div>

          {/* Dashboard panel — terminal feel */}
          <div className="p3-panel">
            <div className="p3-panel-bar">
              <div className="p3-panel-bar-left">
                <span className="p3-panel-bar-dot" />
                <span className="p3-panel-bar-dot" />
                <span className="p3-panel-bar-dot" />
              </div>
              <span className="p3-panel-bar-title">monitoring://trackgp.id</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--p3-success)", fontFamily: "var(--p3-font-display)" }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--p3-success)" }} />
                CONNECTED
              </span>
            </div>
            <div className="p3-panel-body">
              {VEHICLES.map((v) => (
                <div key={v.plate} className="p3-panel-row">
                  <span className="p3-panel-plate">{v.plate}</span>
                  <span className="p3-panel-speed">{v.speed}</span>
                  <span className={`p3-panel-status p3-panel-status--${v.statusClass}`}>
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="p3-stats">
        <div className="p3-stats-bar">
          {STATS.map((s) => (
            <div key={s.label} className="p3-stats-cell">
              <p className="p3-stats-value">{s.value}</p>
              <p className="p3-stats-label">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES — 2-col */}
      <section id="features" className="p3-features">
        <div className="p3-features-inner">
          <div className="p3-section-header">
            <p className="p3-section-tag">// fitur</p>
            <h2 className="p3-section-title">Kontrol penuh atas armada Anda</h2>
          </div>
          <div className="p3-features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="p3-feature-card">
                <div className="p3-feature-icon">{f.icon}</div>
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ADVANTAGES — 3 col */}
      <section id="advantages" className="p3-advantages">
        <div className="p3-section-header" style={{ marginBottom: 24 }}>
          <p className="p3-section-tag">// keunggulan</p>
          <h2 className="p3-section-title">Dirancang untuk pertumbuhan</h2>
        </div>
        <div className="p3-adv-grid">
          {[
            { icon: "⚡", title: "Instalasi Cepat", desc: "Tim teknisi kami pasang GPS di lokasi Anda. Proses cepat, tidak ganggu operasional." },
            { icon: "📊", title: "Laporan Otomatis", desc: "Data perjalanan, konsumsi BBM, dan performa driver tersedia dalam format yang bisa diekspor." },
            { icon: "🌐", title: "Server Stabil", desc: "Infrastruktur monitoring dirancang untuk uptime tinggi — data Anda selalu bisa diakses." },
          ].map((item) => (
            <div key={item.title} className="p3-adv-card">
              <div className="p3-adv-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TRUCK SHOWCASE — annotated diagram */}
      <section id="perangkat" className="p3-truck">
        <div className="p3-truck-inner">
          <div className="p3-section-header" style={{ textAlign: "center", marginBottom: 40 }}>
            <p className="p3-section-tag" style={{ justifyContent: "center" }}>// perangkat kami</p>
            <h2 className="p3-section-title">Semua yang kendaraan Anda butuhkan</h2>
            <p style={{ marginTop: 8, fontSize: 14, color: "var(--p3-ink-muted)", maxWidth: 520, margin: "8px auto 0", lineHeight: 1.65 }}>
              Satu kendaraan, satu perangkat. Terintegrasi penuh — GPS, kamera, audio, dan sensor mesin dalam satu unit.
            </p>
          </div>

          <div className="p3-truck-layout">
            {/* LEFT features */}
            <div className="p3-truck-side p3-truck-side--left">
              <div className="p3-truck-card">
                <div className="p3-truck-card-dot" />
                <h3>Kamera Depan HD</h3>
                <p>Rekam jalur depan kendaraan. Bukti visual saat kejadian penting di jalan.</p>
              </div>
              <div className="p3-truck-card">
                <div className="p3-truck-card-dot" />
                <h3>GPS Tracker</h3>
                <p>Lacak posisi, kecepatan, dan rute kendaraan secara real-time dari mana saja.</p>
              </div>
              <div className="p3-truck-card">
                <div className="p3-truck-card-dot" />
                <h3>Sensor OBD</h3>
                <p>Baca data mesin langsung dari port OBD — RPM, suhu, konsumsi BBM, dan kode error.</p>
              </div>
            </div>

            {/* CENTER truck SVG */}
            <div className="p3-truck-diagram">
              <svg viewBox="0 0 520 280" xmlns="http://www.w3.org/2000/svg" className="p3-truck-svg">
                {/* Subtle grid background */}
                <defs>
                  <pattern id="p3grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--p3-border-subtle)" strokeWidth="0.3" />
                  </pattern>
                  <linearGradient id="p3truckGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--p3-surface-raised)" />
                    <stop offset="100%" stopColor="var(--p3-surface)" />
                  </linearGradient>
                  <linearGradient id="p3cabGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--p3-accent-dim)" />
                    <stop offset="100%" stopColor="oklch(from var(--p3-accent-dim) calc(l * 0.7) c h)" />
                  </linearGradient>
                  <radialGradient id="p3wheelGrad">
                    <stop offset="0%" stopColor="var(--p3-ink-muted)" />
                    <stop offset="60%" stopColor="var(--p3-surface-raised)" />
                    <stop offset="100%" stopColor="var(--p3-surface)" />
                  </radialGradient>
                </defs>
                <rect width="520" height="280" fill="var(--p3-surface)" rx="16" />
                <rect width="520" height="280" fill="url(#p3grid)" rx="16" />

                {/* Ground shadow */}
                <ellipse cx="260" cy="245" rx="190" ry="10" fill="var(--p3-paper)" opacity="0.5" />

                {/* === TRUCK CARGO === */}
                <rect x="100" y="72" width="280" height="128" rx="8" fill="url(#p3truckGrad)" stroke="var(--p3-border)" strokeWidth="1" />
                {/* Cargo detail lines */}
                <line x1="200" y1="72" x2="200" y2="200" stroke="var(--p3-border)" strokeWidth="0.5" />
                <line x1="300" y1="72" x2="300" y2="200" stroke="var(--p3-border)" strokeWidth="0.5" />
                {/* Cargo roof rack */}
                <rect x="108" y="66" width="264" height="6" rx="2" fill="var(--p3-border)" />

                {/* === CAB === */}
                <path d="M 380 90 L 380 200 L 460 200 L 460 118 Q 460 90 432 90 Z" fill="url(#p3cabGrad)" stroke="var(--p3-accent-dim)" strokeWidth="1" />
                {/* Windshield */}
                <path d="M 388 96 L 388 184 L 452 184 L 452 118 Q 452 96 432 96 Z" fill="var(--p3-paper)" opacity="0.06" stroke="var(--p3-border)" strokeWidth="0.5" />
                {/* Headlight */}
                <rect x="456" y="172" width="6" height="16" rx="2" fill="var(--p3-warning)" opacity="0.7" />

                {/* === GPS ANTENNA on roof === */}
                <rect x="220" y="54" width="24" height="14" rx="3" fill="var(--p3-accent)" opacity="0.9" />
                <rect x="229" y="44" width="6" height="12" rx="2" fill="var(--p3-accent-dim)" />
                <circle cx="232" cy="42" r="3" fill="var(--p3-accent)" />

                {/* === SPEAKER (side) === */}
                <rect x="122" y="150" width="16" height="22" rx="4" fill="var(--p3-surface-raised)" stroke="var(--p3-border)" strokeWidth="0.8" />
                <circle cx="130" cy="157" r="3" fill="var(--p3-border)" />
                <circle cx="130" cy="166" r="2" fill="var(--p3-border)" />

                {/* === WHEELS === */}
                <g>
                  <circle cx="165" cy="222" r="24" fill="url(#p3wheelGrad)" stroke="var(--p3-border)" strokeWidth="1" />
                  <circle cx="165" cy="222" r="14" fill="var(--p3-surface)" stroke="var(--p3-border)" strokeWidth="0.5" />
                  <circle cx="165" cy="222" r="5" fill="var(--p3-ink-muted)" />
                </g>
                <g>
                  <circle cx="430" cy="222" r="24" fill="url(#p3wheelGrad)" stroke="var(--p3-border)" strokeWidth="1" />
                  <circle cx="430" cy="222" r="14" fill="var(--p3-surface)" stroke="var(--p3-border)" strokeWidth="0.5" />
                  <circle cx="430" cy="222" r="5" fill="var(--p3-ink-muted)" />
                </g>

                {/* === FUEL CAP === */}
                <circle cx="340" cy="172" r="6" fill="var(--p3-surface)" stroke="var(--p3-border)" strokeWidth="0.8" />
                <circle cx="340" cy="172" r="2.5" fill="var(--p3-border)" />

                {/* === CALLOUT DOTS (pulsing) === */}
                {/* Front Camera */}
                <circle cx="460" cy="140" r="4.5" fill="var(--p3-accent)" className="p3-truck-pulse" />
                <circle cx="460" cy="140" r="4.5" fill="none" stroke="var(--p3-accent)" strokeWidth="1" opacity="0.4" className="p3-truck-ping" />

                {/* GPS Antenna */}
                <circle cx="232" cy="42" r="4.5" fill="var(--p3-accent)" className="p3-truck-pulse" />
                <circle cx="232" cy="42" r="4.5" fill="none" stroke="var(--p3-accent)" strokeWidth="1" opacity="0.4" className="p3-truck-ping" />

                {/* OBD Sensor */}
                <circle cx="420" cy="200" r="4.5" fill="var(--p3-accent)" className="p3-truck-pulse" />
                <circle cx="420" cy="200" r="4.5" fill="none" stroke="var(--p3-accent)" strokeWidth="1" opacity="0.4" className="p3-truck-ping" />

                {/* Fuel */}
                <circle cx="340" cy="172" r="4.5" fill="var(--p3-accent)" className="p3-truck-pulse" />
                <circle cx="340" cy="172" r="4.5" fill="none" stroke="var(--p3-accent)" strokeWidth="1" opacity="0.4" className="p3-truck-ping" />

                {/* Speaker */}
                <circle cx="130" cy="161" r="4.5" fill="var(--p3-accent)" className="p3-truck-pulse" />
                <circle cx="130" cy="161" r="4.5" fill="none" stroke="var(--p3-accent)" strokeWidth="1" opacity="0.4" className="p3-truck-ping" />

                {/* SIM Card */}
                <circle cx="240" cy="136" r="4.5" fill="var(--p3-accent)" className="p3-truck-pulse" />
                <circle cx="240" cy="136" r="4.5" fill="none" stroke="var(--p3-accent)" strokeWidth="1" opacity="0.4" className="p3-truck-ping" />

                {/* === CONNECTOR LINES (left → truck) === */}
                <line x1="50" y1="50" x2="456" y2="140" stroke="var(--p3-accent)" strokeWidth="0.8" strokeDasharray="4 3" opacity="0.3" className="p3-truck-line" style={{ animationDelay: "0.1s" }} />
                <line x1="50" y1="140" x2="228" y2="42" stroke="var(--p3-accent)" strokeWidth="0.8" strokeDasharray="4 3" opacity="0.3" className="p3-truck-line" style={{ animationDelay: "0.3s" }} />
                <line x1="50" y1="230" x2="416" y2="200" stroke="var(--p3-accent)" strokeWidth="0.8" strokeDasharray="4 3" opacity="0.3" className="p3-truck-line" style={{ animationDelay: "0.5s" }} />

                {/* === CONNECTOR LINES (truck → right) === */}
                <line x1="344" y1="172" x2="490" y2="50" stroke="var(--p3-accent)" strokeWidth="0.8" strokeDasharray="4 3" opacity="0.3" className="p3-truck-line" style={{ animationDelay: "0.7s" }} />
                <line x1="134" y1="161" x2="490" y2="140" stroke="var(--p3-accent)" strokeWidth="0.8" strokeDasharray="4 3" opacity="0.3" className="p3-truck-line" style={{ animationDelay: "0.9s" }} />
                <line x1="244" y1="136" x2="490" y2="230" stroke="var(--p3-accent)" strokeWidth="0.8" strokeDasharray="4 3" opacity="0.3" className="p3-truck-line" style={{ animationDelay: "1.1s" }} />
              </svg>
            </div>

            {/* RIGHT features */}
            <div className="p3-truck-side p3-truck-side--right">
              <div className="p3-truck-card">
                <div className="p3-truck-card-dot" />
                <h3>Pantau BBM</h3>
                <p> Sensor tangki bahan bakar untuk mencegah kebocoran dan pencurian BBM.</p>
              </div>
              <div className="p3-truck-card">
                <div className="p3-truck-card-dot" />
                <h3>Audio Dua Arah</h3>
                <p>Speaker & mic terintegrasi. Komunikasi langsung antara admin dan driver.</p>
              </div>
              <div className="p3-truck-card">
                <div className="p3-truck-card-dot" />
                <h3>SIM Card 4G</h3>
                <p>Koneksi data selalu aktif. Perangkat otomatis fallback ke jaringan terbaik.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PHONE SHOWCASE — annotated interface */}
      <section id="aplikasi" className="p3-phone">
        <div className="p3-phone-inner">
          <div className="p3-section-header" style={{ textAlign: "center", marginBottom: 40 }}>
            <p className="p3-section-tag" style={{ justifyContent: "center" }}>// aplikasi mobile</p>
            <h2 className="p3-section-title">Pantau armada dari genggaman Anda</h2>
            <p style={{ marginTop: 8, fontSize: 14, color: "var(--p3-ink-muted)", maxWidth: 520, margin: "8px auto 0", lineHeight: 1.65 }}>
              Semua data kendaraan ada di satu layar — GPS, status, rute, dan peringatan.
            </p>
          </div>

          <div className="p3-phone-stage">
            {/* Phone — viewBox fitted to the body so it is always dead centre */}
            <svg viewBox="-1 -1 192 388" xmlns="http://www.w3.org/2000/svg" className="p3-phone-svg">
              <defs>
                <linearGradient id="p3phoneBody" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--p3-surface-raised)" />
                  <stop offset="100%" stopColor="var(--p3-surface)" />
                </linearGradient>
              </defs>

              {/* === PHONE BODY === */}
              <rect x="0" y="0" width="190" height="386" rx="24" fill="url(#p3phoneBody)" stroke="var(--p3-border)" strokeWidth="1.5" />
              <rect x="57" y="2" width="76" height="16" rx="12" fill="var(--p3-paper)" opacity="0.05" />
              <rect x="6" y="24" width="178" height="350" rx="4" fill="var(--p3-surface)" />

              {/* STATUS BAR */}
              <text x="15" y="18" fontSize="7" fontFamily="var(--p3-font-display)" fill="var(--p3-ink-faint)">9:41</text>
              <rect x="154" y="10" width="14" height="7" rx="2" fill="none" stroke="var(--p3-ink-faint)" strokeWidth="0.8" />
              <rect x="156" y="12" width="9" height="3" rx="1" fill="var(--p3-success)" />

              {/* APP HEADER */}
              <rect x="6" y="24" width="178" height="26" fill="var(--p3-surface)" opacity="0.95" />
              <text x="16" y="41" fontSize="8" fontFamily="var(--p3-font-display)" fill="var(--p3-ink)" fontWeight="700">TrackGPS</text>

              {/* GPS CARD */}
              <rect x="13" y="56" width="164" height="46" rx="7" fill="var(--p3-surface-raised)" stroke="var(--p3-border)" strokeWidth="0.6" />
              <circle cx="25" cy="69" r="5" fill="var(--p3-accent)" opacity="0.2" />
              <circle cx="25" cy="69" r="2.5" fill="var(--p3-accent)" />
              <text x="34" y="73" fontSize="6" fontFamily="var(--p3-font-display)" fill="var(--p3-ink)" fontWeight="600">GPS Aktif</text>
              <rect x="154" y="64" width="18" height="3.5" rx="1.5" fill="var(--p3-success)" opacity="0.6" />
              <text x="17" y="94" fontSize="5" fontFamily="var(--p3-font-display)" fill="var(--p3-ink-muted)">-6.2088° 106.8456°</text>

              {/* VEHICLE CARD */}
              <rect x="13" y="108" width="164" height="40" rx="7" fill="var(--p3-surface-raised)" stroke="var(--p3-border)" strokeWidth="0.6" />
              <rect x="19" y="113" width="20" height="12" rx="3" fill="var(--p3-accent)" opacity="0.15" />
              <text x="24" y="123" fontSize="7" fill="var(--p3-accent)">🚗</text>
              <text x="43" y="120" fontSize="6" fontFamily="var(--p3-font-display)" fill="var(--p3-ink)" fontWeight="600">B 9012 KJA</text>
              <rect x="143" y="113" width="30" height="10" rx="5" fill="var(--p3-success)" opacity="0.15" />
              <text x="148" y="121" fontSize="4.5" fontFamily="var(--p3-font-display)" fill="var(--p3-success)" fontWeight="600">62 km/j</text>
              <text x="17" y="141" fontSize="4.5" fontFamily="var(--p3-font-display)" fill="var(--p3-ink-faint)">Dinas Jakarta → Bandung</text>

              {/* MAP VIEW */}
              <rect x="13" y="156" width="164" height="168" rx="7" fill="var(--p3-surface-raised)" stroke="var(--p3-border)" strokeWidth="0.6" />
              <line x1="31" y1="156" x2="31" y2="324" stroke="var(--p3-border)" strokeWidth="0.2" opacity="0.4" />
              <line x1="51" y1="156" x2="51" y2="324" stroke="var(--p3-border)" strokeWidth="0.2" opacity="0.4" />
              <line x1="73" y1="156" x2="73" y2="324" stroke="var(--p3-border)" strokeWidth="0.2" opacity="0.4" />
              <line x1="95" y1="156" x2="95" y2="324" stroke="var(--p3-border)" strokeWidth="0.2" opacity="0.4" />
              <line x1="117" y1="156" x2="117" y2="324" stroke="var(--p3-border)" strokeWidth="0.2" opacity="0.4" />
              <line x1="139" y1="156" x2="139" y2="324" stroke="var(--p3-border)" strokeWidth="0.2" opacity="0.4" />
              <line x1="161" y1="156" x2="161" y2="324" stroke="var(--p3-border)" strokeWidth="0.2" opacity="0.4" />
              <line x1="13" y1="178" x2="177" y2="178" stroke="var(--p3-border)" strokeWidth="0.2" opacity="0.4" />
              <line x1="13" y1="200" x2="177" y2="200" stroke="var(--p3-border)" strokeWidth="0.2" opacity="0.4" />
              <line x1="13" y1="222" x2="177" y2="222" stroke="var(--p3-border)" strokeWidth="0.2" opacity="0.4" />
              <line x1="13" y1="244" x2="177" y2="244" stroke="var(--p3-border)" strokeWidth="0.2" opacity="0.4" />
              <line x1="13" y1="266" x2="177" y2="266" stroke="var(--p3-border)" strokeWidth="0.2" opacity="0.4" />
              <line x1="13" y1="288" x2="177" y2="288" stroke="var(--p3-border)" strokeWidth="0.2" opacity="0.4" />
              <line x1="13" y1="310" x2="177" y2="310" stroke="var(--p3-border)" strokeWidth="0.2" opacity="0.4" />
              <path d="M 27 306 L 43 284 L 61 292 L 83 268 L 103 250 L 123 236 L 153 216" fill="none" stroke="var(--p3-accent)" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
              <circle cx="47" cy="286" r="5.5" fill="var(--p3-success)" opacity="0.9" />
              <circle cx="47" cy="286" r="2.5" fill="var(--p3-paper)" />
              <circle cx="135" cy="230" r="5.5" fill="var(--p3-success)" opacity="0.9" />
              <circle cx="135" cy="230" r="2.5" fill="var(--p3-paper)" />

              {/* BOTTOM NAV */}
              <rect x="6" y="330" width="178" height="34" fill="var(--p3-surface)" opacity="0.95" />
              <circle cx="37" cy="347" r="4.5" fill="var(--p3-accent)" />
              <circle cx="71" cy="347" r="4.5" fill="var(--p3-border)" />
              <circle cx="105" cy="347" r="4.5" fill="var(--p3-border)" />
              <circle cx="139" cy="347" r="4.5" fill="var(--p3-border)" />
              <rect x="67" y="368" width="56" height="3" rx="1.5" fill="var(--p3-border)" />
            </svg>

            {/* Cards — pinned to the phone body; top % maps 1:1 to SVG Y / 386 */}
            <div className="p3-phone-card p3-phone-card--l" style={{ top: "20.5%" }}>
              <span className="p3-phone-card-label">📍 Realtime Tracking</span>
            </div>
            <div className="p3-phone-card p3-phone-card--l" style={{ top: "33.2%" }}>
              <span className="p3-phone-card-label">🚗 Status Kendaraan</span>
            </div>
            <div className="p3-phone-card p3-phone-card--l" style={{ top: "62.2%" }}>
              <span className="p3-phone-card-label">🛣️ Riwayat</span>
            </div>

            <div className="p3-phone-card p3-phone-card--r" style={{ top: "20.5%" }}>
              <span className="p3-phone-card-label">🔔 Notifikasi</span>
            </div>
            <div className="p3-phone-card p3-phone-card--r" style={{ top: "47.7%" }}>
              <span className="p3-phone-card-label">⭕ Geofence</span>
            </div>
            <div className="p3-phone-card p3-phone-card--r" style={{ top: "62.2%" }}>
              <span className="p3-phone-card-label">📊 Laporan</span>
            </div>
          </div>
        </div>
      </section>

      {/* KONSULTASI */}
      <section id="konsultasi" className="p3-consult">
        <div className="p3-consult-inner">
          <div className="p3-section-header">
            <p className="p3-section-tag">// konsultasi</p>
            <h2 className="p3-section-title">Butuh rekomendasi untuk armada Anda?</h2>
            <p style={{ marginTop: 8, fontSize: 14, color: "var(--p3-ink-muted)", maxWidth: 480, lineHeight: 1.65 }}>
              Tim kami bantu pilih perangkat GPS yang tepat, skema pemasangan, dan konfigurasi server sesuai kebutuhan bisnis Anda.
            </p>
          </div>

          <div className="p3-consult-grid">
            <div className="p3-consult-card">
              <div className="p3-consult-card-icon">🛰️</div>
              <h3>Pemilihan Perangkat</h3>
              <p>Konsultasi tipe GPS yang cocok untuk jenis kendaraan dan operasional Anda.</p>
            </div>
            <div className="p3-consult-card">
              <div className="p3-consult-card-icon">📐</div>
              <h3>Rencana Pemasangan</h3>
              <p>Tim teknisi merencanakan lokasi dan metode pemasangan tanpa ganggu operasional.</p>
            </div>
            <div className="p3-consult-card">
              <div className="p3-consult-card-icon">🖥️</div>
              <h3>Konfigurasi Server</h3>
              <p>Setup dashboard, geofence, alert, dan hak akses sesuai kebutuhan tim Anda.</p>
            </div>
            <div className="p3-consult-card">
              <div className="p3-consult-card-icon">💰</div>
              <h3>Estimasi Biaya</h3>
              <p>Transparansi biaya perangkat, pemasangan, dan langganan server bulanan.</p>
            </div>
          </div>

          <div className="p3-consult-cta">
            <a href="https://wa.me/6281234567890?text=Halo%2C%20saya%20ingin%20konsultasi%20GPS%20tracking%20untuk%20armada%20saya." target="_blank" rel="noopener noreferrer" className="p3-btn-primary" style={{ height: 42, padding: "0 24px", fontSize: 13 }}>
              Konsultasi Gratis via WhatsApp →
            </a>
            <span style={{ fontSize: 12, color: "var(--p3-ink-faint)" }}>Respon dalam 1×24 jam</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="p3-cta">
        <h2>Siap memantau armada Anda?</h2>
        <p>
          Pasang GPS, hubungkan ke server kami, dan mulai pantau seluruh
          kendaraan dari satu terminal.
        </p>
        <div className="p3-cta-actions">
          <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="p3-btn-primary">Hubungi Kami</a>
          <a href="#features" className="p3-btn-ghost">Pelajari Fitur</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="p3-footer">
        <div className="p3-footer-inner">
          <div className="p3-footer-cols">
            {/* Brand */}
            <div className="p3-footer-brand-col">
              <div className="p3-footer-brand">
                <span className="p3-footer-brand-icon">TG</span>
                <span className="p3-footer-text p3-footer-text--strong">TrackGPS</span>
              </div>
              <p className="p3-footer-desc">
                Pemasangan GPS & server monitoring real-time untuk semua jenis kendaraan.
              </p>
            </div>

            {/* Produk */}
            <div className="p3-footer-col">
              <p className="p3-footer-heading">Produk</p>
              <ul className="p3-footer-list">
                <li><a href="#features" className="p3-footer-link">Fitur</a></li>
                <li><a href="#perangkat" className="p3-footer-link">Perangkat</a></li>
                <li><a href="#aplikasi" className="p3-footer-link">Aplikasi</a></li>
                <li><a href="#advantages" className="p3-footer-link">Keunggulan</a></li>
                <li><a href="#konsultasi" className="p3-footer-link">Konsultasi</a></li>
                <li><Link href="/login" className="p3-footer-link">Dashboard</Link></li>
              </ul>
            </div>

            {/* Layanan */}
            <div className="p3-footer-col">
              <p className="p3-footer-heading">Layanan</p>
              <ul className="p3-footer-list">
                <li><span className="p3-footer-link">Pemasangan GPS</span></li>
                <li><span className="p3-footer-link">Server Monitoring</span></li>
                <li><span className="p3-footer-link">Kamera Kendaraan</span></li>
                <li><span className="p3-footer-link">Geofence & Alert</span></li>
              </ul>
            </div>

            {/* Perusahaan */}
            <div className="p3-footer-col">
              <p className="p3-footer-heading">Perusahaan</p>
              <ul className="p3-footer-list">
                <li><span className="p3-footer-link">Tentang Kami</span></li>
                <li><span className="p3-footer-link">Kontak</span></li>
                <li><span className="p3-footer-link">Blog</span></li>
                <li><span className="p3-footer-link">Karir</span></li>
              </ul>
            </div>

            {/* Legal */}
            <div className="p3-footer-col">
              <p className="p3-footer-heading">Legal</p>
              <ul className="p3-footer-list">
                <li><span className="p3-footer-link">Kebijakan Privasi</span></li>
                <li><span className="p3-footer-link">Syarat & Ketentuan</span></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="p3-footer-bottom">
            <span className="p3-footer-copy">© {new Date().getFullYear()} TrackGPS. Hak cipta dilindungi.</span>
            <div className="p3-footer-links">
              <a href="#features">Fitur</a>
              <a href="#perangkat">Perangkat</a>
              <a href="#aplikasi">Aplikasi</a>
              <a href="#advantages">Keunggulan</a>
              <a href="#konsultasi">Konsultasi</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
