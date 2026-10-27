export type LifecycleStage = 
  | 'candidate' 
  | 'pre_boarding' 
  | 'active' 
  | 'on_leave' 
  | 'offboarding' 
  | 'alumni';

export type EmploymentType = 'full_time' | 'part_time' | 'contractor';

export type WorkMode = 'onsite' | 'hybrid' | 'remote' | 'travel';

export type AttendanceStatus = 
  | 'clocked_in_office' 
  | 'clocked_in_remote' 
  | 'on_break' 
  | 'on_leave' 
  | 'missing_punch' 
  | 'off_duty';

export type PunchLocation = 'office' | 'remote' | 'travel';

export type PermissionScope = 'none' | 'own' | 'direct_reports' | 'department' | 'all';

export interface Department {
  id: string;
  name: string;
  code: string;
  leadEmployeeId: string;
  parentDepartmentId?: string | null;
  budgetHeadcount: number;
  currentHeadcount?: number;
  colorHex?: string;
}

export interface RolePermissions {
  employeeCrud: PermissionScope;
  compensationRead: PermissionScope;
  compensationWrite: PermissionScope;
  attendanceManage: PermissionScope;
  leaveApprove: PermissionScope;
  systemAdmin: PermissionScope;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  hierarchyLevel: number; // 1 = Super Admin, 2 = HR Partner, 3 = Dept Head, 4 = Manager, 5 = Employee, 6 = Contractor
  description: string;
  badgeColor: string;
  permissions: RolePermissions;
  isCustom?: boolean;
}

export interface EmployeeSensitiveData {
  employeeId: string;
  baseSalary: number;
  currency: string;
  payFrequency: 'monthly' | 'bi-weekly' | 'annual';
  bonusTargetPercent: number;
  equityGrantUnits: number;
  taxIdEncrypted: string;
  bankAccountLast4: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
  };
  homeAddress: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  category: 'it' | 'hr' | 'compliance' | 'manager';
  completed: boolean;
  dueDate: string;
  assigneeRole: string;
}

export interface EmployeeDocument {
  id: string;
  name: string;
  type: 'visa' | 'contract' | 'nda' | 'certification' | 'tax';
  uploadDate: string;
  expiryDate?: string;
  fileSize: string;
  status: 'valid' | 'expiring_soon' | 'expired';
}

export interface EmploymentHistoryMilestone {
  id: string;
  employeeId: string;
  changeType: 'promotion' | 'transfer' | 'compensation' | 'manager_change' | 'onboarding' | 'leave_transition';
  title: string;
  description: string;
  changedBy: string;
  previousValue?: string;
  newValue?: string;
  effectiveDate: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  employeeCode: string; // e.g. 'EMP-0142'
  firstName: string;
  lastName: string;
  preferredName?: string;
  email: string;
  avatarUrl: string;
  pronouns?: string;
  departmentId: string;
  roleId: string;
  managerId: string | null; // null for CEO / top lead
  jobTitle: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  status: LifecycleStage;
  timezone: string; // e.g. 'Europe/London' or 'UTC+1'
  hireDate: string;
  terminatedAt?: string | null;
  attendanceStatus: AttendanceStatus;
  skills: string[];
  bio?: string;
  openHeadcountRequisition?: boolean;
  transitionChecklist?: ChecklistItem[];
}

export interface AttendancePunchLog {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  clockIn: string; // ISO
  clockOut: string | null; // ISO
  breakMinutes: number;
  workLocation: PunchLocation;
  status: 'active' | 'completed' | 'missing_out_punch' | 'disputed';
  totalHours: number;
  notes?: string;
  disputeReason?: string;
  suggestedClockOut?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  approverId: string;
  leaveType: 'pto' | 'sick' | 'parental' | 'bereavement' | 'unpaid';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysCount: number;
  halfDay?: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reason: string;
  reviewedAt?: string | null;
  reviewerNotes?: string;
}

export interface ActingDelegation {
  id: string;
  managerId: string;
  actingManagerId: string;
  startDate: string;
  endDate: string;
  reason: string;
  isActive: boolean;
  delegatedScopes: string[];
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  action: 'PII_REVEAL' | 'ROLE_CHANGE' | 'SALARY_UPDATE' | 'MANAGER_REPARENT' | 'STATUS_TRANSITION' | 'TIMESHEET_APPROVE' | 'PUNCH_DISPUTE_RESOLVE';
  targetEmployeeId: string;
  targetEmployeeName: string;
  field?: string;
  timestamp: string;
  ipAddress?: string;
  details: string;
}

export interface BurnoutRiskSignal {
  employeeId: string;
  employeeName: string;
  departmentName: string;
  consecutiveOvertimeWeeks: number;
  averageWeeklyHours: number;
  unutilizedPtoDays: number;
  skippedBreaksCount: number;
  riskLevel: 'moderate' | 'high' | 'critical';
  recommendation: string;
}
