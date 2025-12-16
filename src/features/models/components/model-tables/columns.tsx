'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { formatDate, formatStorageCapacity } from '@/lib/format';
import { Column, ColumnDef } from '@tanstack/react-table';
import { HardDrive, Text } from 'lucide-react';
import { Model } from '../../types/models.types';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Model>[] = [
  // {
  //   accessorKey: 'photo_url',
  //   header: 'IMAGE',
  //   cell: ({ row }) => {
  //     return (
  //       <div className='relative aspect-square'>
  //         <Image
  //           src={row.getValue('photo_url')}
  //           alt={row.getValue('name')}
  //           fill
  //           className='rounded-lg'
  //         />
  //       </div>
  //     );
  //   }
  // },
  {
    id: 'name',
    accessorKey: 'model_name',
    header: ({ column }: { column: Column<Model, unknown> }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<Model['model_name']>()}</div>,
    meta: {
      label: 'Name',
      placeholder: 'Search Models...',
      variant: 'text',
      icon: Text
    },
    enableColumnFilter: true
  },
  {
    id: 'variations',
    accessorKey: 'variations',
    header: 'STORAGE VARIATIONS',
    cell: ({ row }) => {
      const variations = row.getValue<Model['variations']>('variations');

      if (!variations || variations.length === 0) {
        return <span className='text-muted-foreground'>No variations</span>;
      }

      return (
        <div className='flex flex-wrap gap-1'>
          {variations.map((variation) => (
            <Badge
              key={variation.id}
              variant='outline'
              className='gap-1 capitalize'
            >
              <HardDrive className='h-3 w-3' />
              {formatStorageCapacity(variation.storage_capacity)}
            </Badge>
          ))}
        </div>
      );
    }
  },
  {
    id: 'brand',
    accessorKey: 'brand.brand_name',
    header: 'BRAND'
  },
  {
    accessorKey: 'desc',
    header: 'DESCRIPTION'
  },
  {
    accessorKey: 'created_at',
    header: 'DATE CREATED',
    cell: ({ row }) => formatDate(row?.getValue('created_at'))
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
