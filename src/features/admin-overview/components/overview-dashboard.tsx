'use client';

import { Badge } from '@/components/ui/badge';
import { queryKeys } from '@/lib/query-keys';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import {
  useOverviewFinance,
  useOverviewMarketplace,
  useOverviewPayouts,
  useOverviewUsers,
  useOverviewVendors
} from '../hooks/use-overview';
import {
  DEFAULT_SERIES_RANGE,
  Overview,
  SERIES_RANGES
} from '../types/overview.types';
import { OrdersChart, OrdersChartMetric } from './orders-chart';
import { RecentOrders } from './recent-orders';
import { SignupsChart } from './signups-chart';
import { StatusDonut } from './status-donut';
import {
  FinanceSection,
  MarketplaceSection,
  PayoutsSection,
  UsersSection,
  VendorsSection
} from './tile-sections';

const LAGOS = 'Africa/Lagos';

// Newest as_of across every overview section already loaded.
// useIsFetching re-renders this whenever any section (re)fetches.
function useLastUpdated(): string | null {
  const queryClient = useQueryClient();
  useIsFetching({ queryKey: queryKeys.adminOverview.all() });
  const stamps = queryClient
    .getQueriesData<Overview<unknown>>({
      queryKey: queryKeys.adminOverview.all()
    })
    .map(([, data]) => data?.as_of)
    .filter((asOf): asOf is string => !!asOf);
  if (!stamps.length) return null;
  return stamps.reduce((a, b) => (a > b ? a : b));
}

function OverviewHeader() {
  const lastUpdated = useLastUpdated();
  const today = new Intl.DateTimeFormat('en-NG', {
    timeZone: LAGOS,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  return (
    <div className='flex flex-wrap items-center justify-between gap-2 space-y-2'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>
          Hi, Welcome back 👋
        </h2>
        <p className='text-muted-foreground text-sm'>{today}</p>
      </div>
      {lastUpdated && (
        <Badge variant='outline'>
          Last updated{' '}
          {new Intl.DateTimeFormat('en-NG', {
            timeZone: LAGOS,
            hour: '2-digit',
            minute: '2-digit'
          }).format(new Date(lastUpdated))}
        </Badge>
      )}
    </div>
  );
}

export default function OverviewDashboard({
  isSuperadmin
}: {
  isSuperadmin: boolean;
}) {
  // Owner decision: one shared range for both charts, default 30d
  const [range, setRange] = useQueryState(
    'range',
    parseAsStringEnum(SERIES_RANGES)
      .withDefault(DEFAULT_SERIES_RANGE)
      .withOptions({ history: 'replace' })
  );
  const [metric, setMetric] = useQueryState(
    'metric',
    parseAsStringEnum<OrdersChartMetric>(['orders', 'gmv'])
      .withDefault('orders')
      .withOptions({ history: 'replace' })
  );

  const users = useOverviewUsers();
  const vendors = useOverviewVendors();
  const marketplace = useOverviewMarketplace();
  // Superadmin only: never requested for a plain admin
  const finance = useOverviewFinance(isSuperadmin);
  const payouts = useOverviewPayouts(isSuperadmin);

  return (
    <div className='flex flex-1 flex-col space-y-6'>
      <OverviewHeader />

      <UsersSection query={users} />
      <VendorsSection query={vendors} />
      <MarketplaceSection query={marketplace} isSuperadmin={isSuperadmin} />
      {isSuperadmin && <FinanceSection query={finance} />}
      {isSuperadmin && <PayoutsSection query={payouts} />}

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
        <div className='col-span-4'>
          <OrdersChart
            metric={metric}
            onMetricChange={(m) => void setMetric(m)}
            range={range}
            onRangeChange={(r) => void setRange(r)}
            canSeeGmv={isSuperadmin}
          />
        </div>
        <div className='col-span-4 md:col-span-3'>
          <RecentOrders />
        </div>
        <div className='col-span-4'>
          <SignupsChart range={range} onRangeChange={(r) => void setRange(r)} />
        </div>
        <div className='col-span-4 md:col-span-3'>
          <StatusDonut />
        </div>
      </div>
    </div>
  );
}
