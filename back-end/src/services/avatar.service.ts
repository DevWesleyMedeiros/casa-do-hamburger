import { AppError } from '../errors/AppError.js';
import { uploadImageToCloudinary } from './uploads/cloudinary.service.js';
import { userRepository } from '../repositories/user.repository.js';

const AVATAR_CLOUDINARY_FOLDER = 'casa-do-hamburguer/avatars';

export const avatarService = {
  /**
   * @description  atualiza avatar do usuário
   * @param userId id do usuário
   * @param file arquivo do upload
   * @returns usuário atualizado
   */
  updateAvatar: async (userId: string, file: Express.Multer.File) => {
    if (!file) {
      throw new AppError(400, 'Avatar é obrigatório');
    }
    const { url, key } = await uploadImageToCloudinary(file, AVATAR_CLOUDINARY_FOLDER);
    return await userRepository.updateAvatar(userId, { avatarUrl: url, avatarKey: key });
  },
};