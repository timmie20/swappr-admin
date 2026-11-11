'use client';

import { REGEXP_ONLY_DIGITS } from 'input-otp';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot
} from '@/components/ui/input-otp';

const SLOT = 'h-12 w-11 text-lg sm:w-12';

/**
 * The 6-digit authenticator code. Digits only; a pasted "123 456" loses its
 * space. onComplete fires when the sixth digit goes in.
 */
export function CodeInput({
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
  autoFocus = true
}: {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <InputOTP
      maxLength={6}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      pattern={REGEXP_ONLY_DIGITS}
      pasteTransformer={(pasted) => pasted.replace(/\D/g, '')}
      inputMode='numeric'
      autoComplete='one-time-code'
      autoFocus={autoFocus}
      disabled={disabled}
      aria-label='6-digit code'
      containerClassName='justify-center'
    >
      <InputOTPGroup>
        {[0, 1, 2].map((i) => (
          <InputOTPSlot
            key={i}
            index={i}
            className={SLOT}
            aria-invalid={invalid}
          />
        ))}
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        {[3, 4, 5].map((i) => (
          <InputOTPSlot
            key={i}
            index={i}
            className={SLOT}
            aria-invalid={invalid}
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
