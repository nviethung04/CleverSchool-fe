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
import { useTypedTranslations } from "@/lib/i18n/client";

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
  const t = useTypedTranslations("manageFeedback");
  const file = formData.files[0];
  
  // Refs for auto-resize textareas
  const contentRef = React.useRef<HTMLTextAreaElement>(null);
  const responseRef = React.useRef<HTMLTextAreaElement>(null);
  const noteRef = React.useRef<HTMLTextAreaElement>(null);
  
  // Function to auto-resize textarea
  const autoResize = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return;
    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;
    const minHeight = 80; // ~3-4 dòng
    textarea.style.height = `${Math.max(minHeight, scrollHeight)}px`;
  };
  
  // Auto-resize on content change
  React.useEffect(() => {
    autoResize(contentRef.current);
  }, [formData.content]);
  
  React.useEffect(() => {
    autoResize(responseRef.current);
  }, [editData.response]);
  
  React.useEffect(() => {
    autoResize(noteRef.current);
  }, [editData.note]);
  
  // Auto-resize on mount if content exists
  React.useEffect(() => {
    if (contentRef.current) {
      autoResize(contentRef.current);
    }
    if (responseRef.current) {
      autoResize(responseRef.current);
    }
    if (noteRef.current) {
      autoResize(noteRef.current);
    }
  }, []);

  const formatFileSize = (bytes?: number) => {
    if (!bytes || isNaN(bytes)) return "";
    const k = 1024;
    const sizes = [
      t("fileSize.bytes"),
      t("fileSize.kb"),
      t("fileSize.mb"),
      t("fileSize.gb"),
    ];
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
    <div className="container mx-auto px-2 md:px-4 py-4 md:py-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("actions.back")}
            </Button>
            <div>
              <CardTitle className="text-2xl font-bold">
                {isEditMode
                  ? t("editTitle")
                  : readOnly
                  ? t("detailTitle")
                  : t("createTitle")}
              </CardTitle>
              <CardDescription>
                {isEditMode
                  ? t("editSubtitle")
                  : readOnly
                  ? t("detailSubtitle")
                  : t("createSubtitle")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tiêu đề */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-medium">
                {t("form.title")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                placeholder={t("form.titlePlaceholder")}
                value={formData.title}
                onChange={(e) => onInputChange("title", e.target.value)}
                className="text-base"
                // required
                readOnly={readOnly || isEditMode}
              />
            </div>

            {/* Nội dung */}
            <div className="space-y-2">
              <Label htmlFor="content" className="text-base font-medium">
                {t("form.content")} <span className="text-red-500">*</span>
              </Label>
              <Textarea
                ref={contentRef}
                id="content"
                placeholder={t("form.contentPlaceholder")}
                value={formData.content}
                onChange={(e) => {
                  onInputChange("content", e.target.value);
                  autoResize(e.target);
                }}
                className="min-h-[80px] text-base resize-none overflow-hidden"
                // required
                readOnly={readOnly || isEditMode}
              />
            </div>

            {/* Edit mode fields - only show when editing */}
            {isEditMode && (
              <>
                {/* Phản hồi */}
                <div className="space-y-2">
                  <Label htmlFor="response" className="text-base font-medium">
                    {t("form.response")}
                  </Label>
                  <Textarea
                    ref={responseRef}
                    id="response"
                    placeholder={t("form.responsePlaceholder")}
                    value={editData.response || ""}
                    onChange={(e) => {
                      onEditFieldChange?.("response", e.target.value);
                      autoResize(e.target);
                    }}
                    className="min-h-[80px] text-base resize-none overflow-hidden"
                  />
                </div>

                {/* Ghi chú */}
                <div className="space-y-2">
                  <Label htmlFor="note" className="text-base font-medium">
                    {t("form.note")}
                  </Label>
                  <Textarea
                    ref={noteRef}
                    id="note"
                    placeholder={t("form.notePlaceholder")}
                    value={editData.note || ""}
                    onChange={(e) => {
                      onEditFieldChange?.("note", e.target.value);
                      autoResize(e.target);
                    }}
                    className="min-h-[80px] text-base resize-none overflow-hidden"
                  />
                </div>

                {/* Loại */}
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-base font-medium">
                    {t("form.type")}
                  </Label>
                  <Select
                    value={editData.type || ""}
                    onValueChange={(value) =>
                      onEditFieldChange?.("type", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("form.typePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{t("type.tech")}</SelectItem>
                      <SelectItem value="2">{t("type.content")}</SelectItem>
                      <SelectItem value="3">{t("type.both")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Upload File - only show when not in edit mode */}
            {!isEditMode && (
              <div className="space-y-2">
                <Label className="text-base font-medium">
                  {t("form.attachments")}
                </Label>
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
                        {t("form.uploadPrompt")}
                      </p>
                      <p className="text-sm text-gray-500">
                        {t("form.uploadHint")}
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
                <Label className="text-base font-medium">
                  {t("form.attachments")}
                </Label>
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
                            {t("form.viewUploadedFile")}
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
                <Label className="text-base font-medium">
                  {t("form.attachments")}
                </Label>
                <div className="p-4 border rounded-lg bg-gray-50 text-center">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {t("form.noAttachments")}
                  </p>
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
                            {t("form.uploading")}
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
                        {t("form.viewUploadedFile")}
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
                  {isEditMode ? t("actions.cancel") : t("actions.back")}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || (file && file.isUploading)}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isEditMode ? t("form.saving") : t("form.submitting")}
                    </>
                  ) : (
                    <>
                      {isEditMode ? (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {t("form.saveChanges")}
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          {t("form.submitFeedback")}
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
