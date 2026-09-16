import { Router, Request, Response } from 'express';
import { prisma } from '@empops/database';
import { AttendancePunchSchema, CreateLeaveRequestSchema, PunchType, AttendanceStatus, LeaveStatus } from '@empops/shared';
import { authenticateJwt, requireRoles } from '../../middleware/auth.js';
import { RoleEnum } from '@empops/shared';

export const attendanceRouter = Router();
attendanceRouter.use(authenticateJwt);

// Helper: Haversine distance in meters
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// POST /api/attendance/punch
attendanceRouter.post('/punch', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const parseResult = AttendancePunchSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.format() });
    }

    const { employeeId, punchType, mode, latitude, longitude, deviceId } = parseResult.data;

    // Fetch employee and assigned location & shift
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
      include: { location: true },
    });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Evaluate Geofence if coordinates are provided
    let isWithinGeofence = true;
    let distanceMeters = 0;
    if (latitude && longitude && employee.location.latitude && employee.location.longitude) {
      distanceMeters = calculateDistanceMeters(
        latitude,
        longitude,
        employee.location.latitude,
        employee.location.longitude
      );
      isWithinGeofence = distanceMeters <= employee.location.geofenceRadiusMeters;
    }

    // Record Punch
    const now = new Date();
    const punch = await prisma.attendancePunch.create({
      data: {
        tenantId,
        employeeId,
        timestamp: now,
        punchType,
        mode,
        latitude,
        longitude,
        isWithinGeofence,
        deviceId,
      },
    });

    // Update DailyAttendance summary
    const todayStr = now.toISOString().split('T')[0];
    const defaultShift = await prisma.shift.findFirst({ where: { tenantId } });

    let daily = await prisma.dailyAttendance.findUnique({
      where: {
        tenantId_employeeId_date: {
          tenantId,
          employeeId,
          date: todayStr,
        },
      },
    });

    if (!daily) {
      // Check if late (e.g. shift starts at 09:00, grace period 15m => after 09:15 is late)
      let isLate = false;
      if (defaultShift) {
        const [shiftHour, shiftMinute] = defaultShift.startTime.split(':').map(Number);
        const shiftStartToday = new Date(now);
        shiftStartToday.setHours(shiftHour, shiftMinute + defaultShift.gracePeriodMinutes, 0, 0);
        if (now > shiftStartToday) {
          isLate = true;
        }
      }

      daily = await prisma.dailyAttendance.create({
        data: {
          tenantId,
          employeeId,
          date: todayStr,
          shiftId: defaultShift?.id,
          firstCheckIn: now,
          status: AttendanceStatus.PRESENT,
          isLate,
        },
      });
    } else {
      // Update check out and calculate total work duration
      const firstCheckInTime = daily.firstCheckIn || now;
      const totalMinutes = Math.max(0, Math.floor((now.getTime() - new Date(firstCheckInTime).getTime()) / 60000));

      let calculatedStatus = AttendanceStatus.PRESENT;
      if (defaultShift) {
        if (totalMinutes < defaultShift.halfDayThresholdMinutes) {
          calculatedStatus = AttendanceStatus.ABSENT;
        } else if (totalMinutes < defaultShift.fullDayThresholdMinutes) {
          calculatedStatus = AttendanceStatus.HALF_DAY;
        }
      }

      daily = await prisma.dailyAttendance.update({
        where: { id: daily.id },
        data: {
          lastCheckOut: now,
          totalWorkMinutes: totalMinutes,
          status: calculatedStatus,
        },
      });
    }

    return res.status(201).json({
      message: `${punchType} recorded successfully`,
      punch,
      daily,
      geofence: {
        verified: isWithinGeofence,
        distanceMeters: Math.round(distanceMeters),
        allowedRadiusMeters: employee.location.geofenceRadiusMeters,
      },
    });
  } catch (error: any) {
    console.error('Punch error:', error);
    return res.status(500).json({ error: 'Failed to record attendance punch' });
  }
});

