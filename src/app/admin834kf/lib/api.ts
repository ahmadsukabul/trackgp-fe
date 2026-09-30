const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9015";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

export function setAdminToken(token: string) {
  localStorage.setItem("admin_token", token);
}

export function clearAdminToken() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_name");
  localStorage.removeItem("admin_level");
}

export interface ApiResponse<T = unknown> {
  status: number;
  rc: number;
  message?: string;
  error_msg?: string;
  data: T;
}

/**
 * Panggil API admin. Semua endpoint admin berada di bawah prefix /adminx8.
 * Auth via header Authorization (token hasil login, sudah ter-enkripsi).
 */
export async function adminFetch<T = unknown>(
  path: string,
  options: { method?: string; body?: Record<string, unknown> } = {},
): Promise<ApiResponse<T>> {
  const token = getAdminToken();
  const method = options.method || "GET";
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = token;

  let body: string | undefined;
  if (options.body) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const res = await fetch(`${API_BASE}/adminx8${path}`, {
    method,
    headers,
    body,
    cache: "no-store",
  });

  let json: ApiResponse<T>;
  try {
    json = await res.json();
  } catch {
    json = {
      status: 0,
      rc: res.status,
      error_msg: "Gagal membaca respons server.",
      data: undefined as T,
    };
  }

  if (res.status === 401 || json.rc === 401) {
    clearAdminToken();
    if (typeof window !== "undefined") window.location.href = "/admin834kf/login";
  }

  return json;
}

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