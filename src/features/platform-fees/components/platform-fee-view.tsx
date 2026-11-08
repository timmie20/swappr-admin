'use client';

import { SectionError } from '@/components/section-error';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlatformFeeSettings } from '../hooks/use-platform-fee';
import { FeeHistory } from './fee-history';
import { FeePreviewCard } from './fee-preview-card';
import { NowChargingCard } from './now-charging-card';
import { PromotionCard } from './promotion-card';
import { StandardRateCard } from './standard-rate-card';

/** Settings → Platform fees (superadmin only) */
export default function PlatformFeeView() {
  const query = usePlatformFeeSettings();
  const settings = query.data;

  if (query.error && !settings) {
    return (
      <SectionError
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
        what='the platform fee settings'
      />
    );
  }

  return (
    <div className='space-y-6'>
      {settings ? (
        <>
          <NowChargingCard settings={settings} />
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <StandardRateCard settings={settings} />
            <PromotionCard settings={settings} />
          </div>
        </>
      ) : (
        <>
          <Skeleton className='h-36 w-full' />
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <Skeleton className='h-56 w-full' />
            <Skeleton className='h-56 w-full' />
          </div>
        </>
      )}
      <FeePreviewCard />
      <div className='space-y-3'>
        <h3 className='text-lg font-semibold'>History</h3>
        <FeeHistory />
      </div>
    </div>
  );
}
