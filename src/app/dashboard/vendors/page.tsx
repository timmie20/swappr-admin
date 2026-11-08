import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import VendorListing from '@/features/admin-vendors/components/vendor-listing';

export const metadata = {
  title: 'Dashboard: Vendors'
};

export default function Page() {
  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading
          title='Vendors'
          description='Onboarding, inspections and store activity'
        />
        <Separator />
        <VendorListing />
      </div>
    </PageContainer>
  );
}
