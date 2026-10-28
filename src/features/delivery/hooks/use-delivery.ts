import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiError, retryUnlessClientError } from '@/lib/api/errors';
import { queryKeys } from '@/lib/query-keys';
import { deliveryApi } from '../api/delivery.service';
import { QueryDeliveryReviewsParams } from '../types/delivery.types';

/**
 * Hook to fetch the delivery review queue
 */
export function useDeliveryReviews(params: QueryDeliveryReviewsParams) {
  return useQuery({
    queryKey: queryKeys.deliveryReviews.list(params),
    queryFn: () => deliveryApi.getReviews(params),
    retry: retryUnlessClientError,
    staleTime: 30 * 1000
  });
}

function useInvalidateDelivery() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.deliveryReviews.all()
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() });
  };
}

/**
 * Hook to confirm delivery on the customer's behalf
 */
export function useConfirmDeliveryForCustomer() {
  const invalidate = useInvalidateDelivery();

  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      deliveryApi.confirmForCustomer(orderId, reason),
    onSuccess: (data) => {
      invalidate();
      toast.success(`Delivery confirmed for ${data.order_number}`);
    },
    onError: (error) => {
      const { code, message } = getApiError(
        error,
        'Failed to confirm delivery'
      );
      // already_confirmed: someone (the customer or another admin) got there
      // first — refresh so the screen shows the real state
      if (code === 'already_confirmed' || code === 'order_ineligible') {
        invalidate();
      }
      toast.error(message);
    }
  });
}

/**
 * Hook to close a review without confirming delivery
 */
export function useCloseDeliveryReview() {
  const invalidate = useInvalidateDelivery();

  return useMutation({
    mutationFn: ({ reviewId, note }: { reviewId: string; note: string }) =>
      deliveryApi.closeReview(reviewId, note),
    onSuccess: () => {
      invalidate();
      toast.success('Review closed — the order stays shipped');
    },
    onError: (error) => {
      const { code, message } = getApiError(error, 'Failed to close review');
      if (code === 'review_not_open') invalidate();
      toast.error(message);
    }
  });
}

function formatRetryAfter(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours === 1 ? '' : 's'}`;
}

/**
 * Hook to resend the customer's confirmation link
 */
export function useResendDeliveryLink() {
  const invalidate = useInvalidateDelivery();

  return useMutation({
    mutationFn: (orderId: string) => deliveryApi.resendLink(orderId),
    onSuccess: () => {
      toast.success('A new link was emailed to the customer');
    },
    onError: (error) => {
      const { code, message, extra } = getApiError(
        error,
        'Failed to resend the link'
      );
      if (code === 'rate_limited') {
        const retryAfter = Number(extra.retry_after_seconds);
        toast.error(
          Number.isFinite(retryAfter) && retryAfter > 0
            ? `The link has been resent 3 times in the last 24 hours. Try again in ${formatRetryAfter(retryAfter)}.`
            : message
        );
        return;
      }
      if (code === 'order_ineligible') invalidate();
      toast.error(message);
    }
  });
}
