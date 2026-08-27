import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { payoutsApi } from '../api/payouts.service';

/**
 * Hook to retry a failed vendor payout
 */
export function useRetryPayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => payoutsApi.retry(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payouts.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.payouts.detail(id) });
      toast.success('Payout retry initiated successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to retry payout';
      toast.error(message);
    }
  });
}
