'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/forms/form-input';
import { FormTextarea } from '@/components/forms/form-textarea';
import { FormSwitch } from '@/components/forms/form-switch';
import { FormCheckboxGroup } from '@/components/forms/form-checkbox-group';
import { Icons } from '@/components/icons';
import { useBrands } from '@/features/brands';
import { useCategories } from '@/features/categories';
import { useCreateCollection } from '../hooks/use-create-collection';
import { useUpdateCollection } from '../hooks/use-update-collection';
import {
  Collection,
  ProductCondition,
  ProductPlatform
} from '../types/collection.types';

const PLATFORM_OPTIONS = Object.values(ProductPlatform).map((value) => ({
  value,
  label: value
}));

const CONDITION_OPTIONS = Object.values(ProductCondition).map((value) => ({
  value,
  label: value.replace(/_/g, ' ')
}));

const collectionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug can only contain lowercase letters, numbers, and hyphens'
    ),
  badge: z.string().min(1, 'Badge is required'),
  description: z.string().optional(),
  image: z.string().optional(),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0),
  platform: z.array(z.string()),
  brand_ids: z.array(z.string()),
  category_ids: z.array(z.string()),
  subcategory_ids: z.array(z.string()),
  series: z.string().optional(),
  condition: z.array(z.string()),
  min_price: z.number().optional(),
  max_price: z.number().optional(),
  is_swappable: z.boolean()
});

type CollectionFormValues = z.infer<typeof collectionSchema>;

function splitTags(value?: string): string[] | undefined {
  if (!value) return undefined;
  const parsed = value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  return parsed.length ? parsed : undefined;
}

function nonEmpty(values: string[]): string[] | undefined {
  return values.length ? values : undefined;
}

function defaultValuesFromCollection(
  collection?: Collection | null
): CollectionFormValues {
  const filters = collection?.filters;
  return {
    name: collection?.name ?? '',
    slug: collection?.slug ?? '',
    badge: collection?.badge ?? '',
    description: collection?.description ?? '',
    image: collection?.image ?? '',
    is_active: collection?.is_active ?? true,
    sort_order: collection?.sort_order ?? 0,
    platform: filters?.platform ?? [],
    brand_ids: filters?.brand_ids ?? [],
    category_ids: filters?.category_ids ?? [],
    subcategory_ids: filters?.subcategory_ids ?? [],
    series: filters?.series?.join(', ') ?? '',
    condition: filters?.condition ?? [],
    min_price: filters?.min_price,
    max_price: filters?.max_price,
    is_swappable: filters?.is_swappable ?? false
  };
}

interface CollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection?: Collection | null;
}

