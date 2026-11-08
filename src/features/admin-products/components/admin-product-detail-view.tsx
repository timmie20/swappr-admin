'use client';

import { DetailRow } from '@/components/detail-row';
import { SectionError } from '@/components/section-error';
import { StatTile, StatTileSkeleton } from '@/components/stat-tile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { TILE_GRID } from '@/features/admin-vendors/components/vendor-overview-tab';
import { TierBadge } from '@/features/admin-vendors/components/vendor-badges';
import { BADGE_LABEL } from '@/features/admin-vendors/types/vendor.types';
import { formatKobo, formatLagosDateTime } from '@/lib/format';
import { IconAlertTriangle, IconArrowLeft } from '@tabler/icons-react';
import { isAxiosError } from 'axios';
import Link from 'next/link';
import { useState } from 'react';
import { useAdminProduct } from '../hooks/use-admin-products';
import {
  AdminProductDetail,
  CONDITION_LABEL,
  HIDDEN_REASON_HELP,
  HIDDEN_REASON_LABEL,
  MODE_LABEL,
  PLATFORM_LABEL,
  productVendorName
} from '../types/product.types';
import { ProductActionsCard } from './product-actions-card';
import { ProductStateBadges } from './product-badges';
import { ProductThumb } from './product-columns';
import { ProductHistory } from './product-history';

const n = (value: number) => value.toLocaleString('en-NG');
const humanise = (key: string) =>
  key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

function SpecValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === '') return <>—</>;
  if (typeof value === 'boolean') return <>{value ? 'Yes' : 'No'}</>;
  if (Array.isArray(value)) {
    return (
      <>
        {value
          .map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v)))
          .join(', ')}
      </>
    );
  }
  if (typeof value === 'object') return <>{JSON.stringify(value)}</>;
  return <>{String(value)}</>;
}

function Gallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  if (!images.length) {
    return (
      <div className='bg-muted text-muted-foreground flex aspect-square w-full items-center justify-center rounded-md border text-sm'>
        No images
      </div>
    );
  }
  const current = images[Math.min(active, images.length - 1)];
  return (
    <div className='space-y-2'>
      <a href={current} target='_blank' rel='noreferrer'>
        {/* eslint-disable-next-line @next/next/no-img-element -- remote vendor images */}
        <img
          src={current}
          alt={name}
          className='aspect-square w-full rounded-md border object-contain'
        />
      </a>
      {images.length > 1 && (
        <div className='flex flex-wrap gap-2'>
          {images.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type='button'
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              className={`rounded-md ${i === active ? 'ring-primary ring-2' : ''}`}
            >
              <ProductThumb src={url} className='h-14 w-14' />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function HiddenNote({ product }: { product: AdminProductDetail }) {
  if (!product.hidden_reasons.length) return null;
  return (
    <Alert className='border-amber-500/50 text-amber-700 dark:text-amber-400 [&>svg]:text-current'>
      <IconAlertTriangle className='h-4 w-4' />
      <AlertTitle>Why it’s hidden from the storefront</AlertTitle>
      <AlertDescription>
        <ul className='list-disc space-y-1 pl-4'>
          {product.hidden_reasons.map((reason) => (
            <li key={reason}>
              <span className='font-medium'>
                {HIDDEN_REASON_LABEL[reason] ?? humanise(reason)}.
              </span>{' '}
              {HIDDEN_REASON_HELP[reason]}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

function StoreCard({ vendor }: { vendor: AdminProductDetail['vendor'] }) {
  const name = productVendorName(vendor);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Store</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        <Link
          href={`/dashboard/vendors/${vendor.id}`}
          className='flex items-center gap-3 hover:underline'
        >
          <Avatar className='h-10 w-10'>
            {vendor.logo_url && <AvatarImage src={vendor.logo_url} alt='' />}
            <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className='font-medium'>{name}</span>
        </Link>
        <div className='flex flex-wrap gap-1'>
          <TierBadge tier={vendor.tier} />
          {vendor.archived_at && <Badge variant='destructive'>Archived</Badge>}
          {vendor.suspended_at && (
            <Badge variant='destructive'>Suspended</Badge>
          )}
          {!vendor.store_active &&
            !vendor.suspended_at &&
            !vendor.archived_at && (
              <Badge variant='outline'>Store not active</Badge>
            )}
          {vendor.badges.map((badge) => (
            <Badge key={badge} variant='secondary'>
              {BADGE_LABEL[badge] ?? badge}
            </Badge>
          ))}
        </div>
        {vendor.suspended_at && (
          <p className='text-muted-foreground text-xs'>
            Suspended {formatLagosDateTime(vendor.suspended_at)}
          </p>
        )}
        <Button variant='outline' size='sm' asChild>
          <Link href={`/dashboard/vendors/${vendor.id}?tab=products`}>
            All listings from this store
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ActivityTiles({
  activity
}: {
  activity: AdminProductDetail['activity'] | undefined;
}) {
  if (!activity) {
    return (
      <div className={TILE_GRID}>
        {Array.from({ length: 4 }, (_, i) => (
          <StatTileSkeleton key={i} />
        ))}
      </div>
    );
  }
  const { orders } = activity;
  return (
    <div className={TILE_GRID}>
      <StatTile
        label='Orders'
        value={n(orders.total)}
        sublabel={`${n(orders.completed)} completed · ${n(orders.cancelled)} cancelled`}
      />
      <StatTile
        label='Open orders'
        value={n(
          orders.needs_action +
            orders.awaiting_payment +
            orders.awaiting_delivery_confirmation
        )}
        sublabel={`${n(orders.needs_action)} need action · ${n(orders.awaiting_payment)} awaiting payment · ${n(orders.awaiting_delivery_confirmation)} awaiting delivery confirmation`}
        tone={orders.needs_action > 0 ? 'warning' : 'default'}
      />
      <StatTile
        label='Units sold'
        value={n(activity.units_sold)}
        sublabel={
          activity.last_ordered_at
            ? `Last ordered ${formatLagosDateTime(activity.last_ordered_at)}`
            : 'Never ordered'
        }
      />
      <StatTile
        label='In carts'
        value={n(activity.in_carts)}
        sublabel='Carts holding it now'
      />
    </div>
  );
}

export default function AdminProductDetailView({
  productId
}: {
  productId: string;
}) {
  const query = useAdminProduct(productId);
  const product = query.data;

  const status = isAxiosError(query.error) ? query.error.response?.status : 0;
  if (status === 404 || status === 400) {
    return (
      <Alert>
        <AlertTitle>Listing not found</AlertTitle>
        <AlertDescription>
          <p>
            It may have been deleted permanently. Archived listings still open
            here.
          </p>
          <Link href='/dashboard/product' className='underline'>
            Back to products
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  const specs = Object.entries(product?.specifications ?? {});

  return (
    <div className='w-full space-y-6'>
      <div className='flex flex-wrap items-center gap-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link href='/dashboard/product' aria-label='Back to products'>
            <IconArrowLeft className='h-4 w-4' />
          </Link>
        </Button>
        {product ? (
          <div className='min-w-0 space-y-1.5'>
            <h2 className='text-2xl font-bold tracking-tight break-words'>
              {product.name}
            </h2>
            <div className='flex flex-wrap items-center gap-1.5'>
              <ProductStateBadges
                product={product}
                hiddenReasons={product.hidden_reasons}
              />
              <span className='text-muted-foreground text-sm'>
                {product.base_price_kobo === null
                  ? 'No price'
                  : formatKobo(product.base_price_kobo)}
                {' · '}
                <Link
                  href={`/dashboard/vendors/${product.vendor.id}`}
                  className='hover:underline'
                >
                  {productVendorName(product.vendor)}
                </Link>
              </span>
            </div>
          </div>
        ) : query.error ? null : (
          <div className='space-y-2'>
            <Skeleton className='h-7 w-64' />
            <Skeleton className='h-5 w-80' />
          </div>
        )}
      </div>

      {query.error ? (
        <SectionError
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
          what='this listing'
        />
      ) : (
        <>
          {product && <HiddenNote product={product} />}
          <ActivityTiles activity={product?.activity} />

          {!product ? (
            <Skeleton className='h-96 w-full' />
          ) : (
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
              <div className='space-y-6 lg:col-span-2'>
                <Card>
                  <CardContent className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                    <Gallery images={product.images} name={product.name} />
                    <div className='space-y-2'>
                      <p className='text-sm font-medium'>Description</p>
                      {product.description ? (
                        <p className='text-muted-foreground text-sm whitespace-pre-wrap'>
                          {product.description}
                        </p>
                      ) : (
                        <p className='text-muted-foreground text-sm'>
                          No description
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Variants</CardTitle>
                    <CardDescription>
                      {product.variants.length
                        ? `${n(product.total_stock)} in stock across ${product.variants.length} variant${product.variants.length === 1 ? '' : 's'}`
                        : `No variants · ${n(product.total_stock)} in stock`}
                    </CardDescription>
                  </CardHeader>
                  {product.variants.length > 0 && (
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>SKU</TableHead>
                            <TableHead>Storage</TableHead>
                            <TableHead>Colour</TableHead>
                            <TableHead className='text-right'>Price</TableHead>
                            <TableHead className='text-right'>Stock</TableHead>
                            <TableHead className='text-right'>
                              Reserved
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {product.variants.map((v) => (
                            <TableRow key={v.id}>
                              <TableCell className='font-mono text-xs'>
                                {v.sku ?? '—'}
                              </TableCell>
                              <TableCell>{v.storage ?? '—'}</TableCell>
                              <TableCell>{v.color ?? '—'}</TableCell>
                              <TableCell className='text-right tabular-nums'>
                                {v.price_kobo === null
                                  ? '—'
                                  : formatKobo(v.price_kobo)}
                              </TableCell>
                              <TableCell
                                className={`text-right tabular-nums ${v.stock_quantity <= 0 ? 'text-destructive' : ''}`}
                              >
                                {n(v.stock_quantity)}
                              </TableCell>
                              <TableCell className='text-muted-foreground text-right tabular-nums'>
                                {n(v.reserved_stock)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  )}
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Specifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {specs.length ? (
                      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                        {specs.map(([key, value]) => (
                          <DetailRow
                            key={key}
                            label={humanise(key)}
                            value={<SpecValue value={value} />}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className='text-muted-foreground text-sm'>
                        No specifications
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className='space-y-6'>
                <ProductActionsCard product={product} />
                <StoreCard vendor={product.vendor} />
                <Card>
                  <CardHeader>
                    <CardTitle>Details</CardTitle>
                  </CardHeader>
                  <CardContent className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2'>
                    <DetailRow label='Category' value={product.category.name} />
                    <DetailRow
                      label='Subcategory'
                      value={product.subcategory?.name}
                    />
                    <DetailRow
                      label='Brand'
                      value={product.brand?.brand_name}
                    />
                    <DetailRow
                      label='Condition'
                      value={
                        product.condition
                          ? CONDITION_LABEL[product.condition]
                          : null
                      }
                    />
                    <DetailRow
                      label='Platform'
                      value={
                        product.platform
                          ? (PLATFORM_LABEL[product.platform] ??
                            product.platform)
                          : null
                      }
                    />
                    <DetailRow label='Series' value={product.series} />
                    <DetailRow
                      label='Carrier'
                      value={
                        product.carrier_status
                          ? humanise(product.carrier_status)
                          : null
                      }
                    />
                    <DetailRow
                      label='Mode'
                      value={product.mode ? MODE_LABEL[product.mode] : null}
                    />
                    <DetailRow
                      label='Swappable'
                      value={product.is_swappable ? 'Yes' : 'No'}
                    />
                    <DetailRow label='Slug' value={product.slug} mono />
                    <DetailRow
                      label='Created'
                      value={formatLagosDateTime(product.created_at)}
                    />
                    <DetailRow
                      label='Updated'
                      value={formatLagosDateTime(product.updated_at)}
                    />
                    {product.archived_at && (
                      <DetailRow
                        label='Archived'
                        value={formatLagosDateTime(product.archived_at)}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </>
      )}

      <div className='space-y-3'>
        <h3 className='text-lg font-semibold'>History</h3>
        <ProductHistory productId={productId} />
      </div>
    </div>
  );
}
