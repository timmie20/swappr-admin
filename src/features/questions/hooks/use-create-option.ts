import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { questionApi } from '../api/question-service';

export interface CreateOptionParams {
  questionId: string;
  text?: string;
  options?: string[];
}

/**
 * Hook to create new option(s) for a question
 */
export function useCreateOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ questionId, text, options }: CreateOptionParams) =>
      questionApi.createOption(questionId, { text, options }, 'single'),
    onSuccess: (data, variables) => {
      // Invalidate question detail to refetch with new options
      queryClient.invalidateQueries({
        queryKey: queryKeys.questions.detail(variables.questionId)
      });

      toast.success('Option created successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to create option';
      toast.error(message);
    }
  });
}

export function useCreateMultipleOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ questionId, text, options }: CreateOptionParams) =>
      questionApi.createOption(questionId, { text, options }, 'multiple'),
    onSuccess: (data, variables) => {
      // Invalidate question detail to refetch with new options
      queryClient.invalidateQueries({
        queryKey: queryKeys.questions.detail(variables.questionId)
      });

      toast.success('Options created successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to create options';
      toast.error(message);
    }
  });
}
