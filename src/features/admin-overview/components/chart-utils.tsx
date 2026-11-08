'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { SERIES_RANGES, SeriesRange } from '../types/overview.types';

const RANGE_LABEL: Record<SeriesRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days'
};

export const rangeLabel = (range: SeriesRange) => RANGE_LABEL[range];

/**
 * Series dates are Lagos calendar dates ("YYYY-MM-DD"). Build them from the
 * string parts in UTC — new Date('2026-10-01') can show the previous day.
 */
export function formatSeriesDate(value: string, withYear = false): string {
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return value;
  return new Intl.DateTimeFormat('en-NG', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {})
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** Short ₦ for chart axes, e.g. ₦12.5K, ₦1.2M (kobo in) */
export function formatKoboCompact(kobo: number): string {
  return `₦${new Intl.NumberFormat('en-NG', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(kobo / 100)}`;
}

export function RangeSelect({
  value,
  onChange
}: {
  value: SeriesRange;
  onChange: (range: SeriesRange) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SeriesRange)}>
      <SelectTrigger size='sm' className='w-[140px]' aria-label='Chart range'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SERIES_RANGES.map((range) => (
          <SelectItem key={range} value={range}>
            {RANGE_LABEL[range]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
