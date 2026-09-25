// useAvatar
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../constant/queryKeys';
import { avatarService } from '../shared/services/api/avatar/updateAvatar';
import { type UserLogin } from '../types/Payload';

/**
 * @descripion useAvatar é um hook para atualizar o avatar do usuário
 * @param file upload arquivo do avatar
 * @returns um objeto com as informações necessá para atualizar o avatar do usuário
 */
export const useAvatar = () => {
  const queryClient = useQueryClient();
  return useMutation<UserLogin, Error, File>({
    mutationKey: ['avatar', 'update'],
    mutationFn: (file: File) => avatarService.updateAvatar(file),
    retry: false,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<UserLogin>(queryKeys.me, updatedUser);
    },
  });
};
