'use client';

import { SectionError } from '@/components/section-error';
import { StatTile, StatTileSkeleton } from '@/components/stat-tile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { useDataTable } from '@/hooks/use-data-table';
import { formatFeeRate, formatKobo, formatLagosDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryState
} from 'nuqs';
import { useVendorTransactions } from '../hooks/use-vendors';
import {
  AdminVendorTransaction,
  VendorTransactionType
} from '../types/vendor.types';
import { TILE_GRID } from './vendor-overview-tab';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// Lagos is UTC+1 all year (no DST): a picked day is 00:00–23:59 Lagos
const lagosDayStart = (day: string) => `${day}T00:00:00.000+01:00`;
const lagosDayEnd = (day: string) => `${day}T23:59:59.999+01:00`;

// A payout only moves money once completed; the rest is history
const movesMoney = (tx: AdminVendorTransaction) =>
  tx.type === 'sale' || tx.status === 'completed';

const columns: ColumnDef<AdminVendorTransaction>[] = [
  {
    id: 'occurred_at',
    header: 'WHEN',
    cell: ({ row }) => (
      <span className='text-sm whitespace-nowrap'>
        {formatLagosDateTime(row.original.occurred_at)}
      </span>
    )
  },
  {
    id: 'type',
    header: 'TYPE',
    cell: ({ row }) => (
      <Badge variant={row.original.type === 'sale' ? 'secondary' : 'outline'}>
        {row.original.type === 'sale' ? 'Sale' : 'Payout'}
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
  {
    id: 'status',
    header: 'STATUS',
    cell: ({ row }) => <span className='capitalize'>{row.original.status}</span>
  },
  {
    id: 'gross',
    header: 'GROSS',
    cell: ({ row }) => (
      <span className='tabular-nums'>
        {formatKobo(row.original.gross_kobo)}
      </span>
    )
  },
  {
    id: 'fee',
    header: 'FEE',
    cell: ({ row }) => (
      <span className='text-muted-foreground tabular-nums'>
        {formatKobo(row.original.platform_fee_kobo)}
        {/* A rate only for rows tied to an order: a null rate means 3% there,
            but old swap payouts have no order and no such rate */}
        {(row.original.type === 'sale' || !!row.original.order_number) && (
          <span className='ml-1 text-xs'>
            ({formatFeeRate(row.original.platform_fee_rate_bps)})
          </span>
        )}
      </span>
    )
  },
  {
    id: 'net',
    header: 'NET',
    cell: ({ row }) => {
      const tx = row.original;
      const credit = tx.direction === 'credit';
      return (
        <span
          className={cn(
            'font-medium whitespace-nowrap tabular-nums',
            !movesMoney(tx)
              ? 'text-muted-foreground'
              : credit
                ? 'text-green-700 dark:text-green-400'
                : 'text-foreground'
          )}
        >
          {credit ? '+' : '−'}
          {formatKobo(tx.net_kobo)}
        </span>
      );
    }
  },
  {
    id: 'reference',
    header: 'REFERENCE',
    cell: ({ row }) => (
      <span className='text-muted-foreground font-mono text-xs'>
        {row.original.payment_reference ??
          row.original.bank_transfer_reference ??
          '—'}
      </span>
    )
  }
];

function TransactionsTable({
  data,
  totalItems
}: {
  data: AdminVendorTransaction[];
  totalItems: number;
}) {
  const [pageSize] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const { table } = useDataTable({
    data,
    columns,
    pageCount: Math.max(1, Math.ceil(totalItems / pageSize))
  });
  return <DataTable table={table} />;
}

/** Superadmin only — the parent never renders it for an admin */
export function VendorTransactionsTab({ vendorId }: { vendorId: string }) {
  const [type, setType] = useQueryState(
    'type',
    parseAsStringEnum(['all', 'sale', 'payout'] as const)
      .withDefault('all')
      .withOptions({ history: 'replace' })
  );
  const [from, setFrom] = useQueryState('from', parseAsString);
  const [to, setTo] = useQueryState('to', parseAsString);
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));

  const query = useVendorTransactions(
    vendorId,
    {
      type: type === 'all' ? undefined : (type as VendorTransactionType),
      from: from && DATE_PATTERN.test(from) ? lagosDayStart(from) : undefined,
      to: to && DATE_PATTERN.test(to) ? lagosDayEnd(to) : undefined,
      page,
      limit: perPage
    },
    true
  );
  const summary = query.data?.summary;

  return (
    <div className='space-y-4'>
      <div className={TILE_GRID}>
        {summary ? (
          <>
            <StatTile
              label='Lifetime Sales'
              value={formatKobo(summary.lifetime_sales_kobo)}
              sublabel={`${summary.paid_orders.toLocaleString('en-NG')} paid orders · ${formatKobo(summary.platform_fees_kobo)} fees`}
            />
            <StatTile
              label='Vendor Earnings'
              value={formatKobo(summary.vendor_earnings_kobo)}
              sublabel='Sales − platform fees'
            />
            <StatTile
              label='Paid Out'
              value={formatKobo(summary.paid_out_kobo)}
              sublabel={`${formatKobo(summary.pending_payouts_kobo)} pending`}
            />
            <StatTile
              label='Owed by the Ledger'
              value={formatKobo(summary.ledger_balance_owed_kobo)}
              sublabel='What payouts are checked against'
              tone={summary.ledger_balance_owed_kobo < 0 ? 'danger' : 'default'}
            />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <StatTileSkeleton key={i} />)
        )}
      </div>

      <div className='flex flex-wrap items-end gap-2'>
        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>Type</span>
          <Select
            value={type}
            onValueChange={(value) => {
              void setPage(1);
              void setType(value as 'all' | 'sale' | 'payout');
            }}
          >
            <SelectTrigger size='sm' className='w-[130px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Sales & payouts</SelectItem>
              <SelectItem value='sale'>Sales</SelectItem>
              <SelectItem value='payout'>Payouts</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>From</span>
          <Input
            type='date'
            value={from ?? ''}
            onChange={(event) => {
              void setPage(1);
              void setFrom(event.target.value || null);
            }}
            className='h-8 w-[150px]'
          />
        </div>
        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>To</span>
          <Input
            type='date'
            value={to ?? ''}
            onChange={(event) => {
              void setPage(1);
              void setTo(event.target.value || null);
            }}
            className='h-8 w-[150px]'
          />
        </div>
        {(type !== 'all' || from || to) && (
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              void setPage(1);
              void setType('all');
              void setFrom(null);
              void setTo(null);
            }}
          >
            Reset filters
          </Button>
        )}
        <p className='text-muted-foreground ml-auto text-xs'>
          Requested, approved and rejected payouts are shown muted: only paid
          ones move money.
        </p>
      </div>

      <div className='flex h-[520px] flex-col'>
        {query.error ? (
          <SectionError
            error={query.error}
            onRetry={() => void query.refetch()}
            retrying={query.isFetching}
            what='transactions'
          />
        ) : !query.data ? (
          <DataTableSkeleton columnCount={8} rowCount={6} filterCount={0} />
        ) : (
          <TransactionsTable
            data={query.data.data}
            totalItems={query.data.total}
          />
        )}
      </div>
    </div>
  );
}
