export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp in ms — converted from ISO at login/refresh
}

export interface AdminSession {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role: string;
}

export type LoginCredentials = {
  email: string;
  password: string;
  turnstile_token?: string;
};

/**
 * What /api/auth/login tells the page to do next: "done" (signed in; a
 * backend without MFA), "verify" (enter a code) or "setup" (set MFA up).
 */
export type SignInStep = 'done' | 'verify' | 'setup';

export interface LoginResult {
  step: SignInStep;
  message?: string;
}

/** POST /api/auth/mfa/setup */
export interface MfaSetupResult {
  otpauth_url: string;
  /** A PNG data URL, for an <img> */
  qr_data_url: string;
  /** For typing in by hand */
  secret: string;
}

/** POST /api/auth/mfa/confirm and the signed-in regenerate */
export interface RecoveryCodesResult {
  recovery_codes: string[];
}

/** GET /auth/mfa/status */
export interface MfaStatus {
  enabled_at: string | null;
  recovery_codes_left: number;
}

/** Full admin record from /admins/me */
export type AdminProfile = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  role: string;
  created_at?: string;
  updated_at?: string;
};
