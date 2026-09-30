"use client";

/**
 * Section — kartu berjudul untuk halaman detail, mengikuti pola halaman detail
 * bisnis di Terachat (ikon + judul di header, isi di bawahnya).
 */
export function Section({
  icon,
  title,
  children,
  headerRight,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-[#1a1a1c] border border-gray-100 dark:border-gray-800/60 rounded-[14px] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800/60">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{icon}</span>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
        </div>
        {headerRight}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/** InfoRow — satu baris label/value di dalam Section. */
export function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[13px] text-gray-500 dark:text-gray-400 shrink-0">{label}</dt>
      <dd className="text-[13px] text-gray-900 dark:text-white text-right break-all min-w-0">
        {children}
      </dd>
    </div>
  );
}

/** StatCard — angka ringkas untuk baris statistik di atas halaman detail. */
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
    <div className="bg-white dark:bg-[#1a1a1c] border border-gray-100 dark:border-gray-800/60 rounded-[14px] px-4 py-3 flex items-center gap-3">
      <span className="text-gray-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-[15px] font-semibold text-gray-900 dark:text-white truncate">{value}</p>
      </div>
    </div>
  );
}

/** EmptyState — pesan saat sub-list tidak punya data. */
export function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <span className="text-gray-300 dark:text-gray-700">{icon}</span>
      <p className="text-[13px] text-gray-400 dark:text-gray-500">{message}</p>
    </div>
  );
}
