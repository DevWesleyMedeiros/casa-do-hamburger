import React, { type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input: React.FC<InputProps> = ({ className, ...props }) => {
  return (
    <input
      {...props}
      className={[
        // Base
        "w-[350px] rounded-md bg-white px-3 py-2 text-sm text-[#32343E]",
        "placeholder-[#9ca3af]",
        // Borda padrão sutil
        "border border-transparent",
        // Transição suave em tudo
        "transition-all duration-200 ease-in-out",
        // Focus: borda vermelha + sem outline padrão do browser
        "outline-none",
        "focus:border-[#C92A0E]",
        "focus:ring-2 focus:ring-[#C92A0E]/30", // anel translúcido vermelho
        "focus:shadow-[0_0_0_3px_rgba(201,42,14,0.15)]",
        // Hover sutil
        "hover:border-[#C92A0E]/50",
        // Classe extra que vier de fora
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
};
