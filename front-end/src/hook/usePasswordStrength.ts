import { useCallback } from "react";
export const usePasswordGenerator = (length = 13) => {
  const randomIndex = useCallback((max: number): number => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  }, []);

  const secureShuffle = useCallback(
    <T>(arr: T[]): T[] => {
      const result = [...arr];
      for (let i = result.length - 1; i > 0; i--) {
        const j = randomIndex(i + 1);
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    },
    [randomIndex],
  );

  const generateSecurePassword = useCallback((): string => {
    const lowerChar = "abcdefghijklmnopqrstuvwxyz";
    const upperChar = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const specials = "!@#$%^&*()_+";
    const allChars = lowerChar + upperChar + numbers + specials;

    const mandatory = [
      lowerChar[randomIndex(lowerChar.length)],
      upperChar[randomIndex(upperChar.length)],
      numbers[randomIndex(numbers.length)],
      specials[randomIndex(specials.length)],
    ];

    const restLength = Math.max(length - mandatory.length, 0);
    const rest = Array.from(
      { length: restLength },
      () => allChars[randomIndex(allChars.length)],
    );

    return secureShuffle([...mandatory, ...rest]).join("");
  }, [length, secureShuffle, randomIndex]);

  return { generateSecurePassword };
};
