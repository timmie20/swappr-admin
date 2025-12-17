import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import BrandListingPage from '@/features/brands/components/brand-listing';
import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard: Brands'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading title='Brands' description='Manage brands for your products' />
        <Separator />
        <Suspense
          fallback={
            <DataTableSkeleton columnCount={4} rowCount={5} filterCount={0} />
          }
        >
          <BrandListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
