"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { isNative } from "./device";

export interface BackButtonOptions {
  /**
   * Custom back action handler.
   * Return true to consume the back event (preventing app exit).
   * Return false to let the default back behavior / exit proceed.
   */
  onBack?: () => boolean | void;
}

/**
 * Register a listener for the native Android physical/gesture back button.
 */
export function useAndroidBackButton({ onBack }: BackButtonOptions = {}) {
  useEffect(() => {
    if (!isNative()) return;

    let listenerHandle: any = null;

    App.addListener("backButton", ({ canGoBack }) => {
      if (onBack) {
        const handled = onBack();
        if (handled === true) {
          return;
        }
      }

      if (canGoBack && typeof window !== "undefined") {
        window.history.back();
      } else {
        App.exitApp();
      }
    }).then((handle) => {
      listenerHandle = handle;
    });

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [onBack]);
}
