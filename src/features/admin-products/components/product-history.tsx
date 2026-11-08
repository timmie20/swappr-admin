'use client';

import { SectionError } from '@/components/section-error';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { auditColumns } from '@/features/admin-audit/components/audit-columns';
import { useAuditLog } from '@/features/admin-audit/hooks/use-audit';
import type { AuditEntry } from '@/features/admin-audit/types/audit.types';
import { useDataTable } from '@/hooks/use-data-table';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useMemo } from 'react';

function HistoryTable({
  data,
  totalItems
}: {
  data: AuditEntry[];
  totalItems: number;
}) {
  const [pageSize] = useQueryState('perPage', parseAsInteger.withDefault(10));
  // Every row is this listing's store
  const columns = useMemo(() => auditColumns({ showVendor: false }), []);
  const { table } = useDataTable({
    data,
    columns,
    pageCount: Math.max(1, Math.ceil(totalItems / pageSize))
  });
  return <DataTable table={table} />;
}

/**
 * Admin edits, publishing, archiving and restoring of this listing, newest
 * first. Reasons show verbatim.
 */
export function ProductHistory({ productId }: { productId: string }) {
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const query = useAuditLog({
    subject_type: 'product',
    subject_id: productId,
    page,
    limit: perPage
  });

  if (query.error) {
    return (
      <SectionError
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
        what='the history'
      />
    );
  }
  if (!query.data) {
    return <DataTableSkeleton columnCount={7} rowCount={4} filterCount={0} />;
  }
  if (query.data.total === 0) {
    return (
      <p className='text-muted-foreground rounded-md border py-8 text-center text-sm'>
        No admin changes recorded for this listing. Vendors’ own edits aren’t in
        the audit trail.
      </p>
    );
  }
  return (
    <div className='flex h-[480px] flex-col'>
      <HistoryTable data={query.data.data} totalItems={query.data.total} />
    </div>
  );
}
