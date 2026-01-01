'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { ColumnDef } from '@tanstack/react-table';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useState } from 'react';
import { BrandModal } from '../brand-modal';
import { Button } from '@/components/ui/button';

interface BrandTableParams<TData, TValue> {
  data: TData[];
  totalItems: number;
  columns: ColumnDef<TData, TValue>[];
}

export function BrandTable<TData, TValue>({
  data,
  totalItems,
  columns
}: BrandTableParams<TData, TValue>) {
  const [pageSize] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const pageCount = Math.ceil(totalItems / pageSize);
  const { table } = useDataTable({
    data,
    columns,
    pageCount: pageCount,
    shallow: false,
    debounceMs: 500
  });

  // Modal state
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <div className='mb-2 flex justify-end'>
        <Button onClick={() => setCreateOpen(true)} variant='default'>
          Add New Brand
        </Button>
      </div>
      <BrandModal open={createOpen} onOpenChange={setCreateOpen} brand={null} />
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </>
  );
}
