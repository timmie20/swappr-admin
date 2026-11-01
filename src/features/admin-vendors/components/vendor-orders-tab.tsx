'use client';

import { SectionError } from '@/components/section-error';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  OrderStatusBadge,
  PaymentStatusBadge
} from '@/features/orders/components/order-status-badge';
import { useDataTable } from '@/hooks/use-data-table';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { formatKobo, formatLagosDateTime } from '@/lib/format';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryState
} from 'nuqs';
import { useMemo, useState } from 'react';
import { useVendorOrders } from '../hooks/use-vendors';
import {
  AdminVendorOrderRow,
  AdminVendorOverview,
  VendorOrderQueue
} from '../types/vendor.types';
import { AMBER_BADGE } from './vendor-badges';

type OrderCounts = AdminVendorOverview['activity']['orders'];

const QUEUES: {
  value: VendorOrderQueue;
  label: string;
  count?: keyof OrderCounts;
}[] = [
  { value: 'needs_action', label: 'Needs action', count: 'needs_action' },
  {
    value: 'awaiting_delivery_confirmation',
    label: 'Awaiting confirmation',
    count: 'awaiting_delivery_confirmation'
  },
  {
    value: 'awaiting_payment',
    label: 'Awaiting payment',
    count: 'awaiting_payment'
  },
  { value: 'completed', label: 'Completed', count: 'completed' },
  { value: 'cancelled', label: 'Cancelled', count: 'cancelled' },
  { value: 'all', label: 'All', count: 'total' }
];

// The date that matters for each queue
const DATE_COLUMN: Record<
  VendorOrderQueue,
  { title: string; pick: (row: AdminVendorOrderRow) => string | null }
> = {
  needs_action: { title: 'PAID', pick: (r) => r.paid_at },
  awaiting_delivery_confirmation: {
    title: 'READY / SHIPPED',
    pick: (r) => r.fulfillment_ready_at
  },
  awaiting_payment: { title: 'CREATED', pick: (r) => r.created_at },
  completed: { title: 'DELIVERED', pick: (r) => r.delivered_at },
  cancelled: { title: 'CREATED', pick: (r) => r.created_at },
  all: { title: 'CREATED', pick: (r) => r.created_at }
};

/** "3 days" since shipping — vendors may request a review after 48 h */
function waitingFor(since: string | null): string | null {
  if (!since) return null;
  const hours = Math.floor((Date.now() - new Date(since).getTime()) / 36e5);
  if (hours < 48) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
}

function buildColumns(
  queue: VendorOrderQueue
): ColumnDef<AdminVendorOrderRow>[] {
  const date = DATE_COLUMN[queue];
  return [
    {
      id: 'order_number',
      header: 'ORDER',
      cell: ({ row }) => (
        <div className='flex flex-col gap-1'>
          <Link
            href={`/dashboard/orders/${encodeURIComponent(row.original.order_number)}`}
            className='font-mono text-xs font-medium hover:underline'
          >
            {row.original.order_number}
          </Link>
          {row.original.has_open_delivery_review && (
            <Badge variant='outline' className={AMBER_BADGE}>
              Review open
            </Badge>
          )}
        </div>
      )
    },
    {
      id: 'customer',
      header: 'CUSTOMER',
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <span>{row.original.customer.name ?? '—'}</span>
          {row.original.customer.email && (
            <span className='text-muted-foreground text-xs'>
              {row.original.customer.email}
            </span>
          )}
        </div>
      )
    },
    {
      id: 'type',
      header: 'TYPE',
      cell: ({ row }) => (
        <span className='capitalize'>{row.original.order_type}</span>
      )
    },
    {
      id: 'status',
      header: 'STATUS',
      cell: ({ row }) => <OrderStatusBadge status={row.original.status} />
    },
    {
      id: 'payment',
      header: 'PAYMENT',
      cell: ({ row }) => (
        <PaymentStatusBadge status={row.original.payment_status} />
      )
    },
    {
      id: 'items',
      header: 'ITEMS',
      cell: ({ row }) => row.original.items_count
    },
    {
      id: 'total',
      header: 'TOTAL',
      cell: ({ row }) => (
        <span className='font-medium tabular-nums'>
          {formatKobo(row.original.total_amount_kobo)}
        </span>
      )
    },
    {
      id: 'date',
      header: date.title,
      cell: ({ row }) => {
        const value = date.pick(row.original);
        const waiting =
          queue === 'awaiting_delivery_confirmation'
            ? waitingFor(row.original.fulfillment_ready_at)
            : null;
        return (
          <div className='flex flex-col text-sm whitespace-nowrap'>
            <span>{formatLagosDateTime(value)}</span>
            {waiting && (
              <span className='text-muted-foreground text-xs'>
                Waiting {waiting}
              </span>
            )}
          </div>
        );
      }
    }
  ];
}

function OrdersTable({
  data,
  totalItems,
  queue
}: {
  data: AdminVendorOrderRow[];
  totalItems: number;
  queue: VendorOrderQueue;
}) {
  const [pageSize] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const columns = useMemo(() => buildColumns(queue), [queue]);
  const { table } = useDataTable({
    data,
    columns,
    pageCount: Math.max(1, Math.ceil(totalItems / pageSize))
  });
  return <DataTable table={table} />;
}

export function VendorOrdersTab({
  vendorId,
  counts
}: {
  vendorId: string;
  counts: OrderCounts | undefined;
}) {
  // Owner decision: queue tabs replace history
  const [queue, setQueue] = useQueryState(
    'queue',
    parseAsStringEnum(QUEUES.map((q) => q.value))
      .withDefault('needs_action')
      .withOptions({ history: 'replace' })
  );
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [search, setSearch] = useQueryState('search', parseAsString);
  const [searchInput, setSearchInput] = useState(search ?? '');
  const debouncedSearch = useDebouncedCallback((value: string) => {
    void setPage(1);
    void setSearch(value.trim() || null);
  }, 300);

  const query = useVendorOrders(vendorId, {
    queue,
    search: search ?? undefined,
    page,
    limit: perPage
  });

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <Tabs
          value={queue}
          onValueChange={(value) => {
            void setPage(1);
            void setQueue(value as VendorOrderQueue);
          }}
        >
          <TabsList>
            {QUEUES.map((q) => (
              <TabsTrigger key={q.value} value={q.value}>
                {q.label}
                {counts && q.count && (
                  <span className='text-muted-foreground ml-1 tabular-nums'>
                    {counts[q.count] as number}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Input
          placeholder='Order number, customer name or email'
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value);
            debouncedSearch(event.target.value);
          }}
          className='h-8 w-72'
        />
      </div>

      {/* The data table fills its parent's height, so give it one */}
      <div className='flex h-[560px] flex-col'>
        {query.error ? (
          <SectionError
            error={query.error}
            onRetry={() => void query.refetch()}
            retrying={query.isFetching}
            what='orders'
          />
        ) : !query.data ? (
          <DataTableSkeleton columnCount={8} rowCount={6} filterCount={0} />
        ) : (
          <OrdersTable
            data={query.data.data}
            totalItems={query.data.total}
            queue={queue}
          />
        )}
      </div>
    </div>
  );
}
