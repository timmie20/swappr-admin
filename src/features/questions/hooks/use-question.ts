import { queryKeys } from '@/lib/query-keys';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { questionApi } from '../api/question-service';

export default function useQuestion(id: string, initialData?: any) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: queryKeys.questions.detail(id),
    queryFn: () => questionApi.getById(id, getToken),
    initialData,
    enabled: !!getToken && !!id
  });
}
