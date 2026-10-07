import { AppShell } from "../../_shell/app-shell";
import "../v2.css";

/**
 * Layout client v2 — tema "Ledger" (terang, mengikuti landing Preview 4).
 * Kerangka (sidebar/header/main) sama dengan v1, hanya rootClass + base berbeda.
 */
export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell rootClass="v2-root" base="/v2" loginPath="/v2/login">
      {children}
    </AppShell>
  );
}
