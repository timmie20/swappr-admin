import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import CategoryListingPage from '@/features/categories/components/category-listing';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard: Categories'
};

export default async function Page() {
  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading
          title='Categories'
          description='Manage app categories, their status and capabilities'
        />

        <Separator />
        <Suspense
          fallback={
            <DataTableSkeleton columnCount={7} rowCount={5} filterCount={0} />
          }
        >
          <CategoryListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
