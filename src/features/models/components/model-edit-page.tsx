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
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Brand } from '@/features/brands';
import { Model } from '../types/models.types';
import { useUpdateModel } from '../hooks/use-update-model';
import { Icons } from '@/components/icons';
import { Separator } from '@/components/ui/separator';
import ModelVariationsTable from './model-variations-table';
import { useModel } from '../hooks/use-models';
import { useBrandOptions } from '@/hooks/use-brand-options';

const editModelSchema = z.object({
  model_name: z.string().min(2, 'Model name must be at least 2 characters'),
  brand_id: z.string().min(1, 'Please select a brand'),
  desc: z.string().optional()
});

type EditModelFormValues = z.infer<typeof editModelSchema>;

interface ModelEditPageProps {
  model: Model;
  brands: Brand[];
}

export default function ModelEditPage({ model, brands }: ModelEditPageProps) {
  const updateModel = useUpdateModel();
  const { data: liveModel } = useModel(model.id, model);

  const form = useForm<EditModelFormValues>({
    resolver: zodResolver(editModelSchema),
    values: {
      model_name: liveModel?.model_name || '',
      brand_id: liveModel?.brand?.id || '',
      desc: liveModel?.desc || ''
    }
  });

  function getChangedFields(
    initialData: EditModelFormValues,
    formData: EditModelFormValues
  ) {
    const changes: Partial<EditModelFormValues> = {};

    (Object.keys(formData) as Array<keyof EditModelFormValues>).forEach(
      (key) => {
        if (formData[key] !== initialData[key]) {
          changes[key] = formData[key];
        }
      }
    );

    return changes;
  }

  function onSubmit(values: EditModelFormValues) {
    const initialValues: EditModelFormValues = {
      model_name: liveModel?.model_name || '',
      brand_id: liveModel?.brand?.id || '',
      desc: liveModel?.desc || ''
    };

    const payload = getChangedFields(initialValues, values);

    // // Only submit if there are changes
    // if (Object.keys(payload).length === 0) {
    //   toast.warning('No new changes made');
    //   return;
    // }

    updateModel.mutate({
      id: model.id,
      payload
    });
  }

  const brandOptions = useBrandOptions(brands, false);

  return (
    <div className='space-y-6'>
      {/* Basic Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Model Details</CardTitle>
          <CardDescription>
            Update the basic information for this model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form
            form={form}
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormInput
              control={form.control}
              name='model_name'
              label='Model Name'
              placeholder='e.g. iPhone 15 Pro'
              required
            />

            <FormSelect
              control={form.control}
              name='brand_id'
              label='Brand'
              placeholder='Select a brand'
              options={brandOptions}
              required
            />

            <FormTextarea
              control={form.control}
              name='desc'
              label='Description'
              placeholder='Enter model description...'
            />

            <Separator />

            <Button
              type='submit'
              disabled={updateModel.isPending}
              className='w-full md:w-auto'
            >
              {updateModel.isPending && (
                <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
              )}
              {updateModel.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </Form>
        </CardContent>
      </Card>

      {/* Variations Table */}
      <ModelVariationsTable
        modelId={model.id}
        variations={liveModel?.variations || []}
      />
    </div>
  );
}
