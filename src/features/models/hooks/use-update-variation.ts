'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { modelsApi } from '../api/models.service';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';

interface UpdateVariationParams {
  model_id: string;
  variationId: string;
  payload: {
    storage_capacity: number;
    price: number;
    note?: string;
  };
}

export function useUpdateVariation() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ variationId, payload }: UpdateVariationParams) =>
      modelsApi.updateVariation(variationId, payload, getToken),
    onSuccess: (_, { model_id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.models.detail(model_id)
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.models.lists() });
      toast.success('Variation updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update variation', {
        description: error.message
      });
    }
  });
}
