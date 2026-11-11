'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Icons } from '@/components/icons';
import { CodeInput } from '@/features/auth/components/code-input';
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

  function submit(value: string) {
    if (regenerate.isPending || countdown.isLocked) return;
    const parsed = mfaCodeSchema.safeParse({ code: value });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the code');
      return;
    }
    setError(null);
    regenerate.mutate(value, {
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(code);
          }}
          className='space-y-4'
          noValidate
        >
          <CodeInput
            value={code}
            onChange={setCode}
            onComplete={submit}
            disabled={regenerate.isPending}
            invalid={!!error}
          />
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
