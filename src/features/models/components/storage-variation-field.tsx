import { Button } from '@/components/ui/button';
import {
  FormField,
  FormControl,
  FormMessage,
  FormItem,
  FormLabel
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import type { ModelFormValues } from './model-form';

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
      <FormField
        control={form.control}
        name={`storageVariations.${index}.capacity`}
        render={({ field }) => (
          <FormItem className='flex-1/2'>
            <FormLabel>Capacity (GB)</FormLabel>
            <FormControl>
              <Input
                type='number'
                step='1'
                placeholder='e.g. 128'
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`storageVariations.${index}.price`}
        render={({ field }) => (
          <FormItem className='flex-1/2'>
            <FormLabel>Price</FormLabel>
            <FormControl>
              <Input
                type='number'
                step='1000'
                placeholder='Enter price for this capacity'
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
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
