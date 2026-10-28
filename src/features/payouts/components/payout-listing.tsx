'use client';

import { QueryErrorState } from '@/components/superadmin-required';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDataTable } from '@/hooks/use-data-table';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { formatKobo } from '@/lib/format';
import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryState
} from 'nuqs';
import { useState } from 'react';
import { usePayouts } from '../hooks/use-payouts';
import { AdminPayoutRow, PayoutStatus } from '../types/payout.types';
import { columns } from './payout-tables/columns';

const TABS = [
  { value: PayoutStatus.REQUESTED, label: 'Requested' },
  { value: PayoutStatus.APPROVED, label: 'Approved · awaiting transfer' },
  { value: PayoutStatus.COMPLETED, label: 'Paid' },
  { value: PayoutStatus.REJECTED, label: 'Rejected' },
  { value: 'all', label: 'All' }
] as const;

const TAB_VALUES = TABS.map((tab) => tab.value);

function PayoutTable({
  data,
  totalItems
}: {
  data: AdminPayoutRow[];
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

export default function PayoutListingPage() {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [status, setStatus] = useQueryState(
    'status',
    parseAsStringEnum([...TAB_VALUES]).withDefault(PayoutStatus.REQUESTED)
  );
  const [search, setSearch] = useQueryState('search', parseAsString);
  const [searchInput, setSearchInput] = useState(search ?? '');
  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    void setPage(1);
    void setSearch(value.trim() || null);
  }, 500);

  const { data, isLoading, error } = usePayouts({
    page,
    limit: perPage,
    status: status === 'all' ? undefined : (status as PayoutStatus),
    search: search ?? undefined
  });

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <Tabs
          value={status}
          onValueChange={(value) => {
            void setPage(1);
            void setStatus(value as (typeof TAB_VALUES)[number]);
          }}
        >
          <TabsList>
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Input
          placeholder='Order number, bank reference or SWAPPR-PAYOUT-…'
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value);
            debouncedSetSearch(event.target.value);
          }}
          className='h-8 w-80'
        />
      </div>

      {data && (
        <p className='text-muted-foreground text-xs'>
          Ledger operating account:{' '}
          <span
            className={
              data.operating_account_balance_kobo < 0
                ? 'text-destructive font-medium'
                : 'text-foreground font-medium'
            }
          >
            {formatKobo(data.operating_account_balance_kobo)}
          </span>
        </p>
      )}

      {error ? (
        <QueryErrorState error={error} title='Could not load payouts' />
      ) : isLoading || !data ? (
        <DataTableSkeleton columnCount={7} rowCount={6} filterCount={0} />
      ) : (
        <PayoutTable data={data.payouts} totalItems={data.total} />
      )}
    </div>
  );
}
