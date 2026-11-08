import PageContainer from '@/components/layout/page-container';
import OrderDetailView from '@/features/orders/components/order-detail-view';
import { isSuperadmin } from '@/lib/auth/roles';
import { requireSession } from '@/lib/auth/session';

export const metadata = {
  title: 'Dashboard: Order Details'
};

type PageProps = { params: Promise<{ orderNumber: string }> };

export default async function Page(props: PageProps) {
  const [params, session] = await Promise.all([props.params, requireSession()]);
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <OrderDetailView
          orderNumber={decodeURIComponent(params.orderNumber)}
          canManageDelivery={isSuperadmin(session.role)}
        />
      </div>
    </PageContainer>
  );
}
