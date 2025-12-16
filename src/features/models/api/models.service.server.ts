import apiClient from '@/lib/api-client';
import { getAuthHeaders } from '@/lib/auth-headers.server';
import { ModelsResponse, ModelFilters } from '../types/models.types';

export const modelsApiServer = {
  /**
   * Models Api service for server fetching
   * All apis related to models
   */

  /**
   * Get all models with optional filters
   * @param filters - Optional pagination and search filters
   * @returns Promise<ModelsResponse>
   */
  getAll: async (filters?: ModelFilters): Promise<ModelsResponse> => {
    const auth = await getAuthHeaders();

    const { data } = await apiClient.get<ModelsResponse>('/models', {
      headers: auth,
      params: filters
    });

    return data;
  }
};
