// Everything under /ledger is whole KOBO integers (divide by 100 for naira),
// except the few `*_naira` fields, which say so in their name.
//
// The ledger is append-only: a wrong entry is never edited or deleted, it is
// REVERSED (a new mirrored entry) and the right one recorded.

export interface LedgerAccount {
  code: string;
  name: string;
  type: string;
  debits_kobo: number;
  credits_kobo: number;
  balance_kobo: number;
}

export interface VendorPayable {
  vendor_id: string;
  business_name: string | null;
  trading_name: string | null;
  balance_kobo: number;
}

/** An impossible balance. Information only — it never blocks anything. */
export interface LedgerWarning {
  code: 'negative_asset_balance' | 'liability_debit_balance';
  severity: 'error';
  account_code: string;
  account_name: string;
  vendor_id: string | null;
  vendor_name: string | null;
  balance_kobo: number;
  message: string;
  transactions_path: string;
}

export interface LedgerSummary {
  accounts: LedgerAccount[];
  vendor_payables: VendorPayable[];
  total_assets_kobo: number;
  total_vendor_payables_kobo: number;
  /** assets − vendor payables */
  owner_funds_kobo: number;
  warnings: LedgerWarning[];
}

/** Payout rows in the reconciliation checks — net_amount is NAIRA */
export interface ReconciliationPayoutRow {
  id: string;
  order_number: string | null;
  vendor_id: string;
  net_amount: number;
  approved_at?: string | null;
  completed_at?: string | null;
  age_seconds?: number;
  bank_transfer_reference?: string | null;
}

export interface UnbookedPaymentSample {
  payment_id: string;
  reference: string;
  order_id: string | null;
  amount_naira: number;
  created_at: string;
}

export interface LedgerReconciliation {
  warnings: LedgerWarning[];
  approved_awaiting_transfer: ReconciliationPayoutRow[];
  paid_without_bank_reference: ReconciliationPayoutRow[];
  paid_without_ledger_entry: ReconciliationPayoutRow[];
  payments_not_on_ledger: {
    count: number;
    total_gross_naira: number;
    sample: UnbookedPaymentSample[];
  };
  /** Signed balance — always negative here (a vendor at −₦500 is -50000) */
  vendors_owed_less_than_zero: { vendor_id: string; balance_kobo: number }[];
}

export type LedgerTransactionType =
  | 'order_paid'
  | 'settlement_received'
  | 'vendor_paid'
  | 'reversal';

export interface LedgerEntry {
  account: string;
  side: 'debit' | 'credit';
  amount_kobo: number;
}

/** Where a settlement entry came from (metadata.source) */
export type SettlementSource =
  | 'paystack_poll'
  | 'paystack_poll_confirmed'
  | 'admin_form';

export interface LedgerTransaction {
  id: string;
  type: LedgerTransactionType;
  idempotency_key: string;
  source_type: string;
  source_id: string;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  entries: LedgerEntry[];
  /** Only an un-reversed settlement_received */
  reversible: boolean;
  /** Set when this transaction has been reversed */
  reversed_by_transaction_id: string | null;
  /** Set on a reversal row: the transaction it reverses */
  reverses_transaction_id: string | null;
  /** Settlements: 0 = first recording, 1, 2… = re-recorded after a reversal */
  revision: number | null;
}

export interface LedgerTransactionsResponse {
  transactions: LedgerTransaction[];
  total: number;
  page: number;
  limit: number;
}

export interface QueryLedgerTransactionsParams {
  type?: LedgerTransactionType;
  /** Only transactions touching this account code */
  account?: string;
  /** A single transaction */
  id?: string;
  page?: number;
  limit?: number;
}

export interface ReverseTransactionResponse {
  message: string;
  reversal: LedgerTransaction;
  original: { id: string; reversed_by_transaction_id: string };
}

export interface PaystackSettlement {
  settlement_id: string;
  status: string;
  currency: string | null;
  settlement_date: string | null;
  /** Paystack's NET payout — what the sync posts */
  effective_amount_kobo: number | null;
  total_amount_kobo: number | null;
  total_fees_kobo: number | null;
  /** A standing (not reversed) entry exists */
  already_recorded: boolean;
  previously_reversed: boolean;
}

