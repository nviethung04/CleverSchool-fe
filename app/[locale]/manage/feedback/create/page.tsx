"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import CreateFeedbackComponent from "../components/create-feedback";
import { CreateFeedback } from "@/lib/api/feedbacks";
import { uploadFile } from "@/lib/api/questions";
import { useAuth } from "@/lib/context/auth-context";
import { getFeedbackRoute } from "@/lib/utils/route-utils";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("feedback.create");
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
      return t("errors.fileTooLarge", { name: file.name, max: "10MB" });
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
                  name: fileName || f.name,
                  isUploading: false,
                  uploadProgress: 100,
                }
              : f
          ),
        }));
        toast.success(t("upload.success", { name: fileName || file.name }));
      } else {
        throw new Error(t("upload.noUrl"));
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);

      // Remove file from list on upload error
      setFormData((prev) => ({
        ...prev,
        files: prev.files.filter((f) => f.id !== fileId),
      }));

      toast.error(
        error.response?.data?.message || t("upload.error", { name: file.name })
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
      toast.error(t("upload.tooMany", { max: maxFiles }));
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

    toast.success(t("upload.added", { count: validFiles.length }));

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
    toast.success(t("file.removed"));
  };

  const handleSubmit = async (formDataSubmit: CreateFeedbackFormData) => {
    if (isSubmitting) return; // Prevent double submit

    if (!formDataSubmit.title.trim()) {
      toast.error(t("validation.titleRequired"));
      return;
    }

    if (!formDataSubmit.content.trim()) {
      toast.error(t("validation.contentRequired"));
      return;
    }

    // Check any file uploading
    const hasUploadingFiles = formDataSubmit.files.some(
      (file) => file.isUploading
    );
    if (hasUploadingFiles) {
      toast.error(t("validation.waitUploads"));
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data
      const submitData = {
        title: formDataSubmit.title,
        content: formDataSubmit.content,
        // Only send URLs of successfully uploaded files
        file_url: JSON.stringify(
          formDataSubmit.files
            .filter((file) => file.url && !file.isUploading)
            .map((file) => file.url)
        ),
      };

      console.log("Submitting feedback data:", submitData);

      // Create feedback
      const result = await CreateFeedback(submitData);

      if (result) {
        toast.success(t("success.created"));

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
      toast.error(t("error.createFailed"));
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
