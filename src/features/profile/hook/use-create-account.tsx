import apiClient from '@/lib/api/client';
import { CreateAdminProps } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const createAdmin = async (payload: CreateAdminProps) => {
  const { data } = await apiClient.post('/admins/create', payload);
  return data;
};

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAdminProps) => createAdmin(payload),
    onSuccess: (res: any) => {
      toast.success(res.message || 'Admin created successfully');
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to create account';
      toast.error(message);
    }
  });
}
