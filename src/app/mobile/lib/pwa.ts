"use client";

import { useCallback, useEffect, useState } from "react";
import { isStandalone } from "./mobile-detect";

/** Event `beforeinstallprompt` (belum ada di tipe DOM standar). */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "mobile_pwa_dismissed";

/**
 * useInstallPrompt — mengelola prompt "Pasang ke layar utama".
 *
 * - Android/Chrome: menangkap `beforeinstallprompt` (di-preventDefault) supaya
 *   banner bisa ditampilkan kapan pun lewat tombol, bukan popup bawaan.
 * - iOS: tidak ada event ini; `canPrompt` tetap false dan UI menampilkan panduan.
 * - `dismissed` disimpan permanen supaya banner tidak muncul lagi.
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    setReady(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    return choice.outcome === "accepted";
  }, [deferred]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }, []);

  return { ready, canPrompt: !!deferred, installed, dismissed, promptInstall, dismiss };
}
