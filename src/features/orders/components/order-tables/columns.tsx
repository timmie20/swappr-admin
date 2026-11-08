'use client';

import { Button } from '@/components/ui/button';
import { formatLagosDateTime, formatNaira } from '@/lib/format';
import { ColumnDef } from '@tanstack/react-table';
import { IconEye } from '@tabler/icons-react';
import Link from 'next/link';
import { AdminOrderListItem } from '../../types/order.types';
import { OrderStatusBadge, PaymentStatusBadge } from '../order-status-badge';

export const columns: ColumnDef<AdminOrderListItem>[] = [
  {
    id: 'order_number',
    header: 'ORDER',
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <Link
          href={`/dashboard/orders/${row.original.order_number}`}
          className='font-mono text-xs font-medium hover:underline'
        >
          {row.original.order_number}
        </Link>
        <span className='text-muted-foreground text-xs capitalize'>
          {row.original.order_type}
        </span>
      </div>
    )
  },
  {
    id: 'buyer',
    header: 'CUSTOMER',
    cell: ({ row }) => {
      const buyer = row.original.buyer;
      const name = [buyer?.first_name, buyer?.last_name]
        .filter(Boolean)
        .join(' ');
      return (
        <div className='flex flex-col'>
          <span className='font-medium'>{name || '—'}</span>
          {buyer?.email && (
            <span className='text-muted-foreground text-xs'>{buyer.email}</span>
          )}
        </div>
      );
    }
  },
  {
    id: 'vendor',
    header: 'VENDOR',
    cell: ({ row }) => {
      const vendor = row.original.vendor;
      return (
        <span>{vendor?.business_name || vendor?.trading_name || '—'}</span>
      );
    }
  },
  {
    id: 'total_amount',
    header: 'TOTAL',
    cell: ({ row }) => (
      <span className='font-medium'>
        {formatNaira(row.original.total_amount)}
      </span>
    )
  },
  {
    id: 'status',
    header: 'STATUS',
    cell: ({ row }) => <OrderStatusBadge status={row.original.status} />
  },
  {
    id: 'payment_status',
    header: 'PAYMENT',
    cell: ({ row }) => (
      <PaymentStatusBadge status={row.original.payment_status} />
    )
  },
  {
    id: 'created_at',
    header: 'CREATED',
    cell: ({ row }) => (
      <span className='text-sm'>
        {formatLagosDateTime(row.original.created_at)}
      </span>
    )
  },
  {
    id: 'actions',
    header: 'ACTIONS',
    cell: ({ row }) => (
      <Button variant='ghost' size='sm' asChild>
        <Link href={`/dashboard/orders/${row.original.order_number}`}>
          <IconEye className='mr-1 h-4 w-4' /> View
        </Link>
      </Button>
    )
  }
];
