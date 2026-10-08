"use client";

/**
 * Section / InfoRow / StatCard / EmptyState (v1) — blok untuk halaman detail.
 *
 * Semua warna memakai token `var(--v1-*)`, jadi otomatis ikut tema v1 (gelap)
 * maupun v2 (Ledger terang, radius 0) tanpa duplikasi. Dipakai halaman detail
 * GPS agar seragam dengan pola "Section" di halaman lain.
 */

export function Section({
  icon,
  title,
  children,
  headerRight,
}: {
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--v1-surface)", border: "1px solid var(--v1-border)" }}
    >
      <div
        className="flex items-center justify-between gap-3 px-5 py-3.5"
        style={{ borderBottom: "1px solid var(--v1-border-subtle)" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {icon && <span style={{ color: "var(--v1-ink-faint)" }}>{icon}</span>}
          <h2
            className="text-[14px] font-bold truncate"
            style={{ color: "var(--v1-ink)", fontFamily: "var(--v1-font-display)" }}
          >
            {title}
          </h2>
        </div>
        {headerRight}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

/** InfoRow — satu baris label/value; nilai boleh node kaya (link, badge). */
export function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-[13px] shrink-0" style={{ color: "var(--v1-ink-faint)" }}>
        {label}
      </dt>
      <dd
        className="text-[13px] text-right break-all min-w-0"
        style={{ color: "var(--v1-ink)" }}
      >
        {children}
      </dd>
    </div>
  );
}

/** StatCard — kartu angka ringkas untuk baris statistik di atas halaman detail. */
export function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl px-4 py-3 flex items-center gap-3"
      style={{ background: "var(--v1-surface)", border: "1px solid var(--v1-border)" }}
    >
      <span className="shrink-0" style={{ color: "var(--v1-ink-faint)" }}>{icon}</span>
      <div className="min-w-0">
        <p
          className="text-[10px] uppercase tracking-wider font-semibold"
          style={{ color: "var(--v1-ink-faint)", fontFamily: "var(--v1-font-display)" }}
        >
          {label}
        </p>
        <p className="text-[15px] font-semibold truncate" style={{ color: "var(--v1-ink)" }}>
          {value}
        </p>
      </div>
    </div>
  );
}

/** EmptyState — pesan saat sub-list tidak punya data. */
export function EmptyState({ icon, message }: { icon?: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      {icon && <span style={{ color: "var(--v1-ink-faint)" }}>{icon}</span>}
      <p className="text-[13px]" style={{ color: "var(--v1-ink-faint)" }}>
        {message}
      </p>
    </div>
  );
}
