import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://trackgp.id"),
  title: {
    default: "TrackGPS — Platform GPS Tracking",
    template: "%s — TrackGPS",
  },
  description:
    "Pantau posisi kendaraan, armada, dan aset secara real-time. Kelola device GPS, geofence, riwayat perjalanan, dan laporan dalam satu platform.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "TrackGPS — Platform GPS Tracking",
    description:
      "Pantau posisi kendaraan, armada, dan aset secara real-time. Kelola device GPS, geofence, riwayat perjalanan, dan laporan dalam satu platform.",
    siteName: "TrackGPS",
    url: "https://trackgp.id",
    type: "website",
    locale: "id_ID",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrackGPS — Platform GPS Tracking",
    description:
      "Pantau posisi kendaraan, armada, dan aset secara real-time.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased scroll-smooth`}
    >
      <body
        className="min-h-full flex flex-col font-sans"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}