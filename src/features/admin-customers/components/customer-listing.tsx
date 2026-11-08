'use client';

import { SectionError } from '@/components/section-error';
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
import { getSortingStateParser } from '@/lib/parsers';
import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryState
} from 'nuqs';
import { useState } from 'react';
import { useAdminCustomers } from '../hooks/use-customers';
import { AdminCustomerRow, CustomerSort } from '../types/customer.types';
import { columns } from './customer-tables/columns';

const TRI = ['any', 'true', 'false'] as const;
type Tri = (typeof TRI)[number];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const triToBool = (value: Tri) =>
  value === 'any' ? undefined : value === 'true';

function CustomerTable({
  data,
  totalItems
}: {
  data: AdminCustomerRow[];
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

function TriSelect({
  label,
  value,
  onChange,
  yes,
  no
}: {
  label: string;
  value: Tri;
  onChange: (value: Tri) => void;
  yes: string;
  no: string;
}) {
  return (
    <div className='flex flex-col gap-1.5'>
      <span className='text-muted-foreground text-xs'>{label}</span>
      <Select value={value} onValueChange={(v) => onChange(v as Tri)}>
        <SelectTrigger size='sm' className='w-[130px]'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='any'>Any</SelectItem>
          <SelectItem value='true'>{yes}</SelectItem>
          <SelectItem value='false'>{no}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export default function CustomerListing() {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [sort] = useQueryState('sort', getSortingStateParser().withDefault([]));
  const [search, setSearch] = useQueryState('search', parseAsString);
  const [active, setActive] = useQueryState(
    'active',
    parseAsStringEnum([...TRI]).withDefault('any')
  );
  const [emailVerified, setEmailVerified] = useQueryState(
    'email_verified',
    parseAsStringEnum([...TRI]).withDefault('any')
  );
  const [hasOrders, setHasOrders] = useQueryState(
    'has_orders',
    parseAsStringEnum([...TRI]).withDefault('any')
  );
  const [from, setFrom] = useQueryState('from', parseAsString);
  const [to, setTo] = useQueryState('to', parseAsString);

  const [searchInput, setSearchInput] = useState(search ?? '');
  const debouncedSearch = useDebouncedCallback((value: string) => {
    void setPage(1);
    void setSearch(value.trim() || null);
  }, 300);

  const [sortEntry] = sort;
  const { data, isLoading, isFetching, error, refetch } = useAdminCustomers({
    search: search ?? undefined,
    is_active: triToBool(active),
    email_verified: triToBool(emailVerified),
    has_orders: triToBool(hasOrders),
    // Lagos is UTC+1 all year: a picked day is 00:00–23:59 Lagos
    signed_up_from:
      from && DATE_PATTERN.test(from)
        ? `${from}T00:00:00.000+01:00`
        : undefined,
    signed_up_to:
      to && DATE_PATTERN.test(to) ? `${to}T23:59:59.999+01:00` : undefined,
    ...(sortEntry
      ? {
          sort_by: sortEntry.id as CustomerSort,
          sort_order: sortEntry.desc ? 'DESC' : 'ASC'
        }
      : {}),
    page,
    limit: perPage
  });

  const withReset =
    <T,>(setter: (value: T) => unknown) =>
    (value: T) => {
      void setPage(1);
      void setter(value);
    };

  const isFiltered =
    !!search ||
    active !== 'any' ||
    emailVerified !== 'any' ||
    hasOrders !== 'any' ||
    !!from ||
    !!to;

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <div className='flex flex-wrap items-end gap-2'>
        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>Search</span>
          <Input
            placeholder='Name or email'
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              debouncedSearch(event.target.value);
            }}
            className='h-8 w-60'
          />
        </div>
        <TriSelect
          label='Status'
          value={active}
          onChange={withReset(setActive)}
          yes='Active'
          no='Inactive'
        />
        <TriSelect
          label='Email'
          value={emailVerified}
          onChange={withReset(setEmailVerified)}
          yes='Verified'
          no='Unverified'
        />
        <TriSelect
          label='Paid orders'
          value={hasOrders}
          onChange={withReset(setHasOrders)}
          yes='Has orders'
          no='No orders'
        />
        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>Signed up from</span>
          <Input
            type='date'
            value={from ?? ''}
            onChange={(event) => withReset(setFrom)(event.target.value || null)}
            className='h-8 w-[150px]'
          />
        </div>
        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>to</span>
          <Input
            type='date'
            value={to ?? ''}
            onChange={(event) => withReset(setTo)(event.target.value || null)}
            className='h-8 w-[150px]'
          />
        </div>
        {isFiltered && (
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              void setPage(1);
              setSearchInput('');
              void setSearch(null);
              void setActive('any');
              void setEmailVerified('any');
              void setHasOrders('any');
              void setFrom(null);
              void setTo(null);
            }}
          >
            Reset filters
          </Button>
        )}
      </div>

      {error ? (
        <SectionError
          error={error}
          onRetry={() => void refetch()}
          retrying={isFetching}
          what='customers'
        />
      ) : isLoading || !data ? (
        <DataTableSkeleton columnCount={8} rowCount={8} filterCount={0} />
      ) : (
        <CustomerTable data={data.data} totalItems={data.total} />
      )}
    </div>
  );
}
