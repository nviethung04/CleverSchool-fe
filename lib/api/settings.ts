import axiosInstance from "@/lib/api/axios";

export interface SettingKVPair {
  key: string;
  value: string;
}

export interface SettingItem {
  id: string;
  key: string;
  name: string;
  values: SettingKVPair[];
  is_active: boolean;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GetSettingsParams {
  page?: number;
  per_page?: number;
  keyword?: string;
  is_active?: boolean;
}

export interface GetSettingsResult {
  settings: SettingItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface UpsertSettingPayload {
  key: string;
  name: string;
  values: SettingKVPair[];
  is_active: boolean;
}

type ApiEnvelope<T> = {
  code: number | string;
  message?: string;
  error?: string;
  data?: T;
};

type GetSettingsEnvelope = ApiEnvelope<{
  "@type"?: string;
  settings: SettingItem[];
  total_count?: string | number;
}>;

type UpsertSettingEnvelope = ApiEnvelope<SettingItem>;

export async function GetSettingByKey(key: string): Promise<SettingItem | null> {
  try {
    const response = await axiosInstance.get(
      `/manage/settings/by-key/${encodeURIComponent(key)}`
    );
    const data = response.data as UpsertSettingEnvelope;
    if (Number(data.code) !== 200 || !data.data) {
      return null;
    }
    return data.data;
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response
      ?.status;
    if (status === 404) {
      return null;
    }
    throw error;
  }
}

export async function GetSettings(
  params: GetSettingsParams = {}
): Promise<GetSettingsResult> {
  const response = await axiosInstance.get("/manage/settings", {
    params,
  });
  const data = response.data as GetSettingsEnvelope;
  if (Number(data.code) !== 200 || !data.data) {
    throw new Error(data.message || data.error);
  }

  const list = data.data.settings || [];
  const page = params.page || 1;
  const perPage = params.per_page || 10;
  const totalRaw = data.data.total_count;
  const total =
    typeof totalRaw === "string" ? parseInt(totalRaw) : totalRaw || list.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return { settings: list, total, page, totalPages };
}

export async function GetSettingDetail(id: string): Promise<SettingItem> {
  const response = await axiosInstance.get(`/manage/settings/${id}`);
  const data = response.data as UpsertSettingEnvelope;
  if (Number(data.code) !== 200 || !data.data) {
    throw new Error(data.message || data.error);
  }
  return data.data;
}

export async function CreateSetting(
  payload: UpsertSettingPayload
): Promise<SettingItem> {
  const response = await axiosInstance.post("/manage/settings", payload);
  const data = response.data as UpsertSettingEnvelope;
  if (Number(data.code) !== 200 || !data.data) {
    throw new Error(data.message || data.error);
  }
  return data.data;
}

export async function UpdateSetting(
  id: string,
  payload: UpsertSettingPayload
): Promise<SettingItem> {
  const response = await axiosInstance.put(`/manage/settings/${id}`, payload);
  const data = response.data as UpsertSettingEnvelope;
  if (Number(data.code) !== 200 || !data.data) {
    throw new Error(data.message || data.error);
  }
  return data.data;
}

export async function DeleteSetting(id: string): Promise<boolean> {
  const response = await axiosInstance.delete(`/manage/settings/${id}`);
  const data = response.data as ApiEnvelope<unknown>;
  if (Number(data.code) !== 200) {
    throw new Error(data.message || (data as any).error);
  }
  return true;
}
