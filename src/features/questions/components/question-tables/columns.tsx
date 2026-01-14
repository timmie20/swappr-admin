'use client';

import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Question } from '../../types/question.types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Question>[] = [
  {
    id: 'text',
    accessorKey: 'text',
    header: ({ column }: { column: Column<Question, unknown> }) => (
      <DataTableColumnHeader column={column} title='Question' />
    ),
    cell: ({ cell }) => (
      <div className='max-w-md font-medium'>
        {cell.getValue<Question['text']>()}
      </div>
    )
  },
  {
    id: 'type',
    accessorKey: 'type',
    header: ({ column }: { column: Column<Question, unknown> }) => (
      <DataTableColumnHeader column={column} title='Type' />
    ),
    cell: ({ cell }) => {
      const type = cell.getValue<Question['type']>();
      return (
        <Badge variant='outline' className='capitalize'>
          {type}
        </Badge>
      );
    }
  },
  {
    id: 'brand',
    accessorKey: 'brand',
    header: ({ column }: { column: Column<Question, unknown> }) => (
      <DataTableColumnHeader column={column} title='Brand' />
    ),
    cell: ({ row }) => {
      const brand = row.original.brand;
      return (
        <div className='font-medium'>
          {brand ? brand.brand_name : 'Universal'}
        </div>
      );
    }
  },
  {
    id: 'slug',
    accessorKey: 'slug',
    header: 'Slug'
  },
  {
    id: 'created_at',
    accessorKey: 'created_at',
    header: 'Created at',
    cell: ({ cell }) => {
      const date = cell.getValue<Question['created_at']>();
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
    header: 'Last Updated',
    cell: ({ cell }) => {
      const date = cell.getValue<Question['updated_at']>();
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
    header: 'Actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
