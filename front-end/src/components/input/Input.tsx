import React, { type InputHTMLAttributes } from 'react';

// tipos para inputs (veja qual passando o mouse por cima do elemento em questão): InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> de
// (property) React.JSX.IntrinsicElements.input: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>
type InputProps = InputHTMLAttributes<HTMLInputElement>;
export const Input: React.FC<InputProps> = ({ className, ...props }) => {
  return (
    <input
      className={`border-white/0.13 focus:border-amber/50 placeholder:text-bold w-full rounded-lg bg-white/[0.07] px-3.5 py-2.5 text-sm text-white outline-1 transition-colors outline-none placeholder:text-white/30 ${className ?? ''} `}
      {...props}
    />
  );
};
