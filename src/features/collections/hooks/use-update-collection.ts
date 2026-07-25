import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { collectionsApi } from '../api/collections.service';
import { UpdateCollectionDto } from '../types/collection.types';

/**
 * Hook to update an existing collection
 */
export function useUpdateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload
    }: {
      id: string;
      payload: UpdateCollectionDto;
    }) => collectionsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.collections.lists()
      });
      toast.success('Collection updated successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to update collection';
      toast.error(message);
    }
  });
}
