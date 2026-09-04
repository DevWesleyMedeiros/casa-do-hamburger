// Isso garante que saibamos exatamente o formato dos dados que transitam na aplicação.
// usados aqui somente para payloads da nossa api
// payload para login
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

// UserLogin bate exatamente com o UserDTO retornado pelo backend: id, name, email, admin
// O backend não retorna mais 'cep' no DTO de perfil do usuário
export type UserLogin = {
  id: string;
  name: string;
  email: string;
  admin: boolean;
};


export type UserContextTypes = {
  user: UserLogin | null;
  logout: () => void;
  isLoading: boolean;
  setUser: React.Dispatch<React.SetStateAction<UserLogin | null>>; // Esta propriedade é uma função para atualizar o estado user usado no contexto
  // O setUser não é uma função qualquer — ela é um Dispatch, ou seja, uma função que despacha uma atualização de estado para o React processar.
  //Basicamente quando você passa o setter do useState como prop ou dentro de um contexto.
};

// GoogleAuthRequest é o tipo do payload do POST /auth/google
export interface GoogleLoginPayloadInterface {
  idToken: string;
}
