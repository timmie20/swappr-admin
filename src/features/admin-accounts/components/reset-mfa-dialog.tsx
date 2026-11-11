'use client';

import { useState } from 'react';
import { IconAlertTriangle } from '@tabler/icons-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { getApiError } from '@/lib/api/errors';
import { useResetAdminMfa } from '../hooks/use-admin-accounts';
import {
  AdminAccount,
  adminName,
  RESET_REASON_MAX,
  RESET_REASON_MIN
} from '../types/admin-account.types';

export function ResetMfaDialog({
  admin,
  onClose
}: {
  admin: AdminAccount;
  onClose: () => void;
}) {
  const reset = useResetAdminMfa();
  const [reason, setReason] = useState('');
  const trimmed = reason.trim();
  const valid =
    trimmed.length >= RESET_REASON_MIN && trimmed.length <= RESET_REASON_MAX;
  const name = adminName(admin);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    reset.mutate({ userId: admin.id, reason: trimmed }, { onSuccess: onClose });
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title='Reset two-step sign-in'
      description={`For ${name} (${admin.email}).`}
    >
      <form onSubmit={onSubmit} className='space-y-4' noValidate>
        <Alert variant='destructive'>
          <IconAlertTriangle />
          <AlertDescription>
            This signs {name} out everywhere and turns off their two-step
            sign-in. Their recovery codes stop working, and they&apos;ll set it
            up again at their next sign-in. They&apos;ll get an email about it.
          </AlertDescription>
        </Alert>

        <div className='space-y-2'>
          <Label htmlFor='reset-reason'>Reason</Label>
          <Textarea
            id='reset-reason'
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder='Why? e.g. lost phone'
            maxLength={RESET_REASON_MAX}
            rows={3}
            autoFocus
          />
          <p className='text-muted-foreground text-xs'>
            Required, at least {RESET_REASON_MIN} characters. Recorded in the
            audit log.
          </p>
        </div>

        {reset.isError && (
          <p role='alert' className='text-destructive text-sm'>
            {
              getApiError(reset.error, 'Couldn’t reset. Please try again.')
                .message
            }
          </p>
        )}

        <div className='flex justify-end gap-2'>
          <Button type='button' variant='ghost' onClick={onClose}>
            Cancel
          </Button>
          <Button
            type='submit'
            variant='destructive'
            disabled={!valid || reset.isPending}
          >
            {reset.isPending && (
              <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
            )}
            Reset and sign out
          </Button>
        </div>
      </form>
    </Modal>
  );
}
