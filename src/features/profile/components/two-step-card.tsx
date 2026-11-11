'use client';

import { useState } from 'react';
import { isAxiosError } from 'axios';
import { IconAlertTriangle, IconShieldCheck } from '@tabler/icons-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getApiError } from '@/lib/api/errors';
import { formatLagosDate } from '@/lib/format';
import { useMfaStatus } from '../hook/use-mfa';
import { RegenerateCodesDialog } from './regenerate-codes-dialog';

const LOW_CODES = 2;

/** The signed-in admin's two-step sign-in: since when, codes left. */
export function TwoStepCard({ email }: { email: string }) {
  const status = useMfaStatus();
  const [regenerating, setRegenerating] = useState(false);

  // A backend without MFA has no /auth/mfa/status: show nothing
  if (isAxiosError(status.error) && status.error.response?.status === 404) {
    return null;
  }

  return (
    <Card className='max-w-lg'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <IconShieldCheck className='h-5 w-5' />
          Two-step sign-in
        </CardTitle>
        <CardDescription>
          You sign in with your password and a code from your authenticator app.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {status.isPending ? (
          <Skeleton className='h-5 w-64' />
        ) : status.isError ? (
          <p className='text-destructive text-sm'>
            {getApiError(status.error, 'Couldn’t load this.').message}
          </p>
        ) : status.data.enabled_at ? (
          <>
            <p className='text-sm'>
              On since {formatLagosDate(status.data.enabled_at)}.{' '}
              {status.data.recovery_codes_left} recovery{' '}
              {status.data.recovery_codes_left === 1 ? 'code' : 'codes'} left.
            </p>
            {status.data.recovery_codes_left <= LOW_CODES && (
              <Alert variant='destructive'>
                <IconAlertTriangle />
                <AlertDescription>
                  {status.data.recovery_codes_left === 0
                    ? 'You have no recovery codes left.'
                    : 'You’re running low on recovery codes.'}{' '}
                  If you lose your phone, you won&apos;t be able to sign in
                  without one. Make new ones now.
                </AlertDescription>
              </Alert>
            )}
            <Button variant='outline' onClick={() => setRegenerating(true)}>
              Make new recovery codes
            </Button>
          </>
        ) : (
          <p className='text-muted-foreground text-sm'>
            Not set up. You&apos;ll set it up the next time you sign in.
          </p>
        )}
      </CardContent>

      {regenerating && (
        <RegenerateCodesDialog
          email={email}
          onClose={() => setRegenerating(false)}
        />
      )}
    </Card>
  );
}
