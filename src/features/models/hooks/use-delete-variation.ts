'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { modelsApi } from '../api/models.service';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';

interface DeleteVariationParams {
  modelId: string;
  variationId: string;
}

export function useDeleteVariation() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ variationId }: DeleteVariationParams) =>
      modelsApi.deleteVariation(variationId, getToken),
    onSuccess: (_, { modelId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.models.detail(modelId)
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.models.lists() });
      toast.success('Variation deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete variation', {
        description: error.message
      });
    }
  });
}
