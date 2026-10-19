"use client";

import React, { useRef, useState } from "react";
import { ResumeData, ResumeRevision } from "@/types/resume";
import {
  exportResumeDataFile,
  importResumeDataFile,
  loadRevisionHistory,
  restoreRevision,
  deleteAllLocalResumeData,
} from "@/lib/resume/storage";
import { createSampleResume, createEmptyResume } from "@/lib/resume/schema";
import { toast } from "react-hot-toast";
import {
  X,
  Download,
  Upload,
  History,
  Trash2,
  Sparkles,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

interface DataManagementModalProps {
  resume: ResumeData;
  userId?: string;
  user?: { name?: string; email?: string } | null;
  onUpdateResume: (data: ResumeData) => void;
  onClose: () => void;
}

export default function DataManagementModal({
  resume,
  userId,
  user,
  onUpdateResume,
  onClose,
}: DataManagementModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [revisions, setRevisions] = useState<ResumeRevision[]>(() => loadRevisionHistory(userId));
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleExportJSON = async () => {
    try {
      const res = await exportResumeDataFile(resume);
      if (res.ok && res.delivered) {
        toast.success(res.message);
      } else if (!res.ok) {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to export data file.");
    }
  };

  const handleImportFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importResumeDataFile(file, userId);
      onUpdateResume(imported);
      setRevisions(loadRevisionHistory(userId));
      toast.success("Resume data imported successfully!");
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to import JSON file.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRestore = (rev: ResumeRevision) => {
    try {
      const restored = restoreRevision(rev, userId);
      onUpdateResume(restored);
      toast.success("Revision restored.");
      onClose();
    } catch {
      toast.error("Failed to restore revision.");
    }
  };

  const handleLoadSample = () => {
    const sample = createSampleResume();
    onUpdateResume(sample);
    toast.success("Loaded sample resume (Alex Morgan).");
    onClose();
  };

  const handleClearAll = () => {
    const empty = createEmptyResume({ name: user?.name, email: user?.email });
    onUpdateResume(empty);
    toast.success("Resume fields cleared.");
    onClose();
  };

  const handleDeleteAll = () => {
    deleteAllLocalResumeData(userId);
    const empty = createEmptyResume({ name: user?.name, email: user?.email });
    onUpdateResume(empty);
    toast.success("All local resume data and revisions deleted.");
    setShowConfirmDelete(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-gray-900">Data Management & Portability</h3>
            <p className="text-xs text-gray-500">
              Export portable data, import files, or restore from 10 recent revisions.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quick Actions: Export / Import */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleExportJSON}
              className="flex items-center justify-center gap-2 p-3 bg-indigo-50 text-indigo-700 font-semibold rounded-xl text-xs hover:bg-indigo-100 transition min-h-[48px]"
            >
              <Download className="h-4 w-4" /> Export Data (JSON)
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 p-3 bg-emerald-50 text-emerald-700 font-semibold rounded-xl text-xs hover:bg-emerald-100 transition min-h-[48px]"
            >
              <Upload className="h-4 w-4" /> Import Data (JSON)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImportFileSelected}
            />
          </div>

          {/* Sample Resume / Reset */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleLoadSample}
              className="flex items-center justify-center gap-2 p-3 bg-purple-50 text-purple-700 font-semibold rounded-xl text-xs hover:bg-purple-100 transition min-h-[44px]"
            >
              <Sparkles className="h-4 w-4" /> Load Sample Resume
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              className="flex items-center justify-center gap-2 p-3 bg-gray-100 text-gray-700 font-semibold rounded-xl text-xs hover:bg-gray-200 transition min-h-[44px]"
            >
              <RotateCcw className="h-4 w-4" /> Clear Fields
            </button>
          </div>

          {/* Revision History */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
              <History className="h-4 w-4 text-indigo-600" />
              <span>Revision History (Last 10 autosaves)</span>
            </div>

            {revisions.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No previous revisions recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {revisions.map((rev, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-xs border border-gray-200"
                  >
                    <div>
                      <span className="font-semibold text-gray-800">
                        {rev.data.meta.title || "Untitled Resume"}
                      </span>
                      <p className="text-[10px] text-gray-400">
                        {new Date(rev.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestore(rev)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete All Data */}
          <div className="pt-2 border-t border-gray-100">
            {!showConfirmDelete ? (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" /> Delete all my saved data
              </button>
            ) : (
              <div className="bg-red-50 p-4 rounded-xl border border-red-200 space-y-2">
                <p className="text-xs text-red-800 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-red-600" /> Are you sure?
                </p>
                <p className="text-xs text-red-700">
                  This will permanently clear local storage and all 10 saved revisions.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDeleteAll}
                    className="bg-red-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-red-700"
                  >
                    Yes, Delete Everything
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(false)}
                    className="bg-gray-200 text-gray-800 font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
