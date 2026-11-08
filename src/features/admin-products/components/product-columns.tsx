'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { formatKobo, formatLagosDateTime } from '@/lib/format';
import { IconPhoto } from '@tabler/icons-react';
import { Column, ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import {
  AdminProductRow,
  CONDITION_LABEL,
  productVendorName
} from '../types/product.types';
import { ProductStateBadges, StockCell } from './product-badges';

type Col = Column<AdminProductRow, unknown>;

export const productHref = (id: string) => `/dashboard/product/${id}`;

export function ProductThumb({
  src,
  className = 'h-10 w-10'
}: {
  src: string | null;
  className?: string;
}) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- remote vendor images
    <img
      src={src}
      alt=''
      className={`${className} shrink-0 rounded-md border object-cover`}
    />
  ) : (
    <div
      className={`${className} bg-muted text-muted-foreground flex shrink-0 items-center justify-center rounded-md border`}
    >
      <IconPhoto className='h-4 w-4' />
    </div>
  );
}

/**
 * Admin product list columns. Sortable column ids match the API's sort_by
 * values. The vendor Products tab passes showVendor: false.
 */
export function productColumns(opts?: {
  showVendor?: boolean;
}): ColumnDef<AdminProductRow>[] {
  const showVendor = opts?.showVendor ?? true;
  return [
    {
      id: 'name',
      accessorKey: 'name',
      header: ({ column }: { column: Col }) => (
        <DataTableColumnHeader column={column} title='Product' />
      ),
      cell: ({ row }) => {
        const p = row.original;
        const meta = [
          p.brand?.brand_name,
          p.subcategory?.name ?? p.category.name,
          p.condition ? CONDITION_LABEL[p.condition] : null
        ].filter(Boolean);
        return (
          <Link
            href={productHref(p.id)}
            className='flex min-w-[220px] items-center gap-3 hover:underline'
          >
            <ProductThumb src={p.image} />
            <span className='flex min-w-0 flex-col'>
              <span className='truncate font-medium'>{p.name}</span>
              <span className='text-muted-foreground truncate text-xs'>
                {meta.join(' · ')}
              </span>
            </span>
          </Link>
        );
      },
      enableSorting: true
    },
    ...(showVendor
      ? [
          {
            id: 'vendor',
            header: 'STORE',
            cell: ({ row }) => {
              const v = row.original.vendor;
              const name = productVendorName(v);
              return (
                <Link
                  href={`/dashboard/vendors/${v.id}`}
                  className='flex items-center gap-2 hover:underline'
                >
                  <Avatar className='h-6 w-6'>
                    {v.logo_url && <AvatarImage src={v.logo_url} alt='' />}
                    <AvatarFallback className='text-[10px]'>
                      {name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className='text-sm'>{name}</span>
                </Link>
              );
            }
          } satisfies ColumnDef<AdminProductRow>
        ]
      : []),
    {
      id: 'base_price',
      accessorKey: 'base_price_kobo',
      header: ({ column }: { column: Col }) => (
        <DataTableColumnHeader column={column} title='Price' />
      ),
      cell: ({ row }) => (
        <span className='whitespace-nowrap tabular-nums'>
          {row.original.base_price_kobo === null
            ? '—'
            : formatKobo(row.original.base_price_kobo)}
        </span>
      ),
      enableSorting: true
    },
    {
      id: 'total_stock',
      accessorKey: 'total_stock',
      header: ({ column }: { column: Col }) => (
        <DataTableColumnHeader column={column} title='Stock' />
      ),
      cell: ({ row }) => (
        <div className='flex flex-col gap-0.5'>
          <StockCell
            total={row.original.total_stock}
            status={row.original.status}
          />
          {row.original.variant_count > 1 && (
            <span className='text-muted-foreground text-xs'>
              {row.original.variant_count} variants
            </span>
          )}
        </div>
      ),
      enableSorting: true
    },
    {
      id: 'state',
      header: 'STATUS',
      cell: ({ row }) => <ProductStateBadges product={row.original} />
    },
    {
      id: 'created_at',
      accessorKey: 'created_at',
      header: ({ column }: { column: Col }) => (
        <DataTableColumnHeader column={column} title='Created' />
      ),
      cell: ({ row }) => (
        <span className='text-sm whitespace-nowrap'>
          {formatLagosDateTime(row.original.created_at)}
        </span>
      ),
      enableSorting: true
    },
    {
      id: 'updated_at',
      accessorKey: 'updated_at',
      header: ({ column }: { column: Col }) => (
        <DataTableColumnHeader column={column} title='Updated' />
      ),
      cell: ({ row }) => (
        <span className='text-muted-foreground text-sm whitespace-nowrap'>
          {formatLagosDateTime(row.original.updated_at)}
        </span>
      ),
      enableSorting: true
    }
  ];
}
