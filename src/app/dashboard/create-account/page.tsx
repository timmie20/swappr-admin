import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import CreateAccount from '@/features/profile/components/create-account';
import React from 'react';

export const metadata = {
  title: 'Dashboard : Create Account'
};

export default function page() {
  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Create New Admin Account'
            description='Create a new account and assign role. A new admin account can only be created by another existing admin or super admin'
          />
        </div>
        <Separator />

        <CreateAccount />
      </div>
    </PageContainer>
  );
}
