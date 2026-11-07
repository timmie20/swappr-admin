'use client';

import { CopyButton } from '@/components/copy-button';
import { DetailRow } from '@/components/detail-row';
import { Icons } from '@/components/icons';
import { ReasonModal } from '@/components/modal/reason-modal';
import PayoutDetailSkeleton from '@/components/skeletons/payout-detail-skeleton';
import { QueryErrorState } from '@/components/superadmin-required';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Modal } from '@/components/ui/modal';
import { Separator } from '@/components/ui/separator';
import {
  formatFeeRate,
  formatKobo,
  formatLagosDateTime,
  formatNaira
} from '@/lib/format';
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconBan,
  IconCheck,
  IconCash,
  IconFileText,
  IconPaperclip,
  IconX
} from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';
import {
  useApprovePayout,
  usePayout,
  useRejectPayout
} from '../hooks/use-payouts';
import {
  ConfirmationSignedIn,
  PayoutDestination,
  PayoutDetail,
  PayoutStatus,
  REJECT_REASON
} from '../types/payout.types';
import { AddReceiptModal } from './add-receipt-modal';
import { MarkPaidModal } from './mark-paid-modal';
import { ReceiptViewer } from './receipt-viewer';
import { PayoutStatusBadge } from './payout-status-badge';

const AMBER_ALERT =
  'border-amber-500/50 text-amber-700 dark:text-amber-400 [&>svg]:text-current *:data-[slot=alert-description]:text-amber-700/90 dark:*:data-[slot=alert-description]:text-amber-400/90';

const SIGNED_IN_LABEL: Record<ConfirmationSignedIn, string> = {
  buyer: 'Buyer’s own signed-in account',
  not_signed_in: 'Not signed in (used the emailed link)',
  other_user: 'A different signed-in account'
};

function DestinationRows({
  destination,
  copyable
}: {
  destination: PayoutDestination | null;
  copyable?: boolean;
}) {
  if (!destination) {
    return (
      <p className='text-muted-foreground text-sm'>No bank account on file</p>
    );
  }
  const accountNumber =
    destination.account_number ?? destination.account_number_masked;
  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
      <DetailRow label='Bank' value={destination.bank_name} />
      <DetailRow
        label='Account Number'
        mono
        value={
          accountNumber ? (
            <span className='flex items-center gap-2'>
              {accountNumber}
              {copyable && destination.account_number && (
                <CopyButton
                  value={destination.account_number}
                  label='account number'
                />
              )}
            </span>
          ) : undefined
        }
      />
      <DetailRow
        label='Verified Account Name'
        value={
          destination.account_name ? (
            <span className='text-foreground font-medium'>
              {destination.account_name}
            </span>
          ) : undefined
        }
      />
    </div>
  );
}

