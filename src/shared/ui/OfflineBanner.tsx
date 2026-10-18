"use client";

import React, { useState, useEffect } from "react";
import { useNetworkStatus } from "../platform/network";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineBanner() {
  const { connected } = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!connected) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [connected, wasOffline]);

  if (!connected) {
    return (
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 animate-bounce-short">
        <div className="bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg border border-slate-700/60 flex items-center space-x-2">
          <WifiOff className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
          <span>You&apos;re offline. Local tools (Resume &amp; Quizzes) still work!</span>
        </div>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
        <div className="bg-emerald-600/90 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg border border-emerald-500/60 flex items-center space-x-2">
          <Wifi className="h-3.5 w-3.5 text-white" />
          <span>Back online!</span>
        </div>
      </div>
    );
  }

  return null;
}

export default OfflineBanner;
