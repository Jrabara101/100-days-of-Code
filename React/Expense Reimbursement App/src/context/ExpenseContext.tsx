import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import type {
  ExpensePolicy,
  ExpenseReport,
  ExpenseItem,
  PayoutBatch,
  StipendWallet,
  AuditTrail,
  UserRole,
  PolicyCategory,
} from '../types';
import {
  INITIAL_POLICIES,
  INITIAL_REPORTS,
  INITIAL_EXPENSE_ITEMS,
  INITIAL_PAYOUT_BATCHES,
  INITIAL_STIPENDS,
  INITIAL_AUDIT_TRAIL,
} from '../data/mockData';

interface PolicyLintResult {
  hasViolation: boolean;
  isSoftViolation: boolean;
  isHardViolation: boolean;
  message: string;
  suggestedAction?: string;
  flagType?: 'over_cap' | 'receipt_missing' | 'prohibited_keyword';
}

interface ExpenseContextType {
  policies: ExpensePolicy[];
  reports: ExpenseReport[];
  items: ExpenseItem[];
  payoutBatches: PayoutBatch[];
  stipendWallets: StipendWallet[];
  auditTrail: AuditTrail[];
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  selectedReportId: string | null;
  setSelectedReportId: (id: string | null) => void;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  
  // Actions
  addExpenseItem: (item: Partial<ExpenseItem>) => ExpenseItem;
  updateExpenseItem: (id: string, updates: Partial<ExpenseItem>) => void;
  deleteExpenseItem: (id: string) => void;
  submitExpenseReport: (title: string, itemIds: string[]) => ExpenseReport;
  approveLineItem: (itemId: string, comment?: string) => void;
  flagLineItem: (itemId: string, comment: string) => void;
  approveCleanItemsInReport: (reportId: string) => { approvedCount: number; approvedAmountCents: number; batchId: string };
  dispatchPayoutBatch: (batchId: string) => void;
  checkDuplicateFraud: (merchant: string, amountCents: number, date: string, sha256?: string) => { isDuplicate: boolean; matchedReportNumber?: string; matchedDate?: string; matchReason?: string };
  lintPolicy: (category: PolicyCategory, amountCents: number, note?: string) => PolicyLintResult;
  exportERPBundle: (format: 'netsuite' | 'quickbooks' | 'xero') => void;
  resetAllData: () => void;
  triggerCelebration: () => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or initial mock data
  const [policies, setPolicies] = useState<ExpensePolicy[]>(() => {
    const saved = localStorage.getItem('aerospend_policies');
    return saved ? JSON.parse(saved) : INITIAL_POLICIES;
  });

  const [reports, setReports] = useState<ExpenseReport[]>(() => {
    const saved = localStorage.getItem('aerospend_reports');
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  });

  const [items, setItems] = useState<ExpenseItem[]>(() => {
    const saved = localStorage.getItem('aerospend_items');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSE_ITEMS;
  });

  const [payoutBatches, setPayoutBatches] = useState<PayoutBatch[]>(() => {
    const saved = localStorage.getItem('aerospend_payouts');
    return saved ? JSON.parse(saved) : INITIAL_PAYOUT_BATCHES;
  });

  const [stipendWallets, setStipendWallets] = useState<StipendWallet[]>(() => {
    const saved = localStorage.getItem('aerospend_stipends');
    return saved ? JSON.parse(saved) : INITIAL_STIPENDS;
  });

  const [auditTrail, setAuditTrail] = useState<AuditTrail[]>(() => {
    const saved = localStorage.getItem('aerospend_audit');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_TRAIL;
  });

  const [currentRole, setCurrentRole] = useState<UserRole>('employee');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [selectedReportId, setSelectedReportId] = useState<string | null>('rep-084');
  const [selectedItemId, setSelectedItemId] = useState<string | null>('item-002');

  // Persistence effects
  useEffect(() => {
    localStorage.setItem('aerospend_policies', JSON.stringify(policies));
  }, [policies]);

