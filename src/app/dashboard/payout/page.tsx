import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import PayoutListingPage from '@/features/payouts/components/payout-listing';
import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard: Payouts'
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
        <Heading
          title='Payouts'
          description='Manage and retry vendor payouts'
        />

        <Separator />
        <Suspense
          fallback={
            <DataTableSkeleton columnCount={6} rowCount={5} filterCount={0} />
          }
        >
          <PayoutListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
