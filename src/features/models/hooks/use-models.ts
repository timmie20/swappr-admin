import { queryKeys } from '@/lib/query-keys';
import { DefaultFilters } from '@/types/services';
import { useQuery } from '@tanstack/react-query';
import { modelsApi } from '../api/models.service';

export function useModels(filters?: DefaultFilters) {
  return useQuery({
    queryKey: queryKeys.models.list(filters),
    queryFn: () => modelsApi.getAll(filters)
  });
}

/**
 * Hook to fetch a single model by ID
 */
export function useModel(id: string, initialData?: any) {
  return useQuery({
    queryKey: queryKeys.models.detail(id),
    queryFn: () => modelsApi.getById(id),
    initialData,
    enabled: !!id
  });
}
