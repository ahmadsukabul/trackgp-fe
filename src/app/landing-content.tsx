"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/components/theme-provider";
import { Preview1 } from "./preview1";
import { Preview2 } from "./preview2";
import { Preview3 } from "./preview3";

const PREVIEWS = [
  { id: "1", label: "Stat-Led", desc: "Metric-first hero, blue accent, floating nav" },
  { id: "2", label: "Bento Grid", desc: "Tile mosaic, coral accent, step-by-step" },
  { id: "3", label: "Workbench", desc: "Dashboard feel, green-cyan, terminal panel" },
] as const;

type PreviewId = "1" | "2" | "3";

function getPreviewFromURL(): PreviewId {
  if (typeof window === "undefined") return "3";
  const params = new URLSearchParams(window.location.search);
  const v = params.get("versilanding");
  if (v === "1" || v === "2" || v === "3") return v;
  return "3";
}

function hasVersiLandingParam(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("versilanding");
}

export function LandingContent() {
  const { theme } = useTheme();
  const [active, setActive] = useState<PreviewId>("3");
  const [showSelector, setShowSelector] = useState(false);

  // Sync URL query param on mount & when query changes
  useEffect(() => {
    setActive(getPreviewFromURL());
    setShowSelector(hasVersiLandingParam());

    const handlePopState = () => {
      setActive(getPreviewFromURL());
      setShowSelector(hasVersiLandingParam());
    };
    window.addEventListener("popstate", handlePopState);

    const observer = new MutationObserver(() => {
      setActive(getPreviewFromURL());
      setShowSelector(hasVersiLandingParam());
    });
    observer.observe(document.querySelector("head")!, { childList: true });

    return () => {
      window.removeEventListener("popstate", handlePopState);
      observer.disconnect();
    };
  }, []);

  const switchPreview = (id: PreviewId) => {
    setActive(id);
    const url = new URL(window.location.href);
    url.searchParams.set("versilanding", id);
    window.history.pushState({}, "", url.toString());
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: theme === "dark" ? "#0b1220" : "#f5f7fa",
      color: theme === "dark" ? "#e2e8f0" : "#1e293b",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Preview selector bar — only when ?versilanding exists */}
      {showSelector && (
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: theme === "dark" ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${theme === "dark" ? "#1e293b" : "#e2e8f0"}`,
        padding: "12px 24px",
      }}>
        <div style={{
          maxWidth: 1120,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 32, height: 32,
              background: "#2964e7",
              color: "white",
              borderRadius: 8,
              fontSize: 12, fontWeight: 800,
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
            }}>TG</span>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700 }}>TrackGPS</span>
              <span style={{
                marginLeft: 8,
                fontSize: 11,
                color: theme === "dark" ? "#64748b" : "#94a3b8",
                fontWeight: 500,
              }}>Landing Page Previews</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {PREVIEWS.map((p) => (
              <button
                key={p.id}
                onClick={() => switchPreview(p.id)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  height: 34, padding: "0 14px",
                  borderRadius: 999,
                  border: `1px solid ${active === p.id ? "#2964e7" : theme === "dark" ? "#334155" : "#e2e8f0"}`,
                  background: active === p.id
                    ? "#2964e7"
                    : theme === "dark" ? "rgba(30,41,59,0.5)" : "rgba(255,255,255,0.8)",
                  color: active === p.id ? "white" : theme === "dark" ? "#cbd5e1" : "#475569",
                  fontSize: 12, fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: active === p.id ? "white" : "#94a3b8",
                }} />
                Preview {p.id}: {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Active preview */}
      <div>
        {active === "1" && <Preview1 />}
        {active === "2" && <Preview2 />}
        {active === "3" && <Preview3 />}
      </div>
    </div>
  );
}
