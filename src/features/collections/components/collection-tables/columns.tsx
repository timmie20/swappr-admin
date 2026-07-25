'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Collection } from '../../types/collection.types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@/lib/format';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Collection>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<Collection, unknown> }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <span className='font-medium'>{row.original.name}</span>
        {row.original.badge && (
          <Badge variant='secondary'>{row.original.badge}</Badge>
        )}
      </div>
    )
  },
  {
    id: 'slug',
    accessorKey: 'slug',
    header: 'SLUG',
    cell: ({ cell }) => (
      <span className='text-muted-foreground'>
        {cell.getValue<Collection['slug']>()}
      </span>
    )
  },
  {
    id: 'is_active',
    accessorKey: 'is_active',
    header: 'STATUS',
    cell: ({ cell }) => {
      const isActive = cell.getValue<Collection['is_active']>();
      return (
        <Badge variant={isActive ? 'default' : 'outline'}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      );
    }
  },
  {
    id: 'sort_order',
    accessorKey: 'sort_order',
    header: 'SORT ORDER'
  },
  {
    id: 'updated_at',
    accessorKey: 'updated_at',
    header: 'LAST UPDATED',
    cell: ({ cell }) => {
      const date = cell.getValue<Collection['updated_at']>();
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
