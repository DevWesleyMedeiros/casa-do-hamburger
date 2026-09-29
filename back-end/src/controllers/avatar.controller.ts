import { asyncHandler } from '../utils/asyncHandler.js';
import { avatarService } from '../services/avatar.service.js';
import { toUserDTO } from '../dtos/user.dto.js';

export const avatarController = {
  update: asyncHandler(async (req, res) => {
    const userId = req.user?.['id'] as string;
    const { file } = req;

    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!file) {
      throw new Error('File is required');
    }

    const user = await avatarService.updateAvatar(userId, file);
    return res.status(200).json(toUserDTO(user));
  }),
};
