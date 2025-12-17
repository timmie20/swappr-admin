import PageContainer from '@/components/layout/page-container';
import ModelEditSkeleton from '@/components/skeletons/model-edit-skeleton';
import ModelViewPage from '@/features/models/components/model-view-page';
import React, { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard: Model View'
};

type PageProps = { params: Promise<{ modelId: string }> };

export default async function page(props: PageProps) {
  const params = await props.params;
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<ModelEditSkeleton />}>
          <ModelViewPage modelId={params.modelId} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
