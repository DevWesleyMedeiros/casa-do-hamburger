import { AppError } from '../errors/AppError.js';
import { uploadImageToCloudinary } from './uploads/cloudinary.service.js';
import { userRepository } from '../repositories/user.repository.js';

export const avatarService = {
  /**
   * @description função que atualiza o avatar do usuário
   * @param userId id do usuário
   * @param file objeto com o metadados do arquivo do upload
   * @returns usuário atualizado com avatar e a chave do Cloudinary
   */
  updateAvatar: async (userId: string, file: Express.Multer.File) => {
    if (!file) {
      throw new AppError(400, 'Avatar é obrigatório');
    }
    const { url, key } = await uploadImageToCloudinary(file);
    return await userRepository.updateAvatar(userId, { avatarUrl: url, avatarKey: key });
  },
};
