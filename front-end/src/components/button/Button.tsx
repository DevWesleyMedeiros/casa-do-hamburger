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
  const changeBgButton = () => {
    if (colorVariation === "bgRedVariation") {
      return "boder-2 w-full cursor-pointer rounded-md border-[#C92A0E] bg-[#C92A0E] py-2 text-sm font-bold text-white";
    } else {
      return "boder-2 text- w-full cursor-pointer rounded-md border-[#C92A0E] bg-white py-2 text-sm font-bold text-[#C92A0E]";
    }
  };

  return (
    <button {...props} type={type} className={changeBgButton()}>
      {title}
    </button>
  );
};
