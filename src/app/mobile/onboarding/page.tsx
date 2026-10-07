"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPinned, Route, BellRing, type LucideIcon } from "lucide-react";
import { getAuthToken } from "../../v1/lib/api";
import { isOnboarded, markOnboarded } from "../lib/onboarding";

/**
 * Onboarding mobile — slider sambutan yang hanya tampil pada kunjungan pertama.
 * Setelah selesai, flag `mobile_onboarded` diset dan tidak muncul lagi.
 */

type Slide = { icon: LucideIcon; title: string; desc: string };

const SLIDES: Slide[] = [
  {
    icon: MapPinned,
    title: "Pantau real-time",
    desc: "Lihat posisi seluruh kendaraan dan aset Anda langsung dari peta, kapan pun.",
  },
  {
    icon: Route,
    title: "Riwayat perjalanan",
    desc: "Telusuri jejak perjalanan, kecepatan, dan titik berhenti setiap perangkat.",
  },
  {
    icon: BellRing,
    title: "Peringatan dini",
    desc: "Dapatkan notifikasi begitu kendaraan keluar dari area yang Anda tentukan.",
  },
];

export default function MobileOnboardingPage() {
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (getAuthToken()) {
      router.replace("/mobile");
      return;
    }
    if (isOnboarded()) router.replace("/mobile/login");
  }, [router]);

  function goTo(i: number) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    setIndex(i);
  }

  function onScroll() {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  }

  function finish() {
    markOnboarded();
    router.replace("/mobile/login");
  }

  const isLast = index === SLIDES.length - 1;

  return (
    <div className="m-onboard">
      <div className="m-onboard-top">
        <span className="m-login-brand">
          <span className="m-login-mark">TG</span>
          <span className="m-login-wordmark">TrackGPS</span>
        </span>
        {!isLast && (
          <button type="button" className="m-textbtn" onClick={finish}>
            Lewati
          </button>
        )}
      </div>

      <div className="m-onboard-track" ref={trackRef} onScroll={onScroll}>
        {SLIDES.map((s) => {
          const Icon = s.icon;
          return (
            <div className="m-onboard-slide" key={s.title}>
              <div className="m-onboard-art">
                <Icon style={{ width: 72, height: 72 }} strokeWidth={1.4} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
                <h2 className="m-onboard-title">{s.title}</h2>
                <p className="m-onboard-desc">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="m-onboard-foot">
        <div className="m-dots">
          {SLIDES.map((s, i) => (
            <span key={s.title} className={`m-dot${i === index ? " is-active" : ""}`} />
          ))}
        </div>
        {isLast ? (
          <button type="button" className="m-btn m-btn-primary m-btn-block" onClick={finish}>
            Mulai
          </button>
        ) : (
          <button type="button" className="m-btn m-btn-primary m-btn-block" onClick={() => goTo(index + 1)}>
            Lanjut
          </button>
        )}
      </div>
    </div>
  );
}
