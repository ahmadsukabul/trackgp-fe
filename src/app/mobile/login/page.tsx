"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { setAuthData, getApiErrorMessage, getAuthToken } from "../../v1/lib/api";
import { authLogin } from "../../v1/lib/client";
import { isOnboarded } from "../lib/onboarding";

/** Login mobile — satu kolom, tombol besar. Sesi sama dengan v2 (localStorage). */
export default function MobileLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (getAuthToken()) {
      router.replace("/mobile");
      return;
    }
    if (!isOnboarded()) router.replace("/mobile/onboarding");
  }, [router]);

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
      router.push("/mobile");
      return;
    }

    setError(getApiErrorMessage(res, "Login gagal. Periksa email dan password Anda."));
    setLoading(false);
  }

  return (
    <div className="m-login">
      <div className="m-login-brand">
        <span className="m-login-mark">TG</span>
        <span className="m-login-wordmark">TrackGPS</span>
      </div>

      <div>
        <h1 className="m-onboard-title" style={{ fontSize: 20 }}>
          Masuk ke akun Anda
        </h1>
        <p className="m-faint" style={{ fontSize: 13, marginTop: 6 }}>
          Gunakan akun yang telah terdaftar.
        </p>
      </div>

      {error && <div className="m-error">{error}</div>}

      <form onSubmit={handleSubmit} className="m-login-form">
        <div>
          <label className="m-label" htmlFor="m-email">
            Email
          </label>
          <input
            id="m-email"
            className="m-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@contoh.com"
            required
            autoComplete="username"
          />
        </div>

        <div>
          <label className="m-label" htmlFor="m-password">
            Password
          </label>
          <div className="m-login-passwrap">
            <input
              id="m-password"
              className="m-input"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="m-login-eye"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button type="submit" className="m-btn m-btn-primary m-btn-block" disabled={loading}>
          {loading ? "Memproses..." : "Masuk"}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>
    </div>
  );
}
