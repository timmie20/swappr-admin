import PageContainer from '@/components/layout/page-container';
import SuperadminGate from '@/components/layout/superadmin-gate';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import ReconciliationView from '@/features/ledger/components/reconciliation-view';

export const metadata = {
  title: 'Dashboard: Reconciliation'
};

export default function Page() {
  return (
    <PageContainer scrollable>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading
          title='Reconciliation'
          description='Checks that should be empty (or explained) when the books are healthy'
        />
        <Separator />
        <SuperadminGate>
          <ReconciliationView />
        </SuperadminGate>
      </div>
    </PageContainer>
  );
}
