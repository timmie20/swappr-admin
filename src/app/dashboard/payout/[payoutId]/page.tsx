import PageContainer from '@/components/layout/page-container';
import SuperadminGate from '@/components/layout/superadmin-gate';
import PayoutDetailView from '@/features/payouts/components/payout-detail-view';

export const metadata = {
  title: 'Dashboard: Payout Details'
};

type PageProps = { params: Promise<{ payoutId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <SuperadminGate>
          <PayoutDetailView payoutId={params.payoutId} />
        </SuperadminGate>
      </div>
    </PageContainer>
  );
}
