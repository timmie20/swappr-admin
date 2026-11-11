'use client';

import { useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useOnSignedIn } from '@/hooks/services/use-auth';
import type { LoginResult } from '@/types/auth';
import { PasswordStep } from './password-step';
import { RecoveryCodesPanel } from './recovery-codes-panel';
import { SetupStep } from './setup-step';
import { VerifyStep } from './verify-step';

// password → verify (has MFA) → dashboard
// password → setup → recovery codes → dashboard (first sign-in)
// password → dashboard (a backend without MFA)
type Step =
  | { kind: 'password'; notice: string | null }
  | { kind: 'verify' }
  | { kind: 'setup' }
  | { kind: 'codes'; codes: string[] };

/** Only same-site paths, so the callback can't send the admin elsewhere */
function safeRedirect(callbackUrl: string | null): string {
  if (callbackUrl?.startsWith('/') && !callbackUrl.startsWith('//')) {
    return callbackUrl;
  }
  return '/dashboard/overview';
}

export default function SignInForm() {
  const searchParams = useSearchParams();
  const redirect = safeRedirect(searchParams.get('callbackUrl'));
  const router = useRouter();
  const onSignedIn = useOnSignedIn();

  const [step, setStep] = useState<Step>({ kind: 'password', notice: null });
  const [email, setEmail] = useState('');

  const finish = useCallback(() => {
    onSignedIn();
    router.push(redirect);
  }, [onSignedIn, router, redirect]);

  const restart = useCallback(
    (notice: string | null) => setStep({ kind: 'password', notice }),
    []
  );

  function onPassword(result: LoginResult, signedInEmail: string) {
    setEmail(signedInEmail);
    if (result.step === 'verify') setStep({ kind: 'verify' });
    else if (result.step === 'setup') setStep({ kind: 'setup' });
    else finish();
  }

  switch (step.kind) {
    case 'verify':
      return <VerifyStep onSignedIn={finish} onRestart={restart} />;
    case 'setup':
      return (
        <SetupStep
          onConfirmed={(codes) => setStep({ kind: 'codes', codes })}
          onRestart={restart}
        />
      );
    case 'codes':
      return (
        <div className='w-full space-y-6'>
          <div className='space-y-1'>
            <h1 className='text-2xl font-semibold tracking-tight'>
              Save your recovery codes
            </h1>
            <p className='text-muted-foreground text-sm'>
              Two-step sign-in is on.
            </p>
          </div>
          <RecoveryCodesPanel
            codes={step.codes}
            account={email}
            onContinue={finish}
            continueLabel='Continue to dashboard'
          />
        </div>
      );
    default:
      return <PasswordStep notice={step.notice} onResult={onPassword} />;
  }
}
