import { Router, Request, Response } from 'express';
import { prisma } from '@empops/database';
import { TicketStatus, AssetStatus } from '@empops/shared';
import { authenticateJwt } from '../../middleware/auth.js';

export const dashboardRouter = Router();
dashboardRouter.use(authenticateJwt);

// GET /api/dashboard/stats
dashboardRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const todayStr = new Date().toISOString().split('T')[0];

    // Parallel counts
    const [
      totalHeadcount,
      dailyAttendanceList,
      allTickets,
      allAssets,
      pendingExitClearancesCount,
      recentPunches,
      recentTickets,
    ] = await Promise.all([
      prisma.employee.count({ where: { tenantId } }),
      prisma.dailyAttendance.findMany({ where: { tenantId, date: todayStr } }),
      prisma.ticket.findMany({ where: { tenantId } }),
      prisma.asset.findMany({ where: { tenantId } }),
      prisma.exitClearance.count({ where: { tenantId, itNocIssued: false } }),
      prisma.attendancePunch.findMany({
        where: { tenantId },
        include: { employee: { select: { firstName: true, lastName: true } } },
        orderBy: { timestamp: 'desc' },
        take: 5,
      }),
      prisma.ticket.findMany({
        where: { tenantId },
        include: { requester: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const todayPresentCount = dailyAttendanceList.filter((d) => d.status === 'PRESENT' || d.status === 'HALF_DAY').length;
    const todayLateCount = dailyAttendanceList.filter((d) => d.isLate).length;
    const todayAbsentCount = Math.max(0, totalHeadcount - todayPresentCount);

    const openTicketsCount = allTickets.filter((t) => t.status !== TicketStatus.RESOLVED && t.status !== TicketStatus.CLOSED).length;
    const now = new Date();
    const slaBreachedTicketsCount = allTickets.filter(
      (t) => t.resolutionDueAt && now > t.resolutionDueAt && t.status !== TicketStatus.RESOLVED && t.status !== TicketStatus.CLOSED
    ).length;

    const totalAssetsCount = allAssets.length;
    const assignedAssetsCount = allAssets.filter((a) => a.status === AssetStatus.ASSIGNED).length;
    const idleAssetsCount = allAssets.filter((a) => a.status === AssetStatus.IN_STOCK).length;
    const totalAssetValue = allAssets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);

    return res.json({
      totalHeadcount,
      todayPresentCount,
      todayAbsentCount,
      todayLateCount,
      attendancePercentage: totalHeadcount > 0 ? Math.round((todayPresentCount / totalHeadcount) * 100) : 0,
      openTicketsCount,
      slaBreachedTicketsCount,
      slaComplianceRate: openTicketsCount > 0 ? Math.max(0, Math.round(((openTicketsCount - slaBreachedTicketsCount) / openTicketsCount) * 100)) : 100,
      totalAssetsCount,
      assignedAssetsCount,
      idleAssetsCount,
      totalAssetValue,
      pendingExitClearancesCount,
      recentPunches: recentPunches.map((p) => ({
        id: p.id,
        employeeName: `${p.employee.firstName} ${p.employee.lastName}`,
        type: p.punchType,
        mode: p.mode,
        timestamp: p.timestamp.toISOString(),
        isWithinGeofence: p.isWithinGeofence,
      })),
      recentTickets: recentTickets.map((t) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        title: t.title,
        priority: t.priority,
        status: t.status,
        requesterName: `${t.requester.firstName} ${t.requester.lastName}`,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});
