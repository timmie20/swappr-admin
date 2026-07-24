import { serverFetch } from '@/lib/api/server';
import { Category, CategoriesResponse } from '../types/category.types';

export const categoriesApiServer = {
  /**
   * Get all categories (full list, sub_categories nested)
   */
  getAll: async (): Promise<Category[]> => {
    const data = await serverFetch<CategoriesResponse>('/categories');
    return data.categories;
  }
};
