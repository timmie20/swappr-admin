import apiClient from '@/lib/api/client';
import type { AuditEntry } from '@/features/admin-audit/types/audit.types';
import {
  AdminVendorOrderRow,
  AdminVendorOverview,
  AdminVendorRequest,
  AdminVendorRow,
  Page,
  QueryAdminVendorsParams,
  VendorAction,
  VendorOrderQueue,
  VendorTransactionType,
  VendorTransactionsResponse
} from '../types/vendor.types';

// Where each audited admin action is posted
const ACTION_PATH: Record<VendorAction['kind'], string> = {
  verify_email: 'verification/email',
  verify_id: 'verification/id',
  verify_cac: 'verification/cac',
  reset_cac_attempts: 'verification/cac/reset-attempts',
  revoke_business: 'revoke-business',
  suspend: 'suspend',
  unsuspend: 'unsuspend'
};

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
  },

  /**
   * Run an audited standing action (email/ID/CAC override, CAC attempts
   * reset, revoke business, suspend, unsuspend). Every one needs a reason.
   */
  runAction: async (vendorId: string, action: VendorAction, reason: string) => {
    const { kind, ...fields } = action;
    const { data } = await apiClient.post<{
      status: boolean;
      message: string;
    }>(`/admin/vendors/${vendorId}/${ACTION_PATH[kind]}`, {
      ...fields,
      reason
    });
    return data;
  },

  /**
   * This vendor's slice of the audit log, newest first (a superadmin also
   * gets its payout and delivery entries)
   */
  getHistory: async (
    vendorId: string,
    params: PageParams
  ): Promise<Page<AuditEntry>> => {
    const { data } = await apiClient.get<Page<AuditEntry>>(
      `/admin/vendors/${vendorId}/history`,
      { params }
    );
    return data;
  }
};
