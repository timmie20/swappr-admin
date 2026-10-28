import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatKobo } from '@/lib/format';
import { IconAlertTriangle } from '@tabler/icons-react';
import Link from 'next/link';
import { LedgerWarning } from '../types/ledger.types';
import { accountTransactionsHref } from './ledger-links';

/** Red banners for impossible balances. Information only — never blocks. */
export function LedgerWarnings({ warnings }: { warnings: LedgerWarning[] }) {
  if (!warnings?.length) return null;
  return (
    <div className='space-y-2'>
      {warnings.map((warning) => (
        <Alert
          key={`${warning.code}:${warning.account_code}`}
          variant='destructive'
        >
          <IconAlertTriangle />
          <AlertTitle>
            {warning.vendor_name
              ? `${warning.account_name} (${warning.vendor_name})`
              : warning.account_name}
            : {formatKobo(warning.balance_kobo)}
          </AlertTitle>
          <AlertDescription>
            <p>{warning.message}</p>
            <Link
              href={accountTransactionsHref(warning.account_code)}
              className='font-medium underline'
            >
              See this account’s transactions
            </Link>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
