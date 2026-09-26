import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddlewares.js';
import { avatarController } from '../controllers/avatar.controller.js';
import { uploadAvatarImg, validateImageMagicBytes } from '../middlewares/upload.js';

const router = Router();

router.patch(
  '/avatar',
  requireAuth,
  uploadAvatarImg,
  validateImageMagicBytes,
  avatarController.update,
);
export default router;
