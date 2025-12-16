import apiClient from '@/lib/api-client';
import { getClientAuthHeaders } from '@/lib/auth-headers';
import { Model, ModelsResponse } from '../types/models.types';
import { DefaultFilters } from '@/types/services';

export const modelsApi = {
  /**
   * Models Api service
   * All apis relatesd to models
   */

  getAll: async (
    filters: DefaultFilters | undefined,
    getToken: () => Promise<string | null>
  ) => {
    const headers = await getClientAuthHeaders(getToken);
    const { data } = await apiClient.get<ModelsResponse>('/models', {
      headers,
      params: filters
    });
    return data;
  },

  /**
   * Get a single brand by ID
   */
  getById: async (
    id: string,
    getToken: () => Promise<string | null>
  ): Promise<Model> => {
    const headers = await getClientAuthHeaders(getToken);
    const { data } = await apiClient.get<Model>(`/models/${id}`, { headers });
    return data;
  }
};
