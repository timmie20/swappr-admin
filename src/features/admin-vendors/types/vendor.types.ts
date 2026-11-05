// GET /admin/vendors/* — contract: swappr-backend
// plan/admin-accounts/FE_ADMIN_HANDOFF_vendors_customers.md (§E).
// Money fields end in _kobo (whole kobo). The API never sends raw KYC
// results or full account numbers.

import type { OrderStatus } from '@/features/orders/types/order.types';
import type { PayoutStatus } from '@/features/payouts/types/payout.types';

export interface Page<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export type OnboardingStep =
  | 'account_created'
  | 'business_verified'
  | 'id_verified'
  | 'profile_completed' // between profile and KYC
  | 'approved';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

/**
 * Worked out by the backend from stored facts (there is no tier column):
 * 0 = not active (missing email/KYC/profile, or suspended);
 * 1 = ID-verified, up to 10 listings; 2 = also CAC-verified, no limit.
 */
export type VendorTier = 0 | 1 | 2;
export type VendorBadge =
  | 'id_verified'
  | 'verified_business'
  | 'swappr_inspected';
export type IdFailureReason = 'mismatch' | 'not_found' | 'provider_error';
/** prembly = the automatic check; admin_override = set by an admin */
export type VerifiedVia = 'prembly' | 'admin_override';

export interface AdminVendorRow {
  id: string;
  /** null until CAC verification */
  business_name: string | null;
  /** Display name: prefer it, fall back to business_name */
  trading_name: string | null;
  logo_url: string | null;
  contact_email: string;
  contact_number: string | null;
  state: string | null;
  city: string | null;
  onboarding_step: OnboardingStep;
  is_verified: boolean;
  is_inspection_verified: boolean;
  inspection_requested_at: string | null;
  pickup_enabled: boolean;
  rating: number;
  created_at: string;
  tier: VendorTier;
  badges: VendorBadge[];
  suspended_at: string | null;
  owner: {
    user_id: string;
    name: string | null;
    email: string;
    is_active: boolean;
  };
  activity: {
    active_listings: number;
    needs_action_orders: number;
    completed_orders: number;
    open_delivery_reviews: number;
    open_payout_requests: number;
  };
}

export type VendorStage = 'in_progress' | 'approved';
export type InspectionFilter = 'requested' | 'verified' | 'none';
export type VendorSort =
  | 'created_at'
  | 'business_name'
  | 'rating'
  | 'inspection_requested_at';
export type SortOrder = 'ASC' | 'DESC';

export interface QueryAdminVendorsParams {
  search?: string;
  stage?: VendorStage;
  onboarding_step?: OnboardingStep;
  inspection?: InspectionFilter;
  is_verified?: boolean;
  state?: string;
  tier?: VendorTier;
  suspended?: boolean;
  sort_by?: VendorSort;
  sort_order?: SortOrder;
  page?: number;
  limit?: number;
}

export interface AdminVendorFinance {
  paid_orders: number;
  /** Goods price of paid orders */
  lifetime_sales_kobo: number;
  /** Swappr's 3% */
  platform_fees_kobo: number;
  /** Sales − fees */
  vendor_earnings_kobo: number;
  /** Completed payouts (net) */
  paid_out_kobo: number;
  /** Requested + approved payouts (net) */
  pending_payouts_kobo: number;
  /** What the ledger says Swappr owes this vendor now (authoritative) */
  ledger_balance_owed_kobo: number;
}

export type VerificationStatus = 'pending' | 'verified' | 'rejected';
/**
 * awaiting_confirmation: Prembly matched, and the vendor hasn't confirmed or
 * declined the business yet. They stay Tier 1 until they confirm.
 */
export type CacStatus = VerificationStatus | 'awaiting_confirmation';

export const CAC_STATUS_LABEL: Record<CacStatus, string> = {
  pending: 'Pending',
  verified: 'Verified',
  rejected: 'Rejected',
  awaiting_confirmation: 'Awaiting vendor confirmation'
};

export interface AdminVendorOverview {
  vendor: {
    id: string;
    business_name: string | null;
    trading_name: string | null;
    description: string | null;
    logo_url: string | null;
    store_photos: string[];
    rc_number: string | null;
    contact_email: string;
    contact_number: string | null;
    business_address: string | null;
    city: string | null;
    state: string | null;
    landmark: string | null;
    operating_hours: {
      days: string[];
      open_time: string;
      close_time: string;
    } | null;
    rating: number;
    total_trades_completed: number;
    onboarding_step: OnboardingStep;
    onboarding_completed: boolean;
    is_verified: boolean;
    is_inspection_verified: boolean;
    inspection_requested_at: string | null;
    pickup_enabled: boolean;
    created_at: string;
    tier: VendorTier;
    badges: VendorBadge[];
    suspended_at: string | null;
    suspension_reason: string | null;
  };
  owner: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    email_verified: boolean;
    is_active: boolean;
    last_sign_in_at: string | null;
    created_at: string;
  };
  /** Statuses only. null = no verification record yet */
  verification: {
    cac_status: CacStatus;
    cac_verified_at: string | null;
    cac_rejection_reason: string | null;
    id_type: 'NIN' | 'BVN' | null;
    id_status: VerificationStatus;
    id_verified_at: string | null;
    id_rejection_reason: string | null;
    id_failure_reason: IdFailureReason | null;
    id_verified_via: VerifiedVia | null;
    cac_verified_via: VerifiedVia | null;
    /** CAC lookups used */
    cac_attempts: number | null;
    /** The retry limit (server config, 2 by default) */
    cac_max_attempts: number;
    verification_score: number;
  } | null;
  /** Masked. null = no bank account added */
  bank_account: {
    bank_name: string | null;
    account_name: string | null;
    account_number_last4: string;
  } | null;
  activity: {
    listings: {
      active: number;
      out_of_stock: number;
      unpublished: number;
      total: number;
    };
    orders: {
      total: number;
      awaiting_payment: number;
      needs_action: number;
      awaiting_delivery_confirmation: number;
      completed: number;
      cancelled: number;
      last_order_at: string | null;
    };
    payouts: {
      requested: number;
      approved: number;
      paid: number;
      rejected: number;
    };
    requests: {
      open_delivery_reviews: number;
      open_payout_requests: number;
      inspection_pending: boolean;
      total_open: number;
    };
  };
  /** null for a plain admin */
  finance: AdminVendorFinance | null;
}

