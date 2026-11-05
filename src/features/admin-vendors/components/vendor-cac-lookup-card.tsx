'use client';

import { DetailRow } from '@/components/detail-row';
import { SectionError } from '@/components/section-error';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  COMPANY_TYPE_LABEL,
  PROVIDER_LABEL
} from '@/features/admin-audit/components/audit-columns';
import { useAuditLog } from '@/features/admin-audit/hooks/use-audit';
import { AuditEntry, humanise } from '@/features/admin-audit/types/audit.types';
import { formatCalendarDate, formatLagosDateTime } from '@/lib/format';
import { CacStatus } from '../types/vendor.types';
import { AMBER_BADGE } from './vendor-badges';

const LOOKUP = 'business_lookup_matched';
const CONFIRMED = 'business_verified';
const DECLINED = 'business_confirmation_declined';
const OVERRIDE = 'business_override';

/** The normalised Prembly answer stored on business_lookup_matched */
interface CacLookupResponse {
  verified?: boolean | string;
  reference?: string | null;
  verification_id?: string | null;
  provider_message?: string | null;
  rc_number?: string | null;
  company_name?: string | null;
  company_type?: string | null;
  company_status?: string | null;
  email_address?: string | null;
  state?: string | null;
  city?: string | null;
  lga?: string | null;
  company_address?: string | null;
  branch_address?: string | null;
  registration_date?: string | null;
}

type Outcome =
  | { kind: 'confirmed'; entry: AuditEntry }
  | { kind: 'declined'; entry: AuditEntry }
  | { kind: 'override'; entry: AuditEntry }
  | { kind: 'waiting' }
  | { kind: 'unanswered' };

const str = (value: unknown): string | null =>
  typeof value === 'string' && value ? value : null;

const reference = (entry: AuditEntry) => str(entry.metadata?.reference);

/**
 * What happened to a lookup: the first confirm, decline or admin override
 * after it and before the next lookup (only one can wait at a time). Where
 * both carry a Prembly reference they must match.
 */
function outcomeOf(
  lookup: AuditEntry,
  newerLookup: AuditEntry | undefined,
  answers: AuditEntry[],
  isLatest: boolean,
  cacStatus: CacStatus | undefined
): Outcome {
  const ref = reference(lookup);
  const answer = answers
    .filter(
      (a) =>
        a.created_at >= lookup.created_at &&
        (!newerLookup || a.created_at <= newerLookup.created_at)
    )
    // answers come newest first; the earliest one decided it
    .reverse()
    .find((a) => {
      if (a.event === OVERRIDE) return true;
      const answerRef = reference(a);
      if (a.event === CONFIRMED && a.metadata?.confirmed_by_vendor !== true) {
        return false;
      }
      return !ref || !answerRef || ref === answerRef;
    });
  if (answer?.event === CONFIRMED) return { kind: 'confirmed', entry: answer };
  if (answer?.event === DECLINED) return { kind: 'declined', entry: answer };
  if (answer?.event === OVERRIDE) return { kind: 'override', entry: answer };
  return isLatest && cacStatus === 'awaiting_confirmation'
    ? { kind: 'waiting' }
    : { kind: 'unanswered' };
}

function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  switch (outcome.kind) {
    case 'confirmed':
      return <Badge>Confirmed by vendor</Badge>;
    case 'declined':
      return <Badge variant='destructive'>Declined by vendor</Badge>;
    case 'override':
      return <Badge variant='secondary'>Replaced by admin override</Badge>;
    case 'waiting':
      return (
        <Badge variant='outline' className={AMBER_BADGE}>
          Awaiting vendor confirmation
        </Badge>
      );
    default:
      return <Badge variant='outline'>No answer recorded</Badge>;
  }
}

const APPLIED_LABEL: Record<string, string> = {
  trading_name: 'Trading name',
  business_address: 'Business address',
  state: 'State',
  city: 'City'
};

function OutcomeLine({ outcome }: { outcome: Outcome }) {
  if (outcome.kind === 'waiting' || outcome.kind === 'unanswered') return null;
  const { entry } = outcome;
  const applied = entry.metadata?.applied_fields;
  return (
    <div className='text-muted-foreground space-y-0.5 text-xs'>
      <p>
        {outcome.kind === 'confirmed'
          ? 'Confirmed'
          : outcome.kind === 'declined'
            ? 'Declined — nothing on their account changed'
            : `Overridden${entry.actor_name ? ` by ${entry.actor_name}` : ''}`}{' '}
        · {formatLagosDateTime(entry.created_at)}
      </p>
      {outcome.kind === 'confirmed' && Array.isArray(applied) && (
        <p>
          Store details taken from CAC:{' '}
          {applied.length
            ? applied
                .map((f) => APPLIED_LABEL[String(f)] ?? humanise(String(f)))
                .join(', ')
            : 'none (kept their own)'}
        </p>
      )}
    </div>
  );
}

