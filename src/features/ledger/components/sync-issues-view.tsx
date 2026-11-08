'use client';

import { DetailRow } from '@/components/detail-row';
import { ReasonModal } from '@/components/modal/reason-modal';
import { QueryErrorState } from '@/components/superadmin-required';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  formatCalendarDate,
  formatKobo,
  formatLagosDateTime
} from '@/lib/format';
import { parseAsInteger, parseAsStringEnum, useQueryState } from 'nuqs';
import Link from 'next/link';
import { useState } from 'react';
import { useResolveSyncIssue, useSyncIssues } from '../hooks/use-ledger';
import {
  SYNC_ISSUE_NOTE,
  SyncIssue,
  SyncIssueAction,
  SyncIssueReason,
  SyncIssueStatus
} from '../types/ledger.types';
import { transactionHref } from './ledger-links';

const PAGE_SIZE = 20;

const TABS: { value: SyncIssueStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'resolved_linked', label: 'Linked' },
  { value: 'resolved_recorded', label: 'Recorded' },
  { value: 'dismissed', label: 'Dismissed' }
];

const REASON_COPY: Record<SyncIssueReason, { label: string; help: string }> = {
  possible_duplicate_of_manual: {
    label: 'Possible duplicate of a manual entry',
    help: 'An admin already recorded the same net amount by hand within 5 days. Posting this too could count the same money twice. If it is the same money, link it; if it is separate money, record it.'
  },
  exceeds_paystack_balance: {
    label: 'More than Paystack is holding',
    help: 'The ledger says Paystack holds less than this settlement — an order payment is probably missing from the ledger. Fix the missing payment first, then record it; or dismiss it.'
  },
  previously_reversed: {
    label: 'Reversed earlier',
    help: 'An admin reversed this settlement before, so the sync will not re-record it by itself. Record it if the amount is right, or dismiss it.'
  },
  amount_missing: {
    label: 'No amount from Paystack',
    help: 'Paystack gave no usable net amount. Record it with the manual form using the bank-statement amount, then dismiss this item.'
  }
};

const ACTION_COPY: Record<
  SyncIssueAction,
  { button: string; title: string; description: string }
> = {
  link_existing: {
    button: 'Same money — link',
    title: 'Link to the existing manual entry?',
    description:
      'Confirms this Paystack settlement is the money already recorded by hand. Nothing is posted to the ledger.'
  },
  record_anyway: {
    button: 'Separate money — record',
    title: 'Record this settlement?',
    description:
      'Posts the net amount to the ledger (Dr operating account / Cr Paystack balance). It is still refused if it exceeds what Paystack is holding.'
  },
  dismiss: {
    button: 'Dismiss',
    title: 'Dismiss this review item?',
    description:
      'Nothing is posted and the sync will not raise this settlement again.'
  }
};

function payloadKobo(issue: SyncIssue, key: string): number | null {
  const value = issue.paystack_payload?.[key];
  return typeof value === 'number' ? value : null;
}

