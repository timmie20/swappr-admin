import PageContainer from '@/components/layout/page-container';
import ModelEditSkeleton from '@/components/skeletons/model-edit-skeleton';
import QuestionViewPage from '@/features/questions/components/question-view-page';
import React, { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard: Question View'
};

type PageProps = { params: Promise<{ questionId: string }> };

export default async function page(props: PageProps) {
  const params = await props.params;
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<ModelEditSkeleton />}>
          <QuestionViewPage questionId={params.questionId} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
