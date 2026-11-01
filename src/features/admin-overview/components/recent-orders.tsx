'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { OrderStatusBadge } from '@/features/orders/components/order-status-badge';
import { OrderStatus } from '@/features/orders/types/order.types';
import { formatKobo } from '@/lib/format';
import Link from 'next/link';
import { useRecentOrders } from '../hooks/use-overview';
import { SectionError } from '@/components/section-error';
import { RecentSalesSkeleton } from './skeletons/recent-sales-skeleton';

const LIMIT = 5;

function initials(name: string | null): string {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '—';
}

/** The template's recent-sales list card, showing the latest paid orders */
export function RecentOrders() {
  const query = useRecentOrders(LIMIT);

  if (query.error) {
    return (
      <SectionError
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
        what='recent orders'
      />
    );
  }
  if (!query.data) return <RecentSalesSkeleton />;

  const orders = query.data.data;

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
        <CardDescription>Latest {LIMIT} paid orders</CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className='text-muted-foreground text-sm'>No paid orders yet</p>
        ) : (
          <div className='space-y-8'>
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/dashboard/orders/${encodeURIComponent(order.order_number)}`}
                className='hover:bg-muted/50 -mx-2 flex items-center rounded-md px-2 py-1 transition-colors'
              >
                <Avatar className='h-9 w-9'>
                  <AvatarFallback>
                    {initials(order.customer_name)}
                  </AvatarFallback>
                </Avatar>
                <div className='ml-4 min-w-0 space-y-1'>
                  <p className='truncate text-sm leading-none font-medium'>
                    {order.customer_name ?? '—'} · {order.vendor_name ?? '—'}
                  </p>
                  <p className='text-muted-foreground font-mono text-xs'>
                    {order.order_number}
                  </p>
                </div>
                <div className='ml-auto flex shrink-0 items-center gap-2 pl-2'>
                  <span className='font-medium tabular-nums'>
                    {formatKobo(order.total_amount_kobo)}
                  </span>
                  <OrderStatusBadge status={order.status as OrderStatus} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
