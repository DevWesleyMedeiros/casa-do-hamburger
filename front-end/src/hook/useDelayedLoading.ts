import { useEffect, useState } from "react";

export const useDelayedLoading = (isLoading: boolean, delayMs = 200) => {
  const [elepsed, setElepsed] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      // se não estiver atualizando, não mostre o spinner
      return;
    }
    const timer = setTimeout(() => setElepsed(true), delayMs);
    return () => {
      clearTimeout(timer);
      setElepsed(false);
    };
  }, [isLoading, delayMs]);

  // showSpinner só é true quando: ainda carregando E o timer já estourou
  return isLoading && elepsed;
};
