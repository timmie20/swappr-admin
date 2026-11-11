'use client';

import { useState } from 'react';
import { isAxiosError } from 'axios';
import { IconInfoCircle } from '@tabler/icons-react';
import { QueryErrorState } from '@/components/superadmin-required';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { formatLagosDate, formatLagosDateTime } from '@/lib/format';
import { useAdminAccounts } from '../hooks/use-admin-accounts';
import { AdminAccount, adminName } from '../types/admin-account.types';
import { ResetMfaDialog } from './reset-mfa-dialog';

/** Every admin and superadmin, with their two-step sign-in. */
export default function AdminsListing({
  currentAdminId
}: {
  currentAdminId: string;
}) {
  const admins = useAdminAccounts();
  const [resetting, setResetting] = useState<AdminAccount | null>(null);

  if (admins.isPending) {
    return (
      <div className='space-y-2'>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className='h-10 w-full' />
        ))}
      </div>
    );
  }

  // A backend without MFA has no GET /admins yet
  if (isAxiosError(admins.error) && admins.error.response?.status === 404) {
    return (
      <Alert>
        <IconInfoCircle />
        <AlertTitle>Not available yet</AlertTitle>
        <AlertDescription>
          This page works once the backend update for two-step sign-in is live.
        </AlertDescription>
      </Alert>
    );
  }

  if (admins.isError) {
    return (
      <QueryErrorState error={admins.error} title='Couldn’t load admins' />
    );
  }

  return (
    <>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Two-step sign-in</TableHead>
              <TableHead>Last sign-in</TableHead>
              <TableHead className='w-0' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className='text-muted-foreground'>
                  No admins.
                </TableCell>
              </TableRow>
            )}
            {admins.data.map((admin) => {
              const isYou = admin.id === currentAdminId;
              return (
                <TableRow key={admin.id}>
                  <TableCell className='font-medium'>
                    {adminName(admin)}
                    {isYou && (
                      <span className='text-muted-foreground'> (you)</span>
                    )}
                    {!admin.is_active && (
                      <Badge variant='outline' className='ml-2'>
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    <Badge variant='secondary' className='capitalize'>
                      {admin.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {admin.mfa_enabled_at ? (
                      `On since ${formatLagosDate(admin.mfa_enabled_at)}`
                    ) : (
                      <span className='text-destructive font-medium'>
                        Not set up
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {admin.last_signIn
                      ? formatLagosDateTime(admin.last_signIn)
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    {!isYou && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setResetting(admin)}
                      >
                        Reset two-step sign-in
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {resetting && (
        <ResetMfaDialog admin={resetting} onClose={() => setResetting(null)} />
      )}
    </>
  );
}
