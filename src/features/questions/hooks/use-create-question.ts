import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { questionApi } from '../api/question-service';
import { CreateQuestionDto } from '../types/question.types';

/**
 * Hook to create a new question
 *
 * @returns React Query mutation for creating a question
 *
 * @example
 * ```tsx
 * const createQuestion = useCreateQuestion();
 *
 * const handleSubmit = (data) => {
 *   createQuestion.mutate(data, {
 *     onSuccess: () => router.push('/dashboard/question')
 *   });
 * };
 * ```
 */
export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateQuestionDto) => questionApi.create(payload),
    onSuccess: () => {
      // Invalidate and refetch questions list
      queryClient.invalidateQueries({ queryKey: queryKeys.questions.lists() });
      toast.success('Question created successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to create question';
      toast.error(message);
    }
  });
}
