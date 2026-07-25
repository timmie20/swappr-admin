'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/forms/form-input';
import { Icons } from '@/components/icons';
import { signInSchema } from '@/schemas/auth';
import { useLogin } from '@/hooks/services/use-auth';

type SignInFormValues = z.infer<typeof signInSchema>;

export default function SignInForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('callbackUrl') ?? '/dashboard/overview';
  const login = useLogin();
  const router = useRouter();

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' }
  });

  function onSubmit(values: SignInFormValues) {
    login.mutate(values, {
      onSuccess: () => router.push(redirect)
    });
  }

  return (
    <Form
      form={form}
      onSubmit={form.handleSubmit(onSubmit)}
      className='w-full space-y-6'
    >
      <FormInput
        control={form.control}
        name='email'
        type='email'
        label='Email'
        placeholder='you@swappr.com.ng'
        required
      />
      <FormInput
        control={form.control}
        name='password'
        type='password'
        label='Password'
        placeholder='Enter your password'
        required
      />
      <Button type='submit' className='w-full' disabled={login.isPending}>
        {login.isPending && (
          <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
        )}
        {login.isPending ? 'Signing in...' : 'Sign in'}
      </Button>
    </Form>
  );
}
