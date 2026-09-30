import type { Metadata } from "next";
import { LandingContent } from "./landing-content";

export const metadata: Metadata = {
  title: "TrackGPS — Pantau Armada & Aset secara Real-time",
  description:
    "Pantau posisi kendaraan, armada, dan aset secara real-time dari satu dashboard multi-bisnis.",
};

export default function Home() {
  return <LandingContent />;
}
