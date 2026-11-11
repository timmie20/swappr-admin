'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { useMfaVerify } from '@/hooks/services/use-auth';
import { useRetryCountdown } from '@/hooks/use-retry-countdown';
import { formatRetryAfter } from '@/lib/api/rate-limit';
import { mfaCodeSchema, mfaVerifySchema } from '@/schemas/auth';
import { attemptsLeftText, classifyMfaError } from '../utils/mfa-errors';

/** Sign-in's second step: a 6-digit code, or a recovery code. */
export function VerifyStep({
  onSignedIn,
  onRestart
}: {
  onSignedIn: () => void;
  /** The ticket is finished: back to the password step with this message */
  onRestart: (message: string | null) => void;
}) {
  const verify = useMfaVerify();
  const countdown = useRetryCountdown();
  const [useRecovery, setUseRecovery] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  function switchMode() {
    setUseRecovery((v) => !v);
    setValue('');
    setError(null);
    setHint(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = useRecovery ? { recovery_code: value } : { code: value };
    const parsed = useRecovery
      ? mfaVerifySchema.safeParse(body)
      : mfaCodeSchema.safeParse(body);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the code');
      return;
    }
    setError(null);
    setHint(null);

    verify.mutate(body, {
      onSuccess: onSignedIn,
      onError: (err) => {
        const action = classifyMfaError(err);
        switch (action.kind) {
          case 'restart':
            onRestart(action.message);
            return;
          case 'code_invalid':
            setValue('');
            setError(action.message);
            setHint(attemptsLeftText(action.attemptsLeft));
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

  return (
    <form onSubmit={onSubmit} className='w-full space-y-6' noValidate>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>
          Two-step sign-in
        </h1>
        <p className='text-muted-foreground text-sm'>
          {useRecovery
            ? 'Enter one of the recovery codes you saved when you set up two-step sign-in. Each code works once.'
            : 'Enter the 6-digit code from your authenticator app.'}
        </p>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='mfa-code'>
          {useRecovery ? 'Recovery code' : 'Code'}
        </Label>
        {useRecovery ? (
          <Input
            id='mfa-code'
            key='recovery'
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder='xxxxx-xxxxx'
            autoComplete='off'
            autoCapitalize='none'
            spellCheck={false}
            maxLength={32}
            autoFocus
            className='font-mono tracking-wider'
            aria-invalid={!!error}
          />
        ) : (
          <Input
            id='mfa-code'
            key='code'
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder='123 456'
            inputMode='numeric'
            autoComplete='one-time-code'
            maxLength={16}
            autoFocus
            className='font-mono text-lg tracking-[0.3em]'
            aria-invalid={!!error}
          />
        )}
      </div>

      {error && (
        <div role='alert' className='text-destructive space-y-1 text-sm'>
          <p>
            {error}
            {isLocked && ` You can try again ${formatRetryAfter(secondsLeft)}.`}
          </p>
          {hint && <p>{hint}</p>}
        </div>
      )}

      <Button
        type='submit'
        className='w-full'
        disabled={verify.isPending || isLocked || !value.trim()}
      >
        {verify.isPending && (
          <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
        )}
        {verify.isPending
          ? 'Checking...'
          : isLocked
            ? `Try again in ${secondsLeft}s`
            : 'Continue'}
      </Button>

      <div className='flex flex-col items-center gap-2 text-sm'>
        <button
          type='button'
          onClick={switchMode}
          className='text-primary underline-offset-4 hover:underline'
        >
          {useRecovery
            ? 'Use a code from your authenticator app'
            : 'Use a recovery code instead'}
        </button>
        <button
          type='button'
          onClick={() => onRestart(null)}
          className='text-muted-foreground underline-offset-4 hover:underline'
        >
          Back to sign in
        </button>
      </div>
    </form>
  );
}
