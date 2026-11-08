'use client';

import { Icons } from '@/components/icons';
import { QueryErrorState } from '@/components/superadmin-required';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { formatKobo, formatLagosDateTime } from '@/lib/format';
import {
  IconAlertTriangle,
  IconCloudDownload,
  IconInfoCircle,
  IconPlus,
  IconRefresh
} from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';
import {
  usePaystackSettlements,
  useSyncSettlements
} from '../hooks/use-ledger';
import {
  PaystackSettlement,
  SettlementSyncResult
} from '../types/ledger.types';
import { transactionHref } from './ledger-links';
import { RecordSettlementModal } from './record-settlement-modal';

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

function SyncSummary({ result }: { result: SettlementSyncResult }) {
  if (result.skipped_reason === 'another_sync_is_running') {
    return (
      <Alert>
        <IconInfoCircle />
        <AlertTitle>A sync is already running</AlertTitle>
        <AlertDescription>
          Wait a moment, then sync again to see its results.
        </AlertDescription>
      </Alert>
    );
  }

  const parts = [
    `${result.recorded.length} recorded`,
    `${result.already_recorded} already on the ledger`,
    ...(result.flagged.length
      ? [
          `${result.flagged.length} need${result.flagged.length === 1 ? 's' : ''} review`
        ]
      : []),
    ...(result.errors.length ? [plural(result.errors.length, 'error')] : [])
  ];
  const hasProblems = result.flagged.length > 0 || result.errors.length > 0;

  return (
    <Alert variant={result.errors.length ? 'destructive' : 'default'}>
      {hasProblems ? <IconAlertTriangle /> : <IconInfoCircle />}
      <AlertTitle>
        Sync finished {formatLagosDateTime(result.ran_at)}: {parts.join(', ')}
      </AlertTitle>
      <AlertDescription>
        <p>
          Fetched {result.fetched} settlement{result.fetched === 1 ? '' : 's'}{' '}
          from Paystack
          {result.not_successful
            ? `, ${result.not_successful} not yet successful (skipped)`
            : ''}
          .
        </p>
        {result.recorded.length > 0 && (
          <ul className='list-disc pl-4'>
            {result.recorded.map((item) => (
              <li key={item.transaction_id}>
                <Link
                  href={transactionHref(item.transaction_id)}
                  className='underline'
                >
                  {item.settlement_id}
                </Link>{' '}
                — {formatKobo(item.amount_kobo)}
              </li>
            ))}
          </ul>
        )}
        {result.flagged.length > 0 && (
          <Link
            href='/dashboard/ledger/review-items'
            className='font-medium underline'
          >
            Go to the review items
          </Link>
        )}
        {result.errors.length > 0 && (
          <ul className='list-disc pl-4'>
            {result.errors.map((item, i) => (
              <li key={`${item.settlement_id}-${i}`}>
                {item.settlement_id}: {item.message}
              </li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  );
}

export default function SettlementsView() {
  const { data, isLoading, isFetching, error, refetch } =
    usePaystackSettlements();
  const sync = useSyncSettlements();
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<PaystackSettlement | null>(null);

  const openFor = (settlement: PaystackSettlement | null) => {
    setSelected(settlement);
    setModalOpen(true);
  };

  return (
    <div className='w-full space-y-4'>
      <RecordSettlementModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        settlement={selected}
      />

      <div className='flex flex-wrap items-start justify-between gap-2'>
        <div className='text-muted-foreground max-w-2xl space-y-1 text-sm'>
          <p>
            <strong className='text-foreground'>Sync</strong> posts each
            Paystack settlement’s net payout to the ledger. Anything doubtful is
            not posted and goes to the{' '}
            <Link href='/dashboard/ledger/review-items' className='underline'>
              review items
            </Link>
            . Safe to run repeatedly.
          </p>
          <p>
            The synced amount is Paystack’s “effective amount”, which has not
            yet been verified against a live settlement — check new entries
            against the bank statement. Use “Record manually” only when the sync
            can’t.
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <IconRefresh className='mr-1 h-4 w-4' /> Refresh list
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => openFor(null)}
            disabled={sync.isPending}
          >
            <IconPlus className='mr-1 h-4 w-4' /> Record manually
          </Button>
          <Button
            size='sm'
            onClick={() => sync.mutate()}
            disabled={sync.isPending}
          >
            {sync.isPending ? (
              <Icons.spinner className='mr-1 h-4 w-4 animate-spin' />
            ) : (
              <IconCloudDownload className='mr-1 h-4 w-4' />
            )}
            Sync settlements now
          </Button>
        </div>
      </div>

      {sync.data && <SyncSummary result={sync.data} />}

      {error ? (
        <QueryErrorState
          error={error}
          title='Could not load settlements from Paystack'
        />
      ) : isLoading || !data ? (
        <Skeleton className='h-64 w-full' />
      ) : (
        <div className='rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Settlement</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='text-right'>Net (effective)</TableHead>
                <TableHead className='text-right'>Customers paid</TableHead>
                <TableHead className='text-right'>Fees</TableHead>
                <TableHead className='text-right'>Ledger</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className='h-24 text-center'>
                    No settlements from Paystack.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((settlement) => (
                  <TableRow key={settlement.settlement_id}>
                    <TableCell className='font-mono text-xs'>
                      {settlement.settlement_id}
                    </TableCell>
                    <TableCell>
                      {formatLagosDateTime(settlement.settlement_date)}
                    </TableCell>
                    <TableCell className='capitalize'>
                      {settlement.status}
                    </TableCell>
                    <TableCell className='text-right font-medium tabular-nums'>
                      {formatKobo(settlement.effective_amount_kobo)}
                    </TableCell>
                    <TableCell className='text-muted-foreground text-right tabular-nums'>
                      {formatKobo(settlement.total_amount_kobo)}
                    </TableCell>
                    <TableCell className='text-muted-foreground text-right tabular-nums'>
                      {formatKobo(settlement.total_fees_kobo)}
                    </TableCell>
                    <TableCell className='text-right'>
                      {settlement.already_recorded ? (
                        <Badge variant='outline'>Recorded</Badge>
                      ) : (
                        <div className='flex items-center justify-end gap-2'>
                          {settlement.previously_reversed && (
                            <Badge variant='secondary'>Reversed earlier</Badge>
                          )}
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => openFor(settlement)}
                          >
                            Record
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