export interface RecordSettlementBody {
  /** Paystack's numeric settlement id, e.g. 8610870 */
  settlement_id: string;
  /** NAIRA — the NET amount Paystack paid out, from the bank statement */
  amount_naira: number;
  /** YYYY-MM-DD */
  settled_on?: string;
  note?: string;
}

export interface RecordSettlementResponse {
  message: string;
  created: true;
  settlement_id: string;
  amount_kobo: number;
  transaction_id: string;
  revision: number;
}

export interface SettlementPreview {
  settlement_id: string;
  amount_kobo: number;
  id_valid: boolean;
  id_problem: string | null;
  /** The newest recording of this id, if any */
  existing_recording: {
    transaction_id: string;
    revision: number;
    reversed: boolean;
    amount_kobo: number;
    recorded_at: string;
  } | null;
  /** null when it would be refused as a duplicate */
  revision_to_record: number | null;
  paystack_balance_kobo: number;
  operating_balance_kobo: number;
  available_to_settle_kobo: number;
  exceeds_available: boolean;
  resulting_paystack_balance_kobo: number;
  resulting_operating_balance_kobo: number;
  can_record: boolean;
  blocking_reasons: string[];
}

export interface SettlementSyncResult {
  message: string;
  skipped_reason: 'another_sync_is_running' | null;
  fetched: number;
  recorded: {
    settlement_id: string;
    amount_kobo: number;
    transaction_id: string;
  }[];
  already_recorded: number;
  not_successful: number;
  flagged: {
    issue_id: string;
    settlement_id: string;
    reason: SyncIssueReason;
  }[];
  errors: { settlement_id: string; message: string }[];
  ran_at: string;
}

export type SyncIssueReason =
  | 'possible_duplicate_of_manual'
  | 'exceeds_paystack_balance'
  | 'previously_reversed'
  | 'amount_missing';

export type SyncIssueStatus =
  | 'open'
  | 'resolved_linked'
  | 'resolved_recorded'
  | 'dismissed';

export type SyncIssueAction = 'link_existing' | 'record_anyway' | 'dismiss';

export interface SyncIssue {
  id: string;
  paystack_settlement_id: string;
  reason: SyncIssueReason;
  details: string;
  status: SyncIssueStatus;
  amount_kobo: number | null;
  settlement_date: string | null;
  paystack_payload: Record<string, unknown> | null;
  /** The manual entry this may duplicate (possible_duplicate_of_manual only) */
  candidate: {
    transaction_id: string;
    settlement_id: string | null;
    amount_kobo: number;
    recorded_at: string;
    recorded_by: string | null;
    settled_on: string | null;
    note: string | null;
  } | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  created_at: string;
}

export interface SyncIssuesResponse {
  message: string;
  issues: SyncIssue[];
  total: number;
  page: number;
  limit: number;
}

export interface QuerySyncIssuesParams {
  status?: SyncIssueStatus;
  page?: number;
  limit?: number;
}

export const TRANSACTION_TYPE_LABEL: Record<LedgerTransactionType, string> = {
  order_paid: 'Order paid',
  settlement_received: 'Settlement received',
  vendor_paid: 'Vendor paid',
  reversal: 'Reversal'
};

export const SETTLEMENT_SOURCE_LABEL: Record<SettlementSource, string> = {
  paystack_poll: 'Synced from Paystack',
  paystack_poll_confirmed: 'Synced from Paystack (confirmed by admin)',
  admin_form: 'Typed by an admin'
};

export const REVERSE_REASON = { min: 10, max: 500 } as const;
export const SYNC_ISSUE_NOTE = { min: 5, max: 500 } as const;

/**
 * Same rule as the API (settlement-id.util.ts): Paystack settlement ids are
 * integers such as 8610870 — never a PAY-… payment reference or a UUID.
 * The preview call is the authority; this only gives instant feedback.
 */
export function settlementIdProblem(id: string): string | null {
  const value = id.trim();
  if (!value) return 'Enter the Paystack settlement id.';
  if (
    /^pay[-_]/i.test(value) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  ) {
    return 'That looks like a payment reference, not a Paystack settlement id. Settlement ids are numbers (for example 8610870) — copy it from the settlement in your Paystack dashboard.';
  }
  if (!/^\d{4,12}$/.test(value)) {
    return 'Paystack settlement ids are numbers (for example 8610870). Copy it from the settlement in your Paystack dashboard.';
  }
  return null;
}
