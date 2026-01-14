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
import { Variation } from '../types/models.types';
import { useCreateVariation } from '../hooks/use-create-variation';
import { useUpdateVariation } from '../hooks/use-update-variation';
import { Icons } from '@/components/icons';

const variationSchema = z.object({
  storage_capacity: z.coerce.number().positive('Storage must be positive'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  note: z.string().optional()
});

type VariationFormValues = z.infer<typeof variationSchema>;

interface VariationFormModalProps {
  modelId: string;
  variation?: Variation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VariationFormModal({
  modelId,
  variation,
  open,
  onOpenChange
}: VariationFormModalProps) {
  const isEditMode = !!variation;

  const createVariation = useCreateVariation();
  const updateVariation = useUpdateVariation();

  const form = useForm<VariationFormValues>({
    resolver: zodResolver(variationSchema),
    defaultValues: {
      storage_capacity: variation?.storage_capacity || 64,
      price: variation?.price || 0,
      note: variation?.note || ''
    }
  });

  function onSubmit(values: VariationFormValues) {
    if (isEditMode) {
      updateVariation.mutate(
        {
          model_id: modelId,
          variationId: variation.id,
          payload: values
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
          }
        }
      );
    } else {
      createVariation.mutate(
        {
          model_id: modelId,
          ...values
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
          }
        }
      );
    }
  }

  const isPending = createVariation.isPending || updateVariation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Variation' : 'Create New Variation'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the storage variation details'
              : 'Add a new storage variation for this model'}
          </DialogDescription>
        </DialogHeader>

        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4'
        >
          <FormInput
            control={form.control}
            name='storage_capacity'
            label='Storage Capacity (GB)'
            type='number'
            placeholder='e.g. 128'
            required
          />

          <FormInput
            control={form.control}
            name='price'
            label='Price'
            type='number'
            step='0.01'
            placeholder='e.g. 999.99'
            required
          />

          <FormTextarea
            control={form.control}
            name='note'
            label='Note (Optional)'
            placeholder='Add any additional notes...'
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
              {isEditMode
                ? isPending
                  ? 'Updating...'
                  : 'Update'
                : isPending
                  ? 'Creating...'
                  : 'Create'}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
