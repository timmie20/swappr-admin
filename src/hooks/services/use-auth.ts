'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { LoginCredentials } from '@/types/auth';
import { authEndpoints } from '@/services/auth';

/**
 * Call once the session cookies are set (password on a backend without MFA,
 * or after the code step). Wipes everything, not just user keys: a previous
 * admin's session may have left dashboard/query cache from another account.
 */
export function useOnSignedIn() {
  const queryClient = useQueryClient();
  return () => {
    toast.success('Successfully signed in');
    queryClient.clear();
  };
}

// Errors are shown by the sign-in steps themselves (wait times, security
// check, wrong codes), so these mutations don't toast
export function useLogin() {
  return useMutation({
    mutationFn: (cred: LoginCredentials) => authEndpoints.login(cred)
  });
}

export function useMfaSetup() {
  return useMutation({ mutationFn: () => authEndpoints.mfaSetup() });
}

export function useMfaConfirm() {
  return useMutation({
    mutationFn: (code: string) => authEndpoints.mfaConfirm(code)
  });
}

export function useMfaVerify() {
  return useMutation({
    mutationFn: (body: { code: string } | { recovery_code: string }) =>
      authEndpoints.mfaVerify(body)
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: () => authEndpoints.logout(),
    onSuccess: async () => {
      // Hard navigation, not router.push — tears down the whole JS runtime
      // (React Query cache, router cache, polling intervals) so nothing from
      // this admin's session can leak into the next login on this browser
      window.location.replace('/auth/sign-in');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to sign out';
      toast.error(message);
    }
  });
}
