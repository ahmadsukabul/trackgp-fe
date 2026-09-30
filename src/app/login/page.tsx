"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { setAuthData, getApiErrorMessage } from "../v1/lib/api";
import { authLogin } from "../v1/lib/client";

/*
 * Workbench + Aurora login — exact same tokens as Preview 3 (p3-root).
 * Dark-first. Light mode handled via .dark overrides.
 */

const T = {
  // dark (default)
  paper: "oklch(16% 0.02 170)",
  surface: "oklch(22% 0.03 170)",
  surfaceRaised: "oklch(26% 0.035 170)",
  ink: "oklch(94% 0.005 170)",
  inkMuted: "oklch(70% 0.02 170)",
  inkFaint: "oklch(50% 0.015 170)",
  accent: "oklch(72% 0.18 175)",
  accentDim: "oklch(55% 0.14 175)",
  accentLight: "oklch(28% 0.06 175)",
  accentGlow: "oklch(72% 0.18 175 / 0.15)",
  border: "oklch(30% 0.025 170)",
  danger: "oklch(65% 0.18 25)",
  dangerBg: "oklch(65% 0.18 25 / 0.12)",
  dangerBorder: "oklch(65% 0.18 25 / 0.25)",
  radius: "10px",
  radiusLg: "16px",
  fontDisplay: "'JetBrains Mono', monospace",
  fontBody: "'Inter', system-ui, sans-serif",
  shadowGlow: "0 0 24px oklch(72% 0.18 175 / 0.15)",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

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
      router.push("/v1");
      return;
    }

    setError(getApiErrorMessage(res, "Login gagal. Periksa email dan password Anda."));
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      background: T.paper,
      color: T.ink,
      fontFamily: T.fontBody,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Glow */}
      <div style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background: `radial-gradient(800px 500px at 50% -20%, ${T.accentGlow}, transparent 70%)`,
      }} />

      {/* Grid lines decoration */}
      <div style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: 0.03,
        backgroundImage: `
          linear-gradient(${T.inkFaint} 1px, transparent 1px),
          linear-gradient(90deg, ${T.inkFaint} 1px, transparent 1px)
        `,
        backgroundSize: "64px 64px",
      }} />

      {/* Theme toggle */}
      <div style={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}>
        <ThemeToggle />
      </div>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <Link href="/" style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          marginBottom: 32,
          textDecoration: "none",
        }}>
          <span style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 12,
            background: T.accent,
            color: T.paper,
            fontFamily: T.fontDisplay,
            fontSize: 14,
            fontWeight: 800,
          }}>TG</span>
          <span style={{
            fontFamily: T.fontDisplay,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: T.ink,
          }}>TrackGPS</span>
        </Link>

        {/* Card */}
        <div style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: T.radiusLg,
          padding: "32px 28px",
          boxShadow: `0 8px 32px oklch(0% 0 0 / 0.3)`,
        }}>
          {/* Terminal bar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 20,
            paddingBottom: 14,
            borderBottom: `1px solid ${T.border}`,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "oklch(65% 0.18 25)" }} />
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "oklch(78% 0.14 85)" }} />
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "oklch(70% 0.17 155)" }} />
            <span style={{
              marginLeft: "auto",
              fontFamily: T.fontDisplay,
              fontSize: 10,
              color: T.inkFaint,
              letterSpacing: "0.02em",
            }}>auth://trackgp.id</span>
          </div>

          <h1 style={{
            fontFamily: T.fontDisplay,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: T.ink,
            margin: "0 0 4px 0",
          }}>
            Masuk ke Akun
          </h1>
          <p style={{
            fontSize: 13,
            color: T.inkFaint,
            lineHeight: 1.5,
            margin: "0 0 24px 0",
          }}>
            Gunakan akun yang telah terdaftar
          </p>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 16,
              padding: "10px 14px",
              background: T.dangerBg,
              border: `1px solid ${T.dangerBorder}`,
              borderRadius: T.radius,
              fontSize: 13,
              color: T.danger,
              lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Email */}
            <div>
              <label style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: T.inkMuted,
                marginBottom: 6,
                fontFamily: T.fontDisplay,
                letterSpacing: "0.02em",
              }}>
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@contoh.com"
                required
                autoComplete="username"
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                style={{
                  width: "100%",
                  height: 42,
                  padding: "0 14px",
                  fontSize: 13,
                  background: T.paper,
                  border: `1px solid ${focused === "email" ? T.accent : T.border}`,
                  borderRadius: T.radius,
                  color: T.ink,
                  outline: "none",
                  transition: "border-color 0.15s",
                  fontFamily: T.fontBody,
                  boxShadow: focused === "email" ? T.shadowGlow : "none",
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: T.inkMuted,
                marginBottom: 6,
                fontFamily: T.fontDisplay,
                letterSpacing: "0.02em",
              }}>
                PASSWORD
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  autoComplete="current-password"
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  style={{
                    width: "100%",
                    height: 42,
                    padding: "0 40px 0 14px",
                    fontSize: 13,
                    background: T.paper,
                    border: `1px solid ${focused === "password" ? T.accent : T.border}`,
                    borderRadius: T.radius,
                    color: T.ink,
                    outline: "none",
                    transition: "border-color 0.15s",
                    fontFamily: T.fontBody,
                    boxShadow: focused === "password" ? T.shadowGlow : "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    padding: 4,
                    color: T.inkFaint,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                height: 42,
                marginTop: 4,
                background: loading ? T.accentDim : T.accent,
                color: T.paper,
                fontSize: 13,
                fontWeight: 600,
                border: "none",
                borderRadius: T.radius,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                transition: "all 0.15s",
                fontFamily: T.fontBody,
              }}
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>

        {/* Back link */}
        <Link href="/" style={{
          display: "block",
          marginTop: 20,
          textAlign: "center",
          fontSize: 13,
          color: T.inkFaint,
          textDecoration: "none",
          transition: "color 0.15s",
        }}>
          ← Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}
