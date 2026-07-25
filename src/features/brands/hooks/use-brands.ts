import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { brandsApi } from '../api/brands.service';
import { BrandFilters } from '../types/brand.types';

/**
 * Hook to fetch all brands with optional filters
 *
 * @param filters - Optional filters for brands
 * @returns React Query result with brands data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useBrands({ search: 'apple' });
 * ```
 */
export function useBrands(filters?: BrandFilters) {
  return useQuery({
    queryKey: queryKeys.brands.list(filters),
    queryFn: () => brandsApi.getAll(filters)
  });
}

/**
 * Hook to fetch a single brand by ID
 *
 * @param id - Brand ID
 * @returns React Query result with brand data
 *
 * @example
 * ```tsx
 * const { data: brand, isLoading } = useBrand('123');
 * ```
 */
export function useBrand(id: string) {
  return useQuery({
    queryKey: queryKeys.brands.detail(id),
    queryFn: () => brandsApi.getById(id),
    enabled: !!id
  });
}
