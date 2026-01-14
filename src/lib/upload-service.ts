import apiClient from '@/lib/api-client';
import { getClientAuthHeaders } from '@/lib/auth-headers';

export interface UploadImageResponse {
  message: string;
  url: string;
  public_id: string;
}

/**
 * Upload image to Cloudinary via backend
 */
export const uploadImage = async (
  file: File,
  folder: string,
  getToken: () => Promise<string | null>,
  onProgress?: (progress: number) => void
): Promise<UploadImageResponse> => {
  const headers = await getClientAuthHeaders(getToken);

  const formData = new FormData();
  formData.append('file', file);

  const { data } = await apiClient.post<UploadImageResponse>(
    `/upload/image/${folder}`,
    formData,
    {
      headers: {
        ...headers,
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      }
    }
  );

  return data;
};
