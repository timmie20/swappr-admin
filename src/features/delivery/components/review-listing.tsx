'use client';

import { QueryErrorState } from '@/components/superadmin-required';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDataTable } from '@/hooks/use-data-table';
import { parseAsInteger, parseAsStringEnum, useQueryState } from 'nuqs';
import { useDeliveryReviews } from '../hooks/use-delivery';
import { DeliveryReview, DeliveryReviewStatus } from '../types/delivery.types';
import { columns } from './review-tables/columns';

const TABS = [
  { value: DeliveryReviewStatus.OPEN, label: 'Open' },
  { value: DeliveryReviewStatus.CONFIRMED, label: 'Confirmed' },
  { value: DeliveryReviewStatus.CLOSED, label: 'Closed' },
  { value: 'all', label: 'All' }
] as const;

const TAB_VALUES = TABS.map((tab) => tab.value);

function ReviewTable({
  data,
  totalItems
}: {
  data: DeliveryReview[];
  totalItems: number;
}) {
  const [pageSize] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const { table } = useDataTable({
    data,
    columns,
    pageCount: Math.max(1, Math.ceil(totalItems / pageSize))
  });
  return <DataTable table={table} />;
}

export default function DeliveryReviewListing() {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [status, setStatus] = useQueryState(
    'status',
    parseAsStringEnum([...TAB_VALUES]).withDefault(DeliveryReviewStatus.OPEN)
  );

  const { data, isLoading, error } = useDeliveryReviews({
    page,
    limit: perPage,
    status: status === 'all' ? undefined : (status as DeliveryReviewStatus)
  });

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <Tabs
        value={status}
        onValueChange={(value) => {
          void setPage(1);
          void setStatus(value as (typeof TAB_VALUES)[number]);
        }}
      >
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {error ? (
        <QueryErrorState error={error} title='Could not load reviews' />
      ) : isLoading || !data ? (
        <DataTableSkeleton columnCount={6} rowCount={6} filterCount={0} />
      ) : (
        <ReviewTable data={data.reviews} totalItems={data.total} />
      )}
    </div>
  );
}
