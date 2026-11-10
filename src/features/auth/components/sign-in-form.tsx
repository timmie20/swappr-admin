'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/forms/form-input';
import { Icons } from '@/components/icons';
import { signInSchema } from '@/schemas/auth';
import { useLogin } from '@/hooks/services/use-auth';
import { getApiError } from '@/lib/api/errors';
import { formatRetryAfter } from '@/lib/api/rate-limit';

type SignInFormValues = z.infer<typeof signInSchema>;

// No site key (local dev): no widget, and the form submits without a token
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const CAPTCHA_MESSAGE = 'Please complete the security check and try again.';

export default function SignInForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('callbackUrl') ?? '/dashboard/overview';
  const login = useLogin();
  const router = useRouter();

  const turnstileRef = useRef<TurnstileInstance>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Login 429: the backend's message, plus a countdown while sign-in is locked
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const secondsLeft = lockedUntil
    ? Math.max(0, Math.ceil((lockedUntil - now) / 1000))
    : 0;
  const isLocked = secondsLeft > 0;

  useEffect(() => {
    if (!lockedUntil) return;
    const id = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= lockedUntil) {
        setLockedUntil(null);
        setFormError(null);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

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
        onSuccess: () => router.push(redirect),
        onError: (error) => {
          resetSecurityCheck();
          const { status, code, message, extra } = getApiError(
            error,
            'Failed to sign in'
          );

          if (status === 429) {
            const retryAfter = extra.retry_after_seconds;
            if (typeof retryAfter === 'number' && retryAfter > 0) {
              const start = Date.now();
              setNow(start);
              setLockedUntil(start + retryAfter * 1000);
            }
            setFormError(message);
          } else if (code === 'CAPTCHA_REQUIRED' || code === 'CAPTCHA_FAILED') {
            setFormError(CAPTCHA_MESSAGE);
          }
        }
      }
    );
  }

  return (
    <Form
      form={form}
      onSubmit={form.handleSubmit(onSubmit)}
      className='w-full space-y-6'
    >
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
