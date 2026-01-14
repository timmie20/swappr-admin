'use client';

import { Brand } from '@/features/brands';
import { useMemo } from 'react';

export function useBrandOptions(brands: Brand[], universal: boolean) {
  const brandOptions = useMemo(() => {
    const mappedBrands = brands.map((brand) => ({
      label: brand.brand_name,
      value: brand.id
    }));

    if (universal) {
      return [{ label: 'Universal', value: 'universal' }, ...mappedBrands];
    }

    return mappedBrands;
  }, [brands, universal]);

  return brandOptions;
}
