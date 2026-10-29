import type { Request, Response } from 'express';
import { adminAnalyticsService } from '../services/analytics/adminAnalytics.service.js';

export const adminAnalyticsController = {
  summary: async (req: Request, res: Response): Promise<void> => {
    res.json(await adminAnalyticsService.summary(req.query));
  },
};
