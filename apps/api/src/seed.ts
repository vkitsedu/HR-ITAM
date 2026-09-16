import bcrypt from 'bcryptjs';
import { prisma } from '@empops/database';
import {
  RoleEnum,
  EmployeeStatus,
  EmploymentType,
  AttendanceMode,
  PunchType,
  AttendanceStatus,
  AssetCategoryEnum,
  AssetStatus,
  CustodyStatus,
  TicketCategoryEnum,
  TicketPriority,
  TicketStatus,
} from '@empops/shared';

async function main() {
  console.log('🌱 Seeding EmpOps Enterprise Demo Data...');

  // Clean existing data
  await prisma.systemNotification.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.custodyReceipt.deleteMany({});
  await prisma.ticketComment.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.exitClearance.deleteMany({});
  await prisma.attendancePunch.deleteMany({});
  await prisma.dailyAttendance.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.shift.deleteMany({});
  await prisma.designation.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.location.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.tenant.deleteMany({});

  // 1. Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'ACME Technologies India Pvt Ltd',
      slug: 'acme',
    },
  });

  // 2. Organization
  const org = await prisma.organization.create({
    data: {
      tenantId: tenant.id,
      name: 'ACME Technologies Group',
      legalEntity: 'ACME Technologies India Private Limited',
      cinOrGstin: '29AABCU9603R1ZM',
    },
  });

  // 3. Locations
  const blrLoc = await prisma.location.create({
    data: {
      tenantId: tenant.id,
      organizationId: org.id,
      name: 'Bengaluru HQ (Koramangala)',
      code: 'BLR-HQ',
      address: '7th Block, 80 Feet Road, Koramangala',
      city: 'Bengaluru',
      latitude: 12.9352,
      longitude: 77.6245,
      geofenceRadiusMeters: 250.0,
    },
  });

  const hydLoc = await prisma.location.create({
    data: {
      tenantId: tenant.id,
      organizationId: org.id,
      name: 'Hyderabad Tech Hub (HITEC City)',
      code: 'HYD-01',
      address: 'Madhapur, HITEC City Phase 2',
      city: 'Hyderabad',
      latitude: 17.4435,
      longitude: 78.3772,
      geofenceRadiusMeters: 300.0,
    },
  });

  // 4. Departments
  const deptEng = await prisma.department.create({
    data: { tenantId: tenant.id, organizationId: org.id, name: 'Engineering', code: 'ENG' },
  });
  const deptHr = await prisma.department.create({
    data: { tenantId: tenant.id, organizationId: org.id, name: 'Human Resources', code: 'HR' },
  });
  const deptIt = await prisma.department.create({
    data: { tenantId: tenant.id, organizationId: org.id, name: 'IT Infrastructure', code: 'IT' },
  });
  const deptProduct = await prisma.department.create({
    data: { tenantId: tenant.id, organizationId: org.id, name: 'Product & Design', code: 'PROD' },
  });

  // 5. Designations
  const desVpEng = await prisma.designation.create({
    data: { tenantId: tenant.id, title: 'VP of Engineering', code: 'VP-ENG' },
  });
  const desSrEng = await prisma.designation.create({
    data: { tenantId: tenant.id, title: 'Senior Software Engineer', code: 'SR-SWE' },
  });
  const desHrMgr = await prisma.designation.create({
    data: { tenantId: tenant.id, title: 'Lead HR Operations Specialist', code: 'HR-LEAD' },
  });
  const desItMgr = await prisma.designation.create({
    data: { tenantId: tenant.id, title: 'Head of IT & Infrastructure', code: 'IT-HEAD' },
  });
  const desItTech = await prisma.designation.create({
    data: { tenantId: tenant.id, title: 'IT Systems Engineer', code: 'IT-SYS' },
  });
  const desDesigner = await prisma.designation.create({
    data: { tenantId: tenant.id, title: 'Lead Product Designer', code: 'DES-LEAD' },
  });

  // 6. Shift
  const shift = await prisma.shift.create({
    data: {
      tenantId: tenant.id,
      name: 'General Day Shift (9 AM - 6 PM)',
      code: 'GEN-0918',
      startTime: '09:00',
      endTime: '18:00',
      gracePeriodMinutes: 15,
      halfDayThresholdMinutes: 240,
      fullDayThresholdMinutes: 480,
    },
  });

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 7. Employees & Linked Users
  // Employee 1: HR Manager (Priya Sharma)
  const empHr = await prisma.employee.create({
    data: {
      tenantId: tenant.id,
      employeeCode: 'EMP-001',
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'hr@acme.com',
      phone: '+91 98765 43210',
      departmentId: deptHr.id,
      designationId: desHrMgr.id,
      locationId: blrLoc.id,
      joiningDate: new Date('2023-01-10'),
      status: EmployeeStatus.CONFIRMED,
      employmentType: EmploymentType.FULL_TIME,
    },
  });

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'hr@acme.com',
      passwordHash,
      firstName: 'Priya',
      lastName: 'Sharma',
      role: RoleEnum.HR_MANAGER,
      employeeId: empHr.id,
    },
  });

  // Employee 2: IT Manager (Rajesh Kumar)
  const empIt = await prisma.employee.create({
    data: {
      tenantId: tenant.id,
      employeeCode: 'EMP-002',
      firstName: 'Rajesh',
      lastName: 'Kumar',
      email: 'it@acme.com',
      phone: '+91 98765 43211',
      departmentId: deptIt.id,
      designationId: desItMgr.id,
      locationId: blrLoc.id,
      joiningDate: new Date('2023-02-01'),
      status: EmployeeStatus.CONFIRMED,
      employmentType: EmploymentType.FULL_TIME,
    },
  });

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'it@acme.com',
      passwordHash,
      firstName: 'Rajesh',
      lastName: 'Kumar',
      role: RoleEnum.IT_MANAGER,
      employeeId: empIt.id,
    },
  });

  // Employee 3: IT Technician (Vikram Singh)
  const empTech = await prisma.employee.create({
    data: {
      tenantId: tenant.id,
      employeeCode: 'EMP-003',
      firstName: 'Vikram',
      lastName: 'Singh',
      email: 'tech@acme.com',
      phone: '+91 98765 43212',
      departmentId: deptIt.id,
      designationId: desItTech.id,
      locationId: blrLoc.id,
      managerId: empIt.id,
      joiningDate: new Date('2023-05-15'),
      status: EmployeeStatus.CONFIRMED,
      employmentType: EmploymentType.FULL_TIME,
    },
  });

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'tech@acme.com',
      passwordHash,
      firstName: 'Vikram',
      lastName: 'Singh',
      role: RoleEnum.IT_TECHNICIAN,
      employeeId: empTech.id,
    },
  });

  // Employee 4: Senior Software Engineer (Rahul Verma)
  const empRahul = await prisma.employee.create({
    data: {
      tenantId: tenant.id,
      employeeCode: 'EMP-004',
      firstName: 'Rahul',
      lastName: 'Verma',
      email: 'employee@acme.com',
      phone: '+91 98765 43213',
      departmentId: deptEng.id,
      designationId: desSrEng.id,
      locationId: blrLoc.id,
      joiningDate: new Date('2023-06-01'),
      status: EmployeeStatus.CONFIRMED,
      employmentType: EmploymentType.FULL_TIME,
    },
  });

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'employee@acme.com',
      passwordHash,
      firstName: 'Rahul',
      lastName: 'Verma',
      role: RoleEnum.EMPLOYEE,
      employeeId: empRahul.id,
    },
  });

  // Employee 5: Product Designer (Amit Patel)
  const empAmit = await prisma.employee.create({
    data: {
      tenantId: tenant.id,
      employeeCode: 'EMP-005',
      firstName: 'Amit',
      lastName: 'Patel',
      email: 'amit@acme.com',
      phone: '+91 98765 43214',
      departmentId: deptProduct.id,
      designationId: desDesigner.id,
      locationId: hydLoc.id,
      joiningDate: new Date('2023-09-01'),
      status: EmployeeStatus.CONFIRMED,
      employmentType: EmploymentType.FULL_TIME,
    },
  });

  // Employee 6: New Joiner in Probation (Sneha Rao)
  const empSneha = await prisma.employee.create({
    data: {
      tenantId: tenant.id,
      employeeCode: 'EMP-006',
      firstName: 'Sneha',
      lastName: 'Rao',
      email: 'sneha@acme.com',
      phone: '+91 98765 43215',
      departmentId: deptEng.id,
      designationId: desSrEng.id,
      locationId: blrLoc.id,
      managerId: empRahul.id,
      joiningDate: new Date('2026-09-01'),
      status: EmployeeStatus.PROBATION,
      employmentType: EmploymentType.FULL_TIME,
    },
  });

  // 8. Assets
  const macbookPro = await prisma.asset.create({
    data: {
      tenantId: tenant.id,
      assetTag: 'AST-LAP-00101',
      name: 'Apple MacBook Pro 16" M3 Pro',
      category: AssetCategoryEnum.LAPTOP,
      brand: 'Apple',
      model: 'MacBook Pro 16-inch (2023)',
      serialNumber: 'C02G87Y0MD6R',
      purchaseDate: new Date('2023-06-05'),
      purchaseCost: 249900.0,
      currentBookValue: 180000.0,
      warrantyExpiry: new Date('2026-06-05'),
      status: AssetStatus.ASSIGNED,
      assignedToEmployeeId: empRahul.id,
      locationId: blrLoc.id,
    },
  });

  await prisma.custodyReceipt.create({
    data: {
      tenantId: tenant.id,
      assetId: macbookPro.id,
      employeeId: empRahul.id,
      status: CustodyStatus.ACKNOWLEDGED,
      assignedAt: new Date('2023-06-06'),
      acknowledgedAt: new Date('2023-06-06T10:15:00Z'),
      signatureData: 'SIG_DIGITAL_VERIFIED_C02G87Y0MD6R_RAHUL_VERMA',
    },
  });

  const thinkpadT14 = await prisma.asset.create({
    data: {
      tenantId: tenant.id,
      assetTag: 'AST-LAP-00102',
      name: 'Lenovo ThinkPad T14s Gen 4',
      category: AssetCategoryEnum.LAPTOP,
      brand: 'Lenovo',
      model: 'ThinkPad T14s (Intel Core i7)',
      serialNumber: 'PF3X89Q1',
      purchaseDate: new Date('2023-09-05'),
      purchaseCost: 118000.0,
      currentBookValue: 92000.0,
      warrantyExpiry: new Date('2026-09-05'),
      status: AssetStatus.ASSIGNED,
      assignedToEmployeeId: empAmit.id,
      locationId: hydLoc.id,
    },
  });

  await prisma.custodyReceipt.create({
    data: {
      tenantId: tenant.id,
      assetId: thinkpadT14.id,
      employeeId: empAmit.id,
      status: CustodyStatus.ACKNOWLEDGED,
      assignedAt: new Date('2023-09-06'),
      acknowledgedAt: new Date('2023-09-06T11:30:00Z'),
      signatureData: 'SIG_DIGITAL_VERIFIED_PF3X89Q1_AMIT_PATEL',
    },
  });

  // Dell Laptop assigned to Sneha (PENDING ACKNOWLEDGEMENT)
  const dellLatitude = await prisma.asset.create({
    data: {
      tenantId: tenant.id,
      assetTag: 'AST-LAP-00103',
      name: 'Dell Latitude 5440 (14-inch)',
      category: AssetCategoryEnum.LAPTOP,
      brand: 'Dell',
      model: 'Latitude 5440 i5 13th Gen',
      serialNumber: '7H8KJ92',
      purchaseDate: new Date('2026-08-20'),
      purchaseCost: 86500.0,
      currentBookValue: 86500.0,
      warrantyExpiry: new Date('2029-08-20'),
      status: AssetStatus.ASSIGNED,
      assignedToEmployeeId: empSneha.id,
      locationId: blrLoc.id,
    },
  });

  await prisma.custodyReceipt.create({
    data: {
      tenantId: tenant.id,
      assetId: dellLatitude.id,
      employeeId: empSneha.id,
      status: CustodyStatus.PENDING_ACKNOWLEDGEMENT,
      assignedAt: new Date('2026-09-02'),
    },
  });

  // Idle Assets in inventory
  await prisma.asset.create({
    data: {
      tenantId: tenant.id,
      assetTag: 'AST-MON-00104',
      name: 'Dell UltraSharp 27" 4K USB-C Hub Monitor',
      category: AssetCategoryEnum.MONITOR,
      brand: 'Dell',
      model: 'U2723QE',
      serialNumber: 'CN-09K871',
      purchaseDate: new Date('2024-01-15'),
      purchaseCost: 48900.0,
      currentBookValue: 38000.0,
      status: AssetStatus.IN_STOCK,
      locationId: blrLoc.id,
    },
  });

  // 9. IT Tickets
  const userAdmin = await prisma.user.findFirst({ where: { email: 'it@acme.com' } });
  const userRahul = await prisma.user.findFirst({ where: { email: 'employee@acme.com' } });

  await prisma.ticket.create({
    data: {
      tenantId: tenant.id,
      ticketNumber: 'TKT-00101',
      requesterId: userAdmin!.id,
      assigneeId: userAdmin!.id,
      title: '[Auto-Provision] Hardware & Network Setup for Sneha Rao (EMP-006)',
      description: 'Onboarding trigger: Dell Latitude 5440 assigned. Awaiting employee custody digital sign-off and Slack/GitHub access configuration.',
      category: TicketCategoryEnum.HARDWARE,
      priority: TicketPriority.HIGH,
      status: TicketStatus.IN_PROGRESS,
      linkedAssetId: dellLatitude.id,
      responseDueAt: new Date(Date.now() - 2 * 3600 * 1000),
      resolutionDueAt: new Date(Date.now() + 24 * 3600 * 1000),
    },
  });

  await prisma.ticket.create({
    data: {
      tenantId: tenant.id,
      ticketNumber: 'TKT-00102',
      requesterId: userRahul!.id,
      title: 'Request second 4K monitor for local microservices debugging',
      description: 'Need an additional external display to monitor multiple container logs and test suites simultaneously.',
      category: TicketCategoryEnum.HARDWARE,
      priority: TicketPriority.MEDIUM,
      status: TicketStatus.NEW,
      linkedAssetId: macbookPro.id,
      responseDueAt: new Date(Date.now() + 4 * 3600 * 1000),
      resolutionDueAt: new Date(Date.now() + 48 * 3600 * 1000),
    },
  });

  // 10. Daily Attendance & Punches
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();

  // Rahul: Checked in at 09:05 AM (on time, within grace period)
  const rahulCheckIn = new Date(now);
  rahulCheckIn.setHours(9, 5, 0, 0);

  await prisma.attendancePunch.create({
    data: {
      tenantId: tenant.id,
      employeeId: empRahul.id,
      timestamp: rahulCheckIn,
      punchType: PunchType.CHECK_IN,
      mode: AttendanceMode.MOBILE_GPS,
      latitude: 12.9351,
      longitude: 77.6244,
      isWithinGeofence: true,
    },
  });

  await prisma.dailyAttendance.create({
    data: {
      tenantId: tenant.id,
      employeeId: empRahul.id,
      date: todayStr,
      shiftId: shift.id,
      firstCheckIn: rahulCheckIn,
      status: AttendanceStatus.PRESENT,
      isLate: false,
    },
  });

  // Priya: Checked in at 09:22 AM (late mark)
  const priyaCheckIn = new Date(now);
  priyaCheckIn.setHours(9, 22, 0, 0);

  await prisma.attendancePunch.create({
    data: {
      tenantId: tenant.id,
      employeeId: empHr.id,
      timestamp: priyaCheckIn,
      punchType: PunchType.CHECK_IN,
      mode: AttendanceMode.WEB_PORTAL,
      isWithinGeofence: true,
    },
  });

  await prisma.dailyAttendance.create({
    data: {
      tenantId: tenant.id,
      employeeId: empHr.id,
      date: todayStr,
      shiftId: shift.id,
      firstCheckIn: priyaCheckIn,
      status: AttendanceStatus.PRESENT,
      isLate: true,
    },
  });

  // 12. Seed Notifications
  await prisma.systemNotification.createMany({
    data: [
      {
        tenantId: tenant.id,
        role: RoleEnum.IT_MANAGER,
        title: 'Pending Asset Custody Signoff',
        message: 'Aman Verma (EMP-004) has 1 pending digital custody receipt awaiting signature.',
        type: 'WARNING',
        link: '/itam',
        isRead: false,
      },
      {
        tenantId: tenant.id,
        role: RoleEnum.IT_MANAGER,
        title: 'High Priority SLA Alert',
        message: 'Ticket INC-2026-0001: Critical Database Connection Pool Exhausted is due in 3 hours.',
        type: 'ALERT',
        link: '/itsm',
        isRead: false,
      },
      {
        tenantId: tenant.id,
        role: RoleEnum.HR_MANAGER,
        title: 'Exit Clearance In Progress',
        message: 'Neha Reddy (EMP-005) resignation submitted. IT NOC is pending asset recovery.',
        type: 'INFO',
        link: '/exit-clearance',
        isRead: false,
      },
      {
        tenantId: tenant.id,
        role: RoleEnum.EMPLOYEE,
        title: 'Asset Custody Action Required',
        message: 'You have been assigned Apple MacBook Pro 16" (AST-LAP-00124). Please review and sign custody.',
        type: 'WARNING',
        link: '/ess',
        isRead: false,
      },
    ],
  });

  // 13. Seed Audit Trail
  await prisma.auditLog.createMany({
    data: [
      {
        tenantId: tenant.id,
        action: 'ASSET_CREATED',
        entityType: 'Asset',
        entityId: 'AST-LAP-00124',
        details: JSON.stringify({ assetTag: 'AST-LAP-00124', name: 'MacBook Pro 16" M3 Max', brand: 'Apple' }),
        createdAt: new Date(Date.now() - 86400000 * 5),
      },
      {
        tenantId: tenant.id,
        action: 'ASSET_ASSIGNED',
        entityType: 'Asset',
        entityId: 'AST-LAP-00124',
        details: JSON.stringify({ assetTag: 'AST-LAP-00124', employeeCode: 'EMP-004', employeeName: 'Aman Verma' }),
        createdAt: new Date(Date.now() - 86400000 * 4),
      },
      {
        tenantId: tenant.id,
        action: 'TICKET_CREATED',
        entityType: 'Ticket',
        entityId: 'INC-2026-0001',
        details: JSON.stringify({ ticketNumber: 'INC-2026-0001', priority: 'HIGH', title: 'Critical Database Connection Pool Exhausted' }),
        createdAt: new Date(Date.now() - 86400000 * 2),
      },
      {
        tenantId: tenant.id,
        action: 'ASSET_AUDITED',
        entityType: 'Asset',
        entityId: 'AST-LAP-00125',
        details: JSON.stringify({ assetTag: 'AST-LAP-00125', name: 'Dell Precision 5570', auditedBy: 'it@acme.com', notes: 'Physical barcode scanned & verified at Bengaluru HQ' }),
        createdAt: new Date(Date.now() - 86400000 * 1),
      },
      {
        tenantId: tenant.id,
        action: 'RESIGNATION_FILED',
        entityType: 'ExitClearance',
        entityId: 'EMP-005',
        details: JSON.stringify({ employeeCode: 'EMP-005', employeeName: 'Neha Reddy', status: 'IN_PROGRESS' }),
        createdAt: new Date(Date.now() - 86400000 * 1),
      },
    ],
  });

  console.log('✅ Seeding complete!');
  console.log('Credentials:');
  console.log('  HR Manager:      hr@acme.com / Password123!');
  console.log('  IT Manager:      it@acme.com / Password123!');
  console.log('  IT Technician:   tech@acme.com / Password123!');
  console.log('  Employee:        employee@acme.com / Password123!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
