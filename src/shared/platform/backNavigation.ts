"use client";

import { App } from "@capacitor/app";
import { isNative } from "./device";
import { hapticLight } from "./haptics";
import { toast } from "react-hot-toast";

/**
 * Priority Order according to the ResuMentor Back Navigation Fix Implementation Guide:
 * 1. Close keyboard if open
 * 2. Close topmost overlay: bottom sheet, dialog, menu, picker, or expanded search
 * 3. Leave a special mode (multi-select, reorder, inline edit)
 * 4. Save unsaved drafts / state
 * 5. In-screen step history (section, step of a form, Edit or Preview mode)
 * 6. Pop the screen to the previous screen in the current tab's history
 * 7. If tab root & current tab is not first tab: switch to first tab (Home)
 * 8. If first tab's root: exit app (Android double-press prompt within 2 seconds)
 */
export enum BackPriority {
  OVERLAY = "overlay",       // 2. Modals, bottom sheets, dropdowns, menus
  SPECIAL_MODE = "special_mode", // 3. Inline edit, multi-select, reorder
  SAVE_DRAFT = "save_draft",   // 4. Force save / draft sync
  IN_SCREEN = "in_screen",    // 5. In-screen section/step history
  SCREEN_POP = "screen_pop",   // 6. Pushed screen pop
  TAB_ROOT = "tab_root",     // 7. Tab root / Home return / App exit
}

export type BackPriorityType = BackPriority | "overlay" | "special_mode" | "save_draft" | "in_screen" | "screen_pop" | "tab_root";

export interface BackHandler {
  id: string;
  priority: BackPriorityType;
  order?: number; // Higher number executed first within same priority
  handle: () => boolean | Promise<boolean>;
}

// Active handlers registry
const handlers: BackHandler[] = [];
let isInitialized = false;
let lastBackPressTime = 0;
const DOUBLE_PRESS_WINDOW_MS = 2000;

const PRIORITY_ORDER: Record<string, number> = {
  [BackPriority.OVERLAY]: 50,
  [BackPriority.SPECIAL_MODE]: 40,
  [BackPriority.SAVE_DRAFT]: 30,
  [BackPriority.IN_SCREEN]: 20,
  [BackPriority.SCREEN_POP]: 10,
  [BackPriority.TAB_ROOT]: 0,
};

/**
 * Register a back action handler in the shared registry.
 * Returns an unregister function.
 */
export function registerBackHandler(handler: BackHandler): () => void {
  handlers.push(handler);
  ensurePlatformListeners();
  
  // Keep browser history in sync for web popstate interception
  if (typeof window !== "undefined" && !isNative()) {
    try {
      window.history.pushState({ resumentorStep: handler.id }, "");
    } catch {
      // safe fallback
    }
  }

  return () => {
    const idx = handlers.findIndex((h) => h.id === handler.id);
    if (idx !== -1) {
      handlers.splice(idx, 1);
    }
  };
}

/**
 * Check if the on-screen software keyboard is currently active.
 * Closes the keyboard by blurring the active input element.
 * (Priority 1)
 */
function closeKeyboardIfOpen(): boolean {
  if (typeof document === "undefined") return false;
  const active = document.activeElement as HTMLElement | null;
  if (!active) return false;

  const isInput =
    active.tagName === "INPUT" ||
    active.tagName === "TEXTAREA" ||
    active.isContentEditable;

  if (isInput) {
    active.blur();
    return true;
  }
  return false;
}

/**
 * Single unified Back Handler Dispatcher.
 * Runs in exact priority order and stops at the first handler that succeeds.
 */
export async function dispatchBack(): Promise<boolean> {
  hapticLight();

  // Priority 1: Close keyboard if open
  if (closeKeyboardIfOpen()) {
    return true;
  }

  // Sort registered handlers by Priority (highest first), then by LIFO order
  const sorted = [...handlers].sort((a, b) => {
    const pDiff = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
    if (pDiff !== 0) return pDiff;
    return (b.order ?? 0) - (a.order ?? 0);
  });

  for (const item of sorted) {
    try {
      const result = await item.handle();
      if (result === true) {
        return true;
      }
    } catch (err: unknown) {
      console.warn(`[BackHandler ${item.id} error]:`, err);
    }
  }

  // Priority 8: Home tab root exit handling
  const now = Date.now();
  if (now - lastBackPressTime < DOUBLE_PRESS_WINDOW_MS) {
    if (isNative()) {
      App.exitApp();
      return true;
    }
    return false;
  } else {
    lastBackPressTime = now;
    toast("Press back again to exit", {
      icon: "🚪",
      duration: 2000,
      position: "bottom-center",
      style: {
        background: "#1e293b",
        color: "#ffffff",
        fontSize: "12px",
        borderRadius: "9999px",
        padding: "6px 14px",
      },
    });
    return true;
  }
}

/**
 * Ensure both Native (Capacitor App) and Web (window popstate) are listening
 * to the single unified back handler.
 */
export function ensurePlatformListeners(): void {
  if (isInitialized || typeof window === "undefined") return;
  isInitialized = true;

  // 1. Native Capacitor Android Hardware / Gesture Back Button
  // Intercept system back completely; dispatchBack handles in-app hierarchy and double-press app exit.
  // Never fallback to window.history.back() which bounces users back into login / auth / splash screens!
  if (isNative()) {
    App.addListener("backButton", async () => {
      await dispatchBack();
    });
  }

  // 2. Web Browser popstate & Mobile Browser Edge Swipes
  window.addEventListener("popstate", async () => {
    // Intercept back actions on web
    const handled = await dispatchBack();
    if (handled) {
      // Re-push state so subsequent back presses still get caught
      try {
        window.history.pushState({ resumentor: true }, "");
      } catch {
        // safe fallback
      }
    }
  });

  // Seed initial history state for web only (avoid polluting native webview)
  if (!isNative()) {
    try {
      window.history.pushState({ resumentorRoot: true }, "");
    } catch {
      // safe fallback
    }
  }
}

/**
 * React hook to register a back handler with automatic cleanup on unmount.
 */
import { useEffect, useRef } from "react";

export function useBackHandler(
  priority: BackPriorityType,
  handle: () => boolean | Promise<boolean>,
  deps: readonly unknown[] = []
) {
  const handleRef = useRef(handle);
  handleRef.current = handle;

  useEffect(() => {
    const id = `bh_${priority}_${Math.random().toString(36).slice(2, 9)}`;
    const unregister = registerBackHandler({
      id,
      priority,
      order: Date.now(),
      handle: () => handleRef.current(),
    });

    return () => {
      unregister();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priority, ...deps]);
}
