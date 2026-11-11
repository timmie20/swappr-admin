import PageContainer from '@/components/layout/page-container';
import SuperadminGate from '@/components/layout/superadmin-gate';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import AdminsListing from '@/features/admin-accounts/components/admins-listing';
import { requireSession } from '@/lib/auth/session';

export const metadata = {
  title: 'Dashboard: Admins'
};

export default async function Page() {
  const session = await requireSession();

  return (
    <PageContainer scrollable>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading
          title='Admins'
          description='Every admin and superadmin, and whether two-step sign-in is set up'
        />
        <Separator />
        <SuperadminGate>
          <AdminsListing currentAdminId={session.id} />
        </SuperadminGate>
      </div>
    </PageContainer>
  );
}
