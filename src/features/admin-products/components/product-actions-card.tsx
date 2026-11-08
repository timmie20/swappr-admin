'use client';

import { ReasonModal } from '@/components/modal/reason-modal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { getApiError } from '@/lib/api/errors';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useProductAction } from '../hooks/use-admin-products';
import { AdminProductDetail, ProductAction } from '../types/product.types';

const REASON_MAX = 500;
const TOLD = 'The vendor will be told, with your reason.';
const NOT_TOLD = 'The vendor isn’t notified.';

// Copy must match the backend: unpublish, archive and delete notify the
// vendor (in-app + email) with the reason; publish and restore don't
const COPY: Record<
  ProductAction,
  {
    title: string;
    description: string;
    confirm: string;
    notifies: boolean;
    destructive?: boolean;
  }
> = {
  publish: {
    title: 'Publish this listing?',
    description: `It shows on the storefront while the store is active. ${NOT_TOLD}`,
    confirm: 'Publish',
    notifies: false
  },
  unpublish: {
    title: 'Unpublish this listing?',
    description: `It becomes a draft and leaves the storefront. The vendor can publish it again. ${TOLD}`,
    confirm: 'Unpublish',
    notifies: true,
    destructive: true
  },
  archive: {
    title: 'Archive this listing?',
    description: `It leaves the storefront and the vendor’s listings. You can restore it later; it comes back as a draft. ${TOLD}`,
    confirm: 'Archive',
    notifies: true,
    destructive: true
  },
  restore: {
    title: 'Restore this listing?',
    description: `It returns as a draft; publish it to show it again. ${NOT_TOLD}`,
    confirm: 'Restore',
    notifies: false
  },
  delete: {
    title: 'Delete this listing permanently?',
    description: `This can’t be undone. It’s removed from any carts holding it. A listing on orders or swap requests can’t be deleted; archive it instead. ${TOLD}`,
    confirm: 'Delete permanently',
    notifies: true,
    destructive: true
  }
};

/** What to show for a refused action; codes from the backend */
function errorMessage(
  error: unknown,
  action: ProductAction,
  archived: boolean
): string {
  const { code, message, extra } = getApiError(
    error,
    'The action failed. Try again.'
  );
  switch (code) {
    case 'PRODUCT_HAS_ORDERS':
      // Also refused for swap requests and soft-deleted orders, which
      // activity.orders doesn't count
      return `This listing is on orders or swap requests, so it can’t be deleted.${archived ? ' It stays archived.' : ' Archive it instead.'}`;
    case 'PRODUCT_ALREADY_IN_STATE':
      return extra.is_published === true
        ? 'It’s already published (perhaps by another admin). The page now shows its current state.'
        : extra.is_published === false
          ? 'It’s already unpublished (perhaps by another admin). The page now shows its current state.'
          : `It’s already ${action === 'publish' ? 'published' : 'unpublished'}. The page now shows its current state.`;
    case 'PRODUCT_NOT_ARCHIVED':
      return 'It isn’t archived any more (perhaps restored by another admin). The page now shows its current state.';
    case 'REASON_REQUIRED':
      return 'Please give a reason.';
    default:
      return message;
  }
}

/**
 * Admin actions on a listing (owner decision: publish/unpublish, archive,
 * restore and delete; no edit form). Each needs a reason, kept in the audit
 * trail.
 */
export function ProductActionsCard({
  product
}: {
  product: AdminProductDetail;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<ProductAction | null>(null);
  const mutation = useProductAction(product.id, product.vendor.id);

  const archived = !!product.archived_at;
  const onOrders = product.activity.orders.total;
  const actions: ProductAction[] = archived
    ? ['restore', 'delete']
    : [product.is_published ? 'unpublish' : 'publish', 'archive', 'delete'];

  const close = () => {
    setOpen(null);
    mutation.reset();
  };

  const copy = open ? COPY[open] : null;
  const storeOff = !product.vendor.store_active;
  const description =
    open === 'publish' && storeOff
      ? `The store isn’t active, so it stays hidden until the store is. ${NOT_TOLD}`
      : open === 'delete' && product.activity.in_carts > 0
        ? `${copy?.description} It’s in ${product.activity.in_carts} cart${product.activity.in_carts === 1 ? '' : 's'} now.`
        : (copy?.description ?? '');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Listing actions</CardTitle>
        <CardDescription>
          Each needs a reason and is recorded in the History below.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='flex flex-wrap gap-2'>
          {actions.map((action) => {
            const blocked = action === 'delete' && onOrders > 0;
            return (
              <Button
                key={action}
                size='sm'
                variant={COPY[action].destructive ? 'outline' : 'secondary'}
                className={
                  COPY[action].destructive ? 'text-destructive' : undefined
                }
                disabled={blocked}
                title={
                  blocked
                    ? 'On orders, so it can’t be deleted. Archive it instead.'
                    : undefined
                }
                onClick={() => setOpen(action)}
              >
                {COPY[action].confirm}
              </Button>
            );
          })}
        </div>
        {onOrders > 0 && (
          <p className='text-muted-foreground text-xs'>
            It’s on {onOrders} order{onOrders === 1 ? '' : 's'}, so it can’t be
            deleted.{!archived && ' Archive it instead.'}
          </p>
        )}
      </CardContent>

      {open && copy && (
        <ReasonModal
          isOpen
          onClose={close}
          loading={mutation.isPending}
          title={copy.title}
          description={description}
          label='Reason'
          placeholder={
            copy.notifies
              ? 'e.g. The photos show a different model'
              : 'e.g. Checked with the vendor; the listing is correct'
          }
          minLength={1}
          maxLength={REASON_MAX}
          confirmLabel={copy.confirm}
          destructive={copy.destructive}
          onConfirm={(reason) =>
            mutation.mutate(
              { action: open, reason },
              {
                onSuccess: () => {
                  setOpen(null);
                  if (open === 'delete') router.replace('/dashboard/product');
                }
              }
            )
          }
        >
          <p className='text-muted-foreground text-xs'>
            {copy.notifies
              ? 'The vendor sees this word for word in their email and notification.'
              : 'Kept in the audit trail. Not sent to the vendor.'}
          </p>
          {mutation.error && (
            <Alert variant='destructive'>
              <AlertDescription>
                {errorMessage(mutation.error, open, archived)}
              </AlertDescription>
            </Alert>
          )}
        </ReasonModal>
      )}
    </Card>
  );
}
