import PageContainer from '@/components/layout/page-container';
import ModelViewPage from '@/features/models/components/model-view-page';
import React from 'react';

export const metadata = {
  title: 'Dashboard: Model View'
};

type PageProps = { params: Promise<{ modelId: string }> };

export default async function page(props: PageProps) {
  const params = await props.params;
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <ModelViewPage modelId={params.modelId} />
      </div>
    </PageContainer>
  );
}
