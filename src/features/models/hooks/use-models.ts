import { queryKeys } from '@/lib/query-keys';
import { DefaultFilters } from '@/types/services';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { modelsApi } from '../api/models.service';

export function useModels(filters?: DefaultFilters) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: queryKeys.models.list(filters),
    queryFn: () => modelsApi.getAll(filters, getToken),
    enabled: !!getToken
  });
}

/**
 * Hook to fetch a single model by ID
 */
export function useModel(id: string, initialData?: any) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: queryKeys.models.detail(id),
    queryFn: () => modelsApi.getById(id, getToken),
    initialData,
    enabled: !!getToken && !!id
  });
}
