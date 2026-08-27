import { serverFetch } from '@/lib/api/server';
import {
  Payout,
  PayoutsResponse,
  QueryPayoutsParams
} from '../types/payout.types';

export const payoutsApiServer = {
  /**
   * Get all payouts (paginated, filterable)
   */
  getAll: async (filters?: QueryPayoutsParams): Promise<PayoutsResponse> => {
    return serverFetch<PayoutsResponse>('/payments/admin/payouts', {
      params: filters
    });
  },

  /**
   * Get a single payout by ID, with vendor/payment/order relations
   */
  getById: async (id: string): Promise<Payout> => {
    const data = await serverFetch<{ message: string; payout: Payout }>(
      `/payments/admin/payouts/${id}`
    );
    return data.payout;
  }
};
