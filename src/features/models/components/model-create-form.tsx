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
import { useRouter } from 'next/navigation';
import * as z from 'zod';
import StorageVariationField from './storage-variation-field';
import { Separator } from '@/components/ui/separator';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { FormTextarea } from '@/components/forms/form-textarea';
import { Form } from '@/components/ui/form';
import { Brand } from '@/features/brands';
import { useCreateModel } from '../hooks/use-create-model';
import { CreateModelDto } from '../types/models.types';
import { Icons } from '@/components/icons';
import { useState } from 'react';
import { uploadImage } from '@/lib/upload-service';
import { toast } from 'sonner';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';
import { IconCheck } from '@tabler/icons-react';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Model name must be at least 5 characters.'
  }),
  brand: z.string(),
  description: z.string().optional(),
  variations: z
    .array(
      z.object({
        storage_capacity: z.coerce.number().int().positive(),
        price: z.coerce.number().positive()
      })
    )
    .min(1, { message: 'Add at least one storage variation.' })
});

export type ModelFormValues = z.infer<typeof formSchema>;

export default function ModelForm({
  pageTitle,
  brands
}: {
  pageTitle: string;
  brands: Brand[];
}) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePublicId, setImagePublicId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const fallbackStorageFields = Array.from({ length: 2 }, () => ({
    storage_capacity: 64,
    price: 0
  }));

  const defaultValues: ModelFormValues = {
    name: '',
    brand: '',
    description: '',
    variations: fallbackStorageFields
  };

  const form = useForm<ModelFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variations'
  });

  const router = useRouter();
  const createModel = useCreateModel();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 3 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) {
      toast.error('Please select an image first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await uploadImage(
        imageFile,
        'models',
        setUploadProgress
      );

      setImageUrl(response.url);
      setImagePublicId(response.public_id);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl(null);
    setImagePublicId(null);
    setUploadProgress(0);
  };

  const formatForPayload = (values: ModelFormValues): CreateModelDto => {
    return {
      brand_id: values.brand,
      model_name: values.name,
      desc: values.description || '',
      image_url: imageUrl || undefined,
      image_public_id: imagePublicId || undefined,
      variations: values.variations
    };
  };

  function onSubmit(values: ModelFormValues) {
    const payload = formatForPayload(values);
    createModel.mutate(payload, {
      onSuccess: () => {
        router.push('/dashboard/model');
      }
    });
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
          {/* Image Upload Section */}
          <div className='space-y-4'>
            <div>
              <label className='text-sm font-medium'>Model Image</label>
              <p className='text-muted-foreground text-xs'>
                Upload an image for this model (max 5MB)
              </p>
            </div>

            {!imagePreview ? (
              <div className='flex items-center gap-4'>
                <input
                  type='file'
                  accept='image/*'
                  onChange={handleImageSelect}
                  className='hidden'
                  id='model-image-input'
                />
                <label htmlFor='model-image-input'>
                  <Button type='button' variant='outline' asChild>
                    <span>
                      <Upload className='mr-2 h-4 w-4' />
                      Select Image
                    </span>
                  </Button>
                </label>
              </div>
            ) : (
              <div className='space-y-4'>
                <div className='relative h-48 w-48 overflow-hidden rounded-lg border'>
                  <Image
                    src={imagePreview}
                    alt='Preview'
                    fill
                    className='object-cover'
                  />
                  <Button
                    type='button'
                    variant='destructive'
                    size='icon'
                    className='absolute top-2 right-2'
                    onClick={handleRemoveImage}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </div>

                {!imageUrl && (
                  <div className='space-y-2'>
                    <Button
                      type='button'
                      onClick={handleImageUpload}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                          Uploading... {uploadProgress}%
                        </>
                      ) : (
                        <>
                          <Upload className='mr-2 h-4 w-4' />
                          Upload Image
                        </>
                      )}
                    </Button>
                    {isUploading && (
                      <div className='bg-secondary h-2 w-full overflow-hidden rounded-full'>
                        <div
                          className='bg-primary h-full transition-all'
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {imageUrl && (
                  <div className='flex items-center gap-2 text-sm text-green-600'>
                    <IconCheck className='h-4 w-4' />
                    Image uploaded successfully
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

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
              options={brands.map((brand) => ({
                value: brand.id,
                label: brand.brand_name
              }))}
              placeholder='Select brand'
              className='w-full'
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
              onClick={() => append({ storage_capacity: 64, price: 0 })}
            >
              Add storage variation
            </Button>
          </div>

          <Button type='submit' disabled={createModel.isPending}>
            {createModel.isPending && (
              <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
            )}
            {createModel.isPending ? 'Creating...' : 'Create Model'}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
