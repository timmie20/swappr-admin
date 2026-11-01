'use client';

import { Icons } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { getApiError } from '@/lib/api/errors';
import { formatLagosDateTime } from '@/lib/format';
import { IconAlertTriangle, IconShieldX } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';
import { payoutsApi } from '../api/payouts.service';
import { PayoutReceipt } from '../types/payout.types';
import { formatBytes } from './receipt-picker';

interface ReceiptViewerProps {
  payoutId: string;
  receipt: PayoutReceipt;
  isOpen: boolean;
  onClose: () => void;
}

type ViewState =
  | { kind: 'loading' }
  | { kind: 'ready'; url: string }
  | { kind: 'error'; code: string | null; message: string };

/**
 * Shows a private receipt. The file is fetched with the auth token as a
 * blob and shown from an object URL — deliberately NOT via React Query, so
 * it is never cached; the URL is revoked as soon as the dialog closes.
 */
export function ReceiptViewer({
  payoutId,
  receipt,
  isOpen,
  onClose
}: ReceiptViewerProps) {
  const [state, setState] = useState<ViewState>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (!isOpen) return;
    let url: string | null = null;
    let cancelled = false;
    setState({ kind: 'loading' });

    payoutsApi
      .getReceiptFile(payoutId)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setState({ kind: 'ready', url });
      })
      .catch((error) => {
        if (cancelled) return;
        const { code, message } = getApiError(
          error,
          'Could not load the receipt'
        );
        setState({ kind: 'error', code, message });
      });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
      // Never render a revoked URL if the dialog is reopened
      setState({ kind: 'loading' });
    };
  }, [isOpen, payoutId, attempt]);

  const isPdf = receipt.content_type === 'application/pdf';

  return (
    <Modal
      title='Payout receipt'
      description={`${receipt.original_filename ?? 'Receipt'} · ${formatBytes(receipt.bytes)} · uploaded ${formatLagosDateTime(receipt.uploaded_at)}`}
      isOpen={isOpen}
      onClose={onClose}
      className='max-h-[92vh] overflow-y-auto sm:max-w-3xl'
    >
      {state.kind === 'loading' && (
        <div className='flex h-64 items-center justify-center'>
          <Icons.spinner className='text-muted-foreground h-6 w-6 animate-spin' />
        </div>
      )}

      {state.kind === 'error' &&
        (state.code === 'receipt_integrity_check_failed' ? (
          <Alert variant='destructive'>
            <IconShieldX />
            <AlertTitle>Do not trust this receipt</AlertTitle>
            <AlertDescription>
              The stored file does not match what was uploaded. Tell
              engineering.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant='destructive'>
            <IconAlertTriangle />
            <AlertTitle>Could not load the receipt</AlertTitle>
            <AlertDescription>
              <p>{state.message}</p>
              {state.code === 'receipt_storage_unavailable' && (
                <Button
                  size='sm'
                  variant='outline'
                  className='mt-2'
                  onClick={retry}
                >
                  Try again
                </Button>
              )}
            </AlertDescription>
          </Alert>
        ))}

      {state.kind === 'ready' &&
        (isPdf ? (
          <iframe
            src={state.url}
            title='Payout receipt'
            className='h-[70vh] w-full rounded-md border'
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- object URL, not optimisable
          <img
            src={state.url}
            alt='Payout receipt'
            className='mx-auto max-h-[70vh] w-auto rounded-md border object-contain'
          />
        ))}
    </Modal>
  );
}
