import apiClient from '@/lib/api/client';
import {
  AdminPayoutsResponse,
  MarkPayoutPaidBody,
  PayoutDetail,
  PayoutView,
  QueryAdminPayoutsParams
} from '../types/payout.types';

/**
 * Payouts API Service — superadmin only (admin gets 403)
 *
 * Flow: vendor requests -> superadmin approves (bank details snapshotted) ->
 * superadmin sends the bank transfer OUTSIDE Swappr -> records the bank
 * reference here -> paid. The amount is never sent from the app.
 */
export const payoutsApi = {
  /**
   * Payout queue (`requested` oldest first; `approved` = awaiting transfer)
   */
  getAll: async (
    params?: QueryAdminPayoutsParams
  ): Promise<AdminPayoutsResponse> => {
    const { data } = await apiClient.get<AdminPayoutsResponse>(
      '/payouts/admin',
      { params }
    );
    return data;
  },

  /**
   * Everything needed to decide on one payout
   */
  getById: async (id: string): Promise<PayoutDetail> => {
    const { data } = await apiClient.get<PayoutDetail & { message: string }>(
      `/payouts/admin/${id}`
    );
    return data;
  },

  /**
   * Approve a requested payout (snapshots the bank details; moves no money)
   */
  approve: async (id: string): Promise<PayoutDetail> => {
    const { data } = await apiClient.post<PayoutDetail & { message: string }>(
      `/payouts/admin/${id}/approve`
    );
    return data;
  },

  /**
   * Reject a payout — the reason is shown to the vendor
   */
  reject: async (id: string, reason: string): Promise<PayoutView> => {
    const { data } = await apiClient.post<{
      message: string;
      payout: PayoutView;
    }>(`/payouts/admin/${id}/reject`, { reason });
    return data.payout;
  },

  /**
   * Record the bank transfer and mark the payout paid (posts to the ledger)
   */
  markPaid: async (
    id: string,
    body: MarkPayoutPaidBody
  ): Promise<PayoutDetail> => {
    const { data } = await apiClient.post<PayoutDetail & { message: string }>(
      `/payouts/admin/${id}/mark-paid`,
      body
    );
    return data;
  }
};