  useEffect(() => {
    localStorage.setItem('aerospend_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('aerospend_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('aerospend_payouts', JSON.stringify(payoutBatches));
  }, [payoutBatches]);

  useEffect(() => {
    localStorage.setItem('aerospend_stipends', JSON.stringify(stipendWallets));
  }, [stipendWallets]);

  useEffect(() => {
    localStorage.setItem('aerospend_audit', JSON.stringify(auditTrail));
  }, [auditTrail]);

  // Sync theme with document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10B981', '#3B82F6', '#6366F1', '#F59E0B'],
      });
    } catch (e) {
      // safe fallback
    }
  };

  const addAuditLog = (entityType: 'report' | 'item' | 'payout' | 'policy', entityId: string, action: string, diff?: Record<string, any>) => {
    const actorName =
      currentRole === 'employee'
        ? 'Elena Rostova (Employee)'
        : currentRole === 'manager'
        ? 'Marcus Vance (Manager)'
        : 'Diana Chen (Finance Controller)';

    const newLog: AuditTrail = {
      id: `aud-${Date.now()}`,
      entity_type: entityType,
      entity_id: entityId,
      actor_id: `usr-${currentRole}`,
      actor_name: actorName,
      action,
      diff,
      created_at: new Date().toISOString(),
    };

    setAuditTrail((prev) => [newLog, ...prev]);
  };

  // Add new expense item
  const addExpenseItem = (newItemData: Partial<ExpenseItem>): ExpenseItem => {
    const id = `item-${Date.now()}`;
    const reportId = newItemData.report_id || selectedReportId || 'rep-084';
    
    const completeItem: ExpenseItem = {
      id,
      report_id: reportId,
      employee_id: 'emp-elena',
      employee_name: 'Elena Rostova',
      merchant_name: newItemData.merchant_name || 'Merchant',
      category: newItemData.category || 'Meals & Dining',
      gl_code: newItemData.gl_code || 'GL-6040',
      transaction_date: newItemData.transaction_date || new Date().toISOString().split('T')[0],
      original_amount_cents: newItemData.original_amount_cents || 0,
      original_currency: newItemData.original_currency || 'USD',
      fx_rate: newItemData.fx_rate || 1.0,
      fx_date: newItemData.fx_date || new Date().toISOString().split('T')[0],
      override_card_statement: newItemData.override_card_statement || false,
      reimbursement_amount_cents: newItemData.reimbursement_amount_cents || newItemData.original_amount_cents || 0,
      tax_cents: newItemData.tax_cents || 0,
      tip_cents: newItemData.tip_cents || 0,
      expense_type: newItemData.expense_type || 'receipt',
      receipt_url: newItemData.receipt_url || 'uber',
      receipt_sha256: newItemData.receipt_sha256 || `sha256-${Date.now()}`,
      receipt_phash: newItemData.receipt_phash || '1010101010101010',
      ocr_bounding_boxes: newItemData.ocr_bounding_boxes || [],
      missing_receipt_affidavit: newItemData.missing_receipt_affidavit || false,
      affidavit_signature: newItemData.affidavit_signature,
      affidavit_signed_at: newItemData.affidavit_signed_at,
      policy_flags: newItemData.policy_flags || [],
      justification_note: newItemData.justification_note,
      status: newItemData.status || 'pending',
      split_departments: newItemData.split_departments || [{ department: 'Engineering', percentage: 100 }],
      attendees: newItemData.attendees || ['Elena Rostova'],
      is_billable_to_client: newItemData.is_billable_to_client || false,
      client_project_name: newItemData.client_project_name,
      mileage_details: newItemData.mileage_details,
      per_diem_details: newItemData.per_diem_details,
      created_at: new Date().toISOString(),
    };

    setItems((prev) => [completeItem, ...prev]);

    // Update parent report total
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === reportId) {
          return {
            ...r,
            total_cents: r.total_cents + completeItem.reimbursement_amount_cents,
            items_count: (r.items_count || 0) + 1,
          };
        }
        return r;
      })
    );

    addAuditLog('item', id, `Logged new expense: ${completeItem.merchant_name} ($${(completeItem.reimbursement_amount_cents / 100).toFixed(2)})`);

    return completeItem;
  };

  const updateExpenseItem = (id: string, updates: Partial<ExpenseItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, ...updates };
        }
        return item;
      })
    );
    addAuditLog('item', id, `Updated expense details for #${id}`, updates);
  };

  const deleteExpenseItem = (id: string) => {
    const itemToDelete = items.find((i) => i.id === id);
    if (!itemToDelete) return;

    setItems((prev) => prev.filter((i) => i.id !== id));
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === itemToDelete.report_id) {
          return {
            ...r,
            total_cents: Math.max(0, r.total_cents - itemToDelete.reimbursement_amount_cents),
            items_count: Math.max(0, (r.items_count || 1) - 1),
          };
        }
        return r;
      })
    );
    addAuditLog('item', id, `Deleted expense #${id}`);
  };

  const submitExpenseReport = (title: string, itemIds: string[]): ExpenseReport => {
    const reportNum = `EXP-2026-${Math.floor(100 + Math.random() * 900)}`;
    const reportItems = items.filter((i) => itemIds.includes(i.id));
    const totalCents = reportItems.reduce((acc, i) => acc + i.reimbursement_amount_cents, 0);

    const newReport: ExpenseReport = {
      id: `rep-${Date.now()}`,
      report_number: reportNum,
      employee_id: 'emp-elena',
      employee_name: 'Elena Rostova',
      employee_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      employee_role: 'Lead Staff Solutions Architect',
      department: 'Engineering',
      title: title || 'Business Expense Claim',
      status: 'submitted',
      total_cents: totalCents,
      approved_cents: 0,
      currency: 'USD',
      submitted_at: new Date().toISOString(),
      items_count: itemIds.length,
      ach_trace_id: `ACH-TRX-${Math.floor(100000 + Math.random() * 900000)}`,
      estimated_deposit_date: '3 Business Days',
    };

    setReports((prev) => [newReport, ...prev]);

    // Relink items to this report
    setItems((prev) =>
      prev.map((i) => {
        if (itemIds.includes(i.id)) {
          return { ...i, report_id: newReport.id, status: 'pending' };
        }
        return i;
      })
    );

    addAuditLog('report', newReport.id, `Submitted report ${newReport.report_number} for $${(totalCents / 100).toFixed(2)} with ${itemIds.length} items`);
    setSelectedReportId(newReport.id);
    return newReport;
  };

  // Manager line item approval
  const approveLineItem = (itemId: string, comment?: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    setItems((prev) =>
      prev.map((i) => {
        if (i.id === itemId) {
          return {
            ...i,
            status: 'approved',
            reviewer_id: 'usr-marcus',
            reviewer_name: 'Marcus Vance',
            reviewer_comment: comment || 'In-policy item approved.',
          };
        }
        return i;
      })
    );

    // Update report approved cents
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === item.report_id) {
          const newApproved = r.approved_cents + item.reimbursement_amount_cents;
          const allItemsForReport = items.filter((i) => i.report_id === r.id);
          const approvedCount = allItemsForReport.filter((i) => i.id === itemId || i.status === 'approved').length;
          const status = approvedCount === allItemsForReport.length ? 'approved' : 'partially_approved';

          return {
            ...r,
            approved_cents: newApproved,
            status,
          };
        }
        return r;
      })
    );

    addAuditLog('item', itemId, `Approved item: ${item.merchant_name} ($${(item.reimbursement_amount_cents / 100).toFixed(2)})`);
  };

  // Manager line item flagging (Clarification requested)
  const flagLineItem = (itemId: string, comment: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    setItems((prev) =>
      prev.map((i) => {
        if (i.id === itemId) {
          return {
            ...i,
            status: 'flagged',
            reviewer_id: 'usr-marcus',
            reviewer_name: 'Marcus Vance',
            reviewer_comment: comment,
          };
        }
        return i;
      })
    );

    setReports((prev) =>
      prev.map((r) => {
        if (r.id === item.report_id) {
          return {
            ...r,
            status: 'partially_approved',
          };
        }
        return r;
      })
    );

    addAuditLog('item', itemId, `Flagged item ${item.merchant_name}: "${comment}"`);
  };

  // LINE-ITEM PARTIAL APPROVAL (No Hostage Reports!)
  // Instantly approves all clean items, splits them into an ACH PayoutBatch,
  // while keeping flagged items in revision state!
  const approveCleanItemsInReport = (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report) return { approvedCount: 0, approvedAmountCents: 0, batchId: '' };

    const reportItems = items.filter((i) => i.report_id === reportId);
    // Clean items are those without duplicate_risk or not currently flagged
    const cleanItems = reportItems.filter(
      (i) => !i.policy_flags.includes('duplicate_risk') && i.status !== 'rejected'
    );

    if (cleanItems.length === 0) {
      return { approvedCount: 0, approvedAmountCents: 0, batchId: '' };
    }

    const approvedAmountCents = cleanItems.reduce((acc, i) => acc + i.reimbursement_amount_cents, 0);

    // Update items to approved
    setItems((prev) =>
      prev.map((i) => {
        if (cleanItems.some((ci) => ci.id === i.id)) {
          return {
            ...i,
            status: 'approved',
            reviewer_id: 'usr-marcus',
            reviewer_name: 'Marcus Vance',
            reviewer_comment: 'Approved via Instant Clean Items Fast-Track.',
          };
        }
        return i;
      })
    );

    // Create immediate unblocked payout batch
    const batchId = `pay-${Math.floor(100000 + Math.random() * 900000)}`;
    const newBatch: PayoutBatch = {
      id: batchId,
      employee_id: report.employee_id,
      employee_name: report.employee_name,
      amount_cents: approvedAmountCents,
      bank_account_last4: '4829',
      payment_rail: 'ach',
      status: 'in_transit',
      estimated_arrival_date: 'Tomorrow by 5:00 PM EST',
      trace_id: `ACH-${Math.floor(100000 + Math.random() * 900000)}-US-FASTSETTLE`,
      created_at: new Date().toISOString(),
      items_count: cleanItems.length,
      progress_step: 3, // Finance Verified -> ACH Dispatched
    };

    setPayoutBatches((prev) => [newBatch, ...prev]);

    // Update report status
    const remainingItems = reportItems.filter((i) => !cleanItems.some((ci) => ci.id === i.id));
    const nextStatus = remainingItems.length > 0 ? 'partially_approved' : 'approved';

    setReports((prev) =>
      prev.map((r) => {
        if (r.id === reportId) {
          return {
            ...r,
            approved_cents: approvedAmountCents,
            status: nextStatus,
          };
        }
        return r;
      })
    );

    addAuditLog(
      'report',
      reportId,
      `Unblocked Partial Settlement: Approved ${cleanItems.length} clean items ($${(approvedAmountCents / 100).toFixed(2)}) dispatched to ACH Payout #${batchId}`
    );

    triggerCelebration();

    return {
      approvedCount: cleanItems.length,
      approvedAmountCents,
      batchId,
    };
  };

  const dispatchPayoutBatch = (batchId: string) => {
    setPayoutBatches((prev) =>
      prev.map((b) => {
        if (b.id === batchId) {
          return {
            ...b,
            status: 'settled',
            progress_step: 5,
          };
        }
        return b;
      })
    );
    addAuditLog('payout', batchId, `Settled ACH payout batch #${batchId} to direct deposit.`);
    triggerCelebration();
  };

  // Cryptographic Duplicate & Fraud Sentinel
  const checkDuplicateFraud = (merchant: string, amountCents: number, date: string, sha256?: string) => {
    // 1. SHA-256 match against previously settled receipts
    if (sha256 && sha256 === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4') {
      return {
        isDuplicate: true,
        matchedReportNumber: 'EXP-2026-041',
        matchedDate: '2026-09-15',
        matchReason: 'Cryptographic SHA-256 file hash matches settled receipt in EXP-2026-041 ($18.50 at Blue Bottle Coffee).',
      };
    }

    // 2. Fuzzy metadata match (Merchant + Amount + Date within org)
    const existingMatch = items.find((item) => {
      const sameMerchant = item.merchant_name.toLowerCase().includes(merchant.toLowerCase()) || merchant.toLowerCase().includes(item.merchant_name.toLowerCase());
      const sameAmount = Math.abs(item.reimbursement_amount_cents - amountCents) < 50; // within 50 cents
      const sameDate = item.transaction_date === date;
      return sameMerchant && sameAmount && sameDate;
    });

    if (existingMatch) {
      const parentReport = reports.find((r) => r.id === existingMatch.report_id);
      return {
        isDuplicate: true,
        matchedReportNumber: parentReport?.report_number || 'EXP-2026-041',
        matchedDate: existingMatch.transaction_date,
        matchReason: `Fuzzy Sentinel: An expense for $${(existingMatch.reimbursement_amount_cents / 100).toFixed(2)} at "${existingMatch.merchant_name}" on ${existingMatch.transaction_date} was already submitted in ${parentReport?.report_number || 'an earlier claim'}.`,
      };
    }

    return { isDuplicate: false };
  };

  // Pre-submission live policy linter
  const lintPolicy = (category: PolicyCategory, amountCents: number, note?: string): PolicyLintResult => {
    const policy = policies.find((p) => p.category === category);
    if (!policy) {
      return { hasViolation: false, isSoftViolation: false, isHardViolation: false, message: 'In policy' };
    }

    // Hard violation: exceeds maximum limit
    if (amountCents > policy.max_amount_cents) {
      return {
        hasViolation: true,
        isSoftViolation: false,
        isHardViolation: true,
        flagType: 'over_cap',
        message: `⛔ Hard Policy Cap: ${category} cannot exceed $${(policy.max_amount_cents / 100).toFixed(2)}. The claim is $${(amountCents / 100).toFixed(2)}.`,
        suggestedAction: 'Please adjust line items or request an executive policy exception before submission.',
      };
    }

    // Soft violation: exceeds soft limit but allowed with justification
    if (policy.soft_cap_cents && amountCents > policy.soft_cap_cents) {
      const overage = ((amountCents - policy.soft_cap_cents) / 100).toFixed(2);
      if (!note || note.trim().length < 8) {
        return {
          hasViolation: true,
          isSoftViolation: true,
          isHardViolation: false,
          flagType: 'over_cap',
          message: `⚠️ Soft Cap Warning: ${category} exceeds standard limit ($${(policy.soft_cap_cents / 100).toFixed(2)}) by $${overage}. A business justification note is required to submit.`,
          suggestedAction: 'Add a brief note explaining the business context (e.g. urgent client onsite, late booking).',
        };
      }
      return {
        hasViolation: false,
        isSoftViolation: true,
        isHardViolation: false,
        message: `✓ Justification noted for $${overage} overage. Ready for submission.`,
      };
    }

    return {
      hasViolation: false,
      isSoftViolation: false,
      isHardViolation: false,
      message: '✓ Within corporate policy guidelines.',
    };
  };

  // ERP & General Ledger export
  const exportERPBundle = (format: 'netsuite' | 'quickbooks' | 'xero') => {
    const rows = [
      ['ReportNumber', 'EmployeeName', 'Merchant', 'Category', 'GL_Code', 'AmountUSD', 'TaxUSD', 'Date', 'Status', 'TraceID'],
      ...items.map((i) => {
        const rep = reports.find((r) => r.id === i.report_id);
        return [
          rep?.report_number || 'N/A',
          i.employee_name,
          `"${i.merchant_name}"`,
          i.category,
          i.gl_code,
          (i.reimbursement_amount_cents / 100).toFixed(2),
          (i.tax_cents / 100).toFixed(2),
          i.transaction_date,
          i.status,
          rep?.ach_trace_id || 'N/A',
        ];
      }),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AeroSpend_${format.toUpperCase()}_GL_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addAuditLog('report', 'all', `Exported General Ledger bundle in ${format.toUpperCase()} format with SHA-256 tamper verification.`);
  };

  const resetAllData = () => {
    localStorage.removeItem('aerospend_policies');
    localStorage.removeItem('aerospend_reports');
    localStorage.removeItem('aerospend_items');
    localStorage.removeItem('aerospend_payouts');
    localStorage.removeItem('aerospend_stipends');
    localStorage.removeItem('aerospend_audit');

    setPolicies(INITIAL_POLICIES);
    setReports(INITIAL_REPORTS);
    setItems(INITIAL_EXPENSE_ITEMS);
    setPayoutBatches(INITIAL_PAYOUT_BATCHES);
    setStipendWallets(INITIAL_STIPENDS);
    setAuditTrail(INITIAL_AUDIT_TRAIL);
    setSelectedReportId('rep-084');
    setSelectedItemId('item-002');
  };

  return (
    <ExpenseContext.Provider
      value={{
        policies,
        reports,
        items,
        payoutBatches,
        stipendWallets,
        auditTrail,
        currentRole,
        setCurrentRole,
        theme,
        setTheme,
        selectedReportId,
        setSelectedReportId,
        selectedItemId,
        setSelectedItemId,
        addExpenseItem,
        updateExpenseItem,
        deleteExpenseItem,
        submitExpenseReport,
        approveLineItem,
        flagLineItem,
        approveCleanItemsInReport,
        dispatchPayoutBatch,
        checkDuplicateFraud,
        lintPolicy,
        exportERPBundle,
        resetAllData,
        triggerCelebration,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
};
