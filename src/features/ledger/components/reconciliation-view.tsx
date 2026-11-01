'use client';

import { QueryErrorState } from '@/components/superadmin-required';
import { Badge } from '@/components/ui/badge';
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
import { formatKobo, formatLagosDateTime, formatNaira } from '@/lib/format';
import { IconCircleCheck } from '@tabler/icons-react';
import Link from 'next/link';
import { useLedgerReconciliation } from '../hooks/use-ledger';
import { ReconciliationPayoutRow } from '../types/ledger.types';
import { LedgerWarnings } from './ledger-warnings';

// In production exactly one pre-ledger payment is expected: it was settled
// and paid out manually before go-live, and Request Settlement refuses it
const EXPECTED_UNBOOKED_PAYMENTS = 1;

function CheckCard({
  title,
  description,
  count,
  expected = 0,
  children
}: {
  title: string;
  description: string;
  count: number;
  expected?: number;
  children?: React.ReactNode;
}) {
  const healthy = count <= expected;
  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between gap-2'>
          <CardTitle className='text-base'>{title}</CardTitle>
          {healthy ? (
            <Badge variant='outline' className='gap-1'>
              <IconCircleCheck className='text-green-600' />
              {count === 0 ? 'Empty' : `${count} (expected)`}
            </Badge>
          ) : (
            <Badge variant='destructive'>{count}</Badge>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {count > 0 && children && <CardContent>{children}</CardContent>}
    </Card>
  );
}

function ageLabel(seconds?: number): string {
  if (seconds === undefined) return '—';
  const hours = Math.floor(seconds / 3600);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

function PayoutRows({
  rows,
  dateField,
  showAge
}: {
  rows: ReconciliationPayoutRow[];
  dateField: 'approved_at' | 'completed_at';
  showAge?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Payout</TableHead>
          <TableHead>Order</TableHead>
          <TableHead className='text-right'>Amount</TableHead>
          <TableHead>
            {dateField === 'approved_at' ? 'Approved' : 'Paid'}
          </TableHead>
          {showAge && <TableHead>Waiting</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <Link
                href={`/dashboard/payout/${row.id}`}
                className='font-mono text-xs hover:underline'
              >
                {row.id.slice(0, 8)}…
              </Link>
            </TableCell>
            <TableCell className='font-mono text-xs'>
              {row.order_number ?? '—'}
            </TableCell>
            <TableCell className='text-right tabular-nums'>
              {formatNaira(row.net_amount)}
            </TableCell>
            <TableCell>{formatLagosDateTime(row[dateField] ?? null)}</TableCell>
            {showAge && <TableCell>{ageLabel(row.age_seconds)}</TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function ReconciliationView() {
  const { data, isLoading, error } = useLedgerReconciliation();

  if (error) return <QueryErrorState error={error} />;
  if (isLoading || !data) {
    return (
      <div className='w-full space-y-4'>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className='h-24' />
        ))}
      </div>
    );
  }

  const unbooked = data.payments_not_on_ledger;

  return (
    <div className='w-full space-y-4'>
      <LedgerWarnings warnings={data.warnings} />
      <CheckCard
        title='Approved, awaiting bank transfer'
        description='Approved payouts with no bank transfer recorded yet. Send the transfer and mark them paid.'
        count={data.approved_awaiting_transfer.length}
      >
        <PayoutRows
          rows={data.approved_awaiting_transfer}
          dateField='approved_at'
          showAge
        />
      </CheckCard>

      <CheckCard
        title='Paid without a bank reference'
        description='Should never happen — paid manual payouts must carry the bank’s reference.'
        count={data.paid_without_bank_reference.length}
      >
        <PayoutRows
          rows={data.paid_without_bank_reference}
          dateField='completed_at'
        />
      </CheckCard>

      <CheckCard
        title='Paid without a ledger entry'
        description='Paid payouts with no vendor_paid ledger transaction.'
        count={data.paid_without_ledger_entry.length}
      >
        <PayoutRows
          rows={data.paid_without_ledger_entry}
          dateField='completed_at'
        />
      </CheckCard>

      <CheckCard
        title='Payments not on the ledger'
        description={`Captured order payments the ledger knows nothing about (${formatNaira(unbooked.total_gross_naira)} in total). In production ${EXPECTED_UNBOOKED_PAYMENTS} is expected: the single pre-ledger payment, already paid out manually.`}
        count={unbooked.count}
        expected={EXPECTED_UNBOOKED_PAYMENTS}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment reference</TableHead>
              <TableHead className='text-right'>Amount</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unbooked.sample.map((payment) => (
              <TableRow key={payment.payment_id}>
                <TableCell className='font-mono text-xs'>
                  {payment.reference}
                </TableCell>
                <TableCell className='text-right tabular-nums'>
                  {formatNaira(payment.amount_naira)}
                </TableCell>
                <TableCell>{formatLagosDateTime(payment.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {unbooked.count > unbooked.sample.length && (
          <p className='text-muted-foreground mt-2 text-xs'>
            Showing the latest {unbooked.sample.length} of {unbooked.count}
          </p>
        )}
      </CheckCard>

      <CheckCard
        title='Vendors owed less than zero'
        description='The ledger says these vendors were paid more than they earned.'
        count={data.vendors_owed_less_than_zero.length}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor ID</TableHead>
              <TableHead className='text-right'>Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.vendors_owed_less_than_zero.map((vendor) => (
              <TableRow key={vendor.vendor_id}>
                <TableCell className='font-mono text-xs'>
                  {vendor.vendor_id}
                </TableCell>
                <TableCell className='text-destructive text-right tabular-nums'>
                  {formatKobo(vendor.balance_kobo)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CheckCard>
    </div>
  );
}
