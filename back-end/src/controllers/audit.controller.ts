import type { Request, Response } from 'express';
import { auditService } from '../services/audit.service.js';

export const auditController = {
  list: async (req: Request, res: Response): Promise<void> => {
    res.json(await auditService.list(req.query));
  },
};
