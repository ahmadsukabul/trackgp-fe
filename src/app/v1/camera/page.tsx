"use client";

import { Camera, Construction } from "lucide-react";

export default function CameraPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: "var(--v1-accent-light)" }}
      >
        <Construction className="w-10 h-10" style={{ color: "var(--v1-accent)" }} />
      </div>
      <h1 className="text-xl font-bold mb-2" style={{ color: "var(--v1-ink)", fontFamily: "var(--v1-font-display)" }}>
        Fitur Kamera
      </h1>
      <p className="text-[14px] max-w-md" style={{ color: "var(--v1-ink-muted)" }}>
        Modul ini sedang dalam tahap pengembangan. Nantikan pembaruan selanjutnya.
      </p>
      <div
        className="mt-6 flex items-center gap-2 px-4 py-2 rounded-xl text-[13px]"
        style={{ background: "var(--v1-surface-raised)", color: "var(--v1-ink-muted)" }}
      >
        <Camera className="w-4 h-4" />
        Coming soon
      </div>
    </div>
  );
}
