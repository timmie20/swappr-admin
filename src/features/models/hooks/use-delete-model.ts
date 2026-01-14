import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { modelsApi } from '../api/models.service';

/**
 * Hook to delete a brand
 *
 * @returns React Query mutation for deleting a brand
 *
 */
export function useDeleteModel() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => modelsApi.deleteModel(id, getToken),
    onSuccess: () => {
      // Invalidate brands list
      queryClient.invalidateQueries({ queryKey: queryKeys.models.lists() });
      toast.success('Model deleted successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to delete Model';
      toast.error(message);
    }
  });
}
