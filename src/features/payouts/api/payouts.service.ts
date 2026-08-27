import apiClient from '@/lib/api/client';
import {
  Payout,
  PayoutsResponse,
  QueryPayoutsParams,
  RetryPayoutResponse
} from '../types/payout.types';

/**
 * Payouts API Service
 * All API calls related to admin payout management
 */
export const payoutsApi = {
  /**
   * Get all payouts (paginated, filterable)
   */
  getAll: async (filters?: QueryPayoutsParams): Promise<PayoutsResponse> => {
    const { data } = await apiClient.get<PayoutsResponse>(
      '/payments/admin/payouts',
      { params: filters }
    );
    return data;
  },

  /**
   * Get a single payout by ID, with vendor/payment/order relations
   */
  getById: async (id: string): Promise<Payout> => {
    const { data } = await apiClient.get<{ message: string; payout: Payout }>(
      `/payments/admin/payouts/${id}`
    );
    return data.payout;
  },

  /**
   * Retry a failed vendor payout
   */
  retry: async (id: string): Promise<RetryPayoutResponse> => {
    const { data } = await apiClient.post<RetryPayoutResponse>(
      `/payments/admin/payouts/${id}/retry`
    );
    return data;
  }
};
