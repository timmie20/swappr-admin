'use client';

import { QueryErrorState } from '@/components/superadmin-required';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { formatKobo } from '@/lib/format';
import { IconInfoCircle } from '@tabler/icons-react';
import Link from 'next/link';
import { useLedgerSummary } from '../hooks/use-ledger';
import { accountTransactionsHref } from './ledger-links';
import { LedgerWarnings } from './ledger-warnings';

const OPERATING_ACCOUNT = 'operating_account';
const PAYSTACK_BALANCE = 'paystack_balance';

// What each balance should be compared against outside Swappr
const EXTERNAL_CHECK: Record<string, string> = {
  [PAYSTACK_BALANCE]: 'Compare with the Paystack dashboard',
  [OPERATING_ACCOUNT]: 'Compare with the bank statement'
};

function Stat({
  label,
  kobo,
  hint
}: {
  label: string;
  kobo: number;
  hint: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle
          className={`text-2xl tabular-nums ${kobo < 0 ? 'text-destructive' : ''}`}
        >
          {formatKobo(kobo)}
        </CardTitle>
      </CardHeader>
      <CardContent className='text-muted-foreground text-xs'>
        {hint}
      </CardContent>
    </Card>
  );
}

export default function LedgerSummaryView() {
  const { data, isLoading, error } = useLedgerSummary();

  if (error) return <QueryErrorState error={error} />;
  if (isLoading || !data) {
    return (
      <div className='grid w-full gap-4 md:grid-cols-3'>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className='h-32' />
        ))}
      </div>
    );
  }

  return (
    <div className='w-full space-y-6'>
      <LedgerWarnings warnings={data.warnings} />

      <Alert>
        <IconInfoCircle />
        <AlertTitle>The ledger started at zero at go-live</AlertTitle>
        <AlertDescription>
          No opening balance was posted, so compare movements since go-live —
          not absolute balances — with the Paystack dashboard and the bank
          statement.
        </AlertDescription>
      </Alert>

      <div className='grid gap-4 md:grid-cols-3'>
        <Stat
          label='Total assets'
          kobo={data.total_assets_kobo}
          hint='Paystack balance + operating account'
        />
        <Stat
          label='Owed to vendors'
          kobo={data.total_vendor_payables_kobo}
          hint='Sum of all vendor payables'
        />
        <Stat
          label='Owner funds'
          kobo={data.owner_funds_kobo}
          hint='Assets − vendor payables'
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className='text-right'>Debits</TableHead>
                <TableHead className='text-right'>Credits</TableHead>
                <TableHead className='text-right'>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.accounts.map((account) => (
                <TableRow key={account.code}>
                  <TableCell>
                    <div className='flex flex-col'>
                      <Link
                        href={accountTransactionsHref(account.code)}
                        className='font-medium hover:underline'
                      >
                        {account.name}
                      </Link>
                      <span className='text-muted-foreground font-mono text-xs'>
                        {account.code}
                      </span>
                      {EXTERNAL_CHECK[account.code] && (
                        <span className='text-muted-foreground text-xs'>
                          {EXTERNAL_CHECK[account.code]}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className='capitalize'>{account.type}</TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {formatKobo(account.debits_kobo)}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {formatKobo(account.credits_kobo)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium tabular-nums ${account.balance_kobo < 0 ? 'text-destructive' : ''}`}
                  >
                    {formatKobo(account.balance_kobo)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendor payables</CardTitle>
          <CardDescription>What Swappr owes each vendor</CardDescription>
        </CardHeader>
        <CardContent>
          {data.vendor_payables.length === 0 ? (
            <p className='text-muted-foreground text-sm'>Nothing owed</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead className='text-right'>Owed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.vendor_payables.map((vendor) => (
                  <TableRow key={vendor.vendor_id}>
                    <TableCell>
                      {vendor.business_name ||
                        vendor.trading_name ||
                        vendor.vendor_id}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium tabular-nums ${vendor.balance_kobo < 0 ? 'text-destructive' : ''}`}
                    >
                      {formatKobo(vendor.balance_kobo)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
