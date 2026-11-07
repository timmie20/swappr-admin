'use client';

import { Badge } from '@/components/ui/badge';
import {
  TIER_LABEL,
  VendorTier
} from '@/features/admin-vendors/types/vendor.types';
import { transactionHref } from '@/features/ledger/components/ledger-links';
import { formatBps, formatKobo, formatLagosDateTime } from '@/lib/format';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import {
  AuditEntry,
  CATEGORY_LABEL,
  ACTOR_LABEL,
  eventLabel,
  humanise
} from '../types/audit.types';

export const PROVIDER_LABEL: Record<string, string> = { prembly: 'Prembly' };

export const COMPANY_TYPE_LABEL: Record<string, string> = {
  RC: 'RC · Limited company',
  BN: 'BN · Business name',
  IT: 'IT · Incorporated trustees'
};

// Known metadata keys, in reading order. rc_number is shown to every role
// that sees the entry: both admin roles already see it on the vendor's
// Profile card.
const METADATA_LABEL: Record<string, string> = {
  id_type: 'ID type',
  rc_number: 'CAC number',
  company_type: 'Company type',
  company_name: 'Registered name',
  confirmed_by_vendor: 'Confirmed by vendor',
  applied_fields: 'Store details taken from CAC',
  provider: 'Checked with',
  reference: 'Lookup reference',
  verification_id: 'Verification ID',
  looked_up_at: 'Looked up',
  previous_attempts: 'Previous CAC attempts',
  fields: 'Fields changed',
  rejection_category: 'Rejection category',
  bulk: 'Bulk action',
  removed_from_carts: 'Removed from carts',
  net_amount_kobo: 'Net amount',
  amount_kobo: 'Amount',
  destination_account_last4: 'Paid to account',
  bank_transfer_reference: 'Bank reference',
  receipt_attached: 'Receipt attached',
  settlement_id: 'Settlement',
  reversal_transaction_id: 'Reversal',
  action: 'Action',
  status: 'Status'
};

// Shown elsewhere in the row (Tier change), already linked from the What
// column, or (response: the full Prembly answer) shown in the vendor's CAC
// lookup panel
const HIDDEN_METADATA = new Set([
  'from_tier',
  'to_tier',
  'order_id',
  'order_number',
  'response'
]);

// Delivery and payout entries carry metadata.order_number (subject_label
// is display text like "Order SW-123", not the number itself)
const orderHref = (entry: AuditEntry): string | null => {
  const number = entry.metadata?.order_number;
  return typeof number === 'string' && number
    ? `/dashboard/orders/${encodeURIComponent(number)}`
    : null;
};

function MetadataValue({ k, value }: { k: string; value: unknown }) {
  if (value === null || value === undefined || value === '') return <>—</>;
  if (k.endsWith('_kobo') && typeof value === 'number') {
    return <>{formatKobo(value)}</>;
  }
  if (k === 'destination_account_last4') return <>•••• {String(value)}</>;
  if (k === 'looked_up_at' && typeof value === 'string') {
    return <>{formatLagosDateTime(value)}</>;
  }
  if (k === 'provider' && typeof value === 'string') {
    return <>{PROVIDER_LABEL[value] ?? humanise(value)}</>;
  }
  if (k === 'company_type' && typeof value === 'string') {
    return <>{COMPANY_TYPE_LABEL[value] ?? value}</>;
  }
  if (k === 'reversal_transaction_id' && typeof value === 'string') {
    return (
      <Link href={transactionHref(value)} className='underline'>
        {value.slice(0, 8)}…
      </Link>
    );
  }
  if (k === 'applied_fields' && Array.isArray(value) && !value.length) {
    return <>None — store details kept</>;
  }
  if (Array.isArray(value)) {
    return <>{value.map((v) => humanise(String(v))).join(', ') || '—'}</>;
  }
  if (typeof value === 'boolean') return <>{value ? 'Yes' : 'No'}</>;
  if (typeof value === 'object') return <>{JSON.stringify(value)}</>;
  return <>{String(value)}</>;
}

