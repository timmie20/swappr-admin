import PageContainer from '@/components/layout/page-container';
import AdminProductDetailView from '@/features/admin-products/components/admin-product-detail-view';

export const metadata = {
  title: 'Dashboard: Product'
};

type PageProps = { params: Promise<{ productId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <AdminProductDetailView productId={params.productId} />
      </div>
    </PageContainer>
  );
}
