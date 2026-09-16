import { prisma } from '@empops/database';

export interface CreateAuditLogParams {
  tenantId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any> | string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  static async record(params: CreateAuditLogParams) {
    try {
      const detailsStr = typeof params.details === 'object' 
        ? JSON.stringify(params.details) 
        : params.details;

      return await prisma.auditLog.create({
        data: {
          tenantId: params.tenantId,
          userId: params.userId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          details: detailsStr,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Audit log failures should not break the core transactional flow
      return null;
    }
  }

  static async getLogs(tenantId: string, filter: {
    entityType?: string;
    action?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { tenantId };
    if (filter.entityType) where.entityType = filter.entityType;
    if (filter.action) where.action = filter.action;
    if (filter.userId) where.userId = filter.userId;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: filter.limit || 50,
        skip: filter.offset || 0,
      }),
    ]);

    return {
      total,
      logs: logs.map(l => ({
        id: l.id,
        tenantId: l.tenantId,
        userId: l.userId,
        userName: l.user ? `${l.user.firstName} ${l.user.lastName}` : 'System',
        userEmail: l.user?.email,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        details: l.details,
        ipAddress: l.ipAddress,
        userAgent: l.userAgent,
        createdAt: l.createdAt.toISOString(),
      })),
    };
  }
}
