"use client";

import type React from "react";
import { useState, useRef, useId, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  LucideArrowLeft,
  LucideCheck,
  LucideLoader2,
  LucideX,
  LucideAlertCircle,
  LucideUpload,
  LucideFileText,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useTypedTranslations } from "@/lib/i18n/client";
import { useParams } from "next/navigation";
import { uploadFile } from "@/lib/api/questions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AssessmentCriteriaGroup } from "@/lib/api/group-criteria";

interface AssessmentFormProps {
  // Basic assessment info
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;

  // Actions
  handleSave: () => void;
  isSaving: boolean;

  // Mode
  mode: "create" | "edit";

  // Navigation
  backUrl?: string;

  // Assessment ID for edit mode
  assessmentId?: string | number;
  exerciseId?: string | number;

  // Initial values for edit mode
  initialUploadedFiles?: {
    type: string;
    url: string;
    name?: string;
    backendInfo?: Record<string, any>;
  }[];

  // Assessment meta
  assessmentType: string;
  setAssessmentType: (value: string) => void;
  subjects: Array<{ id: string; name: string }>;
  subjectsLoading?: boolean;
  subjectId: string;
  setSubjectId: (value: string) => void;
  criteriaGroups: AssessmentCriteriaGroup[];
  groupsLoading?: boolean;
  selectedGroupId: string;
  setSelectedGroupId: (value: string) => void;
  studyReports: Array<{ id: string; name: string }>;
  studyReportsLoading?: boolean;
  selectedStudyReportId: string;
  setSelectedStudyReportId: (value: string) => void;
  onFilesChange?: (payload: {
    fileInfos: Record<string, any>[];
    files: string[];
  }) => void;
}

