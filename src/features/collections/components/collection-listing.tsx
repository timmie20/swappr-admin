import { searchParamsCache } from '@/lib/searchparams';
import { collectionsApiServer } from '../api/collections.service.server';
import { CollectionTable } from './collection-tables';
import { columns } from './collection-tables/columns';

export default async function CollectionListingPage() {
  const page = searchParamsCache.get('page');
  const limit = searchParamsCache.get('perPage');
  const isActive = searchParamsCache.get('is_active');

  const data = await collectionsApiServer.getAll({
    page,
    limit,
    is_active: isActive === 'true'
  });

  return (
    <CollectionTable
      data={data.collections}
      totalItems={data.total}
      columns={columns}
    />
  );
}
