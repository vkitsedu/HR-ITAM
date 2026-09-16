import { Router, Request, Response } from 'express';
import { prisma } from '@empops/database';
import { CreateEmployeeSchema, ResignEmployeeSchema, EmployeeStatus, TicketCategoryEnum, TicketPriority, TicketStatus } from '@empops/shared';
import { authenticateJwt, requireRoles } from '../../middleware/auth.js';
import { RoleEnum } from '@empops/shared';

export const hrRouter = Router();

// Apply authentication to all HR routes
hrRouter.use(authenticateJwt);

// GET /api/hr/employees
hrRouter.get('/employees', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const employees = await prisma.employee.findMany({
      where: { tenantId },
      include: {
        department: true,
        designation: true,
        location: true,
        manager: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true },
        },
        assignedAssets: {
          select: { id: true, assetTag: true, name: true, status: true },
        },
        exitClearances: {
          select: { id: true, status: true, itNocIssued: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = employees.map((emp) => ({
      id: emp.id,
      tenantId: emp.tenantId,
      employeeCode: emp.employeeCode,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone,
      departmentId: emp.departmentId,
      departmentName: emp.department.name,
      designationId: emp.designationId,
      designationTitle: emp.designation.title,
      locationId: emp.locationId,
      locationName: emp.location.name,
      managerId: emp.managerId,
      managerName: emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : undefined,
      joiningDate: emp.joiningDate.toISOString().split('T')[0],
      confirmationDate: emp.confirmationDate ? emp.confirmationDate.toISOString().split('T')[0] : undefined,
      status: emp.status,
      employmentType: emp.employmentType,
      assignedAssetCount: emp.assignedAssets.length,
      assignedAssets: emp.assignedAssets,
      exitClearance: emp.exitClearances[0] || null,
    }));

    return res.json(formatted);
  } catch (error: any) {
    console.error('Fetch employees error:', error);
    return res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// POST /api/hr/employees
// CRITICAL WEDGE: Onboarding automation that immediately generates IT Hardware Provisioning Ticket
hrRouter.post('/employees', requireRoles(RoleEnum.HR_MANAGER, RoleEnum.TENANT_ADMIN, RoleEnum.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const parseResult = CreateEmployeeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.format() });
    }

    const data = parseResult.data;

    // Check unique employee code
    const existing = await prisma.employee.findFirst({
      where: { tenantId, employeeCode: data.employeeCode },
    });
    if (existing) {
      return res.status(400).json({ error: `Employee Code ${data.employeeCode} already exists` });
    }

    const employee = await prisma.employee.create({
      data: {
        tenantId,
        employeeCode: data.employeeCode,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        phone: data.phone,
        departmentId: data.departmentId,
        designationId: data.designationId,
        locationId: data.locationId,
        managerId: data.managerId,
        joiningDate: new Date(data.joiningDate),
        status: EmployeeStatus.PROBATION,
        employmentType: data.employmentType,
      },
      include: {
        department: true,
        designation: true,
        location: true,
      },
    });

    // Automatically trigger IT Provisioning Ticket if autoProvisionHardware is true
    let autoTicket = null;
    if (data.autoProvisionHardware) {
      const ticketCount = await prisma.ticket.count({ where: { tenantId } });
      const ticketNumber = `TKT-${String(ticketCount + 101).padStart(5, '0')}`;

      // Find an admin or IT user as requester
      const itRequester = await prisma.user.findFirst({
        where: { tenantId },
      });

      if (itRequester) {
        autoTicket = await prisma.ticket.create({
          data: {
            tenantId,
            ticketNumber,
            requesterId: itRequester.id,
            title: `[Auto-Provision] Hardware & Access Bundle for ${employee.firstName} ${employee.lastName} (${employee.employeeCode})`,
            description: `Automatic onboarding trigger: Please prepare and assign standard laptop (MacBook / ThinkPad), monitor, and corporate network credentials for new joiner ${employee.firstName} ${employee.lastName} (${employee.designation.title}, ${employee.department.name}, ${employee.location.name}). Joining date: ${data.joiningDate}.`,
            category: TicketCategoryEnum.HARDWARE,
            priority: TicketPriority.HIGH,
            status: TicketStatus.NEW,
            responseDueAt: new Date(Date.now() + 4 * 3600 * 1000), // 4 hours
            resolutionDueAt: new Date(Date.now() + 48 * 3600 * 1000), // 48 hours
          },
        });
      }
    }

    return res.status(201).json({
      employee,
      autoProvisionTicket: autoTicket,
      message: 'Employee created successfully. IT Provisioning ticket generated automatically.',
    });
  } catch (error: any) {
    console.error('Create employee error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create employee' });
  }
});

