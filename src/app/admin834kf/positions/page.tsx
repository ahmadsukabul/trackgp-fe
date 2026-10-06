"use client";

import { adminFetch } from "../lib/api";
import { DataTable, Column } from "../components/data-table";
import { useKeysetPaging, ADMIN_PAGE_LIMIT } from "../lib/use-keyset-paging";
import { formatDateTimeSec } from "@/lib/format-date";

type Position = {
  id: number;
  device_id: string;
  device_name?: string;
  latitude: number;
  longitude: number;
  speed: number;
  altitude: number;
  course: number;
  accuracy: number;
  satellites: number;
  address: string;
  server_time: string;
  device_time: string;
  protocol: string;
};

export default function PositionsPage() {
  const paging = useKeysetPaging<Position>({
    fetchPage: ({ last_id, limit }) => {
      const params = new URLSearchParams();
      params.set("last_id", String(last_id));
      params.set("limit", String(limit));
      return adminFetch<Position[]>(`/positions/all?${params}`);
    },
  });

  const columns: Column<Position>[] = [
    {
      key: "id",
      header: "ID",
      className: "w-16",
      render: (p) => <span className="text-gray-400 text-[12px]">#{p.id}</span>,
    },
    {
      key: "device",
      header: "GPS",
      render: (p) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{p.device_name || "Tanpa Nama"}</p>
          <p className="text-[12px] text-gray-500 font-mono">{p.device_id}</p>
        </div>
      ),
    },
    {
      key: "position",
      header: "Koordinat",
      render: (p) => (
        <span className="text-[13px] font-mono">
          {Number(p.latitude).toFixed(6)}, {Number(p.longitude).toFixed(6)}
        </span>
      ),
    },
    {
      key: "speed",
      header: "Speed (km/h)",
      render: (p) => <span className="text-[13px]">{Number(p.speed ?? 0).toFixed(1)}</span>,
    },
    {
      key: "satellites",
      header: "Satelit",
      render: (p) => (
        <span className="inline-flex items-center gap-1 text-[13px]">
          {p.satellites ?? 0}
          <span className="text-[11px] text-gray-400">sat</span>
        </span>
      ),
    },
    {
      key: "altitude",
      header: "Altitude (m)",
      render: (p) => <span className="text-[13px]">{Number(p.altitude ?? 0).toFixed(1)}</span>,
    },
    {
      key: "course",
      header: "Course",
      render: (p) => <span className="text-[13px]">{p.course ?? "-"}°</span>,
    },
    {
      key: "protocol",
      header: "Protocol",
      render: (p) => (
        <span className="text-[12px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{p.protocol || "-"}</span>
      ),
    },
    {
      key: "server_time",
      header: "Server Time",
      render: (p) => (
        <span className="text-[12px] text-gray-500 whitespace-nowrap">
          {p.server_time ? formatDateTimeSec(p.server_time) : "-"}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      title="Posisi Terkini GPS"
      columns={columns}
      data={paging.rows}
      loading={paging.loading}
      pageSize={ADMIN_PAGE_LIMIT}
      currentPage={paging.page}
      hasNext={paging.hasNext}
      maxVisitedPage={paging.maxVisitedPage}
      onPrev={paging.goPrev}
      onNext={paging.goNext}
      onPageJump={paging.goPage}
      onRefresh={paging.reload}
      emptyMessage="Belum ada data posisi"
    />
  );
}
