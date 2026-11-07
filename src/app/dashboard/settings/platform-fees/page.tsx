import PageContainer from '@/components/layout/page-container';
import SuperadminGate from '@/components/layout/superadmin-gate';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import PlatformFeeView from '@/features/platform-fees/components/platform-fee-view';

export const metadata = {
  title: 'Dashboard: Platform fees'
};

export default function Page() {
  return (
    <PageContainer scrollable>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading
          title='Platform fees'
          description='What Swappr keeps from each sale: the standard rate and any promotion'
        />
        <Separator />
        <SuperadminGate>
          <PlatformFeeView />
        </SuperadminGate>
      </div>
    </PageContainer>
  );
}
