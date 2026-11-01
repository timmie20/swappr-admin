'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { formatKobo } from '@/lib/format';
import { useOverviewSeries } from '../hooks/use-overview';
import { SeriesRange } from '../types/overview.types';
import {
  formatKoboCompact,
  formatSeriesDate,
  RangeSelect,
  rangeLabel
} from './chart-utils';
import { SectionError } from '@/components/section-error';
import { BarGraphSkeleton } from './skeletons/bar-graph-skeleton';

export type OrdersChartMetric = 'orders' | 'gmv';

const chartConfig = {
  orders: { label: 'Orders', color: 'var(--primary)' },
  gmv: { label: 'GMV', color: 'var(--primary)' }
} satisfies ChartConfig;

const formatValue = (metric: OrdersChartMetric, value: number) =>
  metric === 'gmv' ? formatKobo(value) : value.toLocaleString('en-NG');

function useTotal(points: { value: number }[] | undefined) {
  return React.useMemo(
    () => points?.reduce((acc, p) => acc + p.value, 0) ?? 0,
    [points]
  );
}

/**
 * The template's interactive bar card. The header buttons are the
 * Orders / GMV toggle (GMV is superadmin only — a plain admin gets just
 * "Orders" and the gmv series is never requested).
 */
export function OrdersChart({
  metric,
  onMetricChange,
  range,
  onRangeChange,
  canSeeGmv
}: {
  metric: OrdersChartMetric;
  onMetricChange: (metric: OrdersChartMetric) => void;
  range: SeriesRange;
  onRangeChange: (range: SeriesRange) => void;
  canSeeGmv: boolean;
}) {
  const active: OrdersChartMetric = canSeeGmv ? metric : 'orders';
  const orders = useOverviewSeries('orders', range);
  // Never requested for a plain admin (403)
  const gmv = useOverviewSeries('gmv', range, canSeeGmv);
  const query = active === 'gmv' ? gmv : orders;

  const totals = {
    orders: useTotal(orders.data?.data),
    gmv: useTotal(gmv.data?.data)
  };

  if (query.error) {
    return (
      <SectionError
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
        what={active === 'gmv' ? 'the GMV chart' : 'the orders chart'}
      />
    );
  }
  if (!query.data) return <BarGraphSkeleton />;

  const buttons: OrdersChartMetric[] = canSeeGmv
    ? ['orders', 'gmv']
    : ['orders'];

  return (
    <Card className='@container/card !pt-3'>
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b !p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-2 px-6 !py-3'>
          <CardTitle>{canSeeGmv ? 'Orders & GMV' : 'Orders'}</CardTitle>
          <CardDescription>Paid orders per day</CardDescription>
          <RangeSelect value={range} onChange={onRangeChange} />
        </div>
        <div className='flex'>
          {buttons.map((key) => (
            <button
              key={key}
              data-active={active === key}
              disabled={buttons.length === 1}
              className='data-[active=true]:bg-primary/5 hover:bg-primary/5 relative flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left transition-colors duration-200 even:border-l disabled:cursor-default sm:border-t-0 sm:border-l sm:px-8 sm:py-6'
              onClick={() => onMetricChange(key)}
            >
              <span className='text-muted-foreground text-xs'>
                {chartConfig[key].label} · {rangeLabel(range).toLowerCase()}
              </span>
              <span className='text-lg leading-none font-bold sm:text-3xl'>
                {key === 'gmv' && !gmv.data
                  ? '—'
                  : formatValue(key, totals[key])}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <BarChart
            data={query.data.data}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <defs>
              <linearGradient id='fillBar' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='0%'
                  stopColor='var(--primary)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='100%'
                  stopColor='var(--primary)'
                  stopOpacity={0.2}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='date'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => formatSeriesDate(value)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={active === 'gmv' ? 64 : 32}
              allowDecimals={false}
              tickFormatter={(value: number) =>
                active === 'gmv'
                  ? formatKoboCompact(value)
                  : value.toLocaleString('en-NG')
              }
            />
            <ChartTooltip
              cursor={{ fill: 'var(--primary)', opacity: 0.1 }}
              content={
                <ChartTooltipContent
                  className='w-[170px]'
                  labelFormatter={(value) => formatSeriesDate(value, true)}
                  formatter={(value) => (
                    <>
                      <span className='text-muted-foreground'>
                        {chartConfig[active].label}
                      </span>
                      <span className='text-foreground ml-auto font-mono font-medium tabular-nums'>
                        {formatValue(active, Number(value))}
                      </span>
                    </>
                  )}
                />
              }
            />
            <Bar dataKey='value' fill='url(#fillBar)' radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
