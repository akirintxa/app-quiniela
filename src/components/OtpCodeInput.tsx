"use client";

import { useRef, useState } from "react";

type OtpCodeInputProps = {
  name?: string;
  digits?: number;
  required?: boolean;
  autoFocus?: boolean;
};

export default function OtpCodeInput({
  name = "token",
  digits = 6,
  required = true,
  autoFocus = false,
}: OtpCodeInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (raw: string) => {
    const cleaned = raw.replace(/\D/g, "").slice(0, digits);
    setValue(cleaned);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    handleChange(pasted);
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        id={name}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus={autoFocus}
        required={required}
        maxLength={digits}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onPaste={handlePaste}
        placeholder={"0".repeat(digits)}
        className="block w-full rounded-2xl px-5 py-4 bg-gray-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-blue-500 font-black text-center text-2xl tracking-[0.35em] transition-all"
        aria-label={`Código de ${digits} dígitos`}
      />
      <p className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 text-center uppercase tracking-widest">
        Puedes pegar el código completo desde el correo
      </p>
    </div>
  );
}
