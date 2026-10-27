import React, { useState } from 'react';
import { 
  Table, 
  Grid, 
  GitFork, 
  Plus, 
  Download, 
  Upload, 
  Search, 
  Filter, 
  TrendingUp, 
  Users, 
  X
} from 'lucide-react';
import { Employee, LifecycleStage, WorkMode } from '../../types';
import { storage } from '../../services/storageService';
import { EmployeeTable } from './EmployeeTable';
import { RosterCardsView } from './RosterCardsView';
import { InteractiveOrgChart } from './InteractiveOrgChart';
import { BulkActionsDock } from './BulkActionsDock';
import { CsvImportModal } from './CsvImportModal';
import { AddEditEmployeeModal } from './AddEditEmployeeModal';
import { Can } from '../Can';

interface PeopleDirectoryViewProps {
  onSelectEmployee: (emp: Employee) => void;
  onOpenCommandBar: () => void;
}

export const PeopleDirectoryView: React.FC<PeopleDirectoryViewProps> = ({
  onSelectEmployee,
  onOpenCommandBar
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'orgchart'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterWorkMode, setFilterWorkMode] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);

  const allEmployees = storage.getEmployees();
  const allDepts = storage.getDepartments();
  const allRoles = storage.getRoles();

  // Filter logic
  const filteredEmployees = allEmployees.filter(emp => {
    const query = searchQuery.toLowerCase().trim();
    const dept = allDepts.find(d => d.id === emp.departmentId)?.name || '';

    const matchesSearch = !query || (
      emp.firstName.toLowerCase().includes(query) ||
      emp.lastName.toLowerCase().includes(query) ||
      emp.employeeCode.toLowerCase().includes(query) ||
      emp.jobTitle.toLowerCase().includes(query) ||
      dept.toLowerCase().includes(query) ||
      emp.skills.some(s => s.toLowerCase().includes(query))
    );

    const matchesDept = filterDept === 'all' || emp.departmentId === filterDept;
    const matchesRole = filterRole === 'all' || emp.roleId === filterRole;
    const matchesWorkMode = filterWorkMode === 'all' || emp.workMode === filterWorkMode;
    const matchesStatus = filterStatus === 'all' || emp.status === filterStatus;

    return matchesSearch && matchesDept && matchesRole && matchesWorkMode && matchesStatus;
  });

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredEmployees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEmployees.map(e => e.id));
    }
  };

  const handleExportCsv = () => {
    const headers = ['employee_code', 'first_name', 'last_name', 'email', 'job_title', 'department', 'role', 'work_mode', 'status', 'hire_date'];
    const rows = filteredEmployees.map(e => {
      const d = allDepts.find(dept => dept.id === e.departmentId)?.name || '';
      const r = allRoles.find(role => role.id === e.roleId)?.name || '';
      return [
        e.employeeCode,
        e.firstName,
        e.lastName,
        e.email,
        `"${e.jobTitle}"`,
        `"${d}"`,
        `"${r}"`,
        e.workMode,
        e.status,
        e.hireDate
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `aura_people_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Center Stage Header Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
              People Directory & Living Org
            </h1>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {allEmployees.length} Members
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+6 this quarter</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time workforce registry, interactive spatial tree hierarchy, and schema-validated bulk reconciliation.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCsvImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark text-slate-700 dark:text-slate-200 hover:border-brand/40 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-brand" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark text-slate-700 dark:text-slate-200 hover:border-brand/40 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>

          <Can perform="employee:create">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand hover:bg-brand-hover text-white shadow-sm shadow-brand/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Employee</span>
            </button>
          </Can>
        </div>
      </div>

      {/* Filter & View Mode Bar */}
      <div className="p-3 rounded-2xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search & Faceted Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {/* Search Input */}
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name, EMP-ID, title, skill... ⌘K"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Department Filter */}
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Departments</option>
            {allDepts.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Roles</option>
            {allRoles.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>

          {/* Work Mode Filter */}
          <select
            value={filterWorkMode}
            onChange={(e) => setFilterWorkMode(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Work Modes</option>
            <option value="onsite">🏢 Onsite</option>
            <option value="hybrid">🏢+🏡 Hybrid</option>
            <option value="remote">🏡 Remote</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Members</option>
            <option value="pre_boarding">Pre-Boarding</option>
            <option value="on_leave">On Leave</option>
            <option value="offboarding">Offboarding</option>
            <option value="alumni">Alumni</option>
          </select>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-elevated-light dark:bg-elevated-dark p-1 rounded-xl border border-divider-light dark:border-divider-dark shrink-0">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'table'
                ? 'bg-brand text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>

          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'cards'
                ? 'bg-brand text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Cards</span>
          </button>

          <button
            onClick={() => setViewMode('orgchart')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'orgchart'
                ? 'bg-brand text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Org Chart</span>
          </button>
        </div>
      </div>

      {/* Main View Mode Stage */}
      <div>
        {viewMode === 'table' && (
          <EmployeeTable
            employees={filteredEmployees}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onSelectEmployee={onSelectEmployee}
          />
        )}

        {viewMode === 'cards' && (
          <RosterCardsView
            employees={filteredEmployees}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectEmployee={onSelectEmployee}
          />
        )}

        {viewMode === 'orgchart' && (
          <InteractiveOrgChart
            onSelectEmployee={onSelectEmployee}
            onOpenAddModal={() => setShowAddModal(true)}
          />
        )}
      </div>

      {/* Multi-Select Floating Dock */}
      <BulkActionsDock
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* Modals */}
      <AddEditEmployeeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={(newEmp) => onSelectEmployee(newEmp)}
      />

      <CsvImportModal
        isOpen={showCsvImportModal}
        onClose={() => setShowCsvImportModal(false)}
      />
    </div>
  );
};
