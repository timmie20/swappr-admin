import PageContainer from '@/components/layout/page-container';
import SuperadminGate from '@/components/layout/superadmin-gate';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import DeliveryReviewListing from '@/features/delivery/components/review-listing';

export const metadata = {
  title: 'Dashboard: Delivery Reviews'
};

export default function Page() {
  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading
          title='Delivery Reviews'
          description='Shipped orders the vendor asked us to look into — call the customer, then confirm or close'
        />
        <Separator />
        <SuperadminGate>
          <DeliveryReviewListing />
        </SuperadminGate>
      </div>
    </PageContainer>
  );
}
