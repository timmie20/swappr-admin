export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface PayoutVendor {
  id: string;
  user_id: string;
  business_name: string | null;
  trading_name: string | null;
  business_address: string | null;
  state: string | null;
  city: string | null;
  contact_number: string | null;
  rc_number: string | null;
  store_photos: string[] | null;
  logo_url: string | null;
  description: string | null;
  is_verified: boolean;
  rating: string;
  total_trades_completed: number;
  contact_email: string;
  onboarding_step:
    | 'account_created'
    | 'business_verified'
    | 'id_verified'
    | 'profile_completed'
    | 'approved';
  onboarding_completed: boolean;
  bank_name: string | null;
  bank_code: string | null;
  account_number: string | null;
  account_name: string | null;
  paystack_recipient_code: string | null;
  operating_hours: {
    days: string[];
    open_time: string;
    close_time: string;
  } | null;
  landmark: string | null;
  pickup_enabled: boolean;
  is_inspection_verified: boolean;
  inspection_requested_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PayoutPayment {
  id: string;
  payer_id: string;
  type: 'order_payment' | 'swap_topup';
  order_id: string | null;
  swap_request_id: string | null;
  amount: string;
  reference: string;
  paystack_transaction_id: string | null;
  channel: string | null;
  status: 'pending' | 'success' | 'failed';
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PayoutOrderItem {
  id: string;
  order_id: string;
  variant_id: string | null;
  product_id: string;
  product_name: string;
  color: string | null;
  storage: number | null;
  unit_price: string;
  quantity: number;
  subtotal: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PayoutOrderDeliveryAddress {
  phone_number: string;
  street: string;
  city: string;
  state: string;
  postal_code?: string;
}

export interface PayoutOrder {
  id: string;
  buyer_id: string;
  vendor_id: string;
  order_number: string;
  order_type: 'purchase' | 'swap';
  status:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'rejected';
  payment_status: 'unpaid' | 'paid' | 'refunded';
  total_amount: string;
  payout_status: PayoutStatus | null;
  platform_fee: string | null;
  vendor_payout_amount: string | null;
  swap_device_name: string | null;
  swap_device_condition: string | null;
  swap_device_images: string[] | null;
  swap_device_assessed_value: string | null;
  delivery_address: PayoutOrderDeliveryAddress | null;
  contact_phone: string;
  tracking_number: string | null;
  confirmed_at: string | null;
  delivered_at: string | null;
  fulfillment_ready_at: string | null;
  cancellation_reason: string | null;
  expires_at: string | null;
  expiry_job_id: string | null;
  items: PayoutOrderItem[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Payout {
  id: string;
  payment_id: string;
  order_id: string | null;
  order_number: string | null;
  vendor_id: string;
  paystack_recipient_code: string | null;
  gross_amount: string;
  platform_fee: string;
  net_amount: string;
  transfer_reference: string;
  transfer_code: string | null;
  status: PayoutStatus;
  failure_reason: string | null;
  retry_count: number;
  initiated_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  vendor: PayoutVendor;
  payment?: PayoutPayment;
  order?: PayoutOrder | null;
}

export interface PayoutsResponse {
  message: string;
  payouts: Payout[];
  total: number;
  page: number;
  limit: number;
}

export interface PayoutResponse {
  message: string;
  payout: Payout;
}

export interface RetryPayoutResponse {
  message: string;
  payout_id: string;
}

export type PayoutSortBy =
  | 'created_at'
  | 'net_amount'
  | 'status'
  | 'completed_at';

export type SortOrder = 'ASC' | 'DESC';

export interface QueryPayoutsParams {
  status?: PayoutStatus;
  vendor_id?: string;
  search?: string;
  min_amount?: number;
  max_amount?: number;
  created_from?: string;
  created_to?: string;
  sort_by?: PayoutSortBy;
  sort_order?: SortOrder;
  page?: number;
  limit?: number;
}

export const PAYOUT_STATUS_OPTIONS: { label: string; value: PayoutStatus }[] = [
  { label: 'Pending', value: PayoutStatus.PENDING },
  { label: 'Processing', value: PayoutStatus.PROCESSING },
  { label: 'Completed', value: PayoutStatus.COMPLETED },
  { label: 'Failed', value: PayoutStatus.FAILED }
];
