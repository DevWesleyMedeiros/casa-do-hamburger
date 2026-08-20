import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../constant/queryKeys";
import { getAuth } from "../shared/services/api/me/Me";

export const useMe = () => {
  const user = useQuery({
    queryKey: queryKeys.me,
    queryFn: () => getAuth.getMe(), // busca meu token de sessão vem de um DTO somente de sessão do usuário
    retry: false, // false certo: não faz sentido retentar um 401
    staleTime: 5 * 1000 * 60,
  });

  return user;
};
// chamada desse hoook será const { dat: user } = useMe()
// user.admin;
