export type OrderChannel = 'dtc_web' | 'shopify' | 'amazon' | 'b2b_wholesale' | 'pos';

export type OrderStatus =
  | 'grace_hold'
  | 'on_hold_exception'
  | 'ready_to_fulfill'
  | 'partially_fulfilled'
  | 'fulfilled'
  | 'delivered'
  | 'cancelled';

export type ExceptionCode =
  | 'none'
  | 'invalid_address'
  | 'fraud_review'
  | 'stock_shortage'
  | 'carrier_stalled';

export type AddressValidationStatus = 'verified' | 'warning_suggested' | 'invalid';

export interface ShippingAddress {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface AddressDiff {
  original: ShippingAddress;
  suggested: ShippingAddress;
  confidenceScore: number;
  correctionReasons: string[];
}

export interface OrderLineItem {
  id: string;
  order_id: string;
  product_variant_id: string;
  sku: string;
  title: string;
  variant_title: string;
  thumbnail_url: string;
  bin_location: string;
  quantity_ordered: number;
  quantity_allocated: number;
  quantity_fulfilled: number;
  quantity_returned: number;
  unit_price_cents: number;
  unit_cogs_cents: number;
  weight_grams: number;
  allocated_warehouse_id: string;
  scanned_qty?: number;
}

export type FulfillmentStatus =
  | 'queued_for_wave'
  | 'picking'
  | 'packed'
  | 'label_purchased'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'exception_stalled';

export type CarrierType = 'usps' | 'ups' | 'fedex' | 'dhl';

export interface FulfillmentParcel {
  id: string;
  fulfillment_number: string;
  order_id: string;
  warehouse_id: string;
  warehouse_name: string;
  status: FulfillmentStatus;
  carrier: CarrierType;
  service_level: string;
  tracking_number?: string;
  label_url?: string;
  label_cost_cents: number;
  recommended_box_code: string;
  last_carrier_scan_text?: string;
  last_carrier_scan_at?: string;
  estimated_delivery_date: string;
  shipped_at?: string;
  delivered_at?: string;
  item_ids: string[];
  is_backordered?: boolean;
  backorder_restock_date?: string;
  transit_stalled_hours?: number;
}

export interface CustomerLtvProfile {
  id: string;
  email: string;
  name: string;
  total_orders: number;
  total_spent_cents: number;
  return_rate_pct: number;
  fraud_risk_score: number; // 0 - 100 (lower is safer)
  vip_tier: 'bronze' | 'silver' | 'gold' | 'platinum' | null;
  first_order_date: string;
}

export interface Order {
  id: string;
  order_number: string;
  channel: OrderChannel;
  customer_id: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  is_vip: boolean;
  order_status: OrderStatus;
  exception_code: ExceptionCode;
  exception_details?: string;
  currency: string;
  
  // Integer-cents financials
  subtotal_cents: number;
  discount_cents: number;
  shipping_charged_cents: number;
  tax_cents: number;
  total_paid_cents: number;
  cogs_total_cents: number;
  gateway_fee_cents: number;
  shipping_cost_actual_cents: number;
  pick_pack_fee_cents: number;
  net_margin_cents: number;

  shipping_address: ShippingAddress;
  address_validation_status: AddressValidationStatus;
  address_suggestion?: AddressDiff;

  sla_ship_by_at: string; // ISO date string
  grace_period_ends_at?: string; // ISO date string for 15-min grace window
  created_at: string;
  
  routing_logic_explanation: string;
  allocated_warehouse_id: string;
  
  line_items: OrderLineItem[];
  fulfillments: FulfillmentParcel[];
  customer_profile: CustomerLtvProfile;
}

export interface InventoryLevel {
  variant_id: string;
  sku: string;
  title: string;
  variant_title: string;
  thumbnail_url: string;
  bin_location: string;
  warehouse_id: string;
  warehouse_name: string;
  on_hand_qty: number;
  reserved_qty: number;
  quarantined_qty: number;
  available_qty: number; // on_hand - reserved - quarantined
  channel_reservations: {
    dtc_web: number;
    b2b_wholesale: number;
    marketplace: number;
    pos: number;
  };
  safety_stock_threshold: number;
}

export type RmaResolutionType = 'exchange' | 'store_credit' | 'refund' | 'keep_item_credit';
export type RmaReasonCode = 'sizing_small' | 'sizing_large' | 'damaged_in_transit' | 'defective' | 'changed_mind';
export type ConditionGrade = 'uninspected' | 'grade_a_restock' | 'grade_b_open_box' | 'grade_c_quarantine';
export type RmaStatus = 'requested' | 'in_transit' | 'received_graded' | 'completed';

export interface ReturnAuthorization {
  id: string;
  rma_number: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  line_item: OrderLineItem;
  resolution_type: RmaResolutionType;
  reason_code: RmaReasonCode;
  condition_grade: ConditionGrade;
  return_label_cost_cents: number;
  item_cogs_cents: number;
  refund_amount_cents: number;
  status: RmaStatus;
  customer_photo_url?: string;
  customer_comment?: string;
  economizer_savings_cents?: number;
  created_at: string;
  inspected_at?: string;
  dock_operator?: string;
}

export type AuditActorType = 'system_router' | 'operator' | 'carrier_webhook' | 'customer';

export interface OrderAuditEvent {
  id: string;
  order_id: string;
  actor_type: AuditActorType;
  actor_name: string;
  event_type: string;
  summary: string;
  metadata_diff?: Record<string, any>;
  created_at: string;
}

export interface WarehouseNode {
  id: string;
  code: string;
  name: string;
  location: string;
  zip_code: string;
  active_sla_pct: number;
  pending_wave_count: number;
}

export interface CarrierRateOption {
  carrier: CarrierType;
  service_level: string;
  transit_days: number;
  estimated_delivery_date: string;
  rate_cents: number;
  is_optimal_margin: boolean;
  savings_vs_default_cents?: number;
  warning_text?: string;
}

export interface PackagingBoxSpec {
  code: string;
  name: string;
  dimensions_in: string; // e.g. "12 × 9 × 4 in"
  max_weight_lbs: number;
  tare_weight_oz: number;
  cost_cents: number;
  volume_cubic_in: number;
}

