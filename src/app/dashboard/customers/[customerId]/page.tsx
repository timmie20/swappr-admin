import PageContainer from '@/components/layout/page-container';
import CustomerDetailView from '@/features/admin-customers/components/customer-detail-view';

export const metadata = {
  title: 'Dashboard: Customer'
};

type PageProps = { params: Promise<{ customerId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <CustomerDetailView customerId={params.customerId} />
      </div>
    </PageContainer>
  );
}
