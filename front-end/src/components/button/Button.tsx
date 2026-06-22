import type React from "react";

// exportado para poder ser reusado em outros componentes
export type ColorVariation =
  | "bgRedVariation"
  | "bgWhiteVariation"
  | "bgGoogleVariation" // ← novo: OAuth / ação secundária em tema dark
  | "bgDarkVariation"; // ← novo: ação terciária em tema dark

type ButtonType = {
  title: string;
  type: "button" | "submit";
  colorVariation?: ColorVariation;
  children?: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = ({
  title,
  type,
  colorVariation = "bgRedVariation",
  children,
  ...props
}: ButtonType) => {
  const BASE =
    "w-full cursor-pointer rounded-md py-2 text-sm font-bold " +
    "flex items-center justify-center gap-2 " + // suporte ao leftIcon
    "transition-all duration-200 ease-in-out " +
    "active:scale-[0.98] " +
    "disabled:opacity-50 disabled:cursor-not-allowed";

  const VARIANTS: Record<ColorVariation, string> = {
    // CTA principal — fundo vermelho sólido
    bgRedVariation:
      "border-1 border-redVariation bg-brand-red text-white " +
      "hover:shadow-[0_0_12px_rgba(201,42,14,0.5)] " +
      "focus-visible:ring-2 focus-visible:ring-redVariation focus:border-amber/50 focus-visible:ring-offset-2",

    // ação secundária — fundo branco com borda vermelha (contexto claro)
    bgWhiteVariation:
      "bg-white text-redVariation " +
      "hover:bg-[#fff0ee] " +
      "hover:shadow-[0_0_12px_rgba(201,42,14,0.25)] " +
      "focus-visible:ring-2 focus-visible:ring-redVariation focus:border-amber/50 focus-visible:ring-offset-2",

    // OAuth / ação secundária — semitransparente escuro (tema dark)
    bgGoogleVariation:
      "border border-white/[0.13] bg-white/[0.05] text-[#faf9f5] " +
      "hover:bg-white/[0.10] hover:border-white/[0.20] " +
      "focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-0",

    // ação terciária — outline sutil (tema dark)
    bgDarkVariation:
      "border border-white/[0.08] bg-white/[0.03] text-[#faf9f5] " +
      "hover:bg-white/[0.07] hover:border-white/[0.14] " +
      "focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-0 mt-6",
  };

  return (
    <button
      {...props}
      type={type}
      className={`${BASE} ${VARIANTS[colorVariation]}`}
    >
      {children}
      {title}
    </button>
  );
};
