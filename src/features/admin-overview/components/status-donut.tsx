'use client';

import * as React from 'react';
import { Label, Pie, PieChart } from 'recharts';

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
import { useOrderStatusBreakdown } from '../hooks/use-overview';
import { PaidOrderStatus } from '../types/overview.types';
import { SectionError } from '@/components/section-error';
import { PieGraphSkeleton } from './skeletons/pie-graph-skeleton';

// The API always returns these five, in this order
const STATUSES: PaidOrderStatus[] = [
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled'
];

const chartConfig = {
  count: { label: 'Orders' },
  confirmed: { label: 'Confirmed', color: 'var(--primary)' },
  processing: { label: 'Processing', color: 'var(--primary)' },
  shipped: { label: 'Shipped', color: 'var(--primary)' },
  delivered: { label: 'Delivered', color: 'var(--primary)' },
  cancelled: { label: 'Cancelled', color: 'var(--primary)' }
} satisfies ChartConfig;

// Same gradient ramp as the template donut, one step per status
const opacityFor = (index: number) => ({
  from: 1 - index * 0.15,
  to: 0.8 - index * 0.15
});

/** The template's donut-with-text card: current split of paid orders */
export function StatusDonut() {
  const query = useOrderStatusBreakdown();
  const slices = React.useMemo(() => query.data?.data ?? [], [query.data]);
  const total = React.useMemo(
    () => slices.reduce((acc, s) => acc + s.count, 0),
    [slices]
  );

  if (query.error) {
    return (
      <SectionError
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
        what='orders by status'
      />
    );
  }
  if (!query.data) return <PieGraphSkeleton />;

  const countFor = (status: PaidOrderStatus) =>
    slices.find((s) => s.status === status)?.count ?? 0;
  // Zero slices are left out of the ring but kept in the legend
  const ring = STATUSES.map((status) => ({
    status,
    count: countFor(status),
    fill: `url(#fill${status})`
  })).filter((s) => s.count > 0);

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Orders by Status</CardTitle>
        <CardDescription>Current split of paid orders</CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='mx-auto aspect-square h-[250px]'
        >
          <PieChart>
            <defs>
              {STATUSES.map((status, index) => (
                <linearGradient
                  key={status}
                  id={`fill${status}`}
                  x1='0'
                  y1='0'
                  x2='0'
                  y2='1'
                >
                  <stop
                    offset='0%'
                    stopColor='var(--primary)'
                    stopOpacity={opacityFor(index).from}
                  />
                  <stop
                    offset='100%'
                    stopColor='var(--primary)'
                    stopOpacity={opacityFor(index).to}
                  />
                </linearGradient>
              ))}
            </defs>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey='status' />}
            />
            <Pie
              // An empty ring still shows the centre total
              data={
                ring.length
                  ? ring
                  : [{ status: 'none', count: 1, fill: 'var(--muted)' }]
              }
              dataKey='count'
              nameKey='status'
              innerRadius={60}
              strokeWidth={2}
              stroke='var(--background)'
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor='middle'
                        dominantBaseline='middle'
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className='fill-foreground text-3xl font-bold'
                        >
                          {total.toLocaleString('en-NG')}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className='fill-muted-foreground text-sm'
                        >
                          Paid orders
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <ul className='grid w-full grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3'>
          {STATUSES.map((status, index) => (
            <li key={status} className='flex items-center gap-2'>
              <span
                className='bg-primary h-2.5 w-2.5 shrink-0 rounded-[2px]'
                style={{ opacity: opacityFor(index).from }}
              />
              <span className='text-muted-foreground'>
                {chartConfig[status].label}
              </span>
              <span className='ml-auto font-medium tabular-nums'>
                {countFor(status).toLocaleString('en-NG')}
              </span>
            </li>
          ))}
        </ul>
      </CardFooter>
    </Card>
  );
}
