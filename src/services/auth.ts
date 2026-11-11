import apiClient from '@/lib/api/client';
import {
  LoginCredentials,
  LoginResult,
  MfaSetupResult,
  MfaStatus,
  RecoveryCodesResult
} from '@/types/auth';
import axios from 'axios';

// Sign-in goes through this app's own routes (/api/auth/*), which hold the
// session and the MFA ticket in httpOnly cookies
export const authEndpoints = {
  async login(body: LoginCredentials): Promise<LoginResult> {
    const { data } = await axios.post<LoginResult>('/api/auth/login', body);
    return data;
  },
  async logout() {
    const { data } = await axios.post('/api/auth/logout');
    return data;
  },
  async mfaSetup(): Promise<MfaSetupResult> {
    const { data } = await axios.post<MfaSetupResult>('/api/auth/mfa/setup');
    return data;
  },
  async mfaConfirm(code: string): Promise<RecoveryCodesResult> {
    const { data } = await axios.post<RecoveryCodesResult>(
      '/api/auth/mfa/confirm',
      { code }
    );
    return data;
  },
  async mfaVerify(
    body: { code: string } | { recovery_code: string }
  ): Promise<void> {
    await axios.post('/api/auth/mfa/verify', body);
  }
};

// Signed in: straight to the API with the session cookie
export const mfaEndpoints = {
  async status(): Promise<MfaStatus> {
    const { data } = await apiClient.get<MfaStatus>('/auth/mfa/status');
    return data;
  },
  /** A wrong code is 400 MFA_CODE_INVALID (never a 401) */
  async regenerateRecoveryCodes(code: string): Promise<RecoveryCodesResult> {
    const { data } = await apiClient.post<RecoveryCodesResult>(
      '/auth/mfa/recovery-codes',
      { code }
    );
    return data;
  }
};
