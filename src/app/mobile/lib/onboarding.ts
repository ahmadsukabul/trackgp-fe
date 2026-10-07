/**
 * Flag onboarding mobile — disimpan di localStorage supaya slider "welcome"
 * hanya muncul pada kunjungan pertama.
 */

const KEY = "mobile_onboarded";

export function isOnboarded(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(KEY) === "1";
}

export function markOnboarded(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, "1");
}
