// src/components/OtpInput.jsx
import React, { useRef } from "react";

const OtpInput = ({ length = 6, value, onChange, disabled }) => {
  const inputsRef = useRef([]);

  const handleChange = (index, digit) => {
    if (disabled) return;

    const cleanDigit = digit.replace(/\D/g, "").slice(0, 1);
    const valueArray = value.split("");

    valueArray[index] = cleanDigit;
    const newValue = valueArray.join("");
    onChange(newValue);

    if (cleanDigit && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (disabled) return;

    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  return (
    <div className="flex justify-between gap-2">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputsRef.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className={
            "w-10 sm:w-11 md:w-12 h-10 sm:h-11 md:h-12 text-center rounded-xl border text-sm sm:text-base font-semibold tracking-widest " +
            (disabled
              ? "bg-gray-100 border-gray-200 text-gray-400"
              : "bg-white border-gray-200 text-gray-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 outline-none transition")
          }
          disabled={disabled}
        />
      ))}
    </div>
  );
};

export default OtpInput;
