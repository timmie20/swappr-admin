'use client';

import { SuperadminRequired } from '@/components/superadmin-required';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { getApiError, isForbidden } from '@/lib/api/errors';
import { IconAlertCircle } from '@tabler/icons-react';

/** Inline error for one section, so a failing call never blanks the page */
export function SectionError({
  error,
  onRetry,
  retrying,
  what
}: {
  error: unknown;
  onRetry: () => void;
  retrying?: boolean;
  what: string;
}) {
  if (isForbidden(error)) return <SuperadminRequired />;
  return (
    <Alert variant='destructive'>
      <IconAlertCircle className='h-4 w-4' />
      <AlertTitle>Couldn’t load {what}</AlertTitle>
      <AlertDescription>
        <p>{getApiError(error).message}</p>
        <Button
          size='sm'
          variant='outline'
          className='mt-2'
          onClick={onRetry}
          disabled={retrying}
        >
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}
