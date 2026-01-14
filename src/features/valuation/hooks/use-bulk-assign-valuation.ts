import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { valuationApi, BulkAssignRequest } from '../api/valuation-service';

/**
 * Parameters for bulk assigning valuation
 */
export type BulkAssignParams = {
  modelId: string;
  brandId: string;
  payload: BulkAssignRequest;
};

/**
 * Hook to bulk assign valuation parameters to a model
 *
 * @returns React Query mutation for bulk assigning valuation
 *
 * @example
 * ```tsx
 * const bulkAssign = useBulkAssignValuation();
 *
 * const handleSubmit = (values) => {
 *   bulkAssign.mutate({
 *     modelId: 'abc-123',
 *     brandId: 'def-456',
 *     payload: {
 *       items: [
 *         { questionId: 'q1', optionId: 'opt1', adjustmentType: 'add', amount: 5000 }
 *       ]
 *     }
 *   });
 * };
 * ```
 */
export function useBulkAssignValuation() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ modelId, brandId, payload }: BulkAssignParams) =>
      valuationApi.bulkAssignValuation(modelId, brandId, payload, getToken),
    onSuccess: (data, variables) => {
      // Invalidate questions for this model to refetch updated values
      queryClient.invalidateQueries({
        queryKey: queryKeys.valuation.forModel(variables.modelId)
      });
      toast.success(data.message || 'Valuation parameters saved successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to save valuation parameters';
      toast.error(message);
    }
  });
}
