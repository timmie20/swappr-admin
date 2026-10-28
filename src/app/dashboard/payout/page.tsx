import PageContainer from '@/components/layout/page-container';
import SuperadminGate from '@/components/layout/superadmin-gate';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import PayoutListingPage from '@/features/payouts/components/payout-listing';

export const metadata = {
  title: 'Dashboard: Payouts'
};

export default function Page() {
  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading
          title='Payouts'
          description='Approve vendor settlement requests, send the bank transfer, then record its reference'
        />
        <Separator />
        <SuperadminGate>
          <PayoutListingPage />
        </SuperadminGate>
      </div>
    </PageContainer>
  );
}
