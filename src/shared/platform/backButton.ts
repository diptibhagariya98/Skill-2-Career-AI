"use client";

import { useEffect } from "react";
import { ensurePlatformListeners, registerBackHandler, BackPriority } from "./backNavigation";

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
 * Harmonized with the unified prioritized back navigation registry.
 */
export function useAndroidBackButton({ onBack }: BackButtonOptions = {}) {
  useEffect(() => {
    // Ensure the unified platform listeners are active
    ensurePlatformListeners();

    if (!onBack) return;

    return registerBackHandler({
      id: `legacy_back_${Math.random().toString(36).slice(2, 9)}`,
      priority: BackPriority.SCREEN_POP,
      order: Date.now(),
      handle: () => {
        const handled = onBack();
        return handled === true;
      },
    });
  }, [onBack]);
}
