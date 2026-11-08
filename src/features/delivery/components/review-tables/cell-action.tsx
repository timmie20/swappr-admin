'use client';

import { ReasonModal } from '@/components/modal/reason-modal';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  useCloseDeliveryReview,
  useConfirmDeliveryForCustomer
} from '../../hooks/use-delivery';
import {
  CLOSE_REVIEW_NOTE,
  CONFIRM_DELIVERY_REASON,
  DeliveryReview,
  DeliveryReviewStatus
} from '../../types/delivery.types';

export function ReviewActions({ review }: { review: DeliveryReview }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const confirmDelivery = useConfirmDeliveryForCustomer();
  const closeReview = useCloseDeliveryReview();

  if (review.status !== DeliveryReviewStatus.OPEN || !review.order) {
    return review.resolution_note ? (
      <p className='text-muted-foreground max-w-xs text-xs whitespace-normal'>
        {review.resolution_note}
      </p>
    ) : null;
  }

  const order = review.order;
  const busy = confirmDelivery.isPending || closeReview.isPending;

  return (
    <>
      <ReasonModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={(reason) =>
          confirmDelivery.mutate(
            { orderId: order.id, reason },
            { onSettled: () => setConfirmOpen(false) }
          )
        }
        loading={confirmDelivery.isPending}
        title={`Confirm delivery of ${order.order_number} for the customer?`}
        description='This marks the order delivered, revokes the customer’s link, resolves this review and emails both the customer and the vendor. It unlocks the vendor’s settlement and cannot be undone.'
        label='Reason (stored with your name)'
        placeholder='e.g. Called the customer on 26 Oct — they confirmed they have the phone.'
        minLength={CONFIRM_DELIVERY_REASON.min}
        maxLength={CONFIRM_DELIVERY_REASON.max}
        confirmLabel='Confirm delivery'
        destructive
      />
      <ReasonModal
        isOpen={closeOpen}
        onClose={() => setCloseOpen(false)}
        onConfirm={(note) =>
          closeReview.mutate(
            { reviewId: review.id, note },
            { onSettled: () => setCloseOpen(false) }
          )
        }
        loading={closeReview.isPending}
        title='Close this review without confirming?'
        description='The order stays shipped and the customer can still confirm with their link. The vendor sees that the review was closed.'
        label='Note'
        placeholder='e.g. Courier tracking shows it is still in transit; leaving it for the customer.'
        minLength={CLOSE_REVIEW_NOTE.min}
        maxLength={CLOSE_REVIEW_NOTE.max}
        confirmLabel='Close review'
      />
      <div className='flex flex-col gap-2'>
        <Button size='sm' disabled={busy} onClick={() => setConfirmOpen(true)}>
          Confirm delivery
        </Button>
        <Button
          size='sm'
          variant='outline'
          disabled={busy}
          onClick={() => setCloseOpen(true)}
        >
          Close without confirming
        </Button>
      </div>
    </>
  );
}
