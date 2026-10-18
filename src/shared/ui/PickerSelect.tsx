"use client";

import React, { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import { hapticLight } from "@/shared/platform";

export interface PickerOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface PickerSelectProps<T extends string = string> {
  label?: string;
  value: T;
  options: readonly PickerOption<T>[];
  onChange: (value: T) => void;
  title?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  helperText?: string;
  required?: boolean;
}

export function PickerSelect<T extends string = string>({
  label,
  value,
  options,
  onChange,
  title,
  placeholder = "Select an option",
  disabled = false,
  className = "",
  helperText,
  required = false,
}: PickerSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleOpen = () => {
    if (disabled) return;
    hapticLight();
    setIsOpen(true);
  };

  const handleSelect = (nextValue: T) => {
    hapticLight();
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-bold text-gray-800 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`w-full min-h-[48px] px-3.5 py-3 rounded-xl border flex items-center justify-between text-left transition-all ${
          disabled
            ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-white hover:bg-gray-50/80 active:bg-gray-100 border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          {selectedOption?.icon && (
            <span className="shrink-0 text-indigo-600">{selectedOption.icon}</span>
          )}
          <span
            className={`text-sm truncate ${
              selectedOption ? "font-medium text-gray-900" : "text-gray-400"
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200" />
      </button>

      {helperText && <p className="text-2xs text-gray-500 mt-1.5">{helperText}</p>}

      {/* Mobile-Native Bottom Sheet Picker */}
      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title || label || "Select"}
        maxHeightClass="max-h-[80vh]"
      >
        <div className="space-y-1.5 py-1" role="radiogroup" aria-label={title || label || "Select option"}>
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleSelect(option.value)}
                className={`w-full min-h-[52px] p-3.5 rounded-2xl text-left transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? "bg-indigo-50/90 border border-indigo-200 shadow-2xs"
                    : "hover:bg-gray-50 border border-transparent active:bg-gray-100"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {option.icon && (
                    <span
                      className={`shrink-0 mt-0.5 ${
                        isSelected ? "text-indigo-600" : "text-gray-400"
                      }`}
                    >
                      {option.icon}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm leading-snug ${
                        isSelected
                          ? "font-bold text-indigo-950"
                          : "font-medium text-gray-800"
                      }`}
                    >
                      {option.label}
                    </p>
                    {option.description && (
                      <p
                        className={`text-xs mt-0.5 leading-relaxed ${
                          isSelected ? "text-indigo-700/80" : "text-gray-500"
                        }`}
                      >
                        {option.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Radio selection indicator */}
                <div
                  className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-indigo-600 border-2 border-indigo-600 shadow-xs"
                      : "border-2 border-gray-300 bg-white"
                  }`}
                  aria-hidden="true"
                >
                  {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
}

export default PickerSelect;
