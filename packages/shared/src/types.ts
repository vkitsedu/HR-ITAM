import {
  RoleEnum,
  EmployeeStatus,
  EmploymentType,
  AttendanceMode,
  AttendanceStatus,
  PunchType,
  LeaveTypeEnum,
  LeaveStatus,
  TicketCategoryEnum,
  TicketPriority,
  TicketStatus,
  AssetCategoryEnum,
  AssetStatus,
  CustodyStatus,
  ExitClearanceStatus,
} from './enums.js';

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: RoleEnum;
  employeeId?: string;
}

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleEnum;
  tenantId: string;
  employeeId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface EmployeeDto {
  id: string;
  tenantId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentId: string;
  departmentName?: string;
  designationId: string;
  designationTitle?: string;
  locationId: string;
  locationName?: string;
  managerId?: string;
  managerName?: string;
  joiningDate: string;
  confirmationDate?: string;
  status: EmployeeStatus;
  employmentType: EmploymentType;
  assignedAssetCount?: number;
  openTicketCount?: number;
}

export interface LocationDto {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number;
}

export interface ShiftDto {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  startTime: string; // "09:00"
  endTime: string;   // "18:00"
  gracePeriodMinutes: number;
  halfDayThresholdMinutes: number;
  fullDayThresholdMinutes: number;
}

export interface AttendancePunchDto {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName?: string;
  timestamp: string;
  punchType: PunchType;
  mode: AttendanceMode;
  latitude?: number;
  longitude?: number;
  isWithinGeofence: boolean;
  deviceId?: string;
}

export interface DailyAttendanceDto {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName?: string;
  date: string;
  shiftId: string;
  firstCheckIn?: string;
  lastCheckOut?: string;
  totalWorkMinutes: number;
  status: AttendanceStatus;
  isLate: boolean;
  isEarlyDeparture: boolean;
  regularizationRequested: boolean;
  regularizationApproved?: boolean;
}

export interface LeaveRequestDto {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName?: string;
  leaveType: LeaveTypeEnum;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  approverId?: string;
  approverComments?: string;
  appliedAt: string;
}

export interface TicketDto {
  id: string;
  ticketNumber: string;
  tenantId: string;
  requesterId: string;
  requesterName?: string;
  assigneeId?: string;
  assigneeName?: string;
  title: string;
  description: string;
  category: TicketCategoryEnum;
  priority: TicketPriority;
  status: TicketStatus;
  linkedAssetId?: string;
  linkedAssetName?: string;
  responseDueAt?: string;
  resolutionDueAt?: string;
  isSlaBreached: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssetDto {
  id: string;
  assetTag: string; // e.g. "AST-LAP-00124"
  tenantId: string;
  name: string;
  category: AssetCategoryEnum;
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  purchaseCost: number;
  currentBookValue: number;
  warrantyExpiry?: string;
  status: AssetStatus;
  assignedToEmployeeId?: string;
  assignedToEmployeeName?: string;
  custodyStatus?: CustodyStatus;
  locationId?: string;
  locationName?: string;
  lastAuditedAt?: string;
  lastAuditedBy?: string;
}

export interface CustodyReceiptDto {
  id: string;
  tenantId: string;
  assetId: string;
  assetTag: string;
  employeeId: string;
  employeeName: string;
  status: CustodyStatus;
  assignedAt: string;
  acknowledgedAt?: string;
  signatureData?: string;
  returnedAt?: string;
  verifiedByItTechnicianId?: string;
}

export interface ExitClearanceDto {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  resignationDate: string;
  lastWorkingDay: string;
  status: ExitClearanceStatus;
  itNocIssued: boolean;
  itNocIssuedAt?: string;
  pendingAssetTags: string[];
  hrNocIssued: boolean;
  financeNocIssued: boolean;
}

export interface DashboardStatsDto {
  totalHeadcount: number;
  todayPresentCount: number;
  todayAbsentCount: number;
  todayLateCount: number;
  openTicketsCount: number;
  slaBreachedTicketsCount: number;
  totalAssetsCount: number;
  assignedAssetsCount: number;
  idleAssetsCount: number;
  totalAssetValue: number;
  pendingExitClearancesCount: number;
}

export interface AuditLogDto {
  id: string;
  tenantId: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface SystemNotificationDto {
  id: string;
  tenantId: string;
  userId?: string;
  role?: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
  link?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

