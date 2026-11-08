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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AMBER_BADGE } from '@/features/admin-vendors/components/vendor-badges';
import { formatBps, formatKobo, formatLagosDateTime } from '@/lib/format';
import { useState } from 'react';
import { useEndPromotion, useSetPromotion } from '../hooks/use-platform-fee';
import {
  bpsToPercentInput,
  describeRate,
  FeePromotion,
  formatCountdown,
  fromLagosInput,
  koboToNairaInput,
  LABEL_MAX,
  nowLagosInput,
  PlatformFeeSettings,
  PROMOTION_STATUS_LABEL,
  toLagosInput
} from '../types/platform-fee.types';
import { FeeChangeDialog } from './fee-change-dialog';
import { parseRateInput, RateFields, RateInput } from './rate-fields';

type Mode = 'start' | 'change' | 'end';

interface PromotionInput extends RateInput {
  /** datetime-local, Lagos; '' = start now */
  start: string;
  end: string;
  label: string;
}

const EMPTY: PromotionInput = {
  rate: '',
  cap: '',
  start: '',
  end: '',
  label: ''
};

function StatusBadge({ status }: { status: FeePromotion['status'] }) {
  if (status === 'running') return <Badge>Running</Badge>;
  if (status === 'scheduled') {
    return (
      <Badge variant='outline' className={AMBER_BADGE}>
        Scheduled
      </Badge>
    );
  }
  return <Badge variant='outline'>{PROMOTION_STATUS_LABEL[status]}</Badge>;
}

/** Errors in the date fields, checked against the clock when shown */
function dateProblem(
  input: PromotionInput,
  keepsStart: boolean
): string | null {
  const end = fromLagosInput(input.end);
  if (!end) return input.end ? 'Pick a valid end date and time.' : null;
  const now = Date.now();
  if (Date.parse(end) <= now) return 'The end must be in the future.';
  if (!keepsStart && input.start) {
    const start = fromLagosInput(input.start);
    if (!start) return 'Pick a valid start, or leave it empty to start now.';
    if (Date.parse(start) < now - 60_000) {
      return 'The start is in the past. Leave it empty to start now.';
    }
    if (Date.parse(start) >= Date.parse(end)) {
      return 'The promotion must end after it starts.';
    }
  }
  return null;
}

/**
 * The launch promotion: a lower rate (and cap) between two dates. After it
 * ends, orders go back to the standard rate on their own.
 */
