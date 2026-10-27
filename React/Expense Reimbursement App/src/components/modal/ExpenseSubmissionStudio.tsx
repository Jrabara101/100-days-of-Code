import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Car,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  FileText,
  DollarSign,
  Briefcase,
  UploadCloud,
  FileCheck,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import type { PolicyCategory, ExpenseType, BoundingBox } from '../../types';
import { HISTORICAL_FX_RATES, SAMPLE_BOUNDING_BOXES } from '../../data/mockData';
import { ReceiptCanvas } from '../ocr/ReceiptCanvas';

interface ExpenseSubmissionStudioProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: ExpenseType;
}

export const ExpenseSubmissionStudio: React.FC<ExpenseSubmissionStudioProps> = ({
  isOpen,
  onClose,
  defaultMode = 'receipt',
}) => {
  const {
    policies,
    addExpenseItem,
    checkDuplicateFraud,
    lintPolicy,
    triggerCelebration,
  } = useExpense();

  const [expenseMode, setExpenseMode] = useState<ExpenseType>(defaultMode);
  const [selectedSampleKey, setSelectedSampleKey] = useState<string>('lufthansa');
  const [focusedFieldKey, setFocusedFieldKey] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Form states
  const [merchantName, setMerchantName] = useState<string>('Lufthansa Airlines');
  const [category, setCategory] = useState<PolicyCategory>('Flights & Transit');
  const [transactionDate, setTransactionDate] = useState<string>('2026-10-18');
  const [originalAmount, setOriginalAmount] = useState<string>('412.80');
  const [originalCurrency, setOriginalCurrency] = useState<string>('EUR');
  const [overrideCardStatement, setOverrideCardStatement] = useState<boolean>(false);
  const [statementCharge, setStatementCharge] = useState<string>('455.00');
  const [justificationNote, setJustificationNote] = useState<string>(
    'Booked economy basic for urgent client architecture workshop in Berlin.'
  );

  // Mileage states
  const [mileageOrigin, setMileageOrigin] = useState<string>('San Francisco HQ');
  const [mileageDestination, setMileageDestination] = useState<string>('San Jose Client Site');
  const [mileageDistance, setMileageDistance] = useState<number>(48);
  const [mileageRoundTrip, setMileageRoundTrip] = useState<boolean>(true);

  // Per Diem states
  const [perDiemCity, setPerDiemCity] = useState<string>('New York City ($89/day)');
  const [perDiemRate, setPerDiemRate] = useState<number>(8900); // 89.00
  const [perDiemDays, setPerDiemDays] = useState<number>(3);

  // Splits & Attendees
  const [isBillable, setIsBillable] = useState<boolean>(true);
  const [clientProject, setClientProject] = useState<string>('Gotham Cloud Migration');
  const [attendees, setAttendees] = useState<string>('Elena Rostova, Sarah Chen');
  const [splitDept, setSplitDept] = useState<string>('100% Engineering');

  // Affidavit states
  const [isAffidavitSigned, setIsAffidavitSigned] = useState<boolean>(false);
  const [showAffidavitModal, setShowAffidavitModal] = useState<boolean>(false);
  const [affidavitSigner, setAffidavitSigner] = useState<string>('Elena Rostova');

  // Trigger laser scan simulation on receipt selection change
  useEffect(() => {
    setIsScanning(true);
    const timer = setTimeout(() => setIsScanning(false), 900);
    return () => clearTimeout(timer);
  }, [selectedSampleKey]);

  if (!isOpen) return null;

  // Calculate currency and FX
  const fxInfo = HISTORICAL_FX_RATES[originalCurrency] || { rate: 1.0, symbol: '$' };
  const originalCents = Math.round(parseFloat(originalAmount || '0') * 100);

  let reimbursementCents = 0;
  if (expenseMode === 'receipt') {
    if (overrideCardStatement && statementCharge) {
      reimbursementCents = Math.round(parseFloat(statementCharge) * 100);
    } else {
      reimbursementCents = Math.round(originalCents * fxInfo.rate);
    }
  } else if (expenseMode === 'mileage') {
    const totalMiles = mileageRoundTrip ? mileageDistance * 2 : mileageDistance;
    reimbursementCents = Math.round(totalMiles * 67); // 67 cents/mile IRS standard
  } else if (expenseMode === 'per_diem') {
    reimbursementCents = perDiemRate * perDiemDays;
  }

  // Pre-submission policy linting
  const lintResult = lintPolicy(category, reimbursementCents, justificationNote);

  // Cryptographic Duplicate & Fraud check
  const duplicateResult = checkDuplicateFraud(
    merchantName,
    reimbursementCents,
    transactionDate,
    selectedSampleKey === 'blueBottle' ? 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4' : undefined
  );

  // Switch sample receipt presets
  const handleSelectSample = (key: string) => {
    setSelectedSampleKey(key);
    if (key === 'lufthansa') {
      setMerchantName('Lufthansa Airlines');
      setCategory('Flights & Transit');
      setTransactionDate('2026-10-18');
      setOriginalAmount('412.80');
      setOriginalCurrency('EUR');
      setJustificationNote('Transatlantic flight booked economy basic for Berlin architecture summit.');
    } else if (key === 'standardHotel') {
      setMerchantName('The Standard, High Line NYC');
      setCategory('Hotel & Lodging');
      setTransactionDate('2026-10-19');
      setOriginalAmount('890.00');
      setOriginalCurrency('USD');
      setJustificationNote('Booked within 48h of client request. Nearby hotels booked out.');
    } else if (key === 'blueBottle') {
      setMerchantName('Blue Bottle Coffee #42');
      setCategory('Meals & Dining');
      setTransactionDate('2026-10-20');
      setOriginalAmount('18.50');
      setOriginalCurrency('USD');
      setJustificationNote('Breakfast coffee with client tech lead.');
    } else if (key === 'uber') {
      setMerchantName('Uber Technologies');
      setCategory('Flights & Transit');
      setTransactionDate('2026-10-20');
      setOriginalAmount('42.10');
      setOriginalCurrency('USD');
      setJustificationNote('Transit from airport to summit venue.');
    }
  };

  const handleSelectBoundingBox = (box: BoundingBox) => {
    setFocusedFieldKey(box.fieldKey);
    if (box.fieldKey === 'merchant') setMerchantName(box.text);
    if (box.fieldKey === 'date') setTransactionDate(box.text.slice(0, 10));
    if (box.fieldKey === 'total') {
      const numeric = box.text.replace(/[^0-9.]/g, '');
      if (numeric) setOriginalAmount(numeric);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (lintResult.isHardViolation) {
      alert(`Submission Blocked: ${lintResult.message}`);
      return;
    }

    if (lintResult.isSoftViolation && (!justificationNote || justificationNote.length < 8)) {
      alert(`Justification Note Required: ${lintResult.message}`);
      return;
    }

    const flags: string[] = [];
    if (lintResult.isSoftViolation) flags.push('over_cap');
    if (duplicateResult.isDuplicate) flags.push('duplicate_risk');

    const policy = policies.find((p) => p.category === category);
    const glCode = policy?.gl_code || 'GL-6040';

    addExpenseItem({
      merchant_name: merchantName,
      category,
      gl_code: glCode,
      transaction_date: transactionDate,
      original_amount_cents: originalCents,
      original_currency: originalCurrency,
      fx_rate: fxInfo.rate,
      fx_date: transactionDate,
      override_card_statement: overrideCardStatement,
      reimbursement_amount_cents: reimbursementCents,
      tax_cents: Math.round(reimbursementCents * 0.08875),
      expense_type: expenseMode,
      receipt_url: selectedSampleKey,
      ocr_bounding_boxes: SAMPLE_BOUNDING_BOXES[selectedSampleKey] || [],
      policy_flags: flags,
      justification_note: justificationNote,
      status: 'pending',
      split_departments: [{ department: 'Engineering', percentage: 100 }],
      attendees: attendees.split(',').map((a) => a.trim()),
      is_billable_to_client: isBillable,
      client_project_name: clientProject,
      missing_receipt_affidavit: isAffidavitSigned,
      affidavit_signature: isAffidavitSigned ? affidavitSigner : undefined,
      affidavit_signed_at: isAffidavitSigned ? new Date().toISOString() : undefined,
    });

    triggerCelebration();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-[#171A20] text-[#F8FAFC] border border-[#232730] rounded-2xl max-w-6xl w-full my-auto overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Top Studio Header */}
        <div className="p-4 px-6 border-b border-[#232730] flex items-center justify-between bg-[#121418]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Expense Submission Studio
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1C2027] text-gray-300 border border-[#2E3440]">
                  AI Vision v3.8 Active
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                OCR receipt extraction, instant FX mid-market conversion & policy guardrails
              </p>
            </div>
          </div>

          {/* Mode Switcher Segmented Control */}
          <div className="flex items-center gap-1 bg-[#171A20] p-1 rounded-xl border border-[#232730]">
            <button
              type="button"
              onClick={() => setExpenseMode('receipt')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                expenseMode === 'receipt'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Receipt Expense</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setExpenseMode('mileage');
                setCategory('Mileage & Auto');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                expenseMode === 'mileage'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Mileage Route</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setExpenseMode('per_diem');
                setCategory('Per Diem Stipend');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                expenseMode === 'per_diem'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Daily Per Diem</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#232730] text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Body - Split Pane Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Pane: Interactive Receipt Canvas (48% width / col-span-6 or 5) */}
          <div className="lg:col-span-6 bg-[#121418] border-r border-[#232730] flex flex-col p-4 overflow-hidden relative">
            {/* Quick Sample Selector Bar */}
            <div className="flex items-center justify-between mb-3 bg-[#171A20] p-2 rounded-xl border border-[#232730]">
              <span className="text-[11px] text-gray-400 font-medium">Quick Test Receipts:</span>
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => handleSelectSample('lufthansa')}
                  className={`px-2 py-1 rounded text-[11px] transition ${
                    selectedSampleKey === 'lufthansa'
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#232730] text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  ✈️ Lufthansa (EUR)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectSample('standardHotel')}
                  className={`px-2 py-1 rounded text-[11px] transition ${
                    selectedSampleKey === 'standardHotel'
                      ? 'bg-amber-600 text-white'
                      : 'bg-[#232730] text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  🏨 Hotel ($890)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectSample('blueBottle')}
                  className={`px-2 py-1 rounded text-[11px] transition ${
                    selectedSampleKey === 'blueBottle'
                      ? 'bg-red-600 text-white'
                      : 'bg-[#232730] text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  ☕ Duplicate Coffee
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectSample('uber')}
                  className={`px-2 py-1 rounded text-[11px] transition ${
                    selectedSampleKey === 'uber'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#232730] text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  🚗 Uber ($42)
                </button>
              </div>
            </div>

            {/* Interactive Canvas */}
            <div className="flex-1 min-h-[380px] overflow-hidden">
              <ReceiptCanvas
                receiptKey={selectedSampleKey}
                boundingBoxes={SAMPLE_BOUNDING_BOXES[selectedSampleKey] || []}
                focusedFieldKey={focusedFieldKey}
                onSelectBoundingBox={handleSelectBoundingBox}
                isScanning={isScanning}
              />
            </div>

            {/* Drop / Missing Receipt Bar */}
            <div className="mt-3 flex items-center justify-between text-xs text-gray-400 bg-[#171A20] p-2.5 rounded-xl border border-[#232730]">
              <span className="flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-emerald-400" />
                <span>Drag another receipt here to re-scan</span>
              </span>

              <button
                type="button"
                onClick={() => setShowAffidavitModal(true)}
                className="text-emerald-400 hover:text-emerald-300 text-[11px] font-medium flex items-center gap-1 underline underline-offset-2"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Lost physical receipt? (Sign Affidavit)</span>
              </button>
            </div>
          </div>

          {/* Right Pane: Auto-Populated Smart Form & Live Linter (52% width / col-span-6) */}
          <div className="lg:col-span-6 bg-[#171A20] flex flex-col p-6 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* AI Extraction Banner */}
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>Auto-extracted 4 fields from image with 99.2% confidence</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">Bi-directional active</span>
              </div>

              {/* Mode-Specific Forms */}
              {expenseMode === 'receipt' && (
                <>
                  {/* Merchant & Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Merchant Name
                      </label>
                      <input
                        type="text"
                        value={merchantName}
                        onChange={(e) => setMerchantName(e.target.value)}
                        onFocus={() => setFocusedFieldKey('merchant')}
                        onBlur={() => setFocusedFieldKey(null)}
                        className="w-full px-3 py-2 rounded-lg bg-[#121418] border border-[#2E3440] text-sm text-white focus:border-emerald-500 focus:outline-none transition"
                        placeholder="e.g. Lufthansa Airlines"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Transaction Date
                      </label>
                      <input
                        type="date"
                        value={transactionDate}
                        onChange={(e) => setTransactionDate(e.target.value)}
                        onFocus={() => setFocusedFieldKey('date')}
                        onBlur={() => setFocusedFieldKey(null)}
                        className="w-full px-3 py-2 rounded-lg bg-[#121418] border border-[#2E3440] text-sm text-white focus:border-emerald-500 focus:outline-none transition font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* Category Selector */}
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Policy Category & GL Code
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as PolicyCategory)}
                      className="w-full px-3 py-2 rounded-lg bg-[#121418] border border-[#2E3440] text-sm text-white focus:border-emerald-500 focus:outline-none transition"
                    >
                      {policies.map((p) => (
                        <option key={p.id} value={p.category}>
                          {p.category} • {p.gl_code} (Cap: ${(p.max_amount_cents / 100).toFixed(0)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Multi-Currency FX Engine Block */}
                  <div className="p-3.5 rounded-xl bg-[#121418] border border-[#2E3440] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                        Multi-Currency FX Engine
                      </span>
                      <span className="text-[10px] text-blue-400 font-mono">
                        Historical Rate ({transactionDate})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-gray-400 mb-1">
                          Original Receipt Amount
                        </label>
                        <div className="flex">
                          <input
                            type="number"
                            step="0.01"
                            value={originalAmount}
                            onChange={(e) => setOriginalAmount(e.target.value)}
                            onFocus={() => setFocusedFieldKey('total')}
                            onBlur={() => setFocusedFieldKey(null)}
                            className="w-full px-3 py-1.5 rounded-l-lg bg-[#171A20] border border-[#2E3440] text-sm text-white focus:border-emerald-500 focus:outline-none font-mono"
                            placeholder="0.00"
                            required
                          />
                          <select
                            value={originalCurrency}
                            onChange={(e) => setOriginalCurrency(e.target.value)}
                            className="px-2.5 py-1.5 rounded-r-lg bg-[#232730] border-y border-r border-[#2E3440] text-xs font-mono text-white focus:outline-none"
                          >
                            {Object.keys(HISTORICAL_FX_RATES).map((cur) => (
                              <option key={cur} value={cur}>
                                {cur}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-gray-400 mb-1">
                          Calculated Reimbursement (USD)
                        </label>
                        <div className="px-3 py-1.5 rounded-lg bg-[#171A20] border border-[#2E3440] text-sm text-emerald-400 font-mono font-bold flex items-center justify-between">
                          <span>${(reimbursementCents / 100).toFixed(2)}</span>
                          <span className="text-[10px] text-gray-500 font-normal">
                            @ {fxInfo.rate.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Exact Card Charge Override Toggle */}
                    {originalCurrency !== 'USD' && (
                      <div className="pt-2 border-t border-[#232730] text-xs">
                        <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                          <input
                            type="checkbox"
                            checked={overrideCardStatement}
                            onChange={(e) => setOverrideCardStatement(e.target.checked)}
                            className="rounded border-[#2E3440] text-emerald-500 focus:ring-0 bg-[#121418]"
                          />
                          <span>Match exact foreign transaction charge on my bank statement</span>
                        </label>

                        {overrideCardStatement && (
                          <div className="mt-2 pl-6">
                            <input
                              type="number"
                              step="0.01"
                              value={statementCharge}
                              onChange={(e) => setStatementCharge(e.target.value)}
                              placeholder="Exact USD charge on statement"
                              className="px-3 py-1.5 rounded-lg bg-[#171A20] border border-emerald-500/50 text-xs text-white font-mono"
                            />
                            <p className="text-[10px] text-emerald-400 mt-1">
                              Guarantees 0% employee loss on bank conversion spreads.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Mode: Mileage Calculator */}
              {expenseMode === 'mileage' && (
                <div className="p-4 rounded-xl bg-[#121418] border border-[#2E3440] space-y-3">
                  <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-emerald-400" />
                    IRS Standard Mileage Rate Calculator (67.0¢/mi)
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-gray-400">Origin Address</label>
                      <input
                        type="text"
                        value={mileageOrigin}
                        onChange={(e) => setMileageOrigin(e.target.value)}
                        className="w-full px-3 py-1.5 rounded bg-[#171A20] border border-[#2E3440] text-white mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400">Destination Address</label>
                      <input
                        type="text"
                        value={mileageDestination}
                        onChange={(e) => setMileageDestination(e.target.value)}
                        className="w-full px-3 py-1.5 rounded bg-[#171A20] border border-[#2E3440] text-white mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <div className="flex items-center gap-3">
                      <label className="text-gray-400">One-Way Miles:</label>
                      <input
                        type="number"
                        value={mileageDistance}
                        onChange={(e) => setMileageDistance(Number(e.target.value))}
                        className="w-20 px-2 py-1 rounded bg-[#171A20] border border-[#2E3440] text-white font-mono"
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                      <input
                        type="checkbox"
                        checked={mileageRoundTrip}
                        onChange={(e) => setMileageRoundTrip(e.target.checked)}
                        className="rounded text-emerald-500 bg-[#171A20]"
                      />
                      <span>Round Trip (x2)</span>
                    </label>
                  </div>

                  <div className="p-3 bg-[#171A20] rounded-lg flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      Calculated Total ({mileageRoundTrip ? mileageDistance * 2 : mileageDistance}{' '}
                      miles @ $0.67):
                    </span>
                    <span className="font-mono text-emerald-400 font-bold text-sm">
                      ${(reimbursementCents / 100).toFixed(2)} USD
                    </span>
                  </div>
                </div>
              )}

              {/* Mode: Per Diem Calculator */}
              {expenseMode === 'per_diem' && (
                <div className="p-4 rounded-xl bg-[#121418] border border-[#2E3440] space-y-3">
                  <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    Automated Travel Per Diem (Zero Receipts Required)
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-gray-400">Travel Destination</label>
                      <select
                        value={perDiemCity}
                        onChange={(e) => {
                          setPerDiemCity(e.target.value);
                          if (e.target.value.includes('New York')) setPerDiemRate(8900);
                          if (e.target.value.includes('London')) setPerDiemRate(11500);
                          if (e.target.value.includes('San Francisco')) setPerDiemRate(9400);
                          if (e.target.value.includes('Berlin')) setPerDiemRate(7800);
                        }}
                        className="w-full px-3 py-2 rounded bg-[#171A20] border border-[#2E3440] text-white mt-1"
                      >
                        <option>New York City ($89/day)</option>
                        <option>San Francisco ($94/day)</option>
                        <option>London ($115/day)</option>
                        <option>Berlin ($78/day)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-gray-400">Number of Days</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={perDiemDays}
                        onChange={(e) => setPerDiemDays(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded bg-[#171A20] border border-[#2E3440] text-white mt-1 font-mono"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-[#171A20] rounded-lg flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      Total Stipend ({perDiemDays} days @ ${(perDiemRate / 100).toFixed(2)}/day):
                    </span>
                    <span className="font-mono text-emerald-400 font-bold text-sm">
                      ${(reimbursementCents / 100).toFixed(2)} USD
                    </span>
                  </div>
                </div>
              )}

              {/* Cost Split & Client Billback */}
              <div className="p-3 rounded-xl bg-[#121418] border border-[#2E3440] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-300 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                    Cost Split & Client Allocation
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-emerald-400">
                    <input
                      type="checkbox"
                      checked={isBillable}
                      onChange={(e) => setIsBillable(e.target.checked)}
                      className="rounded text-emerald-500 bg-[#171A20]"
                    />
                    <span>Billable to Client</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-gray-400">Client / Project</label>
                    <input
                      type="text"
                      value={clientProject}
                      onChange={(e) => setClientProject(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-[#171A20] border border-[#2E3440] text-white text-xs mt-0.5"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400">Attendees / Co-Workers</label>
                    <input
                      type="text"
                      value={attendees}
                      onChange={(e) => setAttendees(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-[#171A20] border border-[#2E3440] text-white text-xs mt-0.5"
                    />
                  </div>
                </div>
              </div>

              {/* Cryptographic Duplicate Sentinel Warning */}
              {duplicateResult.isDuplicate && (
                <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-xs space-y-1">
                  <div className="flex items-center gap-2 text-red-400 font-bold">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Cryptographic Duplicate Warning (Fraud Sentinel)</span>
                  </div>
                  <p className="text-red-300">{duplicateResult.matchReason}</p>
                </div>
              )}

              {/* Live Policy Linter Callout */}
              {lintResult.hasViolation && (
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                    lintResult.isHardViolation
                      ? 'bg-red-500/15 border-red-500/40 text-red-300'
                      : 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{lintResult.message}</span>
                  </div>

                  {lintResult.isSoftViolation && (
                    <div>
                      <label className="block text-[11px] text-amber-300 font-medium mb-1">
                        Required Business Justification Note:
                      </label>
                      <textarea
                        rows={2}
                        value={justificationNote}
                        onChange={(e) => setJustificationNote(e.target.value)}
                        placeholder="Add a 1-line note explaining the business need..."
                        className="w-full px-3 py-1.5 rounded-lg bg-[#121418] border border-amber-500/50 text-white text-xs focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Submission Footer Actions */}
              <div className="pt-3 border-t border-[#232730] flex items-center justify-between">
                <div className="text-xs font-mono text-gray-400">
                  Total Claim:{' '}
                  <span className="text-base font-bold text-white tabular-nums">
                    ${(reimbursementCents / 100).toFixed(2)} USD
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg bg-[#121418] hover:bg-[#232730] border border-[#2E3440] text-gray-300 text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-900/40 flex items-center gap-1.5"
                  >
                    <span>Submit for ${(reimbursementCents / 100).toFixed(2)} Reimbursement</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Lost Receipt Affidavit Modal */}
      {showAffidavitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#171A20] text-white border border-[#232730] rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              Missing Receipt Declaration Affidavit
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed mb-4">
              I certify under penalty of policy perjury that this legitimate business expense was
              incurred for corporate duties, the original physical receipt was lost or unobtainable,
              and no other reimbursement claim has been or will be submitted for this expense.
            </p>

            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-1">Digital Signature</label>
              <input
                type="text"
                value={affidavitSigner}
                onChange={(e) => setAffidavitSigner(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#121418] border border-[#2E3440] text-sm text-white font-mono"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAffidavitModal(false)}
                className="px-3 py-1.5 rounded-lg bg-[#121418] text-xs text-gray-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAffidavitSigned(true);
                  setShowAffidavitModal(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
              >
                Sign & Attach Affidavit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
