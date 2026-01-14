import { Suspense } from 'react';
import { Metadata } from 'next';
import ValuationManagementSkeleton from '@/components/skeletons/valuation-management-skeleton';
import ValuationViewPage from '@/features/valuation/components/valuation-view-page';
import PageContainer from '@/components/layout/page-container';

export const metadata: Metadata = {
  title: 'Dashboard: Model Valuation'
};

type PageProps = { params: Promise<{ modelId: string }> };

export default async function ModelValuationPage({ params }: PageProps) {
  const { modelId } = await params;

  return (
    <PageContainer>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<ValuationManagementSkeleton />}>
          <ValuationViewPage modelId={modelId} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
