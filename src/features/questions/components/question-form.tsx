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
import { Question } from '../types/question.types';
import { useUpdateQuestion } from '../hooks/use-update-question';
import { Icons } from '@/components/icons';
import { Separator } from '@/components/ui/separator';
import { useBrandOptions } from '@/hooks/use-brand-options';

const editQuestionSchema = z.object({
  text: z.string().min(5, 'Question must be at least 5 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters'),
  type: z.string().min(1, 'Please select a question type'),
  note: z.string().optional(),
  brand_id: z.string().optional()
});

type EditQuestionFormValues = z.infer<typeof editQuestionSchema>;

interface QuestionFormProps {
  question: Question;
  liveQuestion?: Question;
  brands: Brand[];
}

const questionTypes = [
  { label: 'Radio', value: 'radio' },
  { label: 'Checkbox', value: 'checkbox' },
  { label: 'Text', value: 'text' },
  { label: 'Select', value: 'select' }
];

export default function QuestionForm({
  question,
  liveQuestion,
  brands
}: QuestionFormProps) {
  const updateQuestion = useUpdateQuestion();

  const brandOptions = useBrandOptions(brands, true);

  const form = useForm<EditQuestionFormValues>({
    resolver: zodResolver(editQuestionSchema),
    values: {
      text: liveQuestion?.text || '',
      slug: liveQuestion?.slug || '',
      type: liveQuestion?.type || '',
      note: liveQuestion?.note || '',
      brand_id: liveQuestion?.brand?.id || 'universal'
    }
  });

  // Use form's built-in dirty state to detect changes
  const isDirty = form.formState.isDirty;

  function getChangedFields(
    initialData: EditQuestionFormValues,
    formData: EditQuestionFormValues
  ) {
    const changes: Partial<EditQuestionFormValues> = {};

    (Object.keys(formData) as Array<keyof EditQuestionFormValues>).forEach(
      (key) => {
        if (formData[key] !== initialData[key]) {
          changes[key] = formData[key];
        }
      }
    );

    return changes;
  }

  function onSubmit(values: EditQuestionFormValues) {
    const initialValues: EditQuestionFormValues = {
      text: liveQuestion?.text || '',
      slug: liveQuestion?.slug || '',
      type: liveQuestion?.type || '',
      note: liveQuestion?.note || '',
      brand_id: liveQuestion?.brand?.id || 'universal'
    };

    const changes = getChangedFields(initialValues, values);

    // Remove brand_id if it's 'universal' or add it if it's a valid brand
    const payload: any = { ...changes };
    if ('brand_id' in payload) {
      if (payload.brand_id === 'universal') {
        delete payload.brand_id;
        // If changing from brand-specific to universal, explicitly send null
        if (initialValues.brand_id !== 'universal') {
          payload.brand_id = null;
        }
      }
    }

    updateQuestion.mutate({
      id: liveQuestion?.id || question.id,
      payload
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Question Details</CardTitle>
        <CardDescription>Update the question information</CardDescription>
      </CardHeader>
      <CardContent>
        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4'
        >
          <FormInput
            control={form.control}
            name='text'
            label='Question Text'
            placeholder="e.g. Is your phone's wireless and mobile data working fine?"
            required
          />

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <FormInput
              control={form.control}
              name='slug'
              label='Slug'
              placeholder='e.g. connection'
              required
            />

            <FormSelect
              control={form.control}
              name='type'
              label='Question Type'
              placeholder='Select type'
              options={questionTypes}
              required
            />
          </div>

          <FormSelect
            control={form.control}
            name='brand_id'
            label='Brand'
            placeholder='Select brand'
            options={brandOptions}
            description='Select "Universal" for questions applicable to all brands'
          />

          <FormTextarea
            control={form.control}
            name='note'
            label='Note'
            placeholder='Add any additional notes or instructions...'
          />

          <Separator />

          <Button
            type='submit'
            disabled={updateQuestion.isPending || !isDirty}
            className='w-full md:w-auto'
          >
            {updateQuestion.isPending && (
              <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
            )}
            {updateQuestion.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
