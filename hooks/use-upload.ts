"use client";
//comment-disable no-console
import { useMutation } from "@tanstack/react-query";
import {
  uploadApi,
  type PresignRequest,
  type CompleteUploadRequest,
} from "@/lib/api/upload";
import { getCurrentUser } from "@/lib/api/auth";

const generateFilename = (file: File) => {
  const ext = file.name.split(".").pop();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
};

export const useUpload = () => {
  const presignMutation = useMutation({
    mutationFn: (data: PresignRequest) => uploadApi.presign(data),
  });

  const completeMutation = useMutation({
    mutationFn: (data: CompleteUploadRequest) => uploadApi.complete(data),
  });

  const uploadFile = async (file: File, path?: string) => {
    if (!file) return null;

    const filename = generateFilename(file);
    const user = getCurrentUser();

    try {
      // 1. Presign
      console.log("Step 1: Getting presigned URL...");
      const presignResponse = await presignMutation.mutateAsync({
        filename,
        content_type: file.type || "application/octet-stream",
        folder: path || "uploads",
      });

      if (!presignResponse.success || !presignResponse.data) {
        throw new Error("Failed to get presigned URL");
      }

      const { upload_url, object_url, key } = presignResponse.data;
      console.log("Step 1: Presigned URL received, key:", key);

      // 2. Upload to S3
      console.log("Step 2: Uploading to S3...");
      const s3Response = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      console.log("Step 2: S3 upload response status:", s3Response.status);

      if (!s3Response.ok) {
        const errorText = await s3Response.text();
        throw new Error(`S3 upload failed: ${s3Response.status} ${errorText}`);
      }

      console.log("Step 2: S3 upload successful!");

      // 3. Complete
      console.log("Step 3: Calling complete API...");
      const completePayload = {
        filename,
        key,
        url: object_url,
        size: file.size,
        content_type: file.type,
        user_id: user?.id ? Number(user.id) : 0,
      };
      console.log("Complete payload:", completePayload);

      const completeResponse = await completeMutation.mutateAsync(completePayload);

      console.log("Step 3: Complete API response:", completeResponse);

      if (!completeResponse.success) {
        throw new Error(completeResponse.message);
      }

      const finalUrl = completeResponse.data?.final_url ?? object_url;

      // Tạo file_info từ key (path) - sử dụng id = 0
      const fileInfo = {
        id: 0,
        disk: "public",
        path: key, // Sử dụng key làm path
      };

      console.log("Upload completed successfully!");
      console.log("Final URL:", finalUrl);
      console.log("File Info:", fileInfo);

      // Trả về object với URL và file info
      return {
        url: finalUrl,
        data: {
          url: finalUrl,
          file_info: fileInfo,
        },
      };
    } catch (error) {
      console.error("Error in uploadFile:", error);
      throw error;
    }
  };

  return {
    uploadFile,
    isUploading: presignMutation.isPending || completeMutation.isPending,
  };
};
