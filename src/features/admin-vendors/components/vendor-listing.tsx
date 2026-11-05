'use client';

import { SectionError } from '@/components/section-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDataTable } from '@/hooks/use-data-table';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { getSortingStateParser } from '@/lib/parsers';
import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryState
} from 'nuqs';
import { useEffect, useState } from 'react';
import { useAdminVendors } from '../hooks/use-vendors';
import {
  AdminVendorRow,
  QueryAdminVendorsParams,
  VendorSort,
  VendorTier
} from '../types/vendor.types';
import { columns } from './vendor-tables/columns';

// Queue presets; each sets the API filters
const PRESETS = {
  all: { label: 'All', params: {} },
  onboarding: { label: 'Onboarding', params: { stage: 'in_progress' } },
  approved: { label: 'Approved', params: { stage: 'approved' } },
  'pending-inspection': {
    label: 'Pending inspection',
    // Oldest request first
    params: {
      inspection: 'requested',
      sort_by: 'inspection_requested_at',
      sort_order: 'ASC'
    }
  },
  inspected: { label: 'Inspected', params: { inspection: 'verified' } }
} satisfies Record<
  string,
  { label: string; params: Partial<QueryAdminVendorsParams> }
>;

type Preset = keyof typeof PRESETS;
const PRESET_KEYS = Object.keys(PRESETS) as Preset[];
const VERIFIED_VALUES = ['any', 'true', 'false'] as const;
const TIER_VALUES = ['any', '0', '1', '2'] as const;
const SUSPENDED_VALUES = ['any', 'true', 'false'] as const;

function VendorTable({
  data,
  totalItems
}: {
  data: AdminVendorRow[];
  totalItems: number;
}) {
  const [pageSize] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const { table } = useDataTable({
    data,
    columns,
    pageCount: Math.max(1, Math.ceil(totalItems / pageSize))
  });
  return <DataTable table={table} />;
}

export default function VendorListing() {
  // Owner decision: queue/filter tabs replace history
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringEnum(PRESET_KEYS)
      .withDefault('all')
      .withOptions({ history: 'replace' })
  );
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [sort] = useQueryState('sort', getSortingStateParser().withDefault([]));
  const [search, setSearch] = useQueryState('search', parseAsString);
  const [stateFilter, setStateFilter] = useQueryState('state', parseAsString);
  const [verified, setVerified] = useQueryState(
    'verified',
    parseAsStringEnum([...VERIFIED_VALUES]).withDefault('any')
  );
  const [tier, setTier] = useQueryState(
    'tier',
    parseAsStringEnum([...TIER_VALUES]).withDefault('any')
  );
  const [suspended, setSuspended] = useQueryState(
    'suspended',
    parseAsStringEnum([...SUSPENDED_VALUES]).withDefault('any')
  );

  const [searchInput, setSearchInput] = useState(search ?? '');
  const [stateInput, setStateInput] = useState(stateFilter ?? '');
  const debouncedSearch = useDebouncedCallback((value: string) => {
    void setPage(1);
    void setSearch(value.trim() || null);
  }, 300);
  const debouncedState = useDebouncedCallback((value: string) => {
    void setPage(1);
    void setStateFilter(value.trim() || null);
  }, 300);

  const [sortEntry] = sort;
  const params: QueryAdminVendorsParams = {
    ...PRESETS[tab].params,
    // A column sort the admin picked overrides the preset's default
    ...(sortEntry
      ? {
          sort_by: sortEntry.id as VendorSort,
          sort_order: sortEntry.desc ? 'DESC' : 'ASC'
        }
      : {}),
    search: search ?? undefined,
    state: stateFilter ?? undefined,
    is_verified: verified === 'any' ? undefined : verified === 'true',
    tier: tier === 'any' ? undefined : (Number(tier) as VendorTier),
    suspended: suspended === 'any' ? undefined : suspended === 'true',
    page,
    limit: perPage
  };
  const { data, isLoading, isFetching, error, refetch } =
    useAdminVendors(params);

  // Owner decision: a tab shows its count only once it has been opened.
  // Counts depend on the filters, so they reset when a filter changes.
  const [counts, setCounts] = useState<Partial<Record<Preset, number>>>({});
  useEffect(
    () => setCounts({}),
    [search, stateFilter, verified, tier, suspended]
  );
  useEffect(() => {
    if (data && !isFetching) setCounts((c) => ({ ...c, [tab]: data.total }));
  }, [data, isFetching, tab]);

  const isFiltered =
    !!search ||
    !!stateFilter ||
    verified !== 'any' ||
    tier !== 'any' ||
    suspended !== 'any';

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <Tabs
        value={tab}
        onValueChange={(value) => {
          void setPage(1);
          void setTab(value as Preset);
        }}
      >
        <TabsList>
          {PRESET_KEYS.map((key) => (
            <TabsTrigger key={key} value={key}>
              {PRESETS[key].label}
              {counts[key] !== undefined && (
                <span className='text-muted-foreground ml-1 tabular-nums'>
                  {counts[key]}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className='flex flex-wrap items-end gap-2'>
        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>Search</span>
          <Input
            placeholder='Business, owner, email or RC number'
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              debouncedSearch(event.target.value);
            }}
            className='h-8 w-72'
          />
        </div>
        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>State</span>
          <Input
            placeholder='e.g. Lagos'
            value={stateInput}
            onChange={(event) => {
              setStateInput(event.target.value);
              debouncedState(event.target.value);
            }}
            className='h-8 w-36'
          />
        </div>
        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>Verified</span>
          <Select
            value={verified}
            onValueChange={(value) => {
              void setPage(1);
              void setVerified(value as (typeof VERIFIED_VALUES)[number]);
            }}
          >
            <SelectTrigger size='sm' className='w-[130px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='any'>Any</SelectItem>
              <SelectItem value='true'>Verified</SelectItem>
              <SelectItem value='false'>Not verified</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>Tier</span>
          <Select
            value={tier}
            onValueChange={(value) => {
              void setPage(1);
              void setTier(value as (typeof TIER_VALUES)[number]);
            }}
          >
            <SelectTrigger size='sm' className='w-[150px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='any'>Any tier</SelectItem>
              <SelectItem value='0'>Tier 0 · inactive</SelectItem>
              <SelectItem value='1'>Tier 1</SelectItem>
              <SelectItem value='2'>Tier 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>Suspended</span>
          <Select
            value={suspended}
            onValueChange={(value) => {
              void setPage(1);
              void setSuspended(value as (typeof SUSPENDED_VALUES)[number]);
            }}
          >
            <SelectTrigger size='sm' className='w-[140px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='any'>Any</SelectItem>
              <SelectItem value='true'>Suspended</SelectItem>
              <SelectItem value='false'>Not suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isFiltered && (
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              void setPage(1);
              setSearchInput('');
              setStateInput('');
              void setSearch(null);
              void setStateFilter(null);
              void setVerified('any');
              void setTier('any');
              void setSuspended('any');
            }}
          >
            Reset filters
          </Button>
        )}
      </div>

      {error ? (
        <SectionError
          error={error}
          onRetry={() => void refetch()}
          retrying={isFetching}
          what='vendors'
        />
      ) : isLoading || !data ? (
        <DataTableSkeleton columnCount={9} rowCount={8} filterCount={0} />
      ) : (
        <VendorTable data={data.data} totalItems={data.total} />
      )}
    </div>
  );
}