export function PromotionCard({ settings }: { settings: PlatformFeeSettings }) {
  const setPromotion = useSetPromotion();
  const endPromotion = useEndPromotion();
  const [mode, setMode] = useState<Mode | null>(null);
  const [openedWith, setOpenedWith] = useState<PlatformFeeSettings | null>(
    null
  );
  const [input, setInput] = useState<PromotionInput>(EMPTY);

  const promotion = settings.promotion;
  const status = promotion?.status;
  const running = status === 'running';
  // A running promotion keeps its start when changed or extended
  const keepsStart = mode === 'change' && running;
  const mutation = mode === 'end' ? endPromotion : setPromotion;

  const open = (next: Mode) => {
    setPromotion.reset();
    endPromotion.reset();
    const p = promotion;
    setInput(
      next === 'end'
        ? EMPTY
        : next === 'change' && p
          ? {
              rate: bpsToPercentInput(p.rate_bps),
              cap: koboToNairaInput(p.cap_kobo),
              start: toLagosInput(p.starts_at),
              end: toLagosInput(p.ends_at),
              label: p.label ?? ''
            }
          : // A new promotion starts from the last one's rate and cap
            {
              ...EMPTY,
              rate: p ? bpsToPercentInput(p.rate_bps) : '',
              cap: p ? koboToNairaInput(p.cap_kobo) : ''
            }
    );
    setOpenedWith(settings);
    setMode(next);
  };
  const close = () => {
    setMode(null);
    setOpenedWith(null);
  };

  const parsed = parseRateInput(input);
  const problem =
    mode && mode !== 'end' ? dateProblem(input, keepsStart) : null;
  const canSubmit =
    mode === 'end' ||
    (!!parsed &&
      !!fromLagosInput(input.end) &&
      !problem &&
      input.label.length <= LABEL_MAX);

  const submit = (reason: string) => {
    if (!openedWith || !mode) return;
    const version = openedWith.version;
    if (mode === 'end') {
      endPromotion.mutate({ reason, version }, { onSuccess: close });
      return;
    }
    if (!parsed) return;
    const ends_at = fromLagosInput(input.end);
    if (!ends_at) return;
    const starts_at =
      !keepsStart && input.start ? fromLagosInput(input.start) : null;
    setPromotion.mutate(
      {
        ...parsed,
        ends_at,
        ...(starts_at ? { starts_at } : {}),
        ...(input.label.trim() ? { label: input.label.trim() } : {}),
        reason,
        version
      },
      { onSuccess: close }
    );
  };

  const titles: Record<Mode, string> = {
    start: 'Start a promotion?',
    change: running
      ? 'Extend or change the promotion?'
      : 'Change the scheduled promotion?',
    end: running ? 'End the promotion now?' : 'Cancel the scheduled promotion?'
  };
  const descriptions: Record<Mode, string> = {
    start: `Orders paid while it runs are charged the promotion rate instead of the standard ${describeRate(settings.standard)}.`,
    change: running
      ? `It keeps its start (${promotion ? formatLagosDateTime(promotion.starts_at) : ''}). Orders paid after the change get the new rate.`
      : 'Nothing has been charged at this rate yet.',
    end: running
      ? `Orders paid from now on go back to the standard ${describeRate(settings.standard)}.`
      : 'It won’t start. Orders keep paying the standard rate.'
  };

  const ending = promotion && status !== 'ended' ? promotion.ends_at : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          Promotion {promotion && <StatusBadge status={promotion.status} />}
        </CardTitle>
        <CardDescription>
          A lower rate for a set period. Orders go back to the standard rate
          automatically when it ends.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {promotion ? (
          <div className='grid grid-cols-2 gap-4'>
            <DetailRow label='Rate' value={formatBps(promotion.rate_bps)} />
            <DetailRow
              label='Cap per order'
              value={
                promotion.cap_kobo === null
                  ? 'No cap'
                  : formatKobo(promotion.cap_kobo)
              }
            />
            <DetailRow
              label={status === 'scheduled' ? 'Starts' : 'Started'}
              value={formatLagosDateTime(promotion.starts_at)}
            />
            <DetailRow
              label={status === 'ended' ? 'Ended' : 'Ends'}
              value={
                <span className='space-y-0.5'>
                  <span className='block'>
                    {formatLagosDateTime(promotion.ends_at)}
                  </span>
                  {ending && (
                    <span className='block text-xs'>
                      in {formatCountdown(Date.parse(ending) - Date.now())}
                    </span>
                  )}
                </span>
              }
            />
            {promotion.label && (
              <div className='col-span-2'>
                <DetailRow label='Label' value={promotion.label} />
              </div>
            )}
          </div>
        ) : (
          <p className='text-muted-foreground text-sm'>No promotion set.</p>
        )}

        <div className='flex flex-wrap gap-2'>
          {!promotion || status === 'ended' ? (
            <Button size='sm' variant='secondary' onClick={() => open('start')}>
              {promotion ? 'Start a new promotion' : 'Start a promotion'}
            </Button>
          ) : (
            <>
              <Button
                size='sm'
                variant='secondary'
                onClick={() => open('change')}
              >
                {running ? 'Extend or change' : 'Change'}
              </Button>
              <Button
                size='sm'
                variant='outline'
                className='text-destructive'
                onClick={() => open('end')}
              >
                {running ? 'End now' : 'Cancel promotion'}
              </Button>
            </>
          )}
        </div>
      </CardContent>

      <FeeChangeDialog
        isOpen={!!mode}
        onClose={close}
        title={mode ? titles[mode] : ''}
        description={mode ? descriptions[mode] : ''}
        confirmLabel={
          mode === 'end'
            ? running
              ? 'End promotion'
              : 'Cancel promotion'
            : 'Save promotion'
        }
        destructive={mode === 'end'}
        canSubmit={canSubmit}
        pending={mutation.isPending}
        error={mutation.error}
        openedWith={openedWith}
        current={settings}
        onSubmit={submit}
      >
        {mode && mode !== 'end' && (
          <div className='space-y-4'>
            <RateFields
              idPrefix='promotion'
              value={input}
              onChange={(v) => setInput({ ...input, ...v })}
              disabled={mutation.isPending}
            />
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='promotion-start'>Starts (Lagos time)</Label>
                {keepsStart && promotion ? (
                  <p className='text-muted-foreground pt-2 text-sm'>
                    {formatLagosDateTime(promotion.starts_at)} (kept)
                  </p>
                ) : (
                  <>
                    <Input
                      id='promotion-start'
                      type='datetime-local'
                      value={input.start}
                      min={nowLagosInput()}
                      onChange={(e) =>
                        setInput({ ...input, start: e.target.value })
                      }
                      disabled={mutation.isPending}
                    />
                    <p className='text-muted-foreground text-xs'>
                      Leave empty to start now.
                    </p>
                  </>
                )}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='promotion-end'>Ends (Lagos time)</Label>
                <Input
                  id='promotion-end'
                  type='datetime-local'
                  value={input.end}
                  min={nowLagosInput()}
                  onChange={(e) => setInput({ ...input, end: e.target.value })}
                  disabled={mutation.isPending}
                />
                <p className='text-muted-foreground text-xs'>
                  Orders paid from then on pay the standard rate.
                </p>
              </div>
            </div>
            {problem && <p className='text-destructive text-xs'>{problem}</p>}
            <div className='space-y-2'>
              <Label htmlFor='promotion-label'>Label (optional)</Label>
              <Input
                id='promotion-label'
                value={input.label}
                maxLength={LABEL_MAX}
                placeholder='e.g. Launch promotion'
                onChange={(e) => setInput({ ...input, label: e.target.value })}
                disabled={mutation.isPending}
              />
            </div>
          </div>
        )}
      </FeeChangeDialog>
    </Card>
  );
}
