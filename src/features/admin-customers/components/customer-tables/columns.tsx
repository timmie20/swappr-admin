'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { formatKobo, formatLagosDateTime } from '@/lib/format';
import { Column, ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { AdminCustomerRow, customerName } from '../../types/customer.types';

type Col = Column<AdminCustomerRow, unknown>;

// Column ids that are sortable match the API's sort_by values
export const columns: ColumnDef<AdminCustomerRow>[] = [
  {
    id: 'name',
    header: 'CUSTOMER',
    cell: ({ row }) => {
      const c = row.original;
      const name = customerName(c);
      return (
        <Link
          href={`/dashboard/customers/${c.id}`}
          className='flex items-center gap-3 hover:underline'
        >
          <Avatar className='h-8 w-8'>
            {c.avatar_url && <AvatarImage src={c.avatar_url} alt='' />}
            <AvatarFallback>
              {`${c.first_name?.[0] ?? ''}${c.last_name?.[0] ?? ''}`.toUpperCase() ||
                '—'}
            </AvatarFallback>
          </Avatar>
          <span className='flex items-center gap-1.5 font-medium'>
            {name}
            {!c.is_active && <Badge variant='destructive'>Inactive</Badge>}
          </span>
        </Link>
      );
    }
  },
  {
    id: 'email',
    header: 'EMAIL',
    cell: ({ row }) => (
      <span className='flex flex-wrap items-center gap-1.5'>
        {row.original.email}
        {!row.original.email_verified && (
          <Badge variant='outline'>Unverified</Badge>
        )}
      </span>
    )
  },
  {
    id: 'auth_provider',
    header: 'SIGN-IN',
    cell: ({ row }) =>
      row.original.auth_provider === 'google' ? 'Google' : 'Email'
  },
  {
    id: 'orders_count',
    accessorKey: 'orders_count',
    header: ({ column }: { column: Col }) => (
      <DataTableColumnHeader column={column} title='Paid orders' />
    ),
    cell: ({ row }) => row.original.orders_count.toLocaleString('en-NG'),
    enableSorting: true
  },
  {
    id: 'total_paid_kobo',
    accessorKey: 'total_paid_kobo',
    header: ({ column }: { column: Col }) => (
      <DataTableColumnHeader column={column} title='Total paid' />
    ),
    cell: ({ row }) => (
      <span className='font-medium tabular-nums'>
        {formatKobo(row.original.total_paid_kobo)}
      </span>
    ),
    enableSorting: true
  },
  {
    id: 'last_order_at',
    header: 'LAST ORDER',
    cell: ({ row }) => (
      <span className='text-sm whitespace-nowrap'>
        {row.original.last_order_at
          ? formatLagosDateTime(row.original.last_order_at)
          : '—'}
      </span>
    )
  },
  {
    id: 'created_at',
    accessorKey: 'created_at',
    header: ({ column }: { column: Col }) => (
      <DataTableColumnHeader column={column} title='Joined' />
    ),
    cell: ({ row }) => (
      <span className='text-sm whitespace-nowrap'>
        {formatLagosDateTime(row.original.created_at)}
      </span>
    ),
    enableSorting: true
  },
  {
    id: 'last_sign_in_at',
    accessorKey: 'last_sign_in_at',
    header: ({ column }: { column: Col }) => (
      <DataTableColumnHeader column={column} title='Last sign-in' />
    ),
    cell: ({ row }) => (
      <span className='text-sm whitespace-nowrap'>
        {row.original.last_sign_in_at
          ? formatLagosDateTime(row.original.last_sign_in_at)
          : 'Never'}
      </span>
    ),
    enableSorting: true
  }
];
