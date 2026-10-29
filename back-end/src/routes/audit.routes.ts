import { Router } from 'express';
import { auditController } from '../controllers/audit.controller.js';
import { requireAuth } from '../middlewares/authMiddlewares.js';
import { requiredAdmin } from '../middlewares/requiredAdmin.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-store');
  next();
});
router.use(requireAuth, requiredAdmin);
router.get('/', asyncHandler(auditController.list));
export default router;
