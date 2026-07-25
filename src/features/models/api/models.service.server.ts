import { serverFetch } from '@/lib/api/server';
import { ModelsResponse, ModelFilters, Model } from '../types/models.types';

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
    return serverFetch<ModelsResponse>('/models', { params: filters });
  },

  getModelbyId: async (id: string) => {
    return serverFetch<{ model: Model }>(`/models/${id}`);
  }
};
