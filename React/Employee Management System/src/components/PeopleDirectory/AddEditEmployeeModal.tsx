import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  Building2, 
  Shield, 
  MapPin, 
  DollarSign, 
  CheckCircle,
  Briefcase
} from 'lucide-react';
import { storage } from '../../services/storageService';
import { Employee, EmploymentType, WorkMode, LifecycleStage } from '../../types';
import confetti from 'canvas-confetti';

interface AddEditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newEmp: Employee) => void;
}

export const AddEditEmployeeModal: React.FC<AddEditEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const allDepts = storage.getDepartments();
  const allRoles = storage.getRoles();
  const allEmployees = storage.getEmployees();

  const nextCodeNum = allEmployees.length + 1;
  const defaultCode = `EMP-0${nextCodeNum.toString().padStart(3, '0')}`;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeCode, setEmployeeCode] = useState(defaultCode);
  const [jobTitle, setJobTitle] = useState('');
  const [departmentId, setDepartmentId] = useState(allDepts[0]?.id || '');
  const [roleId, setRoleId] = useState(allRoles[4]?.id || 'role-employee');
  const [managerId, setManagerId] = useState<string | null>(allEmployees[1]?.id || null);
  const [employmentType, setEmploymentType] = useState<EmploymentType>('full_time');
  const [workMode, setWorkMode] = useState<WorkMode>('hybrid');
  const [timezone, setTimezone] = useState('Europe/London (UTC+1)');
  const [skillsStr, setSkillsStr] = useState('TypeScript, React, Systems Design');
  const [baseSalary, setBaseSalary] = useState(135000);
  const [currency, setCurrency] = useState('USD');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const skills = skillsStr.split(',').map(s => s.trim()).filter(Boolean);
    const newEmp = storage.addEmployee({
      employeeCode,
      firstName,
      lastName,
      email,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      departmentId,
      roleId,
      managerId,
      jobTitle,
      employmentType,
      workMode,
      status: 'active',
      timezone,
      hireDate: new Date().toISOString().split('T')[0],
      attendanceStatus: workMode === 'remote' ? 'clocked_in_remote' : 'clocked_in_office',
      skills,
      bio: `Dedicated professional working as ${jobTitle}.`
    }, {
      baseSalary,
      currency,
      payFrequency: 'monthly',
      bonusTargetPercent: 15,
      equityGrantUnits: 65000
    });

    confetti({
      particleCount: 50,
      spread: 70
    });

    if (onSuccess) onSuccess(newEmp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-2xl rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-divider-light dark:border-divider-dark">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Onboard New Team Member
              </h3>
              <p className="text-xs text-slate-500">
                Creates an employee record, provisions RBAC role, and initializes career timeline.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">First Name *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="e.g. Maya"
                className="w-full px-3 py-2 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-white focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Last Name *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="e.g. Lin"
                className="w-full px-3 py-2 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-white focus:outline-none focus:border-brand"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Work Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="maya.lin@aura-os.internal"
                className="w-full px-3 py-2 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-white focus:outline-none focus:border-brand font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Employee Code *</label>
              <input
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-white focus:outline-none focus:border-brand font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Job Title *</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                required
                placeholder="e.g. Senior Security Architect"
                className="w-full px-3 py-2 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-white focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Department *</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-white"
              >
                {allDepts.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">RBAC Authority Role *</label>
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-white"
              >
                {allRoles.map(r => (
                  <option key={r.id} value={r.id}>{r.name} (Level {r.hierarchyLevel})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Direct Manager *</label>
              <select
                value={managerId || ''}
                onChange={(e) => setManagerId(e.target.value || null)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-white"
              >
                <option value="">Executive Leadership (No Direct Manager)</option>
                {allEmployees.map(e => (
                  <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.jobTitle})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Employment Type</label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-white"
              >
                <option value="full_time">Full-Time</option>
                <option value="part_time">Part-Time</option>
                <option value="contractor">Contractor</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Work Mode</label>
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-white"
              >
                <option value="hybrid">Hybrid (Office + Remote)</option>
                <option value="remote">Fully Remote</option>
                <option value="onsite">Onsite / Office</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Base Annual Salary</label>
              <div className="flex gap-1.5">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-20 px-2 py-2 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-white font-mono"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
                <input
                  type="number"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Skills & Specialties (comma-separated)</label>
            <input
              type="text"
              value={skillsStr}
              onChange={(e) => setSkillsStr(e.target.value)}
              placeholder="e.g. Kubernetes, Golang, Incident Response"
              className="w-full px-3 py-2 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-white focus:outline-none focus:border-brand"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-divider-light dark:border-divider-dark">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand hover:bg-brand-hover text-white shadow-md shadow-brand/20 transition-all"
            >
              Confirm & Create Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
