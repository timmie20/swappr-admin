'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { LoginCredentials } from '@/types/auth';
import { authEndpoints } from '@/services/auth';

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cred: LoginCredentials) => authEndpoints.login(cred),
    onSuccess: async () => {
      toast.success('Successfully signed in');
      // Wipe everything, not just user keys — a previous admin's session may
      // have left dashboard/query cache from a different account
      queryClient.clear();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to sign in';
      toast.error(message);
    }
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
