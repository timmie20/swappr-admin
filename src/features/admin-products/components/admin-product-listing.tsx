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
import { useBrands } from '@/features/brands/hooks/use-brands';
import { useCategories } from '@/features/categories/hooks/use-categories';
import { useDataTable } from '@/hooks/use-data-table';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { getSortingStateParser } from '@/lib/parsers';
import { IconAdjustmentsHorizontal } from '@tabler/icons-react';
import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryState
} from 'nuqs';
import { useMemo, useState } from 'react';
import { useAdminProducts } from '../hooks/use-admin-products';
import {
  AdminProductRow,
  CONDITION_LABEL,
  MODE_LABEL,
  PLATFORM_LABEL,
  ProductCondition,
  ProductMode,
  ProductPlatform,
  ProductSort,
  QueryAdminProductsParams
} from '../types/product.types';
import { productColumns } from './product-columns';

const ANY = 'any';
// 'live' = the API default: published + drafts, archived left out
const LISTING_VALUES = [
  'live',
  'published',
  'unpublished',
  'archived',
  'all'
] as const;
const STOREFRONT_VALUES = [ANY, 'true', 'false'] as const;
const SWAPPABLE_VALUES = [ANY, 'true', 'false'] as const;
const STOCK_VALUES = [
  ANY,
  'selling',
  'out_of_stock',
  'low',
  'sold_out'
] as const;
const CONDITIONS = Object.keys(CONDITION_LABEL) as ProductCondition[];
const PLATFORMS = Object.keys(PLATFORM_LABEL) as ProductPlatform[];
const MODES = Object.keys(MODE_LABEL) as ProductMode[];
const SORTS: ProductSort[] = [
  'created_at',
  'updated_at',
  'name',
  'base_price',
  'total_stock'
];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const STOCK_PARAMS: Record<
  (typeof STOCK_VALUES)[number],
  Partial<QueryAdminProductsParams>
> = {
  any: {},
  selling: { status: 'selling' },
  out_of_stock: { status: 'out_of_stock' },
  low: { max_stock: 3 },
  sold_out: { max_stock: 0 }
};

/** Naira typed by the admin → whole kobo; null if not a valid amount */
const nairaToKobo = (value: string | null): number | null => {
  if (!value) return null;
  const n = Number(value.replace(/,/g, ''));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
};

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col gap-1.5'>
      <span className='text-muted-foreground text-xs'>{label}</span>
      {children}
    </div>
  );
}

function ProductTable({
  data,
  totalItems,
  showVendor
}: {
  data: AdminProductRow[];
  totalItems: number;
  showVendor: boolean;
}) {
  const [pageSize] = useQueryState('perPage', parseAsInteger.withDefault(20));
  const columns = useMemo(() => productColumns({ showVendor }), [showVendor]);
  const { table } = useDataTable({
    data,
    columns,
    pageCount: Math.max(1, Math.ceil(totalItems / pageSize)),
    initialState: { pagination: { pageIndex: 0, pageSize: 20 } }
  });
  return <DataTable table={table} />;
}

/**
 * Every listing, any state. On the vendor page, vendorId scopes it to that
 * store and the Store column is dropped.
 */
