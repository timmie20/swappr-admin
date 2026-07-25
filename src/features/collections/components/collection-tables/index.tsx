'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDataTable } from '@/hooks/use-data-table';
import { ColumnDef } from '@tanstack/react-table';
import { parseAsInteger, parseAsStringEnum, useQueryState } from 'nuqs';
import { useState } from 'react';
import { CollectionModal } from '../collection-modal';

interface CollectionTableParams<TData, TValue> {
  data: TData[];
  totalItems: number;
  columns: ColumnDef<TData, TValue>[];
}

export function CollectionTable<TData, TValue>({
  data,
  totalItems,
  columns
}: CollectionTableParams<TData, TValue>) {
  const [pageSize] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [isActive, setIsActive] = useQueryState(
    'is_active',
    parseAsStringEnum(['true', 'false'])
      .withDefault('true')
      .withOptions({ shallow: false })
  );
  const pageCount = Math.ceil(totalItems / pageSize);
  const { table } = useDataTable({
    data,
    columns,
    pageCount: pageCount,
    shallow: false,
    debounceMs: 500
  });

  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <div className='mb-2 flex items-center justify-between'>
        <Tabs
          value={isActive}
          onValueChange={(value) => setIsActive(value as 'true' | 'false')}
        >
          <TabsList>
            <TabsTrigger value='true'>Active</TabsTrigger>
            <TabsTrigger value='false'>Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => setCreateOpen(true)} variant='default'>
          Add New Collection
        </Button>
      </div>
      <CollectionModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        collection={null}
      />
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </>
  );
}
