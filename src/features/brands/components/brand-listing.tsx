import { brandApiServer } from '../api/brands.service.server';
import { BrandTable } from './brand-tables';
import { columns } from './brand-tables/columns';

export default async function BrandListingPage() {
  const data = await brandApiServer.getAll();
  const brands = data?.brands || [];
  // const totalBrands = data?.total || 0;

  return <BrandTable data={brands} totalItems={10} columns={columns} />;
}
