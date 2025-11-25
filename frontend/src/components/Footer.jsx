// src/components/Footer.jsx
import React from "react";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-gray-100 px-6 py-3 bg-white/80 backdrop-blur-sm">
      <p className="text-xs text-center text-gray-500">© {year} MediBuddy • All rights are reserved</p>
    </footer>
  );
};

export default Footer;
