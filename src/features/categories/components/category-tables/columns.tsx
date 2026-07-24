'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Category } from '../../types/category.types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@/lib/format';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Category>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<Category, unknown> }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ cell }) => (
      <div className='font-medium'>{cell.getValue<Category['name']>()}</div>
    )
  },
  {
    id: 'type',
    accessorKey: 'type',
    header: 'TYPE',
    cell: ({ cell }) => (
      <span className='capitalize'>{cell.getValue<Category['type']>()}</span>
    )
  },
  {
    id: 'is_active',
    accessorKey: 'is_active',
    header: 'STATUS',
    cell: ({ cell }) => {
      const isActive = cell.getValue<Category['is_active']>();
      return (
        <Badge variant={isActive ? 'default' : 'outline'}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      );
    }
  },
  {
    id: 'is_primary',
    accessorKey: 'is_primary',
    header: 'PRIMARY',
    cell: ({ cell }) =>
      cell.getValue<Category['is_primary']>() ? (
        <Badge variant='secondary'>Primary</Badge>
      ) : (
        <span className='text-muted-foreground'>—</span>
      )
  },
  {
    id: 'sub_categories',
    header: 'SUB-CATEGORIES',
    cell: ({ row }) => row.original.sub_categories?.length ?? 0
  },
  {
    id: 'updated_at',
    accessorKey: 'updated_at',
    header: 'LAST UPDATED',
    cell: ({ cell }) => {
      const date = cell.getValue<Category['updated_at']>();
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
