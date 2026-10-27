import React, { useState, useEffect } from 'react';
import { ExpenseProvider, useExpense } from './context/ExpenseContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopRibbon } from './components/layout/TopRibbon';
import { EmployeeDashboard } from './components/employee/EmployeeDashboard';
import { StipendWalletsView } from './components/employee/StipendWalletsView';
import { ApproverTriageCockpit } from './components/approver/ApproverTriageCockpit';
import { PolicyBuilder } from './components/policies/PolicyBuilder';
import { AccountingSyncView } from './components/policies/AccountingSyncView';
import { ExpenseSubmissionStudio } from './components/modal/ExpenseSubmissionStudio';
import { DominoPayoutTrackerModal } from './components/employee/DominoPayoutTrackerModal';
import type { ExpenseType } from './types';

const MainApp: React.FC = () => {
  const { currentRole } = useExpense();
  const [currentTab, setCurrentTab] = useState<string>('reimbursements');
  const [isSubmissionStudioOpen, setIsSubmissionStudioOpen] = useState<boolean>(false);
  const [submissionMode, setSubmissionMode] = useState<ExpenseType>('receipt');
  const [isPayoutTrackerOpen, setIsPayoutTrackerOpen] = useState<boolean>(false);

  // Keyboard shortcut listener: Cmd+U or Ctrl+U to trigger New Expense Studio
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        setSubmissionMode('receipt');
        setIsSubmissionStudioOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenStudio = (mode: ExpenseType = 'receipt') => {
    setSubmissionMode(mode);
    setIsSubmissionStudioOpen(true);
  };

  return (
    <div className="flex h-screen bg-[#0A0B0D] text-[#F8FAFC] font-sans antialiased overflow-hidden">
      {/* Collapsible Institutional Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenNewExpense={() => handleOpenStudio('receipt')}
      />

      {/* Main Workspace Stage */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#0A0B0D]">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-20 bg-[#0A0B0D]/80 backdrop-blur-md px-8 py-4 border-b border-[#232730] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              {currentTab === 'reimbursements' && 'Employee Reimbursement Ledger'}
              {currentTab === 'stipends' && 'Company Stipend & Allowance Wallets'}
              {currentTab === 'approvals' && 'Approver & Finance Triage Cockpit'}
              {currentTab === 'policies' && 'Corporate Spend Policies & GL Mapping'}
              {currentTab === 'accounting' && 'General Ledger ERP Sync & Banking Rails'}
            </h2>
            <p className="text-xs text-gray-400 font-mono">
              Apex Labs Inc. • Active Persona:{' '}
              <span className="text-emerald-400 font-bold capitalize">{currentRole}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPayoutTrackerOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[#171A20] hover:bg-[#1E222A] border border-[#2E3440] text-xs font-mono text-emerald-400 flex items-center gap-2 transition"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ACH Dispatch: $1,420.50 (Est: Tomorrow)</span>
            </button>
          </div>
        </header>

        {/* Workspace Body Container */}
        <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Top Settlement & Wallet Ribbon (3-Card Horizon) */}
          <TopRibbon
            onOpenPayoutTracker={() => setIsPayoutTrackerOpen(true)}
            onOpenNewExpense={() => handleOpenStudio('receipt')}
          />

          {/* Tab Views */}
          {currentTab === 'reimbursements' && (
            <EmployeeDashboard
              onOpenSubmissionStudio={(mode) => handleOpenStudio(mode || 'receipt')}
              onSelectItemForReview={() => {
                setCurrentTab('approvals');
              }}
            />
          )}

          {currentTab === 'stipends' && (
            <StipendWalletsView onOpenNewExpense={() => handleOpenStudio('receipt')} />
          )}

          {currentTab === 'approvals' && <ApproverTriageCockpit />}

          {currentTab === 'policies' && <PolicyBuilder />}

          {currentTab === 'accounting' && <AccountingSyncView />}
        </div>
      </main>

      {/* Interactive Expense Submission Studio Modal */}
      <ExpenseSubmissionStudio
        isOpen={isSubmissionStudioOpen}
        onClose={() => setIsSubmissionStudioOpen(false)}
        defaultMode={submissionMode}
      />

      {/* Domino's-Style Live Payout Tracker Modal */}
      <DominoPayoutTrackerModal
        isOpen={isPayoutTrackerOpen}
        onClose={() => setIsPayoutTrackerOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ExpenseProvider>
      <MainApp />
    </ExpenseProvider>
  );
}
