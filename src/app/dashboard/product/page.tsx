import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import AdminProductListing from '@/features/admin-products/components/admin-product-listing';

export const metadata = {
  title: 'Dashboard: Products'
};

export default function Page() {
  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading
          title='Products'
          description='Every listing from every store, including drafts, archived listings and stores that are off the storefront'
        />
        <Separator />
        <AdminProductListing />
      </div>
    </PageContainer>
  );
}
