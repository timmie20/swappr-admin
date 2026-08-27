import PageContainer from '@/components/layout/page-container';
import PayoutDetailSkeleton from '@/components/skeletons/payout-detail-skeleton';
import PayoutDetailPage from '@/features/payouts/components/payout-detail-page';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard: Payout Details'
};

type PageProps = { params: Promise<{ payoutId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<PayoutDetailSkeleton />}>
          <PayoutDetailPage payoutId={params.payoutId} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
