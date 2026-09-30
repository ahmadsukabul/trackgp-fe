// Konfigurasi FE TrackGPS — selaraskan dengan BE (trackgp).
// Semua endpoint client memakai method POST dan header Authorization berisi token
// terenkripsi hasil login, plus bisnis_id untuk memilih bisnis aktif (multi-tenant).

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9015";

const AUTH_KEYS = ["auth_token", "user_id", "user_name", "user_email"];

function businessKey(): string {
  if (typeof window === "undefined") return "active_business_id";
  const uid = localStorage.getItem("user_id") ?? "";
  return uid ? `active_business_id_${uid}` : "active_business_id";
}

export function getActiveBusinessId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(businessKey()) ?? "";
}

export function setActiveBusinessId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(businessKey(), id);
}

export function clearAuthData() {
  if (typeof window === "undefined") return;
  // Simpan bisnis terakhir supaya bisa auto-select lagi setelah login.
  const lastBizId = getActiveBusinessId();
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem(businessKey());
  if (lastBizId) localStorage.setItem("last_active_business_id", lastBizId);
}

export function restoreLastActiveBusiness(): string {
  if (typeof window === "undefined") return "";
  const last = localStorage.getItem("last_active_business_id");
  if (last) {
    localStorage.removeItem("last_active_business_id");
    return last;
  }
  return "";
}

export function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("auth_token") ?? "";
}

export function setAuthData(token: string, user: { user_id?: string; name?: string; email?: string }) {
  localStorage.setItem("auth_token", token);
  if (user.user_id) localStorage.setItem("user_id", user.user_id);
  if (user.name) localStorage.setItem("user_name", user.name);
  if (user.email) localStorage.setItem("user_email", user.email);
}

// Bisnis aktif bisa di-inject dari BusinessContext; getter ini dipasang sekali
// saat provider mount supaya setiap request otomatis membawa tenant yang benar.
let _getBusinessId: (() => string) | null = null;

export function setBusinessIdGetter(fn: () => string) {
  _getBusinessId = fn;
}

function currentBusinessId(): string {
  return _getBusinessId?.() || getActiveBusinessId();
}

function goLogin() {
  if (typeof window !== "undefined") window.location.href = "/login";
}

/**
 * apiFetch satu-satunya jalur ke BE client. Semua route client berbentuk POST.
 * Respons 401/rc 401 (token mati atau membership hilang) -> bersihkan sesi & lempar ke /login.
 *
 * T generic dipakai oleh lib/client.ts supaya tiap endpoint bisa mendeklarasikan
 * bentuk `data`-nya; defaultnya tetap ApiResponse agar halaman boleh memakainya langsung.
 */
export async function apiFetch<T = unknown>(
  endpoint: string,
  body: Record<string, unknown> = {},
): Promise<ApiResponse<T>> {
  const bisnisId = currentBusinessId();
  const payload = bisnisId ? { bisnis_id: bisnisId, ...body } : body;

  const headers: Record<string, string> = {
    Authorization: getAuthToken(),
    "Content-Type": "application/json",
  };
  if (bisnisId) headers["bisnis_id"] = bisnisId;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    return { status: 0, rc: -1, data: null as T, error_msg: "Tidak dapat terhubung ke server." };
  }

  let data: ApiResponse<T>;
  try {
    data = (await res.json()) as ApiResponse<T>;
  } catch {
    return { status: 0, rc: res.status, data: null as T, error_msg: "Respons server tidak valid." };
  }

  if (res.status === 401 || data?.rc === 401) {
    clearAuthData();
    goLogin();
  }
  return data;
}

/** Tanpa menyuntik bisnis_id — untuk endpoint auth/me & auth/bisnis sebelum bisnis dipilih. */
export async function apiFetchRaw<T = unknown>(
  endpoint: string,
  body: Record<string, unknown> = {},
): Promise<ApiResponse<T>> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: getAuthToken(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return { status: 0, rc: -1, data: null as T, error_msg: "Tidak dapat terhubung ke server." };
  }

  const data: ApiResponse<T> = await res
    .json()
    .catch(() => ({ status: 0, rc: res.status, data: null as T, error_msg: "Respons server tidak valid." }));
  if (res.status === 401 || data?.rc === 401) {
    clearAuthData();
    goLogin();
  }
  return data;
}

/** Endpoint publik (login) — tanpa Authorization header. */
export async function apiFetchPublic<T = unknown>(
  endpoint: string,
  body: Record<string, unknown> = {},
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    return await res.json();
  } catch {
    return { status: 0, rc: -1, data: null as T, error_msg: "Tidak dapat terhubung ke server." };
  }
}

export interface ApiResponse<T = unknown> {
  status: number;
  rc: number;
  message?: string;
  error_msg?: string;
  data: T;
}

export type ApiResult<T> = ApiResponse<T>;

export function getApiErrorMessage(
  response: { error_msg?: string; message?: string } | null | undefined,
  fallback: string,
): string {
  if (!response) return fallback;
  const errorMsg = typeof response.error_msg === "string" ? response.error_msg.trim() : "";
  if (errorMsg) return errorMsg;
  const message = typeof response.message === "string" ? response.message.trim() : "";
  if (message) return message;
  return fallback;
}
