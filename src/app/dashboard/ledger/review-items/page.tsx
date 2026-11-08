import PageContainer from '@/components/layout/page-container';
import SuperadminGate from '@/components/layout/superadmin-gate';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import SyncIssuesView from '@/features/ledger/components/sync-issues-view';

export const metadata = {
  title: 'Dashboard: Settlement Review Items'
};

export default function Page() {
  return (
    <PageContainer scrollable>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading
          title='Settlement Review Items'
          description='Paystack settlements the sync would not post by itself'
        />
        <Separator />
        <SuperadminGate>
          <SyncIssuesView />
        </SuperadminGate>
      </div>
    </PageContainer>
  );
}
