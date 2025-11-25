// src/components/AuthDialog.jsx
import React from "react";

const AuthDialog = ({ open, title, subtitle, onClose, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">{children}</div>

        {/* Footer */}
        <div className="px-5 pb-4 flex justify-end">
          <button
            onClick={onClose}
            className="inline-flex items-center rounded-full border border-gray-200 px-4 py-1.5 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthDialog;
