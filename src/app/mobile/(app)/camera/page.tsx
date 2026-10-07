"use client";

import { Camera, Construction } from "lucide-react";

/** Kamera — modul dalam pengembangan (sama seperti v1). */
export default function MobileCameraPage() {
  return (
    <div className="m-empty" style={{ padding: "56px 20px" }}>
      <span className="flex items-center justify-center" style={{ width: 64, height: 64, background: "var(--v1-accent-light)", color: "var(--v1-accent-dim)" }}>
        <Construction className="w-8 h-8" />
      </span>
      <p style={{ fontSize: 16, fontWeight: 700, color: "var(--v1-ink)", marginTop: 6 }}>Fitur Kamera</p>
      <p style={{ fontSize: 13, maxWidth: 280 }}>
        Modul ini sedang dalam tahap pengembangan. Nantikan pembaruan selanjutnya.
      </p>
      <span className="m-row" style={{ gap: 6, fontSize: 12, color: "var(--v1-ink-muted)", marginTop: 6 }}>
        <Camera className="w-4 h-4" /> Coming soon
      </span>
    </div>
  );
}
