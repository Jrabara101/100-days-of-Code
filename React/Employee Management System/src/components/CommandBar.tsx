import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  User, 
  Clock, 
  Shield, 
  Building, 
  Sparkles, 
  Plus, 
  Download, 
  ArrowRight, 
  Check, 
  AlertTriangle 
} from 'lucide-react';
import { storage } from '../services/storageService';
import { Employee } from '../types';

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmployee: (emp: Employee) => void;
  onNavigateTab: (tab: 'directory' | 'attendance' | 'roles' | 'pulse') => void;
  onOpenAddModal: () => void;
  onOpenExportCsv: () => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  isOpen,
  onClose,
  onSelectEmployee,
  onNavigateTab,
  onOpenAddModal,
  onOpenExportCsv
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const allEmployees = storage.getEmployees();
  const activeEmp = storage.getActiveEmployee();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open if parent handles it
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const normalizedQuery = query.toLowerCase().trim();

  // Filter employees
  const filteredEmployees = allEmployees.filter(emp => {
    const dept = storage.getDepartmentById(emp.departmentId)?.name || '';
    return (
      emp.firstName.toLowerCase().includes(normalizedQuery) ||
      emp.lastName.toLowerCase().includes(normalizedQuery) ||
      emp.employeeCode.toLowerCase().includes(normalizedQuery) ||
      emp.jobTitle.toLowerCase().includes(normalizedQuery) ||
      dept.toLowerCase().includes(normalizedQuery) ||
      emp.skills.some(s => s.toLowerCase().includes(normalizedQuery)) ||
      emp.timezone.toLowerCase().includes(normalizedQuery)
    );
  }).slice(0, 5);

  const actions = [
    {
      id: 'clock-in-office',
      label: 'Clock In (🏢 In Office)',
      category: 'Attendance',
      icon: Clock,
      action: () => {
        if (activeEmp) storage.clockIn(activeEmp.id, 'office');
        onClose();
      }
    },
    {
      id: 'clock-in-remote',
      label: 'Clock In (🏡 Remote WFH)',
      category: 'Attendance',
      icon: Clock,
      action: () => {
        if (activeEmp) storage.clockIn(activeEmp.id, 'remote');
        onClose();
      }
    },
    {
      id: 'clock-out',
      label: 'Clock Out of Active Shift',
      category: 'Attendance',
      icon: Clock,
      action: () => {
        if (activeEmp) storage.clockOut(activeEmp.id);
        onClose();
      }
    },
    {
      id: 'add-emp',
      label: 'Add New Employee Profile',
      category: 'Actions',
      icon: Plus,
      action: () => {
        onClose();
        onOpenAddModal();
      }
    },
    {
      id: 'export-csv',
      label: 'Export People Directory CSV',
      category: 'Data',
      icon: Download,
      action: () => {
        onClose();
        onOpenExportCsv();
      }
    },
    {
      id: 'nav-attendance',
      label: 'Jump to Attendance & PTO Cockpit',
      category: 'Navigation',
      icon: Clock,
      action: () => {
        onClose();
        onNavigateTab('attendance');
      }
    },
    {
      id: 'nav-roles',
      label: 'Jump to Role Governance & RBAC Matrix',
      category: 'Navigation',
      icon: Shield,
      action: () => {
        onClose();
        onNavigateTab('roles');
      }
    },
    {
      id: 'nav-pulse',
      label: 'Jump to Culture Pulse & Tenures',
      category: 'Navigation',
      icon: Sparkles,
      action: () => {
        onClose();
        onNavigateTab('pulse');
      }
    }
  ].filter(act => act.label.toLowerCase().includes(normalizedQuery));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-2xl rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-divider-light dark:border-divider-dark">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, EMP ID, job title, skill (e.g. Postgres), or action..."
            className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <kbd className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {/* Quick Query Filters */}
          {!query && (
            <div className="px-3 py-1 flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 font-medium">Quick suggestions:</span>
              <button 
                onClick={() => setQuery('DevOps')}
                className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[11px] font-medium hover:bg-brand/20 transition-colors"
              >
                DevOps
              </button>
              <button 
                onClick={() => setQuery('Engineering')}
                className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[11px] font-medium hover:bg-brand/20 transition-colors"
              >
                Engineering
              </button>
              <button 
                onClick={() => setQuery('missing')}
                className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[11px] font-medium hover:bg-amber-500/20 transition-colors"
              >
                ⚠️ Missing Punch
              </button>
            </div>
          )}

          {/* Employees Section */}
          {filteredEmployees.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">
                People ({filteredEmployees.length})
              </div>
              <div className="space-y-1">
                {filteredEmployees.map((emp) => {
                  const dept = storage.getDepartmentById(emp.departmentId);
                  return (
                    <button
                      key={emp.id}
                      onClick={() => {
                        onClose();
                        onSelectEmployee(emp);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={emp.avatarUrl}
                          alt={emp.firstName}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-900 dark:text-white">
                              {emp.firstName} {emp.lastName}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 px-1 rounded bg-slate-100 dark:bg-slate-800">
                              {emp.employeeCode}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">
                            {emp.jobTitle} • {dept?.name}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {actions.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">
                Actions & Navigation
              </div>
              <div className="space-y-1">
                {actions.map((act) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={act.id}
                      onClick={act.action}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group text-xs font-medium text-slate-700 dark:text-slate-200"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-brand" />
                        <span>{act.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {act.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredEmployees.length === 0 && actions.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-400">
              No matching employees or actions found for "{query}".
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-3">
            <span>Navigation: <kbd className="font-mono px-1 bg-slate-200 dark:bg-slate-800 rounded">↑</kbd> <kbd className="font-mono px-1 bg-slate-200 dark:bg-slate-800 rounded">↓</kbd></span>
            <span>Select: <kbd className="font-mono px-1 bg-slate-200 dark:bg-slate-800 rounded">ENTER</kbd></span>
          </div>
          <span>AURA Command v1.0</span>
        </div>
      </div>
    </div>
  );
};
