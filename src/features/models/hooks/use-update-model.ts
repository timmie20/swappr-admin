import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
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
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateModelDto }) =>
      modelsApi.update(id, payload, getToken),

    onMutate: async ({ id, payload }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.models.detail(id)
      });

      // Snapshot previous value
      const previousModel = queryClient.getQueryData(
        queryKeys.models.detail(id)
      );

      // Optimistically update
      queryClient.setQueryData(queryKeys.models.detail(id), (old: any) => ({
        ...old,
        ...payload
      }));

      return { previousModel };
    },

    onError: (error: any, { id }, context) => {
      // Rollback on error
      queryClient.setQueryData(
        queryKeys.models.detail(id),
        context?.previousModel
      );

      const message =
        error?.response?.data?.message || 'Failed to update model';
      toast.error(message);
    },

    onSuccess: (data, { id }) => {
      // Update cache with server response
      queryClient.setQueryData(queryKeys.models.detail(id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.models.lists() });
      toast.success('Model updated successfully');
    }
  });
}
