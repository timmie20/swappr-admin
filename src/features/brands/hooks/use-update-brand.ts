import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { brandsApi } from '../api/brands.service';

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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload
    }: {
      id: string;
      payload: { brand_name: string };
    }) => brandsApi.update(id, payload),

    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to update brand';
      toast.error(message);
    },

    onSuccess: (data, { id }) => {
      // Update cache with fresh server response
      queryClient.setQueryData(queryKeys.brands.detail(id), data);
      // Invalidate list to keep it in sync
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.lists() });
      toast.success('Brand updated successfully');
    }
  });
}
