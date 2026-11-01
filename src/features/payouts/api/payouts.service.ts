import apiClient from '@/lib/api/client';
import { isAxiosError } from 'axios';
import {
  AdminPayoutsResponse,
  MarkPayoutPaidBody,
  PayoutDetail,
  PayoutReceipt,
  PayoutView,
  QueryAdminPayoutsParams
} from '../types/payout.types';

// With responseType 'blob', error bodies arrive as a Blob too. Parse the
// JSON back so callers can switch on `code` as usual.
async function withJsonErrorBody(error: unknown): Promise<never> {
  if (isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      error.response.data = JSON.parse(await error.response.data.text());
    } catch {
      error.response.data = {};
    }
  }
  throw error;
}

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
  },

  /**
   * Upload a receipt privately. It belongs to no payout until attached.
   */
  uploadReceipt: async (file: File): Promise<PayoutReceipt> => {
    const formData = new FormData();
    formData.append('file', file);
    // Overrides the client's JSON default; axios then drops the header for
    // FormData so the browser sets it with the multipart boundary
    const { data } = await apiClient.post<{
      message: string;
      receipt: PayoutReceipt;
    }>('/payouts/admin/receipts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data.receipt;
  },

  /**
   * Attach a receipt to a payout that is already paid (once; never replaced)
   */
  attachReceipt: async (
    id: string,
    receiptId: string
  ): Promise<PayoutDetail> => {
    const { data } = await apiClient.post<PayoutDetail & { message: string }>(
      `/payouts/admin/${id}/receipt`,
      { receipt_id: receiptId }
    );
    return data;
  },

  /**
   * The receipt file itself. Needs the auth token, so it is fetched as a
   * blob — callers show it from an object URL and must not cache it.
   */
  getReceiptFile: async (id: string): Promise<Blob> => {
    const { data } = await apiClient
      .get<Blob>(`/payouts/admin/${id}/receipt`, { responseType: 'blob' })
      .catch(withJsonErrorBody);
    return data;
  }
};