export default function AdminProductListing({
  vendorId
}: {
  vendorId?: string;
}) {
  const categories = useCategories();
  const brands = useBrands();

  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(20));
  const [sort] = useQueryState('sort', getSortingStateParser().withDefault([]));
  const [search, setSearch] = useQueryState('search', parseAsString);
  const [listing, setListing] = useQueryState(
    'listing',
    parseAsStringEnum([...LISTING_VALUES]).withDefault('live')
  );
  const [storefront, setStorefront] = useQueryState(
    'storefront',
    parseAsStringEnum([...STOREFRONT_VALUES]).withDefault(ANY)
  );
  const [stock, setStock] = useQueryState(
    'stock',
    parseAsStringEnum([...STOCK_VALUES]).withDefault(ANY)
  );
  // Ids are checked against the catalogue below
  const [category, setCategory] = useQueryState('category', parseAsString);
  const [subcategory, setSubcategory] = useQueryState(
    'subcategory',
    parseAsString
  );
  const [brand, setBrand] = useQueryState('brand', parseAsString);
  const [condition, setCondition] = useQueryState(
    'condition',
    parseAsStringEnum(CONDITIONS)
  );
  const [platform, setPlatform] = useQueryState(
    'platform',
    parseAsStringEnum(PLATFORMS)
  );
  const [mode, setMode] = useQueryState('mode', parseAsStringEnum(MODES));
  const [swappable, setSwappable] = useQueryState(
    'swappable',
    parseAsStringEnum([...SWAPPABLE_VALUES]).withDefault(ANY)
  );
  const [minPrice, setMinPrice] = useQueryState('min_price', parseAsString);
  const [maxPrice, setMaxPrice] = useQueryState('max_price', parseAsString);
  const [from, setFrom] = useQueryState('created_from', parseAsString);
  const [to, setTo] = useQueryState('created_to', parseAsString);

  const [searchInput, setSearchInput] = useState(search ?? '');
  const [minInput, setMinInput] = useState(minPrice ?? '');
  const [maxInput, setMaxInput] = useState(maxPrice ?? '');
  // One timer per box, so typing in one doesn't cancel another
  const applyText =
    (setter: (value: string | null) => unknown) => (value: string) => {
      void setPage(1);
      void setter(value.trim() || null);
    };
  const debouncedSearch = useDebouncedCallback(applyText(setSearch), 300);
  const debouncedMin = useDebouncedCallback(applyText(setMinPrice), 300);
  const debouncedMax = useDebouncedCallback(applyText(setMaxPrice), 300);

  const advancedCount = [
    condition,
    platform,
    mode,
    swappable !== ANY,
    minPrice,
    maxPrice,
    from,
    to
  ].filter(Boolean).length;
  const [showMore, setShowMore] = useState(advancedCount > 0);

  // A stale id in the URL (deleted category, shared link) is dropped
  const categoryList = categories.data ?? [];
  const activeCategory = categoryList.find((c) => c.id === category);
  const subcategories = activeCategory?.sub_categories ?? [];
  const activeSubcategory = subcategories.find((s) => s.id === subcategory);
  const brandList = useMemo(
    () =>
      [...(brands.data?.brands ?? [])].sort((a, b) =>
        a.brand_name.localeCompare(b.brand_name)
      ),
    [brands.data]
  );
  const activeBrand = brandList.find((b) => b.id === brand);

  const minKobo = nairaToKobo(minPrice);
  const maxKobo = nairaToKobo(maxPrice);
  const priceInverted =
    minKobo !== null && maxKobo !== null && minKobo > maxKobo;
  const validFrom = from && DATE_PATTERN.test(from) ? from : null;
  const validTo = to && DATE_PATTERN.test(to) ? to : null;
  const rangeInverted = !!validFrom && !!validTo && validFrom > validTo;

  const [sortEntry] = sort;
  const sortBy = SORTS.find((s) => s === sortEntry?.id);
  const params: QueryAdminProductsParams = {
    search: search ?? undefined,
    vendor_id: vendorId,
    category_id: activeCategory?.id,
    subcategory_id: activeSubcategory?.id,
    brand_id: activeBrand?.id,
    condition: condition ?? undefined,
    platform: platform ?? undefined,
    mode: mode ?? undefined,
    state: listing === 'live' ? undefined : listing,
    on_storefront: storefront === ANY ? undefined : storefront === 'true',
    is_swappable: swappable === ANY ? undefined : swappable === 'true',
    min_price_kobo: minKobo ?? undefined,
    max_price_kobo: priceInverted ? undefined : (maxKobo ?? undefined),
    ...STOCK_PARAMS[stock],
    // Lagos is UTC+1 all year: a picked day is 00:00–23:59:59.999 Lagos
    from: validFrom ? `${validFrom}T00:00:00.000+01:00` : undefined,
    to: validTo && !rangeInverted ? `${validTo}T23:59:59.999+01:00` : undefined,
    ...(sortBy
      ? { sort_by: sortBy, sort_order: sortEntry.desc ? 'DESC' : 'ASC' }
      : {}),
    page,
    limit: Math.min(perPage, 100)
  };
  const query = useAdminProducts(params);

  const withReset =
    <T,>(setter: (value: T) => unknown) =>
    (value: T) => {
      void setPage(1);
      void setter(value);
    };

  const isFiltered =
    !!search ||
    listing !== 'live' ||
    storefront !== ANY ||
    stock !== ANY ||
    !!activeCategory ||
    !!activeBrand ||
    advancedCount > 0;

  const resetAll = () => {
    void setPage(1);
    setSearchInput('');
    setMinInput('');
    setMaxInput('');
    void setSearch(null);
    void setListing('live');
    void setStorefront(ANY);
    void setStock(ANY);
    void setCategory(null);
    void setSubcategory(null);
    void setBrand(null);
    void setCondition(null);
    void setPlatform(null);
    void setMode(null);
    void setSwappable(ANY);
    void setMinPrice(null);
    void setMaxPrice(null);
    void setFrom(null);
    void setTo(null);
  };

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <div className='flex flex-wrap items-end gap-2'>
        <Field label='Search'>
          <Input
            placeholder={
              vendorId
                ? 'Name, slug, SKU or brand'
                : 'Name, slug, SKU, store or brand'
            }
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              debouncedSearch(e.target.value);
            }}
            className='h-8 w-64'
          />
        </Field>

        <Field label='Listing'>
          <Select
            value={listing}
            onValueChange={(v) =>
              withReset(setListing)(v as (typeof LISTING_VALUES)[number])
            }
          >
            <SelectTrigger size='sm' className='w-[170px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='live'>Published &amp; drafts</SelectItem>
              <SelectItem value='published'>Published</SelectItem>
              <SelectItem value='unpublished'>Drafts</SelectItem>
              <SelectItem value='archived'>Archived</SelectItem>
              <SelectItem value='all'>Everything</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label='Storefront'>
          <Select
            value={storefront}
            onValueChange={(v) =>
              withReset(setStorefront)(v as (typeof STOREFRONT_VALUES)[number])
            }
          >
            <SelectTrigger size='sm' className='w-[150px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              <SelectItem value='true'>On storefront</SelectItem>
              <SelectItem value='false'>Hidden</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label='Category'>
          <Select
            value={activeCategory?.id ?? ANY}
            disabled={!categories.data}
            onValueChange={(v) => {
              void setPage(1);
              void setCategory(v === ANY ? null : v);
              // Subcategories belong to one category
              void setSubcategory(null);
            }}
          >
            <SelectTrigger size='sm' className='w-[150px]'>
              <SelectValue placeholder='Any' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any category</SelectItem>
              {categoryList.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {subcategories.length > 0 && (
          <Field label='Subcategory'>
            <Select
              value={activeSubcategory?.id ?? ANY}
              onValueChange={(v) =>
                withReset(setSubcategory)(v === ANY ? null : v)
              }
            >
              <SelectTrigger size='sm' className='w-[150px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any subcategory</SelectItem>
                {subcategories.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}

        <Field label='Brand'>
          <Select
            value={activeBrand?.id ?? ANY}
            disabled={!brands.data}
            onValueChange={(v) => withReset(setBrand)(v === ANY ? null : v)}
          >
            <SelectTrigger size='sm' className='w-[150px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any brand</SelectItem>
              {brandList.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.brand_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label='Stock'>
          <Select
            value={stock}
            onValueChange={(v) =>
              withReset(setStock)(v as (typeof STOCK_VALUES)[number])
            }
          >
            <SelectTrigger size='sm' className='w-[150px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              <SelectItem value='selling'>Selling</SelectItem>
              <SelectItem value='out_of_stock'>Marked out of stock</SelectItem>
              <SelectItem value='low'>Low (3 or fewer)</SelectItem>
              <SelectItem value='sold_out'>None left (0)</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Button
          variant='outline'
          size='sm'
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
        >
          <IconAdjustmentsHorizontal className='mr-1 h-4 w-4' />
          More filters{advancedCount > 0 ? ` (${advancedCount})` : ''}
        </Button>

        {isFiltered && (
          <Button variant='outline' size='sm' onClick={resetAll}>
            Reset filters
          </Button>
        )}
      </div>

      {showMore && (
        <div className='flex flex-wrap items-end gap-2 rounded-md border p-3'>
          <Field label='Condition'>
            <Select
              value={condition ?? ANY}
              onValueChange={(v) =>
                withReset(setCondition)(
                  v === ANY ? null : (v as ProductCondition)
                )
              }
            >
              <SelectTrigger size='sm' className='w-[140px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any</SelectItem>
                {CONDITIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CONDITION_LABEL[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label='Platform'>
            <Select
              value={platform ?? ANY}
              onValueChange={(v) =>
                withReset(setPlatform)(
                  v === ANY ? null : (v as ProductPlatform)
                )
              }
            >
              <SelectTrigger size='sm' className='w-[130px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any</SelectItem>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PLATFORM_LABEL[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label='Mode'>
            <Select
              value={mode ?? ANY}
              onValueChange={(v) =>
                withReset(setMode)(v === ANY ? null : (v as ProductMode))
              }
            >
              <SelectTrigger size='sm' className='w-[140px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any</SelectItem>
                {MODES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {MODE_LABEL[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label='Swappable'>
            <Select
              value={swappable}
              onValueChange={(v) =>
                withReset(setSwappable)(v as (typeof SWAPPABLE_VALUES)[number])
              }
            >
              <SelectTrigger size='sm' className='w-[120px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any</SelectItem>
                <SelectItem value='true'>Yes</SelectItem>
                <SelectItem value='false'>No</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label='Price from (₦)'>
            <Input
              inputMode='decimal'
              placeholder='0'
              value={minInput}
              onChange={(e) => {
                setMinInput(e.target.value);
                debouncedMin(e.target.value);
              }}
              className='h-8 w-28'
            />
          </Field>
          <Field label='Price to (₦)'>
            <Input
              inputMode='decimal'
              placeholder='Any'
              value={maxInput}
              onChange={(e) => {
                setMaxInput(e.target.value);
                debouncedMax(e.target.value);
              }}
              className='h-8 w-28'
            />
          </Field>
          <Field label='Created from'>
            <Input
              type='date'
              value={from ?? ''}
              onChange={(e) => withReset(setFrom)(e.target.value || null)}
              className='h-8 w-[150px]'
            />
          </Field>
          <Field label='Created to'>
            <Input
              type='date'
              value={to ?? ''}
              onChange={(e) => withReset(setTo)(e.target.value || null)}
              className='h-8 w-[150px]'
            />
          </Field>
        </div>
      )}

      {(priceInverted || rangeInverted) && (
        <p className='text-destructive text-xs'>
          {priceInverted &&
            '“Price from” is above “Price to”, so the upper price is ignored. '}
          {rangeInverted &&
            '“Created from” is after “Created to”, so the end date is ignored.'}
        </p>
      )}

      {query.error ? (
        <SectionError
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
          what='products'
        />
      ) : !query.data ? (
        <DataTableSkeleton
          columnCount={vendorId ? 6 : 7}
          rowCount={8}
          filterCount={0}
        />
      ) : query.data.total === 0 ? (
        <p className='text-muted-foreground rounded-md border py-10 text-center text-sm'>
          {isFiltered
            ? 'No listings match these filters.'
            : vendorId
              ? 'This store has no listings yet.'
              : 'No listings yet.'}
        </p>
      ) : (
        <ProductTable
          data={query.data.data}
          totalItems={query.data.total}
          showVendor={!vendorId}
        />
      )}
    </div>
  );
}
