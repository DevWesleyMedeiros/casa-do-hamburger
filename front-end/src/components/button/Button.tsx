type ButtonType = {
  title: string;
  type: "button" | "submit";
  colorVariation?: "bgRedVariation" | "bgWhiteVariation";
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = ({
  title,
  type,
  colorVariation = "bgRedVariation",
  ...props
}: ButtonType) => {
  const BASE =
    "w-full cursor-pointer rounded-md border-2 py-2 text-sm font-bold " + // estilos gerais
    "transition-all duration-200 ease-in-out " + // transição suave
    "active:scale-[0.98] " + // feedback de clique
    "disabled:opacity-50 disabled:cursor-not-allowed"; // estado desabilitado

  const VARIANTS = {
    bgRedVariation:
      "border-[#C92A0E] bg-[#C92A0E] text-white " + // fundo vermelho
      "hover:bg-[#a82209] hover:border-[#a82209] " + // escurece no hover
      "hover:shadow-[0_0_12px_rgba(201,42,14,0.5)] " + // brilho vermelho
      "focus-visible:ring-2 focus-visible:ring-[#C92A0E] focus-visible:ring-offset-2",

    bgWhiteVariation:
      "border-[#C92A0E] bg-white text-[#C92A0E] " + // fundo branco
      "hover:bg-[#fff0ee] " + // fundo levemente rosado
      "hover:shadow-[0_0_12px_rgba(201,42,14,0.25)] " +
      "focus-visible:ring-2 focus-visible:ring-[#C92A0E] focus-visible:ring-offset-2",
  };

  return (
    <button
      {...props}
      type={type}
      className={`${BASE} ${VARIANTS[colorVariation ?? "bgRedVariation"]}`}
    >
      {title}
    </button>
  );
};
