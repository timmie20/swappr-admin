'use client';

import { Icons } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { getApiError } from '@/lib/api/errors';
import { formatKobo, lagosDateKey } from '@/lib/format';
import { IconAlertTriangle, IconBan } from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  useLedgerSummary,
  usePreviewSettlement,
  useRecordSettlement
} from '../hooks/use-ledger';
import {
  PaystackSettlement,
  SettlementPreview,
  settlementIdProblem
} from '../types/ledger.types';
import { transactionHref } from './ledger-links';

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;
const PAYSTACK_BALANCE = 'paystack_balance';

interface RecordSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-fills the form; null = record one by hand */
  settlement: PaystackSettlement | null;
}

function PreviewRow({
  label,
  kobo,
  strong
}: {
  label: string;
  kobo: number;
  strong?: boolean;
}) {
  return (
    <div className='flex justify-between gap-4'>
      <span className='text-muted-foreground'>{label}</span>
      <span
        className={`tabular-nums ${strong ? 'font-semibold' : ''} ${kobo < 0 ? 'text-destructive font-semibold' : ''}`}
      >
        {formatKobo(kobo)}
      </span>
    </div>
  );
}

function ExistingRecordingLink({ transactionId }: { transactionId: string }) {
  return (
    <Link href={transactionHref(transactionId)} className='underline'>
      Open that entry to reverse it
    </Link>
  );
}

