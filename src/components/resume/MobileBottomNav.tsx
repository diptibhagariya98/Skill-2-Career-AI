"use client";

import React from "react";
import { Edit3, Eye, Download } from "lucide-react";

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
    <div className="lg:hidden fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-md border border-gray-200/90 px-3 py-1 flex items-center gap-1 rounded-full shadow-xl">
      <button
        onClick={() => onChangeTab("edit")}
        className={`flex flex-col items-center justify-center min-h-[44px] min-w-[64px] rounded-lg transition-colors ${
          activeTab === "edit" ? "text-indigo-600 font-bold" : "text-gray-500 hover:text-gray-800"
        }`}
      >
        <Edit3 className="h-5 w-5 mb-0.5" />
        <span className="text-[11px]">Edit</span>
      </button>

      <button
        onClick={() => onChangeTab("preview")}
        className={`flex flex-col items-center justify-center min-h-[44px] min-w-[64px] rounded-lg transition-colors ${
          activeTab === "preview" ? "text-indigo-600 font-bold" : "text-gray-500 hover:text-gray-800"
        }`}
      >
        <Eye className="h-5 w-5 mb-0.5" />
        <span className="text-[11px]">Preview</span>
      </button>

      <button
        onClick={onExport}
        className="flex flex-col items-center justify-center min-h-[44px] min-w-[64px] rounded-lg text-emerald-600 hover:text-emerald-700 transition-colors font-bold"
      >
        <Download className="h-5 w-5 mb-0.5" />
        <span className="text-[11px]">Export</span>
      </button>
    </div>
  );
}
