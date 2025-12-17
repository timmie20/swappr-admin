import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import BrandViewPage from '@/features/brands/components/brand-view-page';
import BrandDetailsSkeleton from '@/components/skeletons/brand-detail-skeleton';

export const metadata = {
  title: 'Dashboard: Brand View'
};

type PageProps = { params: Promise<{ brandId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<BrandDetailsSkeleton />}>
          <BrandViewPage brandId={params.brandId} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
