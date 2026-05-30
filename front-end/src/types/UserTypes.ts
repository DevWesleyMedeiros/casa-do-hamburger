// Isso garante que saibamos exatamente o formato dos dados que transitam na aplicação.
export type LoginPayload = {
  email: string;
  password: string;
};
