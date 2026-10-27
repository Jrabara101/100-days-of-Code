import React, { useState } from 'react';
import { 
  Building2, 
  Shield, 
  UserCheck, 
  Power, 
  X, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { storage } from '../../services/storageService';
import { Department, Role, Employee, LifecycleStage } from '../../types';
import confetti from 'canvas-confetti';

interface BulkActionsDockProps {
  selectedIds: string[];
  onClearSelection: () => void;
}

export const BulkActionsDock: React.FC<BulkActionsDockProps> = ({
  selectedIds,
  onClearSelection
}) => {
  const [activeModal, setActiveModal] = useState<'dept' | 'role' | 'manager' | 'status' | null>(null);
  const [targetDeptId, setTargetDeptId] = useState('');
  const [targetRoleId, setTargetRoleId] = useState('');
  const [targetManagerId, setTargetManagerId] = useState<string | null>(null);
  const [targetStatus, setTargetStatus] = useState<LifecycleStage>('active');

  if (selectedIds.length === 0) return null;

  const allDepts = storage.getDepartments();
  const allRoles = storage.getRoles();
  const allEmployees = storage.getEmployees();

  const handleApplyDept = () => {
    if (!targetDeptId) return;
    storage.bulkUpdate(selectedIds, { departmentId: targetDeptId });
    setActiveModal(null);
    onClearSelection();
    confetti({ particleCount: 30, spread: 60 });
  };

  const handleApplyRole = () => {
    if (!targetRoleId) return;
    storage.bulkUpdate(selectedIds, { roleId: targetRoleId });
    setActiveModal(null);
    onClearSelection();
    confetti({ particleCount: 30, spread: 60 });
  };

  const handleApplyManager = () => {
    storage.bulkUpdate(selectedIds, { managerId: targetManagerId });
    setActiveModal(null);
    onClearSelection();
    confetti({ particleCount: 30, spread: 60 });
  };

  const handleApplyStatus = () => {
    storage.bulkUpdate(selectedIds, { status: targetStatus });
    setActiveModal(null);
    onClearSelection();
    confetti({ particleCount: 30, spread: 60 });
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark shadow-2xl backdrop-blur-lg animate-slideUp">
        <div className="flex items-center gap-2 pr-3 border-r border-divider-light dark:border-divider-dark">
          <span className="w-6 h-6 rounded-lg bg-brand text-white flex items-center justify-center text-xs font-bold font-mono">
            {selectedIds.length}
          </span>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTargetDeptId(allDepts[0]?.id || '');
              setActiveModal('dept');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 bg-surface-light dark:bg-surface-dark border border-divider-light dark:border-divider-dark hover:border-brand/40 transition-colors"
          >
            <Building2 className="w-3.5 h-3.5 text-brand" />
            <span>Change Dept</span>
          </button>

          <button
            onClick={() => {
              setTargetRoleId(allRoles[0]?.id || '');
              setActiveModal('role');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 bg-surface-light dark:bg-surface-dark border border-divider-light dark:border-divider-dark hover:border-brand/40 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-brand" />
            <span>Assign Role</span>
          </button>

          <button
            onClick={() => {
              setTargetManagerId(allEmployees[0]?.id || null);
              setActiveModal('manager');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 bg-surface-light dark:bg-surface-dark border border-divider-light dark:border-divider-dark hover:border-brand/40 transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5 text-brand" />
            <span>Update Manager</span>
          </button>

          <button
            onClick={() => {
              setTargetStatus('active');
              setActiveModal('status');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 bg-surface-light dark:bg-surface-dark border border-divider-light dark:border-divider-dark hover:border-brand/40 transition-colors"
          >
            <Power className="w-3.5 h-3.5 text-amber-500" />
            <span>Bulk Status</span>
          </button>
        </div>

        <button
          onClick={onClearSelection}
          className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Deselect All"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Modal for Dept */}
      {activeModal === 'dept' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark p-5 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Change Department for {selectedIds.length} Teammates
            </h4>
            <select
              value={targetDeptId}
              onChange={(e) => setTargetDeptId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-white"
            >
              {allDepts.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyDept}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-brand hover:bg-brand-hover text-white"
              >
                Apply Department
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Role */}
      {activeModal === 'role' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark p-5 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Assign Role for {selectedIds.length} Teammates
            </h4>
            <select
              value={targetRoleId}
              onChange={(e) => setTargetRoleId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-white"
            >
              {allRoles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyRole}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-brand hover:bg-brand-hover text-white"
              >
                Apply Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Manager */}
      {activeModal === 'manager' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark p-5 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Reassign Manager for {selectedIds.length} Teammates
            </h4>
            <select
              value={targetManagerId || ''}
              onChange={(e) => setTargetManagerId(e.target.value || null)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-white"
            >
              <option value="">Executive Leadership (No Direct Manager)</option>
              {allEmployees.map(e => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.jobTitle})</option>
              ))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyManager}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-brand hover:bg-brand-hover text-white"
              >
                Update Manager
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Status */}
      {activeModal === 'status' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark p-5 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Update Lifecycle Status for {selectedIds.length} Teammates
            </h4>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as LifecycleStage)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-white"
            >
              <option value="active">Active</option>
              <option value="pre_boarding">Pre-Boarding</option>
              <option value="on_leave">Parental / Medical Leave</option>
              <option value="offboarding">Offboarding</option>
              <option value="alumni">Alumni</option>
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyStatus}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-brand hover:bg-brand-hover text-white"
              >
                Apply Status
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
