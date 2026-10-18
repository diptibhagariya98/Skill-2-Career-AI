"use client";

import { useState, useEffect } from "react";
import { Network, ConnectionStatus } from "@capacitor/network";
import type { PluginListenerHandle } from "@capacitor/core";
import { isNative } from "./device";

export interface NetworkState {
  connected: boolean;
  connectionType: string;
}

/**
 * React hook tracking online/offline status with live native listeners.
 * Works uniformly across Capacitor Android/iOS and standard browsers.
 */
export function useNetworkStatus(): NetworkState {
  const [status, setStatus] = useState<NetworkState>({
    connected: typeof navigator !== "undefined" ? navigator.onLine : true,
    connectionType: "unknown",
  });

  useEffect(() => {
    let isMounted = true;

    // Initial check
    async function checkInitialStatus() {
      if (isNative()) {
        try {
          const current = await Network.getStatus();
          if (isMounted) {
            setStatus({
              connected: current.connected,
              connectionType: current.connectionType,
            });
          }
        } catch {
          // Fallback to navigator
        }
      } else if (typeof navigator !== "undefined") {
        setStatus({
          connected: navigator.onLine,
          connectionType: "web",
        });
      }
    }

    checkInitialStatus();

    // Listeners
    let networkListener: PluginListenerHandle | null = null;

    if (isNative()) {
      Network.addListener("networkStatusChange", (change: ConnectionStatus) => {
        if (isMounted) {
          setStatus({
            connected: change.connected,
            connectionType: change.connectionType,
          });
        }
      }).then((listener) => {
        networkListener = listener;
      });
    } else if (typeof window !== "undefined") {
      const handleOnline = () => {
        if (isMounted) setStatus({ connected: true, connectionType: "web" });
      };
      const handleOffline = () => {
        if (isMounted) setStatus({ connected: false, connectionType: "none" });
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        isMounted = false;
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        if (networkListener) networkListener.remove();
      };
    }

    return () => {
      isMounted = false;
      if (networkListener) networkListener.remove();
    };
  }, []);

  return status;
}
