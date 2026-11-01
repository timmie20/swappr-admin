'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { useOverviewSeries } from '../hooks/use-overview';
import { SeriesRange, SignupsPoint } from '../types/overview.types';
import { formatSeriesDate, RangeSelect, rangeLabel } from './chart-utils';
import { SectionError } from '@/components/section-error';
import { AreaGraphSkeleton } from './skeletons/area-graph-skeleton';

const chartConfig = {
  customers: {
    label: 'Customers',
    color: 'var(--primary)'
  },
  vendors: {
    label: 'Vendors',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

/** The template's stacked area card: customers vs vendors signups */
export function SignupsChart({
  range,
  onRangeChange
}: {
  range: SeriesRange;
  onRangeChange: (range: SeriesRange) => void;
}) {
  const query = useOverviewSeries('signups', range);
  const points = query.data?.data as SignupsPoint[] | undefined;

  const totals = React.useMemo(
    () =>
      (points ?? []).reduce(
        (acc, p) => ({
          customers: acc.customers + p.customers,
          vendors: acc.vendors + p.vendors
        }),
        { customers: 0, vendors: 0 }
      ),
    [points]
  );

  if (query.error) {
    return (
      <SectionError
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
        what='the signups chart'
      />
    );
  }
  if (!points) return <AreaGraphSkeleton />;

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Signups</CardTitle>
        <CardDescription>Customers vs vendors, stacked</CardDescription>
        <div className='pt-1'>
          <RangeSelect value={range} onChange={onRangeChange} />
        </div>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <AreaChart
            data={points}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <defs>
              <linearGradient id='fillCustomers' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-customers)'
                  stopOpacity={1.0}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-customers)'
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id='fillVendors' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-vendors)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-vendors)'
                  stopOpacity={0.1}
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
              width={32}
              allowDecimals={false}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator='dot'
                  labelFormatter={(value) => formatSeriesDate(value, true)}
                />
              }
            />
            <Area
              dataKey='vendors'
              type='natural'
              fill='url(#fillVendors)'
              stroke='var(--color-vendors)'
              stackId='a'
            />
            <Area
              dataKey='customers'
              type='natural'
              fill='url(#fillCustomers)'
              stroke='var(--color-customers)'
              stackId='a'
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className='flex w-full items-start gap-2 text-sm'>
          <div className='grid gap-2'>
            <div className='flex items-center gap-2 leading-none font-medium'>
              {(totals.customers + totals.vendors).toLocaleString('en-NG')}{' '}
              signups
            </div>
            <div className='text-muted-foreground flex items-center gap-2 leading-none'>
              {totals.customers.toLocaleString('en-NG')} customers ·{' '}
              {totals.vendors.toLocaleString('en-NG')} vendors ·{' '}
              {rangeLabel(range).toLowerCase()}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
