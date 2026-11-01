import PageContainer from '@/components/layout/page-container';
import VendorDetailView from '@/features/admin-vendors/components/vendor-detail-view';
import { isSuperadmin } from '@/lib/auth/roles';
import { requireSession } from '@/lib/auth/session';

export const metadata = {
  title: 'Dashboard: Vendor'
};

type PageProps = { params: Promise<{ vendorId: string }> };

export default async function Page(props: PageProps) {
  const [params, session] = await Promise.all([props.params, requireSession()]);
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <VendorDetailView
          vendorId={params.vendorId}
          isSuperadmin={isSuperadmin(session.role)}
        />
      </div>
    </PageContainer>
  );
}
