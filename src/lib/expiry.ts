/**
 * Util status langganan device (admin & client).
 *
 * Aturan masa tenggang sama dengan BE (services/service_subscription.go):
 * device masih boleh menerima data sampai `expired_at + EXPIRED_GRACE_DAYS`.
 */

import { parseDateParts } from "./format-date";

/** Masa tenggang (hari) setelah tanggal expired sebelum device dihentikan. */
export const EXPIRED_GRACE_DAYS = 3;

export type ExpiryStatus = "none" | "active" | "soon" | "grace" | "blocked";

/** Selisih hari (expired_at - hari ini) pada granularitas tanggal lokal. */
export function expiryDaysLeft(expiredAt?: string): number | null {
  if (!expiredAt) return null;
  const p = parseDateParts(expiredAt);
  if (!p) return null;
  const now = new Date();
  const todayTs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const expTs = new Date(p.year, p.month, p.day).getTime();
  return Math.round((expTs - todayTs) / 86400000);
}

/**
 * Klasifikasi status:
 *   none    — belum diatur
 *   active  — masih > 3 hari
 *   soon    — <= 3 hari lagi
 *   grace   — sudah lewat tapi masih dalam masa tenggang
 *   blocked — lebih dari masa tenggang (device berhenti)
 */
export function expiryStatus(expiredAt?: string): ExpiryStatus {
  const days = expiryDaysLeft(expiredAt);
  if (days === null) return "none";
  if (days < -EXPIRED_GRACE_DAYS) return "blocked";
  if (days < 0) return "grace";
  if (days <= 3) return "soon";
  return "active";
}
