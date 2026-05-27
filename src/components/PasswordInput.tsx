"use client";

import { useState } from "react";

type PasswordInputProps = {
  id?: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
  onFocus?: () => void;
  onChange?: () => void;
};

export default function PasswordInput({
  id = "password",
  name = "password",
  placeholder = "••••••••",
  required = true,
  onFocus,
  onChange,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        onFocus={onFocus}
        onChange={onChange}
        className="block w-full rounded-2xl px-5 py-4 bg-gray-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all pr-12"
        type={showPassword ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        required={required}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {showPassword ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.52 13.1 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" x2="22" y1="2" y2="22" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
