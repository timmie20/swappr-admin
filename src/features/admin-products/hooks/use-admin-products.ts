import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiError, retryUnlessClientError } from '@/lib/api/errors';
import { queryKeys } from '@/lib/query-keys';
import { adminProductsApi } from '../api/admin-products.service';
import {
  ProductAction,
  QueryAdminProductsParams
} from '../types/product.types';

// Same refresh behaviour as the other admin views
const REFRESH = {
  staleTime: 60 * 1000,
  refetchOnWindowFocus: true,
  retry: retryUnlessClientError
} as const;

export function useAdminProducts(params: QueryAdminProductsParams) {
  return useQuery({
    queryKey: queryKeys.adminProducts.list(params),
    queryFn: () => adminProductsApi.getAll(params),
    placeholderData: keepPreviousData,
    ...REFRESH
  });
}

export function useAdminProduct(productId: string) {
  return useQuery({
    queryKey: queryKeys.adminProducts.detail(productId),
    queryFn: () => adminProductsApi.getById(productId),
    enabled: !!productId,
    ...REFRESH
  });
}

// The listing moved on (another admin, another tab): refetch so the page
// shows its real state
const STALE_STATE_CODES = new Set([
  'PRODUCT_ALREADY_IN_STATE',
  'PRODUCT_NOT_ARCHIVED'
]);

const SUCCESS: Record<ProductAction, string> = {
  publish: 'Listing published',
  unpublish: 'Listing unpublished. The vendor has been told.',
  archive: 'Listing archived. The vendor has been told.',
  restore: 'Listing restored as a draft',
  delete: 'Listing deleted permanently. The vendor has been told.'
};

/**
 * Publish, unpublish, archive, restore or delete a listing, with a reason.
 * Errors are left to the caller so the dialog can show them inline (the
 * typed reason isn't lost).
 */
export function useProductAction(productId: string, vendorId?: string) {
  const queryClient = useQueryClient();
  const invalidate = (action?: ProductAction) => {
    if (action === 'delete') {
      // Gone: don't refetch a 404
      queryClient.removeQueries({
        queryKey: queryKeys.adminProducts.detail(productId)
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.adminProducts.all(),
        refetchType: 'active',
        predicate: (q) => q.queryKey[1] === 'list'
      });
    } else {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.adminProducts.all()
      });
    }
    // Listing counts on the vendor page, and the audit trail
    if (vendorId) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.adminVendors.detail(vendorId)
      });
    }
    void queryClient.invalidateQueries({
      queryKey: queryKeys.adminAudit.all()
    });
  };

  return useMutation({
    mutationFn: ({
      action,
      reason
    }: {
      action: ProductAction;
      reason: string;
    }) => adminProductsApi.runAction(productId, action, reason),
    onSuccess: (_data, { action }) => {
      invalidate(action);
      toast.success(SUCCESS[action]);
    },
    onError: (error) => {
      const { code } = getApiError(error);
      if (code && STALE_STATE_CODES.has(code)) invalidate();
    }
  });
}
