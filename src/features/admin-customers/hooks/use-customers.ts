import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { retryUnlessClientError } from '@/lib/api/errors';
import { queryKeys } from '@/lib/query-keys';
import { adminCustomersApi } from '../api/customers.service';
import { QueryAdminCustomersParams } from '../types/customer.types';

// Same refresh behaviour as the Overview
const REFRESH = {
  staleTime: 60 * 1000,
  refetchOnWindowFocus: true,
  retry: retryUnlessClientError
} as const;

export function useAdminCustomers(params: QueryAdminCustomersParams) {
  return useQuery({
    queryKey: queryKeys.adminCustomers.list(params),
    queryFn: () => adminCustomersApi.getAll(params),
    placeholderData: keepPreviousData,
    ...REFRESH
  });
}

export function useAdminCustomer(customerId: string) {
  return useQuery({
    queryKey: queryKeys.adminCustomers.detail(customerId),
    queryFn: () => adminCustomersApi.getById(customerId),
    enabled: !!customerId,
    ...REFRESH
  });
}
