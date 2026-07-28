export const passwordGenerator = (): string => {
  // Definição dos conjuntos de caracteres (Charsets)
  const lowerChar = "abcdefghijklmnopqrstuvwxyz";
  const upperChar = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const specials = "!@#$%^&*()_+";

  const allChars = lowerChar + upperChar + numbers + specials;

  const mandatory = [
    lowerChar[randowIndex(lowerChar.length)],
    upperChar[randowIndex(upperChar.length)],
    numbers[randowIndex(numbers.length)],
    specials[randowIndex(specials.length)],
  ];
  const rest = Array.from(
    { length: 9 },
    () => allChars[randowIndex(allChars.length)],
  );

  return [...mandatory, ...rest].sort(() => Math.random() - 0.5).join("");
};

// Cria um array em memória temporária com espaço para 1 único número.
const randowIndex = (max: number): number => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);

  return array[0] % max;
};
