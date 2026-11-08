'use client';

import { Icons } from '@/components/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getApiError } from '@/lib/api/errors';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useVendorAction } from '../hooks/use-vendors';
import {
  ACTION_REASON_MAX,
  AdminVendorOverview,
  CompanyType,
  IdType,
  VendorAction,
  VendorActionKind
} from '../types/vendor.types';

const INTERNAL_REASON = 'Kept in the audit trail. Not sent to the vendor.';

// Added to the copy while a CAC match is waiting for the vendor
const CAC_WAITING_NOTE = {
  verify_cac:
    'A CAC match is waiting for the vendor to confirm; this replaces it.',
  reset_cac_attempts:
    'A CAC match is still waiting for the vendor. This doesn’t cancel it; it restores their attempts for after they answer.'
} as const;

// What each action does, restated in its confirmation
const COPY: Record<
  VendorActionKind,
  {
    title: string;
    description: string;
    confirm: string;
    reasonHelp: string;
    destructive?: boolean;
  }
> = {
  verify_email: {
    title: 'Mark the owner’s email as verified?',
    description:
      'Use this when the owner can’t complete the email link. It counts towards their tier and is recorded as an admin override.',
    confirm: 'Mark email verified',
    reasonHelp: INTERNAL_REASON
  },
  verify_id: {
    title: 'Mark identity as verified?',
    description:
      'Treats KYC as passed, as if the BVN/NIN check had succeeded, so the vendor can reach Tier 1. Recorded as an admin override.',
    confirm: 'Mark ID verified',
    reasonHelp: INTERNAL_REASON
  },
  verify_cac: {
    title: 'Mark the business as verified?',
    description:
      'Treats CAC as passed, so an ID-verified vendor moves to Tier 2 (no listing limit). Refused if another vendor already holds this CAC number. Recorded as an admin override. If it lifts them to Tier 2, they’re emailed that their business is verified.',
    confirm: 'Mark business verified',
    reasonHelp: 'Kept in the audit trail. Not included in any email.'
  },
  reset_cac_attempts: {
    title: 'Reset CAC attempts?',
    description:
      'Sets the vendor’s CAC lookups back to zero so they can try business verification again.',
    confirm: 'Reset attempts',
    reasonHelp: INTERNAL_REASON
  },
  revoke_business: {
    title: 'Revoke business verification?',
    description:
      'Tier 2 back to Tier 1. Their store stays open and their listings stay up, but the Verified business badge goes and they can’t add more once over the 10-listing cap. Their inspection is kept. They’re emailed and notified.',
    confirm: 'Revoke business',
    reasonHelp:
      'The vendor sees this word for word in their email and notification.',
    destructive: true
  },
  suspend: {
    title: 'Suspend this vendor?',
    description:
      'Their store and listings come off the public site and new orders are blocked. They can still sign in, fulfil open orders and see payouts. They’re emailed and notified.',
    confirm: 'Suspend vendor',
    reasonHelp:
      'The vendor sees this word for word in their email and notification.',
    destructive: true
  },
  unsuspend: {
    title: 'Unsuspend this vendor?',
    description:
      'Their store and listings go back on the public site and they can take orders again. They’re emailed and notified that their store is back.',
    confirm: 'Unsuspend vendor',
    reasonHelp:
      'Kept in the audit trail. Not included in their email or notification.'
  }
};

interface VendorActionDialogProps {
  vendorId: string;
  overview: AdminVendorOverview;
  /** The action being confirmed; null = closed */
  kind: VendorActionKind | null;
  onClose: () => void;
}

