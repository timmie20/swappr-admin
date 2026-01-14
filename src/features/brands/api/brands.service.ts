import apiClient from '@/lib/api-client';
import { getClientAuthHeaders } from '@/lib/auth-headers';
import {
  Brand,
  BrandFilters,
  BrandsResponse,
  CreateBrandDto
} from '../types/brand.types';

/**
 * Brands API Service
 * All API calls related to brands
 */
export const brandsApi = {
  /**
   * Get all brands with optional filters
   */
  getAll: async (
    filters: BrandFilters | undefined,
    getToken: () => Promise<string | null>
  ): Promise<BrandsResponse> => {
    const headers = await getClientAuthHeaders(getToken);
    const { data } = await apiClient.get<BrandsResponse>('/brands', {
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
  ): Promise<Brand> => {
    const headers = await getClientAuthHeaders(getToken);
    const { data } = await apiClient.get<Brand>(`/brands/${id}`, { headers });
    return data;
  },

  /**
   * Create a new brand
   */
  create: async (
    payload: CreateBrandDto,
    getToken: () => Promise<string | null>
  ): Promise<Brand> => {
    const headers = await getClientAuthHeaders(getToken);
    const { data } = await apiClient.post<Brand>('/brands', payload, {
      headers
    });
    return data;
  },

  /**
   * Update an existing brand
   */
  update: async (
    id: string,
    payload: CreateBrandDto,
    getToken: () => Promise<string | null>
  ): Promise<Brand> => {
    const headers = await getClientAuthHeaders(getToken);
    const { data } = await apiClient.patch<Brand>(
      `/brands/${id}/update`,
      payload,
      {
        headers
      }
    );
    return data;
  },

  /**
   * Delete a brand
   */
  delete: async (
    id: string,
    getToken: () => Promise<string | null>
  ): Promise<void> => {
    const headers = await getClientAuthHeaders(getToken);
    await apiClient.delete(`/brands/${id}/remove`, { headers });
  }
};
