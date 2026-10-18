"use client";

import React, { useEffect, useRef } from "react";
import { SectionKey } from "@/types/resume";
import { SECTION_REGISTRY } from "@/lib/resume/registry";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  sectionOrder: SectionKey[];
  sectionVisibility: Record<SectionKey, boolean>;
  activeSection: SectionKey;
  onSelectSection: (section: SectionKey) => void;
  completionMap: Record<SectionKey, boolean>;
}

export default function StepIndicator({
  sectionOrder,
  sectionVisibility,
  activeSection,
  onSelectSection,
  completionMap,
}: StepIndicatorProps) {
  const visibleSections = sectionOrder.filter((key) => sectionVisibility[key] !== false);
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Auto-scroll active section chip into view
  useEffect(() => {
    const activeChip = chipRefs.current[activeSection];
    if (activeChip) {
      activeChip.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeSection]);

  return (
    <div className="w-full bg-white border-b border-gray-150 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-2 sm:py-2.5 px-2.5 sm:px-4 shadow-xs">
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
        {visibleSections.map((key, idx) => {
          const def = SECTION_REGISTRY[key];
          if (!def) return null;
          const isActive = activeSection === key;
          const isCompleted = completionMap[key];

          return (
            <button
              key={key}
              ref={(el) => {
                chipRefs.current[key] = el;
              }}
              onClick={() => onSelectSection(key)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 min-h-[38px] sm:min-h-[42px] border ${
                isActive
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                  : isCompleted
                  ? "bg-indigo-50/80 text-indigo-900 border-indigo-200 hover:bg-indigo-100"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <span
                className={`flex items-center justify-center h-4.5 w-4.5 sm:h-5 sm:w-5 rounded-full text-[10px] sm:text-[11px] font-bold ${
                  isActive
                    ? "bg-white text-indigo-600"
                    : isCompleted
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {isCompleted ? <Check className="h-3 w-3 stroke-[3]" /> : idx + 1}
              </span>
              <span className="truncate">{def.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
