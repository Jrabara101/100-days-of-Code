import React, { useState } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Users, 
  Coffee, 
  HeartHandshake, 
  Check, 
  X, 
  Plus, 
  ShieldAlert,
  Flame,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { storage } from '../../services/storageService';
import { AttendancePunchLog, LeaveRequest, Employee, BurnoutRiskSignal } from '../../types';
import { Can } from '../Can';
import confetti from 'canvas-confetti';

interface AttendanceCockpitProps {
  onSelectEmployee: (emp: Employee) => void;
}

export const AttendanceCockpit: React.FC<AttendanceCockpitProps> = ({
  onSelectEmployee
}) => {
  const [activeTab, setActiveTab] = useState<'timesheets' | 'clash_radar' | 'sentinel'>('timesheets');
  const [showRequestPtoModal, setShowRequestPtoModal] = useState(false);
  const [selectedPtoType, setSelectedPtoType] = useState<LeaveRequest['leaveType']>('pto');
  const [ptoStartDate, setPtoStartDate] = useState('2026-10-22');
  const [ptoEndDate, setPtoEndDate] = useState('2026-10-24');
  const [ptoReason, setPtoReason] = useState('Architecture deep-dive / personal recharge');

  const allEmployees = storage.getEmployees();
  const allDepts = storage.getDepartments();
  const attendanceLogs = storage.getAttendanceLogs();
  const leaveRequests = storage.getLeaveRequests();
  const burnoutSignals = storage.getBurnoutSignals();
  const activeEmp = storage.getActiveEmployee();

  // Metric summaries
  const clockedInOfficeCount = allEmployees.filter(e => e.attendanceStatus === 'clocked_in_office').length;
  const clockedInRemoteCount = allEmployees.filter(e => e.attendanceStatus === 'clocked_in_remote').length;
  const onLeaveCount = allEmployees.filter(e => e.attendanceStatus === 'on_leave').length;
  const missingPunchLogs = attendanceLogs.filter(l => l.status === 'missing_out_punch');
  const overtimeCount = burnoutSignals.filter(b => b.averageWeeklyHours > 42).length;

  // Resolve missing punch
  const handleResolveMissingPunch = (punchId: string, accept: boolean) => {
    storage.resolveMissingPunch(punchId, undefined, accept);
    confetti({ particleCount: 35, spread: 50 });
  };

  // Leave approval / rejection
  const handleLeaveAction = (id: string, status: 'approved' | 'rejected') => {
    storage.updateLeaveStatus(id, status);
    confetti({ particleCount: 30, spread: 60 });
  };

  // Detect clashes for a given leave request
  const getCoverageClashes = (req: LeaveRequest) => {
    const requester = allEmployees.find(e => e.id === req.employeeId);
    if (!requester) return [];

    return leaveRequests.filter(other => {
      if (other.id === req.id || other.status === 'rejected' || other.status === 'cancelled') return false;
      const otherEmp = allEmployees.find(e => e.id === other.employeeId);
      if (!otherEmp) return false;

      // Same department or same role
      const sameDept = otherEmp.departmentId === requester.departmentId;
      const dateOverlap = (req.startDate <= other.endDate) && (req.endDate >= other.startDate);

      return sameDept && dateOverlap;
    });
  };

  // Submit leave request
  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmp) return;

    const start = new Date(ptoStartDate);
    const end = new Date(ptoEndDate);
    const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    storage.addLeaveRequest({
      employeeId: activeEmp.id,
      approverId: activeEmp.managerId || allEmployees[0]?.id || 'emp-001',
      leaveType: selectedPtoType,
      startDate: ptoStartDate,
      endDate: ptoEndDate,
      daysCount: diffDays,
      reason: ptoReason
    });

    setShowRequestPtoModal(false);
    confetti({ particleCount: 40, spread: 60 });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
              Hybrid Attendance, Timesheet & PTO Cockpit
            </h1>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-brand/10 text-brand font-semibold">
              Live Shifts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Zero-anxiety missing-punch reconciliation, predictive team coverage clash radar, and burnout telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRequestPtoModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand hover:bg-brand-hover text-white shadow-sm shadow-brand/20 transition-all active:scale-95"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>+ Request Time-Off</span>
          </button>
        </div>
      </div>

      {/* Top KPI Summary Strip (4 Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Currently Clocked In</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {clockedInOfficeCount + clockedInRemoteCount}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ {allEmployees.length} staff</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500 font-mono">
            <span className="text-emerald-600 dark:text-emerald-400">{clockedInOfficeCount} Office</span>
            <span>•</span>
            <span className="text-blue-600 dark:text-blue-400">{clockedInRemoteCount} Remote</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">On Scheduled Leave</span>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
              {onLeaveCount + 1}
            </span>
            <span className="text-xs text-slate-400 font-mono">Employees</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 truncate">
            {leaveRequests.filter(r => r.status === 'approved').length} Active approvals this cycle
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Missing Punches</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-500">
              {missingPunchLogs.length}
            </span>
            <span className="text-xs text-amber-600/80 font-mono font-medium">Requires Sign-Off</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Zero penalties • 1-click reconciliation
          </p>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Burnout Sentinel</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-500">
              {overtimeCount}
            </span>
            <span className="text-xs text-slate-400 font-mono">Streak Alerts (&gt;42h)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Proactive rest recommendations active
          </p>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-divider-light dark:border-divider-dark">
        <button
          onClick={() => setActiveTab('timesheets')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'timesheets'
              ? 'border-brand text-brand dark:text-brand-dark'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Weekly Timesheet & Anomaly Triage</span>
          {missingPunchLogs.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-mono text-[10px]">
              {missingPunchLogs.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('clash_radar')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'clash_radar'
              ? 'border-brand text-brand dark:text-brand-dark'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>PTO Queue & Team Coverage Clash Radar</span>
          {leaveRequests.filter(r => r.status === 'pending').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-brand text-white font-mono text-[10px]">
              {leaveRequests.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sentinel')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'sentinel'
              ? 'border-brand text-brand dark:text-brand-dark'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <HeartHandshake className="w-4 h-4 text-rose-500" />
          <span>Burnout & Overtime Sentinel</span>
        </button>
      </div>

      {/* TAB 1: WEEKLY TIMESHEET & MISSING PUNCH ANOMALIES */}
      {activeTab === 'timesheets' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Missing Punch Reconciliation Banner */}
          {missingPunchLogs.length > 0 && (
            <div className="p-4.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Zero-Anxiety Open Shift Reconciliation Needed ({missingPunchLogs.length})
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Open shift exceeding 14 hours detected overnight. Review submitted timestamp corrections below.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {missingPunchLogs.map(log => {
                  const emp = allEmployees.find(e => e.id === log.employeeId);
                  return (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-xl border border-amber-500/20 bg-elevated-light dark:bg-elevated-dark flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={emp?.avatarUrl}
                          alt={emp?.firstName}
                          className="w-9 h-9 rounded-xl object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {emp?.firstName} {emp?.lastName}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {log.date}
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                            "{log.disputeReason || 'Forgot to punch out after late deployment'}"
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResolveMissingPunch(log.id, true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept Correction (18:15)</span>
                        </button>

                        <button
                          onClick={() => handleResolveMissingPunch(log.id, false)}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-700 dark:text-slate-300 hover:border-brand/40 transition-colors"
                        >
                          Manual Adjust
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Weekly Timesheet Table */}
          <div className="rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark overflow-hidden shadow-sm">
            <div className="p-4 border-b border-divider-light dark:border-divider-dark flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Weekly Roster Timesheet Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Current Week: Oct 19 – Oct 23, 2026
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>Standard Target: 40.0h</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-surface-light dark:bg-surface-dark text-slate-500 font-semibold border-b border-divider-light dark:border-divider-dark">
                  <tr>
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Mon 19</th>
                    <th className="py-2.5 px-3">Tue 20</th>
                    <th className="py-2.5 px-3">Wed 21 (Today)</th>
                    <th className="py-2.5 px-3">Thu 22</th>
                    <th className="py-2.5 px-3">Fri 23</th>
                    <th className="py-2.5 px-3">Total Hours</th>
                    <th className="py-2.5 px-3 text-right">Sign-Off</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider-light dark:divide-divider-dark">
                  {allEmployees.slice(0, 8).map((emp) => {
                    const punches = attendanceLogs.filter(l => l.employeeId === emp.id);
                    const monPunch = punches.find(p => p.date === '2026-10-19');
                    const tuePunch = punches.find(p => p.date === '2026-10-20');
                    const wedPunch = punches.find(p => p.date === '2026-10-21');
                    const totalHours = punches.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);

                    return (
                      <tr 
                        key={emp.id}
                        onClick={() => onSelectEmployee(emp)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={emp.avatarUrl}
                              alt={emp.firstName}
                              className="w-7 h-7 rounded-lg object-cover"
                            />
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {emp.firstName} {emp.lastName}
                              </p>
                              <span className="font-mono text-[10px] text-slate-400">
                                {emp.jobTitle}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono">
                          {monPunch ? (
                            <span className="px-2 py-0.5 rounded bg-surface-light dark:bg-surface-dark border border-divider-light dark:border-divider-dark font-medium">
                              {monPunch.totalHours}h
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3 font-mono">
                          {tuePunch?.status === 'missing_out_punch' ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/30 font-bold">
                              ⚠️ 19.5h
                            </span>
                          ) : tuePunch ? (
                            <span className="px-2 py-0.5 rounded bg-surface-light dark:bg-surface-dark border border-divider-light dark:border-divider-dark font-medium">
                              {tuePunch.totalHours}h
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3 font-mono">
                          {wedPunch ? (
                            <span className="px-2 py-0.5 rounded bg-brand/10 text-brand font-bold flex items-center gap-1 w-max">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                              {wedPunch.totalHours}h
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3 font-mono text-slate-400">
                          {emp.attendanceStatus === 'on_leave' ? (
                            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
                              PTO
                            </span>
                          ) : '8.0h (est)'}
                        </td>

                        <td className="py-3 px-3 font-mono text-slate-400">
                          {emp.attendanceStatus === 'on_leave' ? (
                            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
                              PTO
                            </span>
                          ) : '8.0h (est)'}
                        </td>

                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          {(totalHours || 32).toFixed(1)}h
                        </td>

                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confetti({ particleCount: 20, spread: 40 });
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-light dark:bg-surface-dark border border-divider-light dark:border-divider-dark hover:border-emerald-500 hover:text-emerald-500 transition-colors"
                          >
                            Approve
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEAM PTO & COVERAGE CLASH RADAR */}
      {activeTab === 'clash_radar' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Pending PTO Requests with Inline Clash Highlights */}
          <div className="rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Pending Time-Off Approval Queue
              </h3>
              <p className="text-xs text-slate-500">
                Real-time clash engine analyzes team coverage before manager sign-off.
              </p>
            </div>

            <div className="space-y-3">
              {leaveRequests.filter(r => r.status === 'pending').map(req => {
                const emp = allEmployees.find(e => e.id === req.employeeId);
                const dept = allDepts.find(d => d.id === emp?.departmentId);
                const clashes = getCoverageClashes(req);

                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp?.avatarUrl}
                          alt={emp?.firstName}
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {emp?.firstName} {emp?.lastName}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold uppercase">
                              {req.leaveType}
                            </span>
                            <span className="font-mono text-xs text-slate-500">
                              {req.daysCount} days ({req.startDate} → {req.endDate})
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                            "{req.reason}"
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleLeaveAction(req.id, 'rejected')}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium border border-divider-light dark:border-divider-dark text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleLeaveAction(req.id, 'approved')}
                          className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-brand hover:bg-brand-hover text-white shadow-sm transition-colors"
                        >
                          Approve Request
                        </button>
                      </div>
                    </div>

                    {/* Clash Radar Warning Banner */}
                    {clashes.length > 0 && (
                      <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
                        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                        <div>
                          <p className="font-bold">
                            ⚠️ Coverage Clash Detected ({clashes.length} overlapping absences in {dept?.name}):
                          </p>
                          <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-[11px] opacity-90">
                            {clashes.map(c => {
                              const otherEmp = allEmployees.find(e => e.id === c.employeeId);
                              return (
                                <li key={c.id}>
                                  <strong>{otherEmp?.firstName} {otherEmp?.lastName}</strong> ({otherEmp?.jobTitle}) is also scheduled off {c.startDate} to {c.endDate}.
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 14-Day Calendar Coverage Matrix */}
          <div className="rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              14-Day Team Availability Timeline (Oct 18 – Oct 31, 2026)
            </h3>

            <div className="space-y-3">
              {allDepts.map(dept => {
                const deptEmployees = allEmployees.filter(e => e.departmentId === dept.id);
                return (
                  <div key={dept.id} className="p-3 rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {dept.name} ({deptEmployees.length} staff)
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Target Coverage: &gt;75%
                      </span>
                    </div>

                    <div className="grid grid-cols-14 gap-1 text-center font-mono text-[10px]">
                      {Array.from({ length: 14 }).map((_, idx) => {
                        const dayNum = 18 + idx;
                        const dateStr = `2026-10-${dayNum.toString().padStart(2, '0')}`;
                        const isWeekend = idx === 0 || idx === 6 || idx === 7 || idx === 13;
                        const onLeaveThisDay = leaveRequests.filter(l => 
                          l.status === 'approved' && 
                          deptEmployees.some(e => e.id === l.employeeId) &&
                          dateStr >= l.startDate && dateStr <= l.endDate
                        ).length;

                        return (
                          <div
                            key={idx}
                            className={`p-1.5 rounded-lg border flex flex-col items-center justify-center ${
                              isWeekend 
                                ? 'bg-slate-100 dark:bg-slate-800/40 border-divider-light dark:border-divider-dark text-slate-400' 
                                : onLeaveThisDay > 1
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 font-bold'
                                : onLeaveThisDay === 1
                                ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400'
                                : 'bg-surface-light dark:bg-surface-dark border-divider-light dark:border-divider-dark text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="text-[9px] text-slate-400">Oct {dayNum}</span>
                            <span className="font-bold text-[10px] mt-0.5">
                              {onLeaveThisDay > 0 ? `-${onLeaveThisDay}` : '✓'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BURNOUT & OVERTIME SENTINEL */}
      {activeTab === 'sentinel' && (
        <div className="space-y-5 animate-fadeIn">
          <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 flex items-center gap-3">
            <HeartHandshake className="w-5 h-5 text-rose-500 shrink-0" />
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Empathetic Workforce Health Signals
              </h3>
              <p className="text-[11px] text-slate-500">
                Passively identifies overtime streaks, skipped breaks, and low PTO utilization to prevent developer fatigue.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {burnoutSignals.map(sig => (
              <div
                key={sig.employeeId}
                className="p-4.5 rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {sig.employeeName}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 uppercase font-semibold">
                    {sig.riskLevel} Risk
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-surface-light dark:bg-surface-dark border border-divider-light dark:border-divider-dark">
                    <span className="text-[10px] text-slate-400">Weekly Avg</span>
                    <p className="font-mono font-bold text-slate-900 dark:text-white">{sig.averageWeeklyHours}h</p>
                  </div>
                  <div className="p-2 rounded-xl bg-surface-light dark:bg-surface-dark border border-divider-light dark:border-divider-dark">
                    <span className="text-[10px] text-slate-400">Streak</span>
                    <p className="font-mono font-bold text-rose-500">{sig.consecutiveOvertimeWeeks} wks</p>
                  </div>
                  <div className="p-2 rounded-xl bg-surface-light dark:bg-surface-dark border border-divider-light dark:border-divider-dark">
                    <span className="text-[10px] text-slate-400">Unused PTO</span>
                    <p className="font-mono font-bold text-purple-500">{sig.unutilizedPtoDays} days</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 bg-surface-light dark:bg-surface-dark p-3 rounded-xl border border-divider-light dark:border-divider-dark">
                  💡 <strong>Manager Recommendation:</strong> {sig.recommendation}
                </p>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      confetti({ particleCount: 20, spread: 40 });
                      alert(`Sent supportive rest check-in message to ${sig.employeeName}.`);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand/10 text-brand hover:bg-brand/20 transition-colors"
                  >
                    Send Supportive Rest Prompt
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Request Time-Off */}
      {showRequestPtoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div 
            className="w-full max-w-md rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-divider-light dark:border-divider-dark">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand" />
                Submit Time-Off Request
              </h3>
              <button
                onClick={() => setShowRequestPtoModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Leave Category</label>
                <select
                  value={selectedPtoType}
                  onChange={(e) => setSelectedPtoType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-white"
                >
                  <option value="pto">🌴 Planned Vacation PTO</option>
                  <option value="sick">🩺 Sick Leave</option>
                  <option value="parental">👶 Parental / Family Leave</option>
                  <option value="bereavement">🕊️ Bereavement</option>
                  <option value="unpaid">Unpaid Personal Sabbatical</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={ptoStartDate}
                    onChange={(e) => setPtoStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={ptoEndDate}
                    onChange={(e) => setPtoEndDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Context & Reason</label>
                <textarea
                  value={ptoReason}
                  onChange={(e) => setPtoReason(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-white focus:outline-none focus:border-brand"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-divider-light dark:border-divider-dark">
                <button
                  type="button"
                  onClick={() => setShowRequestPtoModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand hover:bg-brand-hover text-white shadow-sm transition-all"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
