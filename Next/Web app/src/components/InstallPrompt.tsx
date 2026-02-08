"use client";

import { useEffect, useMemo, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const getIsIos = () =>
  typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

const getIsStandalone = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.navigator as any).standalone === true
  );
};

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const isiOS = useMemo(getIsIos, []);

  useEffect(() => {
    setIsInstalled(getIsStandalone());

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsOpen(true);
    };

    const installedHandler = () => {
      setIsInstalled(true);
      setIsOpen(false);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  if (isInstalled) return null;

  const canInstall = Boolean(deferredPrompt) || isiOS;

  if (!canInstall) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setIsOpen(false);
      return;
    }
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-slate-700"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        Install App
      </button>
      {isOpen && (
        <div className="absolute right-0 z-20 mt-3 w-80 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-xl">
          <h3 className="text-base font-semibold text-slate-900">Install FieldSync</h3>
          <p className="mt-2 text-xs text-slate-500">
            Add FieldSync to your home screen for full offline access and faster launches.
          </p>
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold">
                1
              </span>
              <p>{deferredPrompt ? "Confirm the install prompt." : "Open the Share menu."}</p>
            </div>
            <div className="flex gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold">
                2
              </span>
              <p>
                {deferredPrompt
                  ? "Pin FieldSync for quick access."
                  : "Tap Add to Home Screen to install."}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              onClick={() => setIsOpen(false)}
            >
              Not now
            </button>
            <button
              type="button"
              className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-400"
              onClick={handleInstall}
            >
              {deferredPrompt ? "Install now" : "Got it"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
