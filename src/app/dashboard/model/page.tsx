import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import ModelsListingPage from '@/features/models/components/models-listing';
import { Suspense } from 'react';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';

export const metadata = {
  title: 'Dashboard: Models'
};

export default function page() {
  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Models'
            description='Manage phone models and thier valuation rules (Create, edit and delete)'
          />
          <Link
            href='/dashboard/model/new'
            className={cn(buttonVariants(), 'text-xs md:text-sm')}
          >
            <IconPlus className='mr-2 h-4 w-4' /> Add New
          </Link>
        </div>
        <Separator />
        <Suspense fallback={<DataTableSkeleton columnCount={5} rowCount={5} />}>
          <ModelsListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
