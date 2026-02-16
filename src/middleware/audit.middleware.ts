import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import logger from '../config/logger';

export const auditLog = (action: string, resource: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.user) {
        await prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action,
            resource,
            details: {
              body: req.body,
              params: req.params,
              query: req.query,
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          },
        });
      }
      next();
    } catch (error) {
      logger.error('Audit log failed:', error);
      next();
    }
  };
};
