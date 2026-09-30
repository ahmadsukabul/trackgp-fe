import type { Metadata } from "next";
import { Preview1 } from "../preview1";

export const metadata: Metadata = {
  title: "Preview 1 — Stat-Led + Cobalt",
  description: "Landing page preview: Stat-Led macrostructure with Cobalt theme (blue accent, Space Grotesk).",
};

export default function Preview1Page() {
  return <Preview1 />;
}