// Settings snapshots (platform fee) carried as metadata.before / after
const SNAPSHOT_LABEL: Record<string, string> = {
  standard_rate_bps: 'Standard rate',
  standard_cap_kobo: 'Standard cap',
  promo_rate_bps: 'Promotion rate',
  promo_cap_kobo: 'Promotion cap',
  promo_starts_at: 'Promotion start',
  promo_ends_at: 'Promotion end',
  promo_label: 'Promotion label'
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function snapshotValue(key: string, snap: Record<string, unknown>): string {
  const value = snap[key];
  if (value === null || value === undefined || value === '') {
    // A null cap is "no cap" while its rate is set; a promotion field with
    // no promotion is "none"
    if (key === 'standard_cap_kobo') return 'No cap';
    if (key === 'promo_cap_kobo' && snap.promo_rate_bps != null) {
      return 'No cap';
    }
    return 'None';
  }
  if (key.endsWith('_bps') && typeof value === 'number')
    return formatBps(value);
  if (key.endsWith('_kobo') && typeof value === 'number') {
    return formatKobo(value);
  }
  if (key.endsWith('_at') && typeof value === 'string') {
    return formatLagosDateTime(value);
  }
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

/** "Standard rate: 3% → 2.5%", one line per field that changed */
function SnapshotChanges({
  before,
  after
}: {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}) {
  const keys = Array.from(
    new Set([...Object.keys(before), ...Object.keys(after)])
  )
    .filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]))
    .sort((a, b) => {
      const order = Object.keys(SNAPSHOT_LABEL);
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      return (ia === -1 ? order.length : ia) - (ib === -1 ? order.length : ib);
    });
  if (!keys.length) {
    return <span className='text-muted-foreground text-xs'>No change</span>;
  }
  return (
    <ul className='space-y-0.5 text-xs'>
      {keys.map((k) => (
        <li key={k}>
          <span className='text-muted-foreground'>
            {SNAPSHOT_LABEL[k] ?? humanise(k)}:
          </span>{' '}
          {snapshotValue(k, before)} →{' '}
          <span className='font-medium'>{snapshotValue(k, after)}</span>
        </li>
      ))}
    </ul>
  );
}

/** metadata as label/value lines; known keys first, anything else after */
export function AuditMetadata({
  metadata
}: {
  metadata: Record<string, unknown> | null;
}) {
  const { before, after } = metadata ?? {};
  const snapshot = isRecord(before) && isRecord(after);
  const known = Object.keys(METADATA_LABEL);
  const entries = Object.entries(metadata ?? {})
    .filter(([key]) => !HIDDEN_METADATA.has(key))
    .filter(([key]) => !snapshot || (key !== 'before' && key !== 'after'))
    .sort(([a], [b]) => {
      const ia = known.indexOf(a);
      const ib = known.indexOf(b);
      return (ia === -1 ? known.length : ia) - (ib === -1 ? known.length : ib);
    });
  if (!entries.length && !snapshot) {
    return <span className='text-muted-foreground'>—</span>;
  }
  const list = entries.length ? (
    <dl className='grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs'>
      {entries.map(([key, value]) => (
        <div key={key} className='contents'>
          <dt className='text-muted-foreground whitespace-nowrap'>
            {METADATA_LABEL[key] ?? humanise(key)}
          </dt>
          <dd className='break-all'>
            <MetadataValue k={key} value={value} />
          </dd>
        </div>
      ))}
    </dl>
  ) : null;
  return snapshot ? (
    <div className='space-y-1'>
      <SnapshotChanges before={before} after={after} />
      {list}
    </div>
  ) : (
    list
  );
}

const isTier = (value: unknown): value is VendorTier =>
  value === 0 || value === 1 || value === 2;

/** "Tier 1 → Tier 2" for vendor entries that carry tiers; otherwise — */
export function TierChange({ entry }: { entry: AuditEntry }) {
  const from = entry.metadata?.from_tier;
  const to = entry.metadata?.to_tier;
  if (entry.category !== 'vendor' || !isTier(from) || !isTier(to)) {
    return <span className='text-muted-foreground'>—</span>;
  }
  if (from === to) {
    return (
      <span className='text-muted-foreground whitespace-nowrap'>
        No change · {TIER_LABEL[to]}
      </span>
    );
  }
  return (
    <span
      className={`font-medium whitespace-nowrap ${to < from ? 'text-destructive' : ''}`}
    >
      {TIER_LABEL[from]} → {TIER_LABEL[to]}
    </span>
  );
}

