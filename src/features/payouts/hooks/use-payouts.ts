import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { payoutsApi } from '../api/payouts.service';
import { Payout, QueryPayoutsParams } from '../types/payout.types';

/**
 * Hook to fetch all payouts (paginated, filterable)
 */
export function usePayouts(filters?: QueryPayoutsParams) {
  return useQuery({
    queryKey: queryKeys.payouts.list(filters),
    queryFn: () => payoutsApi.getAll(filters)
  });
}

/**
 * Hook to fetch a single payout by ID
 */
export function usePayout(id: string, initialData: Payout) {
  return useQuery({
    queryKey: queryKeys.payouts.detail(id),
    queryFn: () => payoutsApi.getById(id),
    initialData,
    enabled: !!id
  });
}
