// src/components/Navbar.jsx
import React from "react";

const Navbar = () => {
  return (
    <header className="w-full border-b border-gray-100 px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
          <span className="text-white text-xl font-semibold">+</span>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-emerald-700 leading-tight">MediBuddy</span>
          <span className="text-xs text-gray-500">Smart Healthcare Companion</span>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-2 text-xs">
        <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-emerald-700 font-medium">Secure Login</span>
      </div>
    </header>
  );
};

export default Navbar;
