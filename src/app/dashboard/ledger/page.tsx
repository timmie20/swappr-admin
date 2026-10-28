import PageContainer from '@/components/layout/page-container';
import SuperadminGate from '@/components/layout/superadmin-gate';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import LedgerSummaryView from '@/features/ledger/components/ledger-summary-view';

export const metadata = {
  title: 'Dashboard: Ledger'
};

export default function Page() {
  return (
    <PageContainer scrollable>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading
          title='Ledger'
          description='Account balances, what vendors are owed, and owner funds'
        />
        <Separator />
        <SuperadminGate>
          <LedgerSummaryView />
        </SuperadminGate>
      </div>
    </PageContainer>
  );
}
