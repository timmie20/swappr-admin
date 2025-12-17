'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { modelsApi } from '../api/models.service';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';

export interface CreateVariationParams {
  model_id: string;
  storage_capacity: number;
  price: number;
  note?: string;
}

export function useCreateVariation() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateVariationParams) =>
      modelsApi.createVariation(payload, getToken),
    onSuccess: (_, { model_id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.models.detail(model_id)
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.models.lists() });
      toast.success('Variation created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create variation', {
        description: error.message
      });
    }
  });
}
