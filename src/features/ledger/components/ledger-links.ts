// In-app links into the Transactions page. The API's own
// `transactions_path` points at the API route, not at this app.

export const transactionHref = (transactionId: string) =>
  `/dashboard/ledger/transactions?id=${encodeURIComponent(transactionId)}`;

export const accountTransactionsHref = (accountCode: string) =>
  `/dashboard/ledger/transactions?account=${encodeURIComponent(accountCode)}`;
