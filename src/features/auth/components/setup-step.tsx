'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { IconCopy } from '@tabler/icons-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { useMfaConfirm } from '@/hooks/services/use-auth';
import { useRetryCountdown } from '@/hooks/use-retry-countdown';
import { formatRetryAfter } from '@/lib/api/rate-limit';
import { authEndpoints } from '@/services/auth';
import type { MfaSetupResult } from '@/types/auth';
import {
  attemptsLeftText,
  classifyMfaError,
  groupSecret
} from '../utils/mfa-errors';
import { CodeInput } from './code-input';

const QR_SIZE = 240;

/**
 * First sign-in without MFA: scan the QR code, then enter a code from the
 * app. The confirm signs the admin in and returns the recovery codes.
 */
export function SetupStep({
  onConfirmed,
  onRestart
}: {
  onConfirmed: (recoveryCodes: string[]) => void;
  onRestart: (message: string | null) => void;
}) {
  const confirm = useMfaConfirm();
  const countdown = useRetryCountdown();
  const startCountdown = countdown.start;

  const [phase, setPhase] = useState<'scan' | 'code'>('scan');
  const [qr, setQr] = useState<MfaSetupResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  // Every setup call makes a new secret, so a QR already scanned stops
  // working. Called directly rather than through useMutation: in Strict Mode
  // the mount/unmount/mount drops a mutation's per-call callbacks, so the QR
  // never arrived.
  const startSetup = useCallback(
    async (nextNotice: string | null = null) => {
      setLoading(true);
      setLoadError(null);
      try {
        setQr(await authEndpoints.mfaSetup());
        setNotice(nextNotice);
      } catch (err) {
        const action = classifyMfaError(err);
        if (action.kind === 'restart') {
          onRestart(action.message);
          return;
        }
        if (action.kind === 'rate_limited') {
          startCountdown(action.retryAfterSeconds);
        }
        setLoadError(action.message);
      } finally {
        setLoading(false);
      }
    },
    [onRestart, startCountdown]
  );

  // Once per mount (the ref survives Strict Mode's second effect run)
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void startSetup();
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

  function submit(value: string) {
    if (!/^\d{6}$/.test(value) || confirm.isPending || countdown.isLocked) {
      return;
    }
    setError(null);
    setHint(null);

    confirm.mutate(value, {
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
            setPhase('scan');
            void startSetup(
              'We made a new QR code. Scan it again, then enter the new code.'
            );
            return;
          case 'rate_limited':
            startCountdown(action.retryAfterSeconds);
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

  if (phase === 'code') {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(code);
        }}
        className='flex w-full flex-col items-center space-y-6 text-center'
        noValidate
      >
        <h1 className='text-2xl font-semibold tracking-tight'>
          Enter the 6-digit code
        </h1>

        <CodeInput
          value={code}
          onChange={setCode}
          onComplete={submit}
          disabled={confirm.isPending}
          invalid={!!error}
        />

        {error && (
          <div role='alert' className='text-destructive space-y-1 text-sm'>
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
          disabled={confirm.isPending || isLocked || code.length !== 6}
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

        <button
          type='button'
          onClick={() => {
            setPhase('scan');
            setCode('');
            setError(null);
            setHint(null);
          }}
          className='text-muted-foreground text-sm underline-offset-4 hover:underline'
        >
          Back to the QR code
        </button>
      </form>
    );
  }

  return (
    <div className='flex w-full flex-col items-center space-y-6 text-center'>
      <h1 className='text-2xl font-semibold tracking-tight'>
        Set up two-step sign-in
      </h1>

      <p className='text-muted-foreground text-sm'>
        Scan this QR code with your authenticator app
      </p>

      {qr ? (
        // A data URL from the backend; next/image adds nothing here
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qr.qr_data_url}
          alt='QR code for your authenticator app'
          width={QR_SIZE}
          height={QR_SIZE}
          className='rounded-md border bg-white p-2'
        />
      ) : loading ? (
        <Skeleton
          className='rounded-md'
          style={{ width: QR_SIZE, height: QR_SIZE }}
        />
      ) : (
        <div className='space-y-3'>
          <p role='alert' className='text-destructive text-sm'>
            {loadError ?? 'Couldn’t load the QR code.'}
            {waitText}
          </p>
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={isLocked}
            onClick={() => void startSetup()}
          >
            Try again
          </Button>
        </div>
      )}

      {notice && qr && (
        <p role='status' className='text-destructive text-sm'>
          {notice}
        </p>
      )}

      {qr && (
        <div className='text-sm'>
          {showKey ? (
            <div className='flex flex-col items-center gap-2'>
              <span className='text-muted-foreground'>
                Enter this key in the app instead
              </span>
              <div className='flex items-center gap-1'>
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
                className='text-primary underline-offset-4 hover:underline sm:hidden'
              >
                Open in your authenticator app
              </a>
            </div>
          ) : (
            <button
              type='button'
              onClick={() => setShowKey(true)}
              className='text-muted-foreground underline-offset-4 hover:underline'
            >
              Can&apos;t scan it?
            </button>
          )}
        </div>
      )}

      <Button
        type='button'
        className='w-full'
        disabled={!qr}
        onClick={() => {
          setNotice(null);
          setPhase('code');
        }}
      >
        I&apos;ve scanned the code
      </Button>

      <button
        type='button'
        onClick={() => onRestart(null)}
        className='text-muted-foreground text-sm underline-offset-4 hover:underline'
      >
        Back to sign in
      </button>
    </div>
  );
}
