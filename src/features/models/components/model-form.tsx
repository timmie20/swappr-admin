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
import * as z from 'zod';
import StorageVariationField from './storage-variation-field';
import { Separator } from '@/components/ui/separator';
import { InitialModelData } from '@/types';
import ValuationAssignment from './valuation-assisgnment';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';
import { Form } from '@/components/ui/form';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Model name must be at least 5 characters.'
  }),
  brand: z.string(),
  base: z.coerce.number(),
  description: z.string().optional(),
  storageVariations: z
    .array(
      z.object({
        capacity: z.coerce.number().int().positive(),
        price: z.coerce.number().positive()
      })
    )
    .min(1, { message: 'Add at least one storage variation.' }),
  valuationParams: z.array(
    z.object({
      questionId: z.string(),
      optionValue: z.string(),
      adjustmentType: z.enum(['addition', 'deduction']),
      amount: z.coerce.number().min(0)
    })
  )
});

export type ModelFormValues = z.infer<typeof formSchema>;

export default function ModelForm({
  initialData,
  pageTitle
}: {
  initialData?: InitialModelData | null;
  pageTitle: string;
}) {
  const seededValuationParams = (initialData?.valuationElements || [])
    .flatMap((q) => (q.options || []).map((opt) => ({ q, opt })))
    .filter(
      ({ opt }) =>
        typeof opt.valuationAmount === 'number' && !!opt.adjustmentType
    )
    .map(({ q, opt }) => ({
      questionId: q.id,
      optionValue: opt.value,
      adjustmentType: opt.adjustmentType as 'addition' | 'deduction',
      amount: Number(opt.valuationAmount)
    }));

  const fallbackStorageFields = Array.from({ length: 2 }, () => ({
    capacity: 64,
    price: 0
  }));

  const defaultValues: ModelFormValues = {
    name: initialData?.name || '',
    brand: initialData?.brand || '',
    base: initialData?.base || 0,
    description: initialData?.description || '',
    storageVariations: initialData?.storageVariations?.length
      ? initialData.storageVariations
      : fallbackStorageFields,
    valuationParams: seededValuationParams
  };

  const form = useForm<ModelFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'storageVariations'
  });

  function onSubmit(values: ModelFormValues) {
    // handle submit
    // void Promise.resolve(values);

    // eslint-disable-next-line no-console
    console.log(values);
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
              options={[{ label: 'Apple Iphone', value: 'apple-iphone' }]}
              placeholder='Select brand'
              className='w-full'
              required
            />

            <FormInput
              control={form.control}
              name='base'
              label='Base Price'
              placeholder='Enter price'
              type='number'
              step={1000}
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
              onClick={() => append({ capacity: 64, price: 0 })}
            >
              Add storage variation
            </Button>
          </div>

          <Separator />

          <div className='space-y-4'>
            <CardTitle>Valuation Parameters</CardTitle>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {initialData?.valuationElements?.map((q) => (
                <ValuationAssignment key={q.id} question={q} form={form} />
              ))}
            </div>
          </div>

          <Button type='submit'>Add Product</Button>
        </Form>
      </CardContent>
    </Card>
  );
}
