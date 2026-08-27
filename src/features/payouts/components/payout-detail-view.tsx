'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { formatDate, formatNaira } from '@/lib/format';
import { IconArrowLeft, IconRefresh } from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';
import { usePayout } from '../hooks/use-payouts';
import { useRetryPayout } from '../hooks/use-retry-payout';
import { Payout, PayoutStatus } from '../types/payout.types';

const STATUS_BADGE_VARIANT: Record<
  PayoutStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  [PayoutStatus.PENDING]: 'outline',
  [PayoutStatus.PROCESSING]: 'secondary',
  [PayoutStatus.COMPLETED]: 'default',
  [PayoutStatus.FAILED]: 'destructive'
};

interface DetailRowProps {
  label: string;
  value?: React.ReactNode;
  mono?: boolean;
}

function DetailRow({ label, value, mono }: DetailRowProps) {
  return (
    <div>
      <p className='text-sm font-medium'>{label}</p>
      <p
        className={`text-muted-foreground mt-1 text-sm ${mono ? 'font-mono text-xs' : ''}`}
      >
        {value ?? '—'}
      </p>
    </div>
  );
}

interface PayoutDetailViewProps {
  payout: Payout;
}

export default function PayoutDetailView({
  payout: initialPayout
}: PayoutDetailViewProps) {
  const { data: payout } = usePayout(initialPayout.id, initialPayout);
  const retryPayout = useRetryPayout();
  const [retryOpen, setRetryOpen] = useState(false);

  const canRetry = payout.status === PayoutStatus.FAILED;

  const onConfirmRetry = () => {
    retryPayout.mutate(payout.id, {
      onSuccess: () => setRetryOpen(false)
    });
  };

  return (
    <div className='space-y-6'>
      <AlertModal
        isOpen={retryOpen}
        onClose={() => setRetryOpen(false)}
        onConfirm={onConfirmRetry}
        loading={retryPayout.isPending}
        title='Retry this payout?'
        description='This re-attempts the Paystack transfer to the vendor.'
        confirmLabel='Retry'
      />

      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Button variant='ghost' size='icon' asChild>
            <Link href='/dashboard/payout'>
              <IconArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <Heading
            title='Payout Details'
            description='View vendor payout, source payment and order information'
          />
        </div>
        {canRetry && (
          <Button
            onClick={() => setRetryOpen(true)}
            disabled={retryPayout.isPending}
          >
            <IconRefresh className='mr-2 h-4 w-4' /> Retry Payout
          </Button>
        )}
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-xl'>
                {formatNaira(payout.net_amount)}
              </CardTitle>
              <CardDescription>Net payout amount</CardDescription>
            </div>
            <Badge
              variant={STATUS_BADGE_VARIANT[payout.status]}
              className='capitalize'
            >
              {payout.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            <DetailRow label='Payout ID' value={payout.id} mono />
            <DetailRow
              label='Gross Amount'
              value={formatNaira(payout.gross_amount)}
            />
            <DetailRow
              label='Platform Fee'
              value={formatNaira(payout.platform_fee)}
            />
            <DetailRow
              label='Transfer Reference'
              value={payout.transfer_reference}
              mono
            />
            <DetailRow
              label='Transfer Code'
              value={payout.transfer_code}
              mono
            />
            <DetailRow label='Retry Count' value={payout.retry_count ?? 0} />
            <DetailRow
              label='Initiated'
              value={
                payout.initiated_at
                  ? formatDate(payout.initiated_at, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : undefined
              }
            />
            <DetailRow
              label='Created'
              value={formatDate(payout.created_at, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            />
            <DetailRow
              label='Completed'
              value={
                payout.completed_at
                  ? formatDate(payout.completed_at, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : undefined
              }
            />
            {payout.failure_reason && (
              <DetailRow label='Failure Reason' value={payout.failure_reason} />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <CardTitle>Vendor</CardTitle>
            {payout.vendor?.is_verified && (
              <Badge variant='secondary'>Verified</Badge>
            )}
          </div>
          <CardDescription>Bank details used for this transfer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            <DetailRow
              label='Business Name'
              value={
                payout.vendor?.business_name || payout.vendor?.trading_name
              }
            />
            <DetailRow label='Email' value={payout.vendor?.contact_email} />
            <DetailRow label='Phone' value={payout.vendor?.contact_number} />
            <DetailRow label='Bank Name' value={payout.vendor?.bank_name} />
            <DetailRow
              label='Bank Code'
              value={payout.vendor?.bank_code}
              mono
            />
            <DetailRow
              label='Account Number'
              value={payout.vendor?.account_number}
              mono
            />
            <DetailRow
              label='Account Name'
              value={payout.vendor?.account_name}
            />
            <DetailRow
              label='Paystack Recipient Code'
              value={payout.vendor?.paystack_recipient_code}
              mono
            />
          </div>
        </CardContent>
      </Card>

      {payout.payment && (
        <Card>
          <CardHeader>
            <CardTitle>Source Payment</CardTitle>
            <CardDescription>
              The customer payment that funded this payout
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              <DetailRow label='Payment ID' value={payout.payment.id} mono />
              <DetailRow
                label='Reference'
                value={payout.payment.reference}
                mono
              />
              <DetailRow
                label='Amount'
                value={formatNaira(payout.payment.amount)}
              />
              <DetailRow label='Status' value={payout.payment.status} />
              <DetailRow label='Channel' value={payout.payment.channel} />
              <DetailRow
                label='Paid At'
                value={
                  payout.payment.paid_at
                    ? formatDate(payout.payment.paid_at, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : undefined
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {payout.order && (
        <Card>
          <CardHeader>
            <CardTitle>Order</CardTitle>
            <CardDescription>
              The order this payout was generated for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              <DetailRow
                label='Order Number'
                value={payout.order.order_number}
              />
              <DetailRow label='Type' value={payout.order.order_type} />
              <DetailRow label='Status' value={payout.order.status} />
              <DetailRow
                label='Payment Status'
                value={payout.order.payment_status}
              />
              <DetailRow
                label='Total Amount'
                value={formatNaira(payout.order.total_amount)}
              />
              <DetailRow
                label='Vendor Payout Amount'
                value={
                  payout.order.vendor_payout_amount
                    ? formatNaira(payout.order.vendor_payout_amount)
                    : undefined
                }
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
