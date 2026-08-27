'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useDataTable } from '@/hooks/use-data-table';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { ColumnDef } from '@tanstack/react-table';
import {
  parseAsFloat,
  parseAsInteger,
  parseAsIsoDate,
  parseAsString,
  parseAsStringEnum,
  useQueryState
} from 'nuqs';
import { useState } from 'react';
import { PAYOUT_STATUS_OPTIONS } from '../../types/payout.types';

interface PayoutTableParams<TData, TValue> {
  data: TData[];
  totalItems: number;
  columns: ColumnDef<TData, TValue>[];
}

const STATUS_VALUES = [
  'all',
  'pending',
  'processing',
  'completed',
  'failed'
] as const;

export function PayoutTable<TData, TValue>({
  data,
  totalItems,
  columns
}: PayoutTableParams<TData, TValue>) {
  const [pageSize] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const pageCount = Math.ceil(totalItems / pageSize);

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    shallow: false,
    debounceMs: 500
  });

  const [status, setStatus] = useQueryState(
    'status',
    parseAsStringEnum([...STATUS_VALUES])
      .withDefault('all')
      .withOptions({ shallow: false })
  );

  const [searchValue, setSearchValue] = useQueryState(
    'search',
    parseAsString.withOptions({ shallow: false })
  );
  const [searchInput, setSearchInput] = useState(searchValue ?? '');
  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    void setPage(1);
    void setSearchValue(value || null);
  }, 500);

  const [minAmount, setMinAmount] = useQueryState(
    'min_amount',
    parseAsFloat.withOptions({ shallow: false })
  );
  const [minAmountInput, setMinAmountInput] = useState(
    minAmount?.toString() ?? ''
  );
  const debouncedSetMinAmount = useDebouncedCallback((value: string) => {
    void setPage(1);
    void setMinAmount(value === '' ? null : Number(value));
  }, 500);

  const [maxAmount, setMaxAmount] = useQueryState(
    'max_amount',
    parseAsFloat.withOptions({ shallow: false })
  );
  const [maxAmountInput, setMaxAmountInput] = useState(
    maxAmount?.toString() ?? ''
  );
  const debouncedSetMaxAmount = useDebouncedCallback((value: string) => {
    void setPage(1);
    void setMaxAmount(value === '' ? null : Number(value));
  }, 500);

  const [createdFrom, setCreatedFrom] = useQueryState(
    'created_from',
    parseAsIsoDate.withOptions({ shallow: false })
  );
  const [createdTo, setCreatedTo] = useQueryState(
    'created_to',
    parseAsIsoDate.withOptions({ shallow: false })
  );

  const isFiltered =
    status !== 'all' ||
    !!searchValue ||
    minAmount != null ||
    maxAmount != null ||
    !!createdFrom ||
    !!createdTo;

  const onResetFilters = () => {
    void setPage(1);
    void setStatus('all');
    setSearchInput('');
    void setSearchValue(null);
    setMinAmountInput('');
    void setMinAmount(null);
    setMaxAmountInput('');
    void setMaxAmount(null);
    void setCreatedFrom(null);
    void setCreatedTo(null);
  };

  return (
    <>
      <div className='mb-2 flex flex-wrap items-end gap-2'>
        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>Status</span>
          <Select
            value={status}
            onValueChange={(value) => {
              void setPage(1);
              void setStatus(value as (typeof STATUS_VALUES)[number]);
            }}
          >
            <SelectTrigger size='sm' className='w-[150px]'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All statuses</SelectItem>
              {PAYOUT_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>Reference</span>
          <Input
            placeholder='Search transfer reference...'
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              debouncedSetSearch(event.target.value);
            }}
            className='h-8 w-56'
          />
        </div>

        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>Min amount</span>
          <Input
            type='number'
            inputMode='decimal'
            placeholder='0'
            value={minAmountInput}
            onChange={(event) => {
              setMinAmountInput(event.target.value);
              debouncedSetMinAmount(event.target.value);
            }}
            className='h-8 w-28'
          />
        </div>

        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>Max amount</span>
          <Input
            type='number'
            inputMode='decimal'
            placeholder='Any'
            value={maxAmountInput}
            onChange={(event) => {
              setMaxAmountInput(event.target.value);
              debouncedSetMaxAmount(event.target.value);
            }}
            className='h-8 w-28'
          />
        </div>

        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>Created from</span>
          <Input
            type='date'
            value={createdFrom ? createdFrom.toISOString().slice(0, 10) : ''}
            onChange={(event) => {
              void setPage(1);
              void setCreatedFrom(
                event.target.value ? new Date(event.target.value) : null
              );
            }}
            className='h-8 w-[150px]'
          />
        </div>

        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>Created to</span>
          <Input
            type='date'
            value={createdTo ? createdTo.toISOString().slice(0, 10) : ''}
            onChange={(event) => {
              void setPage(1);
              void setCreatedTo(
                event.target.value ? new Date(event.target.value) : null
              );
            }}
            className='h-8 w-[150px]'
          />
        </div>

        {isFiltered && (
          <Button variant='outline' size='sm' onClick={onResetFilters}>
            Reset filters
          </Button>
        )}
      </div>
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </>
  );
}
