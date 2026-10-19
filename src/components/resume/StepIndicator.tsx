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

  // Auto-scroll active section chip into center view smoothly
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

  const currentIdx = Math.max(0, visibleSections.indexOf(activeSection));
  const progressPercent = Math.round(((currentIdx + 1) / visibleSections.length) * 100);

  return (
    <div className="w-full bg-white border-b border-gray-200/80 shadow-2xs relative">
      {/* Sleek 3px Material 3 Progress Bar */}
      <div className="w-full h-1 bg-gray-100 overflow-hidden">
        <div
          className="h-full bg-indigo-600 transition-all duration-300 ease-out rounded-r-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Horizontally scrollable step chips with edge fade */}
      <div className="relative w-full">
        <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-2 px-3 sm:px-6">
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
                  type="button"
                  onClick={() => onSelectSection(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 min-h-[36px] sm:min-h-[40px] border active:scale-95 shrink-0 ${
                    isActive
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : isCompleted
                      ? "bg-indigo-50/90 text-indigo-900 border-indigo-200 hover:bg-indigo-100"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center h-4 w-4 sm:h-4.5 sm:w-4.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-white text-indigo-600"
                        : isCompleted
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {!isActive && isCompleted ? (
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    ) : (
                      idx + 1
                    )}
                  </span>
                  <span className="truncate">{def.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Trailing edge fade indicator on mobile */}
        <div className="sm:hidden absolute right-0 top-1 bottom-0 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
