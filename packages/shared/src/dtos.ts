import { z } from 'zod';
import {
  RoleEnum,
  EmployeeStatus,
  EmploymentType,
  AttendanceMode,
  PunchType,
  LeaveTypeEnum,
  TicketCategoryEnum,
  TicketPriority,
  AssetCategoryEnum,
} from './enums.js';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  tenantSlug: z.string().min(2).optional(),
});

export const CreateEmployeeSchema = z.object({
  employeeCode: z.string().min(2),
  firstName: z.string().min(2),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  departmentId: z.string().uuid(),
  designationId: z.string().uuid(),
  locationId: z.string().uuid(),
  managerId: z.string().uuid().optional(),
  joiningDate: z.string(),
  employmentType: z.nativeEnum(EmploymentType),
  autoProvisionHardware: z.boolean().default(true),
});

export const AttendancePunchSchema = z.object({
  employeeId: z.string().uuid(),
  punchType: z.nativeEnum(PunchType),
  mode: z.nativeEnum(AttendanceMode),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  deviceId: z.string().optional(),
});

export const CreateLeaveRequestSchema = z.object({
  employeeId: z.string().uuid(),
  leaveType: z.nativeEnum(LeaveTypeEnum),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(5),
});

export const CreateTicketSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  category: z.nativeEnum(TicketCategoryEnum),
  priority: z.nativeEnum(TicketPriority).default(TicketPriority.MEDIUM),
  linkedAssetId: z.string().uuid().optional(),
});

export const CreateAssetSchema = z.object({
  assetTag: z.string().min(3),
  name: z.string().min(2),
  category: z.nativeEnum(AssetCategoryEnum),
  brand: z.string(),
  model: z.string(),
  serialNumber: z.string().min(3),
  purchaseDate: z.string(),
  purchaseCost: z.number().positive(),
  warrantyExpiry: z.string().optional(),
  locationId: z.string().uuid(),
});

export const AssignAssetSchema = z.object({
  assetId: z.string().uuid(),
  employeeId: z.string().uuid(),
  notes: z.string().optional(),
});

export const CustodySignoffSchema = z.object({
  custodyReceiptId: z.string().uuid(),
  signatureData: z.string().min(10), // Base64 or cryptographic signature string
  acceptedTerms: z.literal(true),
});

export const ResignEmployeeSchema = z.object({
  employeeId: z.string().uuid(),
  resignationDate: z.string(),
  lastWorkingDay: z.string(),
  reason: z.string().min(5),
});
