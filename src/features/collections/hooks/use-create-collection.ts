import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { collectionsApi } from '../api/collections.service';
import { CreateCollectionDto } from '../types/collection.types';

/**
 * Hook to create a new collection
 */
export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCollectionDto) =>
      collectionsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.lists()
      });
      toast.success('Collection created successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to create collection';
      toast.error(message);
    }
  });
}
