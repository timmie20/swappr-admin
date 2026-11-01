'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { getApiError } from '@/lib/api/errors';
import { IconFileCheck, IconPaperclip, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { useUploadReceipt } from '../hooks/use-payouts';
import { PayoutReceipt, RECEIPT_FILE } from '../types/payout.types';

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Friendlier than waiting for the API's 400/413. The API still checks the
// file's real content.
function fileProblem(file: File): string | null {
  if (!(RECEIPT_FILE.types as readonly string[]).includes(file.type)) {
    return 'Only JPG, PNG, WebP or PDF files can be used as a receipt.';
  }
  if (file.size > RECEIPT_FILE.maxBytes) {
    return `That file is ${formatBytes(file.size)} — receipts can be at most 5 MB.`;
  }
  return null;
}

const UPLOAD_ERROR_TEXT: Record<string, string> = {
  receipt_file_type_not_allowed:
    'That file isn’t a real JPG, PNG, WebP or PDF (renamed files are refused).',
  receipt_file_too_large: 'Receipts can be at most 5 MB.',
  receipt_storage_unavailable:
    'Receipt storage is unavailable right now. Try the upload again.'
};

interface ReceiptPickerProps {
  /** The uploaded receipt, kept by the parent across failed submits */
  receipt: PayoutReceipt | null;
  onChange: (receipt: PayoutReceipt | null) => void;
  disabled?: boolean;
  /** Lets the parent block its submit while a file is uploading */
  onUploadingChange?: (uploading: boolean) => void;
}

/**
 * Uploads the picked file straight away (privately) and hands the parent
 * the receipt to send as `receipt_id`.
 */
export function ReceiptPicker({
  receipt,
  onChange,
  disabled,
  onUploadingChange
}: ReceiptPickerProps) {
  const upload = useUploadReceipt();
  const [problem, setProblem] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);

  const start = (file: File) => {
    const localProblem = fileProblem(file);
    setProblem(localProblem);
    if (localProblem) return;
    setLastFile(file);
    onUploadingChange?.(true);
    upload.mutate(file, {
      onSuccess: (uploaded) => {
        setLastFile(null);
        onChange(uploaded);
      },
      onError: (error) => {
        const { status, code, message } = getApiError(
          error,
          'Receipt upload failed'
        );
        setProblem(
          (code && UPLOAD_ERROR_TEXT[code]) ||
            (status === 413
              ? UPLOAD_ERROR_TEXT.receipt_file_too_large
              : message)
        );
      },
      onSettled: () => onUploadingChange?.(false)
    });
  };

  const retryable =
    !!lastFile &&
    getApiError(upload.error).code === 'receipt_storage_unavailable';

  if (receipt) {
    return (
      <div className='flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm'>
        <span className='flex min-w-0 items-center gap-2'>
          <IconFileCheck className='h-4 w-4 shrink-0 text-green-600' />
          <span className='truncate'>
            {receipt.original_filename ?? 'Receipt'}
          </span>
          <span className='text-muted-foreground shrink-0 text-xs'>
            {formatBytes(receipt.bytes)}
          </span>
        </span>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='h-7 w-7'
          onClick={() => onChange(null)}
          disabled={disabled}
          aria-label='Remove receipt'
        >
          <IconX className='h-4 w-4' />
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-1.5'>
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={disabled || upload.isPending}
          asChild
        >
          <label className='cursor-pointer'>
            {upload.isPending ? (
              <Icons.spinner className='h-4 w-4 animate-spin' />
            ) : (
              <IconPaperclip className='h-4 w-4' />
            )}
            {upload.isPending ? 'Uploading…' : 'Choose file'}
            <input
              type='file'
              accept={RECEIPT_FILE.accept}
              className='hidden'
              disabled={disabled || upload.isPending}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) start(file);
              }}
            />
          </label>
        </Button>
        {retryable && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => lastFile && start(lastFile)}
            disabled={disabled || upload.isPending}
          >
            Retry upload
          </Button>
        )}
      </div>
      {problem ? (
        <p className='text-destructive text-xs'>{problem}</p>
      ) : (
        <p className='text-muted-foreground text-xs'>
          JPG, PNG, WebP or PDF, up to 5 MB. Stored privately — only superadmins
          can view it.
        </p>
      )}
    </div>
  );
}
