'use client';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { queryKeys } from '@/lib/query-keys';
import { formatBps, formatKobo, formatLagosDateTime } from '@/lib/format';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  describeRate,
  formatCountdown,
  PlatformFeeSettings,
  SOURCE_LABEL
} from '../types/platform-fee.types';

/** Re-renders every 30 seconds so the countdown stays current */
function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function NowChargingCard({
  settings
}: {
  settings: PlatformFeeSettings;
}) {
  const queryClient = useQueryClient();
  const now = useNow();
  const { effective_now: effective, promotion } = settings;
  const running = effective.source === 'promotion' && promotion;
  const scheduled = promotion?.status === 'scheduled' ? promotion : null;

  // When the promotion starts or ends, what's charged changes on the server:
  // refetch rather than show a stale rate
  const boundary = running
    ? Date.parse(promotion.ends_at)
    : scheduled
      ? Date.parse(scheduled.starts_at)
      : null;
  const passed = boundary !== null && now >= boundary;
  useEffect(() => {
    if (passed) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.platformFee.all()
      });
    }
  }, [passed, queryClient]);

  return (
    <Card className='from-primary/5 to-card bg-gradient-to-t shadow-xs'>
      <CardHeader>
        <CardDescription>Now charging</CardDescription>
        <CardTitle className='flex flex-wrap items-baseline gap-x-3 gap-y-1 text-3xl font-semibold tabular-nums'>
          {formatBps(effective.rate_bps)}
          <span className='text-muted-foreground text-base font-normal'>
            {effective.cap_kobo === null
              ? 'No cap'
              : `max ${formatKobo(effective.cap_kobo)} per order`}
          </span>
          <Badge variant={running ? 'default' : 'secondary'}>
            {SOURCE_LABEL[effective.source]}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className='text-muted-foreground space-y-1 text-sm'>
        {running ? (
          <>
            <p>
              {promotion.label ? `${promotion.label}: ` : ''}until{' '}
              <span className='text-foreground font-medium'>
                {formatLagosDateTime(promotion.ends_at)}
              </span>{' '}
              (Lagos),{' '}
              {passed ? 'ending now' : `in ${formatCountdown(boundary! - now)}`}
              .
            </p>
            <p>Then {describeRate(settings.standard)} (standard).</p>
          </>
        ) : scheduled ? (
          <p>
            A promotion at {describeRate(scheduled)} starts{' '}
            {formatLagosDateTime(scheduled.starts_at)} (Lagos),{' '}
            {passed ? 'now' : `in ${formatCountdown(boundary! - now)}`}.
          </p>
        ) : (
          <p>No promotion running.</p>
        )}
        <p className='text-xs'>
          On a sale’s base price, fixed when the order is paid.
          {settings.updated_at &&
            ` Last changed ${formatLagosDateTime(settings.updated_at)}.`}
        </p>
      </CardContent>
    </Card>
  );
}
