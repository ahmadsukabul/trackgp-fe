import { AppShell } from "../_shell/app-shell";
import "./v1.css";

/**
 * Layout client v1 — tema "Workbench + Aurora" (gelap).
 * Kerangka (sidebar/header/main) ada di AppShell dan dipakai bersama v2.
 */
export default function V1Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell rootClass="v1-root" base="/v1" loginPath="/login">
      {children}
    </AppShell>
  );
}
