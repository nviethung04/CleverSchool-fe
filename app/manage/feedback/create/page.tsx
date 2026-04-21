"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import CreateFeedbackComponent from "../components/create-feedback";
import { CreateFeedback } from "@/lib/api/feedbacks";
import { uploadFile } from "@/lib/api/questions";
import { useAuth } from "@/lib/context/auth-context";
import { getFeedbackRoute } from "@/lib/utils/route-utils";

interface FileWithPreview extends File {
  preview?: string;
  id: string;
  url?: string;
  isUploading?: boolean;
  uploadProgress?: number;
}

interface CreateFeedbackFormData {
  title: string;
  content: string;
  files: FileWithPreview[];
}

export default function CreateFeedbackPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreateFeedbackFormData>({
    title: "",
    content: "",
    files: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    field: keyof CreateFeedbackFormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return `File "${file.name}" quá lớn. Kích thước tối đa: 10MB`;
    }
    return null;
  };

  const handleFileUpload = async (file: File, fileId: string) => {
    try {
      // Update file status to uploading
      setFormData((prev) => ({
        ...prev,
        files: prev.files.map((f) =>
          f.id === fileId ? { ...f, isUploading: true, uploadProgress: 0 } : f
        ),
      }));

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setFormData((prev) => ({
          ...prev,
          files: prev.files.map((f) =>
            f.id === fileId &&
            f.uploadProgress !== undefined &&
            f.uploadProgress < 90
              ? { ...f, uploadProgress: f.uploadProgress + 10 }
              : f
          ),
        }));
      }, 200);

      // Call upload API using uploadFile from questions.ts
      const response = await uploadFile(file, "feedback");
      console.log("Upload feedback file response:", response);

      clearInterval(progressInterval);

      // Get URL and file name from response
      const fileUrl = response.data?.url;
      const fileName = response.data?.file_name;

      if (fileUrl) {
        // Update file with URL, file name and complete upload
        setFormData((prev) => ({
          ...prev,
          files: prev.files.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  url: fileUrl,
                  name: fileName || f.name, // Sử dụng tên từ API hoặc giữ tên gốc
                  isUploading: false,
                  uploadProgress: 100,
                }
              : f
          ),
        }));
        toast.success(
          `File "${fileName || file.name}" đã được tải lên thành công`
        );
      } else {
        throw new Error("Không nhận được URL file từ server");
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);

      // Remove file from list on upload error
      setFormData((prev) => ({
        ...prev,
        files: prev.files.filter((f) => f.id !== fileId),
      }));

      toast.error(
        error.response?.data?.message ||
          `Không thể tải file "${file.name}" lên. Vui lòng thử lại.`
      );
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) return;

    const maxFiles = 10;
    if (formData.files.length + files.length > maxFiles) {
      toast.error(`Chỉ có thể tải lên tối đa ${maxFiles} file`);
      return;
    }

    // Validate and create file objects
    const validFiles: File[] = [];
    const newFileObjects: FileWithPreview[] = [];

    Array.from(files).forEach((file) => {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        return;
      }

      validFiles.push(file);

      const fileObject: FileWithPreview = {
        ...file,
        id: Math.random().toString(36).substr(2, 9),
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined,
        isUploading: false,
        uploadProgress: 0,
      };

      newFileObjects.push(fileObject);
    });

    if (validFiles.length === 0) return;

    // Add files to state
    setFormData((prev) => ({
      ...prev,
      files: [...prev.files, ...newFileObjects],
    }));

    toast.success(`${validFiles.length} file(s) đã được thêm`);

    // Upload each file
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const fileObject = newFileObjects[i];
      await handleFileUpload(file, fileObject.id);
    }

    // Reset input
    event.target.value = "";
  };

  const handleRemoveFile = (fileId: string) => {
    setFormData((prev) => {
      const fileToRemove = prev.files.find((f) => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return {
        ...prev,
        files: prev.files.filter((f) => f.id !== fileId),
      };
    });
    toast.success("File đã được xóa");
  };

  const handleSubmit = async (formDataSubmit: CreateFeedbackFormData) => {
    if (isSubmitting) return; // Chặn double submit

    if (!formDataSubmit.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề");
      return;
    }

    if (!formDataSubmit.content.trim()) {
      toast.error("Vui lòng nhập nội dung");
      return;
    }

    // Kiểm tra xem có file nào đang upload không
    const hasUploadingFiles = formDataSubmit.files.some(
      (file) => file.isUploading
    );
    if (hasUploadingFiles) {
      toast.error("Vui lòng đợi tất cả file tải lên hoàn tất");
      return;
    }

    setIsSubmitting(true);

    try {
      // Chuẩn bị dữ liệu gửi lên API
      const submitData = {
        title: formDataSubmit.title,
        content: formDataSubmit.content,
        // Chỉ gửi URL của các file đã upload thành công, chuyển thành JSON string
        file_url: JSON.stringify(
          formDataSubmit.files
            .filter((file) => file.url && !file.isUploading)
            .map((file) => file.url)
        ),
      };

      console.log("Submitting feedback data:", submitData);

      // Gọi API tạo feedback
      const result = await CreateFeedback(submitData);

      if (result) {
        toast.success("Nhận xét đã được tạo thành công!");

        // Cleanup preview URLs
        formData.files.forEach((file) => {
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
        });

        // Reset form
        setFormData({ title: "", content: "", files: [] });

        // Navigate back to feedback list
        router.push(getFeedbackRoute(user));
      }
    } catch (error) {
      console.error("Error creating feedback:", error);
      toast.error("Có lỗi xảy ra khi tạo nhận xét");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CreateFeedbackComponent
      formData={formData}
      isSubmitting={isSubmitting}
      onInputChange={handleInputChange}
      onFileChange={handleFileChange}
      onRemoveFile={handleRemoveFile}
      onSubmit={handleSubmit}
    />
  );
}
