import { Router } from 'express';
import { adminAnalyticsController } from '../controllers/adminAnalytics.controller.js';
import { requireAuth } from '../middlewares/authMiddlewares.js';
import { requiredAdmin } from '../middlewares/requiredAdmin.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-store');
  next();
});
router.get('/summary', requireAuth, requiredAdmin, asyncHandler(adminAnalyticsController.summary));
export default router;
