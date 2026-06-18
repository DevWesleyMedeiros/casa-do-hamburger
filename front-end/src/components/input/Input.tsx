import React, { type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input: React.FC<InputProps> = ({ className, ...props }) => {
  return (
    <input
      className={`border-white/0.13 focus:border-amber/50 placeholder:text-bold w-87.5 rounded-lg bg-white/[0.07] px-3.5 py-2.5 text-sm text-white outline-1 transition-colors outline-none placeholder:text-white/30 ${className ?? ""} `}
      {...props}
    />
  );
};