export function RecordSettlementModal({
  isOpen,
  onClose,
  settlement
}: RecordSettlementModalProps) {
  const summary = useLedgerSummary();
  const preview = usePreviewSettlement();
  const record = useRecordSettlement();

  const [settlementId, setSettlementId] = useState('');
  const [idTouched, setIdTouched] = useState(false);
  const [amount, setAmount] = useState('');
  const [settledOn, setSettledOn] = useState('');
  const [note, setNote] = useState('');
  const [checked, setChecked] = useState(false);
  // The preview the admin is confirming; null while editing the form
  const [confirming, setConfirming] = useState<SettlementPreview | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    preview.reset();
    record.reset();
    setConfirming(null);
    setSettlementId(settlement?.settlement_id ?? '');
    setIdTouched(false);
    // Paystack's net payout — still to be checked against the statement
    setAmount(
      settlement?.effective_amount_kobo != null
        ? (settlement.effective_amount_kobo / 100).toFixed(2)
        : ''
    );
    setSettledOn(
      settlement?.settlement_date
        ? lagosDateKey(settlement.settlement_date)
        : ''
    );
    setNote('');
    setChecked(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, settlement]);

  const cleanAmount = amount.replace(/,/g, '').trim();
  const amountValid =
    AMOUNT_PATTERN.test(cleanAmount) && Number(cleanAmount) > 0;
  const idProblem = settlementIdProblem(settlementId);
  const busy = preview.isPending || record.isPending;

  const paystackAccount = summary.data?.accounts.find(
    (a) => a.code === PAYSTACK_BALANCE
  );
  const availableKobo =
    confirming?.available_to_settle_kobo ??
    (paystackAccount ? Math.max(0, paystackAccount.balance_kobo) : null);

  const previewError = preview.error ? getApiError(preview.error) : null;
  const recordError = record.error ? getApiError(record.error) : null;
  const alreadyRecordedId =
    recordError?.code === 'settlement_already_recorded' &&
    typeof recordError.extra.transaction_id === 'string'
      ? recordError.extra.transaction_id
      : null;

  const onReview = () => {
    setIdTouched(true);
    if (idProblem || !amountValid || busy) return;
    record.reset();
    preview.mutate(
      { settlement_id: settlementId.trim(), amount_naira: Number(cleanAmount) },
      {
        onSuccess: (result) => {
          setChecked(false);
          setConfirming(result);
        }
      }
    );
  };

  const onRecord = () => {
    if (!confirming?.can_record || !checked || busy) return;
    record.mutate(
      {
        settlement_id: confirming.settlement_id,
        amount_naira: confirming.amount_kobo / 100,
        ...(settledOn ? { settled_on: settledOn } : {}),
        ...(note.trim() ? { note: note.trim() } : {})
      },
      { onSuccess: onClose }
    );
  };

  return (
    <Modal
      title={confirming ? 'Confirm the settlement' : 'Record a settlement'}
      description='Records that Paystack paid money into the bank (Dr operating account / Cr Paystack balance). The ledger is append-only: a wrong entry can only be fixed by reversing it.'
      isOpen={isOpen}
      onClose={busy ? () => {} : onClose}
    >
      {!confirming ? (
        <form
          className='space-y-4'
          onSubmit={(event) => {
            event.preventDefault();
            onReview();
          }}
        >
          {settlement && (
            <div className='bg-muted/50 space-y-1 rounded-md border p-3 text-xs'>
              <p className='font-medium'>From Paystack (for reference)</p>
              <p>
                Net payout (effective):{' '}
                {formatKobo(settlement.effective_amount_kobo)}
              </p>
              <p>
                Customers paid (total):{' '}
                {formatKobo(settlement.total_amount_kobo)}
              </p>
              <p>Paystack fees: {formatKobo(settlement.total_fees_kobo)}</p>
            </div>
          )}

          <div className='space-y-2'>
            <Label htmlFor='settlement-id'>Paystack settlement ID</Label>
            <Input
              id='settlement-id'
              inputMode='numeric'
              value={settlementId}
              onChange={(event) => setSettlementId(event.target.value)}
              onBlur={() => setIdTouched(true)}
              disabled={!!settlement || busy}
              placeholder='e.g. 8610870'
              maxLength={100}
            />
            {idTouched && idProblem ? (
              <p className='text-destructive text-xs'>{idProblem}</p>
            ) : (
              <p className='text-muted-foreground text-xs'>
                A number from the settlement in your Paystack dashboard — not a
                PAY-… payment reference.
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <div className='flex items-baseline justify-between gap-2'>
              <Label htmlFor='settlement-amount'>
                Net amount Paystack paid out (after fees), ₦
              </Label>
              {availableKobo !== null && (
                <span className='text-muted-foreground text-xs'>
                  Available to settle:{' '}
                  <span className='text-foreground font-medium'>
                    {formatKobo(availableKobo)}
                  </span>
                </span>
              )}
            </div>
            <Input
              id='settlement-amount'
              inputMode='decimal'
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              disabled={busy}
              placeholder='2000.00'
            />
            {amount && !amountValid ? (
              <p className='text-destructive text-xs'>
                A positive amount with at most 2 decimals
              </p>
            ) : (
              <p className='text-muted-foreground text-xs'>
                This is the amount credited to the bank account — not what
                customers paid.
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='settled-on'>Date it reached the bank</Label>
            <Input
              id='settled-on'
              type='date'
              value={settledOn}
              onChange={(event) => setSettledOn(event.target.value)}
              disabled={busy}
              className='w-[180px]'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='settlement-note'>Note (optional)</Label>
            <Textarea
              id='settlement-note'
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={300}
              rows={2}
              disabled={busy}
            />
          </div>

          {previewError && (
            <Alert variant='destructive'>
              <IconAlertTriangle />
              <AlertDescription>{previewError.message}</AlertDescription>
            </Alert>
          )}

          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={busy || !!idProblem || !amountValid}
            >
              {preview.isPending && (
                <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
              )}
              Review
            </Button>
          </div>
        </form>
      ) : (
        <div className='space-y-4'>
          <div className='bg-muted/50 space-y-2 rounded-md border p-3 text-sm'>
            <div className='flex justify-between gap-4'>
              <span className='text-muted-foreground'>Settlement</span>
              <span className='font-mono'>
                {confirming.settlement_id}
                {confirming.revision_to_record
                  ? ` · revision ${confirming.revision_to_record}`
                  : ''}
              </span>
            </div>
            <PreviewRow
              label='Net amount to record'
              kobo={confirming.amount_kobo}
              strong
            />
            <PreviewRow
              label='Paystack balance after'
              kobo={confirming.resulting_paystack_balance_kobo}
            />
            <PreviewRow
              label='Operating account after'
              kobo={confirming.resulting_operating_balance_kobo}
            />
          </div>

          {!!confirming.revision_to_record &&
            confirming.existing_recording?.reversed && (
              <p className='text-muted-foreground text-sm'>
                This settlement was recorded before for{' '}
                {formatKobo(confirming.existing_recording.amount_kobo)} and that
                entry was reversed. This re-records it with the corrected
                amount.
              </p>
            )}

          {!confirming.can_record && (
            <Alert variant='destructive'>
              <IconBan />
              <AlertTitle>This settlement can’t be recorded</AlertTitle>
              <AlertDescription>
                <ul className='list-disc pl-4'>
                  {confirming.blocking_reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
                {confirming.existing_recording &&
                  !confirming.existing_recording.reversed && (
                    <ExistingRecordingLink
                      transactionId={
                        confirming.existing_recording.transaction_id
                      }
                    />
                  )}
              </AlertDescription>
            </Alert>
          )}

          {confirming.can_record && (
            <label className='flex items-start gap-2 text-sm'>
              <Checkbox
                checked={checked}
                onCheckedChange={(value) => setChecked(value === true)}
                disabled={busy}
                className='mt-0.5'
              />
              <span>
                The bank statement shows a credit of{' '}
                <strong>{formatKobo(confirming.amount_kobo)}</strong> from
                Paystack for this settlement.
              </span>
            </label>
          )}

          {recordError && (
            <Alert variant='destructive'>
              <IconAlertTriangle />
              <AlertDescription>
                <p>{recordError.message}</p>
                {alreadyRecordedId && (
                  <ExistingRecordingLink transactionId={alreadyRecordedId} />
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className='flex justify-end gap-2'>
            <Button
              variant='outline'
              onClick={() => {
                record.reset();
                setConfirming(null);
              }}
              disabled={busy}
            >
              Back
            </Button>
            <Button
              onClick={onRecord}
              disabled={busy || !confirming.can_record || !checked}
            >
              {record.isPending && (
                <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
              )}
              Record settlement
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
