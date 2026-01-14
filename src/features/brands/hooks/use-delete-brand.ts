import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { brandsApi } from '../api/brands.service';

/**
 * Hook to delete a brand
 *
 * @returns React Query mutation for deleting a brand
 *
 * @example
 * ```tsx
 * const deleteBrand = useDeleteBrand();
 *
 * const handleDelete = (id: string) => {
 *   deleteBrand.mutate(id, {
 *     onSuccess: () => router.push('/brands')
 *   });
 * };
 * ```
 */
export function useDeleteBrand() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => brandsApi.delete(id, getToken),
    onSuccess: () => {
      // Invalidate brands list
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.lists() });
      toast.success('Brand deleted successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to delete brand';
      toast.error(message);
    }
  });
}
