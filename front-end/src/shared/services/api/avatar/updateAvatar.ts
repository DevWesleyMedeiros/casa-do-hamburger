import { api } from '../ApiConfig';
export const avatarService = {
  updateAvatar: async (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const { data } = await api.patch('/avatar', formData);
    return data;
  },
};
