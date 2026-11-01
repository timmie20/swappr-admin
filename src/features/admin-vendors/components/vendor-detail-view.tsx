'use client';

import { SectionError } from '@/components/section-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isAxiosError } from 'axios';
import { IconArrowLeft, IconMail, IconPhone } from '@tabler/icons-react';
import Link from 'next/link';
import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryState,
  useQueryStates
} from 'nuqs';
import { useAdminVendor } from '../hooks/use-vendors';
import { vendorDisplayName } from '../types/vendor.types';
import { OnboardingStepBadge, VendorStatusBadges } from './vendor-badges';
import { VendorOrdersTab } from './vendor-orders-tab';
import { VendorOverviewTab } from './vendor-overview-tab';
import { VendorRequestsTab } from './vendor-requests-tab';
import { VendorTransactionsTab } from './vendor-transactions-tab';

const TABS = ['overview', 'orders', 'requests', 'transactions'] as const;
type VendorTab = (typeof TABS)[number];

function TabCount({ count }: { count: number }) {
  if (!count) return null;
  return (
    <Badge variant='secondary' className='ml-1 h-5 px-1.5 tabular-nums'>
      {count}
    </Badge>
  );
}

export default function VendorDetailView({
  vendorId,
  isSuperadmin
}: {
  vendorId: string;
  isSuperadmin: boolean;
}) {
  // Owner decision: sub-page tabs push history (Back returns to the
  // previous tab)
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringEnum([...TABS])
      .withDefault('overview')
      .withOptions({ history: 'push' })
  );
  const [, setTabParams] = useQueryStates({
    page: parseAsInteger,
    search: parseAsString
  });
  const query = useAdminVendor(vendorId);
  // Transactions is superadmin only; an admin landing on ?tab=transactions
  // gets the overview instead
  const active: VendorTab =
    tab === 'transactions' && !isSuperadmin ? 'overview' : tab;

  if (isAxiosError(query.error) && query.error.response?.status === 404) {
    return (
      <Alert>
        <AlertTitle>Vendor not found</AlertTitle>
        <AlertDescription>
          <p>It may have been archived.</p>
          <Link href='/dashboard/vendors' className='underline'>
            Back to vendors
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  const overview = query.data;
  const vendor = overview?.vendor;

  return (
    <div className='w-full space-y-6'>
      <div className='flex flex-wrap items-center gap-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link href='/dashboard/vendors' aria-label='Back to vendors'>
            <IconArrowLeft className='h-4 w-4' />
          </Link>
        </Button>
        {vendor ? (
          <>
            <Avatar className='h-12 w-12'>
              {vendor.logo_url && <AvatarImage src={vendor.logo_url} alt='' />}
              <AvatarFallback>
                {vendorDisplayName(vendor).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className='min-w-0 space-y-1.5'>
              <h2 className='text-2xl font-bold tracking-tight'>
                {vendorDisplayName(vendor)}
              </h2>
              <div className='flex flex-wrap items-center gap-1.5'>
                <OnboardingStepBadge step={vendor.onboarding_step} />
                <VendorStatusBadges vendor={vendor} />
              </div>
              <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm'>
                <a
                  href={`mailto:${vendor.contact_email}`}
                  className='flex items-center gap-1 hover:underline'
                >
                  <IconMail className='h-4 w-4' /> {vendor.contact_email}
                </a>
                {vendor.contact_number && (
                  <a
                    href={`tel:${vendor.contact_number}`}
                    className='flex items-center gap-1 hover:underline'
                  >
                    <IconPhone className='h-4 w-4' /> {vendor.contact_number}
                  </a>
                )}
              </div>
            </div>
          </>
        ) : query.error ? null : (
          <div className='space-y-2'>
            <Skeleton className='h-7 w-56' />
            <Skeleton className='h-5 w-72' />
          </div>
        )}
      </div>

      <Tabs
        value={active}
        onValueChange={(value) => {
          // The tab tables share the URL's page/search params: start each
          // tab fresh
          void setTabParams({ page: null, search: null });
          void setTab(value as VendorTab);
        }}
      >
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='orders'>
            Orders
            <TabCount count={overview?.activity.orders.needs_action ?? 0} />
          </TabsTrigger>
          <TabsTrigger value='requests'>
            Requests
            <TabCount count={overview?.activity.requests.total_open ?? 0} />
          </TabsTrigger>
          {isSuperadmin && (
            <TabsTrigger value='transactions'>Transactions</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value='overview' className='mt-4'>
          {query.error ? (
            <SectionError
              error={query.error}
              onRetry={() => void query.refetch()}
              retrying={query.isFetching}
              what='this vendor'
            />
          ) : (
            <VendorOverviewTab
              vendorId={vendorId}
              overview={overview}
              isSuperadmin={isSuperadmin}
            />
          )}
        </TabsContent>
        <TabsContent value='orders' className='mt-4'>
          <VendorOrdersTab
            vendorId={vendorId}
            counts={overview?.activity.orders}
          />
        </TabsContent>
        <TabsContent value='requests' className='mt-4'>
          <VendorRequestsTab vendorId={vendorId} isSuperadmin={isSuperadmin} />
        </TabsContent>
        {isSuperadmin && (
          <TabsContent value='transactions' className='mt-4'>
            <VendorTransactionsTab vendorId={vendorId} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