export function AssessmentForm({
  name,
  setName,
  description,
  setDescription,
  handleSave,
  isSaving,
  mode,
  backUrl = "/teacher/assignments",
  assessmentId,
  initialUploadedFiles,
  assessmentType,
  setAssessmentType,
  subjects,
  subjectsLoading = false,
  subjectId,
  setSubjectId,
  criteriaGroups,
  groupsLoading = false,
  selectedGroupId,
  setSelectedGroupId,
  studyReports,
  studyReportsLoading = false,
  selectedStudyReportId,
  setSelectedStudyReportId,
  onFilesChange,
}: AssessmentFormProps) {
  const params = useParams();
  const t = useTypedTranslations("manageAssignments");
  const locale = params?.locale || "vi";
  const title = mode === "create" ? t("assessmentForm.createTitle") : t("assessmentForm.editTitle");
  const subtitle =
    mode === "create" ? t("assessmentForm.createSubtitle") : t("assessmentForm.editSubtitle");
  const saveButtonText =
    mode === "create" ? t("assessmentForm.saveCreate") : t("assessmentForm.saveEdit");

  const { toast } = useToast();
  const [assignmentMode, setAssignmentMode] = useState<
    "question-bank" | "file-upload"
  >(() =>
    initialUploadedFiles && initialUploadedFiles.length > 0
      ? "file-upload"
      : "question-bank"
  );
  const [uploadedFiles, setUploadedFiles] = useState<
    {
      type: string;
      url: string;
      name?: string;
      backendInfo?: Record<string, any>;
    }[]
  >(initialUploadedFiles || []);
  const [uploadingFile, setUploadingFile] = useState(false);
  const moreFilesInputRef = useRef<HTMLInputElement>(null);
  const moreFilesInputId = useId();

  useEffect(() => {
    if (initialUploadedFiles) {
      setUploadedFiles(initialUploadedFiles);
      setAssignmentMode(
        initialUploadedFiles.length > 0 ? "file-upload" : "question-bank"
      );
    }
  }, [initialUploadedFiles]);

  useEffect(() => {
    if (!onFilesChange) return;
    const payload = {
      fileInfos: uploadedFiles
        .map((file) => file.backendInfo)
        .filter((info): info is Record<string, any> => !!info),
      files: uploadedFiles.map((file) => file.url),
    };
    onFilesChange(payload);
  }, [uploadedFiles, onFilesChange]);

  const typeOptions = [
    { value: "mini_test", label: "Bài kiểm tra tháng" },
    { value: "final_exam", label: "Bài kiểm tra cuối kỳ" },
  ];

  if ((mode === "create" && isSaving) || (mode === "edit" && isSaving)) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Skeleton */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-8">
                <div className="mb-6">
                  <Skeleton className="h-8 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                <div className="space-y-6">
                  <Skeleton className="h-12 w-full mb-2" />
                  <Skeleton className="h-20 w-full mb-2" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                  <Skeleton className="h-40 w-full" />
                </div>
              </div>
            </div>
            {/* Sidebar Skeleton */}
            <div className="space-y-6">
              <Skeleton className="h-10 w-40 mb-2" />
              <Skeleton className="h-16 w-32 mb-4" />
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-4 w-40 mb-2" />
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-24 mb-2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-2 sm:px-6 py-8">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-2xl hover:bg-gray-100"
              asChild
            >
              <Link href={backUrl}>
                <LucideArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                {title}
              </h1>
              <p className="text-gray-500 font-medium">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Assessment Information */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {t("assessmentForm.infoTitle")}
                  </h2>
                  <p className="text-gray-500">{t("assessmentForm.infoSubtitle")}</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label
                      htmlFor="name"
                      className="text-sm font-medium text-gray-700"
                    >
                      {t("assessmentForm.nameLabel")}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder={t("assessmentForm.namePlaceholder")}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-2xl border-gray-200 focus:border-green-300 focus:ring-green-200 py-3"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="description"
                      className="text-sm font-medium text-gray-700"
                    >
                      {t("assessmentForm.descriptionLabel")}
                    </Label>
                    <Textarea
                      id="description"
                      placeholder={t("assessmentForm.descriptionPlaceholder")}
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="rounded-2xl border-gray-200 focus:border-green-300 focus:ring-green-200"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-700">
                        Loại bài đánh giá{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={assessmentType}
                        onValueChange={setAssessmentType}
                      >
                        <SelectTrigger className="rounded-2xl border-gray-200 focus:border-green-300 focus:ring-green-200 py-3">
                          <SelectValue placeholder="Chọn loại bài đánh giá" />
                        </SelectTrigger>
                        <SelectContent>
                          {typeOptions.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-700">
                        Chọn môn học <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={subjectId}
                        onValueChange={(value) => {
                          setSubjectId(value);
                        }}
                        disabled={subjectsLoading}
                      >
                        <SelectTrigger className="rounded-2xl border-gray-200 focus:border-green-300 focus:ring-green-200 py-3">
                          <SelectValue
                            placeholder={
                              subjectsLoading
                                ? "Đang tải môn học..."
                                : "Chọn môn học"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.length === 0 ? (
                            <SelectItem value="__no_subject" disabled>
                              Không có môn học
                            </SelectItem>
                          ) : (
                            subjects.map((subject) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-700">
                        Chọn bảng tiêu chí đánh giá điểm
                      </Label>
                      <Select
                        value={selectedGroupId || "__none__"}
                        onValueChange={(value) => {
                          setSelectedGroupId(value === "__none__" ? "" : value);
                        }}
                        disabled={groupsLoading || !subjectId}
                      >
                        <SelectTrigger className="rounded-2xl border-gray-200 focus:border-green-300 focus:ring-green-200 py-3">
                          <SelectValue
                            placeholder={
                              !subjectId
                                ? "Vui lòng chọn môn học trước"
                                : groupsLoading
                                ? "Đang tải bảng tiêu chí..."
                                : "Chọn bảng tiêu chí"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">
                            Không lựa chọn
                          </SelectItem>
                          {criteriaGroups.length === 0 ? (
                            <SelectItem value="__no_group" disabled>
                              Không có bảng tiêu chí phù hợp
                            </SelectItem>
                          ) : (
                            criteriaGroups.map((group) => (
                              <SelectItem
                                key={group.id}
                                value={String(group.id)}
                              >
                                {group.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700">
                      Chọn form báo cáo đánh giá{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={selectedStudyReportId}
                      onValueChange={setSelectedStudyReportId}
                      disabled={studyReportsLoading || !subjectId}
                    >
                      <SelectTrigger className="rounded-2xl border-gray-200 focus:border-green-300 focus:ring-green-200 py-3">
                        <SelectValue
                          placeholder={
                            !subjectId
                              ? "Vui lòng chọn môn học trước"
                              : studyReportsLoading
                              ? "Đang tải form..."
                              : "Chọn form báo cáo"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {studyReports.length === 0 ? (
                          <SelectItem value="__no_report" disabled>
                            Không có form báo cáo phù hợp
                          </SelectItem>
                        ) : (
                          studyReports.map((report) => (
                            <SelectItem key={report.id} value={report.id}>
                              {report.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Upload file bài tập
                  </h2>
                  <p className="text-gray-500">
                    Tải lên file bài tập dưới dạng PDF, Word, hoặc ảnh
                  </p>
                </div>

                <div className="space-y-6">
                  {uploadedFiles.length === 0 ? (
                    <div className="relative border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-purple-400 transition-all duration-200 bg-gradient-to-br from-purple-50/30 to-blue-50/30">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <LucideUpload className="h-8 w-8 text-purple-600" />
                      </div>
                      <div className="space-y-3">
                        <p className="text-lg font-semibold text-gray-900">
                          Kéo thả file vào đây hoặc nhấn để chọn
                        </p>
                        <p className="text-sm text-gray-500 max-w-md mx-auto">
                          Hỗ trợ các định dạng: PDF, DOC, DOCX, PNG, JPG, JPEG
                        </p>
                        <p className="text-xs text-gray-400">
                          Kích thước tối đa: 50MB
                        </p>
                      </div>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={async (e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setUploadingFile(true);
                            const files = Array.from(e.target.files);
                            const results: {
                              type: string;
                              url: string;
                              name?: string;
                              backendInfo?: Record<string, any>;
                            }[] = [];
                            const errors: string[] = [];

                            try {
                              for (const file of files) {
                                try {
                                  if (file.size > 50 * 1024 * 1024) {
                                    errors.push(
                                      `File ${file.name} vượt quá 50MB`
                                    );
                                    continue;
                                  }
                                  const ext = file.name
                                    .split(".")
                                    .pop()
                                    ?.toLowerCase();
                                  let mappedType: string = "image";
                                  if (ext === "pdf") mappedType = "pdf";
                                  else if (ext === "doc" || ext === "docx")
                                    mappedType = "doc";
                                  else if (
                                    [
                                      "png",
                                      "jpg",
                                      "jpeg",
                                      "gif",
                                      "webp",
                                      "bmp",
                                    ].includes(ext || "")
                                  )
                                    mappedType = "image";
                                  // Upload từng file - API trả về code 200 = thành công
                                  const uploadRes = await uploadFile(
                                    file,
                                    "assessment-files"
                                  );

                                  // Kiểm tra code 200 = thành công
                                  if (
                                    uploadRes?.code === 200 &&
                                    uploadRes?.data?.url
                                  ) {
                                    results.push({
                                      type: mappedType,
                                      url: uploadRes.data.url,
                                      name:
                                        uploadRes.data.file_name || file.name,
                                      backendInfo:
                                        uploadRes?.data?.file_info ||
                                        uploadRes?.data?.file ||
                                        uploadRes?.data?.file_infos ||
                                        uploadRes?.data,
                                    });
                                  } else {
                                    // API trả về lỗi (code !== 200)
                                    errors.push(
                                      uploadRes?.message ||
                                        `Không thể tải file ${file.name} lên`
                                    );
                                  }
                                } catch (fileErr: any) {
                                  // Lỗi khi gọi API (500, network error, etc)
                                  errors.push(
                                    fileErr?.response?.data?.message ||
                                      fileErr?.message ||
                                      `Không thể tải file ${file.name} lên`
                                  );
                                }
                              }

                              // Hiển thị kết quả - đơn giản: API 200 = thành công, lỗi = thất bại
                              if (results.length > 0) {
                                // Có ít nhất 1 file thành công (API trả về 200)
                                setUploadedFiles((prev) => [
                                  ...prev,
                                  ...results,
                                ]);
                                toast({
                                  title: "Tải lên thành công",
                                  description: `${results.length} file đã được tải lên`,
                                });
                              } else {
                                // Tất cả file đều lỗi (API trả về 500, etc)
                                toast({
                                  title: "Lỗi upload",
                                  description:
                                    errors[0] || "Không thể tải file lên",
                                  variant: "destructive",
                                });
                              }
                            } catch (err: any) {
                              // Lỗi không mong muốn
                              toast({
                                title: "Lỗi upload",
                                description:
                                  err?.message || "Không thể tải file lên",
                                variant: "destructive",
                              });
                            } finally {
                              // Reset input - safely check if element still exists
                              try {
                                if (
                                  e.target &&
                                  e.target instanceof HTMLInputElement
                                ) {
                                  e.target.value = "";
                                }
                              } catch (resetError) {
                                // Silently handle error if reset fails
                                console.warn(
                                  "Could not reset file input:",
                                  resetError
                                );
                              }
                              setUploadingFile(false);
                            }
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploadingFile}
                      />
                      {uploadingFile && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                          <div className="text-center">
                            <LucideLoader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-700">
                              Đang tải lên...
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-3">
                        {uploadedFiles.map((f, idx) => (
                          <div
                            key={`${f.url}-${idx}`}
                            className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 bg-gray-50"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <LucideFileText className="h-5 w-5 text-green-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate max-w-[280px]">
                                  {f.name || f.url.split("/").pop()}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                    Đã tải lên
                                  </Badge>
                                  <span className="text-xs text-gray-400">
                                    •
                                  </span>
                                  <span className="text-xs text-gray-500 uppercase">
                                    {f.type}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() =>
                                setUploadedFiles((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                )
                              }
                            >
                              <LucideX className="h-5 w-5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={async (e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              setUploadingFile(true);
                              const files = Array.from(e.target.files);
                              const results: {
                                type: string;
                                url: string;
                                name?: string;
                                backendInfo?: Record<string, any>;
                              }[] = [];
                              const errors: string[] = [];

                              try {
                                for (const file of files) {
                                  try {
                                    if (file.size > 50 * 1024 * 1024) {
                                      errors.push(
                                        `File ${file.name} vượt quá 50MB`
                                      );
                                      continue;
                                    }
                                    const ext = file.name
                                      .split(".")
                                      .pop()
                                      ?.toLowerCase();
                                    let mappedType: string = "image";
                                    if (ext === "pdf") mappedType = "pdf";
                                    else if (ext === "doc" || ext === "docx")
                                      mappedType = "doc";
                                    else if (
                                      [
                                        "png",
                                        "jpg",
                                        "jpeg",
                                        "gif",
                                        "webp",
                                        "bmp",
                                      ].includes(ext || "")
                                    )
                                      mappedType = "image";
                                    // Upload từng file - API trả về code 200 = thành công
                                    const uploadRes = await uploadFile(
                                      file,
                                      "assessment-files"
                                    );

                                    // Kiểm tra code 200 = thành công
                                    if (
                                      uploadRes?.code === 200 &&
                                      uploadRes?.data?.url
                                    ) {
                                      results.push({
                                        type: mappedType,
                                        url: uploadRes.data.url,
                                        name:
                                          uploadRes.data.file_name || file.name,
                                        backendInfo:
                                          uploadRes?.data?.file_info ||
                                          uploadRes?.data?.file ||
                                          uploadRes?.data?.file_infos ||
                                          uploadRes?.data,
                                      });
                                    } else {
                                      // API trả về lỗi (code !== 200)
                                      errors.push(
                                        uploadRes?.message ||
                                          `Không thể tải file ${file.name} lên`
                                      );
                                    }
                                  } catch (fileErr: any) {
                                    // Lỗi khi gọi API (500, network error, etc)
                                    errors.push(
                                      fileErr?.response?.data?.message ||
                                        fileErr?.message ||
                                        `Không thể tải file ${file.name} lên`
                                    );
                                  }
                                }

                                // Hiển thị kết quả - đơn giản: API 200 = thành công, lỗi = thất bại
                                if (results.length > 0) {
                                  // Có ít nhất 1 file thành công (API trả về 200)
                                  setUploadedFiles((prev) => [
                                    ...prev,
                                    ...results,
                                  ]);
                                  toast({
                                    title: "Tải lên thành công",
                                    description: `${results.length} file đã được tải lên`,
                                  });
                                } else {
                                  // Tất cả file đều lỗi (API trả về 500, etc)
                                  toast({
                                    title: "Lỗi upload",
                                    description:
                                      errors[0] || "Không thể tải file lên",
                                    variant: "destructive",
                                  });
                                }
                              } catch (err: any) {
                                // Lỗi không mong muốn
                                toast({
                                  title: "Lỗi upload",
                                  description:
                                    err?.message || "Không thể tải file lên",
                                  variant: "destructive",
                                });
                              } finally {
                                // Reset input
                                try {
                                  if (
                                    e.target &&
                                    e.target instanceof HTMLInputElement
                                  ) {
                                    e.target.value = "";
                                  }
                                } catch (resetError) {
                                  console.warn(
                                    "Could not reset file input:",
                                    resetError
                                  );
                                }
                                setUploadingFile(false);
                              }
                            }
                          }}
                          className="hidden"
                          id={moreFilesInputId}
                          ref={moreFilesInputRef}
                          disabled={uploadingFile}
                        />
                        <Button
                          variant="outline"
                          className="rounded-2xl border-gray-200"
                          onClick={() => {
                            if (!uploadingFile) {
                              moreFilesInputRef.current?.click();
                            }
                          }}
                        >
                          Thêm file
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 flex-wrap">
              <Button
                variant="outline"
                className="rounded-2xl border-gray-200 hover:border-gray-300 px-6 py-3 bg-transparent w-full sm:w-auto"
                asChild
              >
                <Link href={backUrl}>{t("common.cancel")}</Link>
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white rounded-2xl px-6 py-3 w-full sm:w-auto"
                onClick={() => {
                  handleSave();
                }}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.saving")}
                  </>
                ) : (
                  <>
                    <LucideCheck className="mr-2 h-4 w-4" />
                    {saveButtonText}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Sidebar - Guidelines */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t("assessmentForm.sidebar.guidelinesTitle")}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {mode === "create"
                      ? t("assessmentForm.sidebar.createSteps")
                      : t("assessmentForm.sidebar.editSteps")}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Bước 1 */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 mb-1">
                        {mode === "create"
                          ? t("assessmentForm.sidebar.step1TitleCreate")
                          : t("assessmentForm.sidebar.step1TitleEdit")}
                      </p>
                      <p className="text-sm text-gray-500">
                        {mode === "create"
                          ? t("assessmentForm.sidebar.step1DescCreate")
                          : t("assessmentForm.sidebar.step1DescEdit")}
                      </p>
                    </div>
                  </div>

                  {/* Bước 2 - thay đổi theo assignmentMode */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 mb-1">
                        {assignmentMode === "file-upload"
                          ? "Tải file từ thiết bị"
                          : mode === "create"
                          ? t("assessmentForm.sidebar.step3TitleCreate")
                          : t("assessmentForm.sidebar.step3TitleEdit")}
                      </p>
                      <p className="text-sm text-gray-500">
                        {assignmentMode === "file-upload"
                          ? "Chọn file bài tập từ máy tính của bạn để upload. Hỗ trợ PDF, Word, ảnh."
                          : mode === "create"
                          ? t("assessmentForm.sidebar.step3DescCreate")
                          : t("assessmentForm.sidebar.step3DescEdit")}
                      </p>
                    </div>
                  </div>

                  {/* Bước 3 - Tạo bài luyện tập */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 mb-1">
                        {mode === "create"
                          ? t("assessmentForm.sidebar.step4TitleCreate")
                          : t("assessmentForm.sidebar.step4TitleEdit")}
                      </p>
                      <p className="text-sm text-gray-500">
                        {mode === "create"
                          ? t("assessmentForm.sidebar.step4DescCreate")
                          : t("assessmentForm.sidebar.step4DescEdit")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* ...phần Important Notes giữ nguyên... */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t("assessmentForm.sidebar.importantNotes")}
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <LucideAlertCircle className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-sm text-blue-700">
                        {t("assessmentForm.sidebar.noteAllFieldsOptionalExceptName")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
