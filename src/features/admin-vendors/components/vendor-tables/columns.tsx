'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { formatLagosDateTime } from '@/lib/format';
import { Column, ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { AdminVendorRow, vendorDisplayName } from '../../types/vendor.types';
import { OnboardingStepBadge, VendorStatusBadges } from '../vendor-badges';

const n = (value: number) => value.toLocaleString('en-NG');

// Column ids that are sortable match the API's sort_by values
export const columns: ColumnDef<AdminVendorRow>[] = [
  {
    id: 'business_name',
    accessorFn: (row) => vendorDisplayName(row),
    header: ({ column }: { column: Column<AdminVendorRow, unknown> }) => (
      <DataTableColumnHeader column={column} title='Vendor' />
    ),
    cell: ({ row }) => {
      const v = row.original;
      const name = vendorDisplayName(v);
      return (
        <Link
          href={`/dashboard/vendors/${v.id}`}
          className='flex items-center gap-3 hover:underline'
        >
          <Avatar className='h-8 w-8'>
            {v.logo_url && <AvatarImage src={v.logo_url} alt='' />}
            <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className='font-medium'>{name}</span>
        </Link>
      );
    },
    enableSorting: true
  },
  {
    id: 'owner',
    header: 'OWNER',
    cell: ({ row }) => {
      const owner = row.original.owner;
      return (
        <div className='flex flex-col gap-0.5'>
          <span className='flex items-center gap-1.5'>
            {owner.name ?? '—'}
            {!owner.is_active && <Badge variant='destructive'>Inactive</Badge>}
          </span>
          <span className='text-muted-foreground text-xs'>{owner.email}</span>
        </div>
      );
    }
  },
  {
    id: 'location',
    header: 'LOCATION',
    cell: ({ row }) =>
      [row.original.city, row.original.state].filter(Boolean).join(', ') || '—'
  },
  {
    id: 'onboarding_step',
    header: 'ONBOARDING',
    cell: ({ row }) => (
      <div className='flex flex-col gap-1'>
        <OnboardingStepBadge step={row.original.onboarding_step} />
        <VendorStatusBadges vendor={row.original} />
      </div>
    )
  },
  {
    id: 'rating',
    accessorKey: 'rating',
    header: ({ column }: { column: Column<AdminVendorRow, unknown> }) => (
      <DataTableColumnHeader column={column} title='Rating' />
    ),
    cell: ({ row }) => Number(row.original.rating).toFixed(1),
    enableSorting: true
  },
  {
    id: 'active_listings',
    header: 'LISTINGS',
    cell: ({ row }) => n(row.original.activity.active_listings)
  },
  {
    id: 'needs_action',
    header: 'NEEDS ACTION',
    cell: ({ row }) => {
      const count = row.original.activity.needs_action_orders;
      return (
        <span className={count > 0 ? 'font-medium' : 'text-muted-foreground'}>
          {n(count)}
        </span>
      );
    }
  },
  {
    id: 'open_requests',
    header: 'OPEN REQUESTS',
    cell: ({ row }) => {
      const a = row.original.activity;
      const count = a.open_delivery_reviews + a.open_payout_requests;
      return (
        <span className={count > 0 ? 'font-medium' : 'text-muted-foreground'}>
          {n(count)}
        </span>
      );
    }
  },
  {
    id: 'created_at',
    accessorKey: 'created_at',
    header: ({ column }: { column: Column<AdminVendorRow, unknown> }) => (
      <DataTableColumnHeader column={column} title='Joined' />
    ),
    cell: ({ row }) => (
      <span className='text-sm whitespace-nowrap'>
        {formatLagosDateTime(row.original.created_at)}
      </span>
    ),
    enableSorting: true
  }
];
