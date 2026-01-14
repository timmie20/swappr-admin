import { Button } from '@/components/ui/button';
import { UseFormReturn } from 'react-hook-form';
import type { ModelFormValues } from './model-create-form';
import { FormInput } from '@/components/forms/form-input';

type STVProps = {
  index: number;
  form: UseFormReturn<ModelFormValues>;
  onRemove: (index: number) => void;
};

export default function StorageVariationField({
  index,
  form,
  onRemove
}: STVProps) {
  return (
    <div className='flex w-full items-end gap-x-4 rounded-sm border-[1px] p-3'>
      <FormInput
        control={form.control}
        name={`variations.${index}.storage_capacity`}
        label='Capacity (GB)'
        type='number'
        step='1'
        placeholder='e.g. 128'
        className='flex-1/2'
        required
      />
      <FormInput
        control={form.control}
        name={`variations.${index}.price`}
        label='Price'
        type='number'
        placeholder='Enter price for this capacity'
        className='flex-1/2'
        required
      />

      <Button
        type='button'
        variant='destructive'
        onClick={() => onRemove(index)}
        className='w-fit'
      >
        Remove
      </Button>
    </div>
  );
}
