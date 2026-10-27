export type PolicyCategory = 
  | 'Meals & Dining'
  | 'Hotel & Lodging'
  | 'Flights & Transit'
  | 'Home Office & Stipends'
  | 'Client Entertainment'
  | 'SaaS & Subscriptions'
  | 'Mileage & Auto'
  | 'Per Diem Stipend';

export type ReportStatus = 
  | 'draft' 
  | 'submitted' 
  | 'partially_approved' 
  | 'approved' 
  | 'processing_payout' 
  | 'paid' 
  | 'rejected';

export type ItemStatus = 'pending' | 'approved' | 'flagged' | 'rejected';

export type ExpenseType = 'receipt' | 'mileage' | 'per_diem';

export type PaymentRail = 'ach' | 'sepa' | 'wire' | 'payroll';

export type PayoutStatus = 'queued' | 'in_transit' | 'settled' | 'failed';

export interface BoundingBox {
  id: string;
  fieldKey: 'merchant' | 'date' | 'total' | 'tax' | 'tip' | 'lineItem_1' | 'lineItem_2' | 'lineItem_3';
  label: string;
  x: number;      // percentage from left 0-100
  y: number;      // percentage from top 0-100
  width: number;  // percentage width 0-100
  height: number; // percentage height 0-100
  text: string;
  confidence: number; // 0.00 to 1.00
}

export interface ExpensePolicy {
  id: string;
  category: PolicyCategory;
  gl_code: string;
  max_amount_cents: number;           // in integer cents (e.g., 7500 for $75.00)
  receipt_threshold_cents: number;    // default 2500 ($25.00)
  requires_attendees: boolean;
  auto_approve_under_cents: number;   // e.g. 4000 ($40.00)
  soft_cap_cents?: number;            // soft limit requiring justification
  description: string;
  icon: string;
  prohibited_keywords: string[];
}

export interface SplitDepartment {
  department: string;
  percentage: number;
}

export interface MileageDetails {
  origin: string;
  destination: string;
  distance_miles: number;
  round_trip: boolean;
  rate_cents_per_mile: number; // e.g. 67 cents/mile
}

export interface PerDiemDetails {
  destination_city: string;
  days_count: number;
  rate_cents_per_day: number;  // e.g. 8900 cents/day ($89.00)
}

export interface ExpenseItem {
  id: string;
  report_id: string;
  employee_id: string;
  employee_name: string;
  merchant_name: string;
  category: PolicyCategory;
  gl_code: string;
  transaction_date: string; // YYYY-MM-DD
  original_amount_cents: number;
  original_currency: string;
  fx_rate: number;          // e.g. 1.0942
  fx_date: string;
  override_card_statement?: boolean;
  statement_charge_cents?: number;
  reimbursement_amount_cents: number; // calculated in USD cents
  tax_cents: number;
  tip_cents?: number;
  expense_type: ExpenseType;
  receipt_url?: string;
  receipt_sha256?: string;
  receipt_phash?: string;
  ocr_bounding_boxes?: BoundingBox[];
  missing_receipt_affidavit?: boolean;
  affidavit_signature?: string;
  affidavit_signed_at?: string;
  policy_flags: string[]; // e.g. ["over_cap", "weekend_spend", "duplicate_risk", "alcohol_detected"]
  justification_note?: string;
  status: ItemStatus;
  reviewer_id?: string;
  reviewer_name?: string;
  reviewer_comment?: string;
  split_departments?: SplitDepartment[];
  attendees?: string[];
  is_billable_to_client?: boolean;
  client_project_name?: string;
  mileage_details?: MileageDetails;
  per_diem_details?: PerDiemDetails;
  created_at: string;
}

export interface ExpenseReport {
  id: string;
  report_number: string; // e.g. 'EXP-2026-084'
  employee_id: string;
  employee_name: string;
  employee_avatar: string;
  employee_role: string;
  department: string;
  title: string;
  status: ReportStatus;
  total_cents: number;
  approved_cents: number;
  currency: string;
  submitted_at: string;
  paid_at?: string;
  ach_trace_id?: string;
  estimated_deposit_date?: string;
  items_count?: number;
}

export interface PayoutBatch {
  id: string;
  employee_id: string;
  employee_name: string;
  amount_cents: number;
  bank_account_last4: string;
  payment_rail: PaymentRail;
  status: PayoutStatus;
  estimated_arrival_date: string;
  trace_id: string;
  created_at: string;
  items_count: number;
  progress_step: number; // 1 to 5 (Submitted -> Approved -> Finance Verified -> ACH Dispatched -> Deposited)
}

export interface AuditTrail {
  id: string;
  entity_type: 'report' | 'item' | 'payout' | 'policy';
  entity_id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  diff?: Record<string, any>;
  created_at: string;
}

export interface StipendWallet {
  id: string;
  name: string;
  icon: string;
  total_budget_cents: number;
  used_cents: number;
  period: 'annual' | 'monthly';
  reset_date: string;
  color: string;
}

export type UserRole = 'employee' | 'manager' | 'finance';
