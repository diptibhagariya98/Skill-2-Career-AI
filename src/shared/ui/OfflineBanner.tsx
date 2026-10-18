"use client";

import React, { useState, useEffect } from "react";
import { useNetworkStatus } from "../platform/network";
import { WifiOff, Wifi, X } from "lucide-react";

export function OfflineBanner() {
  const { connected } = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!connected) {
      setWasOffline(true);
      setDismissed(false);
      setIsFadingOut(false);

      // Auto-hide and fade up after 4.5 seconds
      const fadeTimer = setTimeout(() => {
        setIsFadingOut(true);
        const hideTimer = setTimeout(() => {
          setDismissed(true);
          setIsFadingOut(false);
        }, 500);
        return () => clearTimeout(hideTimer);
      }, 4500);

      return () => clearTimeout(fadeTimer);
    } else if (wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [connected, wasOffline, mounted]);

  if (!mounted) return null;

  if (!connected && !dismissed) {
    return (
      <aside
        role="status"
        aria-live="polite"
        className={`w-full bg-slate-900 border-b border-slate-800 text-amber-300 text-xs px-4 py-2 flex items-center justify-between gap-3 shadow-sm z-50 sticky top-0 transition-all duration-500 ease-in-out ${
          isFadingOut
            ? "opacity-0 -translate-y-full max-h-0 py-0 overflow-hidden"
            : "opacity-100 translate-y-0 max-h-16"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <WifiOff className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="truncate font-medium text-[11px] sm:text-xs">
            Offline mode: Local tools remain active.
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsFadingOut(true);
            setTimeout(() => setDismissed(true), 300);
          }}
          aria-label="Dismiss offline banner"
          className="p-1 text-slate-400 hover:text-white rounded-md transition min-h-[32px] min-w-[32px] flex items-center justify-center shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </aside>
    );
  }

  if (showReconnected) {
    return (
      <aside
        role="status"
        aria-live="polite"
        className="w-full bg-emerald-700 border-b border-emerald-600 text-white text-xs px-4 py-2 flex items-center justify-center gap-2 shadow-sm z-50 sticky top-0 animate-fade-in transition-all duration-500"
      >
        <Wifi className="h-4 w-4 text-white shrink-0" />
        <span className="font-semibold text-[11px] sm:text-xs">
          Back online! Changes are syncing.
        </span>
      </aside>
    );
  }

  return null;
}

export default OfflineBanner;

