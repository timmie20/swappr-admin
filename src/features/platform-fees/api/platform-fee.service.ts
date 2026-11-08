import apiClient from '@/lib/api/client';
import {
  EndPromotionBody,
  FeePreview,
  PlatformFeeSettings,
  SetPromotionBody,
  UpdateStandardBody
} from '../types/platform-fee.types';

const BASE = '/admin/settings/platform-fee';

/** Superadmin only. Every write returns the settings as they now stand. */
export const platformFeeApi = {
  get: async (): Promise<PlatformFeeSettings> => {
    const { data } = await apiClient.get<PlatformFeeSettings>(BASE);
    return data;
  },

  preview: async (amountKobo: number): Promise<FeePreview> => {
    const { data } = await apiClient.get<FeePreview>(`${BASE}/preview`, {
      params: { amount_kobo: amountKobo }
    });
    return data;
  },

  updateStandard: async (
    body: UpdateStandardBody
  ): Promise<PlatformFeeSettings> => {
    const { data } = await apiClient.patch<PlatformFeeSettings>(
      `${BASE}/standard`,
      body
    );
    return data;
  },

  setPromotion: async (
    body: SetPromotionBody
  ): Promise<PlatformFeeSettings> => {
    const { data } = await apiClient.put<PlatformFeeSettings>(
      `${BASE}/promotion`,
      body
    );
    return data;
  },

  /** Ends it now. The reason goes in the JSON body. */
  endPromotion: async (
    body: EndPromotionBody
  ): Promise<PlatformFeeSettings> => {
    const { data } = await apiClient.delete<PlatformFeeSettings>(
      `${BASE}/promotion`,
      { data: body }
    );
    return data;
  }
};