function ApproveModal({
  detail,
  isOpen,
  onClose
}: {
  detail: PayoutDetail;
  isOpen: boolean;
  onClose: () => void;
}) {
  const approve = useApprovePayout();
  return (
    <Modal
      title={`Approve ${formatNaira(detail.transfer.amount_naira)} to this account?`}
      description='Approving snapshots the vendor’s bank details below onto this payout, so a later change cannot redirect it. It moves no money — you send the transfer from the bank afterwards, then record it with Mark paid.'
      isOpen={isOpen}
      onClose={approve.isPending ? () => {} : onClose}
    >
      <div className='space-y-4'>
        <div className='rounded-md border p-3'>
          <DestinationRows destination={detail.current_destination} />
        </div>
        <div className='flex justify-end gap-2'>
          <Button
            variant='outline'
            onClick={onClose}
            disabled={approve.isPending}
          >
            Cancel
          </Button>
          <Button
            disabled={approve.isPending || !detail.current_destination}
            onClick={() =>
              approve.mutate(detail.payout.id, { onSettled: onClose })
            }
          >
            {approve.isPending && (
              <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
            )}
            Approve payout
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function PayoutDetailView({ payoutId }: { payoutId: string }) {
  const { data: detail, isLoading, error } = usePayout(payoutId);
  const reject = useRejectPayout();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [receiptViewOpen, setReceiptViewOpen] = useState(false);
  const [addReceiptOpen, setAddReceiptOpen] = useState(false);

  if (error) {
    return <QueryErrorState error={error} title='Could not load this payout' />;
  }
  if (isLoading || !detail) return <PayoutDetailSkeleton />;

  const { payout, order, ledger, transfer } = detail;
  const isRequested = payout.status === PayoutStatus.REQUESTED;
  const isApproved = payout.status === PayoutStatus.APPROVED;
  const isOpenPayout = isRequested || isApproved;
  const isPaid = payout.status === PayoutStatus.COMPLETED;
  const payableShort = isOpenPayout && !ledger.vendor_payable_covers_amount;
  const evidence = order?.delivery_confirmation_evidence ?? null;

  return (
    <div className='w-full space-y-6'>
      {isOpenPayout && (
        <ReasonModal
          isOpen={rejectOpen}
          onClose={() => setRejectOpen(false)}
          onConfirm={(reason) =>
            reject.mutate(
              { id: payout.id, reason },
              { onSettled: () => setRejectOpen(false) }
            )
          }
          loading={reject.isPending}
          title='Reject this payout?'
          description='The vendor is notified and sees your reason, so say what they need to fix. They can request settlement again afterwards.'
          label='Reason (shown to the vendor)'
          placeholder='e.g. The account name does not match your business name — please update your bank details.'
          minLength={REJECT_REASON.min}
          maxLength={REJECT_REASON.max}
          confirmLabel='Reject payout'
          destructive
        />
      )}
      {isRequested && (
        <ApproveModal
          detail={detail}
          isOpen={approveOpen}
          onClose={() => setApproveOpen(false)}
        />
      )}
      {payout.receipt && (
        <ReceiptViewer
          payoutId={payout.id}
          receipt={payout.receipt}
          isOpen={receiptViewOpen}
          onClose={() => setReceiptViewOpen(false)}
        />
      )}
      {isPaid && !payout.has_receipt && (
        <AddReceiptModal
          payoutId={payout.id}
          isOpen={addReceiptOpen}
          onClose={() => setAddReceiptOpen(false)}
        />
      )}
      {isApproved && (
        <MarkPaidModal
          detail={detail}
          isOpen={markPaidOpen}
          onClose={() => setMarkPaidOpen(false)}
        />
      )}

      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <Button variant='ghost' size='icon' asChild>
            <Link href='/dashboard/payout'>
              <IconArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <Heading
            title={transfer.narration}
            description={
              detail.vendor?.business_name ||
              detail.vendor?.trading_name ||
              'Vendor payout'
            }
          />
          <PayoutStatusBadge status={payout.status} />
        </div>
        {isOpenPayout && (
          <div className='flex flex-wrap gap-2'>
            <Button
              variant='outline'
              onClick={() => setRejectOpen(true)}
              disabled={reject.isPending}
            >
              <IconX className='mr-2 h-4 w-4' /> Reject
            </Button>
            {isRequested && (
              <Button
                onClick={() => setApproveOpen(true)}
                disabled={reject.isPending}
              >
                <IconCheck className='mr-2 h-4 w-4' /> Approve
              </Button>
            )}
            {isApproved && (
              <Button
                onClick={() => setMarkPaidOpen(true)}
                disabled={reject.isPending || payableShort}
              >
                <IconCash className='mr-2 h-4 w-4' /> Mark paid
              </Button>
            )}
          </div>
        )}
      </div>

      <Separator />

      {payableShort && (
        <Alert variant='destructive'>
          <IconBan />
          <AlertTitle>Do not pay this payout</AlertTitle>
          <AlertDescription>
            The ledger says this vendor is owed{' '}
            {formatKobo(ledger.vendor_payable_balance_kobo)}, less than this
            payout ({formatKobo(ledger.amount_kobo)}). Reconcile the books
            before paying.
          </AlertDescription>
        </Alert>
      )}
      {isApproved && detail.destination_changed_since_approval === true && (
        <Alert variant='destructive'>
          <IconAlertTriangle />
          <AlertTitle>Bank details changed after approval</AlertTitle>
          <AlertDescription>
            The vendor’s current bank account differs from the one approved for
            this payout. Pay only the approved destination — or reject the
            payout so the vendor can request again with the new account.
          </AlertDescription>
        </Alert>
      )}
      {isOpenPayout && ledger.operating_balance_below_amount && (
        <Alert className={AMBER_ALERT}>
          <IconAlertTriangle />
          <AlertTitle>Operating account below this amount</AlertTitle>
          <AlertDescription>
            The ledger’s operating account holds{' '}
            {formatKobo(ledger.operating_account_balance_kobo)}, less than this
            payout. The Paystack settlement may not have landed yet — check the
            bank balance before sending.
          </AlertDescription>
        </Alert>
      )}
      {payout.status === PayoutStatus.REJECTED && payout.rejection_reason && (
        <Alert>
          <IconX />
          <AlertTitle>Rejected</AlertTitle>
          <AlertDescription>{payout.rejection_reason}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className='text-2xl'>
            {formatNaira(transfer.amount_naira)}
          </CardTitle>
          <CardDescription>
            Amount to transfer — fixed when the customer paid, not editable
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
            <DetailRow
              label='Gross'
              value={formatNaira(payout.gross_amount ?? undefined)}
            />
            <DetailRow
              label={
                order
                  ? `Platform Fee (${formatFeeRate(order.platform_fee_rate_bps)})`
                  : 'Platform Fee'
              }
              value={formatNaira(payout.platform_fee ?? undefined)}
            />
            <DetailRow
              label='Narration'
              mono
              value={
                <span className='flex items-center gap-2'>
                  {transfer.narration}
                  <CopyButton value={transfer.narration} label='narration' />
                </span>
              }
            />
          </div>

          <Separator />

          <div className='space-y-3'>
            <p className='text-sm font-semibold'>
              {payout.destination
                ? 'Approved destination (pay this account)'
                : 'Vendor’s current bank account (snapshotted on approval)'}
            </p>
            <DestinationRows
              destination={payout.destination ?? detail.current_destination}
              copyable
            />
            {transfer.name_check_note && isOpenPayout && (
              <p className='text-muted-foreground text-sm'>
                {transfer.name_check_note}
              </p>
            )}
          </div>

          {payout.destination &&
            detail.destination_changed_since_approval === true && (
              <div className='space-y-3'>
                <p className='text-destructive text-sm font-semibold'>
                  Vendor’s current bank account (differs — do not pay this)
                </p>
                <DestinationRows destination={detail.current_destination} />
              </div>
            )}
        </CardContent>
      </Card>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Delivery Confirmation</CardTitle>
            <CardDescription>
              Settlement is only possible once delivery is confirmed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {order ? (
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <DetailRow
                  label='Confirmed By'
                  value={
                    order.delivery_confirmed_by === 'customer'
                      ? 'Customer'
                      : order.delivery_confirmed_by === 'admin'
                        ? 'Superadmin, on the customer’s behalf'
                        : 'Not confirmed'
                  }
                />
                <DetailRow
                  label='Delivered'
                  value={
                    order.delivered_at
                      ? formatLagosDateTime(order.delivered_at)
                      : undefined
                  }
                />
                {order.delivery_confirmed_by === 'admin' && (
                  <div className='sm:col-span-2'>
                    <DetailRow
                      label='Admin Reason'
                      value={order.delivery_confirmation_reason}
                    />
                  </div>
                )}
                {order.delivery_confirmed_by === 'customer' && (
                  <>
                    <DetailRow
                      label='Who used the link'
                      value={
                        evidence ? (
                          <Badge
                            variant='outline'
                            className={
                              evidence.signed_in === 'buyer'
                                ? ''
                                : 'border-amber-500/60 text-amber-700 dark:text-amber-400'
                            }
                          >
                            {SIGNED_IN_LABEL[evidence.signed_in]}
                          </Badge>
                        ) : (
                          'Not recorded (confirmed before evidence was kept)'
                        )
                      }
                    />
                    {evidence && (
                      <>
                        <DetailRow
                          label='Confirmed At'
                          value={formatLagosDateTime(evidence.confirmed_at)}
                        />
                        <DetailRow
                          label='IP Address'
                          value={evidence.ip}
                          mono
                        />
                        <div className='sm:col-span-2'>
                          <DetailRow
                            label='Device (user agent)'
                            value={evidence.user_agent}
                            mono
                          />
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            ) : (
              <p className='text-muted-foreground text-sm'>
                No order linked to this payout
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ledger</CardTitle>
            <CardDescription>Balances right now</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <DetailRow
                label='Owed to this vendor'
                value={
                  <span
                    className={
                      ledger.vendor_payable_covers_amount
                        ? ''
                        : 'text-destructive font-medium'
                    }
                  >
                    {formatKobo(ledger.vendor_payable_balance_kobo)}
                  </span>
                }
              />
              <DetailRow
                label='Operating account'
                value={
                  <span
                    className={
                      ledger.operating_balance_below_amount
                        ? 'font-medium text-amber-600 dark:text-amber-400'
                        : ''
                    }
                  >
                    {formatKobo(ledger.operating_account_balance_kobo)}
                  </span>
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Order</CardTitle>
          </CardHeader>
          <CardContent>
            {order ? (
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <DetailRow
                  label='Order Number'
                  mono
                  value={
                    <Link
                      href={`/dashboard/orders/${order.order_number}`}
                      className='hover:underline'
                    >
                      {order.order_number}
                    </Link>
                  }
                />
                <DetailRow
                  label='Status'
                  value={<span className='capitalize'>{order.status}</span>}
                />
                <DetailRow
                  label='Total Paid'
                  value={formatNaira(order.total_amount)}
                />
                <DetailRow
                  label='Processing Fee'
                  value={
                    order.processing_fee === null
                      ? undefined
                      : formatNaira(order.processing_fee)
                  }
                />
              </div>
            ) : (
              <p className='text-muted-foreground text-sm'>—</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <DetailRow
                label='Requested'
                value={
                  payout.requested_at
                    ? formatLagosDateTime(payout.requested_at)
                    : undefined
                }
              />
              <DetailRow
                label='Approved'
                value={
                  payout.approved_at
                    ? formatLagosDateTime(payout.approved_at)
                    : undefined
                }
              />
              {payout.rejected_at && (
                <DetailRow
                  label='Rejected'
                  value={formatLagosDateTime(payout.rejected_at)}
                />
              )}
              <DetailRow
                label='Paid'
                value={
                  payout.paid_at
                    ? formatLagosDateTime(payout.paid_at)
                    : undefined
                }
              />
              <DetailRow
                label='Bank Transfer Reference'
                mono
                value={payout.bank_transfer_reference}
              />
              <DetailRow
                label='Receipt'
                value={
                  payout.receipt ? (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setReceiptViewOpen(true)}
                    >
                      <IconFileText className='mr-1 h-4 w-4' /> View receipt
                    </Button>
                  ) : isPaid ? (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setAddReceiptOpen(true)}
                    >
                      <IconPaperclip className='mr-1 h-4 w-4' /> Add receipt
                    </Button>
                  ) : undefined
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
