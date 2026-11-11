'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/forms/form-input';
import { Icons } from '@/components/icons';
import { signInSchema } from '@/schemas/auth';
import { useLogin } from '@/hooks/services/use-auth';
import { useRetryCountdown } from '@/hooks/use-retry-countdown';
import { getApiError } from '@/lib/api/errors';
import { formatRetryAfter } from '@/lib/api/rate-limit';
import type { LoginResult } from '@/types/auth';

type SignInFormValues = z.infer<typeof signInSchema>;

// No site key (local dev): no widget, and the form submits without a token
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const CAPTCHA_MESSAGE = 'Please complete the security check and try again.';

/** Email and password (and the Turnstile check). */
export function PasswordStep({
  notice,
  onResult
}: {
  /** Why the admin is back here, e.g. the code step timed out */
  notice?: string | null;
  onResult: (result: LoginResult, email: string) => void;
}) {
  const login = useLogin();
  const countdown = useRetryCountdown();

  const turnstileRef = useRef<TurnstileInstance>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' }
  });

  // Tokens are single use: after any failed submit the old one is spent
  function resetSecurityCheck() {
    turnstileRef.current?.reset();
    setTurnstileToken(null);
  }

  function onSubmit(values: SignInFormValues) {
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setFormError(CAPTCHA_MESSAGE);
      return;
    }
    setFormError(null);

    login.mutate(
      {
        email: values.email,
        password: values.password,
        ...(turnstileToken ? { turnstile_token: turnstileToken } : {})
      },
      {
        onSuccess: (result) => onResult(result, values.email),
        onError: (error) => {
          resetSecurityCheck();
          const { status, code, message, extra } = getApiError(
            error,
            'Failed to sign in'
          );

          if (status === 429) {
            const retryAfter = extra.retry_after_seconds;
            countdown.start(typeof retryAfter === 'number' ? retryAfter : null);
            setFormError(message);
          } else if (code === 'CAPTCHA_REQUIRED' || code === 'CAPTCHA_FAILED') {
            setFormError(CAPTCHA_MESSAGE);
          } else {
            setFormError(message);
          }
        }
      }
    );
  }

  const { isLocked, secondsLeft } = countdown;

  return (
    <Form
      form={form}
      onSubmit={form.handleSubmit(onSubmit)}
      className='w-full space-y-6'
    >
      {notice && !formError && (
        <p role='status' className='text-destructive text-sm'>
          {notice}
        </p>
      )}

      <FormInput
        control={form.control}
        name='email'
        type='email'
        label='Email'
        placeholder='you@swappr.com.ng'
        required
      />
      <FormInput
        control={form.control}
        name='password'
        type='password'
        label='Password'
        placeholder='Enter your password'
        required
      />

      {TURNSTILE_SITE_KEY && (
        <Turnstile
          ref={turnstileRef}
          siteKey={TURNSTILE_SITE_KEY}
          options={{ action: 'admin-login', size: 'flexible', theme: 'auto' }}
          onSuccess={(token) => {
            setTurnstileToken(token);
            if (!isLocked) setFormError(null);
          }}
          onExpire={() => setTurnstileToken(null)}
          onError={() => setTurnstileToken(null)}
        />
      )}

      {formError && (
        <p role='alert' className='text-destructive text-sm'>
          {formError}
          {isLocked && ` You can try again ${formatRetryAfter(secondsLeft)}.`}
        </p>
      )}

      <Button
        type='submit'
        className='w-full'
        disabled={login.isPending || isLocked}
      >
        {login.isPending && (
          <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
        )}
        {login.isPending
          ? 'Signing in...'
          : isLocked
            ? `Try again in ${secondsLeft}s`
            : 'Sign in'}
      </Button>
    </Form>
  );
}