function IssueCard({
  issue,
  onAction,
  busy
}: {
  issue: SyncIssue;
  onAction: (issue: SyncIssue, action: SyncIssueAction) => void;
  busy: boolean;
}) {
  const copy = REASON_COPY[issue.reason] ?? {
    label: issue.reason,
    help: ''
  };
  const actions: SyncIssueAction[] = [
    ...(issue.candidate ? (['link_existing'] as const) : []),
    ...(issue.amount_kobo !== null ? (['record_anyway'] as const) : []),
    'dismiss'
  ];

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <CardTitle className='font-mono text-base'>
            Settlement {issue.paystack_settlement_id}
          </CardTitle>
          <Badge variant={issue.status === 'open' ? 'destructive' : 'outline'}>
            {copy.label}
          </Badge>
        </div>
        <CardDescription>{issue.details}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {issue.status === 'open' && copy.help && (
          <p className='text-sm'>{copy.help}</p>
        )}

        <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
          <DetailRow
            label='Net amount'
            value={
              issue.amount_kobo !== null
                ? formatKobo(issue.amount_kobo)
                : undefined
            }
          />
          <DetailRow
            label='Customers paid (total)'
            value={formatKobo(payloadKobo(issue, 'total_amount'))}
          />
          <DetailRow
            label='Paystack fees'
            value={formatKobo(payloadKobo(issue, 'total_fees'))}
          />
          <DetailRow
            label='Settlement date'
            value={
              issue.settlement_date
                ? formatLagosDateTime(issue.settlement_date)
                : undefined
            }
          />
        </div>

        {issue.candidate && (
          <div className='rounded-md border p-3'>
            <p className='mb-3 text-sm font-semibold'>
              Existing manual entry it may duplicate
            </p>
            <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
              <DetailRow
                label='Amount'
                value={formatKobo(issue.candidate.amount_kobo)}
              />
              <DetailRow
                label='Settlement ID typed'
                mono
                value={issue.candidate.settlement_id}
              />
              <DetailRow
                label='Settled on'
                value={
                  issue.candidate.settled_on
                    ? formatCalendarDate(issue.candidate.settled_on)
                    : undefined
                }
              />
              <DetailRow
                label='Recorded'
                value={formatLagosDateTime(issue.candidate.recorded_at)}
              />
              {issue.candidate.note && (
                <div className='col-span-2 sm:col-span-4'>
                  <DetailRow label='Note' value={issue.candidate.note} />
                </div>
              )}
            </div>
            <Link
              href={transactionHref(issue.candidate.transaction_id)}
              className='mt-3 inline-block text-sm underline'
            >
              Open that transaction
            </Link>
          </div>
        )}

        {issue.status === 'open' ? (
          <div className='flex flex-wrap gap-2'>
            {actions.map((action) => (
              <Button
                key={action}
                size='sm'
                variant={action === 'dismiss' ? 'outline' : 'default'}
                disabled={busy}
                onClick={() => onAction(issue, action)}
              >
                {ACTION_COPY[action].button}
              </Button>
            ))}
            {issue.reason === 'amount_missing' && (
              <Button size='sm' variant='outline' asChild>
                <Link href='/dashboard/ledger/settlements'>
                  Open the manual form
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className='text-muted-foreground text-sm'>
            Resolved {formatLagosDateTime(issue.resolved_at)}
            {issue.resolution_note ? ` — ${issue.resolution_note}` : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SyncIssuesView() {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [status, setStatus] = useQueryState(
    'status',
    parseAsStringEnum(TABS.map((t) => t.value)).withDefault('open')
  );
  const { data, isLoading, isFetching, error } = useSyncIssues({
    status,
    page,
    limit: PAGE_SIZE
  });
  const resolve = useResolveSyncIssue();
  const [pending, setPending] = useState<{
    issue: SyncIssue;
    action: SyncIssueAction;
  } | null>(null);

  const pageCount = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className='w-full space-y-4'>
      {pending && (
        <ReasonModal
          isOpen
          onClose={() => setPending(null)}
          onConfirm={(note) =>
            resolve.mutate(
              { id: pending.issue.id, action: pending.action, note },
              { onSettled: () => setPending(null) }
            )
          }
          loading={resolve.isPending}
          title={ACTION_COPY[pending.action].title}
          description={ACTION_COPY[pending.action].description}
          label='Note (kept with the decision)'
          minLength={SYNC_ISSUE_NOTE.min}
          maxLength={SYNC_ISSUE_NOTE.max}
          confirmLabel={ACTION_COPY[pending.action].button}
        />
      )}

      <Tabs
        value={status}
        onValueChange={(value) => {
          void setPage(1);
          void setStatus(value as SyncIssueStatus);
        }}
      >
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {error ? (
        <QueryErrorState error={error} />
      ) : isLoading || !data ? (
        <Skeleton className='h-48 w-full' />
      ) : data.issues.length === 0 ? (
        <p className='text-muted-foreground py-8 text-center text-sm'>
          {status === 'open'
            ? 'Nothing to review — every synced settlement was posted.'
            : 'No items.'}
        </p>
      ) : (
        <>
          {data.issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              busy={resolve.isPending}
              onAction={(i, action) => setPending({ issue: i, action })}
            />
          ))}
          {pageCount > 1 && (
            <div className='flex items-center justify-end gap-2'>
              <span className='text-muted-foreground text-sm'>
                Page {page} of {pageCount}
              </span>
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
          )}
        </>
      )}
    </div>
  );
}