export function CollectionModal({
  open,
  onOpenChange,
  collection
}: CollectionModalProps) {
  const isEditMode = !!collection;
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();
  const router = useRouter();

  const { data: brands } = useBrands();
  const { data: categories } = useCategories();

  const brandOptions = (brands?.brands ?? []).map((brand) => ({
    value: brand.id,
    label: brand.brand_name
  }));
  const categoryOptions = (categories ?? []).map((category) => ({
    value: category.id,
    label: category.name
  }));
  const subCategoryOptions = (categories ?? []).flatMap((category) =>
    category.sub_categories.map((sub) => ({
      value: sub.id,
      label: `${category.name} → ${sub.name}`
    }))
  );

  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionSchema),
    defaultValues: defaultValuesFromCollection(collection)
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValuesFromCollection(collection));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, collection]);

  function onSubmit(values: CollectionFormValues) {
    const payload = {
      name: values.name,
      slug: values.slug,
      badge: values.badge,
      description: values.description || undefined,
      image: values.image || undefined,
      is_active: values.is_active,
      sort_order: values.sort_order,
      filters: {
        platform: nonEmpty(values.platform) as ProductPlatform[] | undefined,
        brand_ids: nonEmpty(values.brand_ids),
        category_ids: nonEmpty(values.category_ids),
        subcategory_ids: nonEmpty(values.subcategory_ids),
        series: splitTags(values.series),
        condition: nonEmpty(values.condition) as ProductCondition[] | undefined,
        min_price: values.min_price,
        max_price: values.max_price,
        is_swappable: values.is_swappable
      }
    };

    const onSuccess = () => {
      onOpenChange(false);
      router.refresh();
    };

    if (isEditMode && collection) {
      updateCollection.mutate({ id: collection.id, payload }, { onSuccess });
    } else {
      createCollection.mutate(payload, { onSuccess });
    }
  }

  const isPending = isEditMode
    ? updateCollection.isPending
    : createCollection.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Collection' : 'Create Collection'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update this collection's details and filters."
              : 'Add a new curated collection.'}
          </DialogDescription>
        </DialogHeader>

        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-6'
        >
          <Tabs defaultValue='details'>
            <TabsList>
              <TabsTrigger value='details'>Details</TabsTrigger>
              <TabsTrigger value='filters'>Filters</TabsTrigger>
            </TabsList>

            <TabsContent value='details' className='space-y-6'>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <FormInput
                  control={form.control}
                  name='name'
                  label='Name'
                  placeholder='Flash Deals'
                  required
                />
                <FormInput
                  control={form.control}
                  name='slug'
                  label='Slug'
                  placeholder='flash-deals'
                  required
                />
                <FormInput
                  control={form.control}
                  name='badge'
                  label='Badge'
                  placeholder='Hot'
                  required
                />
                <FormInput
                  control={form.control}
                  name='sort_order'
                  type='number'
                  label='Sort order'
                  placeholder='0'
                />
                <FormInput
                  control={form.control}
                  name='image'
                  label='Image URL'
                  placeholder='https://...'
                  className='sm:col-span-2'
                />
              </div>
              <FormTextarea
                control={form.control}
                name='description'
                label='Description'
                placeholder='Limited-time discounted devices'
                config={{ rows: 3, maxLength: 500, showCharCount: true }}
              />
              <FormSwitch
                control={form.control}
                name='is_active'
                label='Active'
                description='Visible and usable across the app'
              />
            </TabsContent>

            <TabsContent value='filters' className='space-y-6'>
              <p className='text-muted-foreground text-sm'>
                Filters determine which products belong to this collection. Any
                combination can be left empty.
              </p>

              <FormCheckboxGroup
                control={form.control}
                name='platform'
                label='Platform'
                options={PLATFORM_OPTIONS}
                columns={4}
              />

              <FormCheckboxGroup
                control={form.control}
                name='condition'
                label='Condition'
                options={CONDITION_OPTIONS}
                columns={4}
              />

              {brandOptions.length > 0 && (
                <FormCheckboxGroup
                  control={form.control}
                  name='brand_ids'
                  label='Brands'
                  options={brandOptions}
                  columns={3}
                />
              )}

              {categoryOptions.length > 0 && (
                <FormCheckboxGroup
                  control={form.control}
                  name='category_ids'
                  label='Categories'
                  options={categoryOptions}
                  columns={3}
                />
              )}

              {subCategoryOptions.length > 0 && (
                <FormCheckboxGroup
                  control={form.control}
                  name='subcategory_ids'
                  label='Sub-categories'
                  options={subCategoryOptions}
                  columns={2}
                />
              )}

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <FormInput
                  control={form.control}
                  name='series'
                  label='Series'
                  placeholder='iPhone 15, Galaxy S24'
                  description='Comma-separated'
                />
                <FormInput
                  control={form.control}
                  name='min_price'
                  type='number'
                  label='Min price'
                  placeholder='5000'
                />
                <FormInput
                  control={form.control}
                  name='max_price'
                  type='number'
                  label='Max price'
                  placeholder='500000'
                />
              </div>

              <FormSwitch
                control={form.control}
                name='is_swappable'
                label='Swappable only'
                description='Only include products eligible for trade-in/swap'
              />
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isPending}>
              {isPending && (
                <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
              )}
              {isPending
                ? isEditMode
                  ? 'Updating...'
                  : 'Creating...'
                : isEditMode
                  ? 'Update'
                  : 'Create Collection'}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
