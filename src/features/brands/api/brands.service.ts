import apiClient from '@/lib/api/client';
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
  getAll: async (filters?: BrandFilters): Promise<BrandsResponse> => {
    const { data } = await apiClient.get<BrandsResponse>('/brands', {
      params: filters
    });
    return data;
  },

  /**
   * Get a single brand by ID
   */
  getById: async (id: string): Promise<Brand> => {
    const { data } = await apiClient.get<Brand>(`/brands/${id}`);
    return data;
  },

  /**
   * Create a new brand
   */
  create: async (payload: CreateBrandDto): Promise<Brand> => {
    const { data } = await apiClient.post<Brand>('/brands', payload);
    return data;
  },

  /**
   * Update an existing brand
   */
  update: async (id: string, payload: CreateBrandDto): Promise<Brand> => {
    const { data } = await apiClient.patch<Brand>(
      `/brands/${id}/update`,
      payload
    );
    return data;
  },

  /**
   * Delete a brand
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/brands/${id}/remove`);
  }
};
