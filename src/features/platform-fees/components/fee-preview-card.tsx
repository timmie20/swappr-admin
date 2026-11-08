'use client';

import { SectionError } from '@/components/section-error';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { formatKobo } from '@/lib/format';
import { useState } from 'react';
import { useFeePreview } from '../hooks/use-platform-fee';
import {
  describeRate,
  FeeSplit,
  nairaToKobo,
  SOURCE_LABEL
} from '../types/platform-fee.types';

function SplitRow({ name, split }: { name: string; split: FeeSplit }) {
  return (
    <TableRow>
      <TableCell>
        <span className='font-medium'>{name}</span>
        <span className='text-muted-foreground block text-xs'>
          {describeRate(split)}
        </span>
      </TableCell>
      <TableCell className='text-right tabular-nums'>
        {formatKobo(split.platform_fee_kobo)}
      </TableCell>
      <TableCell className='text-right tabular-nums'>
        {formatKobo(split.vendor_share_kobo)}
      </TableCell>
    </TableRow>
  );
}

/** What an order of a given base price pays, now and at each rate */
export function FeePreviewCard() {
  const [input, setInput] = useState('500000');
  const [amount, setAmount] = useState<number | null>(50_000_000);
  const apply = useDebouncedCallback((value: string) => {
    const kobo = nairaToKobo(value);
    setAmount(typeof kobo === 'number' && kobo >= 1 ? kobo : null);
  }, 300);
  const query = useFeePreview(amount);
  const invalid = input.trim() !== '' && amount === null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fee preview</CardTitle>
        <CardDescription>
          The fee on an order’s base price, and what the vendor gets.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='max-w-xs space-y-2'>
          <Label htmlFor='preview-amount'>Order base price (₦)</Label>
          <Input
            id='preview-amount'
            inputMode='decimal'
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              apply(e.target.value);
            }}
            aria-invalid={invalid}
          />
          {invalid && (
            <p className='text-destructive text-xs'>
              Enter an amount of at least ₦0.01.
            </p>
          )}
        </div>

        {query.error ? (
          <SectionError
            error={query.error}
            onRetry={() => void query.refetch()}
            retrying={query.isFetching}
            what='the preview'
          />
        ) : query.data && amount !== null ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>On {formatKobo(query.data.amount_kobo)}</TableHead>
                <TableHead className='text-right'>Platform fee</TableHead>
                <TableHead className='text-right'>Vendor gets</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SplitRow
                name={`Now (${SOURCE_LABEL[query.data.now.source].toLowerCase()})`}
                split={query.data.now}
              />
              <SplitRow name='Standard rate' split={query.data.standard} />
              {query.data.promotion && (
                <SplitRow name='Promotion rate' split={query.data.promotion} />
              )}
            </TableBody>
          </Table>
        ) : null}
      </CardContent>
    </Card>
  );
}
