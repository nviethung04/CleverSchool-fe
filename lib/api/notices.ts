import axiosInstance from "@/lib/api/axios";

export interface NoticeValue {
    key: string;
    value: string;
}

export interface Notice {
    id: string;
    cover: string;
    title: string;
    description: string;
    content: string;
    created_at: string;
    created_by: string;
    updated_at: string;
    updated_by: string;
    status: boolean;
    type: "system" | "school" | "course" | "class";
}

export interface NoticeListResponse {
    "@type": string;
    notices: Notice[];
    total_count: string;
    page: string;
    page_size: string;
}

export interface NoticeApiResponse {
    code: number;
    message: string;
    data: NoticeListResponse;
    error: string;
}

/**
 * Get list of notices
 */
export async function getNotices(params?: {
    page?: number;
    page_size?: number;
    status?: boolean;
    type?: string;
    search?: string;
}): Promise<NoticeApiResponse> {
    const response = await axiosInstance.get<NoticeApiResponse>("/manage/notices", {
        params,
    });
    return response.data;
}

/**
 * Get a single notice by ID
 */
export async function getNoticeById(id: string): Promise<any> {
    const response = await axiosInstance.get(`/manage/notices/${id}`);
    return response.data;
}

/**
 * Push/send a notice to recipients
 */
export async function pushNotice(noticeId: string, type: string, value: number): Promise<any> {
    const response = await axiosInstance.post(`/v1/push/notices/${noticeId}/send`, {
        type,
        value,
    });
    return response.data;
}

/**
 * Create a new notice
 */
export async function createNotice(notice: Partial<Notice>): Promise<any> {
    const response = await axiosInstance.post("/manage/notices", notice);
    return response.data;
}

/**
 * Update a notice
 */
export async function updateNotice(id: string, notice: Partial<Notice>): Promise<any> {
    const response = await axiosInstance.put(`/manage/notices/${id}`, notice);
    return response.data;
}

/**
 * Delete a notice
 */
export async function deleteNotice(id: string): Promise<any> {
    const response = await axiosInstance.delete(`/manage/notices/${id}`);
    return response.data;
}
