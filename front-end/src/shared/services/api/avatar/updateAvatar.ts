import { type UserLogin } from '../../../../types/Payload';
import { api } from '../ApiConfig';

export const avatarService = {
  updateAvatar: async (file: File): Promise<UserLogin> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const { data } = await api.patch<UserLogin>('/auth/avatar', formData);
    return data;
  },
};
