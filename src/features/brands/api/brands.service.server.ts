import apiClient from '@/lib/api-client';
import { getAuthHeaders } from '@/lib/auth-headers.server';
import { Brand, BrandFilters, BrandsResponse } from '../types/brand.types';

export const brandApiServer = {
  /**
   * Models Api service for server fetching
   * All apis related to models
   */

  /**
   * Get all models with optional filters
   * @param filters - Optional pagination and search filters
   * @returns Promise<ModelsResponse>
   */
  getAll: async (filters?: BrandFilters): Promise<BrandsResponse> => {
    const auth = await getAuthHeaders();

    const { data } = await apiClient.get<BrandsResponse>('/brands', {
      headers: auth,
      params: filters
    });
    return data;
  },
  getBrandbyId: async (id: string) => {
    const auth = await getAuthHeaders();
    const { data } = await apiClient.get<Brand>(`/brands/${id}`, {
      headers: auth
    });
    return data;
  }
};
