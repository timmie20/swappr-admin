import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import {
  valuationApi,
  QuestionsForModelResponse
} from '../api/valuation-service';

/**
 * Hook to fetch all questions with options for a specific model
 *
 * @param modelId - The UUID of the model
 * @param initialData - Optional initial data to prevent duplicate fetches
 * @param enabled - Whether to enable the query (default: true)
 * @returns Query result with questions and options
 *
 * @example
 * ```tsx
 * // With initial data (from server component)
 * const { data, isLoading, error } = useQuestionsForModel(modelId, initialData);
 *
 * // Without initial data
 * const { data, isLoading, error } = useQuestionsForModel(modelId);
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error loading questions</div>;
 *
 * return (
 *   <div>
 *     {data?.questions.map(question => (
 *       <div key={question.id}>{question.text}</div>
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useQuestionsForModel(
  modelId: string,
  initialData?: QuestionsForModelResponse,
  enabled: boolean = true
): UseQueryResult<QuestionsForModelResponse, Error> {
  return useQuery({
    queryKey: queryKeys.valuation.forModel(modelId),
    queryFn: () => valuationApi.getQuestionsForModel(modelId),
    enabled: enabled && !!modelId,
    initialData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes (formerly cacheTime)
  });
}
