'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Payout, PayoutStatus } from '../../types/payout.types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { formatDate, formatNaira } from '@/lib/format';
import { CellAction } from './cell-action';

const STATUS_BADGE_VARIANT: Record<
  PayoutStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  [PayoutStatus.PENDING]: 'outline',
  [PayoutStatus.PROCESSING]: 'secondary',
  [PayoutStatus.COMPLETED]: 'default',
  [PayoutStatus.FAILED]: 'destructive'
};

export const columns: ColumnDef<Payout>[] = [
  {
    id: 'vendor',
    header: 'VENDOR',
    cell: ({ row }) => {
      const vendor = row.original.vendor;
      return (
        <div className='flex flex-col'>
          <span className='font-medium'>
            {vendor?.business_name || vendor?.trading_name || 'Unknown vendor'}
          </span>
          {vendor?.contact_email && (
            <span className='text-muted-foreground text-xs'>
              {vendor.contact_email}
            </span>
          )}
        </div>
      );
    }
  },
  {
    id: 'order_number',
    accessorKey: 'order_number',
    header: 'ORDER',
    cell: ({ cell }) => (
      <span className='text-muted-foreground text-xs'>
        {cell.getValue<Payout['order_number']>() || '—'}
      </span>
    )
  },
  {
    id: 'transfer_reference',
    accessorKey: 'transfer_reference',
    header: 'REFERENCE',
    cell: ({ cell }) => (
      <span className='text-muted-foreground font-mono text-xs'>
        {cell.getValue<Payout['transfer_reference']>() || '—'}
      </span>
    )
  },
  {
    id: 'net_amount',
    accessorKey: 'net_amount',
    header: ({ column }: { column: Column<Payout, unknown> }) => (
      <DataTableColumnHeader column={column} title='Net Amount' />
    ),
    cell: ({ cell }) => (
      <span className='font-medium'>
        {formatNaira(cell.getValue<Payout['net_amount']>())}
      </span>
    ),
    enableSorting: true
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }: { column: Column<Payout, unknown> }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ cell }) => {
      const status = cell.getValue<Payout['status']>();
      return (
        <Badge variant={STATUS_BADGE_VARIANT[status]} className='capitalize'>
          {status}
        </Badge>
      );
    },
    enableSorting: true
  },
  {
    id: 'completed_at',
    accessorKey: 'completed_at',
    header: ({ column }: { column: Column<Payout, unknown> }) => (
      <DataTableColumnHeader column={column} title='Completed' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<Payout['completed_at']>();
      return (
        <div>
          {date
            ? formatDate(date, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })
            : '—'}
        </div>
      );
    },
    enableSorting: true
  },
  {
    id: 'created_at',
    accessorKey: 'created_at',
    header: ({ column }: { column: Column<Payout, unknown> }) => (
      <DataTableColumnHeader column={column} title='Created' />
    ),
    cell: ({ cell }) => (
      <div>
        {formatDate(cell.getValue<Payout['created_at']>(), {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })}
      </div>
    ),
    enableSorting: true
  },
  {
    id: 'actions',
    header: 'ACTIONS',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
