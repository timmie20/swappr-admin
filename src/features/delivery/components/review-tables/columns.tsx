'use client';

import { Badge } from '@/components/ui/badge';
import {
  formatCalendarDate,
  formatLagosDateTime,
  formatNaira
} from '@/lib/format';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import {
  DeliveryReview,
  DeliveryReviewStatus
} from '../../types/delivery.types';
import { ReviewActions } from './cell-action';

const STATUS_VARIANT: Record<
  DeliveryReviewStatus,
  'default' | 'secondary' | 'outline'
> = {
  [DeliveryReviewStatus.OPEN]: 'secondary',
  [DeliveryReviewStatus.CONFIRMED]: 'default',
  [DeliveryReviewStatus.CLOSED]: 'outline'
};

function hoursLabel(hours: number | null): string {
  if (hours === null) return 'Ship time unknown';
  if (hours < 48) return `${hours}h since shipped`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h since shipped`;
}

export const columns: ColumnDef<DeliveryReview>[] = [
  {
    id: 'order',
    header: 'ORDER',
    cell: ({ row }) => {
      const order = row.original.order;
      if (!order) return '—';
      return (
        <div className='flex flex-col gap-0.5'>
          <Link
            href={`/dashboard/orders/${order.order_number}`}
            className='font-mono text-xs font-medium hover:underline'
          >
            {order.order_number}
          </Link>
          <span className='text-xs'>{formatNaira(order.total_amount)}</span>
          <span className='text-muted-foreground text-xs capitalize'>
            {order.status}
          </span>
        </div>
      );
    }
  },
  {
    id: 'customer',
    header: 'CUSTOMER',
    cell: ({ row }) => {
      const { customer, order } = row.original;
      const name = [customer?.first_name, customer?.last_name]
        .filter(Boolean)
        .join(' ');
      return (
        <div className='flex flex-col gap-0.5'>
          <span className='font-medium'>{name || '—'}</span>
          {order?.contact_phone && (
            <a
              href={`tel:${order.contact_phone}`}
              className='text-xs hover:underline'
            >
              {order.contact_phone}
            </a>
          )}
          {customer?.email && (
            <a
              href={`mailto:${customer.email}`}
              className='text-muted-foreground text-xs hover:underline'
            >
              {customer.email}
            </a>
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
        <div className='flex flex-col gap-0.5'>
          <span className='font-medium'>
            {vendor?.business_name || vendor?.trading_name || '—'}
          </span>
          {vendor?.contact_number && (
            <a
              href={`tel:${vendor.contact_number}`}
              className='text-xs hover:underline'
            >
              {vendor.contact_number}
            </a>
          )}
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
    id: 'shipment',
    header: 'SHIPMENT',
    cell: ({ row }) => {
      const { order, hours_since_shipped } = row.original;
      const f = order?.fulfillment;
      return (
        <div className='flex flex-col gap-0.5 text-xs'>
          <span className='font-medium'>{hoursLabel(hours_since_shipped)}</span>
          {order?.fulfillment_ready_at && (
            <span className='text-muted-foreground'>
              Shipped {formatLagosDateTime(order.fulfillment_ready_at)}
            </span>
          )}
          {f && (
            <span className='text-muted-foreground capitalize'>
              {f.fulfillment_type}
              {f.fulfillment_type === 'delivery' && f.estimated_arrival
                ? ` · ETA ${formatCalendarDate(f.estimated_arrival)}`
                : ''}
              {f.fulfillment_type === 'pickup' && f.pickup_date
                ? ` · ${formatCalendarDate(f.pickup_date)}`
                : ''}
            </span>
          )}
          {f?.rider_name && (
            <span className='text-muted-foreground'>
              Rider: {f.rider_name}
              {f.rider_phone ? ` (${f.rider_phone})` : ''}
            </span>
          )}
          {order?.tracking_number && (
            <span className='text-muted-foreground font-mono'>
              {order.tracking_number}
            </span>
          )}
        </div>
      );
    }
  },
  {
    id: 'status',
    header: 'REVIEW',
    cell: ({ row }) => (
      <div className='flex flex-col gap-1'>
        <Badge
          variant={STATUS_VARIANT[row.original.status] ?? 'outline'}
          className='capitalize'
        >
          {row.original.status}
        </Badge>
        <span className='text-muted-foreground text-xs'>
          Requested {formatLagosDateTime(row.original.created_at)}
        </span>
      </div>
    )
  },
  {
    id: 'actions',
    header: 'ACTIONS',
    cell: ({ row }) => <ReviewActions review={row.original} />
  }
];
