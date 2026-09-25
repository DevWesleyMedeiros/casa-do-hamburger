import { api } from '../ApiConfig';
import { type UserLogin } from '../../../../types/Payload';
export const avatarService = {
  updateAvatar: async (file: File): Promise<UserLogin> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const { data } = await api.patch<UserLogin>('/avatar', formData);
    return data;
  },
};
