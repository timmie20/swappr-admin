export enum DeliveryReviewStatus {
  OPEN = 'open',
  CONFIRMED = 'confirmed', // a superadmin confirmed delivery
  CLOSED = 'closed' // closed without confirming; the order stays shipped
}

export type DeliveryConfirmedBy = 'customer' | 'admin';

export interface DeliveryReviewFulfillment {
  fulfillment_type: 'pickup' | 'delivery';
  rider_name: string | null;
  rider_phone: string | null;
  /** Calendar date, YYYY-MM-DD */
  estimated_arrival: string | null;
  pickup_location: string | null;
  pickup_date: string | null;
}

export interface DeliveryReview {
  id: string;
  order_id: string;
  vendor_id: string;
  status: DeliveryReviewStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  created_at: string;
  updated_at: string;
  order: {
    id: string;
    order_number: string;
    status: string;
    contact_phone: string | null;
    tracking_number: string | null;
    fulfillment_ready_at: string | null;
    total_amount: string | number;
    fulfillment: DeliveryReviewFulfillment | null;
  } | null;
  vendor: {
    id: string;
    business_name: string | null;
    trading_name: string | null;
    contact_number: string | null;
    contact_email: string | null;
  } | null;
  customer: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
  hours_since_shipped: number | null;
}

export interface DeliveryReviewsResponse {
  message: string;
  reviews: DeliveryReview[];
  total: number;
  page: number;
  limit: number;
}

export interface QueryDeliveryReviewsParams {
  status?: DeliveryReviewStatus;
  page?: number;
  limit?: number;
}

export interface AdminConfirmDeliveryResponse {
  message: string;
  order_number: string;
  confirmed_at: string;
}

export interface ResendDeliveryLinkResponse {
  message: string;
  expires_at: string;
}

// Shared by the review actions and the order detail actions
export const CONFIRM_DELIVERY_REASON = { min: 10, max: 500 } as const;
export const CLOSE_REVIEW_NOTE = { min: 10, max: 500 } as const;
