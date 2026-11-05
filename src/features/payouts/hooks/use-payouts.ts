import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiError, retryUnlessClientError } from '@/lib/api/errors';
import { queryKeys } from '@/lib/query-keys';
import { payoutsApi } from '../api/payouts.service';
import {
  MarkPayoutPaidBody,
  QueryAdminPayoutsParams
} from '../types/payout.types';

/**
 * Hook to fetch the payout queue (paginated, filterable)
 */
export function usePayouts(params: QueryAdminPayoutsParams) {
  return useQuery({
    queryKey: queryKeys.payouts.list(params),
    queryFn: () => payoutsApi.getAll(params),
    placeholderData: keepPreviousData,
    retry: retryUnlessClientError,
    staleTime: 30 * 1000
  });
}

/**
 * Hook to fetch a single payout with everything needed to decide on it
 */
export function usePayout(id: string) {
  return useQuery({
    queryKey: queryKeys.payouts.detail(id),
    queryFn: () => payoutsApi.getById(id),
    enabled: !!id,
    retry: retryUnlessClientError,
    // Balances and bank details must be fresh when deciding
    staleTime: 0
  });
}

function useInvalidatePayout() {
  const queryClient = useQueryClient();
  return (id: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.payouts.lists() });
    queryClient.invalidateQueries({ queryKey: queryKeys.payouts.detail(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.ledger.all() });
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() });
    // These actions are recorded in the audit log
    queryClient.invalidateQueries({ queryKey: queryKeys.adminAudit.all() });
  };
}

// A 409 means the payout moved on (another superadmin, another tab):
// refetch so the screen shows the real state
const STALE_STATE_CODES = new Set([
  'payout_not_requested',
  'payout_not_approved',
  'payout_already_paid'
]);

/**
 * Hook to approve a requested payout
 */
export function useApprovePayout() {
  const invalidate = useInvalidatePayout();

  return useMutation({
    mutationFn: (id: string) => payoutsApi.approve(id),
    onSuccess: (_data, id) => {
      invalidate(id);
      toast.success(
        'Payout approved — send the bank transfer, then mark it paid'
      );
    },
    onError: (error, id) => {
      const { code, message } = getApiError(error, 'Failed to approve payout');
      if (code && STALE_STATE_CODES.has(code)) invalidate(id);
      toast.error(message);
    }
  });
}

/**
 * Hook to reject a payout
 */
export function useRejectPayout() {
  const invalidate = useInvalidatePayout();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      payoutsApi.reject(id, reason),
    onSuccess: (_data, { id }) => {
      invalidate(id);
      toast.success('Payout rejected — the vendor has been notified');
    },
    onError: (error, { id }) => {
      const { code, message } = getApiError(error, 'Failed to reject payout');
      if (code && STALE_STATE_CODES.has(code)) invalidate(id);
      toast.error(message);
    }
  });
}

/**
 * Hook to record the bank transfer and mark a payout paid. Errors are left
 * to the caller: the mark-paid dialog shows them inline, and
 * vendor_payable_insufficient must be a blocking message, not a toast.
 */
export function useMarkPayoutPaid() {
  const invalidate = useInvalidatePayout();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: MarkPayoutPaidBody }) =>
      payoutsApi.markPaid(id, body),
    onSuccess: (_data, { id }) => {
      invalidate(id);
      toast.success('Payout marked as paid and posted to the ledger');
    },
    onError: (error, { id }) => {
      const { code } = getApiError(error);
      if (
        code &&
        (STALE_STATE_CODES.has(code) || code === 'vendor_payable_insufficient')
      ) {
        invalidate(id);
      }
    }
  });
}

/**
 * Upload a receipt file. Errors are left to the caller (shown next to the
 * file picker). The file itself is never cached — see ReceiptViewer.
 */
export function useUploadReceipt() {
  return useMutation({
    mutationFn: (file: File) => payoutsApi.uploadReceipt(file)
  });
}

// The payout moved on, or the receipt can't be used: refetch
const RECEIPT_STALE_CODES = new Set(['payout_not_paid', 'payout_has_receipt']);

/**
 * Attach a receipt to a paid payout that has none. Errors are left to the
 * caller so the dialog can show them inline.
 */
export function useAttachReceipt() {
  const invalidate = useInvalidatePayout();

  return useMutation({
    mutationFn: ({ id, receiptId }: { id: string; receiptId: string }) =>
      payoutsApi.attachReceipt(id, receiptId),
    onSuccess: (_data, { id }) => {
      invalidate(id);
      toast.success('Receipt attached');
    },
    onError: (error, { id }) => {
      const { code } = getApiError(error);
      if (code && RECEIPT_STALE_CODES.has(code)) invalidate(id);
    }
  });
}
