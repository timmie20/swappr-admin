'use client';

import { Button } from '@/components/ui/button';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy — select the text and copy it manually');
    }
  };

  return (
    <Button
      type='button'
      variant='outline'
      size='icon'
      className='h-7 w-7'
      onClick={onCopy}
      aria-label={`Copy ${label}`}
    >
      {copied ? (
        <IconCheck className='h-3.5 w-3.5' />
      ) : (
        <IconCopy className='h-3.5 w-3.5' />
      )}
    </Button>
  );
}
