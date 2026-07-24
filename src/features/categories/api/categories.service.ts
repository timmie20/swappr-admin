import apiClient from '@/lib/api/client';
import {
  Category,
  CategoriesResponse,
  UpdateCategoryStatusDto
} from '../types/category.types';

/**
 * Categories API Service
 * All API calls related to categories
 */
export const categoriesApi = {
  /**
   * Get all categories (full list, sub_categories nested)
   */
  getAll: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<CategoriesResponse>('/categories');
    return data.categories;
  },

  /**
   * Update a category's status/capability flags
   */
  updateStatus: async (
    id: string,
    payload: UpdateCategoryStatusDto
  ): Promise<{ message: string }> => {
    const { data } = await apiClient.patch<{ message: string }>(
      `/categories/${id}/status`,
      payload
    );
    return data;
  }
};
