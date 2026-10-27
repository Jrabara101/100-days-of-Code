import { 
  Employee, 
  Department, 
  Role, 
  EmployeeSensitiveData, 
  EmploymentHistoryMilestone, 
  AttendancePunchLog, 
  LeaveRequest, 
  ActingDelegation, 
  AuditLogEntry, 
  EmployeeDocument,
  BurnoutRiskSignal,
  LifecycleStage,
  WorkMode,
  PunchLocation,
  AttendanceStatus
} from '../types';

import { 
  initialEmployees, 
  initialDepartments, 
  initialRoles, 
  initialSensitiveData, 
  initialEmploymentHistory, 
  initialAttendanceLogs, 
  initialLeaveRequests, 
  initialDelegations, 
  initialDocuments, 
  initialAuditLogs, 
  initialBurnoutSignals 
} from '../data/initialData';

const STORAGE_KEYS = {
  EMPLOYEES: 'aura_employees_v1',
  DEPARTMENTS: 'aura_departments_v1',
  ROLES: 'aura_roles_v1',
  SENSITIVE_DATA: 'aura_sensitive_data_v1',
  EMPLOYMENT_HISTORY: 'aura_history_v1',
  ATTENDANCE_LOGS: 'aura_attendance_v1',
  LEAVE_REQUESTS: 'aura_leave_v1',
  DELEGATIONS: 'aura_delegations_v1',
  DOCUMENTS: 'aura_documents_v1',
  AUDIT_LOGS: 'aura_audit_v1',
  BURNOUT_SIGNALS: 'aura_burnout_v1',
  ACTIVE_USER_ID: 'aura_active_user_id_v1',
  THEME_MODE: 'aura_theme_mode_v1'
};

type Listener = () => void;

class StorageService {
  private listeners: Set<Listener> = new Set();

