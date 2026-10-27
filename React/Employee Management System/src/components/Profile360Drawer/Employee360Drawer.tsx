import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  Calendar, 
  UserCheck, 
  Mail, 
  Phone, 
  Shield, 
  Clock, 
  FileText, 
  History, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  ChevronRight,
  TrendingUp,
  FileCheck,
  CheckSquare,
  Square,
  Lock,
  Sparkles
} from 'lucide-react';
import { Employee, LifecycleStage, EmploymentType, WorkMode } from '../../types';
import { storage } from '../../services/storageService';
import { SensitiveField } from '../SensitiveField';
import { Can } from '../Can';
import confetti from 'canvas-confetti';

interface Employee360DrawerProps {
  employee: Employee | null;
  onClose: () => void;
  onSelectEmployee?: (emp: Employee) => void;
}

export const Employee360Drawer: React.FC<Employee360DrawerProps> = ({
  employee,
  onClose,
  onSelectEmployee
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'job' | 'attendance' | 'documents' | 'timeline'>('overview');
  const [isEditingJob, setIsEditingJob] = useState(false);
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editDeptId, setEditDeptId] = useState('');
  const [editManagerId, setEditManagerId] = useState<string | null>(null);
  const [editSalary, setEditSalary] = useState<number>(0);
  const [showStatusTransitionModal, setShowStatusTransitionModal] = useState(false);
  const [targetLifecycleStage, setTargetLifecycleStage] = useState<LifecycleStage>('active');

  if (!employee) return null;

  const department = storage.getDepartmentById(employee.departmentId);
  const manager = employee.managerId ? storage.getEmployeeById(employee.managerId) : null;
  const sensitiveData = storage.getSensitiveData(employee.id);
  const timelineMilestones = storage.getEmploymentHistory(employee.id);
  const documents = storage.getDocuments(employee.id);
  const allEmployees = storage.getEmployees();
  const allDepartments = storage.getDepartments();
  const directReports = allEmployees.filter(e => e.managerId === employee.id);

  // Tenure calculation
  const getTenureString = (hireDate: string) => {
    const hire = new Date(hireDate);
    const now = new Date();
    const diffMonths = (now.getFullYear() - hire.getFullYear()) * 12 + (now.getMonth() - hire.getMonth());
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    if (years === 0) return `${months}m`;
    return `${years}y ${months}m`;
  };

  const handleOpenEditJob = () => {
    setEditJobTitle(employee.jobTitle);
    setEditDeptId(employee.departmentId);
    setEditManagerId(employee.managerId);
    setEditSalary(sensitiveData?.baseSalary || 120000);
    setIsEditingJob(true);
  };

  const handleSaveJob = (e: React.FormEvent) => {
    e.preventDefault();
    storage.updateEmployee(employee.id, {
      jobTitle: editJobTitle,
      departmentId: editDeptId,
      managerId: editManagerId
    });

    if (sensitiveData && editSalary !== sensitiveData.baseSalary) {
      storage.updateSensitiveData(employee.id, {
        baseSalary: editSalary
      });
    }

    setIsEditingJob(false);
    confetti({ particleCount: 30, spread: 50 });
  };

  const handleLifecycleTransition = (newStage: LifecycleStage) => {
    storage.updateLifecycleStage(employee.id, newStage);
    setShowStatusTransitionModal(false);
    confetti({ particleCount: 50, spread: 70 });
  };

  const toggleChecklist = (checkId: string) => {
    if (!employee.transitionChecklist) return;
    const updated = employee.transitionChecklist.map(c => 
      c.id === checkId ? { ...c, completed: !c.completed } : c
    );
    storage.updateEmployee(employee.id, { transitionChecklist: updated });
  };

  const handleSimulateDocUpload = () => {
    const docTypes = ['certification', 'contract', 'visa', 'tax'] as const;
    const randomType = docTypes[Math.floor(Math.random() * docTypes.length)];
    storage.addDocument(employee.id, {
      name: `Compliance-Signed-Doc-${Date.now().toString(36).toUpperCase()}.pdf`,
      type: randomType,
      uploadDate: new Date().toISOString().split('T')[0],
      fileSize: '1.2 MB',
      status: 'valid'
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div 
        className="w-full max-w-[560px] h-full bg-elevated-light dark:bg-elevated-dark border-l border-divider-light dark:border-divider-dark shadow-2xl flex flex-col overflow-hidden animate-slideInRight"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header Ribbon */}
        <div className="p-5 border-b border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="relative">
              <img
                src={employee.avatarUrl}
                alt={employee.firstName}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-brand/30 shadow-md"
              />
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ring-2 ring-white dark:ring-surface-dark ${
                employee.attendanceStatus === 'clocked_in_office' ? 'bg-emerald-500' :
                employee.attendanceStatus === 'clocked_in_remote' ? 'bg-blue-500' :
                employee.attendanceStatus === 'on_break' ? 'bg-amber-500' :
                employee.attendanceStatus === 'on_leave' ? 'bg-purple-500' : 'bg-slate-400'
              }`} />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white leading-tight">
                  {employee.firstName} {employee.lastName}
                </h2>
                {employee.pronouns && (
                  <span className="text-xs text-slate-400 font-normal">
                    ({employee.pronouns})
                  </span>
                )}
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                  {employee.employeeCode}
                </span>
              </div>

              <p className="text-xs font-medium text-brand dark:text-brand-dark mt-0.5">
                {employee.jobTitle}
              </p>

              {/* Status Machine Pill Trigger */}
              <div className="mt-2 flex items-center gap-2">
                <Can perform="employee:update" targetEmployeeId={employee.id} fallback={
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {employee.status.replace('_', ' ').toUpperCase()}
                  </span>
                }>
                  <button
                    onClick={() => setShowStatusTransitionModal(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand/10 text-brand dark:text-brand-dark hover:bg-brand/20 transition-all border border-brand/20"
                    title="Transition lifecycle stage"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                    <span className="capitalize">{employee.status.replace('_', ' ')}</span>
                    <span className="text-[10px] text-slate-400">▾</span>
                  </button>
                </Can>

                <span className="text-[11px] text-slate-500 font-mono">
                  {employee.employmentType.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Meta Strip */}
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-divider-light dark:border-divider-dark flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-900 dark:text-slate-200">{department?.name}</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{employee.timezone.split(' ')[0]}</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Tenure: {getTenureString(employee.hireDate)}</span>
          </span>
          {manager && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Reports to: <strong className="text-slate-900 dark:text-slate-200">{manager.firstName} {manager.lastName}</strong></span>
              </span>
            </>
          )}
        </div>

        {/* Segmented Inspector Tabs */}
        <div className="flex border-b border-divider-light dark:border-divider-dark px-4 bg-surface-light dark:bg-surface-dark">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'job', label: 'Job & Comp' },
            { id: 'attendance', label: 'Attendance & PTO' },
            { id: 'documents', label: `Documents (${documents.length})` },
            { id: 'timeline', label: 'Timeline & Audit' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-brand text-brand dark:text-brand-dark'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Contextual Lifecycle Transition Checklist if present */}
              {employee.transitionChecklist && employee.transitionChecklist.length > 0 && (
                <div className="rounded-xl border border-brand/30 bg-brand/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand" />
                      <span className="text-xs font-bold uppercase tracking-wider text-brand dark:text-brand-dark">
                        Lifecycle Stage Transition Tasks
                      </span>
                    </div>
                    <span className="text-xs font-mono text-slate-500">
                      {employee.transitionChecklist.filter(c => c.completed).length} / {employee.transitionChecklist.length} completed
                    </span>
                  </div>

                  <div className="space-y-2">
                    {employee.transitionChecklist.map(check => (
                      <div 
                        key={check.id}
                        onClick={() => toggleChecklist(check.id)}
                        className="flex items-center gap-2.5 p-2 rounded-lg bg-white/60 dark:bg-surface-dark/80 border border-divider-light dark:border-divider-dark cursor-pointer hover:border-brand/40 transition-colors"
                      >
                        {check.completed ? (
                          <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className={`text-xs flex-1 ${check.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {check.title}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                          {check.assigneeRole}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio & Summary */}
              {employee.bio && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Professional Summary
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 bg-surface-light dark:bg-surface-dark p-3.5 rounded-xl border border-divider-light dark:border-divider-dark">
                    {employee.bio}
                  </p>
                </div>
              )}

              {/* Contact Information */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Direct Contact & Location
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-1">
                      <Mail className="w-3.5 h-3.5 text-brand" /> Work Email
                    </span>
                    <p className="text-xs font-mono font-medium text-slate-900 dark:text-slate-100 truncate">
                      {employee.email}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-brand" /> Work Location & Mode
                    </span>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 capitalize">
                      {employee.workMode} • {employee.timezone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Core Competencies & Skills */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Core Skills & Capabilities
                </h4>
                <div className="flex flex-wrap gap-2">
                  {employee.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-lg bg-surface-light dark:bg-surface-dark border border-divider-light dark:border-divider-dark text-slate-700 dark:text-slate-200 font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Direct Reports Section if manager */}
              {directReports.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
                    <span>Direct Reports ({directReports.length})</span>
                    <span className="text-[11px] font-mono font-normal text-slate-500">Span of Control</span>
                  </h4>
                  <div className="space-y-2">
                    {directReports.map(rep => (
                      <div
                        key={rep.id}
                        onClick={() => onSelectEmployee && onSelectEmployee(rep)}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark hover:border-brand/40 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={rep.avatarUrl}
                            alt={rep.firstName}
                            className="w-7 h-7 rounded-lg object-cover"
                          />
                          <div>
                            <p className="text-xs font-semibold text-slate-900 dark:text-white">
                              {rep.firstName} {rep.lastName}
                            </p>
                            <p className="text-[11px] text-slate-500">{rep.jobTitle}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: JOB & COMPENSATION */}
          {activeTab === 'job' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Employment & Organizational Structure
                </h4>
                <Can perform="employee:update" targetEmployeeId={employee.id}>
                  {!isEditingJob && (
                    <button
                      onClick={handleOpenEditJob}
                      className="flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-hover dark:text-brand-dark"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Job Details
                    </button>
                  )}
                </Can>
              </div>

              {isEditingJob ? (
                <form onSubmit={handleSaveJob} className="space-y-4 p-4 rounded-xl border border-brand/30 bg-surface-light dark:bg-surface-dark">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Job Title</label>
                    <input
                      type="text"
                      value={editJobTitle}
                      onChange={(e) => setEditJobTitle(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Department</label>
                    <select
                      value={editDeptId}
                      onChange={(e) => setEditDeptId(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark text-slate-900 dark:text-white"
                    >
                      {allDepartments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Direct Manager</label>
                    <select
                      value={editManagerId || ''}
                      onChange={(e) => setEditManagerId(e.target.value || null)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark text-slate-900 dark:text-white"
                    >
                      <option value="">Executive Leadership (No Direct Manager)</option>
                      {allEmployees.filter(e => e.id !== employee.id).map(e => (
                        <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.jobTitle})</option>
                      ))}
                    </select>
                  </div>

                  <Can perform="compensation:write" targetEmployeeId={employee.id}>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Base Annual Salary ({sensitiveData?.currency || 'USD'})</label>
                      <input
                        type="number"
                        value={editSalary}
                        onChange={(e) => setEditSalary(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </Can>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand hover:bg-brand-hover text-white transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingJob(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark">
                    <span className="text-[11px] text-slate-500 block mb-0.5">Job Title</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{employee.jobTitle}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark">
                    <span className="text-[11px] text-slate-500 block mb-0.5">Department</span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">{department?.name}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark">
                    <span className="text-[11px] text-slate-500 block mb-0.5">Direct Manager</span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {manager ? `${manager.firstName} ${manager.lastName}` : 'Executive Level'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark">
                    <span className="text-[11px] text-slate-500 block mb-0.5">Hire Date</span>
                    <span className="text-xs font-mono text-slate-900 dark:text-white">{employee.hireDate}</span>
                  </div>
                </div>
              )}

              {/* Protected Compensation Card (PII Privacy Shield) */}
              <div className="rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/5 to-transparent p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                        Protected Compensation & Financial PII
                      </h5>
                      <p className="text-[10px] text-slate-500">
                        Strict Row-Level Security shield. Unveiling triggers immutable audit logging.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <SensitiveField
                    label="Base Salary"
                    value={sensitiveData ? `${sensitiveData.currency} ${sensitiveData.baseSalary.toLocaleString()}` : 'Not Set'}
                    fieldId="base_salary"
                    targetEmployeeId={employee.id}
                    targetEmployeeName={`${employee.firstName} ${employee.lastName}`}
                  />
                  <SensitiveField
                    label="Bonus Target"
                    value={sensitiveData ? `${sensitiveData.bonusTargetPercent}% Annual` : '0%'}
                    fieldId="bonus_target"
                    targetEmployeeId={employee.id}
                    targetEmployeeName={`${employee.firstName} ${employee.lastName}`}
                  />
                  <SensitiveField
                    label="Equity Units (ISO/RSU)"
                    value={sensitiveData ? `${sensitiveData.equityGrantUnits.toLocaleString()} Shares` : '0 Shares'}
                    fieldId="equity_grant"
                    targetEmployeeId={employee.id}
                    targetEmployeeName={`${employee.firstName} ${employee.lastName}`}
                  />
                  <SensitiveField
                    label="Bank Account Routing"
                    value={sensitiveData ? `•••• •••• •••• ${sensitiveData.bankAccountLast4}` : 'None'}
                    fieldId="bank_account"
                    targetEmployeeId={employee.id}
                    targetEmployeeName={`${employee.firstName} ${employee.lastName}`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ATTENDANCE & PTO */}
          {activeTab === 'attendance' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Top Shift Status Card */}
              <div className="p-4 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-slate-500 block mb-1">Live Shift Presence</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      employee.attendanceStatus === 'clocked_in_office' ? 'bg-emerald-500' :
                      employee.attendanceStatus === 'clocked_in_remote' ? 'bg-blue-500' :
                      employee.attendanceStatus === 'on_break' ? 'bg-amber-500' :
                      employee.attendanceStatus === 'on_leave' ? 'bg-purple-500' : 'bg-slate-400'
                    }`} />
                    <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                      {employee.attendanceStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-medium text-slate-500 block mb-1">Weekly Total Hours</span>
                  <span className="text-base font-mono font-bold text-brand dark:text-brand-dark">38.5h / 40h</span>
                </div>
              </div>

              {/* PTO Balances */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Time-Off Accrual Balances
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Vacation PTO</span>
                    <p className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5">18.5</p>
                    <span className="text-[10px] text-slate-400">Days Available</span>
                  </div>
                  <div className="p-3 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Sick Leave</span>
                    <p className="text-lg font-bold font-mono text-emerald-500 mt-0.5">8.0</p>
                    <span className="text-[10px] text-slate-400">Days Available</span>
                  </div>
                  <div className="p-3 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Wellness Days</span>
                    <p className="text-lg font-bold font-mono text-blue-500 mt-0.5">3.0</p>
                    <span className="text-[10px] text-slate-400">Days Available</span>
                  </div>
                </div>
              </div>

              {/* Recent Punch Logs for this employee */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Recent Daily Punch Sessions
                </h4>
                <div className="space-y-2">
                  {storage.getAttendanceLogs().filter(l => l.employeeId === employee.id).slice(0, 5).map(punch => (
                    <div
                      key={punch.id}
                      className="p-3 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white font-mono">{punch.date}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-500">
                            {punch.workLocation}
                          </span>
                          {punch.status === 'missing_out_punch' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-semibold">
                              ⚠️ Missing Punch
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          In: {new Date(punch.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • 
                          Out: {punch.clockOut ? new Date(punch.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {punch.totalHours} hrs
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DOCUMENTS & COMPLIANCE */}
          {activeTab === 'documents' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Compliance Documents & Credentials
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Visa, employment deeds, confidentiality agreements and security badges.
                  </p>
                </div>
                <button
                  onClick={handleSimulateDocUpload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand hover:bg-brand-hover text-white transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Document
                </button>
              </div>

              <div className="space-y-2.5">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-500">
                        <FileText className="w-5 h-5 text-brand" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {doc.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                          <span>{doc.fileSize}</span>
                          <span>•</span>
                          <span>Uploaded {doc.uploadDate}</span>
                          {doc.expiryDate && (
                            <>
                              <span>•</span>
                              <span className={doc.status === 'expiring_soon' ? 'text-amber-500 font-semibold' : 'text-slate-400'}>
                                {doc.status === 'expiring_soon' ? '⚠️ Expires ' : 'Valid until '}
                                {doc.expiryDate}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        doc.status === 'expiring_soon' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' :
                        doc.status === 'expired' ? 'bg-rose-500/10 text-rose-500' :
                        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {doc.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: TIMELINE & AUDIT */}
          {activeTab === 'timeline' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Immutable Career Milestones
                </h4>
                <p className="text-[11px] text-slate-500 mb-4">
                  Every title adjustment, squad transfer, or compensation calibration is permanently appended.
                </p>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-divider-light dark:before:bg-divider-dark">
                  {timelineMilestones.map((m) => (
                    <div key={m.id} className="relative group">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-brand ring-4 ring-white dark:ring-surface-dark" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {m.title}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {m.effectiveDate}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          {m.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-mono">
                          <span>Authorized by @{m.changedBy}</span>
                          {m.previousValue && (
                            <>
                              <span>•</span>
                              <span>{m.previousValue} → {m.newValue}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Field-level Access Security Audit Log */}
              <div className="pt-4 border-t border-divider-light dark:border-divider-dark">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-brand" />
                  Security Audit Trail (Access Records)
                </h4>
                <div className="space-y-2">
                  {storage.getAuditLogs().filter(a => a.targetEmployeeId === employee.id).map(log => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-lg bg-surface-light dark:bg-surface-dark border border-divider-light dark:border-divider-dark text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-brand dark:text-brand-dark">
                          {log.action}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        {log.details}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Actor: {log.actorName} ({log.ipAddress})
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal: State Machine Transition */}
        {showStatusTransitionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Progress Employment Lifecycle
              </h3>
              <p className="text-xs text-slate-500">
                Transitioning {employee.firstName}'s employment state automatically triggers contextual provisioning checklists and access updates.
              </p>

              <div className="space-y-2">
                {[
                  { id: 'candidate', label: 'Candidate', desc: 'Evaluating interview stages & offer letters' },
                  { id: 'pre_boarding', label: 'Pre-Boarding', desc: 'Hardware shipping, paperwork & Day 1 provisioning' },
                  { id: 'active', label: 'Active Member', desc: 'Full operational status and system access' },
                  { id: 'on_leave', label: 'Parental / Medical Leave', desc: 'Temporary absence with delegated duties' },
                  { id: 'offboarding', label: 'Offboarding', desc: 'Revoke credentials, equipment return & exit interview' },
                  { id: 'alumni', label: 'Alumni Network', desc: 'Former colleague, community access only' }
                ].map(stage => (
                  <button
                    key={stage.id}
                    onClick={() => handleLifecycleTransition(stage.id as LifecycleStage)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                      employee.status === stage.id
                        ? 'border-brand bg-brand/10 font-bold'
                        : 'border-divider-light dark:border-divider-dark hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="pt-0.5">
                      <span className={`w-3 h-3 rounded-full block ${employee.status === stage.id ? 'bg-brand ring-2 ring-brand/30' : 'bg-slate-400'}`} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">{stage.label}</p>
                      <p className="text-[11px] text-slate-500">{stage.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowStatusTransitionModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
