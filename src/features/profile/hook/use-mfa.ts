import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { retryUnlessClientError } from '@/lib/api/errors';
import { queryKeys } from '@/lib/query-keys';
import { mfaEndpoints } from '@/services/auth';

export function useMfaStatus() {
  return useQuery({
    queryKey: queryKeys.mfa.status(),
    queryFn: mfaEndpoints.status,
    retry: retryUnlessClientError
  });
}

/** Errors are shown in the dialog (wrong code, wait time) */
export function useRegenerateRecoveryCodes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => mfaEndpoints.regenerateRecoveryCodes(code),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.mfa.all() });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.adminAudit.all()
      });
    }
  });
}
