import React from 'react';
import { 
  Building2, 
  MapPin, 
  Clock, 
  UserCheck, 
  ExternalLink,
  Users
} from 'lucide-react';
import { Employee } from '../../types';
import { storage } from '../../services/storageService';
import { getSpanOfControl } from '../../services/rbacService';

interface RosterCardsViewProps {
  employees: Employee[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectEmployee: (emp: Employee) => void;
}

export const RosterCardsView: React.FC<RosterCardsViewProps> = ({
  employees,
  selectedIds,
  onToggleSelect,
  onSelectEmployee
}) => {
  const allDepts = storage.getDepartments();
  const allEmployees = storage.getEmployees();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {employees.map((emp) => {
        const isSelected = selectedIds.includes(emp.id);
        const dept = allDepts.find(d => d.id === emp.departmentId);
        const manager = emp.managerId ? allEmployees.find(e => e.id === emp.managerId) : null;
        const span = getSpanOfControl(emp.id, allEmployees);

        return (
          <div
            key={emp.id}
            onClick={() => onSelectEmployee(emp)}
            className={`group rounded-2xl border p-4.5 transition-all cursor-pointer relative flex flex-col justify-between ${
              isSelected
                ? 'border-brand bg-brand/5 dark:bg-brand/10 ring-2 ring-brand/30 shadow-md'
                : 'border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark hover:border-brand/40 hover:shadow-lg'
            }`}
          >
            <div>
              {/* Card Top Row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="relative">
                  <img
                    src={emp.avatarUrl}
                    alt={emp.firstName}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/10"
                  />
                  <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-surface-dark ${
                    emp.attendanceStatus === 'clocked_in_office' ? 'bg-emerald-500' :
                    emp.attendanceStatus === 'clocked_in_remote' ? 'bg-blue-500' :
                    emp.attendanceStatus === 'on_break' ? 'bg-amber-500' :
                    emp.attendanceStatus === 'on_leave' ? 'bg-purple-500' :
                    emp.attendanceStatus === 'missing_punch' ? 'bg-rose-500' : 'bg-slate-400'
                  }`} />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-md bg-surface-light dark:bg-surface-dark border border-divider-light dark:border-divider-dark text-slate-600 dark:text-slate-300">
                    {emp.employeeCode}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelect(emp.id);
                    }}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center text-[10px] transition-colors ${
                      isSelected
                        ? 'bg-brand border-brand text-white'
                        : 'border-divider-light dark:border-divider-dark hover:border-brand'
                    }`}
                  >
                    {isSelected && '✓'}
                  </button>
                </div>
              </div>

              {/* Name & Title */}
              <div className="mb-2.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand dark:group-hover:text-brand-dark transition-colors truncate">
                  {emp.firstName} {emp.lastName}
                </h3>
                <p className="text-xs text-slate-500 truncate font-medium">
                  {emp.jobTitle}
                </p>
              </div>

              {/* Department & Status Badges */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span 
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                  style={{ 
                    backgroundColor: `${dept?.colorHex || '#4F46E5'}15`,
                    color: dept?.colorHex || '#4F46E5'
                  }}
                >
                  {dept?.name}
                </span>

                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 capitalize font-mono">
                  {emp.workMode}
                </span>

                {span.directCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-brand/10 text-brand font-mono flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {span.directCount} reports
                  </span>
                )}
              </div>

              {/* Skills preview */}
              <div className="flex flex-wrap gap-1 mb-3">
                {emp.skills.slice(0, 3).map((s, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-surface-light dark:bg-surface-dark text-slate-500 font-medium"
                  >
                    {s}
                  </span>
                ))}
                {emp.skills.length > 3 && (
                  <span className="text-[10px] text-slate-400">
                    +{emp.skills.length - 3}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Meta */}
            <div className="pt-3 border-t border-divider-light dark:border-divider-dark flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{emp.timezone.split(' ')[0]}</span>
              </span>

              {manager ? (
                <span className="flex items-center gap-1 truncate text-slate-400">
                  <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>@{manager.firstName}</span>
                </span>
              ) : (
                <span className="italic text-slate-400 text-[10px]">Lead</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
