'use client';

import { SectionError } from '@/components/section-error';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { auditColumns } from '@/features/admin-audit/components/audit-columns';
import type { AuditEntry } from '@/features/admin-audit/types/audit.types';
import { useDataTable } from '@/hooks/use-data-table';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useMemo } from 'react';
import { useVendorHistory } from '../hooks/use-vendors';

function HistoryTable({
  data,
  totalItems
}: {
  data: AuditEntry[];
  totalItems: number;
}) {
  const [pageSize] = useQueryState('perPage', parseAsInteger.withDefault(10));
  // Every row is this vendor, so no Vendor column
  const columns = useMemo(() => auditColumns({ showVendor: false }), []);
  const { table } = useDataTable({
    data,
    columns,
    pageCount: Math.max(1, Math.ceil(totalItems / pageSize))
  });
  return <DataTable table={table} />;
}

/**
 * This vendor's slice of the audit log, newest first. A superadmin also sees
 * the vendor's payout and delivery entries (the backend decides).
 */
export function VendorHistoryTab({ vendorId }: { vendorId: string }) {
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const query = useVendorHistory(vendorId, { page, limit: perPage });

  if (query.data && query.data.total === 0) {
    return (
      <p className='text-muted-foreground rounded-md border py-10 text-center text-sm'>
        Nothing recorded for this vendor yet.
      </p>
    );
  }

  return (
    <div className='flex h-[560px] flex-col'>
      {query.error ? (
        <SectionError
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
          what='the history'
        />
      ) : !query.data ? (
        <DataTableSkeleton columnCount={7} rowCount={6} filterCount={0} />
      ) : (
        <HistoryTable data={query.data.data} totalItems={query.data.total} />
      )}
    </div>
  );
}
