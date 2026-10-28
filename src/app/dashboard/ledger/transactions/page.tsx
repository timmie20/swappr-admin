import PageContainer from '@/components/layout/page-container';
import SuperadminGate from '@/components/layout/superadmin-gate';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import TransactionsView from '@/features/ledger/components/transactions-view';

export const metadata = {
  title: 'Dashboard: Ledger Transactions'
};

export default function Page() {
  return (
    <PageContainer scrollable>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading
          title='Ledger Transactions'
          description='Every posting with its debit and credit entries'
        />
        <Separator />
        <SuperadminGate>
          <TransactionsView />
        </SuperadminGate>
      </div>
    </PageContainer>
  );
}
