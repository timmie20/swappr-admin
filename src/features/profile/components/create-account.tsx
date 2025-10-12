'use client';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { CreateAdminProps } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const formSchema = z.object({
  firstName: z.string().min(3, {
    message: 'Firstname must be at least 3 characters.'
  }),
  lastName: z.string().min(3, {
    message: 'Lastname must be at least 3 characters.'
  }),
  role: z.string(),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(64, 'Password must be less than 64 characters')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[a-z]/, 'Password must include at least one lowercase letter')
    .regex(/[0-9]/, 'Password must include at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must include at least one special character'
    )
});

export default function CreateAccount() {
  const defaultValues: CreateAdminProps = {
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    password: ''
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }
  return (
    <Card className='max-w-lg'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          Provide All Details
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-8'
        >
          <FormInput
            control={form.control}
            name='firstName'
            label='First Name'
            placeholder='Enter first name'
            required
          />
          <FormInput
            control={form.control}
            name='lastName'
            label='Last Name'
            placeholder='Enter last name'
            required
          />
          <FormInput
            control={form.control}
            name='email'
            label='Email address'
            placeholder='Enter a valid email address'
            type='email'
            required
          />

          <FormSelect
            control={form.control}
            name='role'
            label='Role'
            placeholder='Select Role'
            options={[
              { label: 'Admin', value: 'admin' },
              { label: 'Super Admin', value: 'superadmin' }
            ]}
            required
            className='w-full flex-1'
          />
          <FormInput
            control={form.control}
            name='password'
            label='Password'
            placeholder='Enter a password'
            required
          />

          <Button type='submit'>Create Account</Button>
        </Form>
      </CardContent>
    </Card>
  );
}
