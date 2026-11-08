'use client';

import { SectionError } from '@/components/section-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { useDataTable } from '@/hooks/use-data-table';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryState
} from 'nuqs';
import { useMemo, useState } from 'react';
import { useAuditCatalogue, useAuditLog } from '../hooks/use-audit';
import {
  AuditActorType,
  AuditEntry,
  CATEGORY_LABEL,
  eventLabel,
  humanise,
  OVERRIDE_EVENTS
} from '../types/audit.types';
import { auditColumns } from './audit-columns';

const ACTOR_VALUES = ['any', 'admin', 'vendor', 'customer', 'system'] as const;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// Shortcut for the three admin override events
const OVERRIDES = 'overrides';

function AuditTable({
  data,
  totalItems
}: {
  data: AuditEntry[];
  totalItems: number;
}) {
  const [pageSize] = useQueryState('perPage', parseAsInteger.withDefault(20));
  const columns = useMemo(() => auditColumns(), []);
  const { table } = useDataTable({
    data,
    columns,
    pageCount: Math.max(1, Math.ceil(totalItems / pageSize)),
    initialState: { pagination: { pageIndex: 0, pageSize: 20 } }
  });
  return <DataTable table={table} />;
}

/** Admin actions and vendor standing across the platform, newest first */
export default function AuditLogListing() {
  const catalogue = useAuditCatalogue();
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(20));
  // Validated against the catalogue below, not a fixed enum
  const [category, setCategory] = useQueryState('category', parseAsString);
  const [event, setEvent] = useQueryState('event', parseAsString);
  const [actorType, setActorType] = useQueryState(
    'actor_type',
    parseAsStringEnum([...ACTOR_VALUES]).withDefault('any')
  );
  const [actor, setActor] = useQueryState('actor', parseAsString);
  const [vendor, setVendor] = useQueryState('vendor', parseAsString);
  const [from, setFrom] = useQueryState('from', parseAsString);
  const [to, setTo] = useQueryState('to', parseAsString);

  const [actorInput, setActorInput] = useState(actor ?? '');
  const [vendorInput, setVendorInput] = useState(vendor ?? '');
  const debouncedActor = useDebouncedCallback((value: string) => {
    void setPage(1);
    void setActor(value.trim() || null);
  }, 300);
  const debouncedVendor = useDebouncedCallback((value: string) => {
    void setPage(1);
    void setVendor(value.trim() || null);
  }, 300);

  const categories = catalogue.data?.categories ?? [];
  // A category the viewer can't see (e.g. a shared superadmin link opened
  // by an admin) is dropped rather than sent as a 400
  const activeCategory = categories.find((c) => c.category === category);
  const eventOptions = activeCategory
    ? activeCategory.events
    : categories.flatMap((c) => c.events);
  const canFilterOverrides = OVERRIDE_EVENTS.every((e) =>
    eventOptions.includes(e)
  );
  const activeEvent =
    event === OVERRIDES && canFilterOverrides
      ? OVERRIDES
      : event && eventOptions.includes(event)
        ? event
        : null;

  const validFrom = from && DATE_PATTERN.test(from) ? from : null;
  const validTo = to && DATE_PATTERN.test(to) ? to : null;
  // The API refuses from after to; say so instead of sending it
  const rangeInverted = !!validFrom && !!validTo && validFrom > validTo;
  // Only admins have a name to search on
  const actorSearchable = actorType === 'any' || actorType === 'admin';

  const query = useAuditLog(
    {
      category: activeCategory?.category,
      event:
        activeEvent === OVERRIDES
          ? OVERRIDE_EVENTS.join(',')
          : (activeEvent ?? undefined),
      actor_type:
        actorType === 'any' ? undefined : (actorType as AuditActorType),
      actor: actorSearchable ? (actor ?? undefined) : undefined,
      vendor: vendor ?? undefined,
      // Lagos is UTC+1 all year: a picked day is 00:00–23:59:59.999 Lagos
      from: validFrom ? `${validFrom}T00:00:00.000+01:00` : undefined,
      to:
        validTo && !rangeInverted ? `${validTo}T23:59:59.999+01:00` : undefined,
      page,
      limit: perPage
    },
    // A category/event in the URL is only checked once the catalogue loads:
    // wait for it rather than briefly showing everything
    !(category || event) || !!catalogue.data
  );

  const withReset =
    <T,>(setter: (value: T) => unknown) =>
    (value: T) => {
      void setPage(1);
      void setter(value);
    };

  const isFiltered =
    !!activeCategory ||
    !!activeEvent ||
    actorType !== 'any' ||
    !!actor ||
    !!vendor ||
    !!from ||
    !!to;

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <div className='flex flex-wrap items-end gap-2'>
        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>Category</span>
          <Select
            value={activeCategory?.category ?? 'all'}
            disabled={!catalogue.data}
            onValueChange={(value) => {
              void setPage(1);
              void setCategory(value === 'all' ? null : value);
              // Keep the event only if it still belongs
              const next = categories.find((c) => c.category === value);
              if (
                next &&
                activeEvent &&
                activeEvent !== OVERRIDES &&
                !next.events.includes(activeEvent)
              ) {
                void setEvent(null);
              }
            }}
          >
            <SelectTrigger size='sm' className='w-[150px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.category} value={c.category}>
                  {CATEGORY_LABEL[c.category] ?? humanise(c.category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>Event</span>
          <Select
            value={activeEvent ?? 'all'}
            disabled={!catalogue.data}
            onValueChange={(value) =>
              withReset(setEvent)(value === 'all' ? null : value)
            }
          >
            <SelectTrigger size='sm' className='w-[240px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All events</SelectItem>
              {canFilterOverrides && (
                <SelectItem value={OVERRIDES}>All admin overrides</SelectItem>
              )}
              <SelectSeparator />
              {eventOptions.map((e) => (
                <SelectItem key={e} value={e}>
                  {eventLabel(e)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>Done by</span>
          <Select
            value={actorType}
            onValueChange={(value) =>
              withReset(setActorType)(value as (typeof ACTOR_VALUES)[number])
            }
          >
            <SelectTrigger size='sm' className='w-[120px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='any'>Anyone</SelectItem>
              <SelectItem value='admin'>Admin</SelectItem>
              <SelectItem value='vendor'>Vendor</SelectItem>
              <SelectItem value='customer'>Customer</SelectItem>
              <SelectItem value='system'>System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {actorSearchable && (
          <div className='flex flex-col gap-1.5'>
            <span className='text-muted-foreground text-xs'>Admin name</span>
            <Input
              placeholder='e.g. Ada'
              value={actorInput}
              onChange={(e) => {
                setActorInput(e.target.value);
                debouncedActor(e.target.value);
              }}
              className='h-8 w-36'
            />
          </div>
        )}

        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>Vendor</span>
          <Input
            placeholder='Store or business name'
            value={vendorInput}
            onChange={(e) => {
              setVendorInput(e.target.value);
              debouncedVendor(e.target.value);
            }}
            className='h-8 w-48'
          />
        </div>

        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>From</span>
          <Input
            type='date'
            value={from ?? ''}
            onChange={(e) => withReset(setFrom)(e.target.value || null)}
            className='h-8 w-[150px]'
          />
        </div>
        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>To</span>
          <Input
            type='date'
            value={to ?? ''}
            onChange={(e) => withReset(setTo)(e.target.value || null)}
            className='h-8 w-[150px]'
          />
        </div>

        {isFiltered && (
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              void setPage(1);
              setActorInput('');
              setVendorInput('');
              void setCategory(null);
              void setEvent(null);
              void setActorType('any');
              void setActor(null);
              void setVendor(null);
              void setFrom(null);
              void setTo(null);
            }}
          >
            Reset filters
          </Button>
        )}
      </div>

      {rangeInverted && (
        <p className='text-destructive text-xs'>
          “From” is after “To”, so the end date is ignored.
        </p>
      )}

      {!!catalogue.error && (
        <SectionError
          error={catalogue.error}
          onRetry={() => void catalogue.refetch()}
          retrying={catalogue.isFetching}
          what='the filter options'
        />
      )}

      {query.error ? (
        <SectionError
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
          what='the audit log'
        />
      ) : !query.data ? (
        <DataTableSkeleton columnCount={8} rowCount={8} filterCount={0} />
      ) : query.data.total === 0 ? (
        <p className='text-muted-foreground rounded-md border py-10 text-center text-sm'>
          {isFiltered
            ? 'No entries match these filters.'
            : 'Nothing has been recorded yet.'}
        </p>
      ) : (
        <AuditTable data={query.data.data} totalItems={query.data.total} />
      )}
    </div>
  );
}
