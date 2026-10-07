"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import { setAuthData, getApiErrorMessage } from "../../v1/lib/api";
import { authLogin } from "../../v1/lib/client";
import "../v2.css";

/*
 * Login v2 — tema "Ledger" (terang), konsisten dengan landing Preview 4.
 * Layout split: panel pendamping di kiri, form di kanan.
 */

const POINTS = [
  { bold: "Posisi real-time", rest: " pantau unit bergerak di peta" },
  { bold: "Riwayat tersimpan", rest: " telusuri jejak perjalanan" },
  { bold: "Peringatan dini", rest: " notifikasi saat keluar area" },
];

export default function V2LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await authLogin(email.trim().toLowerCase(), password);

    if (res.status === 1 && res.data?.token) {
      setAuthData(res.data.token, {
        user_id: res.data.user_id,
        name: res.data.name,
        email: res.data.email || email,
      });
      router.push("/v2");
      return;
    }

    setError(getApiErrorMessage(res, "Login gagal. Periksa email dan password Anda."));
    setLoading(false);
  }

  const brand = (
    <>
      <span className="v2-login-mark">TG</span>
      <span className="v2-login-wordmark">TrackGPS</span>
    </>
  );

  return (
    <div className="v2-root v2-login">
      {/* Panel pendamping (kiri) */}
      <aside className="v2-login-aside">
        <Link href="/" className="v2-login-brand">
          {brand}
        </Link>

        <div>
          <p className="v2-login-eyebrow">Platform GPS Tracking</p>
          <h1 className="v2-login-headline">Pantau armada Anda, satu layar.</h1>
          <ul className="v2-login-points">
            {POINTS.map((p) => (
              <li key={p.bold} className="v2-login-point">
                <span className="v2-login-tick">
                  <Check size={13} strokeWidth={3} />
                </span>
                <span>
                  <b>{p.bold}</b>
                  {p.rest}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="v2-login-asidefoot">Kelola perangkat, geofence, dan laporan dalam satu platform.</p>
      </aside>

      {/* Form (kanan) */}
      <main className="v2-login-main">
        <div className="v2-login-card">
          <Link href="/" className="v2-login-brand v2-login-mobilebrand">
            {brand}
          </Link>

          <h2 className="v2-login-title">Masuk ke akun Anda</h2>
          <p className="v2-login-sub">Gunakan akun yang telah terdaftar.</p>

          {error && <div className="v2-login-error">{error}</div>}

          <form onSubmit={handleSubmit} className="v2-login-form">
            <div>
              <label className="v2-login-label" htmlFor="v2-email">
                Email
              </label>
              <input
                id="v2-email"
                className="v2-login-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@contoh.com"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="v2-login-label" htmlFor="v2-password">
                Password
              </label>
              <div className="v2-login-passwrap">
                <input
                  id="v2-password"
                  className="v2-login-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="v2-login-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="v2-login-submit" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
              {!loading && <ArrowRight className="v2-login-arrow" size={16} />}
            </button>
          </form>

          <Link href="/" className="v2-login-back">
            ← Kembali ke beranda
          </Link>
        </div>
      </main>
    </div>
  );
}
