import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import CustomerListing from '@/features/admin-customers/components/customer-listing';

export const metadata = {
  title: 'Dashboard: Customers'
};

export default function Page() {
  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading
          title='Customers'
          description='Customer accounts, orders and spending'
        />
        <Separator />
        <CustomerListing />
      </div>
    </PageContainer>
  );
}
