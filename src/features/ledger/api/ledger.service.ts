import apiClient from '@/lib/api/client';
import {
  LedgerReconciliation,
  LedgerSummary,
  LedgerTransactionsResponse,
  PaystackSettlement,
  QueryLedgerTransactionsParams,
  QuerySyncIssuesParams,
  RecordSettlementBody,
  RecordSettlementResponse,
  ReverseTransactionResponse,
  SettlementPreview,
  SettlementSyncResult,
  SyncIssue,
  SyncIssueAction,
  SyncIssuesResponse
} from '../types/ledger.types';

/**
 * Ledger API Service — superadmin only. Amounts are kobo.
 */
export const ledgerApi = {
  getSummary: async (): Promise<LedgerSummary> => {
    const { data } = await apiClient.get<LedgerSummary>('/ledger/summary');
    return data;
  },

  getReconciliation: async (): Promise<LedgerReconciliation> => {
    const { data } = await apiClient.get<LedgerReconciliation>(
      '/ledger/reconciliation'
    );
    return data;
  },

  getTransactions: async (
    params?: QueryLedgerTransactionsParams
  ): Promise<LedgerTransactionsResponse> => {
    const { data } = await apiClient.get<LedgerTransactionsResponse>(
      '/ledger/transactions',
      { params }
    );
    return data;
  },

  /**
   * Reverse a settlement: posts a mirrored entry; the original stays visible
   */
  reverseTransaction: async (
    id: string,
    reason: string
  ): Promise<ReverseTransactionResponse> => {
    const { data } = await apiClient.post<ReverseTransactionResponse>(
      `/ledger/transactions/${id}/reverse`,
      { reason }
    );
    return data;
  },

  /**
   * Read-only list straight from Paystack
   */
  getPaystackSettlements: async (): Promise<PaystackSettlement[]> => {
    const { data } = await apiClient.get<{
      settlements: PaystackSettlement[];
    }>('/ledger/settlements/paystack');
    return data.settlements;
  },

  /**
   * Post Paystack's settlements to the ledger. Doubtful ones are not posted
   * and become review items. Safe to call repeatedly.
   */
  syncSettlements: async (): Promise<SettlementSyncResult> => {
    const { data } = await apiClient.post<SettlementSyncResult>(
      '/ledger/settlements/sync'
    );
    return data;
  },

  /**
   * Dry run of a manual settlement — writes nothing
   */
  previewSettlement: async (body: {
    settlement_id: string;
    amount_naira: number;
  }): Promise<SettlementPreview> => {
    const { data } = await apiClient.post<SettlementPreview>(
      '/ledger/settlements/preview',
      body
    );
    return data;
  },

  /**
   * Record a settlement by hand (guarded: duplicate id and amounts above
   * Paystack's balance are refused)
   */
  recordSettlement: async (
    body: RecordSettlementBody
  ): Promise<RecordSettlementResponse> => {
    const { data } = await apiClient.post<RecordSettlementResponse>(
      '/ledger/settlements',
      body
    );
    return data;
  },

  getSyncIssues: async (
    params?: QuerySyncIssuesParams
  ): Promise<SyncIssuesResponse> => {
    const { data } = await apiClient.get<SyncIssuesResponse>(
      '/ledger/sync-issues',
      { params }
    );
    return data;
  },

  resolveSyncIssue: async (
    id: string,
    body: { action: SyncIssueAction; note: string }
  ): Promise<{
    message: string;
    issue: Partial<SyncIssue>;
    transaction_id?: string;
  }> => {
    const { data } = await apiClient.post<{
      message: string;
      issue: Partial<SyncIssue>;
      transaction_id?: string;
    }>(`/ledger/sync-issues/${id}/resolve`, body);
    return data;
  }
};
