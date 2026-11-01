'use client';

import { ReasonModal } from '@/components/modal/reason-modal';
import { QueryErrorState } from '@/components/superadmin-required';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
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
import { IconArrowBackUp, IconX } from '@tabler/icons-react';
import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryState
} from 'nuqs';
import Link from 'next/link';
import { useState } from 'react';
import {
  useLedgerTransactions,
  useReverseTransaction
} from '../hooks/use-ledger';
import {
  LedgerEntry,
  LedgerTransaction,
  LedgerTransactionType,
  REVERSE_REASON,
  SETTLEMENT_SOURCE_LABEL,
  SettlementSource,
  TRANSACTION_TYPE_LABEL
} from '../types/ledger.types';
import { shortAccountCode, sortEntries } from './ledger-entries';
import { transactionHref } from './ledger-links';

const PAGE_SIZE = 25;
const TYPE_VALUES = [
  'all',
  'order_paid',
  'settlement_received',
  'vendor_paid',
  'reversal'
] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const shortId = (id: string) => `${id.slice(0, 8)}…`;

// Debits, then credits (indented, journal style), separated by a rule.
// Fixed-width account column: long codes truncate (full code on hover).
function EntryLines({ entries }: { entries: LedgerEntry[] }) {
  const sorted = sortEntries(entries);
  return (
    <div className='grid w-80 grid-cols-[1.75rem_minmax(0,1fr)_auto] gap-x-3 gap-y-1 font-mono text-xs'>
      {sorted.map((entry, i) => {
        const firstCredit =
          entry.side === 'credit' && sorted[i - 1]?.side === 'debit';
        return (
          <div
            key={i}
            className={`contents ${firstCredit ? '[&>span]:border-t [&>span]:pt-1' : ''}`}
          >
            <span className='text-muted-foreground'>
              {entry.side === 'debit' ? 'Dr' : 'Cr'}
            </span>
            <span
              className={`truncate ${entry.side === 'credit' ? 'pl-3' : ''}`}
              title={entry.account}
            >
              {shortAccountCode(entry.account)}
            </span>
            <span className='text-right whitespace-nowrap tabular-nums'>
              {formatKobo(entry.amount_kobo)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Dialog-width version of EntryLines: the account column can shrink and wrap
// (vendor_payable:<uuid> codes are long) while side and amount keep their
// width, so nothing overflows the panel
function EntryBreakdown({
  title,
  entries,
  highlight
}: {
  title: string;
  entries: LedgerEntry[];
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-md border p-3 ${highlight ? 'border-destructive/40 bg-destructive/5' : 'bg-muted/40'}`}
    >
      <p className='mb-2 text-sm font-medium'>{title}</p>
      <div className='grid grid-cols-[2rem_minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 font-mono text-xs'>
        {sortEntries(entries).map((entry, i) => (
          <div key={i} className='contents'>
            <span className='text-muted-foreground'>
              {entry.side === 'debit' ? 'Dr' : 'Cr'}
            </span>
            <span
              className={`truncate ${entry.side === 'credit' ? 'pl-3' : ''}`}
              title={entry.account}
            >
              {shortAccountCode(entry.account)}
            </span>
            <span className='text-right whitespace-nowrap tabular-nums'>
              {formatKobo(entry.amount_kobo)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// A reversal posts the same lines with each side swapped
const mirror = (entries: LedgerEntry[]): LedgerEntry[] =>
  entries.map((entry) => ({
    ...entry,
    side: entry.side === 'debit' ? 'credit' : 'debit'
  }));

function TransactionLabels({ tx }: { tx: LedgerTransaction }) {
  const source = tx.metadata?.source as SettlementSource | undefined;
  const reason = tx.metadata?.reason;
  return (
    <div className='flex flex-wrap items-center gap-1.5'>
      <Badge variant='outline'>
        {TRANSACTION_TYPE_LABEL[tx.type] ?? tx.type}
      </Badge>
      {tx.type === 'settlement_received' && !!tx.revision && (
        <Badge variant='secondary'>revision {tx.revision}</Badge>
      )}
      {tx.reversed_by_transaction_id && (
        <Link href={transactionHref(tx.reversed_by_transaction_id)}>
          <Badge variant='destructive'>Reversed</Badge>
        </Link>
      )}
      {tx.reverses_transaction_id && (
        <Link
          href={transactionHref(tx.reverses_transaction_id)}
          className='text-xs underline'
        >
          Reversal of {shortId(tx.reverses_transaction_id)}
        </Link>
      )}
      {tx.type === 'settlement_received' && source && (
        <span className='text-muted-foreground w-full text-xs'>
          {SETTLEMENT_SOURCE_LABEL[source] ?? source}
        </span>
      )}
      {tx.type === 'reversal' && typeof reason === 'string' && (
        <span className='text-muted-foreground w-full text-xs'>
          Reason: {reason}
        </span>
      )}
    </div>
  );
}

function FilterChip({
  label,
  onClear
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <Badge variant='secondary' className='h-8 gap-1 px-2 text-xs'>
      {label}
      <button
        type='button'
        onClick={onClear}
        aria-label={`Clear ${label}`}
        className='hover:text-foreground'
      >
        <IconX className='h-3.5 w-3.5' />
      </button>
    </Badge>
  );
}

export default function TransactionsView() {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [type, setType] = useQueryState(
    'type',
    parseAsStringEnum([...TYPE_VALUES]).withDefault('all')
  );
  const [account, setAccount] = useQueryState('account', parseAsString);
  const [id, setId] = useQueryState('id', parseAsString);
  const [reversing, setReversing] = useState<LedgerTransaction | null>(null);
  const reverse = useReverseTransaction();

  const idValid = !id || UUID.test(id);
  const { data, isLoading, isFetching, error } = useLedgerTransactions({
    page,
    limit: PAGE_SIZE,
    type: type === 'all' ? undefined : (type as LedgerTransactionType),
    account: account ?? undefined,
    id: id && idValid ? id : undefined
  });

  const pageCount = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className='w-full space-y-4'>
      {reversing && (
        <ReasonModal
          isOpen
          onClose={() => setReversing(null)}
          onConfirm={(reason) =>
            reverse.mutate(
              { id: reversing.id, reason },
              { onSettled: () => setReversing(null) }
            )
          }
          loading={reverse.isPending}
          className='max-h-[90vh] overflow-y-auto sm:max-w-xl'
          title='Reverse this settlement?'
          description='A new entry with the mirrored lines is posted. The original stays visible on the ledger for ever, marked as reversed. Afterwards you can record the same settlement id again with the correct amount.'
          label='Reason (stored with the reversal)'
          placeholder='e.g. Typed the gross instead of the net'
          minLength={REVERSE_REASON.min}
          maxLength={REVERSE_REASON.max}
          confirmLabel='Reverse'
          destructive
        >
          <div className='space-y-3'>
            <EntryBreakdown
              title={`Original · ${formatLagosDateTime(reversing.created_at)}`}
              entries={reversing.entries}
            />
            <EntryBreakdown
              title='Reversal (will be posted)'
              entries={mirror(reversing.entries)}
              highlight
            />
          </div>
        </ReasonModal>
      )}

      <div className='flex flex-wrap items-end gap-2'>
        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>Type</span>
          <Select
            value={type}
            onValueChange={(value) => {
              void setPage(1);
              void setType(value as (typeof TYPE_VALUES)[number]);
            }}
          >
            <SelectTrigger size='sm' className='w-[200px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All types</SelectItem>
              {(
                Object.keys(TRANSACTION_TYPE_LABEL) as LedgerTransactionType[]
              ).map((key) => (
                <SelectItem key={key} value={key}>
                  {TRANSACTION_TYPE_LABEL[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {account && (
          <FilterChip
            label={`Account: ${shortAccountCode(account)}`}
            onClear={() => {
              void setPage(1);
              void setAccount(null);
            }}
          />
        )}
        {id && (
          <FilterChip
            label={`Transaction ${shortId(id)}`}
            onClear={() => {
              void setPage(1);
              void setId(null);
            }}
          />
        )}
      </div>

      {!idValid ? (
        <Alert variant='destructive'>
          <AlertDescription>
            “{id}” is not a valid transaction id.
          </AlertDescription>
        </Alert>
      ) : error ? (
        <QueryErrorState error={error} />
      ) : isLoading || !data ? (
        <Skeleton className='h-96 w-full' />
      ) : (
        <>
          <div className='rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Entries</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className='h-24 text-center'>
                      {id ? 'No transaction with that id.' : 'No transactions.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.transactions.map((tx) => (
                    <TableRow
                      key={tx.id}
                      className={`align-top ${tx.reversed_by_transaction_id ? 'opacity-60' : ''}`}
                    >
                      <TableCell className='whitespace-nowrap'>
                        <div>{formatLagosDateTime(tx.created_at)}</div>
                        <Link
                          href={transactionHref(tx.id)}
                          className='text-muted-foreground font-mono text-xs hover:underline'
                        >
                          {shortId(tx.id)}
                        </Link>
                      </TableCell>
                      <TableCell className='max-w-56 whitespace-normal'>
                        <TransactionLabels tx={tx} />
                      </TableCell>
                      <TableCell className='max-w-sm whitespace-normal'>
                        <div>{tx.description}</div>
                        <div className='text-muted-foreground font-mono text-xs break-all'>
                          {tx.idempotency_key}
                        </div>
                      </TableCell>
                      <TableCell>
                        <EntryLines entries={tx.entries} />
                      </TableCell>
                      <TableCell className='text-right'>
                        {tx.reversible && (
                          <Button
                            size='sm'
                            variant='outline'
                            disabled={reverse.isPending}
                            onClick={() => setReversing(tx)}
                          >
                            <IconArrowBackUp className='mr-1 h-4 w-4' />
                            Reverse
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground text-sm'>
              {data.total} transaction{data.total === 1 ? '' : 's'} · page{' '}
              {page} of {pageCount}
            </span>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                disabled={page <= 1 || isFetching}
                onClick={() => void setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={page >= pageCount || isFetching}
                onClick={() => void setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
