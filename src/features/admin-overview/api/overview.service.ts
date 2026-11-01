import apiClient from '@/lib/api/client';
import {
  FinanceOverview,
  MarketplaceOverview,
  Overview,
  OrderStatusSlice,
  PayoutsOverview,
  RecentOrder,
  SeriesMetric,
  SeriesPoint,
  SeriesRange,
  SignupsPoint,
  UsersOverview,
  VendorsOverview
} from '../types/overview.types';

const get = async <T>(path: string, params?: Record<string, unknown>) => {
  const { data } = await apiClient.get<Overview<T>>(`/admin/overview/${path}`, {
    params
  });
  return data;
};

/**
 * Admin Overview API — one call per dashboard section, so one failure only
 * blanks its own section. finance, payouts and the gmv series are
 * superadmin only (403 for admin).
 */
export const overviewApi = {
  users: () => get<UsersOverview>('users'),
  vendors: () => get<VendorsOverview>('vendors'),
  marketplace: () => get<MarketplaceOverview>('marketplace'),
  finance: () => get<FinanceOverview>('finance'),
  payouts: () => get<PayoutsOverview>('payouts'),
  series: <M extends SeriesMetric>(metric: M, range: SeriesRange) =>
    get<M extends 'signups' ? SignupsPoint[] : SeriesPoint[]>('series', {
      metric,
      range
    }),
  orderStatusBreakdown: () => get<OrderStatusSlice[]>('order-status-breakdown'),
  recentOrders: (limit: number) =>
    get<RecentOrder[]>('recent-orders', { limit })
};
