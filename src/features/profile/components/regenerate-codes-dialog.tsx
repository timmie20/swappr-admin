'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Icons } from '@/components/icons';
import { RecoveryCodesPanel } from '@/features/auth/components/recovery-codes-panel';
import { useRetryCountdown } from '@/hooks/use-retry-countdown';
import { getApiError } from '@/lib/api/errors';
import { formatRetryAfter } from '@/lib/api/rate-limit';
import { mfaCodeSchema } from '@/schemas/auth';
import { useRegenerateRecoveryCodes } from '../hook/use-mfa';

/**
 * Asks for a current code, then shows the new recovery codes once. The old
 * codes stop working as soon as the new ones are made.
 */
export function RegenerateCodesDialog({
  email,
  onClose
}: {
  email: string;
  onClose: () => void;
}) {
  const regenerate = useRegenerateRecoveryCodes();
  const countdown = useRetryCountdown();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = mfaCodeSchema.safeParse({ code });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the code');
      return;
    }
    setError(null);
    regenerate.mutate(code, {
      onSuccess: (result) => setCodes(result.recovery_codes),
      onError: (err) => {
        const {
          status,
          code: errorCode,
          message,
          extra
        } = getApiError(err, 'Couldn’t make new codes. Please try again.');
        if (status === 429) {
          const seconds = extra.retry_after_seconds;
          countdown.start(typeof seconds === 'number' ? seconds : null);
        }
        if (errorCode === 'MFA_CODE_INVALID') setCode('');
        setError(message);
      }
    });
  }

  const { isLocked, secondsLeft } = countdown;

  return (
    <Modal
      isOpen
      // Once the codes are showing, only "Done" closes, after the checkbox
      onClose={codes ? () => undefined : onClose}
      title={codes ? 'Your new recovery codes' : 'Make new recovery codes'}
      description={
        codes
          ? 'Your old recovery codes no longer work.'
          : 'New codes replace all your old ones. Enter the 6-digit code from your authenticator app to continue.'
      }
    >
      {codes ? (
        <RecoveryCodesPanel
          codes={codes}
          account={email}
          onContinue={onClose}
          continueLabel='Done'
        />
      ) : (
        <form onSubmit={onSubmit} className='space-y-4' noValidate>
          <div className='space-y-2'>
            <Label htmlFor='regenerate-code'>Code</Label>
            <Input
              id='regenerate-code'
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder='123 456'
              inputMode='numeric'
              autoComplete='one-time-code'
              maxLength={16}
              autoFocus
              className='font-mono text-lg tracking-[0.3em]'
              aria-invalid={!!error}
            />
          </div>
          {error && (
            <p role='alert' className='text-destructive text-sm'>
              {error}
              {isLocked &&
                ` You can try again ${formatRetryAfter(secondsLeft)}.`}
            </p>
          )}
          <div className='flex justify-end gap-2'>
            <Button type='button' variant='ghost' onClick={onClose}>
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={regenerate.isPending || isLocked || !code.trim()}
            >
              {regenerate.isPending && (
                <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
              )}
              Make new codes
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
