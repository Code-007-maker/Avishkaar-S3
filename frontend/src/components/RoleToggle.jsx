// src/components/RoleToggle.jsx
import React from "react";

const RoleToggle = ({ value, onChange }) => {
  const roles = [
    { id: "patient", label: "Patient", emoji: "🧑‍🦽" },
    { id: "doctor", label: "Doctor", emoji: "🧑‍⚕️" },
  ];

  return (
    <div className="inline-flex rounded-full bg-emerald-50 p-1 mb-5">
      {roles.map((role) => {
        const active = value === role.id;
        return (
          <button
            key={role.id}
            type="button"
            onClick={() => onChange(role.id)}
            className={
              "px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all duration-150 flex items-center gap-1.5 " +
              (active
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-emerald-700/70 hover:text-emerald-900")
            }
          >
            <span className="text-base">{role.emoji}</span>
            <span>{role.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default RoleToggle;
