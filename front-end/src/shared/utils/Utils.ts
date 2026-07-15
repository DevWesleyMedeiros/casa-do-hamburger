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
    throw new TypeError("Valor não é moeda");
  }
  const intToFloatValue = currencyValue / 10000;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(intToFloatValue);
};

// envia nome de produtos uppercase
export const toUpperCase = (productName: string): string => {
  if (!productName) {
    throw new Error("Não do produto de ser passado");
  }
  if (productName === "") {
    throw new Error("O produto deve conter título");
  }
  return productName.toUpperCase();
};

// itera sobre array e retorna seus valores como toUpperCase
export const toUpperCaseDate = (arrayDate: string[]): string[] => {
  return arrayDate.map((item) => item.toUpperCase());
};

// função que vai mostrar visualmente se uma senha é fraca, média ou forte
export const displayStrongPassword = (password: string) => {
  let score = 0;

  // Ganha ponto se tiver 9 ou mais caracteres
  if (password.length >= 9) score++;

  // Ganha ponto se contiver pelo menos uma letra minúscula
  if (/[a-z]/.test(password)) score++;

  // Ganha ponto se contiver letras maiúculas OU números OU especiais
  // Usamos [ ... ] sem o ^ e $ para verificar se esses elementos existem na string
  if (
    /[A-Z0-9]/.test(password) &&
    /[!@#$%^&*()_+=\- [\]{};':"\\|,.<>/?]/.test(password)
  )
    score++;

  if (score === 1) return { label: "fraca", bars: [1, 0, 0], color: "#C41E00" };
  if (score === 2) return { label: "média", bars: [1, 1, 0], color: "#F59E0B" };
  if (score === 3) return { label: "forte", bars: [1, 1, 1], color: "#22C55E" };

  return { label: "", bars: [0, 0, 0], color: "transparent" };
};
