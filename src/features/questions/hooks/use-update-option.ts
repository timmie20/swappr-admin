import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { questionApi } from '../api/question-service';

interface UpdateOptionParams {
  questionId: string;
  optionId: string;
  payload: {
    text: string;
  };
}

/**
 * Hook to update an existing option
 */
export function useUpdateOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ optionId, payload }: UpdateOptionParams) =>
      questionApi.updateOption(optionId, payload),
    onSuccess: (_, { questionId }) => {
      // Invalidate question detail to refetch with updated options
      queryClient.invalidateQueries({
        queryKey: queryKeys.questions.detail(questionId)
      });

      toast.success('Option updated successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to update option';
      toast.error(message);
    }
  });
}
