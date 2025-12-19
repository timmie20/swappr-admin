'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/forms/form-input';
import { FormTextarea } from '@/components/forms/form-textarea';
import { Icons } from '@/components/icons';
import { useState } from 'react';
import {
  useCreateMultipleOption,
  useCreateOption
} from '../hooks/use-create-option';
import { useUpdateOption } from '../hooks/use-update-option';

const singleOptionSchema = z.object({
  text: z.string().min(1, 'Option text is required')
});

const multipleOptionsSchema = z.object({
  options: z.string().min(1, 'Please enter at least one option')
});

type SingleOptionFormValues = z.infer<typeof singleOptionSchema>;
type MultipleOptionsFormValues = z.infer<typeof multipleOptionsSchema>;

type Option = {
  id: string;
  text: string;
};

interface OptionFormModalProps {
  questionId: string;
  option?: Option;
  mode: 'single' | 'multiple';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OptionFormModal({
  questionId,
  option,
  mode,
  open,
  onOpenChange
}: OptionFormModalProps) {
  const isEditMode = !!option;
  const [optionsList, setOptionsList] = useState<string[]>([]);
  const [currentOption, setCurrentOption] = useState('');

  const createOption = useCreateOption();
  const createMultipleOptions = useCreateMultipleOption();

  const updateOption = useUpdateOption();

  const singleForm = useForm<SingleOptionFormValues>({
    resolver: zodResolver(singleOptionSchema),
    defaultValues: {
      text: option?.text || ''
    }
  });

  const multipleForm = useForm<MultipleOptionsFormValues>({
    resolver: zodResolver(multipleOptionsSchema),
    defaultValues: {
      options: ''
    }
  });

  const addToList = () => {
    if (currentOption.trim()) {
      setOptionsList([...optionsList, currentOption.trim()]);
      setCurrentOption('');
    }
  };

  const removeFromList = (index: number) => {
    setOptionsList(optionsList.filter((_, i) => i !== index));
  };

  function onSubmitSingle(values: SingleOptionFormValues) {
    if (isEditMode && option) {
      updateOption.mutate(
        {
          questionId,
          optionId: option.id,
          payload: values
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            singleForm.reset();
          }
        }
      );
    } else {
      createOption.mutate(
        {
          questionId,
          text: values.text
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            singleForm.reset();
          }
        }
      );
    }
  }

  function onSubmitMultiple(values: MultipleOptionsFormValues) {
    // Split by new lines and filter empty lines
    const options = values.options
      .split('\n')
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);

    if (options.length === 0) return;

    // Create multiple options
    createMultipleOptions.mutate(
      {
        questionId,
        options
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          multipleForm.reset();
          setOptionsList([]);
        }
      }
    );
  }

  const isPending = createOption.isPending || updateOption.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? 'Edit Option'
              : mode === 'single'
                ? 'Create New Option'
                : 'Create Multiple Options'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the option text'
              : mode === 'single'
                ? 'Add a single answer option'
                : 'Add multiple answer options at once'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'single' ? (
          <Form
            form={singleForm}
            onSubmit={singleForm.handleSubmit(onSubmitSingle)}
            className='space-y-4'
          >
            <FormInput
              control={singleForm.control}
              name='text'
              label='Option Text'
              placeholder='Yes'
              required
            />

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
                    : 'Create'}
              </Button>
            </DialogFooter>
          </Form>
        ) : (
          <Form
            form={multipleForm}
            onSubmit={multipleForm.handleSubmit(onSubmitMultiple)}
            className='space-y-4'
          >
            <FormTextarea
              control={multipleForm.control}
              name='options'
              label='Options'
              placeholder='Enter one option per line&#10;e.g.&#10;Yes&#10;No&#10;Maybe&#10;Not Sure'
              description='Enter one option per line'
              required
            />

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={createMultipleOptions.isPending}>
                {createMultipleOptions.isPending && (
                  <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                )}
                {createMultipleOptions.isPending ? 'Creating...' : 'Create All'}
              </Button>
            </DialogFooter>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
