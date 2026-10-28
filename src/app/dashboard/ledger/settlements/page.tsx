import PageContainer from '@/components/layout/page-container';
import SuperadminGate from '@/components/layout/superadmin-gate';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import SettlementsView from '@/features/ledger/components/settlements-view';

export const metadata = {
  title: 'Dashboard: Settlements'
};

export default function Page() {
  return (
    <PageContainer scrollable>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading
          title='Settlements'
          description='Record Paystack settlements as they land in the bank'
        />
        <Separator />
        <SuperadminGate>
          <SettlementsView />
        </SuperadminGate>
      </div>
    </PageContainer>
  );
}
