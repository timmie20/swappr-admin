import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { retryUnlessClientError } from '@/lib/api/errors';
import { queryKeys } from '@/lib/query-keys';
import { overviewApi } from '../api/overview.service';
import { SeriesMetric, SeriesRange } from '../types/overview.types';

// Owner decision: refetch when the tab regains focus if older than 60s;
// no background polling
const REFRESH = {
  staleTime: 60 * 1000,
  refetchOnWindowFocus: true,
  retry: retryUnlessClientError
} as const;

export function useOverviewUsers() {
  return useQuery({
    queryKey: queryKeys.adminOverview.users(),
    queryFn: overviewApi.users,
    ...REFRESH
  });
}

export function useOverviewVendors() {
  return useQuery({
    queryKey: queryKeys.adminOverview.vendors(),
    queryFn: overviewApi.vendors,
    ...REFRESH
  });
}

export function useOverviewMarketplace() {
  return useQuery({
    queryKey: queryKeys.adminOverview.marketplace(),
    queryFn: overviewApi.marketplace,
    ...REFRESH
  });
}

/** Superadmin only — never called for a plain admin */
export function useOverviewFinance(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.adminOverview.finance(),
    queryFn: overviewApi.finance,
    enabled,
    ...REFRESH
  });
}

/** Superadmin only — never called for a plain admin */
export function useOverviewPayouts(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.adminOverview.payouts(),
    queryFn: overviewApi.payouts,
    enabled,
    ...REFRESH
  });
}

/** metric=gmv is superadmin only: pass enabled=false for admin */
export function useOverviewSeries<M extends SeriesMetric>(
  metric: M,
  range: SeriesRange,
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.adminOverview.series(metric, range),
    queryFn: () => overviewApi.series(metric, range),
    enabled,
    // Keep the old range on screen while the new one loads
    placeholderData: keepPreviousData,
    ...REFRESH
  });
}

export function useOrderStatusBreakdown() {
  return useQuery({
    queryKey: queryKeys.adminOverview.orderStatusBreakdown(),
    queryFn: overviewApi.orderStatusBreakdown,
    ...REFRESH
  });
}

export function useRecentOrders(limit = 5) {
  return useQuery({
    queryKey: queryKeys.adminOverview.recentOrders(limit),
    queryFn: () => overviewApi.recentOrders(limit),
    ...REFRESH
  });
}
