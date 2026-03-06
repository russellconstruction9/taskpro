"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true); // start hidden, check after mount

  useEffect(() => {
    // Check if dismissed recently
    const dismissedAt = localStorage.getItem("pwa-install-dismissed");
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) return;
    }

    // Check if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // @ts-expect-error - iOS Safari
    if (window.navigator.standalone) return;

    // Detect iOS Safari (not installed)
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches;
    if (isIos && !isInStandaloneMode) {
      setShowIosInstructions(true);
      setIsDismissed(false);
      return;
    }

    // Listen for Chrome/Android install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsDismissed(false);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
    setIsDismissed(true);
    setInstallPrompt(null);
    setShowIosInstructions(false);
  }

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setIsDismissed(true);
      setInstallPrompt(null);
    }
  }

  if (isDismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-amber-200 bg-amber-50 p-4 shadow-lg">
      <div className="mx-auto flex max-w-lg items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber-600">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-900">Install TaskPro</p>
          {showIosInstructions ? (
            <p className="mt-0.5 text-xs text-amber-700">
              Tap the <strong>Share</strong> button in Safari, then <strong>Add to Home Screen</strong> for the best experience.
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-amber-700">
              Install for quick access — works offline and feels like a native app.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!showIosInstructions && (
            <button
              onClick={install}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
            >
              Install
            </button>
          )}
          <button
            onClick={dismiss}
            className="rounded-lg p-1.5 text-amber-600 transition-colors hover:bg-amber-100"
            aria-label="Dismiss"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
