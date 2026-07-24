'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Icons } from '@/components/icons';
import { formatDate } from '@/lib/format';
import { useRouter } from 'next/navigation';
import { useUpdateCategoryStatus } from '../hooks/use-update-category-status';
import { Category, UpdateCategoryStatusDto } from '../types/category.types';

interface CategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
}

const CAPABILITY_TOGGLES: {
  key: keyof UpdateCategoryStatusDto;
  label: string;
  description: string;
}[] = [
  {
    key: 'is_active',
    label: 'Active',
    description: 'Category is visible and usable across the app'
  },
  {
    key: 'is_primary',
    label: 'Primary',
    description: 'Featured as a primary/top-level category'
  },
  {
    key: 'supports_variants',
    label: 'Supports variants',
    description:
      'Products have variants (e.g. storage); stock is tracked per variant instead of a flat quantity'
  },
  {
    key: 'supports_carrier_status',
    label: 'Supports carrier status',
    description: 'Products can specify a carrier lock status'
  },
  {
    key: 'supports_specifications',
    label: 'Supports specifications',
    description: 'Products can list technical specifications'
  },
  {
    key: 'supports_stock_tracking',
    label: 'Supports stock tracking',
    description:
      'Vendor enters a flat stock quantity at listing time (for products without variant-level tracking)'
  },
  {
    key: 'supports_swapping',
    label: 'Supports swapping',
    description: 'Products in this category are eligible for trade-in/swap'
  }
];

type ToggleState = Record<keyof UpdateCategoryStatusDto, boolean>;

function toggleStateFromCategory(category: Category): ToggleState {
  return {
    is_active: category.is_active,
    is_primary: category.is_primary,
    supports_variants: category.supports_variants,
    supports_carrier_status: category.supports_carrier_status,
    supports_specifications: category.supports_specifications,
    supports_stock_tracking: category.supports_stock_tracking,
    supports_swapping: category.supports_swapping
  };
}

export function CategoryModal({
  open,
  onOpenChange,
  category
}: CategoryModalProps) {
  const updateStatus = useUpdateCategoryStatus();
  const router = useRouter();
  const [toggles, setToggles] = useState<ToggleState | null>(null);

  useEffect(() => {
    if (category) {
      setToggles(toggleStateFromCategory(category));
    }
  }, [category]);

  if (!category || !toggles) return null;

  const original = toggleStateFromCategory(category);
  const dirtyKeys = (Object.keys(toggles) as (keyof ToggleState)[]).filter(
    (key) => toggles[key] !== original[key]
  );
  const isDirty = dirtyKeys.length > 0;

  const handleSave = () => {
    if (!isDirty) return;
    const payload: UpdateCategoryStatusDto = {};
    dirtyKeys.forEach((key) => {
      payload[key] = toggles[key];
    });
    updateStatus.mutate(
      { id: category.id, payload },
      {
        onSuccess: () => {
          onOpenChange(false);
          router.refresh();
        }
      }
    );
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setToggles(toggleStateFromCategory(category));
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{category.name}</DialogTitle>
          <DialogDescription>
            Manage this category&apos;s status and capabilities.
          </DialogDescription>
        </DialogHeader>

        <div className='grid grid-cols-2 gap-4 text-sm sm:grid-cols-4'>
          <div>
            <p className='text-muted-foreground'>Slug</p>
            <p className='font-medium'>{category.slug}</p>
          </div>
          <div>
            <p className='text-muted-foreground'>Type</p>
            <p className='font-medium capitalize'>{category.type}</p>
          </div>
          <div>
            <p className='text-muted-foreground'>Display order</p>
            <p className='font-medium'>{category.display_order}</p>
          </div>
          <div>
            <p className='text-muted-foreground'>Last updated</p>
            <p className='font-medium'>
              {formatDate(category.updated_at, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>

        <Separator />

        <div className='space-y-4'>
          {CAPABILITY_TOGGLES.map(({ key, label, description }) => (
            <div key={key} className='flex items-center justify-between gap-4'>
              <div>
                <Label htmlFor={`category-toggle-${key}`}>{label}</Label>
                <p className='text-muted-foreground text-xs'>{description}</p>
              </div>
              <Switch
                id={`category-toggle-${key}`}
                checked={toggles[key]}
                onCheckedChange={(checked) =>
                  setToggles((prev) =>
                    prev ? { ...prev, [key]: checked } : prev
                  )
                }
              />
            </div>
          ))}
        </div>

        {category.sub_categories.length > 0 && (
          <>
            <Separator />
            <div className='space-y-2'>
              <p className='text-sm font-medium'>
                Sub-categories ({category.sub_categories.length})
              </p>
              <div className='flex flex-wrap gap-2'>
                {category.sub_categories.map((sub) => (
                  <Badge
                    key={sub.id}
                    variant={sub.is_active ? 'secondary' : 'outline'}
                  >
                    {sub.name}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => handleOpenChange(false)}
            disabled={updateStatus.isPending}
          >
            Cancel
          </Button>
          <Button
            type='button'
            onClick={handleSave}
            disabled={!isDirty || updateStatus.isPending}
          >
            {updateStatus.isPending && (
              <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
            )}
            {updateStatus.isPending ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
