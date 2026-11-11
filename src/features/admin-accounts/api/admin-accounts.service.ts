import apiClient from '@/lib/api/client';
import { AdminAccount } from '../types/admin-account.types';

export const adminAccountsApi = {
  list: async (): Promise<AdminAccount[]> => {
    const { data } = await apiClient.get<{ data: AdminAccount[] }>('/admins');
    return data.data;
  },

  /** Turns off their two-step sign-in and signs them out everywhere */
  resetMfa: async (
    userId: string,
    reason: string
  ): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ message: string }>(
      `/admins/${userId}/mfa/reset`,
      { reason }
    );
    return data;
  }
};
