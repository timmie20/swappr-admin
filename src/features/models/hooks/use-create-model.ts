import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { modelsApi } from '../api/models.service';
import { CreateModelDto } from '../types/models.types';

/**
 * Hook to create a new model
 *
 * @returns React Query mutation for creating a model
 *
 * @example
 * ```tsx
 * const createModel = useCreateBrand();
 *
 * const handleSubmit = (data) => {
 *   createBrand.mutate(data, {
 *     onSuccess: () => router.push('/models')
 *   });
 * };
 * ```
 */
export function useCreateModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateModelDto) => modelsApi.create(payload),
    onSuccess: () => {
      // Invalidate and refetch models list
      queryClient.invalidateQueries({ queryKey: queryKeys.models.lists() });
      toast.success('Model created successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to create model';
      toast.error(message);
    }
  });
}
