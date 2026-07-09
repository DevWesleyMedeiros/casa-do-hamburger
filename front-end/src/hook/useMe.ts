import { queryKeys } from "../constant/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { getAuth } from "../shared/services/api/me/Me";

export const useMe = () => {
  const user = useQuery({
    queryKey: queryKeys.me,
    queryFn: () => getAuth.getMe(),
    retry: false, // false certo: não faz sentido retentar um 401
    staleTime: 5 * 1000 * 60,
  });

  return user;
};
