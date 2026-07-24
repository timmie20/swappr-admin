import { queryKeys } from '@/lib/query-keys';
import { useQuery } from '@tanstack/react-query';
import { questionApi } from '../api/question-service';

export default function useQuestion(id: string, initialData?: any) {
  return useQuery({
    queryKey: queryKeys.questions.detail(id),
    queryFn: () => questionApi.getById(id),
    initialData,
    enabled: !!id
  });
}
