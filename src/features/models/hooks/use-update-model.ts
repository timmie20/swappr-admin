import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { modelsApi } from '../api/models.service';
import { UpdateModelDto } from '../types/models.types';

/**
 * Hook to update an existing model
 *
 * @returns React Query mutation for updating a model
 *
 * @example
 * ```tsx
 * const updateModel = useUpdateModel();
 *
 * const handleSubmit = (data) => {
 *   updateModel.mutate({ id: '123', payload: data });
 * };
 * ```
 */
export function useUpdateModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateModelDto }) =>
      modelsApi.update(id, payload),

    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to update model';
      toast.error(message);
    },

    onSuccess: (data, { id }) => {
      // Update cache with fresh server response
      queryClient.setQueryData(queryKeys.models.detail(id), data);
      // Invalidate list to keep it in sync
      queryClient.invalidateQueries({ queryKey: queryKeys.models.lists() });
      toast.success('Model updated successfully');
    }
  });
}
