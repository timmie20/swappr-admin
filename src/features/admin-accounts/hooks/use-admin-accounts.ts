import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { retryUnlessClientError } from '@/lib/api/errors';
import { queryKeys } from '@/lib/query-keys';
import { adminAccountsApi } from '../api/admin-accounts.service';

export function useAdminAccounts() {
  return useQuery({
    queryKey: queryKeys.admins.list(),
    queryFn: adminAccountsApi.list,
    retry: retryUnlessClientError
  });
}

/** Errors are shown in the dialog, with the reason kept */
export function useResetAdminMfa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      adminAccountsApi.resetMfa(userId, reason),
    onSuccess: (result) => {
      toast.success(result.message);
      void queryClient.invalidateQueries({ queryKey: queryKeys.admins.all() });
      // Recorded in the audit trail (admin_security category)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.adminAudit.all()
      });
    }
  });
}
