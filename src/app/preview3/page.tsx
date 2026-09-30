import type { Metadata } from "next";
import { Preview3 } from "../preview3";

export const metadata: Metadata = {
  title: "Preview 3 — Workbench + Aurora",
  description: "Landing page preview: Workbench macrostructure with Aurora theme (green-cyan, JetBrains Mono).",
};

export default function Preview3Page() {
  return <Preview3 />;
}
