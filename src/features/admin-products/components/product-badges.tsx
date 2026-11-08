import { Badge } from '@/components/ui/badge';
import { AMBER_BADGE } from '@/features/admin-vendors/components/vendor-badges';
import { HIDDEN_REASON_LABEL, HiddenReason } from '../types/product.types';

/** Why a row is hidden, worked out from the list row's own fields */
export const rowHiddenReasons = (p: {
  archived_at: string | null;
  is_published: boolean;
  vendor: { store_active: boolean };
}): HiddenReason[] => [
  ...(p.archived_at ? (['archived'] as const) : []),
  ...(!p.is_published ? (['unpublished'] as const) : []),
  ...(!p.vendor.store_active ? (['store_not_active'] as const) : [])
];

/**
 * Published / Draft / Archived, plus "Hidden" with the reason when it isn't
 * on the storefront. Archived and Draft are already the reason, so Hidden
 * only names what they don't (the store being off).
 */
export function ProductStateBadges({
  product,
  hiddenReasons
}: {
  product: {
    is_published: boolean;
    archived_at: string | null;
    on_storefront: boolean;
    vendor: { store_active: boolean };
  };
  /** The detail's hidden_reasons; derived from the row when omitted */
  hiddenReasons?: HiddenReason[];
}) {
  const reasons = hiddenReasons ?? rowHiddenReasons(product);
  return (
    <div className='flex flex-wrap gap-1'>
      {product.archived_at ? (
        <Badge variant='destructive'>Archived</Badge>
      ) : product.is_published ? (
        <Badge variant='secondary'>Published</Badge>
      ) : (
        <Badge variant='outline'>Draft</Badge>
      )}
      {!product.on_storefront && (
        <Badge
          variant='outline'
          className={AMBER_BADGE}
          title={reasons.map((r) => HIDDEN_REASON_LABEL[r]).join(' · ')}
        >
          Hidden
          {reasons.includes('store_not_active') && ' · store not active'}
        </Badge>
      )}
    </div>
  );
}

export function StockCell({
  total,
  status
}: {
  total: number;
  status: string | null;
}) {
  if (status === 'out_of_stock' || total <= 0) {
    return <Badge variant='outline'>Out of stock</Badge>;
  }
  return (
    <span
      className={
        total <= 3 ? 'font-medium text-amber-700 dark:text-amber-400' : ''
      }
    >
      {total.toLocaleString('en-NG')}
      {total <= 3 && <span className='ml-1 text-xs'>low</span>}
    </span>
  );
}
