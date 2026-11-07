// GET/PATCH/PUT/DELETE /admin/settings/platform-fee*. Superadmin only (403 for
// everyone else). Contract: swappr-backend plan/vendor-tiers/
// FRONTEND_HANDOFF.md, "Platform fee settings". Rates are basis points
// (300 = 3%); money is whole kobo. The fee is fixed on an order when it's
// paid, so a change reaches only orders paid afterwards.

import { formatBps, formatKobo } from '@/lib/format';

export type FeeSource = 'standard' | 'promotion';
export type PromotionStatus = 'scheduled' | 'running' | 'ended';

export interface FeeRate {
  rate_bps: number;
  /** Most the fee can be on one order; null = no cap */
  cap_kobo: number | null;
}

export interface FeePromotion extends FeeRate {
  starts_at: string;
  /** Orders paid from then on go back to the standard rate */
  ends_at: string;
  label: string | null;
  status: PromotionStatus;
}

export interface PlatformFeeSettings {
  standard: FeeRate;
  promotion: FeePromotion | null;
  effective_now: FeeRate & { source: FeeSource };
  /** Send back with every write; stale = 409 SETTINGS_CHANGED */
  version: number;
  updated_at: string | null;
  /** User id of the last superadmin to change it */
  updated_by: string | null;
}

export interface FeeSplit extends FeeRate {
  platform_fee_kobo: number;
  vendor_share_kobo: number;
}

export interface FeePreview {
  amount_kobo: number;
  now: FeeSplit & { source: FeeSource };
  standard: FeeSplit;
  promotion: FeeSplit | null;
}

interface Change {
  reason: string;
  version: number;
}

export interface UpdateStandardBody extends Change {
  rate_bps: number;
  /** null = no cap */
  cap_kobo: number | null;
}

export interface SetPromotionBody extends Change {
  rate_bps: number;
  cap_kobo: number | null;
  /** Left out = now (or, for a running promotion, its current start) */
  starts_at?: string;
  ends_at: string;
  label?: string;
}

export type EndPromotionBody = Change;

export const MAX_RATE_BPS = 1000; // 10%
export const LABEL_MAX = 60;
export const REASON_MAX = 500;

/** "1.5% · max ₦10,000 per order" or "3% · no cap" */
export const describeRate = (rate: FeeRate) =>
  `${formatBps(rate.rate_bps)} · ${
    rate.cap_kobo === null
      ? 'no cap'
      : `max ${formatKobo(rate.cap_kobo)} per order`
  }`;

/**
 * "1.5" → 150. Whole basis points only (at most 2 decimals), 0–10%.
 * null when it isn't a valid rate.
 */
export function percentToBps(value: string): number | null {
  const v = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return null;
  const bps = Math.round(Number(v) * 100);
  return bps >= 0 && bps <= MAX_RATE_BPS ? bps : null;
}

export const bpsToPercentInput = (bps: number) => String(bps / 100);

/** "10,000" or "10000.50" → kobo; '' → null (no cap); undefined if invalid */
export function nairaToKobo(value: string): number | null | undefined {
  const v = value.replace(/,/g, '').trim();
  if (!v) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return undefined;
  return Math.round(Number(v) * 100);
}

export const koboToNairaInput = (kobo: number | null) =>
  kobo === null ? '' : String(kobo / 100);

// Lagos is UTC+1 all year (no DST), so a datetime-local value is read and
// written as +01:00 whatever the browser's own timezone
const LAGOS_OFFSET_MS = 60 * 60 * 1000;

/** ISO → "YYYY-MM-DDTHH:mm" in Lagos time, for a datetime-local input */
export const toLagosInput = (iso: string) =>
  new Date(Date.parse(iso) + LAGOS_OFFSET_MS).toISOString().slice(0, 16);

/** "YYYY-MM-DDTHH:mm" (Lagos) → ISO UTC; null if it isn't a date-time */
export function fromLagosInput(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const ms = Date.parse(`${value}:00.000+01:00`);
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

export const nowLagosInput = () => toLagosInput(new Date().toISOString());

export const SOURCE_LABEL: Record<FeeSource, string> = {
  standard: 'Standard rate',
  promotion: 'Promotion'
};

export const PROMOTION_STATUS_LABEL: Record<PromotionStatus, string> = {
  scheduled: 'Scheduled',
  running: 'Running',
  ended: 'Ended'
};

/** "2 days 4 hours" / "3 hours 12 minutes" / "under a minute" */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return 'now';
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return 'under a minute';
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  const part = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;
  if (days > 0)
    return hours
      ? `${part(days, 'day')} ${part(hours, 'hour')}`
      : part(days, 'day');
  if (hours > 0)
    return mins
      ? `${part(hours, 'hour')} ${part(mins, 'minute')}`
      : part(hours, 'hour');
  return part(mins, 'minute');
}
