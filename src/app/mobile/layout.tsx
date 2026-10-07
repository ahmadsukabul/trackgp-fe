import type { Metadata, Viewport } from "next";
import "./mobile.css";

/**
 * Root layout app MOBILE.
 *
 * Hanya menyediakan metadata + viewport + pembungkus tema. Provider bisnis &
 * shell (app bar + bottom nav) ada di `(app)/layout.tsx`, sehingga halaman
 * onboarding & login tampil tanpa shell.
 */

export const metadata: Metadata = {
  title: { default: "TrackGPS", template: "%s — TrackGPS" },
  description: "Pantau armada & aset Anda dari ponsel.",
  applicationName: "TrackGPS",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TrackGPS",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function MobileRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="mobile-root">{children}</div>;
}
