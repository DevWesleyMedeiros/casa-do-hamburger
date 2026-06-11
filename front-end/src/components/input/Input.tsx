import React, { type InputHTMLAttributes } from "react";



type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input: React.FC<InputProps> = ({ className, ...props }) => {
  return (
    <input
      className={`border-white/0.13 focus:border-amber/50 w-[350px] rounded-lg border-[0.5px] bg-white/[0.07] px-3.5 py-2.5 text-sm text-white transition-colors outline-none placeholder:text-white/30 ${className ?? ""} `}
      {...props}
    />
  );
};
