import apiClient from '@/lib/api/client';
import {
  AdminOrderListItem,
  AdminOrdersResponse,
  OrderBuyer,
  OrderDetail,
  OrderVendor,
  QueryAdminOrdersParams
} from '../types/order.types';

// The order detail endpoint gives admins the vendor's full record, bank and
// Paystack details included (the list is trimmed server-side). Copy out only
// the fields these screens use, so nothing else is rendered, logged or held
// in the query cache. Bank details belong on the payout detail screen.
type Raw = Record<string, any>;

const str = (value: unknown): string | null =>
  typeof value === 'string' && value ? value : null;
const num = (value: unknown): number | null =>
  value === null || value === undefined || value === '' ? null : Number(value);

function pickBuyer(raw: Raw | null | undefined): OrderBuyer | null {
  if (!raw) return null;
  return {
    id: raw.id,
    first_name: str(raw.first_name),
    last_name: str(raw.last_name),
    email: str(raw.email)
  };
}

function pickVendor(raw: Raw | null | undefined): OrderVendor | null {
  if (!raw) return null;
  return {
    id: raw.id,
    business_name: str(raw.business_name),
    trading_name: str(raw.trading_name),
    contact_number: str(raw.contact_number),
    contact_email: str(raw.contact_email)
  };
}

function pickListItem(raw: Raw): AdminOrderListItem {
  return {
    id: raw.id,
    order_number: raw.order_number,
    order_type: raw.order_type,
    status: raw.status,
    payment_status: raw.payment_status,
    payout_status: str(raw.payout_status),
    total_amount: Number(raw.total_amount),
    contact_phone: str(raw.contact_phone),
    created_at: raw.created_at,
    buyer: pickBuyer(raw.buyer),
    vendor: pickVendor(raw.vendor)
  };
}

function pickDetail(raw: Raw): OrderDetail {
  const f = raw.fulfillment as Raw | null | undefined;
  const address = raw.delivery_address as Raw | null | undefined;

  return {
    ...pickListItem(raw),
    processing_fee: num(raw.processing_fee),
    platform_fee: num(raw.platform_fee),
    vendor_payout_amount: num(raw.vendor_payout_amount),
    tracking_number: str(raw.tracking_number),
    confirmed_at: str(raw.confirmed_at),
    fulfillment_ready_at: str(raw.fulfillment_ready_at),
    delivered_at: str(raw.delivered_at),
    delivery_confirmed_by: raw.delivery_confirmed_by ?? null,
    delivery_confirmation_reason: str(raw.delivery_confirmation_reason),
    cancellation_reason: str(raw.cancellation_reason),
    delivery_address: address
      ? {
          phone_number: str(address.phone_number),
          street: str(address.street),
          city: str(address.city),
          state: str(address.state),
          postal_code: str(address.postal_code)
        }
      : null,
    items: ((raw.items ?? []) as Raw[]).map((item) => ({
      id: item.id,
      product_name: item.product_name,
      color: str(item.color),
      storage: num(item.storage),
      unit_price: Number(item.unit_price),
      quantity: Number(item.quantity),
      subtotal: Number(item.subtotal)
    })),
    fulfillment: f
      ? {
          fulfillment_type: f.fulfillment_type,
          rider_name: str(f.rider_name),
          rider_phone: str(f.rider_phone),
          delivery_fee: num(f.delivery_fee),
          estimated_arrival: str(f.estimated_arrival),
          tracking_number: str(f.tracking_number),
          pickup_location: str(f.pickup_location),
          pickup_date: str(f.pickup_date),
          pickup_time_from: str(f.pickup_time_from),
          pickup_time_to: str(f.pickup_time_to)
        }
      : null,
    delivery_reviews: ((raw.delivery_reviews ?? []) as Raw[]).map((r) => ({
      id: r.id,
      status: r.status,
      created_at: r.created_at,
      resolved_at: str(r.resolved_at),
      resolution_note: str(r.resolution_note)
    })),
    payment_reference: str(raw.payment_reference)
  };
}

/**
 * Orders API Service (admin and superadmin)
 */
export const ordersApi = {
  /**
   * Get all orders (paginated, filterable by status/type/vendor/buyer)
   */
  getAll: async (
    params?: QueryAdminOrdersParams
  ): Promise<AdminOrdersResponse> => {
    const { data } = await apiClient.get<Raw>('/orders/admin', { params });
    return {
      orders: ((data.orders ?? []) as Raw[]).map(pickListItem),
      total: data.total ?? 0,
      page: data.page ?? 1,
      limit: data.limit ?? params?.limit ?? 20
    };
  },

  /**
   * Get one order by its order number (ORD-…)
   */
  getByOrderNumber: async (orderNumber: string): Promise<OrderDetail> => {
    const { data } = await apiClient.get<{ data: Raw }>(
      `/orders/${encodeURIComponent(orderNumber)}`
    );
    return pickDetail(data.data);
  }
};
