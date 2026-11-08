import apiClient from '@/lib/api/client';
import {
  AdminProductDetail,
  AdminProductRow,
  Page,
  ProductAction,
  QueryAdminProductsParams
} from '../types/product.types';

/**
 * Admin product views (admin + superadmin). The views are read-only; the
 * actions go through /products, which audits them. Every admin action
 * carries a reason in the JSON body (DELETE included, so it stays out of
 * access logs).
 */
export const adminProductsApi = {
  getAll: async (
    params: QueryAdminProductsParams
  ): Promise<Page<AdminProductRow>> => {
    const { data } = await apiClient.get<Page<AdminProductRow>>(
      '/admin/products',
      // Booleans go as "true"/"false", which is what the API expects
      { params }
    );
    return data;
  },

  /** Not wrapped in { data } (unlike the vendor detail). 404 if unknown. */
  getById: async (productId: string): Promise<AdminProductDetail> => {
    const { data } = await apiClient.get<AdminProductDetail>(
      `/admin/products/${productId}`
    );
    return data;
  },
  runAction: async (
    productId: string,
    action: ProductAction,
    reason: string
  ): Promise<{ message: string }> => {
    const base = `/products/${productId}`;
    const send = async (request: Promise<{ data: { message: string } }>) =>
      (await request).data;
    switch (action) {
      case 'publish':
      case 'unpublish':
        // The intended state: 409 PRODUCT_ALREADY_IN_STATE if it's there
        return send(
          apiClient.patch(`${base}/toggle-publish`, {
            is_published: action === 'publish',
            reason
          })
        );
      case 'archive':
        return send(apiClient.delete(`${base}/archive`, { data: { reason } }));
      case 'restore':
        return send(apiClient.post(`${base}/restore`, { reason }));
      case 'delete':
        return send(apiClient.delete(`${base}/delete`, { data: { reason } }));
    }
  }
};
