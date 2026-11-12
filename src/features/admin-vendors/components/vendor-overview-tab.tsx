'use client';

import { DetailRow } from '@/components/detail-row';
import { Icons } from '@/components/icons';
import {
  StatTile,
  StatTileProps,
  StatTileSkeleton
} from '@/components/stat-tile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { formatKobo, formatLagosDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useSetVendorInspection } from '../hooks/use-vendors';
import {
  AdminVendorOverview,
  CAC_STATUS_LABEL,
  CacStatus
} from '../types/vendor.types';
import { AMBER_BADGE } from './vendor-badges';
import { VendorCacLookupCard } from './vendor-cac-lookup-card';
import { VendorStandingCard } from './vendor-standing-card';
import { FormTextarea } from '@/components/forms/form-textarea';
import { useForm } from 'react-hook-form';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';

const n = (value: number) => value.toLocaleString('en-NG');

const REVOKE_REASON_MAX = 500;

// Same rule as the API (5–500 characters after trimming)
const revokeSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Please give a reason (at least 5 characters)')
    .max(REVOKE_REASON_MAX, `At most ${REVOKE_REASON_MAX} characters`)
});

type RevokeFormValues = z.infer<typeof revokeSchema>;

// Same grid as the Overview page's tile rows
export const TILE_GRID =
  '*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4';

const STATUS_VARIANT: Record<CacStatus, 'default' | 'outline' | 'destructive'> =
  {
    verified: 'default',
    pending: 'outline',
    rejected: 'destructive',
    awaiting_confirmation: 'outline'
  };

