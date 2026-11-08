'use client';

import { DetailRow } from '@/components/detail-row';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { formatBps, formatKobo } from '@/lib/format';
import { useState } from 'react';
import { useUpdateStandardFee } from '../hooks/use-platform-fee';
import {
  bpsToPercentInput,
  describeRate,
  koboToNairaInput,
  PlatformFeeSettings
} from '../types/platform-fee.types';
import { FeeChangeDialog } from './fee-change-dialog';
import { parseRateInput, RateFields, RateInput } from './rate-fields';

export function StandardRateCard({
  settings
}: {
  settings: PlatformFeeSettings;
}) {
  const mutation = useUpdateStandardFee();
  const [openedWith, setOpenedWith] = useState<PlatformFeeSettings | null>(
    null
  );
  const [input, setInput] = useState<RateInput>({ rate: '', cap: '' });
  const { standard } = settings;

  const open = () => {
    mutation.reset();
    setInput({
      rate: bpsToPercentInput(standard.rate_bps),
      cap: koboToNairaInput(standard.cap_kobo)
    });
    setOpenedWith(settings);
  };
  const close = () => setOpenedWith(null);

  const parsed = parseRateInput(input);
  const unchanged =
    !!parsed &&
    parsed.rate_bps === standard.rate_bps &&
    parsed.cap_kobo === standard.cap_kobo;
  const promotionRunning = settings.promotion?.status === 'running';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Standard rate</CardTitle>
        <CardDescription>
          Charged whenever no promotion is running.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-2 gap-4'>
          <DetailRow label='Rate' value={formatBps(standard.rate_bps)} />
          <DetailRow
            label='Cap per order'
            value={
              standard.cap_kobo === null
                ? 'No cap'
                : formatKobo(standard.cap_kobo)
            }
          />
        </div>
        <Button size='sm' variant='secondary' onClick={open}>
          Change standard rate
        </Button>
      </CardContent>

      <FeeChangeDialog
        isOpen={!!openedWith}
        onClose={close}
        title='Change the standard rate?'
        description={`Now ${describeRate(standard)}.${promotionRunning ? ' A promotion is running, so this takes effect when it ends.' : ''}`}
        confirmLabel='Save standard rate'
        canSubmit={!!parsed && !unchanged}
        pending={mutation.isPending}
        error={mutation.error}
        openedWith={openedWith}
        current={settings}
        onSubmit={(reason) => {
          if (!parsed || !openedWith) return;
          mutation.mutate(
            { ...parsed, reason, version: openedWith.version },
            { onSuccess: close }
          );
        }}
      >
        <RateFields
          idPrefix='standard'
          value={input}
          onChange={setInput}
          disabled={mutation.isPending}
        />
      </FeeChangeDialog>
    </Card>
  );
}
