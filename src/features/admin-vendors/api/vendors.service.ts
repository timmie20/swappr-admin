import apiClient from '@/lib/api/client';
import {
  AdminVendorOrderRow,
  AdminVendorOverview,
  AdminVendorRequest,
  AdminVendorRow,
  Page,
  QueryAdminVendorsParams,
  VendorOrderQueue,
  VendorTransactionType,
  VendorTransactionsResponse
} from '../types/vendor.types';

export interface PageParams {
  page?: number;
  limit?: number;
}

/**
 * Admin vendor accounts API. /transactions is superadmin only (403 for
 * admin); everything else is admin + superadmin.
 */
export const adminVendorsApi = {
  getAll: async (
    params: QueryAdminVendorsParams
  ): Promise<Page<AdminVendorRow>> => {
    const { data } = await apiClient.get<Page<AdminVendorRow>>(
      '/admin/vendors',
      { params }
    );
    return data;
  },

  getById: async (vendorId: string): Promise<AdminVendorOverview> => {
    const { data } = await apiClient.get<{ data: AdminVendorOverview }>(
      `/admin/vendors/${vendorId}`
    );
    return data.data;
  },

  getOrders: async (
    vendorId: string,
    params: PageParams & { queue?: VendorOrderQueue; search?: string }
  ): Promise<Page<AdminVendorOrderRow>> => {
    const { data } = await apiClient.get<Page<AdminVendorOrderRow>>(
      `/admin/vendors/${vendorId}/orders`,
      { params }
    );
    return data;
  },

  getRequests: async (
    vendorId: string,
    params: PageParams & { state?: 'open' | 'all' }
  ): Promise<Page<AdminVendorRequest>> => {
    const { data } = await apiClient.get<Page<AdminVendorRequest>>(
      `/admin/vendors/${vendorId}/requests`,
      { params }
    );
    return data;
  },

  /** Superadmin only */
  getTransactions: async (
    vendorId: string,
    params: PageParams & {
      type?: VendorTransactionType;
      from?: string;
      to?: string;
    }
  ): Promise<VendorTransactionsResponse> => {
    const { data } = await apiClient.get<VendorTransactionsResponse>(
      `/admin/vendors/${vendorId}/transactions`,
      { params }
    );
    return data;
  },

  /**
   * Mark the Swappr store inspection verified, or revoke it (revoking also
   * turns off pickup and clears the request)
   */
  setInspection: async (
    vendorId: string,
    verified: boolean,
    reason?: string
  ) => {
    const { data } = await apiClient.patch<{
      status: boolean;
      message: string;
    }>(`/admin/vendors/${vendorId}/verify-inspection`, { verified, reason });
    return data;
  }
};
