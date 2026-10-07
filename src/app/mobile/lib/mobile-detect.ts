/**
 * Deteksi perangkat di sisi klien (untuk keputusan UI, bukan redirect).
 * Redirect v2 <-> mobile ditangani middleware server.
 */

const MOBILE_UA =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet|Silk/i;

export function isMobileUA(): boolean {
  if (typeof navigator === "undefined") return false;
  return MOBILE_UA.test(navigator.userAgent);
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOSUA = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ menyamar sebagai Mac; deteksi lewat sentuhan.
  const iPadOS = navigator.platform === "MacIntel" && (navigator.maxTouchPoints ?? 0) > 1;
  return iOSUA || iPadOS;
}

/** True bila app sedang dibuka dalam mode terpasang (standalone / PWA). */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone;
}
