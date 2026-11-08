import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import AuditLogListing from '@/features/admin-audit/components/audit-log-listing';

export const metadata = {
  title: 'Dashboard: Audit log'
};

export default function Page() {
  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading
          title='Audit log'
          description='Admin actions and vendor standing, newest first. Entries can’t be edited or deleted.'
        />
        <Separator />
        <AuditLogListing />
      </div>
    </PageContainer>
  );
}
