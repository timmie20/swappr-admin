import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { collectionsApi } from '../api/collections.service';
import { CollectionFilterParams } from '../types/collection.types';

/**
 * Hook to fetch all collections (paginated)
 */
export function useCollections(filters?: CollectionFilterParams) {
  return useQuery({
    queryKey: queryKeys.collections.list(filters),
    queryFn: () => collectionsApi.getAll(filters)
  });
}
