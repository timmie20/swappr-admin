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
