import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import OrderListingPage from '@/features/orders/components/order-listing';

export const metadata = {
  title: 'Dashboard: Orders'
};

export default function Page() {
  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading title='Orders' description='All customer orders' />
        <Separator />
        <OrderListingPage />
      </div>
    </PageContainer>
  );
}
