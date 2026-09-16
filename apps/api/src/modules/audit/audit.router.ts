import { Router, Request, Response } from 'express';
import { RoleEnum } from '@empops/shared';
import { authenticateJwt, requireRoles } from '../../middleware/auth.js';
import { AuditService } from './audit.service.js';

export const auditRouter = Router();
auditRouter.use(authenticateJwt);

// GET /api/audit/logs - Retrieve system audit trail
auditRouter.get(
  '/logs',
  requireRoles(
    RoleEnum.SUPER_ADMIN,
    RoleEnum.TENANT_ADMIN,
    RoleEnum.HR_MANAGER,
    RoleEnum.IT_MANAGER
  ),
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { entityType, action, userId, limit, offset } = req.query;

      const result = await AuditService.getLogs(tenantId, {
        entityType: entityType ? String(entityType) : undefined,
        action: action ? String(action) : undefined,
        userId: userId ? String(userId) : undefined,
        limit: limit ? parseInt(String(limit), 10) : 50,
        offset: offset ? parseInt(String(offset), 10) : 0,
      });

      return res.json(result);
    } catch (error: any) {
      console.error('Fetch audit logs error:', error);
      return res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }
);
