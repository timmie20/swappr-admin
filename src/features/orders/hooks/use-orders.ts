import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { retryUnlessClientError } from '@/lib/api/errors';
import { queryKeys } from '@/lib/query-keys';
import { ordersApi } from '../api/orders.service';
import { QueryAdminOrdersParams } from '../types/order.types';

/**
 * Hook to fetch all orders (paginated, filterable)
 */
export function useOrders(params: QueryAdminOrdersParams) {
  return useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: () => ordersApi.getAll(params),
    placeholderData: keepPreviousData,
    retry: retryUnlessClientError,
    staleTime: 30 * 1000
  });
}

/**
 * Hook to fetch a single order by order number
 */
export function useOrder(orderNumber: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(orderNumber),
    queryFn: () => ordersApi.getByOrderNumber(orderNumber),
    enabled: !!orderNumber,
    retry: retryUnlessClientError,
    staleTime: 30 * 1000
  });
}
