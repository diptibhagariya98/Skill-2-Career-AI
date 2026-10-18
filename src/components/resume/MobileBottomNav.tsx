"use client";

import React from "react";
import { Edit3, Eye, Download } from "lucide-react";
import { hapticLight } from "@/shared/platform";

export type MobileTab = "edit" | "preview" | "export";

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onChangeTab: (tab: MobileTab) => void;
  onExport: () => void;
}

export default function MobileBottomNav({
  activeTab,
  onChangeTab,
  onExport,
}: MobileBottomNavProps) {
  return (
    <div className="lg:hidden fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-md border border-gray-200/90 p-1.5 flex items-center gap-1.5 rounded-full shadow-2xl">
      <button
        onClick={() => {
          hapticLight();
          onChangeTab("edit");
        }}
        className={`flex items-center gap-1.5 min-h-[48px] px-4 rounded-full transition-all active:scale-95 ${
          activeTab === "edit"
            ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        <Edit3 className="h-4.5 w-4.5" />
        <span className="text-xs">Edit</span>
      </button>

      <button
        onClick={() => {
          hapticLight();
          onChangeTab("preview");
        }}
        className={`flex items-center gap-1.5 min-h-[48px] px-4 rounded-full transition-all active:scale-95 ${
          activeTab === "preview"
            ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        <Eye className="h-4.5 w-4.5" />
        <span className="text-xs">Preview</span>
      </button>

      <button
        onClick={() => {
          hapticLight();
          onExport();
        }}
        className="flex items-center gap-1.5 min-h-[48px] px-4 rounded-full text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all font-bold active:scale-95 border border-emerald-200"
      >
        <Download className="h-4.5 w-4.5" />
        <span className="text-xs">Export</span>
      </button>
    </div>
  );
}
