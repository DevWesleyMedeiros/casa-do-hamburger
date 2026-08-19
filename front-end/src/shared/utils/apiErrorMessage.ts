// O arquivo de Lookup Table (Tabela de Busca) serve para mapear chaves para valores, substituindo estruturas condicionais longas e repetitivas (como múltiplos if/else ou switch) por um objeto simples e de leitura rápida. Ajuda na redução da complexidade ciclomática do projeto
// Para utilizar essa função no seu projeto, você deve importá-la dentro dos blocos de captura de erro (catch) das suas requisições ou dentro de interceptores globais do Axios/Fetch.

import { ApiError } from "../services/api/ApiExceptions";

// mais erros podem ser inseridos aqui
const STATUS_MESSAGES: Record<number, string> = {
  401: "Você precisa estar logado",
  403: "Acesso restrito aos administradores",
  404: "Recurso não encontrado",
};

export const resolveApiErrorMessage = (
  error: ApiError,
  fallback?: Record<number, string>,
): string => {
  return (
    fallback?.[error.statusCode] ??
    STATUS_MESSAGES[error.statusCode] ??
    error.message
  );
};
