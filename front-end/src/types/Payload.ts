// Isso garante que saibamos exatamente o formato dos dados que transitam na aplicação.
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

// UserLogin pega a interface RegisterPayloadInterface, omit duas propriedades: "password" e "confirmPassword" e cria mais um id
// UserLogin = { id: string, name: string, email: string, cep: string}
export type UserLogin = Omit<
  RegisterPayloadInterface,
  "password" | "confirmPassword"
> & {
  id: string;
  admin: string
};

export type UserDate = Pick<LoginPayloadInterface, "email"> &
  Pick<RegisterPayloadInterface, "name"> & Pick<UserLogin, "admin">;

export type UserContextTypes = {
  user: UserDate | null;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<UserDate | null>>; // Esta propriedade é uma função para atualizar o estado user usado no contexto
  // O setUser não é uma função qualquer — ela é um Dispatch, ou seja, uma função que despacha uma atualização de estado para o React processar.
  //Basicamente quando você passa o setter do useState como prop ou dentro de um contexto.
};