  private load<T>(key: string, defaultValue: T): T {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn(`Failed to parse storage key: ${key}`, e);
    }
    return defaultValue;
  }

  private save<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.notify();
    } catch (e) {
      console.error(`Failed to save storage key: ${key}`, e);
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error(err);
      }
    });
  }

  // Reset to original enterprise seed data
  public resetToDefaults(): void {
    localStorage.clear();
    this.save(STORAGE_KEYS.EMPLOYEES, initialEmployees);
    this.save(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
    this.save(STORAGE_KEYS.ROLES, initialRoles);
    this.save(STORAGE_KEYS.SENSITIVE_DATA, initialSensitiveData);
    this.save(STORAGE_KEYS.EMPLOYMENT_HISTORY, initialEmploymentHistory);
    this.save(STORAGE_KEYS.ATTENDANCE_LOGS, initialAttendanceLogs);
    this.save(STORAGE_KEYS.LEAVE_REQUESTS, initialLeaveRequests);
    this.save(STORAGE_KEYS.DELEGATIONS, initialDelegations);
    this.save(STORAGE_KEYS.DOCUMENTS, initialDocuments);
    this.save(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
    this.save(STORAGE_KEYS.BURNOUT_SIGNALS, initialBurnoutSignals);
    this.save(STORAGE_KEYS.ACTIVE_USER_ID, 'emp-001'); // Default to Devon Kaufman (Super Admin)
    this.save(STORAGE_KEYS.THEME_MODE, 'dark');
    this.notify();
  }

  // Active User / Persona
  public getActiveUserId(): string {
    return this.load<string>(STORAGE_KEYS.ACTIVE_USER_ID, 'emp-001');
  }

  public setActiveUserId(userId: string): void {
    this.save(STORAGE_KEYS.ACTIVE_USER_ID, userId);
  }

  // Theme
  public getTheme(): 'dark' | 'light' {
    return this.load<'dark' | 'light'>(STORAGE_KEYS.THEME_MODE, 'dark');
  }

  public setTheme(theme: 'dark' | 'light'): void {
    this.save(STORAGE_KEYS.THEME_MODE, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // Employees
  public getEmployees(): Employee[] {
    return this.load<Employee[]>(STORAGE_KEYS.EMPLOYEES, initialEmployees);
  }

  public getEmployeeById(id: string): Employee | undefined {
    return this.getEmployees().find(e => e.id === id);
  }

  public addEmployee(emp: Omit<Employee, 'id'>, sensitive?: Partial<EmployeeSensitiveData>): Employee {
    const employees = this.getEmployees();
    const id = `emp-${Date.now().toString(36)}`;
    const newEmp: Employee = {
      ...emp,
      id
    };
    employees.push(newEmp);
    this.save(STORAGE_KEYS.EMPLOYEES, employees);

    if (sensitive) {
      const allSens = this.getSensitiveDataMap();
      allSens[id] = {
        employeeId: id,
        baseSalary: sensitive.baseSalary || 120000,
        currency: sensitive.currency || 'USD',
        payFrequency: sensitive.payFrequency || 'monthly',
        bonusTargetPercent: sensitive.bonusTargetPercent || 15,
        equityGrantUnits: sensitive.equityGrantUnits || 50000,
        taxIdEncrypted: sensitive.taxIdEncrypted || 'US-SSN-***-**-9912',
        bankAccountLast4: sensitive.bankAccountLast4 || '4321',
        homeAddress: sensitive.homeAddress || '100 Silicon Way, Tech City, CA',
        emergencyContact: sensitive.emergencyContact || {
          name: 'Emergency Contact',
          relationship: 'Partner',
          phone: '+1 555 019 2831',
          email: 'contact@example.com'
        }
      };
      this.save(STORAGE_KEYS.SENSITIVE_DATA, allSens);
    }

    // Add milestone
    this.addMilestone({
      employeeId: id,
      changeType: 'onboarding',
      title: 'Joined Organization',
      description: `Welcomed to ${this.getDepartmentById(newEmp.departmentId)?.name || 'the team'} as ${newEmp.jobTitle}.`,
      changedBy: this.getActiveEmployee()?.firstName || 'System Admin',
      effectiveDate: newEmp.hireDate
    });

    // Add audit log
    this.addAuditLog({
      action: 'STATUS_TRANSITION',
      targetEmployeeId: id,
      targetEmployeeName: `${newEmp.firstName} ${newEmp.lastName}`,
      details: `Created new employee profile with code ${newEmp.employeeCode}`
    });

    return newEmp;
  }

  public updateEmployee(id: string, updates: Partial<Employee>): Employee | undefined {
    const employees = this.getEmployees();
    const idx = employees.findIndex(e => e.id === id);
    if (idx === -1) return undefined;

    const oldEmp = employees[idx];
    const updated = { ...oldEmp, ...updates };

    // Detect manager reparenting
    if (updates.managerId !== undefined && updates.managerId !== oldEmp.managerId) {
      const oldMgr = oldEmp.managerId ? this.getEmployeeById(oldEmp.managerId)?.firstName : 'Executive Lead';
      const newMgr = updates.managerId ? this.getEmployeeById(updates.managerId)?.firstName : 'Executive Lead';
      this.addMilestone({
        employeeId: id,
        changeType: 'manager_change',
        title: 'Reporting Hierarchy Reassignment',
        description: `Manager updated from ${oldMgr} to ${newMgr}.`,
        changedBy: this.getActiveEmployee()?.firstName || 'HR Admin',
        previousValue: oldMgr || 'None',
        newValue: newMgr || 'None',
        effectiveDate: new Date().toISOString().split('T')[0]
      });
      this.addAuditLog({
        action: 'MANAGER_REPARENT',
        targetEmployeeId: id,
        targetEmployeeName: `${updated.firstName} ${updated.lastName}`,
        field: 'manager_id',
        details: `Reassigned reporting chain to ${newMgr}`
      });
    }

    // Detect department transfer
    if (updates.departmentId && updates.departmentId !== oldEmp.departmentId) {
      const oldDept = this.getDepartmentById(oldEmp.departmentId)?.name;
      const newDept = this.getDepartmentById(updates.departmentId)?.name;
      this.addMilestone({
        employeeId: id,
        changeType: 'transfer',
        title: 'Departmental Transfer',
        description: `Transferred squad from ${oldDept} to ${newDept}.`,
        changedBy: this.getActiveEmployee()?.firstName || 'HR Admin',
        previousValue: oldDept,
        newValue: newDept,
        effectiveDate: new Date().toISOString().split('T')[0]
      });
    }

    // Detect job title / promotion
    if (updates.jobTitle && updates.jobTitle !== oldEmp.jobTitle) {
      this.addMilestone({
        employeeId: id,
        changeType: 'promotion',
        title: 'Title / Role Advancement',
        description: `Promoted/Updated title to ${updates.jobTitle}.`,
        changedBy: this.getActiveEmployee()?.firstName || 'HR Admin',
        previousValue: oldEmp.jobTitle,
        newValue: updates.jobTitle,
        effectiveDate: new Date().toISOString().split('T')[0]
      });
    }

    employees[idx] = updated;
    this.save(STORAGE_KEYS.EMPLOYEES, employees);
    return updated;
  }

  public updateLifecycleStage(id: string, newStage: LifecycleStage): void {
    const emp = this.getEmployeeById(id);
    if (!emp) return;

    const oldStage = emp.status;
    let newAttendance: AttendanceStatus = emp.attendanceStatus;
    if (newStage === 'on_leave') newAttendance = 'on_leave';
    if (newStage === 'alumni' || newStage === 'offboarding') newAttendance = 'off_duty';
    if (newStage === 'active' && emp.attendanceStatus === 'on_leave') newAttendance = 'clocked_in_office';

    // Generate checklist if transitioning
    let checklist = emp.transitionChecklist || [];
    if (newStage === 'offboarding' && (!checklist.length || oldStage !== 'offboarding')) {
      checklist = [
        { id: 'off-1', title: 'Revoke Single Sign-On, GitHub & AWS Access', category: 'it', completed: false, dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], assigneeRole: 'Security Admin' },
        { id: 'off-2', title: 'Conduct Exit Interview & Feedback Synthesis', category: 'hr', completed: false, dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], assigneeRole: 'HR Partner' },
        { id: 'off-3', title: 'Knowledge Transfer & Project Handoff Documentation', category: 'manager', completed: false, dueDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0], assigneeRole: 'Team Manager' },
        { id: 'off-4', title: 'Collect Company Laptop, YubiKey & Building Badge', category: 'it', completed: false, dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], assigneeRole: 'IT Ops' },
        { id: 'off-5', title: 'Process Final Salary, Accrued PTO Payout & Equity Vesting', category: 'compliance', completed: false, dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], assigneeRole: 'Payroll Lead' }
      ];
    } else if (newStage === 'active' && oldStage === 'pre_boarding') {
      checklist = [
        { id: 'act-1', title: 'Day 1 Orientation & Company Culture Welcome', category: 'hr', completed: true, dueDate: new Date().toISOString().split('T')[0], assigneeRole: 'HR Partner' },
        { id: 'act-2', title: 'Hardware Verification & Dev Environment Bootstrapped', category: 'it', completed: true, dueDate: new Date().toISOString().split('T')[0], assigneeRole: 'IT Admin' },
        { id: 'act-3', title: '30-Day OKR & Milestone Alignment Meeting', category: 'manager', completed: false, dueDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0], assigneeRole: 'Manager' }
      ];
    }

    this.updateEmployee(id, { 
      status: newStage, 
      attendanceStatus: newAttendance,
      transitionChecklist: checklist,
      terminatedAt: newStage === 'alumni' ? new Date().toISOString().split('T')[0] : emp.terminatedAt
    });

    this.addMilestone({
      employeeId: id,
      changeType: 'leave_transition',
      title: `Lifecycle State Changed to ${newStage.toUpperCase().replace('_', ' ')}`,
      description: `Transitioned from ${oldStage} to ${newStage}. Contextual checklist updated.`,
      changedBy: this.getActiveEmployee()?.firstName || 'HR Partner',
      previousValue: oldStage,
      newValue: newStage,
      effectiveDate: new Date().toISOString().split('T')[0]
    });

    this.addAuditLog({
      action: 'STATUS_TRANSITION',
      targetEmployeeId: id,
      targetEmployeeName: `${emp.firstName} ${emp.lastName}`,
      field: 'status',
      details: `Lifecycle state shifted: ${oldStage} -> ${newStage}`
    });
  }

  public bulkUpdate(ids: string[], updates: Partial<Employee>): void {
    const employees = this.getEmployees();
    const updatedEmployees = employees.map(emp => {
      if (ids.includes(emp.id)) {
        return { ...emp, ...updates };
      }
      return emp;
    });
    this.save(STORAGE_KEYS.EMPLOYEES, updatedEmployees);

    this.addAuditLog({
      action: 'STATUS_TRANSITION',
      targetEmployeeId: 'bulk',
      targetEmployeeName: `${ids.length} employees`,
      details: `Bulk triage executed: updated ${Object.keys(updates).join(', ')} across ${ids.length} teammates.`
    });
  }

  // Active Employee Entity
  public getActiveEmployee(): Employee | undefined {
    return this.getEmployeeById(this.getActiveUserId());
  }

  // Departments
  public getDepartments(): Department[] {
    return this.load<Department[]>(STORAGE_KEYS.DEPARTMENTS, initialDepartments);
  }

  public getDepartmentById(id: string): Department | undefined {
    return this.getDepartments().find(d => d.id === id);
  }

  // Roles
  public getRoles(): Role[] {
    return this.load<Role[]>(STORAGE_KEYS.ROLES, initialRoles);
  }

  public getRoleById(id: string): Role | undefined {
    return this.getRoles().find(r => r.id === id);
  }

  public updateRolePermissions(roleId: string, permissions: Role['permissions']): void {
    const roles = this.getRoles();
    const idx = roles.findIndex(r => r.id === roleId);
    if (idx !== -1) {
      roles[idx].permissions = permissions;
      this.save(STORAGE_KEYS.ROLES, roles);

      this.addAuditLog({
        action: 'ROLE_CHANGE',
        targetEmployeeId: 'role',
        targetEmployeeName: roles[idx].name,
        details: `Updated scope permissions for role ${roles[idx].name}`
      });
    }
  }

  // Sensitive Data
  public getSensitiveDataMap(): Record<string, EmployeeSensitiveData> {
    return this.load<Record<string, EmployeeSensitiveData>>(STORAGE_KEYS.SENSITIVE_DATA, initialSensitiveData);
  }

  public getSensitiveData(employeeId: string): EmployeeSensitiveData | undefined {
    return this.getSensitiveDataMap()[employeeId];
  }

  public updateSensitiveData(employeeId: string, updates: Partial<EmployeeSensitiveData>): void {
    const map = this.getSensitiveDataMap();
    if (map[employeeId]) {
      const old = map[employeeId];
      map[employeeId] = { ...old, ...updates };
      this.save(STORAGE_KEYS.SENSITIVE_DATA, map);

      if (updates.baseSalary && updates.baseSalary !== old.baseSalary) {
        this.addMilestone({
          employeeId,
          changeType: 'compensation',
          title: 'Compensation Revision',
          description: `Base salary adjusted from ${old.currency} ${old.baseSalary.toLocaleString()} to ${updates.currency || old.currency} ${(updates.baseSalary).toLocaleString()}.`,
          changedBy: this.getActiveEmployee()?.firstName || 'Compensation Admin',
          previousValue: `${old.currency} ${old.baseSalary.toLocaleString()}`,
          newValue: `${updates.currency || old.currency} ${(updates.baseSalary).toLocaleString()}`,
          effectiveDate: new Date().toISOString().split('T')[0]
        });

        this.addAuditLog({
          action: 'SALARY_UPDATE',
          targetEmployeeId: employeeId,
          targetEmployeeName: this.getEmployeeById(employeeId)?.firstName || 'Employee',
          field: 'baseSalary',
          details: `Salary calibrated to ${updates.currency || old.currency} ${(updates.baseSalary).toLocaleString()}`
        });
      }
    }
  }

  // Milestones / Timeline
  public getEmploymentHistory(employeeId?: string): EmploymentHistoryMilestone[] {
    const all = this.load<EmploymentHistoryMilestone[]>(STORAGE_KEYS.EMPLOYMENT_HISTORY, initialEmploymentHistory);
    if (employeeId) {
      return all.filter(m => m.employeeId === employeeId);
    }
    return all;
  }

  public addMilestone(milestone: Omit<EmploymentHistoryMilestone, 'id' | 'createdAt'>): void {
    const all = this.getEmploymentHistory();
    const newEntry: EmploymentHistoryMilestone = {
      ...milestone,
      id: `hist-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString()
    };
    all.unshift(newEntry);
    this.save(STORAGE_KEYS.EMPLOYMENT_HISTORY, all);
  }

  // Attendance Punch System
  public getAttendanceLogs(): AttendancePunchLog[] {
    return this.load<AttendancePunchLog[]>(STORAGE_KEYS.ATTENDANCE_LOGS, initialAttendanceLogs);
  }

  public getTodayPunch(employeeId: string): AttendancePunchLog | undefined {
    const today = new Date().toISOString().split('T')[0];
    return this.getAttendanceLogs().find(log => log.employeeId === employeeId && log.date === today);
  }

  public getActivePunch(employeeId: string): AttendancePunchLog | undefined {
    return this.getAttendanceLogs().find(log => log.employeeId === employeeId && log.status === 'active');
  }

  public clockIn(employeeId: string, location: PunchLocation = 'office'): AttendancePunchLog {
    const logs = this.getAttendanceLogs();
    const today = new Date().toISOString().split('T')[0];
    
    // Check if there is an active punch already
    const existing = logs.find(l => l.employeeId === employeeId && l.status === 'active');
    if (existing) return existing;

    const newLog: AttendancePunchLog = {
      id: `punch-${Date.now().toString(36)}`,
      employeeId,
      date: today,
      clockIn: new Date().toISOString(),
      clockOut: null,
      breakMinutes: 0,
      workLocation: location,
      status: 'active',
      totalHours: 0,
      notes: `Clocked in via Top Bar Widget (${location})`
    };

    logs.unshift(newLog);
    this.save(STORAGE_KEYS.ATTENDANCE_LOGS, logs);

    // Update employee live status
    const status: AttendanceStatus = location === 'office' ? 'clocked_in_office' : 'clocked_in_remote';
    this.updateEmployee(employeeId, { attendanceStatus: status });

    return newLog;
  }

  public clockOut(employeeId: string): void {
    const logs = this.getAttendanceLogs();
    const active = logs.find(l => l.employeeId === employeeId && (l.status === 'active' || l.status === 'missing_out_punch'));
    if (!active) return;

    const now = new Date();
    const inTime = new Date(active.clockIn);
    const diffMs = now.getTime() - inTime.getTime();
    const grossHours = Math.max(0.1, +(diffMs / (1000 * 60 * 60)).toFixed(2));
    const breakHours = +(active.breakMinutes / 60).toFixed(2);
    const netHours = Math.max(0, +(grossHours - breakHours).toFixed(2));

    active.clockOut = now.toISOString();
    active.status = 'completed';
    active.totalHours = netHours;

    this.save(STORAGE_KEYS.ATTENDANCE_LOGS, logs);
    this.updateEmployee(employeeId, { attendanceStatus: 'off_duty' });
  }

  public toggleBreak(employeeId: string): boolean {
    const emp = this.getEmployeeById(employeeId);
    if (!emp) return false;

    if (emp.attendanceStatus === 'on_break') {
      // Resume
      const activePunch = this.getActivePunch(employeeId);
      const nextStatus: AttendanceStatus = activePunch?.workLocation === 'remote' ? 'clocked_in_remote' : 'clocked_in_office';
      this.updateEmployee(employeeId, { attendanceStatus: nextStatus });
      return false; // Break ended
    } else {
      // Start break
      this.updateEmployee(employeeId, { attendanceStatus: 'on_break' });
      const activePunch = this.getActivePunch(employeeId);
      if (activePunch) {
        activePunch.breakMinutes = (activePunch.breakMinutes || 0) + 15;
        this.save(STORAGE_KEYS.ATTENDANCE_LOGS, this.getAttendanceLogs());
      }
      return true; // Break started
    }
  }

  public resolveMissingPunch(punchId: string, correctedTimeIso?: string, acceptSuggested: boolean = true): void {
    const logs = this.getAttendanceLogs();
    const punch = logs.find(p => p.id === punchId);
    if (!punch) return;

    const clockOutTime = correctedTimeIso || (acceptSuggested && punch.suggestedClockOut ? punch.suggestedClockOut : new Date().toISOString());
    const inTime = new Date(punch.clockIn);
    const outTime = new Date(clockOutTime);
    const diffHours = Math.max(0.5, +((outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60) - (punch.breakMinutes / 60)).toFixed(2));

    punch.clockOut = clockOutTime;
    punch.status = 'completed';
    punch.totalHours = diffHours;
    punch.notes = `${punch.notes || ''} [Resolved by Manager on ${new Date().toLocaleDateString()}]`;

    this.save(STORAGE_KEYS.ATTENDANCE_LOGS, logs);

    this.addAuditLog({
      action: 'PUNCH_DISPUTE_RESOLVE',
      targetEmployeeId: punch.employeeId,
      targetEmployeeName: this.getEmployeeById(punch.employeeId)?.firstName || 'Employee',
      details: `Resolved open overnight punch anomaly to ${diffHours}h (Out: ${new Date(clockOutTime).toLocaleTimeString()})`
    });
  }

  // Leave Requests & Clashes
  public getLeaveRequests(): LeaveRequest[] {
    return this.load<LeaveRequest[]>(STORAGE_KEYS.LEAVE_REQUESTS, initialLeaveRequests);
  }

  public addLeaveRequest(req: Omit<LeaveRequest, 'id' | 'status'>): LeaveRequest {
    const requests = this.getLeaveRequests();
    const newReq: LeaveRequest = {
      ...req,
      id: `leave-${Date.now().toString(36)}`,
      status: 'pending'
    };
    requests.unshift(newReq);
    this.save(STORAGE_KEYS.LEAVE_REQUESTS, requests);
    return newReq;
  }

  public updateLeaveStatus(id: string, status: 'approved' | 'rejected' | 'cancelled', reviewerNotes?: string): void {
    const requests = this.getLeaveRequests();
    const idx = requests.findIndex(r => r.id === id);
    if (idx !== -1) {
      requests[idx].status = status;
      requests[idx].reviewedAt = new Date().toISOString();
      if (reviewerNotes) requests[idx].reviewerNotes = reviewerNotes;

      // If approved, update employee status to on_leave if current date is within range
      if (status === 'approved') {
        const req = requests[idx];
        const today = new Date().toISOString().split('T')[0];
        if (today >= req.startDate && today <= req.endDate) {
          this.updateEmployee(req.employeeId, { attendanceStatus: 'on_leave', status: 'on_leave' });
        }
      }

      this.save(STORAGE_KEYS.LEAVE_REQUESTS, requests);
    }
  }

  // Delegations
  public getDelegations(): ActingDelegation[] {
    return this.load<ActingDelegation[]>(STORAGE_KEYS.DELEGATIONS, initialDelegations);
  }

  public addDelegation(delegation: Omit<ActingDelegation, 'id'>): ActingDelegation {
    const dels = this.getDelegations();
    const newDel: ActingDelegation = {
      ...delegation,
      id: `del-${Date.now().toString(36)}`
    };
    dels.unshift(newDel);
    this.save(STORAGE_KEYS.DELEGATIONS, dels);
    return newDel;
  }

  // Documents
  public getDocuments(employeeId: string): EmployeeDocument[] {
    const all = this.load<Record<string, EmployeeDocument[]>>(STORAGE_KEYS.DOCUMENTS, initialDocuments);
    return all[employeeId] || [];
  }

  public addDocument(employeeId: string, doc: Omit<EmployeeDocument, 'id'>): void {
    const all = this.load<Record<string, EmployeeDocument[]>>(STORAGE_KEYS.DOCUMENTS, initialDocuments);
    if (!all[employeeId]) all[employeeId] = [];
    all[employeeId].push({
      ...doc,
      id: `doc-${Date.now().toString(36)}`
    });
    this.save(STORAGE_KEYS.DOCUMENTS, all);
  }

  // Audit Logs
  public getAuditLogs(): AuditLogEntry[] {
    return this.load<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
  }

  public addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'actorId' | 'actorName' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const activeEmp = this.getActiveEmployee();
    const newEntry: AuditLogEntry = {
      id: `audit-${Date.now().toString(36)}`,
      actorId: activeEmp?.id || 'emp-001',
      actorName: activeEmp ? `${activeEmp.firstName} ${activeEmp.lastName}` : 'System Admin',
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.104',
      ...entry
    };
    logs.unshift(newEntry);
    this.save(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  // Burnout Signals
  public getBurnoutSignals(): BurnoutRiskSignal[] {
    return this.load<BurnoutRiskSignal[]>(STORAGE_KEYS.BURNOUT_SIGNALS, initialBurnoutSignals);
  }
}

export const storage = new StorageService();
