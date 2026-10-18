"use client";

import React from "react";
import { CertificationItem } from "@/types/resume";
import { normalizeUrl } from "@/lib/resume/validation";
import { Plus, Trash2, Award } from "lucide-react";

interface CertificationsSectionProps {
  items: CertificationItem[];
  onChange: (updated: CertificationItem[]) => void;
}

export default function CertificationsSection({ items, onChange }: CertificationsSectionProps) {
  const handleAddItem = () => {
    const newItem: CertificationItem = {
      id: `cert_${Date.now()}`,
      name: "",
      issuer: "",
      issueDate: "",
      expiryDate: "",
      credentialId: "",
      credentialUrl: "",
    };
    onChange([...items, newItem]);
  };

  const handleUpdateItem = (id: string, updates: Partial<CertificationItem>) => {
    onChange(items.map((it) => (it.id === id ? { ...it, ...updates } : it)));
  };

  const handleDeleteItem = (id: string) => {
    onChange(items.filter((it) => it.id !== id));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Certifications & Licences</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
            Industry credentials, professional certificates, and verified accreditations.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddItem}
          className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 sm:px-4 py-2 rounded-xl transition min-h-[38px] sm:min-h-[44px] shrink-0 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Add Certification
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 sm:py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 p-4 sm:p-6">
          <Award className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-700">No certifications added yet</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            Add AWS, Google Cloud, Cisco, Scrum, or other verified certificates.
          </p>
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" /> Add Certification
          </button>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {items.map((cert) => (
            <div key={cert.id} className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs space-y-3 sm:space-y-4">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4">
                  <div>
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
                      Certificate Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., AWS Certified Solutions Architect"
                      value={cert.name}
                      onChange={(e) => handleUpdateItem(cert.id, { name: e.target.value })}
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px] sm:min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
                      Issuing Organization <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Amazon Web Services"
                      value={cert.issuer}
                      onChange={(e) => handleUpdateItem(cert.id, { issuer: e.target.value })}
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px] sm:min-h-[44px]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteItem(cert.id)}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center"
                  title="Delete certification"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-4">
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
                    Issue Date
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Nov 2023"
                    value={cert.issueDate || ""}
                    onChange={(e) => handleUpdateItem(cert.id, { issueDate: e.target.value })}
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px] sm:min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
                    Credential ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., ABC-123456"
                    value={cert.credentialId || ""}
                    onChange={(e) => handleUpdateItem(cert.id, { credentialId: e.target.value })}
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px] sm:min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
                    Verification URL
                  </label>
                  <input
                    type="url"
                    autoCapitalize="none"
                    placeholder="https://..."
                    value={cert.credentialUrl || ""}
                    onChange={(e) => handleUpdateItem(cert.id, { credentialUrl: e.target.value })}
                    onBlur={(e) =>
                      handleUpdateItem(cert.id, { credentialUrl: normalizeUrl(e.target.value) })
                    }
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px] sm:min-h-[44px]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
