"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, MapPin } from "lucide-react";
import { adminFetch, setAdminToken } from "../lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9015";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      setChecking(false);
      return;
    }
    fetch(`${API_BASE}/adminx8/dashboard/stats`, {
      method: "GET",
      headers: { Authorization: token },
    })
      .then(async (res) => {
        try {
          const json = await res.json();
          if (res.ok && json.status === 1) {
            router.replace("/admin834kf");
          } else {
            localStorage.removeItem("admin_token");
            setChecking(false);
          }
        } catch {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const json = await adminFetch<{ token: string; name?: string; level?: string }>(
        "/auth/login",
        { method: "POST", body: { email, password } },
      );

      if (json.status === 0 || !json.data?.token) {
        setError(json.error_msg || json.message || "Login gagal");
        return;
      }

      setAdminToken(json.data.token);
      if (json.data.name) localStorage.setItem("admin_name", json.data.name);
      if (json.data.level) localStorage.setItem("admin_level", json.data.level);
      router.push("/admin834kf");
    } catch {
      setError("Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0b]">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-[13px]">Memeriksa sesi...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0b] px-4">
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-xl bg-blue-600 text-white">
            <MapPin className="w-6 h-6" />
          </div>
          <h1 className="text-[22px] font-bold text-gray-900 dark:text-white">
            Admin Panel
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
            Masuk ke panel administrasi TrackGPS
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm"
        >
          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-[13px] text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@trackgp.id"
                required
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-[14px] font-semibold text-white transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Memproses...
              </>
            ) : (
              "Masuk"
            )}
          </button>

          <p className="mt-6 text-center text-[12px] text-gray-400">
            <Link href="/" className="hover:text-gray-600 dark:hover:text-gray-300">
              &larr; Kembali ke beranda
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}