import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { storage } from '../../services/storageService';
import { Employee } from '../../types';
import confetti from 'canvas-confetti';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedRow {
  code: string;
  name: string;
  email: string;
  jobTitle: string;
  departmentCode: string;
  workMode: string;
  diffType: 'create' | 'update' | 'error';
  errorMessage?: string;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose
}) => {
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [hasParsed, setHasParsed] = useState(false);

  if (!isOpen) return null;

  const existingEmployees = storage.getEmployees();
  const allDepts = storage.getDepartments();

  const sampleCsvContent = `employee_code,first_name,last_name,email,job_title,department_code,work_mode
EMP-0142,Elena,Rostova,elena.rostova@aura-os.internal,Lead Infrastructure Architect,ENG,hybrid
EMP-0250,Mateo,Alvarez,mateo.alvarez@aura-os.internal,Junior Systems Engineer,ENG,remote
EMP-0251,Soraya,Mir,soraya.mir@aura-os.internal,Staff Product Designer,DES,hybrid
EMP-0252,Daniel,Kovacs,daniel.kovacs@aura-os.internal,Operations Analyst,PEOP,onsite`;

  const handleDownloadSample = () => {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'aura_people_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsv = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return;

    const rows: ParsedRow[] = [];
    const deptCodes = new Set(allDepts.map(d => d.code.toUpperCase()));

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',').map(p => p.trim());
      if (parts.length < 6) {
        rows.push({
          code: parts[0] || `ROW-${i}`,
          name: `${parts[1] || ''} ${parts[2] || ''}`,
          email: parts[3] || '',
          jobTitle: parts[4] || '',
          departmentCode: parts[5] || '',
          workMode: parts[6] || 'remote',
          diffType: 'error',
          errorMessage: 'Malformed row: Insufficient CSV columns'
        });
        continue;
      }

      const [code, first, last, email, jobTitle, deptCode, workMode] = parts;
      const existing = existingEmployees.find(e => e.employeeCode.toUpperCase() === code.toUpperCase() || e.email.toLowerCase() === email.toLowerCase());

      if (!deptCodes.has(deptCode.toUpperCase())) {
        rows.push({
          code,
          name: `${first} ${last}`,
          email,
          jobTitle,
          departmentCode: deptCode,
          workMode: workMode || 'hybrid',
          diffType: 'error',
          errorMessage: `Unrecognized Department Code "${deptCode}". Valid: ${Array.from(deptCodes).join(', ')}`
        });
        continue;
      }

      rows.push({
        code,
        name: `${first} ${last}`,
        email,
        jobTitle,
        departmentCode: deptCode.toUpperCase(),
        workMode: workMode || 'hybrid',
        diffType: existing ? 'update' : 'create'
      });
    }

    setParsedRows(rows);
    setHasParsed(true);
  };

  const handleLoadSampleInEditor = () => {
    setCsvText(sampleCsvContent);
    parseCsv(sampleCsvContent);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvText(text);
        parseCsv(text);
      };
      reader.readAsText(file);
    }
  };

  const handleApplyReconciliation = () => {
    const validRows = parsedRows.filter(r => r.diffType !== 'error');
    if (validRows.length === 0) return;

    for (const r of validRows) {
      const dept = allDepts.find(d => d.code.toUpperCase() === r.departmentCode);
      const existing = existingEmployees.find(e => e.employeeCode.toUpperCase() === r.code.toUpperCase() || e.email.toLowerCase() === r.email.toLowerCase());

      if (existing) {
        storage.updateEmployee(existing.id, {
          jobTitle: r.jobTitle,
          departmentId: dept?.id || existing.departmentId,
          workMode: (r.workMode.toLowerCase() as any) || 'hybrid'
        });
      } else {
        const [first, ...lastParts] = r.name.split(' ');
        storage.addEmployee({
          employeeCode: r.code,
          firstName: first || 'Team',
          lastName: lastParts.join(' ') || 'Member',
          email: r.email,
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          departmentId: dept?.id || allDepts[0].id,
          roleId: storage.getRoles()[4]?.id || 'role-employee',
          managerId: allEmployees[0]?.id || null,
          jobTitle: r.jobTitle,
          employmentType: 'full_time',
          workMode: (r.workMode.toLowerCase() as any) || 'hybrid',
          status: 'active',
          timezone: 'Europe/London (UTC+1)',
          hireDate: new Date().toISOString().split('T')[0],
          attendanceStatus: 'clocked_in_office',
          skills: ['Imported Member']
        }, {
          baseSalary: 110000,
          currency: 'USD'
        });
      }
    }

    onClose();
    confetti({ particleCount: 60, spread: 80 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-3xl rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-divider-light dark:border-divider-dark">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Bulk CSV Triage & Schema Reconciliation
              </h3>
              <p className="text-xs text-slate-500">
                Validated roster importer with automatic change diff detection & conflict safeguards.
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

        {/* Upload & Dropzone Area */}
        {!hasParsed && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="border-2 border-dashed border-divider-light dark:border-divider-dark hover:border-brand rounded-2xl p-8 text-center bg-surface-light dark:bg-surface-dark transition-colors cursor-pointer"
            >
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                Drag and drop your .csv workforce file here
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Supports columns: <code>employee_code, first_name, last_name, email, job_title, department_code, work_mode</code>
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={handleDownloadSample}
                className="flex items-center gap-2 text-xs font-semibold text-brand hover:underline"
              >
                <Download className="w-4 h-4" />
                Download CSV Blueprint Template
              </button>

              <button
                onClick={handleLoadSampleInEditor}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-brand/10 text-brand hover:bg-brand/20 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Load Demo CSV Roster with Diffs
              </button>
            </div>
          </div>
        )}

        {/* Live Diff Preview Table */}
        {hasParsed && (
          <div className="flex-1 overflow-hidden flex flex-col space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">
                Pre-Flight Diff Preview ({parsedRows.length} rows detected)
              </span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {parsedRows.filter(r => r.diffType === 'create').length} New
                </span>
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  {parsedRows.filter(r => r.diffType === 'update').length} Update
                </span>
                {parsedRows.some(r => r.diffType === 'error') && (
                  <span className="flex items-center gap-1 text-rose-500 font-mono">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    {parsedRows.filter(r => r.diffType === 'error').length} Errors
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto border border-divider-light dark:border-divider-dark rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-surface-light dark:bg-surface-dark text-slate-500 font-medium border-b border-divider-light dark:border-divider-dark sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Diff Action</th>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Full Name</th>
                    <th className="py-2.5 px-3">Role / Title</th>
                    <th className="py-2.5 px-3">Dept</th>
                    <th className="py-2.5 px-3">Validation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider-light dark:divide-divider-dark">
                  {parsedRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="py-2.5 px-3">
                        {row.diffType === 'create' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase">
                            + CREATE
                          </span>
                        )}
                        {row.diffType === 'update' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase">
                            ~ UPDATE
                          </span>
                        )}
                        {row.diffType === 'error' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 uppercase">
                            ! ERROR
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {row.code}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                        {row.name}
                        <p className="text-[10px] text-slate-400 font-mono">{row.email}</p>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {row.jobTitle}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {row.departmentCode}
                      </td>
                      <td className="py-2.5 px-3">
                        {row.diffType === 'error' ? (
                          <span className="text-[11px] text-rose-500 font-medium">
                            {row.errorMessage}
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Schema Valid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-divider-light dark:border-divider-dark">
          {hasParsed ? (
            <button
              onClick={() => {
                setHasParsed(false);
                setParsedRows([]);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              ← Choose Another File
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cancel
            </button>
            {hasParsed && (
              <button
                onClick={handleApplyReconciliation}
                disabled={parsedRows.every(r => r.diffType === 'error')}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand hover:bg-brand-hover text-white transition-colors disabled:opacity-50"
              >
                Reconcile & Apply {parsedRows.filter(r => r.diffType !== 'error').length} Records
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
