import { LedgerEntry } from '../types/ledger.types';

const VENDOR_PAYABLE_PREFIX = 'vendor_payable:';

// Where each account sits in the money's path, so every transaction reads
// the same way: money arrives at Paystack, moves to the bank, is owed to a
// vendor, is earned by Swappr, or is lost to fees.
const ACCOUNT_RANK: Record<string, number> = {
  paystack_balance: 0,
  operating_account: 1,
  // vendor_payable:<id> → 2 (see accountRank)
  platform_revenue: 3,
  processing_fee_income: 4,
  paystack_fee_expense: 5
};

function accountRank(code: string): number {
  if (code.startsWith(VENDOR_PAYABLE_PREFIX)) return 2;
  return ACCOUNT_RANK[code] ?? 6;
}

/**
 * Journal order: all debits, then all credits; within a side by the
 * account's place in the money flow, then largest amount first. The API
 * returns entries in posting order, which interleaves the sides.
 */
export function sortEntries(entries: LedgerEntry[]): LedgerEntry[] {
  return [...entries].sort((a, b) => {
    if (a.side !== b.side) return a.side === 'debit' ? -1 : 1;
    const rank = accountRank(a.account) - accountRank(b.account);
    if (rank !== 0) return rank;
    return b.amount_kobo - a.amount_kobo;
  });
}

/** vendor_payable:<uuid> → VP:<first 8 of the id>…; other codes unchanged */
export function shortAccountCode(code: string): string {
  if (!code.startsWith(VENDOR_PAYABLE_PREFIX)) return code;
  return `VP:${code.slice(VENDOR_PAYABLE_PREFIX.length, VENDOR_PAYABLE_PREFIX.length + 8)}…`;
}
