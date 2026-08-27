import { searchParamsCache } from '@/lib/searchparams';
import { payoutsApiServer } from '../api/payouts.service.server';
import { PayoutTable } from './payout-tables';
import { columns } from './payout-tables/columns';
import { PayoutSortBy, PayoutStatus, SortOrder } from '../types/payout.types';

export default async function PayoutListingPage() {
  const page = searchParamsCache.get('page');
  const limit = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');
  const search = searchParamsCache.get('search');
  const minAmount = searchParamsCache.get('min_amount');
  const maxAmount = searchParamsCache.get('max_amount');
  const createdFrom = searchParamsCache.get('created_from');
  const createdTo = searchParamsCache.get('created_to');
  const [sortEntry] = searchParamsCache.get('sort') ?? [];

  const data = await payoutsApiServer.getAll({
    page,
    limit,
    status: status && status !== 'all' ? (status as PayoutStatus) : undefined,
    search: search ?? undefined,
    min_amount: minAmount ?? undefined,
    max_amount: maxAmount ?? undefined,
    created_from: createdFrom
      ? createdFrom.toISOString().slice(0, 10)
      : undefined,
    created_to: createdTo ? createdTo.toISOString().slice(0, 10) : undefined,
    sort_by: sortEntry ? (sortEntry.id as PayoutSortBy) : undefined,
    sort_order: sortEntry
      ? ((sortEntry.desc ? 'DESC' : 'ASC') as SortOrder)
      : undefined
  });

  return (
    <PayoutTable
      data={data.payouts}
      totalItems={data.total}
      columns={columns}
    />
  );
}
