import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { categoriesApi } from '../api/categories.service';
import { UpdateCategoryStatusDto } from '../types/category.types';

/**
 * Hook to update a category's status/capability flags
 */
export function useUpdateCategoryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload
    }: {
      id: string;
      payload: UpdateCategoryStatusDto;
    }) => categoriesApi.updateStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() });
      toast.success('Category updated successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to update category';
      toast.error(message);
    }
  });
}
