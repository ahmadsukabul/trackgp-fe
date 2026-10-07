"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "../../v1/lib/api";
import { BusinessProvider } from "../../v1/lib/BusinessContext";
import { isOnboarded } from "../lib/onboarding";
import MobileShell from "./mobile-shell";

/**
 * MobileGate — penjaga sesi untuk area app mobile.
 *
 * Penting: BusinessProvider TIDAK dipasang sebelum token dipastikan ada,
 * supaya request tanpa token tidak memicu 401 → lompat ke login sebelum
 * pengguna sempat melihat onboarding.
 */
export default function MobileGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getAuthToken()) {
      router.replace(isOnboarded() ? "/mobile/login" : "/mobile/onboarding");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="m-shell">
        <div className="m-main">
          <div className="m-card m-card-pad animate-pulse" style={{ height: 120 }} />
        </div>
      </div>
    );
  }

  return (
    <BusinessProvider>
      <MobileShell>{children}</MobileShell>
    </BusinessProvider>
  );
}