export function VendorActionDialog({
  vendorId,
  overview,
  kind,
  onClose
}: VendorActionDialogProps) {
  const action = useVendorAction(vendorId);
  const [reason, setReason] = useState('');
  const [idType, setIdType] = useState<IdType>('BVN');
  const [rcNumber, setRcNumber] = useState('');
  const [companyType, setCompanyType] = useState<CompanyType>('RC');
  const [businessName, setBusinessName] = useState('');

  // Fresh form per open, pre-filled from what the vendor already gave us
  useEffect(() => {
    if (!kind) return;
    action.reset();
    setReason('');
    setIdType(overview.verification?.id_type ?? 'BVN');
    setRcNumber(overview.vendor.rc_number ?? '');
    setCompanyType('RC');
    setBusinessName('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  if (!kind) return null;
  const copy = COPY[kind];

  const trimmed = reason.trim();
  const reasonValid = trimmed.length > 0 && trimmed.length <= ACTION_REASON_MAX;
  const fieldsValid = kind !== 'verify_cac' || rcNumber.trim().length > 0;
  const canSubmit = reasonValid && fieldsValid && !action.isPending;
  const apiError = action.error ? getApiError(action.error) : null;
  // The vendor has no registered name on record yet
  const needsBusinessName = !overview.vendor.business_name;

  const buildAction = (): VendorAction => {
    switch (kind) {
      case 'verify_id':
        return { kind, id_type: idType };
      case 'verify_cac':
        return {
          kind,
          rc_number: rcNumber.trim(),
          company_type: companyType,
          ...(businessName.trim() ? { business_name: businessName.trim() } : {})
        };
      default:
        return { kind } as VendorAction;
    }
  };

  const onSubmit = () => {
    if (!canSubmit) return;
    // Stays open on failure so the typed reason isn't lost
    action.mutate(
      { action: buildAction(), reason: trimmed },
      { onSuccess: onClose }
    );
  };

  return (
    <Modal
      isOpen
      title={copy.title}
      description={
        // A match waiting on the vendor: the override replaces it, a reset
        // leaves it waiting
        overview.verification?.cac_status === 'awaiting_confirmation' &&
        (kind === 'verify_cac' || kind === 'reset_cac_attempts')
          ? `${copy.description} ${CAC_WAITING_NOTE[kind]}`
          : copy.description
      }
      onClose={action.isPending ? () => {} : onClose}
    >
      <form
        className='space-y-4'
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        {kind === 'verify_id' && (
          <div className='space-y-2'>
            <Label>ID type</Label>
            <Select
              value={idType}
              onValueChange={(value) => setIdType(value as IdType)}
              disabled={action.isPending}
            >
              <SelectTrigger className='w-[160px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='BVN'>BVN</SelectItem>
                <SelectItem value='NIN'>NIN</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {kind === 'verify_cac' && (
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='rc-number'>CAC number</Label>
              <Input
                id='rc-number'
                value={rcNumber}
                onChange={(event) => setRcNumber(event.target.value)}
                disabled={action.isPending}
                placeholder='e.g. 1234567'
                autoComplete='off'
              />
            </div>
            <div className='space-y-2'>
              <Label>Company type</Label>
              <Select
                value={companyType}
                onValueChange={(value) => setCompanyType(value as CompanyType)}
                disabled={action.isPending}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='RC'>RC · Limited company</SelectItem>
                  <SelectItem value='BN'>BN · Business name</SelectItem>
                  <SelectItem value='IT'>IT · Incorporated trustees</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {needsBusinessName && (
              <div className='space-y-2 sm:col-span-2'>
                <Label htmlFor='business-name'>
                  Registered business name (optional)
                </Label>
                <Input
                  id='business-name'
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  disabled={action.isPending}
                  placeholder='As on the CAC certificate'
                />
              </div>
            )}
          </div>
        )}

        <div className='space-y-2'>
          <Label htmlFor='action-reason'>Reason</Label>
          <Textarea
            id='action-reason'
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={ACTION_REASON_MAX}
            rows={4}
            disabled={action.isPending}
          />
          <div className='text-muted-foreground flex justify-between gap-4 text-xs'>
            <span>{copy.reasonHelp}</span>
            <span className='tabular-nums'>
              {trimmed.length}/{ACTION_REASON_MAX}
            </span>
          </div>
        </div>

        {apiError && (
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
            disabled={action.isPending}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            variant={copy.destructive ? 'destructive' : 'default'}
            disabled={!canSubmit}
          >
            {action.isPending && (
              <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
            )}
            {copy.confirm}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
