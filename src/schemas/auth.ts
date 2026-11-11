import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  // Cloudflare Turnstile token, single use. Optional: absent when no site key
  // is configured (local dev). The backend decides whether it's required.
  turnstile_token: z.string().max(2048).optional()
});

// The 6-digit code from the authenticator app. Spaces are fine ("123 456");
// the backend strips them.
export const mfaCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .max(16)
    .refine((v) => /^\d{6}$/.test(v.replace(/\s+/g, '')), {
      message: 'Enter the 6-digit code from your authenticator app'
    })
});

// A recovery code (xxxxx-xxxxx). Case, spaces and dashes don't matter.
const recoveryCode = z
  .string()
  .trim()
  .max(32)
  .refine((v) => /^[a-z0-9]{10}$/i.test(v.replace(/[^a-z0-9]/gi, '')), {
    message: 'Enter a recovery code, like abcde-23456'
  });

/** Exactly one of `code` or `recovery_code` */
export const mfaVerifySchema = z.union([
  mfaCodeSchema.strict(),
  z.object({ recovery_code: recoveryCode }).strict()
]);
