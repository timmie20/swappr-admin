'use client';

import { Icons } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { getApiError } from '@/lib/api/errors';
import { formatLagosDateTime } from '@/lib/format';
import { IconInfoCircle } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import {
  describeRate,
  FeePromotion,
  PlatformFeeSettings,
  REASON_MAX
} from '../types/platform-fee.types';

const promotionLine = (p: FeePromotion | null) =>
  p
    ? `${describeRate(p)}, ${formatLagosDateTime(p.starts_at)} – ${formatLagosDateTime(p.ends_at)}${p.label ? ` (“${p.label}”)` : ''}`
    : 'None';

/** What another superadmin changed between loading the page and saving */
export function settingsDiff(
  before: PlatformFeeSettings,
  after: PlatformFeeSettings
): string[] {
  const lines: string[] = [];
  const std = (s: PlatformFeeSettings) => describeRate(s.standard);
  if (std(before) !== std(after)) {
    lines.push(`Standard rate: ${std(before)} → ${std(after)}`);
  }
  const promo = (s: PlatformFeeSettings) => promotionLine(s.promotion);
  if (promo(before) !== promo(after)) {
    lines.push(`Promotion: ${promo(before)} → ${promo(after)}`);
  }
  return lines;
}

const ERROR_TEXT: Record<string, string> = {
  PROMOTION_END_IN_PAST: 'The end must be in the future.',
  PROMOTION_DATES_INVALID: 'The promotion must end after it starts.',
  NO_PROMOTION:
    'There’s no promotion to end. The page now shows the current settings.'
};

/**
 * Confirmation for every fee change: the fields (children), the reason, and
 * what a change does to orders. A stale version (409 SETTINGS_CHANGED)
 * shows what changed; the page has the new settings by then.
 */
export function FeeChangeDialog({
  isOpen,
  onClose,
  title,
  description,
  confirmLabel,
  destructive,
  canSubmit,
  pending,
  error,
  onSubmit,
  openedWith,
  current,
  children
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  /** The fields are valid */
  canSubmit: boolean;
  pending: boolean;
  error: unknown;
  onSubmit: (reason: string) => void;
  /** The settings when the dialog opened, to show what changed on a 409 */
  openedWith: PlatformFeeSettings | null;
  current: PlatformFeeSettings | undefined;
  children?: React.ReactNode;
}) {
  const [reason, setReason] = useState('');
  useEffect(() => {
    if (!isOpen) setReason('');
  }, [isOpen]);

  const length = reason.trim().length;
  const reasonValid = length >= 1 && length <= REASON_MAX;
  const apiError = error
    ? getApiError(error, 'The change failed. Try again.')
    : null;
  const stale = apiError?.code === 'SETTINGS_CHANGED';
  const changes =
    stale && openedWith && current && current.version !== openedWith.version
      ? settingsDiff(openedWith, current)
      : [];

  return (
    <Modal
      title={title}
      description={description}
      isOpen={isOpen}
      onClose={pending ? () => {} : onClose}
      className='sm:max-w-lg'
    >
      <form
        className='space-y-4'
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit && reasonValid && !pending) onSubmit(reason.trim());
        }}
      >
        {children}

        <div className='space-y-2'>
          <Label htmlFor='fee-reason'>Reason</Label>
          <Textarea
            id='fee-reason'
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder='e.g. Launch promotion agreed with the founders'
            maxLength={REASON_MAX}
            rows={3}
            disabled={pending}
          />
          <p className='text-muted-foreground text-xs'>
            Kept in the audit trail. {length}/{REASON_MAX}
          </p>
        </div>

        <Alert>
          <IconInfoCircle className='h-4 w-4' />
          <AlertTitle>Applies to orders paid from now on</AlertTitle>
          <AlertDescription>
            Orders already paid keep the fee they were charged. An order is
            charged the rate in force when it’s paid, so one checked out a
            moment ago (payment windows are 30 minutes) pays whichever rate is
            in force when the payment lands.
          </AlertDescription>
        </Alert>

        {apiError && (
          <Alert variant='destructive'>
            <AlertTitle>
              {stale
                ? 'The settings changed since you opened this'
                : 'Not saved'}
            </AlertTitle>
            <AlertDescription>
              {stale ? (
                <div className='space-y-1'>
                  {changes.length ? (
                    <ul className='list-disc pl-4'>
                      {changes.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Another superadmin saved a change.</p>
                  )}
                  <p>
                    The page now shows the current settings. Check them, then
                    close this and try again.
                  </p>
                </div>
              ) : (
                (apiError.code && ERROR_TEXT[apiError.code]) || apiError.message
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className='flex w-full items-center justify-end space-x-2'>
          <Button
            type='button'
            variant='outline'
            disabled={pending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            variant={destructive ? 'destructive' : 'default'}
            // A stale dialog would send the old version again
            disabled={pending || stale || !canSubmit || !reasonValid}
          >
            {pending && <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />}
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
