'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { formatLagosDateTime, formatNaira } from '@/lib/format';
import { ColumnDef } from '@tanstack/react-table';
import { IconAlertTriangle, IconEye, IconPaperclip } from '@tabler/icons-react';
import Link from 'next/link';
import { AdminPayoutRow, PayoutStatus } from '../../types/payout.types';
import { PayoutStatusBadge } from '../payout-status-badge';

// The timestamp that matters for each state
function stateDate(payout: AdminPayoutRow): string | null {
  switch (payout.status) {
    case PayoutStatus.APPROVED:
      return payout.approved_at;
    case PayoutStatus.COMPLETED:
      return payout.paid_at;
    case PayoutStatus.REJECTED:
      return payout.rejected_at;
    default:
      return payout.requested_at ?? payout.created_at;
  }
}

export const columns: ColumnDef<AdminPayoutRow>[] = [
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
          {vendor?.contact_number && (
            <span className='text-muted-foreground text-xs'>
              {vendor.contact_number}
            </span>
          )}
        </div>
      );
    }
  },
  {
    id: 'order_number',
    header: 'ORDER',
    cell: ({ row }) =>
      row.original.order_number ? (
        <Link
          href={`/dashboard/orders/${row.original.order_number}`}
          className='font-mono text-xs hover:underline'
        >
          {row.original.order_number}
        </Link>
      ) : (
        <span className='text-muted-foreground text-xs'>—</span>
      )
  },
  {
    id: 'net_amount',
    header: 'AMOUNT',
    cell: ({ row }) => (
      <div className='flex items-center gap-1.5'>
        <span className='font-medium'>
          {formatNaira(row.original.net_amount ?? undefined)}
        </span>
        {row.original.operating_balance_below_amount && (
          <Tooltip>
            <TooltipTrigger asChild>
              <IconAlertTriangle
                className='h-4 w-4 text-amber-500'
                aria-label='Operating balance below amount'
              />
            </TooltipTrigger>
            <TooltipContent>
              The ledger’s operating account holds less than this payout — the
              Paystack settlement may not have landed yet.
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    )
  },
  {
    id: 'status',
    header: 'STATUS',
    cell: ({ row }) => (
      <div className='flex items-center gap-1.5'>
        <PayoutStatusBadge status={row.original.status} />
        {row.original.has_receipt && (
          <Badge variant='outline' className='gap-1'>
            <IconPaperclip /> Receipt
          </Badge>
        )}
      </div>
    )
  },
  {
    id: 'reference',
    header: 'BANK REF / NARRATION',
    cell: ({ row }) => (
      <span className='text-muted-foreground font-mono text-xs'>
        {row.original.bank_transfer_reference || row.original.narration}
      </span>
    )
  },
  {
    id: 'date',
    header: 'SINCE',
    cell: ({ row }) => (
      <span className='text-sm'>
        {formatLagosDateTime(stateDate(row.original))}
      </span>
    )
  },
  {
    id: 'actions',
    header: 'ACTIONS',
    cell: ({ row }) => (
      <Button variant='ghost' size='sm' asChild>
        <Link href={`/dashboard/payout/${row.original.id}`}>
          <IconEye className='mr-1 h-4 w-4' />
          {row.original.status === PayoutStatus.REQUESTED ||
          row.original.status === PayoutStatus.APPROVED
            ? 'Review'
            : 'View'}
        </Link>
      </Button>
    )
  }
];
