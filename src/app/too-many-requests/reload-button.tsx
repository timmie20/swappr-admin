'use client';

import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// The address bar still shows the page the admin asked for, so a reload
// retries it. Only on a click: retrying on our own extends the limit.
export function ReloadButton() {
  return (
    <Button
      variant='outline'
      size='sm'
      onClick={() => window.location.reload()}
      className='gap-2'
    >
      <RotateCcw className='h-4 w-4' />
      Try again
    </Button>
  );
}
