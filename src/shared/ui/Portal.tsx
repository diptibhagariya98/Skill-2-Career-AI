"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export interface PortalProps {
  children: React.ReactNode;
}

/**
 * Universal SSR-safe Portal for mounting full-screen modals, bottom sheets,
 * and high-priority overlays directly to document.body.
 *
 * This completely isolates the overlay from any ancestor CSS containing blocks
 * (e.g. overflow-y-auto scrollers, animate-fade-in transforms, or filters)
 * ensuring edge-to-edge covering of the physical viewport.
 */
export function Portal({ children }: PortalProps): React.ReactElement | null {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}

export default Portal;
