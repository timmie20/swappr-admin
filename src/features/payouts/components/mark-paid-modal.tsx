'use client';

import { CopyButton } from '@/components/copy-button';
import { Icons } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { getApiError } from '@/lib/api/errors';
import { formatNaira } from '@/lib/format';
import { IconAlertTriangle, IconBan } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useMarkPayoutPaid } from '../hooks/use-payouts';
import {
  BANK_REFERENCE,
  PayoutDetail,
  PayoutReceipt
} from '../types/payout.types';
import { ReceiptPicker } from './receipt-picker';

interface MarkPaidModalProps {
  detail: PayoutDetail;
  isOpen: boolean;
  onClose: () => void;
}

function validateReference(value: string): string | null {
  const ref = value.trim();
  if (ref.length < BANK_REFERENCE.min)
    return `At least ${BANK_REFERENCE.min} characters`;
  if (ref.length > BANK_REFERENCE.max)
    return `At most ${BANK_REFERENCE.max} characters`;
  if (!BANK_REFERENCE.pattern.test(ref))
    return 'Only letters, numbers, spaces and - _ / . :';
  return null;
}

// The receipt can't be used for this payout: upload the file again
const RECEIPT_UNUSABLE_CODES = new Set([
  'receipt_not_found',
  'receipt_already_attached'
]);

export function MarkPaidModal({ detail, isOpen, onClose }: MarkPaidModalProps) {
  const { payout, transfer } = detail;
  const destination = payout.destination;
  const markPaid = useMarkPayoutPaid();

  const [reference, setReference] = useState('');
  // Kept across a failed submit (e.g. reference_already_used) so a retry
  // doesn't upload the file again
  const [receipt, setReceipt] = useState<PayoutReceipt | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sentConfirmed, setSentConfirmed] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setReference('');
      setReceipt(null);
      setSentConfirmed(false);
      setTouched(false);
      markPaid.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const referenceError = validateReference(reference);
  const apiError = markPaid.error ? getApiError(markPaid.error) : null;
  const blocked =
    apiError?.code === 'vendor_payable_insufficient' ||
    !detail.ledger.vendor_payable_covers_amount;
  const busy = markPaid.isPending || uploading;
  const canSubmit = !referenceError && sentConfirmed && !blocked && !busy;

  const onSubmit = () => {
    setTouched(true);
    if (!canSubmit) return;
    markPaid.mutate(
      {
        id: payout.id,
        body: {
          bank_transfer_reference: reference.trim(),
          ...(receipt ? { receipt_id: receipt.id } : {})
        }
      },
      {
        onSuccess: onClose,
        onError: (error) => {
          const { code } = getApiError(error);
          if (code && RECEIPT_UNUSABLE_CODES.has(code)) setReceipt(null);
        }
      }
    );
  };

  return (
    <Modal
      title='Record the bank transfer'
      description='Marking paid records that you have ALREADY sent this transfer from the bank, posts it to the ledger and notifies the vendor. It cannot be undone. Send the transfer first.'
      isOpen={isOpen}
      onClose={busy ? () => {} : onClose}
    >
      <form
        className='space-y-4'
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className='bg-muted/50 space-y-2 rounded-md border p-3 text-sm'>
          <div className='flex justify-between gap-4'>
            <span className='text-muted-foreground'>Amount (fixed)</span>
            <span className='font-semibold'>
              {formatNaira(transfer.amount_naira)}
            </span>
          </div>
          <div className='flex justify-between gap-4'>
            <span className='text-muted-foreground'>To</span>
            <span className='text-right'>
              {destination?.account_name ?? '—'}
              <br />
              <span className='font-mono text-xs'>
                {destination?.account_number ?? '—'}
              </span>{' '}
              · {destination?.bank_name ?? '—'}
            </span>
          </div>
          <div className='flex items-center justify-between gap-4'>
            <span className='text-muted-foreground'>Narration</span>
            <span className='flex items-center gap-2 font-mono text-xs'>
              {transfer.narration}
              <CopyButton value={transfer.narration} label='narration' />
            </span>
          </div>
        </div>

        {blocked && (
          <Alert variant='destructive'>
            <IconBan />
            <AlertTitle>Do not pay this payout</AlertTitle>
            <AlertDescription>
              {apiError?.code === 'vendor_payable_insufficient'
                ? apiError.message
                : 'The ledger shows less owed to this vendor than this payout. Do not pay it until the books are reconciled.'}
            </AlertDescription>
          </Alert>
        )}

        <div className='space-y-2'>
          <Label htmlFor='bank-reference'>Bank transfer reference</Label>
          <Input
            id='bank-reference'
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            onBlur={() => setTouched(true)}
            placeholder='The reference on your bank’s transfer receipt'
            maxLength={BANK_REFERENCE.max}
            disabled={busy || blocked}
            autoComplete='off'
          />
          {touched && referenceError && (
            <p className='text-destructive text-xs'>{referenceError}</p>
          )}
          {apiError?.code === 'reference_already_used' && (
            <p className='text-destructive text-xs'>{apiError.message}</p>
          )}
        </div>

        <div className='space-y-2'>
          <Label>Receipt (optional)</Label>
          <ReceiptPicker
            receipt={receipt}
            onChange={setReceipt}
            onUploadingChange={setUploading}
            disabled={markPaid.isPending || blocked}
          />
          {apiError?.code && RECEIPT_UNUSABLE_CODES.has(apiError.code) && (
            <p className='text-destructive text-xs'>
              {apiError.message} Choose the file again to upload a fresh copy.
            </p>
          )}
        </div>

        <label className='flex items-start gap-2 text-sm'>
          <Checkbox
            checked={sentConfirmed}
            onCheckedChange={(checked) => setSentConfirmed(checked === true)}
            disabled={busy || blocked}
            className='mt-0.5'
          />
          <span>
            I have sent {formatNaira(transfer.amount_naira)} to{' '}
            {destination?.account_name ?? 'the approved account'} and the bank’s
            name enquiry matched.
          </span>
        </label>

        {apiError &&
          apiError.code !== 'vendor_payable_insufficient' &&
          apiError.code !== 'reference_already_used' &&
          !(apiError.code && RECEIPT_UNUSABLE_CODES.has(apiError.code)) && (
            <Alert variant='destructive'>
              <IconAlertTriangle />
              <AlertDescription>{apiError.message}</AlertDescription>
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
          <Button type='submit' disabled={!canSubmit}>
            {markPaid.isPending && (
              <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
            )}
            Mark paid
          </Button>
        </div>
      </form>
    </Modal>
  );
}
