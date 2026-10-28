import type {
  DeliveryConfirmedBy,
  DeliveryReviewStatus
} from '@/features/delivery/types/delivery.types';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected'
}

export type OrderType = 'purchase' | 'swap';
export type OrderPaymentStatus = 'unpaid' | 'paid' | 'refunded';

// The ONLY buyer/vendor fields the app keeps — the API layer copies them out
// and drops the rest (the detail endpoint carries the vendor's bank details)
// before anything reaches the query cache.
export interface OrderBuyer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export interface OrderVendor {
  id: string;
  business_name: string | null;
  trading_name: string | null;
  contact_number: string | null;
  contact_email: string | null;
}

export interface OrderItem {
  id: string;
  product_name: string;
  color: string | null;
  storage: number | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderFulfillment {
  fulfillment_type: 'pickup' | 'delivery';
  rider_name: string | null;
  rider_phone: string | null;
  delivery_fee: number | null;
  /** Calendar date, YYYY-MM-DD (or null) */
  estimated_arrival: string | null;
  tracking_number: string | null;
  pickup_location: string | null;
  /** Calendar date, YYYY-MM-DD */
  pickup_date: string | null;
  pickup_time_from: string | null;
  pickup_time_to: string | null;
}

export interface OrderDeliveryAddress {
  phone_number: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
}

export interface OrderDeliveryReview {
  id: string;
  status: DeliveryReviewStatus;
  created_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
}

export interface AdminOrderListItem {
  id: string;
  order_number: string;
  order_type: OrderType;
  status: OrderStatus;
  payment_status: OrderPaymentStatus;
  payout_status: string | null;
  total_amount: number;
  contact_phone: string | null;
  created_at: string;
  buyer: OrderBuyer | null;
  vendor: OrderVendor | null;
}

export interface OrderDetail extends AdminOrderListItem {
  processing_fee: number | null;
  platform_fee: number | null;
  vendor_payout_amount: number | null;
  tracking_number: string | null;
  confirmed_at: string | null;
  fulfillment_ready_at: string | null;
  delivered_at: string | null;
  delivery_confirmed_by: DeliveryConfirmedBy | null;
  delivery_confirmation_reason: string | null;
  cancellation_reason: string | null;
  delivery_address: OrderDeliveryAddress | null;
  items: OrderItem[];
  fulfillment: OrderFulfillment | null;
  delivery_reviews: OrderDeliveryReview[];
  /** The successful payment's PAY-… Paystack reference; null until paid */
  payment_reference: string | null;
}

export interface AdminOrdersResponse {
  orders: AdminOrderListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface QueryAdminOrdersParams {
  status?: OrderStatus;
  order_type?: OrderType;
  vendor_id?: string;
  buyer_id?: string;
  /** Order number, buyer name or buyer email (case-insensitive substring) */
  search?: string;
  /** Naira, on total_amount */
  min_amount?: number;
  max_amount?: number;
  created_from?: string;
  created_to?: string;
  sort_by?: 'created_at' | 'total_amount' | 'status' | 'order_number';
  sort_order?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export const ORDER_STATUS_OPTIONS: { label: string; value: OrderStatus }[] = [
  { label: 'Pending', value: OrderStatus.PENDING },
  { label: 'Confirmed', value: OrderStatus.CONFIRMED },
  { label: 'Processing', value: OrderStatus.PROCESSING },
  { label: 'Shipped', value: OrderStatus.SHIPPED },
  { label: 'Delivered', value: OrderStatus.DELIVERED },
  { label: 'Cancelled', value: OrderStatus.CANCELLED },
  { label: 'Rejected', value: OrderStatus.REJECTED }
];
