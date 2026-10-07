import type { CSSProperties } from "react";

/**
 * TrackgpLogo — logo brand "trackgp": pin lokasi hijau (berlubang + petir)
 * diikuti wordmark "track" (navy) + "gp" (hijau).
 *
 * Dirender sebagai SVG + teks (bukan gambar raster) supaya tajam di semua
 * ukuran, ikut warna token, dan tidak menambah request. Ukuran diatur lewat
 * `height` (tinggi ikon pin, px); wordmark menskala otomatis.
 *
 * Warna bisa ditimpa lewat CSS var `--brand-navy` / `--brand-green`.
 */
export function TrackgpLogo({
  height = 24,
  wordmark = true,
  className,
  style,
  title = "TrackGPS",
}: {
  /** Tinggi ikon pin dalam px. */
  height?: number;
  /** false = hanya ikon pin (tanpa tulisan). */
  wordmark?: boolean;
  className?: string;
  style?: CSSProperties;
  title?: string;
}) {
  const iconW = (height * 40) / 52;

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: Math.round(height * 0.26),
        lineHeight: 1,
        ...style,
      }}
      aria-label={title}
    >
      <svg
        width={iconW}
        height={height}
        viewBox="0 0 40 52"
        fill="none"
        aria-hidden="true"
        style={{ display: "block", flex: "0 0 auto" }}
      >
        {/* Badan pin */}
        <path
          d="M20 1.6C9.2 1.6 1 9.9 1 20.6 1 31 9.4 39.7 20 50.6c10.6-10.9 19-19.6 19-30C39 9.9 30.8 1.6 20 1.6Z"
          fill="var(--brand-green, #76b900)"
        />
        {/* Lubang pin */}
        <circle cx="20" cy="20.4" r="7.3" fill="#fff" />
        {/* Petir (ruang negatif) */}
        <path
          d="M16.5 27.4h7.3l-3.4 7.1h5.2L14.6 49.2l4.6-10.7h-5.6l2.9-11.1Z"
          fill="#fff"
        />
      </svg>

      {wordmark && (
        <span
          style={{
            fontSize: Math.round(height * 0.84),
            fontWeight: 800,
            letterSpacing: "-0.6px",
            color: "var(--brand-navy, #16233b)",
          }}
        >
          track
          <span style={{ color: "var(--brand-green, #76b900)" }}>gp</span>
        </span>
      )}
    </span>
  );
}

export default TrackgpLogo;
