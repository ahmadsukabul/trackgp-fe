import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware deteksi perangkat untuk app client.
 *
 * Aturan:
 *   - Perangkat mobile yang membuka /v2/*  -> dialihkan ke /mobile/* (path sama)
 *   - Perangkat desktop yang membuka /mobile/* -> dialihkan ke /v2/*
 *   - /mobile/sw.js dikecualikan (service worker PWA tidak boleh ikut dialihkan)
 *
 * Deteksi memakai user-agent + Client Hint `sec-ch-ua-mobile` (Chromium).
 * Untuk keperluan uji/demo di desktop, cookie `tg_mobile` bisa dipaksa:
 *   - buka /v2?mobile=1  -> paksa mode mobile  (cookie tg_mobile=1)
 *   - buka /v2?mobile=0  -> paksa mode desktop (cookie tg_mobile=0)
 * Cookie bertahan 1 tahun; hapus dengan ?mobile=clear.
 */

const MOBILE_UA =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet|Silk/i;

function detectMobile(req: NextRequest): boolean {
  const forced = req.cookies.get("tg_mobile")?.value;
  if (forced === "1") return true;
  if (forced === "0") return false;

  const ch = req.headers.get("sec-ch-ua-mobile");
  if (ch === "?1") return true;
  if (ch === "?0") return false;

  const ua = req.headers.get("user-agent") || "";
  return MOBILE_UA.test(ua);
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Service worker & aset PWA di bawah /mobile tidak boleh dialihkan.
  if (pathname === "/mobile/sw.js") return NextResponse.next();

  // --- Override mode lewat query (?mobile=1|0|clear) ---
  const override = searchParams.get("mobile");
  if (override === "1" || override === "0" || override === "clear") {
    const url = req.nextUrl.clone();
    url.searchParams.delete("mobile");
    const res = NextResponse.redirect(url);
    if (override === "clear") res.cookies.delete("tg_mobile");
    else
      res.cookies.set("tg_mobile", override, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    return res;
  }

  const mobile = detectMobile(req);

  if (mobile && pathname.startsWith("/v2")) {
    const rest = pathname.slice("/v2".length);
    const url = req.nextUrl.clone();
    url.pathname = `/mobile${rest}`;
    return NextResponse.redirect(url);
  }

  if (!mobile && pathname.startsWith("/mobile")) {
    const rest = pathname.slice("/mobile".length);
    const url = req.nextUrl.clone();
    url.pathname = `/v2${rest}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/v2/:path*", "/mobile/:path*"],
};
