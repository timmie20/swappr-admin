'use client';

import { SectionError } from '@/components/section-error';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDataTable } from '@/hooks/use-data-table';
import { formatKobo, formatLagosDateTime } from '@/lib/format';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { parseAsInteger, parseAsStringEnum, useQueryState } from 'nuqs';
import { useMemo } from 'react';
import { useVendorRequests } from '../hooks/use-vendors';
import { AdminVendorRequest, VendorRequestType } from '../types/vendor.types';
import { AMBER_BADGE } from './vendor-badges';

const TYPE_LABEL: Record<VendorRequestType, string> = {
  delivery_review: 'Delivery review',
  payout: 'Payout',
  inspection: 'Inspection'
};

/** Where each request is handled (delivery reviews and payouts are superadmin only) */
function handleHref(
  request: AdminVendorRequest,
  vendorId: string,
  isSuperadmin: boolean
): string | null {
  switch (request.type) {
    case 'delivery_review':
      return isSuperadmin ? '/dashboard/delivery-reviews' : null;
    case 'payout':
      return isSuperadmin ? `/dashboard/payout/${request.id}` : null;
    case 'inspection':
      return `/dashboard/vendors/${vendorId}?tab=overview`;
  }
}

function buildColumns(
  vendorId: string,
  isSuperadmin: boolean
): ColumnDef<AdminVendorRequest>[] {
  return [
    {
      id: 'type',
      header: 'TYPE',
      cell: ({ row }) => (
        <Badge variant='outline'>{TYPE_LABEL[row.original.type]}</Badge>
      )
    },
    {
      id: 'status',
      header: 'STATUS',
      cell: ({ row }) => (
        <Badge
          variant={row.original.is_open ? 'outline' : 'secondary'}
          className={`capitalize ${row.original.is_open ? AMBER_BADGE : ''}`}
        >
          {row.original.status}
        </Badge>
      )
    },
    {
      id: 'order',
      header: 'ORDER',
      cell: ({ row }) =>
        row.original.order_number ? (
          <Link
            href={`/dashboard/orders/${encodeURIComponent(row.original.order_number)}`}
            className='font-mono text-xs hover:underline'
          >
            {row.original.order_number}
          </Link>
        ) : (
          '—'
        )
    },
    ...(isSuperadmin
      ? [
          {
            id: 'amount',
            header: 'AMOUNT',
            cell: ({ row }) =>
              row.original.amount_kobo === null ? (
                '—'
              ) : (
                <span className='tabular-nums'>
                  {formatKobo(row.original.amount_kobo)}
                </span>
              )
          } satisfies ColumnDef<AdminVendorRequest>
        ]
      : []),
    {
      id: 'requested_at',
      header: 'REQUESTED',
      cell: ({ row }) => (
        <span className='text-sm whitespace-nowrap'>
          {formatLagosDateTime(row.original.requested_at)}
        </span>
      )
    },
    {
      id: 'resolved_at',
      header: 'RESOLVED',
      cell: ({ row }) => (
        <span className='text-sm whitespace-nowrap'>
          {row.original.resolved_at
            ? formatLagosDateTime(row.original.resolved_at)
            : '—'}
        </span>
      )
    },
    {
      id: 'note',
      header: 'NOTE',
      cell: ({ row }) => (
        <span className='text-muted-foreground block max-w-xs text-xs whitespace-normal'>
          {row.original.note ?? '—'}
        </span>
      )
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const href = handleHref(row.original, vendorId, isSuperadmin);
        return href ? (
          <Link href={href} className='text-sm underline'>
            Open
          </Link>
        ) : null;
      }
    }
  ];
}

function RequestsTable({
  data,
  totalItems,
  vendorId,
  isSuperadmin
}: {
  data: AdminVendorRequest[];
  totalItems: number;
  vendorId: string;
  isSuperadmin: boolean;
}) {
  const [pageSize] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const columns = useMemo(
    () => buildColumns(vendorId, isSuperadmin),
    [vendorId, isSuperadmin]
  );
  const { table } = useDataTable({
    data,
    columns,
    pageCount: Math.max(1, Math.ceil(totalItems / pageSize))
  });
  return <DataTable table={table} />;
}

export function VendorRequestsTab({
  vendorId,
  isSuperadmin
}: {
  vendorId: string;
  isSuperadmin: boolean;
}) {
  const [state, setState] = useQueryState(
    'state',
    parseAsStringEnum(['open', 'all'] as const)
      .withDefault('open')
      .withOptions({ history: 'replace' })
  );
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const query = useVendorRequests(vendorId, { state, page, limit: perPage });

  return (
    <div className='space-y-4'>
      <Tabs
        value={state}
        onValueChange={(value) => {
          void setPage(1);
          void setState(value as 'open' | 'all');
        }}
      >
        <TabsList>
          <TabsTrigger value='open'>Open</TabsTrigger>
          <TabsTrigger value='all'>All</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className='flex h-[480px] flex-col'>
        {query.error ? (
          <SectionError
            error={query.error}
            onRetry={() => void query.refetch()}
            retrying={query.isFetching}
            what='requests'
          />
        ) : !query.data ? (
          <DataTableSkeleton columnCount={7} rowCount={5} filterCount={0} />
        ) : (
          <RequestsTable
            data={query.data.data}
            totalItems={query.data.total}
            vendorId={vendorId}
            isSuperadmin={isSuperadmin}
          />
        )}
      </div>
    </div>
  );
}
