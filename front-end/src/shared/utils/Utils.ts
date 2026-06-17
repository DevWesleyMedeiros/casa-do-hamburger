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
export const brazilinaCurrencyFormat = (currencyValue: number): string => {
  if (Number.isNaN(currencyValue)) {
    throw new Error("Valor não é moeda");
  }
  return `R$${currencyValue.toFixed(2).replace(".", ",")}`;
};

// input trim
export const inputTrimToValue = (value: string): string => {
  if (!value) {
    throw new Error("Input vazio");
  }
  return value.trim();
};

// envia nome de produtos uppercase
export const toUpperCase = (productName: string): string => {
  if (!productName) {
    throw new Error("Não do produto de ser passado");
  }
  if (productName === "") {
    throw new Error("O produto deve conter título");
  }
  return inputTrimToValue(productName.toUpperCase());
};

// itera sobre array e retorna seus valores como toUpperCase
export const toUpperCaseDate = (arrayDate: string[]): string[] => {
  return arrayDate.map((item) => item.toUpperCase());
};
