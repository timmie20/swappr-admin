import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiError, retryUnlessClientError } from '@/lib/api/errors';
import { queryKeys } from '@/lib/query-keys';
import { adminVendorsApi, PageParams } from '../api/vendors.service';
import {
  QueryAdminVendorsParams,
  VendorOrderQueue,
  VendorTransactionType
} from '../types/vendor.types';

// Same refresh behaviour as the Overview
const REFRESH = {
  staleTime: 60 * 1000,
  refetchOnWindowFocus: true,
  retry: retryUnlessClientError
} as const;

export function useAdminVendors(params: QueryAdminVendorsParams) {
  return useQuery({
    queryKey: queryKeys.adminVendors.list(params),
    queryFn: () => adminVendorsApi.getAll(params),
    placeholderData: keepPreviousData,
    ...REFRESH
  });
}

export function useAdminVendor(vendorId: string) {
  return useQuery({
    queryKey: queryKeys.adminVendors.detail(vendorId),
    queryFn: () => adminVendorsApi.getById(vendorId),
    enabled: !!vendorId,
    ...REFRESH
  });
}

export function useVendorOrders(
  vendorId: string,
  params: PageParams & { queue?: VendorOrderQueue; search?: string },
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.adminVendors.orders(vendorId, params),
    queryFn: () => adminVendorsApi.getOrders(vendorId, params),
    enabled,
    placeholderData: keepPreviousData,
    ...REFRESH
  });
}

export function useVendorRequests(
  vendorId: string,
  params: PageParams & { state?: 'open' | 'all' },
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.adminVendors.requests(vendorId, params),
    queryFn: () => adminVendorsApi.getRequests(vendorId, params),
    enabled,
    placeholderData: keepPreviousData,
    ...REFRESH
  });
}

/** Superadmin only — pass enabled=false for admin so it is never called */
export function useVendorTransactions(
  vendorId: string,
  params: PageParams & {
    type?: VendorTransactionType;
    from?: string;
    to?: string;
  },
  enabled: boolean
) {
  return useQuery({
    queryKey: queryKeys.adminVendors.transactions(vendorId, params),
    queryFn: () => adminVendorsApi.getTransactions(vendorId, params),
    enabled,
    placeholderData: keepPreviousData,
    ...REFRESH
  });
}

export function useSetVendorInspection(vendorId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      verified,
      reason
    }: {
      verified: boolean;
      reason?: string;
    }) => adminVendorsApi.setInspection(vendorId, verified, reason),
    onSuccess: (_data, { verified }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminVendors.all()
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminOverview.all()
      });
      toast.success(
        verified
          ? 'Inspection marked as verified'
          : 'Inspection revoked — pickup is now off'
      );
    },
    onError: (error) => {
      toast.error(
        getApiError(error, 'Failed to update the inspection').message
      );
    }
  });
}
