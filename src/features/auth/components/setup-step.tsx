'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { IconCopy } from '@tabler/icons-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { useMfaConfirm, useMfaSetup } from '@/hooks/services/use-auth';
import { useRetryCountdown } from '@/hooks/use-retry-countdown';
import { formatRetryAfter } from '@/lib/api/rate-limit';
import { mfaCodeSchema } from '@/schemas/auth';
import type { MfaSetupResult } from '@/types/auth';
import {
  attemptsLeftText,
  classifyMfaError,
  groupSecret
} from '../utils/mfa-errors';

/**
 * First sign-in without MFA: scan a QR code, then confirm with a code. The
 * confirm signs the admin in and returns the recovery codes.
 */
export function SetupStep({
  onConfirmed,
  onRestart
}: {
  onConfirmed: (recoveryCodes: string[]) => void;
  onRestart: (message: string | null) => void;
}) {
  const setup = useMfaSetup();
  const confirm = useMfaConfirm();
  const countdown = useRetryCountdown();

  const [qr, setQr] = useState<MfaSetupResult | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  // Every setup call makes a new secret, so a QR already scanned stops
  // working. Call it once per mount, not twice in Strict Mode.
  const started = useRef(false);

  const startSetup = useCallback(
    (notice?: string) => {
      setLoadError(null);
      setup.mutate(undefined, {
        onSuccess: (result) => {
          setQr(result);
          if (notice) setError(notice);
        },
        onError: (err) => {
          const action = classifyMfaError(err);
          if (action.kind === 'restart') onRestart(action.message);
          else if (action.kind === 'rate_limited') {
            countdown.start(action.retryAfterSeconds);
            setLoadError(action.message);
          } else setLoadError(action.message);
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onRestart]
  );

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    startSetup();
  }, [startSetup]);

  async function copySecret() {
    if (!qr) return;
    try {
      await navigator.clipboard.writeText(qr.secret);
      toast.success('Key copied');
    } catch {
      toast.error('Couldn’t copy. Type the key in instead.');
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = mfaCodeSchema.safeParse({ code });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the code');
      return;
    }
    setError(null);
    setHint(null);

    confirm.mutate(code, {
      onSuccess: (result) => onConfirmed(result.recovery_codes),
      onError: (err) => {
        const action = classifyMfaError(err);
        switch (action.kind) {
          case 'restart':
            onRestart(action.message);
            return;
          case 'code_invalid':
            setCode('');
            setError(action.message);
            setHint(attemptsLeftText(action.attemptsLeft));
            return;
          case 'setup_not_started':
            setCode('');
            setQr(null);
            startSetup(
              'We made a new QR code. Scan it again, then enter the new code.'
            );
            return;
          case 'rate_limited':
            countdown.start(action.retryAfterSeconds);
            setError(action.message);
            return;
          default:
            setError(action.message);
        }
      }
    });
  }

  const { isLocked, secondsLeft } = countdown;
  const waitText = isLocked
    ? ` You can try again ${formatRetryAfter(secondsLeft)}.`
    : '';

  return (
    <div className='w-full space-y-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>
          Set up two-step sign-in
        </h1>
        <p className='text-muted-foreground text-sm'>
          Every Swappr admin signs in with their password and a code from an
          authenticator app. This takes about a minute and expires 15 minutes
          after you entered your password.
        </p>
      </div>

      <ol className='list-decimal space-y-5 pl-5 text-sm'>
        <li>
          Install <strong>Google Authenticator</strong> on your phone, from the
          App Store or Google Play. Any authenticator app works.
        </li>

        <li className='space-y-3'>
          <span>Scan this QR code with the app.</span>
          {qr ? (
            <div className='space-y-3'>
              {/* A data URL from the backend; next/image adds nothing here */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qr.qr_data_url}
                alt='QR code for your authenticator app'
                width={180}
                height={180}
                className='rounded-md border bg-white p-2'
              />
              <div className='space-y-1'>
                <p className='text-muted-foreground'>
                  Can&apos;t scan it? Enter this key in the app instead:
                </p>
                <div className='flex items-center gap-2'>
                  <code className='bg-muted rounded px-2 py-1 font-mono text-xs break-all select-all'>
                    {groupSecret(qr.secret)}
                  </code>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={copySecret}
                    aria-label='Copy key'
                  >
                    <IconCopy className='h-4 w-4' />
                  </Button>
                </div>
                <a
                  href={qr.otpauth_url}
                  className='text-primary inline-block underline-offset-4 hover:underline sm:hidden'
                >
                  On this phone? Open in your authenticator app
                </a>
              </div>
            </div>
          ) : loadError ? (
            <div className='space-y-2'>
              <p role='alert' className='text-destructive'>
                {loadError}
                {waitText}
              </p>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={setup.isPending || isLocked}
                onClick={() => startSetup()}
              >
                Try again
              </Button>
            </div>
          ) : (
            <Skeleton className='h-[180px] w-[180px]' />
          )}
        </li>

        <li>
          <form onSubmit={onSubmit} className='space-y-3' noValidate>
            <Label htmlFor='mfa-setup-code' className='font-normal'>
              Enter the 6-digit code the app shows
            </Label>
            <Input
              id='mfa-setup-code'
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder='123 456'
              inputMode='numeric'
              autoComplete='one-time-code'
              maxLength={16}
              className='font-mono text-lg tracking-[0.3em]'
              aria-invalid={!!error}
              disabled={!qr}
            />

            {error && (
              <div role='alert' className='text-destructive space-y-1'>
                <p>
                  {error}
                  {waitText}
                </p>
                {hint && <p>{hint}</p>}
              </div>
            )}

            <Button
              type='submit'
              className='w-full'
              disabled={!qr || confirm.isPending || isLocked || !code.trim()}
            >
              {confirm.isPending && (
                <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
              )}
              {confirm.isPending
                ? 'Checking...'
                : isLocked
                  ? `Try again in ${secondsLeft}s`
                  : 'Turn on two-step sign-in'}
            </Button>
          </form>
        </li>
      </ol>

      <div className='text-center text-sm'>
        <button
          type='button'
          onClick={() => onRestart(null)}
          className='text-muted-foreground underline-offset-4 hover:underline'
        >
          Back to sign in
        </button>
      </div>
    </div>
  );
}
