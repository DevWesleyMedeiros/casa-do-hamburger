// get selected or unselected class function
export const getItemSelectedClass = (
  itemName: string,
  currentSelected: string,
) => {
  const selectedClassItem =
    "bg-brand-amber text-brand-dark md:text-md border-brand-amber flex h-7 w-24 cursor-pointer items-center justify-center rounded-md border text-sm font-bold md:h-9 md:w-32";
  const unselectedClassItem =
    "bg-brand-dark text-brand-amber md:text-md border-brand-amber hover:bg-brand-amber hover:text-brand-dark flex h-7 w-24 cursor-pointer items-center justify-center rounded-md border text-sm font-bold transition-all duration-200 ease-in md:h-9 md:w-32";

  return itemName === currentSelected ? selectedClassItem : unselectedClassItem;
};

// format brazilian currency
export const brazilinaCurrencyFormat = (currencyValue: number): number => {
  if (Number.isNaN(currencyValue)) {
    throw new Error("Valor não é moeda");
  }
  return parseFloat(currencyValue.toFixed(2));
};

// input trim
export const inputTrimToValue = (value: string): string => {
  if (!value) {
    throw new Error("Input vazio");
  }
  return value.trim();
};
