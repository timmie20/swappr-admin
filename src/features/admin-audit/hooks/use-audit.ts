import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { retryUnlessClientError } from '@/lib/api/errors';
import { queryKeys } from '@/lib/query-keys';
import { auditApi } from '../api/audit.service';
import { QueryAuditParams } from '../types/audit.types';

export function useAuditLog(params: QueryAuditParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminAudit.list(params),
    queryFn: () => auditApi.getAll(params),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    retry: retryUnlessClientError
  });
}

/** Changes only with a deploy, so it is kept for the session */
export function useAuditCatalogue() {
  return useQuery({
    queryKey: queryKeys.adminAudit.catalogue(),
    queryFn: auditApi.getCatalogue,
    staleTime: Infinity,
    retry: retryUnlessClientError
  });
}
