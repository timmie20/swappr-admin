import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { categoriesApi } from '../api/categories.service';

/**
 * Hook to fetch all categories (full list, sub_categories nested)
 */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.lists(),
    queryFn: () => categoriesApi.getAll()
  });
}
