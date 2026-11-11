'use client';

import { useState } from 'react';
import { IconCopy, IconDownload } from '@tabler/icons-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { recoveryCodesText } from '../utils/mfa-errors';

/**
 * The 10 recovery codes, shown once (after setup and after making new ones).
 * They live only in this component's props: never stored or logged.
 */
export function RecoveryCodesPanel({
  codes,
  account,
  onContinue,
  continueLabel = 'Continue'
}: {
  codes: string[];
  /** For the downloaded file */
  account?: string;
  onContinue: () => void;
  continueLabel?: string;
}) {
  const [saved, setSaved] = useState(false);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      toast.success('Recovery codes copied');
    } catch {
      toast.error('Couldn’t copy. Select the codes and copy them instead.');
    }
  }

  function download() {
    const blob = new Blob([recoveryCodesText(codes, account)], {
      type: 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'swappr-admin-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className='w-full space-y-5'>
      <p className='text-muted-foreground text-sm'>
        If you lose your phone, each of these codes lets you sign in once. Keep
        them somewhere safe, like a password manager.{' '}
        <strong className='text-foreground'>
          This is the only time they&apos;re shown.
        </strong>
      </p>

      <ul className='bg-muted grid grid-cols-2 gap-x-6 gap-y-2 rounded-md p-4 font-mono text-sm'>
        {codes.map((code) => (
          <li key={code} className='select-all'>
            {code}
          </li>
        ))}
      </ul>

      <div className='flex flex-wrap gap-2'>
        <Button type='button' variant='outline' size='sm' onClick={copyAll}>
          <IconCopy className='mr-1 h-4 w-4' />
          Copy all
        </Button>
        <Button type='button' variant='outline' size='sm' onClick={download}>
          <IconDownload className='mr-1 h-4 w-4' />
          Download .txt
        </Button>
      </div>

      <div className='flex items-center gap-2'>
        <Checkbox
          id='recovery-codes-saved'
          checked={saved}
          onCheckedChange={(v) => setSaved(v === true)}
        />
        <Label htmlFor='recovery-codes-saved' className='font-normal'>
          I&apos;ve saved these somewhere safe
        </Label>
      </div>

      <Button
        type='button'
        className='w-full'
        disabled={!saved}
        onClick={onContinue}
      >
        {continueLabel}
      </Button>
    </div>
  );
}
