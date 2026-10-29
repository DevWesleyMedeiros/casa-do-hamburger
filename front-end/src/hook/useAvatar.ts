// useAvatar
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../constant/queryKeys';
import { avatarService } from '../shared/services/api/avatar/updateAvatar';
import { type UserLogin } from '../types/Payload';
import { sessionRequests } from '../shared/services/sessionRequests';

/**
 * @descripion useAvatar é um hook para atualizar o avatar do usuário
 * @param file upload arquivo do avatar
 * @returns um objeto com as informações necessá para atualizar o avatar do usuário
 */
export const useAvatar = () => {
  const queryClient = useQueryClient();
  const generation = sessionRequests.generation();
  return useMutation<UserLogin, Error, File>({
    mutationKey: ['avatar', 'update'],
    mutationFn: (file: File) => {
      sessionRequests.assertCurrent(generation);
      return avatarService.updateAvatar(file);
    },
    retry: false,
    onSuccess: (updatedUser) => {
      if (generation !== sessionRequests.generation()) return;
      const currentUser = queryClient.getQueryData<UserLogin | null>(queryKeys.me);
      if (currentUser?.id === updatedUser.id) {
        queryClient.setQueryData<UserLogin>(queryKeys.me, updatedUser);
      }
    },
  });
};
