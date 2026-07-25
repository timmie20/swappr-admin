import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { questionApi } from '../api/question-service';

/**
 * Hook to delete a question
 *
 * @returns React Query mutation for deleting a question
 *
 * @example
 * ```tsx
 * const deleteQuestion = useDeleteQuestion();
 *
 * const handleDelete = () => {
 *   deleteQuestion.mutate(questionId);
 * };
 * ```
 */
export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => questionApi.delete(id),
    onSuccess: () => {
      // Invalidate and refetch questions list
      queryClient.invalidateQueries({ queryKey: queryKeys.questions.lists() });
      toast.success('Question deleted successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to delete question';
      toast.error(message);
    }
  });
}
