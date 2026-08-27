'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Payout, PayoutStatus } from '../../types/payout.types';
import { IconEye, IconDotsVertical, IconRefresh } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useRetryPayout } from '../../hooks/use-retry-payout';

interface CellActionProps {
  data: Payout;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [retryOpen, setRetryOpen] = useState(false);
  const router = useRouter();
  const retryPayout = useRetryPayout();

  const onConfirmRetry = async () => {
    retryPayout.mutate(data.id, {
      onSuccess: () => setRetryOpen(false)
    });
  };

  const canRetry = data.status === PayoutStatus.FAILED;

  return (
    <>
      <AlertModal
        isOpen={retryOpen}
        onClose={() => setRetryOpen(false)}
        onConfirm={onConfirmRetry}
        loading={retryPayout.isPending}
        title='Retry this payout?'
        description='This re-attempts the Paystack transfer to the vendor.'
        confirmLabel='Retry'
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <IconDotsVertical className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => router.push(`/dashboard/payout/${data.id}`)}
          >
            <IconEye className='mr-2 h-4 w-4' /> View
          </DropdownMenuItem>
          {canRetry && (
            <DropdownMenuItem onClick={() => setRetryOpen(true)}>
              <IconRefresh className='mr-2 h-4 w-4' /> Retry
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
