'use client';

import { formatKobo } from '@/lib/format';
import { cn } from '@/lib/utils';
import { UseQueryResult } from '@tanstack/react-query';
import {
  useOverviewFinance,
  useOverviewMarketplace,
  useOverviewPayouts,
  useOverviewUsers,
  useOverviewVendors
} from '../hooks/use-overview';
import { Overview } from '../types/overview.types';
import { SectionError } from '@/components/section-error';
import {
  StatTile,
  StatTileProps,
  StatTileSkeleton
} from '@/components/stat-tile';

const n = (value: number) => value.toLocaleString('en-NG');

// Amber only when there is something to look at
const warnIf = (count: number) => (count > 0 ? 'warning' : 'default');

function TileSection<T>({
  title,
  query,
  tileCount,
  tiles
}: {
  title: string;
  query: UseQueryResult<Overview<T>, unknown>;
  tileCount: 3 | 4;
  tiles: (data: T) => StatTileProps[];
}) {
  return (
    <section className='space-y-2'>
      <h3 className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
        {title}
      </h3>
      {query.error ? (
        <SectionError
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
          what={title.toLowerCase()}
        />
      ) : (
        <div
          className={cn(
            '*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2',
            tileCount === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
          )}
        >
          {query.data
            ? tiles(query.data.data).map((tile) => (
                <StatTile key={tile.label} {...tile} />
              ))
            : Array.from({ length: tileCount }).map((_, i) => (
                <StatTileSkeleton key={i} />
              ))}
        </div>
      )}
    </section>
  );
}

export function UsersSection({
  query
}: {
  query: ReturnType<typeof useOverviewUsers>;
}) {
  return (
    <TileSection
      title='Users'
      query={query}
      tileCount={3}
      tiles={(d) => {
        const { today, same_time_yesterday: yesterday } = d.signup_trend;
        const diff = today - yesterday;
        return [
          {
            label: 'Total Customers',
            value: n(d.total_customers),
            sublabel: 'All registered customers',
            href: '/dashboard/customers'
          },
          {
            label: 'New Signups Today',
            value: n(
              d.new_signups_today.customers + d.new_signups_today.vendors
            ),
            sublabel: `${n(d.new_signups_today.customers)} customers · ${n(d.new_signups_today.vendors)} vendors`
          },
          {
            label: 'Signup Trend',
            value: n(today),
            sublabel: `vs ${n(yesterday)} this time yesterday`,
            trend: {
              direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat',
              label: diff === 0 ? 'No change' : `${diff > 0 ? '+' : ''}${diff}`
            }
          }
        ];
      }}
    />
  );
}

// Each tile opens the matching preset tab of the vendor list
export function VendorsSection({
  query
}: {
  query: ReturnType<typeof useOverviewVendors>;
}) {
  return (
    <TileSection
      title='Vendors & Onboarding'
      query={query}
      tileCount={4}
      tiles={(d) => [
        {
          label: 'Onboarding In Progress',
          value: n(d.onboarding_in_progress),
          sublabel: 'Not yet approved',
          href: '/dashboard/vendors?tab=onboarding'
        },
        {
          label: 'Pending Approval',
          value: n(d.pending_approval),
          sublabel: 'Inspection requested',
          tone: warnIf(d.pending_approval),
          href: '/dashboard/vendors?tab=pending-inspection'
        },
        {
          label: 'Approved Vendors',
          value: n(d.approved),
          sublabel: 'Live on storefront',
          href: '/dashboard/vendors?tab=approved'
        },
        {
          label: 'Swappr Inspected',
          value: n(d.inspection_verified),
          sublabel: 'Inspection verified',
          href: '/dashboard/vendors?tab=inspected'
        }
      ]}
    />
  );
}

export function MarketplaceSection({
  query,
  isSuperadmin
}: {
  query: ReturnType<typeof useOverviewMarketplace>;
  isSuperadmin: boolean;
}) {
  return (
    <TileSection
      title='Marketplace'
      query={query}
      tileCount={4}
      tiles={(d) => [
        {
          label: 'Orders Today',
          value: n(d.orders_today),
          sublabel: 'Paid orders',
          href: '/dashboard/orders'
        },
        {
          // The product page is still template mock data, so no link yet
          label: 'Live Listings',
          value: n(d.live_listings),
          sublabel: 'Visible to customers'
        },
        {
          label: 'Awaiting Delivery Confirmation',
          value: n(d.awaiting_delivery_confirmation),
          sublabel: 'Customer has not confirmed',
          tone: warnIf(d.awaiting_delivery_confirmation),
          href: '/dashboard/orders?status=shipped'
        },
        {
          label: 'Open Delivery Reviews',
          value: n(d.open_delivery_reviews),
          sublabel: 'Escalated after 48h',
          tone: warnIf(d.open_delivery_reviews),
          // The review queue is superadmin only
          href: isSuperadmin ? '/dashboard/delivery-reviews' : undefined
        }
      ]}
    />
  );
}

/** Superadmin only */
export function FinanceSection({
  query
}: {
  query: ReturnType<typeof useOverviewFinance>;
}) {
  return (
    <TileSection
      title='Finance · Superadmin'
      query={query}
      tileCount={4}
      tiles={(d) => [
        {
          label: 'GMV Today',
          value: formatKobo(d.gmv_today_kobo),
          sublabel: 'Gross paid order value'
        },
        {
          label: 'Fees Earned Today',
          value: formatKobo(d.platform_fees_today_kobo),
          sublabel: 'Platform fees on orders paid today'
        },
        {
          label: 'Owed to Vendors',
          value: formatKobo(d.vendor_payables_kobo),
          sublabel: 'Collected, not yet paid out',
          href: '/dashboard/ledger'
        },
        {
          label: 'Paystack Balance',
          value: formatKobo(d.paystack_balance_kobo),
          sublabel: 'Turns red if negative',
          tone: d.paystack_balance_kobo < 0 ? 'danger' : 'default',
          href: '/dashboard/ledger/settlements'
        }
      ]}
    />
  );
}

/** Superadmin only */
export function PayoutsSection({
  query
}: {
  query: ReturnType<typeof useOverviewPayouts>;
}) {
  return (
    <TileSection
      title='Payouts · Superadmin'
      query={query}
      tileCount={3}
      tiles={(d) => [
        {
          label: 'Pending Settlements',
          value: n(d.pending_count),
          sublabel: `${n(d.requested_count)} requested · ${n(d.approved_count)} awaiting transfer`,
          tone: warnIf(d.pending_count),
          href: '/dashboard/payout'
        },
        {
          label: 'Processed Today',
          value: n(d.processed_today),
          sublabel: 'Manual transfers recorded',
          href: '/dashboard/payout?status=completed'
        },
        {
          label: 'Total Paid Out Today',
          value: formatKobo(d.paid_today_kobo),
          sublabel: 'Combined net value',
          href: '/dashboard/payout?status=completed'
        }
      ]}
    />
  );
}
