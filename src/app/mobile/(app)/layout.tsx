import MobileGate from "../_shell/mobile-gate";

/** Layout halaman app mobile — penjaga sesi + provider bisnis + shell. */
export default function MobileAppLayout({ children }: { children: React.ReactNode }) {
  return <MobileGate>{children}</MobileGate>;
}
