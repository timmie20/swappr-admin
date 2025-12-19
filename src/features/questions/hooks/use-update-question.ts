import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { questionApi } from '../api/question-service';
import { CreateQuestionDto } from '../types/question.types';

interface UpdateQuestionParams {
  id: string;
  payload: Partial<CreateQuestionDto>;
}

/**
 * Hook to update an existing question
 *
 * @returns React Query mutation for updating a question
 */
export function useUpdateQuestion() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateQuestionParams) =>
      questionApi.update(id, payload, getToken),
    onSuccess: (data, variables) => {
      // Update the cache with the unwrapped server response
      queryClient.setQueryData(
        queryKeys.questions.detail(variables.id),
        data.question
      );

      // Invalidate questions list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.questions.lists() });

      toast.success('Question updated successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to update question';
      toast.error(message);
    }
  });
}
