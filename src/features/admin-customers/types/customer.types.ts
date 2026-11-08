// GET /admin/customers/* — contract: swappr-backend
// plan/admin-accounts/FE_ADMIN_HANDOFF_vendors_customers.md (§E.6–E.7).

import type { OrderStatus } from '@/features/orders/types/order.types';
import type {
  Page,
  PaymentStatus,
  SortOrder
} from '@/features/admin-vendors/types/vendor.types';

export type { Page };

export interface AdminCustomerRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  auth_provider: 'local' | 'google';
  email_verified: boolean;
  is_active: boolean;
  can_swap: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  /** Paid orders */
  orders_count: number;
  /** Every successful payment, incl. processing fee and swap top-ups */
  total_paid_kobo: number;
  /** Last paid order */
  last_order_at: string | null;
}

export type CustomerSort =
  | 'created_at'
  | 'last_sign_in_at'
  | 'orders_count'
  | 'total_paid_kobo';

export interface QueryAdminCustomersParams {
  search?: string;
  is_active?: boolean;
  email_verified?: boolean;
  has_orders?: boolean;
  signed_up_from?: string;
  signed_up_to?: string;
  sort_by?: CustomerSort;
  sort_order?: SortOrder;
  page?: number;
  limit?: number;
}

export interface AdminCustomerOverview {
  customer: Omit<
    AdminCustomerRow,
    'orders_count' | 'total_paid_kobo' | 'last_order_at'
  >;
  /** From their latest order (accounts have no phone); null if none */
  contact: { phone: string; city: string | null; state: string | null } | null;
  bank_account: {
    bank_name: string | null;
    account_name: string | null;
    account_number_last4: string;
  } | null;
  orders: {
    paid: number;
    awaiting_payment: number;
    /** Paid, confirmed/processing */
    in_progress: number;
    /** Paid, shipped — the customer needs to click their link */
    awaiting_delivery_confirmation: number;
    delivered: number;
    cancelled_after_payment: number;
    /** Unpaid checkouts that expired/cancelled */
    abandoned_checkouts: number;
    swap_orders: number;
    last_order_at: string | null;
  };
  spending: { total_paid_kobo: number; average_order_value_kobo: number };
  swap_requests: { total: number; open: number };
  /** Latest 5, any payment status */
  recent_orders: {
    id: string;
    order_number: string;
    order_type: 'purchase' | 'swap';
    vendor_name: string | null;
    status: OrderStatus;
    payment_status: PaymentStatus;
    total_amount_kobo: number;
    created_at: string;
    paid_at: string | null;
  }[];
}

export const customerName = (c: { first_name: string; last_name: string }) =>
  [c.first_name, c.last_name].filter(Boolean).join(' ') || '—';
