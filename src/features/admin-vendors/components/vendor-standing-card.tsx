'use client';

import { DetailRow } from '@/components/detail-row';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { formatLagosDateTime } from '@/lib/format';
import { useState } from 'react';
import {
  AdminVendorOverview,
  ID_FAILURE_LABEL,
  TIER_HELP,
  VendorActionKind,
  VerifiedVia
} from '../types/vendor.types';
import { VendorActionDialog } from './vendor-action-dialog';
import { AMBER_BADGE, TierBadge } from './vendor-badges';

const viaLabel = (via: VerifiedVia | null) =>
  via === 'admin_override' ? 'by admin override' : via ? 'automatically' : '';

/**
 * Tier, what it's made of, and the audited actions that apply to the
 * vendor's current state (owner decision: on the Overview tab, both roles)
 */
export function VendorStandingCard({
  vendorId,
  overview
}: {
  vendorId: string;
  overview: AdminVendorOverview;
}) {
  const [kind, setKind] = useState<VendorActionKind | null>(null);
  const { vendor, owner, verification: v } = overview;

  const idVerified = v?.id_status === 'verified';
  const cacVerified = v?.cac_status === 'verified';
  // Prembly matched; the vendor hasn't confirmed or declined yet
  const cacAwaiting = v?.cac_status === 'awaiting_confirmation';
  const cacAttempts = v?.cac_attempts ?? 0;

  // Only offer what the API would accept for this vendor right now
  const actions: {
    kind: VendorActionKind;
    label: string;
    destructive?: boolean;
  }[] = [
    ...(!owner.email_verified
      ? [{ kind: 'verify_email' as const, label: 'Mark email verified' }]
      : []),
    ...(!idVerified
      ? [{ kind: 'verify_id' as const, label: 'Mark ID verified' }]
      : []),
    ...(!cacVerified
      ? [{ kind: 'verify_cac' as const, label: 'Mark business verified' }]
      : []),
    ...(!cacVerified && cacAttempts > 0
      ? [{ kind: 'reset_cac_attempts' as const, label: 'Reset CAC attempts' }]
      : []),
    ...(cacVerified
      ? [
          {
            kind: 'revoke_business' as const,
            label: 'Revoke business',
            destructive: true
          }
        ]
      : []),
    vendor.suspended_at
      ? { kind: 'unsuspend' as const, label: 'Unsuspend vendor' }
      : { kind: 'suspend' as const, label: 'Suspend vendor', destructive: true }
  ];

  return (
    <Card>
      <VendorActionDialog
        vendorId={vendorId}
        overview={overview}
        kind={kind}
        onClose={() => setKind(null)}
      />
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          Account standing <TierBadge tier={vendor.tier} />
        </CardTitle>
        <CardDescription>{TIER_HELP[vendor.tier]}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {vendor.suspended_at && (
          <div className='border-destructive/40 bg-destructive/5 rounded-md border p-3 text-sm'>
            <p className='text-destructive font-medium'>
              Suspended {formatLagosDateTime(vendor.suspended_at)}
            </p>
            {vendor.suspension_reason && (
              <p className='text-muted-foreground mt-1'>
                {vendor.suspension_reason}
              </p>
            )}
          </div>
        )}

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
          <DetailRow
            label='Email'
            value={
              owner.email_verified ? (
                <Badge variant='secondary'>Verified</Badge>
              ) : (
                <Badge variant='outline'>Not verified</Badge>
              )
            }
          />
          <DetailRow
            label={`ID${v?.id_type ? ` (${v.id_type})` : ''}`}
            value={
              <span className='space-y-1'>
                <Badge variant={idVerified ? 'secondary' : 'outline'}>
                  {idVerified ? 'Verified' : 'Not verified'}
                </Badge>
                {idVerified && v?.id_verified_via && (
                  <span className='block text-xs'>
                    {viaLabel(v.id_verified_via)}
                  </span>
                )}
                {!idVerified && v?.id_failure_reason && (
                  <span className='text-destructive block text-xs'>
                    Last check: {ID_FAILURE_LABEL[v.id_failure_reason]}
                  </span>
                )}
              </span>
            }
          />
          <DetailRow
            label='Business (CAC)'
            value={
              <span className='space-y-1'>
                {cacAwaiting ? (
                  <Badge variant='outline' className={AMBER_BADGE}>
                    Awaiting vendor confirmation
                  </Badge>
                ) : (
                  <Badge variant={cacVerified ? 'secondary' : 'outline'}>
                    {cacVerified ? 'Verified' : 'Not verified'}
                  </Badge>
                )}
                {cacVerified && v?.cac_verified_via && (
                  <span className='block text-xs'>
                    {viaLabel(v.cac_verified_via)}
                  </span>
                )}
                {!cacVerified && cacAttempts > 0 && (
                  <span className='block text-xs'>
                    {v?.cac_max_attempts
                      ? `${cacAttempts} of ${v.cac_max_attempts} attempts used`
                      : `${cacAttempts} attempt${cacAttempts === 1 ? '' : 's'} used`}
                  </span>
                )}
              </span>
            }
          />
        </div>

        <div className='flex flex-wrap gap-2'>
          {actions.map((a) => (
            <Button
              key={a.kind}
              size='sm'
              variant={a.destructive ? 'outline' : 'secondary'}
              className={a.destructive ? 'text-destructive' : undefined}
              onClick={() => setKind(a.kind)}
            >
              {a.label}
            </Button>
          ))}
        </div>
        <p className='text-muted-foreground text-xs'>
          Every action needs a reason and is recorded in the History tab.
        </p>
      </CardContent>
    </Card>
  );
}