/** Admin name, or System / Vendor / Customer */
export function AuditActor({ entry }: { entry: AuditEntry }) {
  if (entry.actor_type !== 'admin') {
    return <span>{ACTOR_LABEL[entry.actor_type] ?? entry.actor_type}</span>;
  }
  return (
    <div className='flex flex-col'>
      <span>{entry.actor_name ?? 'Admin'}</span>
      {entry.actor_name ? (
        <span className='text-muted-foreground text-xs'>Admin</span>
      ) : (
        entry.actor_id && (
          <span
            className='text-muted-foreground font-mono text-xs'
            title={entry.actor_id}
          >
            {entry.actor_id.slice(0, 8)}…
          </span>
        )
      )}
    </div>
  );
}

/** Where the subject is handled in this app, if it has a page */
export function subjectHref(entry: AuditEntry): string | null {
  const id = entry.subject_id;
  switch (entry.subject_type) {
    case 'vendor':
      return id ? `/dashboard/vendors/${id}` : null;
    case 'order':
      // Order pages are keyed by order number
      return orderHref(entry);
    case 'payout':
      return id ? `/dashboard/payout/${id}` : null;
    case 'ledger_transaction':
      return id ? transactionHref(id) : null;
    case 'settlement_sync_issue':
      return '/dashboard/ledger/review-items';
    case 'platform_fee_settings':
      return '/dashboard/settings/platform-fees';
    case 'delivery_review':
      // The order page shows its reviews and the delivery actions; the
      // queue is the fallback
      return orderHref(entry) ?? '/dashboard/delivery-reviews';
    default:
      // Applications and products have no admin detail page yet
      return null;
  }
}

const vendorName = (entry: AuditEntry) =>
  entry.vendor
    ? entry.vendor.trading_name ||
      entry.vendor.business_name ||
      'Unnamed vendor'
    : null;

/**
 * Audit log columns. The vendor History tab passes showVendor: false (every
 * row is the same vendor).
 */
export function auditColumns(opts?: {
  showVendor?: boolean;
  /** Column ids to leave out, e.g. ['tier', 'what'] */
  omit?: string[];
}): ColumnDef<AuditEntry>[] {
  const showVendor = opts?.showVendor ?? true;
  const omit = new Set(opts?.omit ?? []);
  const columns: ColumnDef<AuditEntry>[] = [
    {
      id: 'created_at',
      header: 'WHEN',
      cell: ({ row }) => (
        <span className='text-sm whitespace-nowrap'>
          {formatLagosDateTime(row.original.created_at)}
        </span>
      )
    },
    {
      id: 'event',
      header: 'EVENT',
      cell: ({ row }) => (
        <div className='flex flex-col gap-1'>
          <Badge variant='outline' className='w-fit'>
            {CATEGORY_LABEL[row.original.category] ??
              humanise(row.original.category)}
          </Badge>
          <span className='font-medium'>{eventLabel(row.original.event)}</span>
        </div>
      )
    },
    {
      id: 'what',
      header: 'WHAT',
      cell: ({ row }) => {
        const label = row.original.subject_label;
        if (!label) return <span className='text-muted-foreground'>—</span>;
        const href = subjectHref(row.original);
        return href ? (
          <Link href={href} className='hover:underline'>
            {label}
          </Link>
        ) : (
          <span>{label}</span>
        );
      }
    },
    ...(showVendor
      ? [
          {
            id: 'vendor',
            header: 'VENDOR',
            cell: ({ row }) => {
              const name = vendorName(row.original);
              return row.original.vendor && name ? (
                <Link
                  href={`/dashboard/vendors/${row.original.vendor.id}?tab=history`}
                  className='hover:underline'
                >
                  {name}
                </Link>
              ) : (
                <span className='text-muted-foreground'>—</span>
              );
            }
          } satisfies ColumnDef<AuditEntry>
        ]
      : []),
    {
      id: 'tier',
      header: 'TIER',
      cell: ({ row }) => <TierChange entry={row.original} />
    },
    {
      id: 'actor',
      header: 'BY',
      cell: ({ row }) => <AuditActor entry={row.original} />
    },
    {
      id: 'reason',
      header: 'REASON',
      cell: ({ row }) =>
        row.original.reason ? (
          // Verbatim, line breaks kept
          <p className='block max-w-md text-sm whitespace-pre-wrap'>
            {row.original.reason}
          </p>
        ) : (
          <span className='text-muted-foreground'>—</span>
        )
    },
    {
      id: 'details',
      header: 'DETAILS',
      cell: ({ row }) => <AuditMetadata metadata={row.original.metadata} />
    }
  ];
  return columns.filter((c) => !c.id || !omit.has(c.id));
}
