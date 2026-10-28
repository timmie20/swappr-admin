import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiError, retryUnlessClientError } from '@/lib/api/errors';
import { formatKobo } from '@/lib/format';
import { queryKeys } from '@/lib/query-keys';
import { ledgerApi } from '../api/ledger.service';
import {
  QueryLedgerTransactionsParams,
  QuerySyncIssuesParams,
  RecordSettlementBody,
  SyncIssueAction
} from '../types/ledger.types';

const FRESH = { retry: retryUnlessClientError, staleTime: 15 * 1000 };

export function useLedgerSummary() {
  return useQuery({
    queryKey: queryKeys.ledger.summary(),
    queryFn: ledgerApi.getSummary,
    ...FRESH
  });
}

export function useLedgerReconciliation() {
  return useQuery({
    queryKey: queryKeys.ledger.reconciliation(),
    queryFn: ledgerApi.getReconciliation,
    ...FRESH
  });
}

export function useLedgerTransactions(params: QueryLedgerTransactionsParams) {
  return useQuery({
    queryKey: queryKeys.ledger.transactions(params),
    queryFn: () => ledgerApi.getTransactions(params),
    placeholderData: keepPreviousData,
    ...FRESH
  });
}

export function usePaystackSettlements() {
  return useQuery({
    queryKey: queryKeys.ledger.paystackSettlements(),
    queryFn: ledgerApi.getPaystackSettlements,
    ...FRESH
  });
}

export function useSyncIssues(params: QuerySyncIssuesParams) {
  return useQuery({
    queryKey: queryKeys.ledger.syncIssues(params),
    queryFn: () => ledgerApi.getSyncIssues(params),
    placeholderData: keepPreviousData,
    ...FRESH
  });
}

// Any ledger write can move every balance, warning and list
function useInvalidateLedger() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.ledger.all() });
    queryClient.invalidateQueries({ queryKey: queryKeys.payouts.all() });
  };
}

/**
 * Dry run for the record-settlement confirmation step. Writes nothing, so it
 * invalidates nothing.
 */
export function usePreviewSettlement() {
  return useMutation({ mutationFn: ledgerApi.previewSettlement });
}

/**
 * Errors are left to the caller so the form can show them inline
 * (settlement_already_recorded links to the existing entry).
 */
export function useRecordSettlement() {
  const invalidate = useInvalidateLedger();

  return useMutation({
    mutationFn: (body: RecordSettlementBody) =>
      ledgerApi.recordSettlement(body),
    onSuccess: (data) => {
      invalidate();
      toast.success(
        `Settlement ${data.settlement_id} recorded (${formatKobo(data.amount_kobo)})${data.revision > 0 ? ` — revision ${data.revision}` : ''}`
      );
    },
    onError: (error) => {
      // Another settlement may have landed since the preview: refresh balances
      const { code } = getApiError(error);
      if (code === 'settlement_exceeds_paystack_balance') invalidate();
    }
  });
}

export function useSyncSettlements() {
  const invalidate = useInvalidateLedger();

  return useMutation({
    mutationFn: ledgerApi.syncSettlements,
    onSuccess: () => invalidate(),
    onError: (error) => {
      toast.error(getApiError(error, 'Settlement sync failed').message);
    }
  });
}

export function useReverseTransaction() {
  const invalidate = useInvalidateLedger();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      ledgerApi.reverseTransaction(id, reason),
    onSuccess: () => {
      invalidate();
      toast.success(
        'Transaction reversed — you can now record the corrected settlement'
      );
    },
    onError: (error) => {
      const { code, message } = getApiError(
        error,
        'Failed to reverse the transaction'
      );
      if (code === 'already_reversed' || code === 'not_reversible') {
        invalidate();
      }
      toast.error(message);
    }
  });
}

export function useResolveSyncIssue() {
  const invalidate = useInvalidateLedger();

  return useMutation({
    mutationFn: ({
      id,
      action,
      note
    }: {
      id: string;
      action: SyncIssueAction;
      note: string;
    }) => ledgerApi.resolveSyncIssue(id, { action, note }),
    onSuccess: (data) => {
      invalidate();
      toast.success(data.message || 'Review item resolved');
    },
    onError: (error) => {
      const { code, message } = getApiError(
        error,
        'Failed to resolve the review item'
      );
      if (
        code === 'sync_issue_not_open' ||
        code === 'settlement_exceeds_paystack_balance'
      ) {
        invalidate();
      }
      toast.error(message);
    }
  });
}
