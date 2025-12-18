import apiClient from '@/lib/api-client';
import { getClientAuthHeaders } from '@/lib/auth-headers';
import { CreateAdminProps } from '@/types';
import { useAuth } from '@clerk/nextjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const createAdmin = async (
  payload: CreateAdminProps,
  getToken: () => Promise<string | null>
) => {
  const headers = await getClientAuthHeaders(getToken);
  const { data } = await apiClient.post('/admins/create', payload, { headers });
  return data;
};

export function useCreateAccount() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAdminProps) => createAdmin(payload, getToken),
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