export type VendorOrderQueue =
  | 'all'
  | 'awaiting_payment'
  | 'needs_action'
  | 'awaiting_delivery_confirmation'
  | 'completed'
  | 'cancelled';

export interface AdminVendorOrderRow {
  id: string;
  order_number: string;
  order_type: 'purchase' | 'swap';
  status: OrderStatus;
  payment_status: PaymentStatus;
  payout_status: PayoutStatus | null;
  customer: { name: string | null; email: string | null };
  items_count: number;
  /** Goods price */
  total_amount_kobo: number;
  /** What the buyer paid on top */
  processing_fee_kobo: number | null;
  created_at: string;
  paid_at: string | null;
  /** Shipped / ready for handover */
  fulfillment_ready_at: string | null;
  delivered_at: string | null;
  delivery_confirmed_by: 'customer' | 'admin' | null;
  has_open_delivery_review: boolean;
}

export type VendorRequestType = 'delivery_review' | 'payout' | 'inspection';

export interface AdminVendorRequest {
  type: VendorRequestType;
  /** Review id, payout id, or the vendor id for 'inspection' */
  id: string;
  status: string;
  is_open: boolean;
  requested_at: string;
  resolved_at: string | null;
  order_id: string | null;
  order_number: string | null;
  /** Payouts only, superadmin only */
  amount_kobo: number | null;
  /** Review resolution note, or payout rejection reason */
  note: string | null;
}

export type VendorTransactionType = 'sale' | 'payout';

export interface AdminVendorTransaction {
  type: VendorTransactionType;
  /** Order id for a sale, payout id for a payout */
  id: string;
  order_number: string | null;
  occurred_at: string;
  status: string;
  /** Sale adds to what the vendor is owed; payout takes from it */
  direction: 'credit' | 'debit';
  gross_kobo: number;
  platform_fee_kobo: number;
  net_kobo: number;
  /** Sale: Paystack PAY-… reference */
  payment_reference: string | null;
  /** Paid payout: the bank's reference */
  bank_transfer_reference: string | null;
}

export interface VendorTransactionsResponse
  extends Page<AdminVendorTransaction> {
  summary: AdminVendorFinance;
}

export const ONBOARDING_STEP_LABEL: Record<OnboardingStep, string> = {
  account_created: 'Account created',
  business_verified: 'Business verified',
  id_verified: 'ID verified',
  profile_completed: 'Profile completed',
  approved: 'Approved'
};

/** trading_name ?? business_name ?? contact_email */
export const vendorDisplayName = (v: {
  trading_name: string | null;
  business_name: string | null;
  contact_email: string;
}) => v.trading_name || v.business_name || v.contact_email;

export const TIER_LABEL: Record<VendorTier, string> = {
  0: 'Tier 0 · inactive',
  1: 'Tier 1',
  2: 'Tier 2'
};

export const TIER_HELP: Record<VendorTier, string> = {
  0: 'Not active: missing email verification, KYC or profile, or suspended',
  1: 'ID-verified · up to 10 listings',
  2: 'ID and business (CAC) verified · no listing limit'
};

export const BADGE_LABEL: Record<VendorBadge, string> = {
  id_verified: 'ID verified',
  verified_business: 'Verified business',
  swappr_inspected: 'Swappr inspected'
};

export const ID_FAILURE_LABEL: Record<IdFailureReason, string> = {
  mismatch: 'Details didn’t match',
  not_found: 'Not found',
  provider_error: 'Provider error'
};

// The status history now lives in the audit log: see
// features/admin-audit/types/audit.types.ts

// ── Admin actions ─────────────────────────────────────────────────────
// Every action needs a reason (non-empty, max 500) and is audited

export const ACTION_REASON_MAX = 500;
export type CompanyType = 'RC' | 'BN' | 'IT';
export type IdType = 'BVN' | 'NIN';

export type VendorAction =
  | { kind: 'verify_email' }
  | { kind: 'verify_id'; id_type: IdType }
  | {
      kind: 'verify_cac';
      rc_number: string;
      company_type: CompanyType;
      business_name?: string;
    }
  | { kind: 'reset_cac_attempts' }
  | { kind: 'revoke_business' }
  | { kind: 'suspend' }
  | { kind: 'unsuspend' };

export type VendorActionKind = VendorAction['kind'];
