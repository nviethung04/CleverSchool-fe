"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, FileText, Loader2, Save, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

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

interface CreateFeedbackProps {
  formData: CreateFeedbackFormData;
  isSubmitting: boolean;
  onInputChange: (field: keyof CreateFeedbackFormData, value: string) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (fileId: string) => void;
  onSubmit: (formData: CreateFeedbackFormData) => void;
  readOnly?: boolean;
  // Edit mode props
  isEditMode?: boolean;
  editData?: {
    response?: string;
    note?: string;
    type?: string;
  };
  onEditFieldChange?: (field: string, value: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  // File display props for edit mode
  existingFiles?: Array<{
    id: string;
    name: string;
    url: string;
    type?: string;
  }>;
}

export default function CreateFeedbackComponent({
  formData,
  isSubmitting,
  onInputChange,
  onFileChange,
  onRemoveFile,
  onSubmit,
  readOnly = false,
  isEditMode = false,
  editData = {},
  onEditFieldChange,
  onSaveEdit,
  onCancelEdit,
  existingFiles = [],
}: CreateFeedbackProps) {
  const router = useRouter();
  const file = formData.files[0];

  const formatFileSize = (bytes?: number) => {
    if (!bytes || isNaN(bytes)) return "";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode) {
      onSaveEdit?.();
      return;
    }

    const hasUploadingFiles = file && file.isUploading;
    if (hasUploadingFiles) return;
    onSubmit(formData);
  };

  const handleCancel = () => {
    if (isEditMode) {
      onCancelEdit?.();
    } else {
      router.back();
    }
  };

