"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";

export type ToastType = "success" | "error";

export interface ToastState {
  message: string;
  type: ToastType;
}

/**
 * useToast — state + auto-dismiss untuk notifikasi kecil di pojok kanan bawah.
 * Dipakai bersama komponen <Toast />.
 */
export function useToast(duration = 3000) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({ message, type });
      timerRef.current = setTimeout(() => setToast(null), duration);
    },
    [duration],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { toast, showToast };
}

/** Toast — viewport notifikasi (fixed pojok kanan bawah). */
export function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[60] animate-[slideUp_300ms_ease-out]">
      <div
        className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium text-white ${
          toast.type === "success" ? "bg-green-600" : "bg-red-600"
        }`}
      >
        {toast.type === "success" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
        {toast.message}
      </div>
    </div>
  );
}
