import apiClient from '@/lib/api/client';
import type { Page } from '@/features/admin-vendors/types/vendor.types';
import {
  AuditCatalogue,
  AuditEntry,
  QueryAuditParams
} from '../types/audit.types';

/**
 * Audit log API (admin + superadmin; the backend leaves delivery, payout
 * and ledger entries out for a plain admin)
 */
export const auditApi = {
  /**
   * Newest first. Params go through axios so the +01:00 offset in from/to
   * is encoded (a raw "+" would be a 400).
   */
  getAll: async (params: QueryAuditParams): Promise<Page<AuditEntry>> => {
    const { data } = await apiClient.get<Page<AuditEntry>>('/admin/audit', {
      params
    });
    return data;
  },

  /** The categories and events this viewer may see — drives the filters */
  getCatalogue: async (): Promise<AuditCatalogue> => {
    const { data } = await apiClient.get<AuditCatalogue>(
      '/admin/audit/catalogue'
    );
    return data;
  }
};
