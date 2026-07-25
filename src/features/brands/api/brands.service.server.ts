import { serverFetch } from '@/lib/api/server';
import { Brand, BrandFilters, BrandsResponse } from '../types/brand.types';

export const brandApiServer = {
  /**
   * Get all brands with optional filters
   */
  getAll: async (filters?: BrandFilters): Promise<BrandsResponse> => {
    return serverFetch<BrandsResponse>('/brands', { params: filters });
  },

  getBrandbyId: async (id: string): Promise<Brand> => {
    return serverFetch<Brand>(`/brands/${id}`);
  }
};