// GET /api/attendance/daily
attendanceRouter.get('/daily', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

    const records = await prisma.dailyAttendance.findMany({
      where: { tenantId, date },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
            location: { select: { name: true } },
          },
        },
        shift: true,
      },
      orderBy: { employee: { firstName: 'asc' } },
    });

    const formatted = records.map((r) => ({
      id: r.id,
      employeeId: r.employeeId,
      employeeCode: r.employee.employeeCode,
      employeeName: `${r.employee.firstName} ${r.employee.lastName}`,
      departmentName: r.employee.department.name,
      locationName: r.employee.location.name,
      date: r.date,
      firstCheckIn: r.firstCheckIn ? r.firstCheckIn.toISOString() : null,
      lastCheckOut: r.lastCheckOut ? r.lastCheckOut.toISOString() : null,
      totalWorkMinutes: r.totalWorkMinutes,
      status: r.status,
      isLate: r.isLate,
      regularizationRequested: r.regularizationRequested,
    }));

    return res.json(formatted);
  } catch (error: any) {
    console.error('Daily attendance error:', error);
    return res.status(500).json({ error: 'Failed to fetch daily attendance' });
  }
});

// POST /api/attendance/leave
attendanceRouter.post('/leave', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const parseResult = CreateLeaveRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.format() });
    }

    const { employeeId, leaveType, startDate, endDate, reason } = parseResult.data;

    // Calculate duration in days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const leave = await prisma.leaveRequest.create({
      data: {
        tenantId,
        employeeId,
        leaveType,
        startDate,
        endDate,
        totalDays,
        reason,
        status: LeaveStatus.PENDING,
      },
    });

    return res.status(201).json({ message: 'Leave application submitted', leave });
  } catch (error: any) {
    console.error('Apply leave error:', error);
    return res.status(500).json({ error: 'Failed to apply for leave' });
  }
});

// GET /api/attendance/leave
attendanceRouter.get('/leave', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const leaves = await prisma.leaveRequest.findMany({
      where: { tenantId },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    const formatted = leaves.map((l) => ({
      id: l.id,
      employeeId: l.employeeId,
      employeeName: `${l.employee.firstName} ${l.employee.lastName}`,
      employeeCode: l.employee.employeeCode,
      departmentName: l.employee.department.name,
      leaveType: l.leaveType,
      startDate: l.startDate,
      endDate: l.endDate,
      totalDays: l.totalDays,
      reason: l.reason,
      status: l.status,
      appliedAt: l.appliedAt.toISOString(),
      approverComments: l.approverComments,
    }));

    return res.json(formatted);
  } catch (error: any) {
    console.error('Fetch leaves error:', error);
    return res.status(500).json({ error: 'Failed to fetch leaves' });
  }
});

// PUT /api/attendance/leave/:id/status
attendanceRouter.put('/leave/:id/status', requireRoles(RoleEnum.HR_MANAGER, RoleEnum.TENANT_ADMIN, RoleEnum.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const leaveId = req.params.id;
    const { status, comments } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be APPROVED or REJECTED' });
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status,
        approverId: req.user!.userId,
        approverComments: comments,
      },
    });

    return res.json({ message: `Leave ${status.toLowerCase()} successfully`, leave: updated });
  } catch (error: any) {
    console.error('Update leave status error:', error);
    return res.status(500).json({ error: 'Failed to update leave status' });
  }
});

// GET /api/attendance/muster-roll
// Export Monthly Muster Roll in Form 25 / Payroll-Ready Format (CSV / JSON)
attendanceRouter.get('/muster-roll', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7); // "YYYY-MM"

    const employees = await prisma.employee.findMany({
      where: { tenantId },
      include: {
        department: true,
        dailyAttendance: {
          where: {
            date: { startsWith: month },
          },
        },
      },
    });

    const musterRoll = employees.map((emp) => {
      const presentDays = emp.dailyAttendance.filter((d) => d.status === 'PRESENT').length;
      const halfDays = emp.dailyAttendance.filter((d) => d.status === 'HALF_DAY').length;
      const absentDays = emp.dailyAttendance.filter((d) => d.status === 'ABSENT').length;
      const lateMarks = emp.dailyAttendance.filter((d) => d.isLate).length;
      const effectivePayDays = presentDays + halfDays * 0.5;

      return {
        employeeCode: emp.employeeCode,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        department: emp.department.name,
        month,
        totalRecordedDays: emp.dailyAttendance.length,
        presentDays,
        halfDays,
        absentDays,
        lateMarks,
        effectivePayDays,
      };
    });

    return res.json({
      month,
      musterRoll,
      exportSummary: {
        totalEmployees: musterRoll.length,
        totalEffectivePayDays: musterRoll.reduce((acc, curr) => acc + curr.effectivePayDays, 0),
      },
    });
  } catch (error: any) {
    console.error('Muster roll error:', error);
    return res.status(500).json({ error: 'Failed to generate muster roll' });
  }
});
