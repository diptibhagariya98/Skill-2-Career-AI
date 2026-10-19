"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { hapticLight, useBackHandler, BackPriority } from "@/shared/platform";

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  /** Optional custom header right action or close icon (default true) */
  showCloseButton?: boolean;
  /** Max height class: default 'max-h-[85vh]' */
  maxHeightClass?: string;
  /** Content extra classes */
  className?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  maxHeightClass = "max-h-[85vh]",
  className = "",
}: BottomSheetProps) {
  const touchStartYRef = useRef<number | null>(null);
  const touchCurrentYRef = useRef<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Handle Android hardware / gesture back button to close sheet
  useBackHandler(
    BackPriority.OVERLAY,
    () => {
      if (isOpen) {
        onClose();
        return true;
      }
      return false;
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Touch handlers for swipe down to dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentYRef.current = e.touches[0].clientY;
    if (touchStartYRef.current !== null && sheetRef.current) {
      const deltaY = touchCurrentYRef.current - touchStartYRef.current;
      if (deltaY > 0) {
        sheetRef.current.style.transform = `translateY(${deltaY}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchStartYRef.current !== null && touchCurrentYRef.current !== null) {
      const deltaY = touchCurrentYRef.current - touchStartYRef.current;
      if (deltaY > 90) {
        hapticLight();
        onClose();
      } else if (sheetRef.current) {
        sheetRef.current.style.transform = "";
      }
    }
    touchStartYRef.current = null;
    touchCurrentYRef.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center">
      {/* 40-50% Black Scrim Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs transition-opacity duration-200 animate-fade-in"
        onClick={() => {
          hapticLight();
          onClose();
        }}
        aria-hidden="true"
      />

      {/* Sheet Container: Mobile Bottom Sheet / Desktop Centered Dialog */}
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative z-10 w-full bg-white rounded-t-3xl md:rounded-2xl shadow-2xl border-t md:border border-gray-150 flex flex-col overflow-hidden transition-transform duration-200 md:max-w-xl md:w-full ${maxHeightClass} pb-[calc(1rem+env(safe-area-inset-bottom,0px))] md:pb-4 ${className}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Top Drag Handle (Mobile only) */}
        <div className="md:hidden pt-3 pb-1 cursor-grab active:cursor-grabbing w-full flex items-center justify-center">
          <div className="w-12 h-1.5 bg-gray-300 hover:bg-gray-400 rounded-full transition-colors" />
        </div>

        {/* Header Bar */}
        {(title || showCloseButton) && (
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div className="font-bold text-base text-gray-900 truncate pr-2">
              {title}
            </div>
            {showCloseButton && (
              <button
                onClick={() => {
                  hapticLight();
                  onClose();
                }}
                className="p-2 -mr-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 min-h-[48px] min-w-[48px] flex items-center justify-center transition"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="px-5 py-4 overflow-y-auto overscroll-contain flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

export default BottomSheet;
