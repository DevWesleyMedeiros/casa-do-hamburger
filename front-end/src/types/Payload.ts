// Isso garante que saibamos exatamente o formato dos dados que transitam na aplicação.
// usados aqui somente para payloads da nossa api
export interface LoginPayloadInterface {
  email: string;
  password: string;
}

export interface RegisterPayloadInterface {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  cep: string;
}

// UserLogin pega a interface RegisterPayloadInterface, omit duas propriedades: "password" e "confirmPassword" e cria mais um id e admin
// UserLogin = { id: string, name: string, email: string, cep: string}
export type UserLogin = Omit<
  RegisterPayloadInterface,
  "password" | "confirmPassword"
> & {
  id: string;
  admin: boolean;
};

export type UserDate = Pick<LoginPayloadInterface, "email"> &
  Pick<RegisterPayloadInterface, "name"> &
  Pick<UserLogin, "admin">;

export type UserContextTypes = {
  user: UserDate | null;
  logout: () => void;
  isLoading: boolean;
  setUser: React.Dispatch<React.SetStateAction<UserDate | null>>; // Esta propriedade é uma função para atualizar o estado user usado no contexto
  // O setUser não é uma função qualquer — ela é um Dispatch, ou seja, uma função que despacha uma atualização de estado para o React processar.
  //Basicamente quando você passa o setter do useState como prop ou dentro de um contexto.
};
