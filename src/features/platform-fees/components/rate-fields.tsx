'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { nairaToKobo, percentToBps } from '../types/platform-fee.types';

export interface RateInput {
  /** Percent as typed, e.g. "1.5" */
  rate: string;
  /** Naira as typed; '' = no cap */
  cap: string;
}

/** Parsed values, or null when a field is invalid */
export function parseRateInput(
  input: RateInput
): { rate_bps: number; cap_kobo: number | null } | null {
  const rate_bps = percentToBps(input.rate);
  const cap_kobo = nairaToKobo(input.cap);
  if (rate_bps === null || cap_kobo === undefined) return null;
  return { rate_bps, cap_kobo };
}

export function RateFields({
  value,
  onChange,
  disabled,
  idPrefix
}: {
  value: RateInput;
  onChange: (value: RateInput) => void;
  disabled?: boolean;
  idPrefix: string;
}) {
  const rateInvalid =
    value.rate.trim() !== '' && percentToBps(value.rate) === null;
  const capInvalid = nairaToKobo(value.cap) === undefined;
  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
      <div className='space-y-2'>
        <Label htmlFor={`${idPrefix}-rate`}>Rate (%)</Label>
        <Input
          id={`${idPrefix}-rate`}
          inputMode='decimal'
          placeholder='e.g. 1.5'
          value={value.rate}
          onChange={(e) => onChange({ ...value, rate: e.target.value })}
          disabled={disabled}
          aria-invalid={rateInvalid}
        />
        <p
          className={`text-xs ${rateInvalid ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          0–10%, up to 2 decimals (e.g. 1.25)
        </p>
      </div>
      <div className='space-y-2'>
        <Label htmlFor={`${idPrefix}-cap`}>Cap per order (₦, optional)</Label>
        <Input
          id={`${idPrefix}-cap`}
          inputMode='decimal'
          placeholder='No cap'
          value={value.cap}
          onChange={(e) => onChange({ ...value, cap: e.target.value })}
          disabled={disabled}
          aria-invalid={capInvalid}
        />
        <p
          className={`text-xs ${capInvalid ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          The most the fee can be on one order. Leave empty for no cap.
        </p>
      </div>
    </div>
  );
}
