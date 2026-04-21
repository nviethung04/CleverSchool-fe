import axiosInstance from "./axios";

// Types for Upload API
export interface PresignRequest {
  filename: string;
  content_type: string;
  folder: string;
}

export interface PresignResponse {
  success: boolean;
  data: {
    upload_url: string;
    object_url: string;
    key: string;
    expires_in: number;
  };
}

export interface CompleteUploadRequest {
  filename: string;
  key: string;
  url: string;
  size: number;
  content_type: string;
  user_id: number;
}

export interface CompleteUploadResponseData {
  final_url?: string;
  job_id?: string;
  message?: string;
  id?: number; // Media ID in database
  media_id?: number; // Alternative field name for media ID
}

export interface CompleteUploadResponse {
  success: boolean;
  message: string;
  data?: CompleteUploadResponseData;
}

export interface UploadProgressResponse {
  success: boolean;
  data: {
    job_id: string;
    status: string;
    progress: number;
    message?: string;
    error?: string;
    final_url?: string;
    started_at?: string;
    updated_at?: string;
    completed_at?: string;
  };
}

// API Functions
export const uploadApi = {
  // Get presigned URL for uploading
  presign: async (data: PresignRequest): Promise<PresignResponse> => {
    try {
      const response = await axiosInstance.post("/upload/presign", data);
      return response.data;
    } catch (error) {
      console.error("Error getting presigned URL:", error);
      throw error;
    }
  },

  // Complete upload and record it
  complete: async (
    data: CompleteUploadRequest
  ): Promise<CompleteUploadResponse> => {
    try {
      const response = await axiosInstance.post("/upload/complete", data);
      return response.data;
    } catch (error) {
      console.error("Error completing upload:", error);
      throw error;
    }
  },

  // Get upload progress by job ID
  progress: async (jobId: string): Promise<UploadProgressResponse> => {
    try {
      const response = await axiosInstance.get("/upload/progress", {
        params: { job_id: jobId },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching upload progress:", error);
      throw error;
    }
  },
};
