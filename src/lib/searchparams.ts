import {
  createSearchParamsCache,
  createSerializer,
  parseAsFloat,
  parseAsInteger,
  parseAsIsoDate,
  parseAsString,
  parseAsStringEnum
} from 'nuqs/server';
import { getSortingStateParser } from './parsers';

export const searchParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  name: parseAsString,
  gender: parseAsString,
  category: parseAsString,
  is_active: parseAsStringEnum(['true', 'false']).withDefault('true'),
  sort: getSortingStateParser().withDefault([]),
  // Payouts
  status: parseAsStringEnum([
    'all',
    'pending',
    'processing',
    'completed',
    'failed'
  ]).withDefault('all'),
  vendor_id: parseAsString,
  search: parseAsString,
  min_amount: parseAsFloat,
  max_amount: parseAsFloat,
  created_from: parseAsIsoDate,
  created_to: parseAsIsoDate
  // advanced filter
  // filters: getFiltersStateParser().withDefault([]),
  // joinOperator: parseAsStringEnum(['and', 'or']).withDefault('and')
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const serialize = createSerializer(searchParams);
