import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../constant/queryKeys';
import { getAuth } from '../shared/services/api/me/Me';

/**
 * @description useMe é um hook para obter as informações do usuário logado
 * @returns um objeto com as informações do usuário logado
*/
export const useMe = () => {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => getAuth.getMe(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};
