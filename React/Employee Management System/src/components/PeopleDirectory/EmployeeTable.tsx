import React, { useState } from 'react';
import { 
  MoreHorizontal, 
  ArrowUpDown, 
  CheckSquare, 
  Square, 
  ExternalLink,
  Clock,
  MapPin,
  Building2,
  Shield
} from 'lucide-react';
import { Employee, AttendanceStatus } from '../../types';
import { storage } from '../../services/storageService';

interface EmployeeTableProps {
  employees: Employee[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onSelectEmployee: (emp: Employee) => void;
}

type SortField = 'name' | 'code' | 'title' | 'dept' | 'status' | 'hireDate';

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onSelectEmployee
}) => {
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortAsc, setSortAsc] = useState(true);

  const allDepts = storage.getDepartments();
  const allEmployees = storage.getEmployees();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedEmployees = [...employees].sort((a, b) => {
    let aVal = '';
    let bVal = '';

    if (sortField === 'name') {
      aVal = `${a.firstName} ${a.lastName}`;
      bVal = `${b.firstName} ${b.lastName}`;
    } else if (sortField === 'code') {
      aVal = a.employeeCode;
      bVal = b.employeeCode;
    } else if (sortField === 'title') {
      aVal = a.jobTitle;
      bVal = b.jobTitle;
    } else if (sortField === 'dept') {
      aVal = allDepts.find(d => d.id === a.departmentId)?.name || '';
      bVal = allDepts.find(d => d.id === b.departmentId)?.name || '';
    } else if (sortField === 'status') {
      aVal = a.status;
      bVal = b.status;
    } else if (sortField === 'hireDate') {
      aVal = a.hireDate;
      bVal = b.hireDate;
    }

    const cmp = aVal.localeCompare(bVal);
    return sortAsc ? cmp : -cmp;
  });

  const isAllSelected = employees.length > 0 && selectedIds.length === employees.length;

  // Helper for live local time
  const getLocalTime = (tz: string) => {
    try {
      if (tz.includes('London')) return '14:30';
      if (tz.includes('Berlin') || tz.includes('Paris') || tz.includes('Stockholm')) return '15:30';
      if (tz.includes('New_York')) return '09:30';
      if (tz.includes('Los_Angeles')) return '06:30';
      if (tz.includes('Tokyo')) return '22:30';
      if (tz.includes('Kolkata')) return '19:00';
    } catch (e) {}
    return '12:00';
  };

  return (
    <div className="w-full rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* Table Header */}
          <thead className="bg-surface-light dark:bg-surface-dark border-b border-divider-light dark:border-divider-dark text-slate-500 font-semibold select-none">
            <tr className="h-10">
              <th className="w-10 px-3 py-2 text-center">
                <button
                  onClick={onSelectAll}
                  className="flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-4 h-4 text-brand" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>

              <th 
                onClick={() => handleSort('name')}
                className="px-3 py-2 cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Employee</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th 
                onClick={() => handleSort('code')}
                className="px-3 py-2 cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>EMP ID</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th 
                onClick={() => handleSort('title')}
                className="px-3 py-2 cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Role & Title</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th 
                onClick={() => handleSort('dept')}
                className="px-3 py-2 cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Department</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th className="px-3 py-2">
                <span>Manager</span>
              </th>

              <th 
                onClick={() => handleSort('status')}
                className="px-3 py-2 cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Live Presence</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th className="px-3 py-2">
                <span>Location & Time</span>
              </th>

              <th className="w-12 px-3 py-2 text-right">
                <span>Action</span>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-divider-light dark:divide-divider-dark">
            {sortedEmployees.map((emp) => {
              const isSelected = selectedIds.includes(emp.id);
              const dept = allDepts.find(d => d.id === emp.departmentId);
              const manager = emp.managerId ? allEmployees.find(e => e.id === emp.managerId) : null;
              const role = storage.getRoleById(emp.roleId);

              return (
                <tr
                  key={emp.id}
                  onClick={() => onSelectEmployee(emp)}
                  className={`h-11 transition-colors cursor-pointer group ${
                    isSelected 
                      ? 'bg-brand/5 dark:bg-brand/10' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-900/40'
                  }`}
                >
                  {/* Select Checkbox */}
                  <td 
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelect(emp.id);
                    }}
                    className="w-10 px-3 py-2 text-center"
                  >
                    <button className="flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-brand" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>

                  {/* Employee Name & Avatar with Presence Ring */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2.5">
                      <div className="relative shrink-0">
                        <img
                          src={emp.avatarUrl}
                          alt={emp.firstName}
                          className="w-8 h-8 rounded-xl object-cover ring-1 ring-white/10"
                        />
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-surface-dark ${
                          emp.attendanceStatus === 'clocked_in_office' ? 'bg-emerald-500' :
                          emp.attendanceStatus === 'clocked_in_remote' ? 'bg-blue-500' :
                          emp.attendanceStatus === 'on_break' ? 'bg-amber-500' :
                          emp.attendanceStatus === 'on_leave' ? 'bg-purple-500' :
                          emp.attendanceStatus === 'missing_punch' ? 'bg-rose-500' : 'bg-slate-400'
                        }`} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 dark:text-white truncate">
                            {emp.firstName} {emp.lastName}
                          </span>
                          {emp.pronouns && (
                            <span className="text-[10px] text-slate-400 hidden xl:inline">
                              ({emp.pronouns})
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono truncate">
                          {emp.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* EMP ID Monospace Pill */}
                  <td className="px-3 py-2">
                    <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md bg-surface-light dark:bg-surface-dark border border-divider-light dark:border-divider-dark text-slate-700 dark:text-slate-300">
                      {emp.employeeCode}
                    </span>
                  </td>

                  {/* Role & Title */}
                  <td className="px-3 py-2">
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {emp.jobTitle}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {role?.name.split('/')[0]}
                    </span>
                  </td>

                  {/* Department Tinted Badge */}
                  <td className="px-3 py-2">
                    <span 
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium"
                      style={{ 
                        backgroundColor: `${dept?.colorHex || '#4F46E5'}15`,
                        color: dept?.colorHex || '#4F46E5'
                      }}
                    >
                      {dept?.name}
                    </span>
                  </td>

                  {/* Manager */}
                  <td className="px-3 py-2">
                    {manager ? (
                      <div className="flex items-center gap-1.5">
                        <img
                          src={manager.avatarUrl}
                          alt={manager.firstName}
                          className="w-5 h-5 rounded-md object-cover"
                        />
                        <span className="text-slate-700 dark:text-slate-300 truncate">
                          {manager.firstName} {manager.lastName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">
                        Executive Lead
                      </span>
                    )}
                  </td>

                  {/* Live Status Accent */}
                  <td className="px-3 py-2">
                    {emp.attendanceStatus === 'clocked_in_office' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        In Office
                      </span>
                    )}
                    {emp.attendanceStatus === 'clocked_in_remote' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Remote WFH
                      </span>
                    )}
                    {emp.attendanceStatus === 'on_break' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        On Break
                      </span>
                    )}
                    {emp.attendanceStatus === 'on_leave' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        On Leave
                      </span>
                    )}
                    {emp.attendanceStatus === 'missing_punch' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                        ⚠️ Missing Punch
                      </span>
                    )}
                    {emp.attendanceStatus === 'off_duty' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-500/10 text-slate-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Off Duty
                      </span>
                    )}
                  </td>

                  {/* Location & Local Clock */}
                  <td className="px-3 py-2 text-slate-500">
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      {emp.timezone.split(' ')[0].split('/')[1] || 'London'}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-1.5 font-mono">
                      • {getLocalTime(emp.timezone)}
                    </span>
                  </td>

                  {/* Quick Action Button */}
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEmployee(emp);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                      title="Inspect 360° Profile"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
