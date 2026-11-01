import PageContainer from '@/components/layout/page-container';
import OverviewDashboard from '@/features/admin-overview/components/overview-dashboard';
import { isSuperadmin } from '@/lib/auth/roles';
import { requireSession } from '@/lib/auth/session';

export const metadata = {
  title: 'Dashboard: Overview'
};

export default async function Page() {
  const session = await requireSession();
  return (
    <PageContainer>
      <OverviewDashboard isSuperadmin={isSuperadmin(session.role)} />
    </PageContainer>
  );
}
