/**
 * GERADOR DE SENHAS FORTES E CRIPTOGRAFICAMENTE SEGURAS
 *
 * Este módulo serve como modelo para geração de tokens, senhas ou chaves.
 * Ele utiliza a Web Crypto API (crypto.getRandomValues), garantindo que os
 * valores gerados sejam estatisticamente imprevisíveis e seguros contra ataques.
 */

export const passwordGenerator = (): string => {
  // 1. Definição dos conjuntos de caracteres (Charsets)
  const lowerChar = "abcdefghijklmnopqrstuvwxyz";
  const upperChar = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const specials = "!@#$%^&*()_+";

  // Agrupamento de todos os caracteres para o preenchimento do restante da senha
  const allChars = lowerChar + upperChar + numbers + specials;

  // 2. Garantia de regras de complexidade (Pelo menos 1 caractere de cada tipo)
  // Sorteia obrigatoriamente um item de cada grupo para evitar senhas fracas por puro azar.
  const mandatory = [
    lowerChar[randowIndex(lowerChar.length)], // Garante 1 letra minúscula
    upperChar[randowIndex(upperChar.length)], // Garante 1 letra maiúscula
    numbers[randowIndex(numbers.length)], // Garante 1 número
    specials[randowIndex(specials.length)], // Garante 1 caractere especial
  ];

  // 3. Preenchimento do comprimento restante da senha
  // Cria um array de 9 posições e preenche cada uma com um caractere aleatório do charset total.
  // Total da senha final: 4 caracteres obrigatórios + 9 restantes = 13 caracteres.
  const rest = Array.from(
    { length: 9 },
    () => allChars[randowIndex(allChars.length)],
  );

  // 4. Embaralhamento e resultado final
  // Une os caracteres obrigatórios com os demais e os embaralha para que a senha
  // não comece sempre na mesma ordem fixa (ex: Minúscula, Maiúscula, Número, Especial...).
  return [...mandatory, ...rest].sort(() => Math.random() - 0.5).join("");
};

/**
 * HELPER: randowIndex
 * Gera um índice numérico aleatório seguro dentro de um limite máximo.
 *
 * @param max O limite superior exclusivo (ex: se max for 26, retorna de 0 a 25)
 * @returns Um número inteiro aleatório seguro
 */

const randowIndex = (max: number): number => {
  // Cria um array em memória temporária com espaço para 1 único número.
  // Uint32Array aloca um inteiro de 32 bits sem sinal (valores de 0 a 4.294.967.295).
  const array = new Uint32Array(1);

  // Modifica o array diretamente, preenchendo-o com bytes gerados por hardware/S.O. (CSPRNG).
  // Diferente de Math.random(), este valor é criptograficamente impossível de prever.
  crypto.getRandomValues(array);

  // Aplica o operador de resto (%) para limitar o número gigante gerado ao tamanho máximo desejado.
  // Exemplo: Se array[0] for 1.500.003 e max for 10, o resto é 3. O resultado sempre estará entre 0 e (max - 1).
  return array[0] % max;
};
// código que pode ser evoluído para um algorítmo de (Fisher-Yates)
