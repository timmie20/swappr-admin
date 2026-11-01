// GET /admin/overview/* — contract: swappr-backend
// plan/admin-overview/FE_ADMIN_HANDOFF_admin_overview.md (§E).
// Money fields end in _kobo and are whole kobo. "Today" is the Lagos day.

export interface Overview<T> {
  data: T;
  /** When the figures were computed (ISO 8601 UTC) */
  as_of: string;
}

export interface UsersOverview {
  total_customers: number;
  new_signups_today: { customers: number; vendors: number };
  signup_trend: { today: number; same_time_yesterday: number };
}

export interface VendorsOverview {
  onboarding_in_progress: number;
  /** Requested a Swappr store inspection that isn't verified yet */
  pending_approval: number;
  approved: number;
  inspection_verified: number;
}

export interface MarketplaceOverview {
  orders_today: number;
  live_listings: number;
  awaiting_delivery_confirmation: number;
  open_delivery_reviews: number;
}

/** Superadmin only */
export interface FinanceOverview {
  gmv_today_kobo: number;
  platform_fees_today_kobo: number;
  vendor_payables_kobo: number;
  /** Can be negative */
  paystack_balance_kobo: number;
}

/** Superadmin only */
export interface PayoutsOverview {
  /** requested_count + approved_count */
  pending_count: number;
  requested_count: number;
  approved_count: number;
  processed_today: number;
  paid_today_kobo: number;
}

/** gmv is superadmin only */
export type SeriesMetric = 'orders' | 'gmv' | 'signups';
export type SeriesRange = '7d' | '30d' | '90d';

export interface SeriesPoint {
  /** YYYY-MM-DD, Lagos */
  date: string;
  /** orders: count · gmv: kobo · signups: customers + vendors */
  value: number;
}

export interface SignupsPoint extends SeriesPoint {
  customers: number;
  vendors: number;
}

/** Always these five, in this order, zero-filled */
export type PaidOrderStatus =
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderStatusSlice {
  status: PaidOrderStatus;
  count: number;
}

export interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string | null;
  /** Trading name, else business name */
  vendor_name: string | null;
  /** Goods price; excludes the buyer's processing fee */
  total_amount_kobo: number;
  status:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'rejected';
  paid_at: string;
}

export const SERIES_RANGES: SeriesRange[] = ['7d', '30d', '90d'];
export const DEFAULT_SERIES_RANGE: SeriesRange = '30d';
