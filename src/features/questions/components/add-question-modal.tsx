'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useCreateQuestion } from '../hooks/use-create-question';
import { Icons } from '@/components/icons';
import { useRouter } from 'next/navigation';
import { useBrands } from '@/features/brands/hooks/use-brands';
import { useMemo } from 'react';
import { slugify } from '@/lib/utils';

const createQuestionSchema = z.object({
  text: z.string().min(5, 'Question must be at least 5 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters'),
  type: z.string().min(1, 'Please select a question type'),
  note: z.string().optional(),
  brand_id: z.string().optional()
});

type CreateQuestionFormValues = z.infer<typeof createQuestionSchema>;

interface AddQuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const questionTypes = [
  { label: 'Radio', value: 'radio' },
  { label: 'Checkbox', value: 'checkbox' },
  { label: 'Text', value: 'text' },
  { label: 'Select', value: 'select' }
];

export function AddQuestionModal({
  open,
  onOpenChange
}: AddQuestionModalProps) {
  const createQuestion = useCreateQuestion();
  const router = useRouter();
  const { data: brandsData, isLoading: brandsLoading } = useBrands();

  const form = useForm<CreateQuestionFormValues>({
    resolver: zodResolver(createQuestionSchema),
    defaultValues: {
      text: '',
      slug: '',
      type: '',
      note: '',
      brand_id: 'universal'
    }
  });

  const brandOptions = useMemo(() => {
    if (!brandsData?.brands)
      return [{ label: 'Universal', value: 'universal' }];

    return [
      { label: 'Universal', value: 'universal' },
      ...brandsData.brands.map((brand) => ({
        label: brand.brand_name,
        value: brand.id
      }))
    ];
  }, [brandsData]);

  function onSubmit(values: CreateQuestionFormValues) {
    // Remove brand_id from payload if it's 'universal'
    const payload = {
      text: values.text,
      slug: slugify(values.slug),
      type: values.type,
      note: values.note || '',
      ...(values.brand_id &&
        values.brand_id !== 'universal' && { brand_id: values.brand_id })
    };

    createQuestion.mutate(payload, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Add New Question</DialogTitle>
          <DialogDescription>
            Create a new question for the questionnaire
          </DialogDescription>
        </DialogHeader>

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
            placeholder={brandsLoading ? 'Loading brands...' : 'Select brand'}
            options={brandOptions}
            disabled={brandsLoading}
            description='Select "Universal" for questions applicable to all brands'
          />

          <FormTextarea
            control={form.control}
            name='note'
            label='Note'
            placeholder='Add any additional notes or instructions...'
          />

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={createQuestion.isPending}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={createQuestion.isPending}>
              {createQuestion.isPending && (
                <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
              )}
              {createQuestion.isPending ? 'Creating...' : 'Create Question'}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
