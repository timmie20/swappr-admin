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
import { useUpdateBrand } from '../hooks/use-update-brand';
import { Icons } from '@/components/icons';
import { useRouter } from 'next/navigation';

const editBrandSchema = z.object({
  name: z.string().min(2, 'Brand name must be at least 2 characters')
});

type EditBrandFormValues = z.infer<typeof editBrandSchema>;

interface EditBrandModalProps {
  brand: Brand;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditBrandModal({
  brand,
  open,
  onOpenChange
}: EditBrandModalProps) {
  const updateBrand = useUpdateBrand();
  const router = useRouter();

  const form = useForm<EditBrandFormValues>({
    resolver: zodResolver(editBrandSchema),
    values: {
      name: brand.brand_name
    }
  });

  function onSubmit(values: EditBrandFormValues) {
    updateBrand.mutate(
      {
        id: brand.id,
        payload: { brand_name: values.name }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Brand</DialogTitle>
          <DialogDescription>Update the brand name</DialogDescription>
        </DialogHeader>

        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4'
        >
          <FormInput
            control={form.control}
            name='name'
            label='Brand Name'
            placeholder='e.g. Apple, Samsung'
            required
          />

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={updateBrand.isPending}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={updateBrand.isPending}>
              {updateBrand.isPending && (
                <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
              )}
              {updateBrand.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
