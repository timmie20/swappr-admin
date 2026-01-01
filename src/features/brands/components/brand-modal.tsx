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
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Brand } from '../types/brand.types';
import { useCreateBrand } from '../hooks/use-create-brand';
import { useUpdateBrand } from '../hooks/use-update-brand';
import { Icons } from '@/components/icons';
import { useRouter } from 'next/navigation';

const brandSchema = z.object({
  name: z.string().min(2, 'Brand name must be at least 2 characters')
  // description: z.string().optional()
});

type BrandFormValues = z.infer<typeof brandSchema>;

interface BrandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand?: Brand | null;
}

export function BrandModal({ open, onOpenChange, brand }: BrandModalProps) {
  const isEditMode = !!brand;
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const router = useRouter();

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: brand?.brand_name || ''
      // description: brand?.desc || ''
    }
  });

  function onSubmit(values: BrandFormValues) {
    if (isEditMode && brand) {
      updateBrand.mutate(
        {
          id: brand.id,
          payload: {
            brand_name: values.name
            // description: values.description
          }
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
            router.refresh();
          }
        }
      );
    } else {
      createBrand.mutate(
        {
          brand_name: values.name
          // description: values.description
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
            router.refresh();
          }
        }
      );
    }
  }

  const isPending = isEditMode ? updateBrand.isPending : createBrand.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Brand' : 'Create Brand'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the brand details.'
              : 'Add a new brand to the system.'}
          </DialogDescription>
        </DialogHeader>
        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-6'
        >
          <FormInput
            control={form.control}
            name='name'
            label='Brand Name'
            placeholder='Enter brand name'
            required
          />
          {/* <FormInput
            control={form.control}
            name='description'
            label='Description'
            placeholder='Enter brand description (optional)'
          /> */}
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
                  : 'Please wait'
                : isEditMode
                  ? 'Update'
                  : 'Create Brand'}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
