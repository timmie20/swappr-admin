'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { useMfaVerify } from '@/hooks/services/use-auth';
import { useRetryCountdown } from '@/hooks/use-retry-countdown';
import { formatRetryAfter } from '@/lib/api/rate-limit';
import { mfaVerifySchema } from '@/schemas/auth';
import { attemptsLeftText, classifyMfaError } from '../utils/mfa-errors';
import { CodeInput } from './code-input';

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

  function submit(input: string) {
    if (verify.isPending || countdown.isLocked) return;
    const body = useRecovery ? { recovery_code: input } : { code: input };
    const parsed = mfaVerifySchema.safeParse(body);
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
  const ready = useRecovery ? !!value.trim() : value.length === 6;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(value);
      }}
      className='flex w-full flex-col items-center space-y-6 text-center'
      noValidate
    >
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>
          {useRecovery ? 'Enter a recovery code' : 'Enter the 6-digit code'}
        </h1>
        <p className='text-muted-foreground text-sm'>
          {useRecovery
            ? 'One of the codes you saved when you set up two-step sign-in. Each works once.'
            : 'From your authenticator app.'}
        </p>
      </div>

      {useRecovery ? (
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder='xxxxx-xxxxx'
          aria-label='Recovery code'
          autoComplete='off'
          autoCapitalize='none'
          spellCheck={false}
          maxLength={32}
          autoFocus
          className='text-center font-mono tracking-wider'
          aria-invalid={!!error}
        />
      ) : (
        <CodeInput
          value={value}
          onChange={setValue}
          onComplete={submit}
          disabled={verify.isPending}
          invalid={!!error}
        />
      )}

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
        disabled={verify.isPending || isLocked || !ready}
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
