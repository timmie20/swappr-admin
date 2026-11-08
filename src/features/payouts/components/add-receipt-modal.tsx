'use client';

import { Icons } from '@/components/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { getApiError } from '@/lib/api/errors';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useAttachReceipt } from '../hooks/use-payouts';
import { PayoutReceipt } from '../types/payout.types';
import { ReceiptPicker } from './receipt-picker';

interface AddReceiptModalProps {
  payoutId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddReceiptModal({
  payoutId,
  isOpen,
  onClose
}: AddReceiptModalProps) {
  const attach = useAttachReceipt();
  const [receipt, setReceipt] = useState<PayoutReceipt | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setReceipt(null);
      attach.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const apiError = attach.error ? getApiError(attach.error) : null;
  const busy = attach.isPending || uploading;

  const onAttach = () => {
    if (!receipt || busy) return;
    attach.mutate(
      { id: payoutId, receiptId: receipt.id },
      {
        onSuccess: onClose,
        onError: (error) => {
          const { code } = getApiError(error);
          // This copy can't be used: the admin has to upload the file again
          if (
            code === 'receipt_not_found' ||
            code === 'receipt_already_attached'
          )
            setReceipt(null);
        }
      }
    );
  };

  return (
    <Modal
      title='Add the bank receipt'
      description='Attaches the bank’s confirmation to this paid payout. A recorded receipt is evidence: once attached it cannot be replaced or removed.'
      isOpen={isOpen}
      onClose={busy ? () => {} : onClose}
    >
      <div className='space-y-4'>
        <ReceiptPicker
          receipt={receipt}
          onChange={setReceipt}
          onUploadingChange={setUploading}
          disabled={attach.isPending}
        />

        {apiError && (
          <Alert variant='destructive'>
            <IconAlertTriangle />
            <AlertDescription>{apiError.message}</AlertDescription>
          </Alert>
        )}

        <div className='flex justify-end gap-2'>
          <Button variant='outline' onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={onAttach} disabled={!receipt || busy}>
            {attach.isPending && (
              <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
            )}
            Attach receipt
          </Button>
        </div>
      </div>
    </Modal>
  );
}
