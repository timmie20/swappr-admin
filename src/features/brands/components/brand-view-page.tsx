import { notFound } from 'next/navigation';
import { brandApiServer } from '../api/brands.service.server';
import BrandDetailsPage from './brand-details-page';

type TBrandViewPageProps = {
  brandId: string;
};

export default async function BrandViewPage({ brandId }: TBrandViewPageProps) {
  const brand = await brandApiServer.getBrandbyId(brandId);

  if (!brand) {
    notFound();
  }
  return <BrandDetailsPage brand={brand} />;
}
