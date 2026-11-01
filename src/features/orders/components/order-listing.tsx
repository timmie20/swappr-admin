'use client';

import { QueryErrorState } from '@/components/superadmin-required';
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
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryState
} from 'nuqs';
import { useState } from 'react';
import { useOrders } from '../hooks/use-orders';
import {
  AdminOrderListItem,
  ORDER_STATUS_OPTIONS,
  OrderStatus,
  OrderType
} from '../types/order.types';
import { columns } from './order-tables/columns';

const STATUS_VALUES = ['all', ...Object.values(OrderStatus)] as const;
const TYPE_VALUES = ['all', 'purchase', 'swap'] as const;

function OrderTable({
  data,
  totalItems
}: {
  data: AdminOrderListItem[];
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

export default function OrderListingPage() {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [status, setStatus] = useQueryState(
    'status',
    parseAsStringEnum([...STATUS_VALUES]).withDefault('all')
  );
  const [type, setType] = useQueryState(
    'type',
    parseAsStringEnum([...TYPE_VALUES]).withDefault('all')
  );
  const [search, setSearch] = useQueryState('search', parseAsString);
  const [searchInput, setSearchInput] = useState(search ?? '');
  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    void setPage(1);
    void setSearch(value.trim() || null);
  }, 500);

  const { data, isLoading, error } = useOrders({
    page,
    limit: perPage,
    status: status === 'all' ? undefined : (status as OrderStatus),
    order_type: type === 'all' ? undefined : (type as OrderType),
    search: search ?? undefined
  });

  const isFiltered = status !== 'all' || type !== 'all' || !!search;

  const onResetFilters = () => {
    void setPage(1);
    void setStatus('all');
    void setType('all');
    setSearchInput('');
    void setSearch(null);
  };

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <div className='flex flex-wrap items-end gap-2'>
        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>Search</span>
          <Input
            placeholder='Order number, customer name or email'
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              debouncedSetSearch(event.target.value);
            }}
            className='h-8 w-72'
          />
        </div>

        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>Status</span>
          <Select
            value={status}
            onValueChange={(value) => {
              void setPage(1);
              void setStatus(value as (typeof STATUS_VALUES)[number]);
            }}
          >
            <SelectTrigger size='sm' className='w-[160px]'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All statuses</SelectItem>
              {ORDER_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>Type</span>
          <Select
            value={type}
            onValueChange={(value) => {
              void setPage(1);
              void setType(value as (typeof TYPE_VALUES)[number]);
            }}
          >
            <SelectTrigger size='sm' className='w-[130px]'>
              <SelectValue placeholder='Type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All types</SelectItem>
              <SelectItem value='purchase'>Purchase</SelectItem>
              <SelectItem value='swap'>Swap</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isFiltered && (
          <Button variant='outline' size='sm' onClick={onResetFilters}>
            Reset filters
          </Button>
        )}
      </div>

      {error ? (
        <QueryErrorState error={error} title='Could not load orders' />
      ) : isLoading || !data ? (
        <DataTableSkeleton columnCount={8} rowCount={8} filterCount={0} />
      ) : (
        <OrderTable data={data.orders} totalItems={data.total} />
      )}
    </div>
  );
}
