import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { questionApi } from '../api/question-service';

interface DeleteOptionParams {
  questionId: string;
  optionId: string;
}

/**
 * Hook to delete an option
 */
export function useDeleteOption() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ optionId }: DeleteOptionParams) =>
      questionApi.deleteOption(optionId, getToken),
    onSuccess: (data, variables) => {
      // Invalidate question detail to refetch without deleted option
      queryClient.invalidateQueries({
        queryKey: queryKeys.questions.detail(variables.questionId)
      });

      toast.success('Option deleted successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to delete option';
      toast.error(message);
    }
  });
}
