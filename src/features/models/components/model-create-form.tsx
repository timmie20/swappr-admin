'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import * as z from 'zod';
import StorageVariationField from './storage-variation-field';
import { Separator } from '@/components/ui/separator';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';
import { Form } from '@/components/ui/form';
import { Brand } from '@/features/brands';
import { useCreateModel } from '../hooks/use-create-model';
import { CreateModelDto } from '../types/models.types';
import { Icons } from '@/components/icons';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Model name must be at least 5 characters.'
  }),
  brand: z.string(),
  description: z.string().optional(),
  variations: z
    .array(
      z.object({
        storage_capacity: z.coerce.number().int().positive(),
        price: z.coerce.number().positive()
      })
    )
    .min(1, { message: 'Add at least one storage variation.' })
  // valuationParams: z.array(
  //   z.object({
  //     questionId: z.string(),
  //     optionValue: z.string(),
  //     adjustmentType: z.enum(['addition', 'deduction']),
  //     amount: z.coerce.number().min(0)
  //   })
  // )
});

export type ModelFormValues = z.infer<typeof formSchema>;

export default function ModelForm({
  pageTitle,
  brands
}: {
  pageTitle: string;
  brands: Brand[];
}) {
  // const seededValuationParams = (initialData?.valuationElements || [])
  //   .flatMap((q) => (q.options || []).map((opt) => ({ q, opt })))
  //   .filter(
  //     ({ opt }) =>
  //       typeof opt.valuationAmount === 'number' && !!opt.adjustmentType
  //   )
  //   .map(({ q, opt }) => ({
  //     questionId: q.id,
  //     optionValue: opt.value,
  //     adjustmentType: opt.adjustmentType as 'addition' | 'deduction',
  //     amount: Number(opt.valuationAmount)
  //   }));

  const fallbackStorageFields = Array.from({ length: 2 }, () => ({
    storage_capacity: 64,
    price: 0
  }));

  const defaultValues: ModelFormValues = {
    name: '',
    brand: '',
    description: '',
    variations: fallbackStorageFields
  };

  const form = useForm<ModelFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variations'
  });

  const router = useRouter();
  const createModel = useCreateModel();

  const formatForPayload = (values: ModelFormValues): CreateModelDto => {
    return {
      brand_id: values.brand,
      model_name: values.name,
      desc: values.description || '',
      variations: values.variations
    };
  };

  function onSubmit(values: ModelFormValues) {
    const payload = formatForPayload(values);
    createModel.mutate(payload, {
      onSuccess: () => {
        router.push('/dashboard/model');
      }
    });
  }

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {pageTitle}
        </CardTitle>
        <CardDescription>
          Create and configure a device model. Set its name, category, base
          price, and a short description. Use the Storage Section to add one or
          more storage variations with individual capacities and prices. You can
          add or remove variations at any time.{' '}
          <span className='text-orange-300'>
            Note that the lowest storage price should also be the same value set
            in the base price field.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-8'
        >
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <FormInput
              control={form.control}
              name='name'
              label='Model Name'
              placeholder='Enter model name'
              required
            />

            <FormSelect
              control={form.control}
              name='brand'
              label='Select Brand'
              options={brands.map((brand) => ({
                value: brand.id,
                label: brand.brand_name
              }))}
              placeholder='Select brand'
              className='w-full'
              required
            />

            <FormTextarea
              control={form.control}
              name='description'
              label='Description'
              placeholder='Enter model description'
              required
              config={{
                maxLength: 500,
                showCharCount: true,
                rows: 4
              }}
            />
          </div>

          <Separator />

          {/* storage variations */}

          <div className='space-y-4'>
            <CardTitle>Storage Section</CardTitle>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              {fields.map((field, index) => (
                <StorageVariationField
                  key={field.id}
                  index={index}
                  form={form}
                  onRemove={remove}
                />
              ))}
            </div>
            <Button
              type='button'
              variant='outline'
              onClick={() => append({ storage_capacity: 64, price: 0 })}
            >
              Add storage variation
            </Button>
          </div>

          <Button type='submit' disabled={createModel.isPending}>
            {createModel.isPending && (
              <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
            )}
            {createModel.isPending ? 'Creating...' : 'Create Model'}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
