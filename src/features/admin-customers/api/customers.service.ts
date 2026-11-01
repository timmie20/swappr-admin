import apiClient from '@/lib/api/client';
import {
  AdminCustomerOverview,
  AdminCustomerRow,
  Page,
  QueryAdminCustomersParams
} from '../types/customer.types';

/**
 * Admin customer accounts API (admin + superadmin)
 */
export const adminCustomersApi = {
  getAll: async (
    params: QueryAdminCustomersParams
  ): Promise<Page<AdminCustomerRow>> => {
    const { data } = await apiClient.get<Page<AdminCustomerRow>>(
      '/admin/customers',
      { params }
    );
    return data;
  },

  getById: async (customerId: string): Promise<AdminCustomerOverview> => {
    const { data } = await apiClient.get<{ data: AdminCustomerOverview }>(
      `/admin/customers/${customerId}`
    );
    return data.data;
  }
};
