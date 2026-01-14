import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
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
  const { getToken } = useAuth();

  return useQuery({
    queryKey: queryKeys.brands.list(filters),
    queryFn: () => brandsApi.getAll(filters, getToken),
    enabled: !!getToken // Only run if authenticated
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
  const { getToken } = useAuth();

  return useQuery({
    queryKey: queryKeys.brands.detail(id),
    queryFn: () => brandsApi.getById(id, getToken),
    enabled: !!id && !!getToken // Only run if we have an ID and token
  });
}
