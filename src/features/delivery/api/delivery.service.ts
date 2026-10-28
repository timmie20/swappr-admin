import apiClient from '@/lib/api/client';
import {
  AdminConfirmDeliveryResponse,
  DeliveryReview,
  DeliveryReviewsResponse,
  QueryDeliveryReviewsParams,
  ResendDeliveryLinkResponse
} from '../types/delivery.types';

/**
 * Delivery confirmation API — superadmin only (admin gets 403)
 */
export const deliveryApi = {
  /**
   * Delivery review queue, oldest first
   */
  getReviews: async (
    params?: QueryDeliveryReviewsParams
  ): Promise<DeliveryReviewsResponse> => {
    const { data } = await apiClient.get<DeliveryReviewsResponse>(
      '/delivery-confirmation/admin/reviews',
      { params }
    );
    return data;
  },

  /**
   * Confirm delivery on the customer's behalf (cannot be undone)
   */
  confirmForCustomer: async (
    orderId: string,
    reason: string
  ): Promise<AdminConfirmDeliveryResponse> => {
    const { data } = await apiClient.post<AdminConfirmDeliveryResponse>(
      `/delivery-confirmation/admin/orders/${orderId}/confirm`,
      { reason }
    );
    return data;
  },

  /**
   * Close a review WITHOUT confirming; the order stays shipped
   */
  closeReview: async (
    reviewId: string,
    note: string
  ): Promise<{ message: string; review: DeliveryReview }> => {
    const { data } = await apiClient.post<{
      message: string;
      review: DeliveryReview;
    }>(`/delivery-confirmation/admin/reviews/${reviewId}/close`, { note });
    return data;
  },

  /**
   * Email the customer a fresh confirmation link. The link itself is never
   * returned. Max 3 per order per 24h (429 rate_limited).
   */
  resendLink: async (orderId: string): Promise<ResendDeliveryLinkResponse> => {
    const { data } = await apiClient.post<ResendDeliveryLinkResponse>(
      `/delivery-confirmation/orders/${orderId}/resend`
    );
    return data;
  }
};
