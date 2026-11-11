export function formatDate(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {}
) {
  if (!date) return '';

  try {
    return new Intl.DateTimeFormat('en-US', {
      month: opts.month ?? 'long',
      day: opts.day ?? 'numeric',
      year: opts.year ?? 'numeric',
      ...opts
    }).format(new Date(date));
  } catch (_err) {
    return '';
  }
}

/**
 * Format storage capacity to human-readable format
 * @param capacity - Storage capacity in GB (number or string)
 * @returns Formatted string (e.g., "64GB", "1TB", "2TB")
 */
export function formatStorageCapacity(
  capacity: number | string | undefined
): string {
  if (!capacity) return '';

  const numericCapacity =
    typeof capacity === 'string' ? parseFloat(capacity) : capacity;

  if (isNaN(numericCapacity)) return '';

  // Convert to TB if >= 1000 GB
  if (numericCapacity >= 1000) {
    const tb = numericCapacity / 1024;
    // Format to 1 decimal place if not a whole number
    const formatted = tb % 1 === 0 ? tb.toFixed(0) : tb.toFixed(1);
    return `${formatted}TB`;
  }

  // Otherwise show in GB
  return `${numericCapacity}GB`;
}

export function formatNaira(amount: number | string | undefined): string {
  if (amount === undefined || amount === null) return '₦0.00';

  const numericAmount =
    typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numericAmount)) return '₦0.00';

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericAmount);
}

/** Ledger amounts are whole kobo integers; display them as naira. */
export function formatKobo(kobo: number | string | null | undefined): string {
  if (kobo === undefined || kobo === null) return '—';
  const numeric = Number(kobo);
  if (isNaN(numeric)) return '—';
  return formatNaira(numeric / 100);
}

const LAGOS_TIME_ZONE = 'Africa/Lagos';

/** ISO 8601 UTC timestamp → date and time in Nigeria time. */
export function formatLagosDateTime(
  timestamp: string | Date | null | undefined
): string {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-NG', {
    timeZone: LAGOS_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/** ISO 8601 UTC timestamp → the date in Nigeria time, e.g. "11 Nov 2026". */
export function formatLagosDate(
  timestamp: string | Date | null | undefined
): string {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-NG', {
    timeZone: LAGOS_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

/** ISO 8601 UTC timestamp → today's date in Nigeria time, as YYYY-MM-DD. */
export function lagosDateKey(timestamp: string | Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: LAGOS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(timestamp));
}

/**
 * A calendar date string ("YYYY-MM-DD", e.g. fulfillment.estimated_arrival).
 * Built from its parts in UTC — `new Date('2026-11-03')` would show as the
 * previous day in timezones west of UTC.
 */
export function formatCalendarDate(value: string | null | undefined): string {
  if (!value) return '—';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const [, y, m, d] = match;
  return new Intl.DateTimeFormat('en-NG', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(Date.UTC(Number(y), Number(m) - 1, Number(d))));
}

export const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/** Basis points → percent: 300 → "3%", 150 → "1.5%" */
export function formatBps(bps: number): string {
  return `${(bps / 100).toLocaleString('en-NG', { maximumFractionDigits: 2 })}%`;
}

/**
 * The platform fee rate an order was charged. null = paid before the rate
 * was recorded on the order; those orders were all charged 3%. Only for rows
 * tied to an order: old swap payouts have no order, so null means nothing
 * there; show the amount without a rate.
 */
export function formatFeeRate(bps: number | null | undefined): string {
  return formatBps(bps ?? 300);
}
