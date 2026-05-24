// componente reutilizávle Input
import React, { type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input: React.FC<InputProps> = (props) => {
  return (
    <label htmlFor="input-email">
      <input
        {...props}
        className="input-email h-[8.75] w-87.5 rounded-md bg-white px-2 py-2 text-sm text-[#32343E] placeholder-[#32343E] outline-none"
      />
    </label>
  );
};