function LookupDetails({
  lookup,
  outcome
}: {
  lookup: AuditEntry;
  outcome: Outcome;
}) {
  const meta = lookup.metadata ?? {};
  const r = (meta.response ?? {}) as CacLookupResponse;
  const companyType = r.company_type ?? str(meta.company_type);
  const provider = str(meta.provider);
  const ref = r.reference ?? reference(lookup);
  const registered = r.registration_date
    ? /^\d{4}-\d{2}-\d{2}/.test(r.registration_date)
      ? formatCalendarDate(r.registration_date)
      : r.registration_date
    : null;

  return (
    <div className='space-y-4'>
      <div className='space-y-1.5'>
        <div className='flex flex-wrap items-center gap-2'>
          <OutcomeBadge outcome={outcome} />
          <span className='text-muted-foreground text-xs'>
            Looked up {formatLagosDateTime(lookup.created_at)}
            {provider
              ? ` · ${PROVIDER_LABEL[provider] ?? humanise(provider)}`
              : ''}
          </span>
        </div>
        <OutcomeLine outcome={outcome} />
      </div>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <DetailRow
          label='Registered name'
          value={r.company_name ?? str(meta.company_name)}
        />
        <DetailRow
          label='CAC number'
          value={r.rc_number ?? str(meta.rc_number)}
          mono
        />
        <DetailRow
          label='Company type'
          value={
            companyType
              ? (COMPANY_TYPE_LABEL[companyType] ?? companyType)
              : null
          }
        />
        <DetailRow label='Company status' value={r.company_status} />
        <DetailRow label='Registered' value={registered} />
        <DetailRow label='Email on record' value={r.email_address} />
        <div className='sm:col-span-2'>
          <DetailRow label='Company address' value={r.company_address} />
        </div>
        {r.branch_address && (
          <div className='sm:col-span-2'>
            <DetailRow label='Branch address' value={r.branch_address} />
          </div>
        )}
        <DetailRow
          label='City · LGA · State'
          value={[r.city, r.lga, r.state].filter(Boolean).join(' · ')}
        />
        <DetailRow label='Registry message' value={r.provider_message} />
        <DetailRow label='Reference' value={ref} mono />
        <DetailRow
          label='Verification ID'
          value={r.verification_id ?? str(meta.verification_id)}
          mono
        />
      </div>
    </div>
  );
}

/**
 * The registry's answer to each CAC lookup that matched, newest first, and
 * what the vendor did with it. Lookups from before confirm-first (and admin
 * overrides) have no record here.
 */
export function VendorCacLookupCard({
  vendorId,
  cacStatus
}: {
  vendorId: string;
  cacStatus: CacStatus | undefined;
}) {
  const query = useAuditLog({
    vendor_id: vendorId,
    category: 'vendor',
    event: [LOOKUP, CONFIRMED, DECLINED, OVERRIDE].join(','),
    limit: 100
  });

  const entries = query.data?.data ?? [];
  const lookups = entries.filter((e) => e.event === LOOKUP);
  const answers = entries.filter((e) => e.event !== LOOKUP);
  const [latest, ...older] = lookups;
  const outcome = (lookup: AuditEntry, index: number) =>
    outcomeOf(lookup, lookups[index - 1], answers, index === 0, cacStatus);

  return (
    <Card>
      <CardHeader>
        <CardTitle>CAC lookup</CardTitle>
        <CardDescription>
          What the business registry returned. Director names are never stored.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {query.error ? (
          <SectionError
            error={query.error}
            onRetry={() => void query.refetch()}
            retrying={query.isFetching}
            what='the CAC lookup'
          />
        ) : !query.data ? (
          <div className='space-y-2'>
            <Skeleton className='h-5 w-48' />
            <Skeleton className='h-24 w-full' />
          </div>
        ) : !latest ? (
          <p className='text-muted-foreground text-sm'>No lookup on record</p>
        ) : (
          <>
            <LookupDetails lookup={latest} outcome={outcome(latest, 0)} />
            {older.length > 0 && (
              <div className='space-y-2 border-t pt-4'>
                <p className='text-sm font-medium'>
                  Earlier lookups ({older.length})
                </p>
                {older.map((lookup, i) => (
                  <details key={lookup.id} className='rounded-md border p-3'>
                    <summary className='cursor-pointer text-sm'>
                      {formatLagosDateTime(lookup.created_at)} ·{' '}
                      {str(lookup.metadata?.company_name) ??
                        str(lookup.metadata?.rc_number) ??
                        'Lookup'}
                    </summary>
                    <div className='pt-3'>
                      <LookupDetails
                        lookup={lookup}
                        outcome={outcome(lookup, i + 1)}
                      />
                    </div>
                  </details>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