function VerificationBadge({ status }: { status: CacStatus }) {
  return (
    <Badge
      variant={STATUS_VARIANT[status] ?? 'outline'}
      className={status === 'awaiting_confirmation' ? AMBER_BADGE : undefined}
    >
      {CAC_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

function InspectionCard({
  vendorId,
  vendor
}: {
  vendorId: string;
  vendor: AdminVendorOverview['vendor'];
}) {
  const setInspection = useSetVendorInspection(vendorId);
  const [confirming, setConfirming] = useState<
    'verify' | 'revoke' | 'decline' | null
  >(null);
  const pending =
    !vendor.is_inspection_verified && !!vendor.inspection_requested_at;

  const form = useForm<RevokeFormValues>({
    resolver: zodResolver(revokeSchema),
    mode: 'onChange',
    defaultValues: {
      reason: ''
    }
  });

  const closeDialog = () => {
    setConfirming(null);
    form.reset();
  };

  // Stays open on failure (the hook toasts the API's message) so a typed
  // reason isn't lost
  const onVerify = (event: React.FormEvent) => {
    event.preventDefault();
    setInspection.mutate({ verified: true }, { onSuccess: closeDialog });
  };

  const onRevoke = ({ reason }: RevokeFormValues) => {
    setInspection.mutate(
      { verified: false, reason, declined: confirming === 'decline' },
      { onSuccess: closeDialog }
    );
  };

  return (
    <Card>
      <Modal
        isOpen={confirming !== null}
        onClose={() => !setInspection.isPending && closeDialog()}
        title={
          confirming === 'verify'
            ? 'Mark the store inspection verified?'
            : confirming === 'decline'
              ? 'Decline the inspection request?'
              : 'Revoke the store inspection?'
        }
        description={
          confirming === 'verify'
            ? 'Only do this after a Swappr team member has inspected the store in person. The vendor shows as Swappr Inspected, can turn on store pickup, and is emailed.'
            : confirming === 'decline'
              ? 'The request is cleared and the vendor can send a new one. They aren’t emailed about a declined request.'
              : 'The vendor loses the Swappr Inspected badge, store pickup is turned off, and their inspection request is cleared, they would have to request a new one.'
        }
      >
        <Form
          form={form}
          // Verifying has no reason, so it must skip the revoke validation
          onSubmit={
            confirming === 'verify' ? onVerify : form.handleSubmit(onRevoke)
          }
          className='space-y-2'
        >
          {(confirming === 'revoke' || confirming === 'decline') && (
            <FormTextarea
              control={form.control}
              name='reason'
              label={
                confirming === 'decline'
                  ? 'Reason for declining'
                  : 'Reason for revocation'
              }
              description={
                confirming === 'decline'
                  ? 'Required. Not sent to the vendor.'
                  : 'Tell the vendor why. They’ll see this in their email.'
              }
              placeholder={
                confirming === 'decline'
                  ? 'e.g. Store is outside our inspection area'
                  : 'e.g. Store inspection was not satisfactory, vendor must reapply'
              }
              required
              disabled={setInspection.isPending}
              config={{ maxLength: REVOKE_REASON_MAX, rows: 4 }}
            />
          )}

          <div className='flex justify-end gap-2 pt-2'>
            <Button
              type='button'
              variant='outline'
              onClick={closeDialog}
              disabled={setInspection.isPending}
            >
              Cancel
            </Button>
            <Button
              variant={confirming === 'verify' ? 'default' : 'destructive'}
              disabled={
                setInspection.isPending ||
                (confirming !== 'verify' && !form.formState.isValid)
              }
              type='submit'
            >
              {setInspection.isPending && (
                <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
              )}
              {confirming === 'verify'
                ? 'Mark verified'
                : confirming === 'decline'
                  ? 'Decline request'
                  : 'Revoke inspection'}
            </Button>
          </div>
        </Form>
      </Modal>
      <CardHeader>
        <CardTitle>Swappr inspection</CardTitle>
        <CardDescription>Physical store inspection by Swappr</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
          <DetailRow
            label='Status'
            value={
              vendor.is_inspection_verified ? (
                <Badge>Inspected</Badge>
              ) : pending ? (
                <Badge variant='outline' className={AMBER_BADGE}>
                  Requested
                </Badge>
              ) : (
                'Not requested'
              )
            }
          />
          <DetailRow
            label='Requested'
            value={
              vendor.inspection_requested_at
                ? formatLagosDateTime(vendor.inspection_requested_at)
                : undefined
            }
          />
          <DetailRow
            label='Store pickup'
            value={vendor.pickup_enabled ? 'On' : 'Off'}
          />
        </div>
        {(pending || vendor.is_inspection_verified) && (
          <div className='flex gap-2'>
            {pending && (
              <>
                <Button size='sm' onClick={() => setConfirming('verify')}>
                  Mark inspection verified
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setConfirming('decline')}
                >
                  Decline request
                </Button>
              </>
            )}
            {vendor.is_inspection_verified && (
              <Button
                size='sm'
                variant='outline'
                onClick={() => setConfirming('revoke')}
              >
                Revoke inspection
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function VendorOverviewTab({
  vendorId,
  overview,
  isSuperadmin
}: {
  vendorId: string;
  overview: AdminVendorOverview | undefined;
  isSuperadmin: boolean;
}) {
  if (!overview) {
    return (
      <div className={TILE_GRID}>
        {Array.from({ length: 4 }).map((_, i) => (
          <StatTileSkeleton key={i} />
        ))}
      </div>
    );
  }

  const { vendor, owner, verification, bank_account, activity, finance } =
    overview;
  const base = `/dashboard/vendors/${vendorId}`;
  const ordersHref = (queue: string) => `${base}?tab=orders&queue=${queue}`;
  const o = activity.orders;
  const r = activity.requests;

  const activityTiles: StatTileProps[] = [
    {
      label: 'Active Listings',
      value: n(activity.listings.active),
      sublabel: `${n(activity.listings.out_of_stock)} out of stock · ${n(activity.listings.unpublished)} unpublished`,
      href: `${base}?tab=products`
    },
    {
      label: 'Needs Action',
      value: n(o.needs_action),
      sublabel: 'Paid orders to process',
      tone: o.needs_action > 0 ? 'warning' : 'default',
      href: ordersHref('needs_action')
    },
    {
      label: 'Awaiting Confirmation',
      value: n(o.awaiting_delivery_confirmation),
      sublabel: 'Shipped, customer hasn’t confirmed',
      href: ordersHref('awaiting_delivery_confirmation')
    },
    {
      label: 'Completed Orders',
      value: n(o.completed),
      sublabel: `${n(o.total)} orders in total${o.last_order_at ? ` · last ${formatLagosDateTime(o.last_order_at)}` : ''}`,
      href: ordersHref('completed')
    },
    {
      label: 'Awaiting Payment',
      value: n(o.awaiting_payment),
      sublabel: 'Checkouts not paid yet',
      href: ordersHref('awaiting_payment')
    },
    {
      label: 'Cancelled',
      value: n(o.cancelled),
      sublabel: 'Cancelled or rejected',
      href: ordersHref('cancelled')
    },
    {
      label: 'Payouts',
      value: n(activity.payouts.paid),
      sublabel: `paid · ${n(activity.payouts.requested)} requested · ${n(activity.payouts.approved)} approved · ${n(activity.payouts.rejected)} rejected`
    },
    {
      label: 'Open Requests',
      value: n(r.total_open),
      sublabel: `${n(r.open_delivery_reviews)} delivery reviews · ${n(r.open_payout_requests)} payouts${r.inspection_pending ? ' · inspection' : ''}`,
      tone: r.total_open > 0 ? 'warning' : 'default',
      href: `${base}?tab=requests`
    }
  ];

  const ownerName =
    [owner.first_name, owner.last_name].filter(Boolean).join(' ') || '—';
  const hours = vendor.operating_hours;

  return (
    <div className='space-y-6'>
      <section className='space-y-2'>
        <h3 className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
          Store activity
        </h3>
        <div className={TILE_GRID}>
          {activityTiles.map((tile) => (
            <StatTile key={tile.label} {...tile} />
          ))}
        </div>
      </section>

      {isSuperadmin && finance && (
        <Card>
          <CardHeader>
            <CardTitle>Finance</CardTitle>
            <CardDescription>
              From {n(finance.paid_orders)} paid orders. “Owed by the ledger” is
              the balance payouts are checked against; it can differ from
              earnings − paid out for orders paid before the ledger existed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
              <DetailRow
                label='Lifetime sales'
                value={formatKobo(finance.lifetime_sales_kobo)}
              />
              <DetailRow
                label='Platform fees'
                value={formatKobo(finance.platform_fees_kobo)}
              />
              <DetailRow
                label='Vendor earnings'
                value={formatKobo(finance.vendor_earnings_kobo)}
              />
              <DetailRow
                label='Paid out'
                value={formatKobo(finance.paid_out_kobo)}
              />
              <DetailRow
                label='Pending payouts'
                value={formatKobo(finance.pending_payouts_kobo)}
              />
              <DetailRow
                label='Owed by the ledger'
                value={
                  <span
                    className={cn(
                      'text-foreground font-medium',
                      finance.ledger_balance_owed_kobo < 0 && 'text-destructive'
                    )}
                  >
                    {formatKobo(finance.ledger_balance_owed_kobo)}
                  </span>
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {vendor.description && (
              <p className='text-muted-foreground text-sm'>
                {vendor.description}
              </p>
            )}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <DetailRow label='Business name' value={vendor.business_name} />
              <DetailRow label='Trading name' value={vendor.trading_name} />
              <DetailRow label='RC number' value={vendor.rc_number} mono />
              <DetailRow
                label='Rating'
                value={`${Number(vendor.rating).toFixed(1)} · ${n(vendor.total_trades_completed)} trades`}
              />
              <div className='sm:col-span-2'>
                <DetailRow
                  label='Address'
                  value={[vendor.business_address, vendor.city, vendor.state]
                    .filter(Boolean)
                    .join(', ')}
                />
              </div>
              <DetailRow label='Landmark' value={vendor.landmark} />
              <DetailRow
                label='Operating hours'
                value={
                  hours
                    ? `${hours.days.join(', ')} · ${hours.open_time}–${hours.close_time}`
                    : undefined
                }
              />
              <DetailRow
                label='Joined'
                value={formatLagosDateTime(vendor.created_at)}
              />
            </div>
            {vendor.store_photos.length > 0 && (
              <div className='flex flex-wrap gap-2'>
                {vendor.store_photos.map((url) => (
                  <a key={url} href={url} target='_blank' rel='noreferrer'>
                    {/* eslint-disable-next-line @next/next/no-img-element -- remote vendor photos */}
                    <img
                      src={url}
                      alt='Store photo'
                      className='h-20 w-20 rounded-md border object-cover'
                    />
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Owner account</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <DetailRow label='Name' value={ownerName} />
                <DetailRow
                  label='Email'
                  value={
                    <span className='flex flex-wrap items-center gap-1.5'>
                      {owner.email}
                      {!owner.email_verified && (
                        <Badge variant='outline'>Unverified</Badge>
                      )}
                    </span>
                  }
                />
                <DetailRow
                  label='Status'
                  value={
                    owner.is_active ? (
                      'Active'
                    ) : (
                      <Badge variant='destructive'>Inactive</Badge>
                    )
                  }
                />
                <DetailRow
                  label='Last sign-in'
                  value={
                    owner.last_sign_in_at
                      ? formatLagosDateTime(owner.last_sign_in_at)
                      : 'Never'
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verification</CardTitle>
              <CardDescription>Statuses only — no KYC data</CardDescription>
            </CardHeader>
            <CardContent>
              {verification ? (
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                  <DetailRow
                    label='CAC (business)'
                    value={
                      <span className='space-y-1'>
                        <VerificationBadge status={verification.cac_status} />
                        {verification.cac_verified_at && (
                          <span className='block text-xs'>
                            {formatLagosDateTime(verification.cac_verified_at)}
                          </span>
                        )}
                        {verification.cac_rejection_reason && (
                          <span className='text-destructive block text-xs'>
                            {verification.cac_rejection_reason}
                          </span>
                        )}
                      </span>
                    }
                  />
                  <DetailRow
                    label={`ID${verification.id_type ? ` (${verification.id_type})` : ''}`}
                    value={
                      <span className='space-y-1'>
                        <VerificationBadge status={verification.id_status} />
                        {verification.id_verified_at && (
                          <span className='block text-xs'>
                            {formatLagosDateTime(verification.id_verified_at)}
                          </span>
                        )}
                        {verification.id_rejection_reason && (
                          <span className='text-destructive block text-xs'>
                            {verification.id_rejection_reason}
                          </span>
                        )}
                      </span>
                    }
                  />
                  <DetailRow
                    label='Verification score'
                    value={verification.verification_score}
                  />
                </div>
              ) : (
                <p className='text-muted-foreground text-sm'>
                  No verification started yet
                </p>
              )}
            </CardContent>
          </Card>

          <VendorCacLookupCard
            vendorId={vendorId}
            cacStatus={verification?.cac_status}
          />

          <Card>
            <CardHeader>
              <CardTitle>Bank account</CardTitle>
            </CardHeader>
            <CardContent>
              {bank_account ? (
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
                  <DetailRow label='Bank' value={bank_account.bank_name} />
                  <DetailRow
                    label='Account number'
                    mono
                    value={`•••• ${bank_account.account_number_last4}`}
                  />
                  <DetailRow
                    label='Account name'
                    value={bank_account.account_name}
                  />
                </div>
              ) : (
                <p className='text-muted-foreground text-sm'>
                  No bank account added
                </p>
              )}
            </CardContent>
          </Card>

          <VendorStandingCard vendorId={vendorId} overview={overview} />
          <InspectionCard vendorId={vendorId} vendor={vendor} />
        </div>
      </div>
    </div>
  );
}
