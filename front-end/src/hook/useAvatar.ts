// useAvatar
import { useMutation } from '@tanstack/react-query';
import { queryKeys } from '../constant/queryKeys';
import { avatarService } from '../shared/services/api/avatar/updateAvatar';

/**
 * @descripion useAvatar é um hook para atualizar o avatar do usuário
 * @param file upload arquivo do avatar
 * @returns um objeto com as informações necessá para atualizar o avatar do usuário
 */
export const useAvatar = () => {
  const userAvatar = useMutation({
    mutationKey: queryKeys.me,
    mutationFn: (file: File) => avatarService.updateAvatar(file),
    retry: false,
  });
  return userAvatar;
};
