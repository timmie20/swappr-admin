import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { brandsApi } from '../api/brands.service';
import { UpdateBrandDto } from '../types/brand.types';

/**
 * Hook to update an existing brand
 *
 * @returns React Query mutation for updating a brand
 *
 * @example
 * ```tsx
 * const updateBrand = useUpdateBrand();
 *
 * const handleSubmit = (data) => {
 *   updateBrand.mutate({ id: '123', payload: data });
 * };
 * ```
 */
export function useUpdateBrand() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBrandDto }) =>
      brandsApi.update(id, payload, getToken),

    onMutate: async ({ id, payload }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.brands.detail(id)
      });

      // Snapshot previous value
      const previousBrand = queryClient.getQueryData(
        queryKeys.brands.detail(id)
      );

      // Optimistically update
      queryClient.setQueryData(queryKeys.brands.detail(id), (old: any) => ({
        ...old,
        ...payload
      }));

      return { previousBrand };
    },

    onError: (error: any, { id }, context) => {
      // Rollback on error
      queryClient.setQueryData(
        queryKeys.brands.detail(id),
        context?.previousBrand
      );

      const message =
        error?.response?.data?.message || 'Failed to update brand';
      toast.error(message);
    },

    onSuccess: (data, { id }) => {
      // Update cache with server response
      queryClient.setQueryData(queryKeys.brands.detail(id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.lists() });
      toast.success('Brand updated successfully');
    }
  });
}
