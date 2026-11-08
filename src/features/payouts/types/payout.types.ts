import type { DeliveryConfirmedBy } from '@/features/delivery/types/delivery.types';

// Vendor order payouts are manual: REQUESTED -> APPROVED -> COMPLETED
// ("paid"), or REJECTED. PENDING / PROCESSING / FAILED belong to the retired
// Paystack Transfers flow and only appear on historical rows.
export enum PayoutStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  PENDING = 'pending',
  PROCESSING = 'processing',
  FAILED = 'failed'
}

export const PAYOUT_STATUS_LABEL: Record<PayoutStatus, string> = {
  [PayoutStatus.REQUESTED]: 'Requested',
  [PayoutStatus.APPROVED]: 'Approved · awaiting transfer',
  [PayoutStatus.COMPLETED]: 'Paid',
  [PayoutStatus.REJECTED]: 'Rejected',
  [PayoutStatus.PENDING]: 'Pending (legacy)',
  [PayoutStatus.PROCESSING]: 'Processing (legacy)',
  [PayoutStatus.FAILED]: 'Failed (legacy)'
};

export interface PayoutDestination {
  bank_name: string | null;
  bank_code: string | null;
  account_name: string | null;
  account_number_masked?: string | null;
  /** Full number — superadmin endpoints only */
  account_number?: string | null;
}

/** Amounts are naira */
export interface PayoutView {
  id: string;
  order_id: string | null;
  order_number: string | null;
  status: PayoutStatus;
  gross_amount: number | null;
  platform_fee: number | null;
  net_amount: number | null;
  requested_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  paid_at: string | null;
  bank_transfer_reference: string | null;
  /** Superadmin endpoints only. Receipts are private: never a URL. */
  has_receipt: boolean;
  receipt: PayoutReceipt | null;
  /** Snapshot taken at approval; null until then */
  destination: PayoutDestination | null;
  narration: string;
  created_at: string;
  requested_by: string | null;
  approved_by: string | null;
  rejected_by: string | null;
  paid_by: string | null;
}

export interface PayoutVendorSummary {
  id: string;
  business_name: string | null;
  trading_name: string | null;
  contact_number: string | null;
}

export interface AdminPayoutRow extends PayoutView {
  vendor: PayoutVendorSummary | null;
  /** The ledger's operating account holds less than this payout */
  operating_balance_below_amount: boolean;
}

export interface AdminPayoutsResponse {
  message: string;
  payouts: AdminPayoutRow[];
  operating_account_balance_kobo: number;
  total: number;
  page: number;
  limit: number;
}

export type ConfirmationSignedIn = 'buyer' | 'other_user' | 'not_signed_in';

export interface DeliveryConfirmationEvidence {
  confirmed_at: string | null;
  ip: string | null;
  user_agent: string | null;
  signed_in: ConfirmationSignedIn;
  signed_in_user_id: string | null;
}

export interface PayoutDetail {
  payout: PayoutView;
  vendor: PayoutVendorSummary | null;
  order: {
    id: string;
    order_number: string;
    status: string;
    total_amount: number;
    processing_fee: number | null;
    platform_fee: number | null;
    /** Rate the order was charged (300 = 3%); null for orders paid before it was recorded (those were 3%) */
    platform_fee_rate_bps: number | null;
    vendor_payout_amount: number | null;
    delivered_at: string | null;
    delivery_confirmed_by: DeliveryConfirmedBy | null;
    delivery_confirmed_by_user_id: string | null;
    delivery_confirmation_reason: string | null;
    /** Customer-confirmed orders only. Personal data: this screen only. */
    delivery_confirmation_evidence: DeliveryConfirmationEvidence | null;
  } | null;
  /** The vendor's bank details right now */
  current_destination: PayoutDestination | null;
  destination_changed_since_approval: boolean | null;
  /** All kobo */
  ledger: {
    amount_kobo: number;
    operating_account_balance_kobo: number;
    operating_balance_below_amount: boolean;
    vendor_payable_balance_kobo: number;
    vendor_payable_covers_amount: boolean;
  };
  transfer: {
    narration: string;
    amount_naira: number;
    name_check_note: string | null;
  };
}

export interface QueryAdminPayoutsParams {
  status?: PayoutStatus;
  vendor_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MarkPayoutPaidBody {
  bank_transfer_reference: string;
  /** From POST /payouts/admin/receipts; attached in the same transaction */
  receipt_id?: string;
}

/**
 * The bank's confirmation (screenshot or PDF), stored privately. Only a
 * superadmin can upload or view it; it is fetched as a blob with the auth
 * token — there is no link to it.
 */
export interface PayoutReceipt {
  id: string;
  content_type: string;
  bytes: number;
  original_filename: string | null;
  uploaded_by: string;
  uploaded_at: string;
}

// Checked client-side for a friendlier message; the API decides the type
// from the file's content, so a renamed file is still refused there
export const RECEIPT_FILE = {
  maxBytes: 5 * 1024 * 1024,
  types: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  accept: 'image/jpeg,image/png,image/webp,application/pdf'
} as const;

export const REJECT_REASON = { min: 5, max: 500 } as const;
export const BANK_REFERENCE = {
  min: 4,
  max: 100,
  // Same rule as the API (letters, digits, space and - _ / . :)
  pattern: /^[A-Za-z0-9][A-Za-z0-9 _\-/.:]*$/
} as const;
