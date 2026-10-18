"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface KeyboardState {
  isKeyboardOpen: boolean;
  keyboardHeight: number;
}

const KeyboardContext = createContext<KeyboardState>({
  isKeyboardOpen: false,
  keyboardHeight: 0,
});

/**
 * Checks if an element is an interactive text input that invokes the software keyboard.
 */
function isTextInput(element: Element | null): boolean {
  if (!element || !(element instanceof HTMLElement)) return false;
  const tagName = element.tagName.toLowerCase();
  if (tagName === "textarea") return true;
  if (element.isContentEditable) return true;
  if (tagName === "input") {
    const type = (element as HTMLInputElement).type?.toLowerCase();
    const nonTextTypes = [
      "checkbox",
      "radio",
      "button",
      "submit",
      "reset",
      "file",
      "image",
      "range",
      "color",
      "hidden",
    ];
    return !nonTextTypes.includes(type);
  }
  return false;
}

/**
 * Global Keyboard Provider that tracks software keyboard visibility across all screens
 * and applies a global `data-keyboard-open` attribute to `document.body`.
 */
export function KeyboardProvider({ children }: { children: React.ReactNode }) {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isKeyboardOpen: false,
    keyboardHeight: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    let initialInnerHeight = window.innerHeight;

    const updateKeyboardState = (isOpen: boolean, height = 0) => {
      setKeyboardState({ isKeyboardOpen: isOpen, keyboardHeight: height });
      if (typeof document !== "undefined" && document.body) {
        if (isOpen) {
          document.body.setAttribute("data-keyboard-open", "true");
          document.body.classList.add("keyboard-open");
        } else {
          document.body.setAttribute("data-keyboard-open", "false");
          document.body.classList.remove("keyboard-open");
        }
      }
    };

    const evaluateKeyboard = () => {
      const isTouchDevice =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia("(pointer: coarse)").matches;

      // On non-touch devices (desktops), virtual keyboard does not appear
      if (!isTouchDevice) {
        updateKeyboardState(false, 0);
        return;
      }

      const activeEl = document.activeElement;
      const inputFocused = isTextInput(activeEl);

      // 1. Visual Viewport detection (primary standard for mobile browsers/WebViews)
      if (window.visualViewport) {
        const vvHeight = window.visualViewport.height;
        const currentInnerHeight = window.innerHeight;
        const baseline = Math.max(initialInnerHeight, currentInnerHeight);
        const heightDifference = baseline - vvHeight;

        // On mobile, keyboard occupies >= 150px
        if (heightDifference > 140) {
          updateKeyboardState(true, Math.round(heightDifference));
          return;
        }
      }

      // 2. Fallback to active text input focus on touch devices
      if (inputFocused) {
        updateKeyboardState(true, 0);
        return;
      }

      // Otherwise keyboard is closed
      updateKeyboardState(false, 0);
    };

    // Keep baseline in sync on orientation change
    const handleOrientationChange = () => {
      setTimeout(() => {
        initialInnerHeight = window.innerHeight;
        evaluateKeyboard();
      }, 300);
    };

    // Attach listeners
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", evaluateKeyboard);
      window.visualViewport.addEventListener("scroll", evaluateKeyboard);
    }
    window.addEventListener("resize", evaluateKeyboard);
    window.addEventListener("orientationchange", handleOrientationChange);
    document.addEventListener("focusin", evaluateKeyboard);
    document.addEventListener("focusout", () => {
      // Small timeout to allow next element to gain focus if switching fields
      setTimeout(evaluateKeyboard, 80);
    });

    // Initial evaluation
    evaluateKeyboard();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", evaluateKeyboard);
        window.visualViewport.removeEventListener("scroll", evaluateKeyboard);
      }
      window.removeEventListener("resize", evaluateKeyboard);
      window.removeEventListener("orientationchange", handleOrientationChange);
      document.removeEventListener("focusin", evaluateKeyboard);
      document.removeEventListener("focusout", evaluateKeyboard);
    };
  }, []);

  return (
    <KeyboardContext.Provider value={keyboardState}>
      {children}
    </KeyboardContext.Provider>
  );
}

/**
 * Hook to consume global keyboard state in any component across the app.
 */
export function useKeyboard(): KeyboardState {
  return useContext(KeyboardContext);
}

export function useIsKeyboardOpen(): boolean {
  return useContext(KeyboardContext).isKeyboardOpen;
}
