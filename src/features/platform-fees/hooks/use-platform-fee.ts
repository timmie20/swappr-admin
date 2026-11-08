import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiError, retryUnlessClientError } from '@/lib/api/errors';
import { queryKeys } from '@/lib/query-keys';
import { platformFeeApi } from '../api/platform-fee.service';
import {
  EndPromotionBody,
  PlatformFeeSettings,
  SetPromotionBody,
  UpdateStandardBody
} from '../types/platform-fee.types';

export function usePlatformFeeSettings() {
  return useQuery({
    queryKey: queryKeys.platformFee.settings(),
    queryFn: platformFeeApi.get,
    // The version must be fresh before a change
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: retryUnlessClientError
  });
}

export function useFeePreview(amountKobo: number | null) {
  return useQuery({
    queryKey: queryKeys.platformFee.preview(amountKobo ?? 0),
    queryFn: () => platformFeeApi.preview(amountKobo as number),
    enabled: amountKobo !== null && amountKobo >= 1,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    retry: retryUnlessClientError
  });
}

/**
 * The three writes. Each returns the new settings, which replace the cached
 * ones. Errors are left to the caller (shown in the dialog, reason kept);
 * a stale version refetches so the dialog can show what changed.
 */
function useFeeMutation<TBody>(
  mutationFn: (body: TBody) => Promise<PlatformFeeSettings>,
  success: string
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKeys.platformFee.settings(), settings);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.platformFee.all(),
        predicate: (q) => q.queryKey[1] === 'preview'
      });
      // Recorded in the audit trail (platform category)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.adminAudit.all()
      });
      toast.success(success);
    },
    onError: (error) => {
      if (getApiError(error).code === 'SETTINGS_CHANGED') {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.platformFee.settings()
        });
      }
    }
  });
}

export const useUpdateStandardFee = () =>
  useFeeMutation(
    (body: UpdateStandardBody) => platformFeeApi.updateStandard(body),
    'Standard rate saved. It applies to orders paid from now on.'
  );

export const useSetPromotion = () =>
  useFeeMutation(
    (body: SetPromotionBody) => platformFeeApi.setPromotion(body),
    'Promotion saved'
  );

export const useEndPromotion = () =>
  useFeeMutation(
    (body: EndPromotionBody) => platformFeeApi.endPromotion(body),
    'Promotion ended. Orders paid from now on pay the standard rate.'
  );
