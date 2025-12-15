import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { brandsApi } from '../api/brands.service';
import { CreateBrandDto } from '../types/brand.types';

/**
 * Hook to create a new brand
 *
 * @returns React Query mutation for creating a brand
 *
 * @example
 * ```tsx
 * const createBrand = useCreateBrand();
 *
 * const handleSubmit = (data) => {
 *   createBrand.mutate(data, {
 *     onSuccess: () => router.push('/brands')
 *   });
 * };
 * ```
 */
export function useCreateBrand() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBrandDto) =>
      brandsApi.create(payload, getToken),
    onSuccess: () => {
      // Invalidate and refetch brands list
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.lists() });
      toast.success('Brand created successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to create brand';
      toast.error(message);
    }
  });
}
