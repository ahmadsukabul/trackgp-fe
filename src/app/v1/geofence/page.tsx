"use client";

import { useCallback, useEffect, useState } from "react";
import CrudPage, { type Column } from "../components/CrudPage";
import ConfirmModal from "../components/ConfirmModal";
import GeofenceMapModal from "../components/GeofenceMapModal";
import { useBusiness } from "../lib/BusinessContext";
import { MENU } from "../lib/menu";
import { getApiErrorMessage } from "../lib/api";
import {
  geofenceList,
  geofenceDelete,
  geofenceEvents,
  type Geofence,
  type GPSEvent,
} from "../lib/client";
import { LogIn, LogOut, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { formatDateTimeSec } from "@/lib/format-date";

/** Hitung jumlah titik dari polygon_coords JSON (aman terhadap data rusak). */
function countPoints(polygonCoords: string): number {
  if (!polygonCoords) return 0;
  try {
    const arr = JSON.parse(polygonCoords);
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}

/** Ambil nama geofence dari attributes_json event (fallback "-"). */
function fenceName(attributesJson: string): string {
  if (!attributesJson) return "-";
  try {
    const attrs = JSON.parse(attributesJson);
    return attrs?.fence_name || "-";
  } catch {
    return "-";
  }
}

export default function GeofencePage() {
  const { can } = useBusiness();
  const allowed = can(MENU.geofence);

  const [rows, setRows] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Geofence | null>(null);

  const [toDelete, setToDelete] = useState<Geofence | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Log masuk/keluar area
  const [showLog, setShowLog] = useState(true);
  const [events, setEvents] = useState<GPSEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState("");

  const load = useCallback(async () => {
    if (!allowed) {
      setLoading(false);
      setError("Akun ini tidak punya akses ke menu Geofence.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await geofenceList();
    if (res.status === 1 && Array.isArray(res.data)) setRows(res.data);
    else setError(getApiErrorMessage(res, "Gagal memuat data geofence."));
    setLoading(false);
  }, [allowed]);

  const loadEvents = useCallback(async () => {
    if (!allowed) return;
    setEventsLoading(true);
    setEventsError("");
    const res = await geofenceEvents({ limit: 50 });
    if (res.status === 1 && Array.isArray(res.data)) setEvents(res.data);
    else setEventsError(getApiErrorMessage(res, "Gagal memuat log geofence."));
    setEventsLoading(false);
  }, [allowed]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(g: Geofence) {
    setEditing(g);
    setModalOpen(true);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const res = await geofenceDelete(toDelete.geofence_id);
    setDeleting(false);
    setToDelete(null);
    if (res.status === 1) {
      await load();
      await loadEvents();
    } else setError(getApiErrorMessage(res, "Gagal menghapus geofence."));
  }

  const columns: Column<Geofence>[] = [
    {
      key: "name",
      label: "Nama",
      render: (g) => (
        <div>
          <p className="font-semibold" style={{ color: "var(--v1-ink)" }}>{g.name}</p>
          <p className="text-[12px]" style={{ color: "var(--v1-ink-faint)" }}>{g.description || "-"}</p>
        </div>
      ),
    },
    {
      key: "area_type",
      label: "Tipe",
      render: (g) => (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
          style={{ background: "var(--v1-surface-raised)", color: "var(--v1-ink-muted)" }}
        >
          {g.area_type || "polygon"}
        </span>
      ),
    },
    {
      key: "color",
      label: "Warna",
      render: (g) => (
        <span className="inline-flex items-center gap-2 text-[12px]" style={{ fontFamily: "var(--v1-font-display)", color: "var(--v1-ink-muted)" }}>
          <span
            className="w-3.5 h-3.5 rounded-full"
            style={{ backgroundColor: g.color || "#FF0000", border: "1px solid var(--v1-border)" }}
          />
          {g.color || "-"}
        </span>
      ),
    },
    {
      key: "points",
      label: "Titik",
      render: (g) => (
        <span style={{ color: "var(--v1-ink-muted)" }}>{countPoints(g.polygon_coords)}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (g) => (
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
          style={{
            background: g.status === 1 ? "var(--v1-success-bg)" : "var(--v1-surface-raised)",
            color: g.status === 1 ? "var(--v1-success)" : "var(--v1-ink-faint)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: g.status === 1 ? "var(--v1-success)" : "var(--v1-ink-faint)" }}
          />
          {g.status === 1 ? "aktif" : "nonaktif"}
        </span>
      ),
    },
  ];

  return (
    <>
      <CrudPage<Geofence>
        title="Geofence"
        description="Area virtual untuk memantau masuk/keluar zona kendaraan di bisnis aktif."
        columns={columns}
        rows={rows}
        loading={loading}
        error={allowed ? error : ""}
        searchPlaceholder="Cari nama geofence..."
        addLabel="Tambah Geofence"
        canAdd={allowed}
        rowKey={(g) => g.geofence_id}
        onRefresh={load}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={(g) => setToDelete(g)}
      />

      <GeofenceMapModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        editGeofence={editing}
        onSaved={load}
      />

      {/* Log masuk/keluar area */}
      {allowed && (
        <section
          className="mt-5 rounded-2xl overflow-hidden"
          style={{ background: "var(--v1-surface)", border: "1px solid var(--v1-border)" }}
        >
          <button
            type="button"
            onClick={() => setShowLog((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3"
          >
            <span className="flex items-center gap-2 text-[14px] font-bold" style={{ color: "var(--v1-ink)", fontFamily: "var(--v1-font-display)" }}>
              Log Masuk / Keluar Area
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
                style={{ background: "var(--v1-surface-raised)", color: "var(--v1-ink-muted)" }}
              >
                {events.length}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); void loadEvents(); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); void loadEvents(); } }}
                className="p-1.5 rounded-lg"
                style={{ color: "var(--v1-ink-faint)" }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${eventsLoading ? "animate-spin" : ""}`} />
              </span>
              {showLog ? (
                <ChevronUp className="w-4 h-4" style={{ color: "var(--v1-ink-faint)" }} />
              ) : (
                <ChevronDown className="w-4 h-4" style={{ color: "var(--v1-ink-faint)" }} />
              )}
            </span>
          </button>

          {showLog && (
            <div style={{ borderTop: "1px solid var(--v1-border-subtle)" }}>
              {eventsError ? (
                <p className="px-4 py-3 text-[12px]" style={{ color: "var(--v1-danger)" }}>{eventsError}</p>
              ) : events.length === 0 ? (
                <p className="px-4 py-6 text-center text-[12px]" style={{ color: "var(--v1-ink-faint)" }}>
                  {eventsLoading ? "Memuat..." : "Belum ada kendaraan yang masuk/keluar area."}
                </p>
              ) : (
                <ul className="divide-y" style={{ borderColor: "var(--v1-border-subtle)" }}>
                  {events.map((ev) => {
                    const isEnter = ev.event_type === "geofenceEnter";
                    return (
                      <li key={ev.event_id} className="flex items-center gap-3 px-4 py-2.5">
                        <span
                          className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full"
                          style={{
                            background: isEnter ? "var(--v1-success-bg)" : "var(--v1-danger-bg)",
                            color: isEnter ? "var(--v1-success)" : "var(--v1-danger)",
                          }}
                        >
                          {isEnter ? <LogIn className="w-3.5 h-3.5" /> : <LogOut className="w-3.5 h-3.5" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] truncate" style={{ color: "var(--v1-ink)" }}>
                            <span className="font-semibold">{fenceName(ev.attributes_json)}</span>
                            <span style={{ color: "var(--v1-ink-muted)" }}>
                              {" — "}
                              {isEnter ? "masuk" : "keluar"}
                            </span>
                          </p>
                          <p className="text-[11px] truncate" style={{ color: "var(--v1-ink-faint)" }}>
                            {ev.device_id}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px]" style={{ color: "var(--v1-ink-faint)" }}>
                          {formatDateTimeSec(ev.event_time)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </section>
      )}

      <ConfirmModal
        open={!!toDelete}
        danger
        title="Hapus geofence?"
        message={`Geofence "${toDelete?.name}" akan dihapus permanen dari bisnis ini.`}
        confirmLabel="Hapus"
        submitting={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
