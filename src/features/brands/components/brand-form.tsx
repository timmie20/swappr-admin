'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/forms/form-input';
import { FormTextarea } from '@/components/forms/form-textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import * as z from 'zod';
import { Brand } from '../types/brand.types';
import { useCreateBrand } from '../hooks/use-create-brand';
import { useUpdateBrand } from '../hooks/use-update-brand';
import { Icons } from '@/components/icons';

const brandSchema = z.object({
  name: z.string().min(2, 'Brand name must be at least 2 characters'),
  description: z.string().optional()
});

type BrandFormValues = z.infer<typeof brandSchema>;

interface BrandFormProps {
  initialData?: Brand;
  pageTitle: string;
}

export default function BrandForm({ initialData, pageTitle }: BrandFormProps) {
  const router = useRouter();
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();

  const isEditMode = !!initialData;

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: initialData?.brand_name || '',
      description: initialData?.description || ''
    }
  });

  function onSubmit(values: BrandFormValues) {
    if (isEditMode) {
      updateBrand.mutate(
        {
          id: initialData.id,
          payload: {
            brand_name: values.name,
            description: values.description
          }
        },
        {
          onSuccess: () => {
            router.push('/dashboard/brand');
          }
        }
      );
    } else {
      createBrand.mutate(
        {
          brand_name: values.name,
          description: values.description
        },
        {
          onSuccess: () => {
            router.push('/dashboard/brand');
          }
        }
      );
    }
  }

  const isPending = createBrand.isPending || updateBrand.isPending;

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {pageTitle}
        </CardTitle>
        <CardDescription>
          {isEditMode
            ? 'Update brand information'
            : 'Create a new brand for your products'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form form={form} onSubmit={onSubmit} className='space-y-6'>
          <FormInput
            control={form.control}
            name='name'
            label='Brand Name'
            placeholder='e.g. Apple, Samsung'
            required
          />

          <FormTextarea
            control={form.control}
            name='description'
            label='Description (Optional)'
            placeholder='Enter brand description...'
            config={{
              maxLength: 500,
              showCharCount: true,
              rows: 4
            }}
          />

          <Button type='submit' disabled={isPending}>
            {isPending && (
              <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
            )}
            {isEditMode
              ? isPending
                ? 'Updating...'
                : 'Update Brand'
              : isPending
                ? 'Creating...'
                : 'Create Brand'}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