// POST /api/hr/employees/:id/resign
// CRITICAL WEDGE: Resignation trigger that immediately creates Exit Clearance & IT Asset Handover Checklist
hrRouter.post('/employees/:id/resign', requireRoles(RoleEnum.HR_MANAGER, RoleEnum.TENANT_ADMIN, RoleEnum.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const employeeId = req.params.id;

    const parseResult = ResignEmployeeSchema.safeParse({ ...req.body, employeeId });
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.format() });
    }

    const { resignationDate, lastWorkingDay } = parseResult.data;

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
      include: { assignedAssets: true },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Update employee status
    await prisma.employee.update({
      where: { id: employeeId },
      data: { status: EmployeeStatus.NOTICE_PERIOD },
    });

    // Create or update ExitClearance record
    const clearance = await prisma.exitClearance.create({
      data: {
        tenantId,
        employeeId,
        resignationDate: new Date(resignationDate),
        lastWorkingDay: new Date(lastWorkingDay),
        status: employee.assignedAssets.length > 0 ? 'ASSETS_PENDING' : 'IN_PROGRESS',
        pendingAssetCount: employee.assignedAssets.length,
        itNocIssued: employee.assignedAssets.length === 0, // Auto-NOC only if 0 assets assigned!
        itNocIssuedAt: employee.assignedAssets.length === 0 ? new Date() : null,
      },
    });

    // Auto-generate IT ticket for asset recovery
    if (employee.assignedAssets.length > 0) {
      const ticketCount = await prisma.ticket.count({ where: { tenantId } });
      const ticketNumber = `TKT-${String(ticketCount + 101).padStart(5, '0')}`;
      const assetTags = employee.assignedAssets.map((a) => `${a.name} (${a.assetTag})`).join(', ');

      const itRequester = await prisma.user.findFirst({ where: { tenantId } });
      if (itRequester) {
        await prisma.ticket.create({
          data: {
            tenantId,
            ticketNumber,
            requesterId: itRequester.id,
            title: `[Exit Clearance] Recover ${employee.assignedAssets.length} Hardware Assets from ${employee.firstName} ${employee.lastName}`,
            description: `Employee has resigned. Last working day: ${lastWorkingDay}. Assets to recover before issuing IT NOC for Full & Final Settlement: ${assetTags}.`,
            category: TicketCategoryEnum.HARDWARE,
            priority: TicketPriority.HIGH,
            status: TicketStatus.NEW,
          },
        });
      }
    }

    return res.json({
      message: 'Resignation recorded. Exit clearance and IT asset recovery checklist initiated.',
      clearance,
    });
  } catch (error: any) {
    console.error('Resignation error:', error);
    return res.status(500).json({ error: 'Failed to record resignation' });
  }
});

// GET /api/hr/departments
hrRouter.get('/departments', async (req: Request, res: Response) => {
  const departments = await prisma.department.findMany({
    where: { tenantId: req.tenantId! },
    orderBy: { name: 'asc' },
  });
  return res.json(departments);
});

// GET /api/hr/designations
hrRouter.get('/designations', async (req: Request, res: Response) => {
  const designations = await prisma.designation.findMany({
    where: { tenantId: req.tenantId! },
    orderBy: { title: 'asc' },
  });
  return res.json(designations);
});

// GET /api/hr/locations
hrRouter.get('/locations', async (req: Request, res: Response) => {
  const locations = await prisma.location.findMany({
    where: { tenantId: req.tenantId! },
    orderBy: { name: 'asc' },
  });
  return res.json(locations);
});
