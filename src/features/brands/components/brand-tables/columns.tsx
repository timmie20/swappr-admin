'use client';

import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Brand } from '../../types/brand.types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@/lib/format';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Brand>[] = [
  {
    id: 'brand_name',
    accessorKey: 'brand_name',
    header: ({ column }: { column: Column<Brand, unknown> }) => (
      <DataTableColumnHeader column={column} title='Brand Name' />
    ),
    cell: ({ cell }) => (
      <div className='font-medium'>{cell.getValue<Brand['brand_name']>()}</div>
    )
  },
  {
    id: 'created_at',
    accessorKey: 'created_at',
    header: 'CREATED AT',
    cell: ({ cell }) => {
      const date = cell.getValue<Brand['created_at']>();
      return (
        <div>
          {formatDate(date, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </div>
      );
    }
  },
  {
    id: 'updated_at',
    accessorKey: 'updated_at',
    header: 'LAST UPDATED',
    cell: ({ cell }) => {
      const date = cell.getValue<Brand['updated_at']>();
      return (
        <div>
          {formatDate(date, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </div>
      );
    }
  },
  {
    id: 'actions',
    header: 'ACTIONS',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