  return (
    <div className="max-w-full mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
            <div>
              <CardTitle className="text-2xl font-bold">
                {isEditMode
                  ? "Chỉnh sửa nhận xét"
                  : readOnly
                  ? "Chi tiết nhận xét & phản hồi"
                  : "Tạo nhận xét & phản hồi"}
              </CardTitle>
              <CardDescription>
                {isEditMode
                  ? "Cập nhật thông tin phản hồi, ghi chú và loại nhận xét"
                  : readOnly
                  ? "Xem chi tiết nhận xét, phản hồi và tệp đính kèm."
                  : "Tạo nhận xét hoặc phản hồi mới với tiêu đề, nội dung và tệp đính kèm"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tiêu đề */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-medium">
                Tiêu đề <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="Nhập tiêu đề nhận xét..."
                value={formData.title}
                onChange={(e) => onInputChange("title", e.target.value)}
                className="text-base"
                required
                readOnly={readOnly || isEditMode}
              />
            </div>

            {/* Nội dung */}
            <div className="space-y-2">
              <Label htmlFor="content" className="text-base font-medium">
                Nội dung <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="content"
                placeholder="Nhập nội dung chi tiết..."
                value={formData.content}
                onChange={(e) => onInputChange("content", e.target.value)}
                className="min-h-[100px] text-base resize-none"
                required
                readOnly={readOnly || isEditMode}
              />
            </div>

            {/* Edit mode fields - only show when editing */}
            {isEditMode && (
              <>
                {/* Phản hồi */}
                <div className="space-y-2">
                  <Label htmlFor="response" className="text-base font-medium">
                    Phản hồi
                  </Label>
                  <Textarea
                    id="response"
                    placeholder="Nhập phản hồi cho nhận xét này..."
                    value={editData.response || ""}
                    onChange={(e) =>
                      onEditFieldChange?.("response", e.target.value)
                    }
                    className="min-h-[60px] text-base resize-none"
                  />
                </div>

                {/* Ghi chú */}
                <div className="space-y-2">
                  <Label htmlFor="note" className="text-base font-medium">
                    Ghi chú
                  </Label>
                  <Textarea
                    id="note"
                    placeholder="Nhập ghi chú nội bộ..."
                    value={editData.note || ""}
                    onChange={(e) =>
                      onEditFieldChange?.("note", e.target.value)
                    }
                    className="min-h-[60px] text-base resize-none"
                  />
                </div>

                {/* Loại */}
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-base font-medium">
                    Loại nhận xét
                  </Label>
                  <Select
                    value={editData.type || ""}
                    onValueChange={(value) =>
                      onEditFieldChange?.("type", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại nhận xét" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Tech</SelectItem>
                      <SelectItem value="2">Nội dung</SelectItem>
                      <SelectItem value="3">Tech và nội dung</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Upload File - only show when not in edit mode */}
            {!isEditMode && (
              <div className="space-y-2">
                <Label className="text-base font-medium">Tệp đính kèm</Label>
                {!file && !readOnly && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      onChange={onFileChange}
                      className="hidden"
                      id="file-upload"
                      accept="*/*"
                      multiple={false}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        Chọn tệp hoặc kéo thả vào đây
                      </p>
                      <p className="text-sm text-gray-500">
                        Hỗ trợ mọi định dạng file (PDF, DOC, XLS, PPT, JPG, PNG,
                        MP4, etc.)
                      </p>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* File display - show existing files in edit mode, or uploaded files when not in edit mode */}
            {isEditMode && existingFiles && existingFiles.length > 0 ? (
              // Show existing files in edit mode with same style as detail page
              <div className="space-y-2">
                <Label className="text-base font-medium">Tệp đính kèm</Label>
                <div className="space-y-3">
                  {existingFiles.map((fileItem) => (
                    <div
                      key={fileItem.id}
                      className="mt-4 p-4 border rounded-lg bg-gray-50 flex flex-col items-center gap-2"
                    >
                      <div className="flex items-center gap-3 w-full">
                        {/* File icon or preview */}
                        {fileItem.type?.startsWith("image/") ? (
                          <img
                            src={fileItem.url}
                            alt={fileItem.name}
                            className="w-32 h-32 object-cover rounded border"
                          />
                        ) : (
                          <FileText className="w-10 h-10 text-gray-400" />
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium text-gray-900 truncate">
                            {fileItem.name}
                          </p>
                          <a
                            href={fileItem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 underline block mt-1"
                          >
                            Xem file đã upload
                          </a>
                        </div>

                        {/* Remove the duplicate link on the right */}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : isEditMode && (!existingFiles || existingFiles.length === 0) ? (
              // Show "no files" message in edit mode when there are no existing files
              <div className="space-y-2">
                <Label className="text-base font-medium">Tệp đính kèm</Label>
                <div className="p-4 border rounded-lg bg-gray-50 text-center">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Không có tệp đính kèm</p>
                </div>
              </div>
            ) : !isEditMode && file ? (
              // Show uploaded files when not in edit mode
              <div className="mt-4 p-4 border rounded-lg bg-gray-50 flex flex-col items-center gap-2">
                <div className="flex items-center gap-3 w-full">
                  {/* Preview ảnh */}
                  {file?.preview && file?.type?.startsWith("image/") ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-32 h-32 object-cover rounded border"
                    />
                  ) : (
                    <FileText className="w-10 h-10 text-gray-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-gray-900 truncate">
                      {file?.name || ""}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file?.size ? formatFileSize(file.size) : ""}
                    </p>
                    {/* Upload Status */}
                    {file.isUploading && (
                      <div className="mt-1">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span className="text-xs text-blue-600">
                            Đang tải lên...
                          </span>
                        </div>
                        {file.uploadProgress !== undefined && (
                          <Progress
                            value={file.uploadProgress}
                            className="h-1 mt-1"
                          />
                        )}
                      </div>
                    )}
                    {file.url && !file.isUploading && (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 underline block mt-1"
                      >
                        Xem file đã upload
                      </a>
                    )}
                  </div>
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveFile(file.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      disabled={file.isUploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ) : null}

            {/* Submit Button */}
            {!readOnly && (
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  {isEditMode ? "Hủy" : "Quay lại"}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || (file && file.isUploading)}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isEditMode ? "Đang lưu..." : "Đang gửi..."}
                    </>
                  ) : (
                    <>
                      {isEditMode ? (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Lưu thay đổi
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Gửi nhận xét
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
