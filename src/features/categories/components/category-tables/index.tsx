'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { ColumnDef } from '@tanstack/react-table';

interface CategoryTableParams<TData, TValue> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
}

export function CategoryTable<TData, TValue>({
  data,
  columns
}: CategoryTableParams<TData, TValue>) {
  const { table } = useDataTable({
    data,
    columns,
    pageCount: 1,
    shallow: false,
    debounceMs: 500
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
