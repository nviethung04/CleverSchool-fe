"use client";

import type React from "react";
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  LucideUpload,
  LucideFile,
  LucideFileText,
  LucideVideo,
  LucideImage,
  LucideX,
  LucideCheck,
  LucideAlertCircle,
  LucideLink,
  FilePlus2Icon as LucideFilePresentation,
  LucidePlus,
  LucideTrash2,
  LucideCopy,
  LucideGripVertical,
  AudioLinesIcon as LucideAudio,
  LucideBookOpen,
  LucideGraduationCap,
  LucideGamepad2,
  LucideHeadphones,
  LucideInfo,
  LucideEye,
  LucideSave,
  LucideArchive,
} from "lucide-react";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { uploadFile } from "@/lib/api/questions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomToast } from "@/components/ui/CustomToast";

// Định nghĩa các loại file được phép upload
const ALLOWED_VIDEO_TYPES = [".mp4", ".avi", ".mov", ".wmv", ".webm"];
const ALLOWED_AUDIO_TYPES = [".mp3", ".wav", ".ogg", ".m4a"];
const ALLOWED_IMAGE_TYPES = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const ALLOWED_DOCUMENT_TYPES = [".pdf", ".doc", ".docx", ".ppt", ".pptx"];
const ALLOWED_ARCHIVE_TYPES = [".zip", ".rar"];
const ALLOWED_H5P_TYPES = [".h5p"];
const MAX_FILE_SIZE = 1000 * 1024 * 1024;
const MAX_COVER_IMAGE_SIZE = 5 * 1024 * 1024;

interface LessonSection {
  id: string;
  title: string;
  type: string;
  contentType: string;
  url: string;
  teacherNotes: string;
  studentInstructions: string;
  files: File[];
  time: number;
  tags: string[];
  fileUrl?: string;
  originalId?: number;
  sortPosition?: number;
}

interface LectureFormProps {
  mode: "create" | "edit";
  lectureId?: string;
  initialData?: {
    title: string;
    description: string;
    status: "1" | "2";
    coverImageUrl: string;
    sections: LessonSection[];
  };
  onSubmit: (data: {
    title: string;
    description: string;
    status: "1" | "2";
    coverImageUrl: string;
    sections: LessonSection[];
    totalTime: number;
  }) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitProgress?: number;
  submitStatus?: "idle" | "uploading" | "success" | "error";
}

export default function LectureForm({
  mode,
  lectureId,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitProgress = 0,
  submitStatus = "idle",
}: LectureFormProps) {
  const [lessonTitle, setLessonTitle] = useState(initialData?.title || "");
  const [lessonDescription, setLessonDescription] = useState(
    initialData?.description || ""
  );
  const [lessonStatus, setLessonStatus] = useState<"1" | "2">(
    initialData?.status || "1"
  );
  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string>(
    initialData?.coverImageUrl || ""
  );
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const [lessonSections, setLessonSections] = useState<LessonSection[]>(
    initialData?.sections || [
      {
        id: "section-1",
        title: "Warm Up",
        type: "video",
        contentType: "youtube",
        url: "",
        teacherNotes:
          "Bắt đầu bài học bằng video để thu hút sự chú ý của học sinh.",
        studentInstructions: "Xem video và chuẩn bị trả lời các câu hỏi.",
        files: [],
        time: 10,
        tags: ["warm-up", "introduction"],
      },
      {
        id: "section-2",
        title: "Presentation",
        type: "slides",
        contentType: "powerpoint",
        url: "",
        teacherNotes:
          "Sử dụng các slide để giới thiệu từ vựng và cấu trúc ngữ pháp mới.",
        studentInstructions: "Ghi chú các từ vựng và cấu trúc ngữ pháp mới.",
        files: [],
        time: 15,
        tags: ["presentation", "vocabulary"],
      },
      {
        id: "section-3",
        title: "Practice",
        type: "interactive",
        contentType: "quiz",
        url: "",
        teacherNotes:
          "Hướng dẫn học sinh thực hành với các hoạt động tương tác.",
        studentInstructions: "Hoàn thành các hoạt động theo hướng dẫn.",
        files: [],
        time: 15,
        tags: ["practice", "activity"],
      },
    ]
  );
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const totalTime = lessonSections.reduce(
    (total, section) => total + section.time,
    0
  );

  // Drag and drop state
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(
    null
  );

  // Custom toast state
  const [toast, setToast] = useState<{
    open: boolean;
    type: "success" | "error" | "info";
    message: string;
  }>({ open: false, type: "info", message: "" });

  // Helper: Kiểm tra loại file có được phép upload không
  const isFileTypeAllowed = (file: File, allowedTypes: string[]): boolean => {
    const fileName = file.name.toLowerCase();
    return allowedTypes.some((ext) => fileName.endsWith(ext));
  };

  // Helper: Kiểm tra kích thước file có vượt quá giới hạn không
  const isFileSizeAllowed = (file: File, maxSize: number): boolean => {
    return file.size <= maxSize;
  };

  // Helper to show custom toast
  const showCustomToast = (
    type: "success" | "error" | "info",
    message: string
  ) => {
    setToast({ open: true, type, message });
  };

  // Xử lý khi chọn ảnh cover
  const handleCoverImageChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!isFileTypeAllowed(file, ALLOWED_IMAGE_TYPES)) {
        showCustomToast(
          "error",
          "Vui lòng chọn file ảnh (jpg, jpeg, png, gif, webp). Loại file không được hỗ trợ."
        );
        return;
      }

      if (!isFileSizeAllowed(file, MAX_COVER_IMAGE_SIZE)) {
        showCustomToast(
          "error",
          `Kích thước ảnh cover không được vượt quá ${
            MAX_COVER_IMAGE_SIZE / (1024 * 1024)
          }MB. File quá lớn.`
        );
        return;
      }

      setCoverImage(file);
      const objectUrl = URL.createObjectURL(file);
      setCoverImageUrl(objectUrl);
      setUploadingCover(true);

      try {
        const uploadResponse = await uploadFile(file, "lecture-covers");
        if (uploadResponse.error) throw new Error(uploadResponse.error);

        const fileUrl = uploadResponse?.url || uploadResponse?.data?.url;
        if (!fileUrl) throw new Error("Không nhận được URL file từ server");

        setCoverImageUrl(fileUrl);
        showCustomToast("success", "Ảnh cover đã được tải lên thành công.");
      } catch (error: any) {
        showCustomToast(
          "error",
          error.message || "Không thể tải lên ảnh cover. Vui lòng thử lại."
        );
      } finally {
        setUploadingCover(false);
      }
    },
    [toast]
  );

  // Xử lý khi xóa ảnh cover
  const handleRemoveCoverImage = useCallback(() => {
    setCoverImage(null);
    setCoverImageUrl("");
    if (coverImageInputRef.current) coverImageInputRef.current.value = "";
  }, []);

  // Xử lý khi chọn file cho một phần cụ thể
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, sectionId: string) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const section = lessonSections.find((s) => s.id === sectionId);
      if (!section) return;

      if (
        !isFileTypeAllowed(file, [
          ...ALLOWED_VIDEO_TYPES,
          ...ALLOWED_AUDIO_TYPES,
          ...ALLOWED_DOCUMENT_TYPES,
          ...ALLOWED_ARCHIVE_TYPES,
          ...ALLOWED_H5P_TYPES,
        ])
      ) {
        showCustomToast(
          "error",
          "Vui lòng chọn file video, audio, PDF, DOCX, PPTX, ZIP, RAR hoặc H5P. Loại file không được hỗ trợ."
        );
        return;
      }

      if (!isFileSizeAllowed(file, MAX_FILE_SIZE)) {
        showCustomToast(
          "error",
          `Kích thước file không được vượt quá ${
            MAX_FILE_SIZE / (1024 * 1024)
          }MB. File quá lớn.`
        );
        return;
      }

      const newFiles = [file];
      setLessonSections((prev) =>
        prev.map((section) =>
          section.id === sectionId ? { ...section, files: newFiles } : section
        )
      );
      setIsUploading((prev) => ({ ...prev, [sectionId]: true }));

      try {
        // Xác định path dựa trên contentType
        let uploadPath = "lecture-files";
        if (section?.contentType === "powerpoint") {
          uploadPath = "power_point";
        } else if (section?.contentType === "h5p") {
          uploadPath = "h5p";
        }

        const uploadResponse = await uploadFile(file, uploadPath);
        if (uploadResponse.error) throw new Error(uploadResponse.error);

        const fileUrl = uploadResponse?.url || uploadResponse?.data?.url;
        if (!fileUrl) throw new Error("Không nhận được URL file từ server");

        setLessonSections((prev) =>
          prev.map((section) =>
            section.id === sectionId
              ? { ...section, fileUrl, url: fileUrl }
              : section
          )
        );
        showCustomToast(
          "success",
          `File ${file.name} đã được tải lên thành công.`
        );
      } catch (error: any) {
        showCustomToast(
          "error",
          error.message || "Không thể tải lên file. Vui lòng thử lại."
        );
        setLessonSections((prev) =>
          prev.map((section) =>
            section.id === sectionId ? { ...section, files: [] } : section
          )
        );
      } finally {
        setIsUploading((prev) => ({ ...prev, [sectionId]: false }));
      }
    },
    [lessonSections, toast]
  );

  // Xử lý khi xóa file
  const handleRemoveFile = useCallback(
    (sectionId: string, fileIndex: number) => {
      setLessonSections((prev) =>
        prev.map((section) => {
          if (section.id === sectionId) {
            const newFiles = section.files.filter((_, i) => i !== fileIndex);
            return {
              ...section,
              files: newFiles,
              // Đồng bộ: khi xóa file, cả fileUrl và url đều bị xóa
              fileUrl: newFiles.length === 0 ? "" : section.fileUrl,
              url: newFiles.length === 0 ? "" : section.url,
            };
          }
          return section;
        })
      );
    },
    []
  );

  // Xử lý khi thêm phần mới
  const handleAddSection = useCallback(() => {
    if (lessonSections.length >= 10) {
      showCustomToast(
        "error",
        "Bạn chỉ có thể thêm tối đa 10 phần! Giới hạn phần."
      );
      return;
    }

    const newId = `section-new-${Date.now()}`;
    const newSection: LessonSection = {
      id: newId,
      title: `Activity ${lessonSections.length + 1}`,
      type: "interactive",
      contentType: "quiz",
      url: "",
      teacherNotes: "Hướng dẫn cho giáo viên.",
      studentInstructions: "Hướng dẫn cho học sinh.",
      files: [],
      time: 10,
      tags: ["activity"],
      sortPosition: lessonSections.length + 1,
    };

    setLessonSections((prev) => [...prev, newSection]);
  }, [lessonSections.length, toast]);

  // Xử lý khi xóa phần
  const handleRemoveSection = useCallback(
    (sectionId: string) => {
      if (lessonSections.length <= 1) {
        showCustomToast(
          "error",
          "Bạn phải có ít nhất 1 phần! Số lượng tối thiểu."
        );
        return;
      }
      setLessonSections((prev) =>
        prev.filter((section) => section.id !== sectionId)
      );
    },
    [lessonSections.length, toast]
  );

  // Xử lý khi cập nhật thông tin phần
  const handleUpdateSection = useCallback(
    (sectionId: string, field: keyof LessonSection, value: any) => {
      setLessonSections((prev) =>
        prev.map((section) => {
          if (section.id === sectionId) {
            // Xử lý đặc biệt cho URL: đồng bộ giữa tab "Tệp" và tab "Liên kết"
            if (field === "url") {
              return {
                ...section,
                url: value,
                // Đồng bộ fileUrl với URL để 2 tab luôn hiển thị giống nhau
                fileUrl: value,
              };
            }

            return { ...section, [field]: value };
          }
          return section;
        })
      );
    },
    []
  );

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, sectionId: string) => {
    setDraggedSectionId(sectionId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", sectionId);
  };

  const handleDragOver = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSectionId(sectionId);
  };

  const handleDragLeave = () => {
    setDragOverSectionId(null);
  };

  const handleDrop = (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();

    if (!draggedSectionId || draggedSectionId === targetSectionId) {
      setDraggedSectionId(null);
      setDragOverSectionId(null);
      return;
    }

    const draggedIndex = lessonSections.findIndex(
      (section) => section.id === draggedSectionId
    );
    const targetIndex = lessonSections.findIndex(
      (section) => section.id === targetSectionId
    );

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newSections = [...lessonSections];
    const [draggedSection] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, draggedSection);

    // Update sort positions
    const updatedSections = newSections.map((section, index) => ({
      ...section,
      sortPosition: index + 1,
    }));

    setLessonSections(updatedSections);
    setDraggedSectionId(null);
    setDragOverSectionId(null);
  };

  const handleDragEnd = () => {
    setDraggedSectionId(null);
    setDragOverSectionId(null);
  };

  // Xử lý khi nhân đôi phần
  const handleDuplicateSection = useCallback(
    (sectionId: string) => {
      if (lessonSections.length >= 10) {
        showCustomToast(
          "error",
          "Bạn chỉ có thể thêm tối đa 10 phần! Giới hạn phần."
        );
        return;
      }

      const sectionToDuplicate = lessonSections.find(
        (section) => section.id === sectionId
      );
      if (!sectionToDuplicate) return;

      const newId = `section-new-${Date.now()}`;
      const duplicatedSection: LessonSection = {
        ...sectionToDuplicate,
        id: newId,
        title: `${sectionToDuplicate.title} (Copy)`,
        files: [],
        fileUrl: "",
        // Reset URL khi duplicate để tránh nhầm lẫn
        url: "",
        originalId: undefined, // Remove original ID for new section
        sortPosition: lessonSections.length + 1,
      };

      const index = lessonSections.findIndex(
        (section) => section.id === sectionId
      );
      const newSections = [...lessonSections];
      newSections.splice(index + 1, 0, duplicatedSection);

      // Update sort positions
      const updatedSections = newSections.map((section, idx) => ({
        ...section,
        sortPosition: idx + 1,
      }));

      setLessonSections(updatedSections);
    },
    [lessonSections, toast]
  );

  // Lấy icon cho loại file
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return <LucideFileText className="h-6 w-6 text-red-500" />;
      case "doc":
      case "docx":
        return <LucideFileText className="h-6 w-6 text-blue-500" />;
      case "ppt":
      case "pptx":
        return <LucideFilePresentation className="h-6 w-6 text-orange-500" />;
      case "mp4":
      case "avi":
      case "mov":
      case "wmv":
      case "webm":
        return <LucideVideo className="h-6 w-6 text-purple-500" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
        return <LucideImage className="h-6 w-6 text-green-500" />;
      case "mp3":
      case "wav":
      case "ogg":
      case "m4a":
        return <LucideAudio className="h-6 w-6 text-pink-500" />;
      case "zip":
      case "rar":
        return <LucideArchive className="h-6 w-6 text-yellow-500" />;
      default:
        return <LucideFile className="h-6 w-6 text-gray-500" />;
    }
  };

  // Lấy icon cho loại nội dung
  const getSectionIcon = (type: string) => {
    switch (type) {
      case "video":
        return <LucideVideo className="h-5 w-5 text-blue-500" />;
      case "slides":
        return <LucideFilePresentation className="h-5 w-5 text-orange-500" />;
      case "pdf":
        return <LucideFileText className="h-5 w-5 text-red-500" />;
      case "audio":
        return <LucideHeadphones className="h-5 w-5 text-pink-500" />;
      case "scorm":
        return <LucideGraduationCap className="h-5 w-5 text-green-500" />;
      case "interactive":
        return <LucideGamepad2 className="h-5 w-5 text-purple-500" />;
      default:
        return <LucideBookOpen className="h-5 w-5 text-gray-500" />;
    }
  };

  // Lấy kích thước file dưới dạng chuỗi
  const getFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    else if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    else return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Lấy danh sách các loại file được phép upload
  const getAllowedFileTypes = () => {
    return [
      ...ALLOWED_VIDEO_TYPES,
      ...ALLOWED_AUDIO_TYPES,
      ...ALLOWED_DOCUMENT_TYPES,
      ...ALLOWED_ARCHIVE_TYPES,
      ...ALLOWED_H5P_TYPES,
    ].join(", ");
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!lessonTitle.trim()) {
      showCustomToast("error", "Vui lòng điền tiêu đề bài giảng");
      return;
    }

    if (lessonSections.length === 0) {
      showCustomToast("error", "Vui lòng thêm ít nhất một phần cho bài giảng");
      return;
    }

    try {
      await onSubmit({
        title: lessonTitle,
        description: lessonDescription,
        status: lessonStatus,
        coverImageUrl,
        sections: lessonSections,
        totalTime,
      });
      showCustomToast(
        "success",
        mode === "create"
          ? "Tải lên thành công! Bài giảng đã được lưu vào hệ thống"
          : "Cập nhật thành công! Bài giảng đã được cập nhật và lưu vào hệ thống"
      );
    } catch (error) {
      showCustomToast(
        "error",
        mode === "create"
          ? "Không thể tạo bài giảng. Vui lòng thử lại"
          : "Không thể cập nhật bài giảng. Vui lòng thử lại"
      );
    }
  };

  if (isSubmitting) {
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
      {toast.open && (
        <CustomToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        />
      )}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-12">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              {mode === "create" ? "Tạo bài giảng mới" : "Chỉnh sửa bài giảng"}
            </h1>
            <p className="text-gray-500 font-medium">
              {mode === "create"
                ? "Thiết kế bài giảng với nội dung đa phương tiện"
                : "Cập nhật nội dung bài giảng với đa phương tiện"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-400 to-blue-600"></div>
                <div className="p-8">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Thông tin cơ bản
                    </h3>
                    <p className="text-gray-500">
                      Thông tin chính của bài giảng
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="title"
                        className="text-sm font-medium text-gray-700"
                      >
                        Tiêu đề bài giảng{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        placeholder="Nhập tiêu đề bài giảng"
                        value={lessonTitle}
                        onChange={(e) => setLessonTitle(e.target.value)}
                        className="rounded-2xl border-gray-200 focus:border-blue-300 focus:ring-blue-200 py-3"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="description"
                        className="text-sm font-medium text-gray-700"
                      >
                        Mô tả bài giảng
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Nhập mô tả chi tiết về bài giảng"
                        rows={4}
                        value={lessonDescription}
                        onChange={(e) => setLessonDescription(e.target.value)}
                        className="rounded-2xl border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="status"
                        className="text-sm font-medium text-gray-700"
                      >
                        Trạng thái
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          setLessonStatus(value as "1" | "2")
                        }
                        value={lessonStatus}
                      >
                        <SelectTrigger
                          id="status"
                          className="rounded-2xl border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                        >
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-gray-200">
                          <SelectItem value="1" className="rounded-xl">
                            Xuất bản
                          </SelectItem>
                          <SelectItem value="2" className="rounded-xl">
                            Bản nháp
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Ảnh cover
                      </Label>
                      <div className="mt-1">
                        {coverImageUrl ? (
                          <div className="relative rounded-2xl overflow-hidden border border-gray-200">
                            <div className="relative aspect-video w-full">
                              <Image
                                src={coverImageUrl || "/placeholder.svg"}
                                alt="Cover preview"
                                fill
                                className="object-cover"
                                priority={true}
                              />
                            </div>
                            <div className="absolute top-3 right-3 flex gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 rounded-2xl bg-white/90 hover:bg-white backdrop-blur-sm"
                                onClick={() =>
                                  window.open(coverImageUrl, "_blank")
                                }
                              >
                                <LucideEye className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 rounded-2xl bg-white/90 hover:bg-red-50 text-red-600 backdrop-blur-sm"
                                onClick={handleRemoveCoverImage}
                              >
                                <LucideX className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-colors cursor-pointer"
                            onClick={() => coverImageInputRef.current?.click()}
                          >
                            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <LucideImage className="h-6 w-6 text-blue-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              Tải lên ảnh cover
                            </p>
                            <p className="text-xs text-gray-500">
                              JPG, PNG, GIF (tối đa{" "}
                              {MAX_COVER_IMAGE_SIZE / (1024 * 1024)}MB)
                            </p>
                          </div>
                        )}
                        <Input
                          ref={coverImageInputRef}
                          type="file"
                          className="hidden"
                          accept={ALLOWED_IMAGE_TYPES.join(",")}
                          onChange={handleCoverImageChange}
                        />
                        {uploadingCover && (
                          <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-6 h-6 bg-blue-100 rounded-xl flex items-center justify-center">
                                <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                              </div>
                              <span className="text-sm font-medium text-blue-900">
                                Đang tải lên...
                              </span>
                            </div>
                            <Progress value={50} className="h-2 bg-blue-100" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">
                          Tổng thời gian:
                        </span>
                        <div className="bg-blue-50 px-3 py-2 rounded-2xl">
                          <span className="text-sm font-semibold text-blue-900">
                            {totalTime} phút
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
              <div className="p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Nội dung bài giảng
                    </h3>
                    <p className="text-gray-500">
                      Thiết kế các phần của bài giảng
                    </p>
                  </div>
                  <Button
                    onClick={handleAddSection}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-6 py-3 mt-4 sm:mt-0"
                    disabled={lessonSections.length >= 10}
                  >
                    <LucidePlus className="h-4 w-4 mr-2" />
                    Thêm phần mới
                  </Button>
                </div>

                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <LucideInfo className="h-4 w-4 text-emerald-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-emerald-900">
                      Thông tin bài giảng
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-emerald-700">
                        Số phần hiện tại:
                      </span>
                      <span className="font-semibold text-emerald-900">
                        {lessonSections.length}/10
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Yêu cầu:</span>
                      <span className="font-semibold text-emerald-900">
                        1-10 phần
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-emerald-200">
                    <div className="flex items-center gap-2 text-xs text-emerald-600">
                      <LucideGripVertical className="h-3 w-3" />
                      <span>
                        Kéo thả icon <strong>⋮⋮</strong> để sắp xếp thứ tự các
                        phần
                      </span>
                    </div>
                  </div>
                </div>

                <ScrollArea className="h-full pr-4">
                  <Accordion type="multiple" className="w-full space-y-6">
                    {lessonSections.map((section, index) => (
                      <AccordionItem
                        key={section.id}
                        value={section.id}
                        className={`border border-gray-200 rounded-3xl overflow-hidden shadow-sm transition-all duration-200 ${
                          draggedSectionId === section.id
                            ? "opacity-50 scale-95"
                            : ""
                        } ${
                          dragOverSectionId === section.id
                            ? "border-emerald-400 shadow-md"
                            : ""
                        }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, section.id)}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, section.id)}
                        onDragEnd={handleDragEnd}
                      >
                        <AccordionTrigger
                          className="px-6 py-4 hover:bg-gray-50/50 data-[state=open]:bg-gray-50/80 transition-colors hover:no-underline"
                          actions={
                            <div className="flex items-center gap-2 ml-2 pr-6 flex-shrink-0">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleDuplicateSection(section.id)}
                                className="h-9 w-9 p-0 rounded-2xl border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                                title="Nhân đôi phần"
                              >
                                <LucideCopy className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveSection(section.id)}
                                className="h-9 w-9 p-0 rounded-2xl border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
                                disabled={lessonSections.length <= 1}
                                title="Xóa phần"
                              >
                                <LucideTrash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          }
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-gray-200 transition-colors">
                                <LucideGripVertical className="h-4 w-4 text-gray-500" />
                              </div>
                              <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center">
                                <span className="text-emerald-700 font-semibold text-sm">
                                  {index + 1}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {getSectionIcon(section.type)}
                              <div className="text-left">
                                <span className="font-semibold text-gray-900">
                                  {section.title}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className="bg-gray-100 text-gray-600 border-0 px-2 py-1 text-xs rounded-full">
                                    {section.time} phút
                                  </Badge>
                                  <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-1 text-xs rounded-full">
                                    {section.tags.length} tags
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 py-6 border-t bg-white">
                          <div className="space-y-6">
                            {/* Basic section info - 4 column layout */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                              <div className="space-y-2">
                                <Label
                                  htmlFor={`section-${section.id}-title`}
                                  className="text-sm font-medium text-gray-700"
                                >
                                  Tiêu đề phần
                                </Label>
                                <Input
                                  id={`section-${section.id}-title`}
                                  value={section.title}
                                  onChange={(e) =>
                                    handleUpdateSection(
                                      section.id,
                                      "title",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Nhập tiêu đề phần"
                                  className="rounded-2xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor={`section-${section.id}-contentType`}
                                  className="text-sm font-medium text-gray-700"
                                >
                                  Chọn loại file
                                </Label>
                                <Select
                                  value={section.contentType}
                                  onValueChange={(value) =>
                                    handleUpdateSection(
                                      section.id,
                                      "contentType",
                                      value
                                    )
                                  }
                                >
                                  <SelectTrigger
                                    id={`section-${section.id}-contentType`}
                                    className="rounded-2xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200"
                                  >
                                    <SelectValue placeholder="Chọn loại file" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-2xl border-gray-200">
                                    <SelectItem
                                      value="youtube"
                                      className="rounded-xl"
                                    >
                                      YouTube
                                    </SelectItem>
                                    <SelectItem
                                      value="powerpoint"
                                      className="rounded-xl"
                                    >
                                      PowerPoint
                                    </SelectItem>
                                    <SelectItem
                                      value="pdf"
                                      className="rounded-xl"
                                    >
                                      PDF
                                    </SelectItem>
                                    <SelectItem
                                      value="doc"
                                      className="rounded-xl"
                                    >
                                      Doc
                                    </SelectItem>
                                    {/* <SelectItem
                                      value="quiz"
                                      className="rounded-xl"
                                    >
                                      Quiz
                                    </SelectItem> */}
                                    <SelectItem
                                      value="video"
                                      className="rounded-xl"
                                    >
                                      Video
                                    </SelectItem>
                                    <SelectItem
                                      value="audio"
                                      className="rounded-xl"
                                    >
                                      Audio
                                    </SelectItem>
                                    <SelectItem
                                      value="h5p"
                                      className="rounded-xl"
                                    >
                                      H5P
                                    </SelectItem>
                                    <SelectItem
                                      value="scorm"
                                      className="rounded-xl"
                                    >
                                      Scorm
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor={`section-${section.id}-time`}
                                  className="text-sm font-medium text-gray-700"
                                >
                                  Thời gian (phút)
                                </Label>
                                <Input
                                  id={`section-${section.id}-time`}
                                  type="number"
                                  min="1"
                                  max="120"
                                  value={section.time}
                                  onChange={(e) =>
                                    handleUpdateSection(
                                      section.id,
                                      "time",
                                      Number.parseInt(e.target.value) || 0
                                    )
                                  }
                                  placeholder="Nhập thời gian"
                                  className="rounded-2xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor={`section-${section.id}-tags`}
                                  className="text-sm font-medium text-gray-700"
                                >
                                  Tags (phân cách bằng dấu phẩy)
                                </Label>
                                <Input
                                  id={`section-${section.id}-tags`}
                                  value={section.tags.join(", ")}
                                  onChange={(e) =>
                                    handleUpdateSection(
                                      section.id,
                                      "tags",
                                      e.target.value
                                        .split(",")
                                        .map((tag) => tag.trim())
                                        .filter(Boolean)
                                    )
                                  }
                                  placeholder="Nhập tags"
                                  className="rounded-2xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200"
                                />
                              </div>
                            </div>

                            {/* Content tabs */}
                            <Tabs defaultValue="files" className="w-full">
                              <TabsList className="bg-gray-50 rounded-2xl shadow-sm border border-gray-100 p-1.5 mb-6">
                                <TabsTrigger
                                  value="files"
                                  className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm rounded-xl px-4 py-2 font-medium transition-all duration-200 flex items-center gap-2"
                                >
                                  <LucideFile className="h-4 w-4" /> Tệp
                                </TabsTrigger>
                                <TabsTrigger
                                  value="links"
                                  className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm rounded-xl px-4 py-2 font-medium transition-all duration-200 flex items-center gap-2"
                                >
                                  <LucideLink className="h-4 w-4" /> Liên kết
                                </TabsTrigger>
                              </TabsList>
                              <TabsContent value="files" className="space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="text-sm font-semibold text-gray-900">
                                    Tải lên tệp
                                  </h4>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 rounded-2xl hover:bg-gray-100"
                                        >
                                          <LucideInfo className="h-4 w-4 text-gray-500" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs rounded-2xl border-gray-200">
                                        <p>
                                          Hỗ trợ upload file video, audio, PDF,
                                          DOCX, PPTX, ZIP, RAR và H5P.
                                        </p>
                                        <p className="mt-1">
                                          Định dạng: {getAllowedFileTypes()}
                                        </p>
                                        <p className="mt-1">
                                          Kích thước tối đa:{" "}
                                          {MAX_FILE_SIZE / (1024 * 1024)}MB
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>

                                {section.contentType === "youtube" ? (
                                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center bg-gray-50/50">
                                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                      <LucideLink className="h-6 w-6 text-gray-500" />
                                    </div>
                                    <h3 className="text-base font-semibold text-gray-900 mb-2">
                                      Chuyển sang tab Liên kết
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                      Click sang tab Liên kết để gắn đường dẫn
                                      YouTube
                                    </p>
                                  </div>
                                ) : (
                                  <div
                                    className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors cursor-pointer"
                                    onClick={() =>
                                      fileInputRefs.current[section.id]?.click()
                                    }
                                  >
                                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                      <LucideUpload className="h-6 w-6 text-emerald-600" />
                                    </div>
                                    <h3 className="text-base font-semibold text-gray-900 mb-2">
                                      Nhấp để tải lên
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                      {section.contentType === "powerpoint" &&
                                        "ZIP, RAR. Tối đa " +
                                          MAX_FILE_SIZE / (1024 * 1024) +
                                          "MB"}
                                      {section.contentType === "pdf" &&
                                        "PDF. Tối đa " +
                                          MAX_FILE_SIZE / (1024 * 1024) +
                                          "MB"}
                                      {section.contentType === "doc" &&
                                        "DOC, DOCX. Tối đa " +
                                          MAX_FILE_SIZE / (1024 * 1024) +
                                          "MB"}
                                      {section.contentType === "video" &&
                                        "MP4, AVI, MOV, WMV, WEBM. Tối đa " +
                                          MAX_FILE_SIZE / (1024 * 1024) +
                                          "MB"}
                                      {section.contentType === "audio" &&
                                        "MP3, WAV, OGG, M4A. Tối đa " +
                                          MAX_FILE_SIZE / (1024 * 1024) +
                                          "MB"}
                                      {section.contentType === "h5p" &&
                                        "H5P. Tối đa " +
                                          MAX_FILE_SIZE / (1024 * 1024) +
                                          "MB"}
                                      {![
                                        "powerpoint",
                                        "pdf",
                                        "doc",
                                        "video",
                                        "audio",
                                        "youtube",
                                        "h5p",
                                      ].includes(section.contentType) &&
                                        "Video, audio, PDF, DOCX, PPTX, ZIP, RAR, H5P. Tối đa " +
                                          MAX_FILE_SIZE / (1024 * 1024) +
                                          "MB"}
                                    </p>
                                    <Input
                                      ref={(el) => {
                                        fileInputRefs.current[section.id] = el;
                                      }}
                                      type="file"
                                      className="hidden"
                                      accept={
                                        section.contentType === "powerpoint"
                                          ? ALLOWED_ARCHIVE_TYPES.join(",")
                                          : section.contentType === "pdf"
                                          ? ".pdf"
                                          : section.contentType === "doc"
                                          ? ".doc,.docx"
                                          : section.contentType === "video"
                                          ? ALLOWED_VIDEO_TYPES.join(",")
                                          : section.contentType === "audio"
                                          ? ALLOWED_AUDIO_TYPES.join(",")
                                          : section.contentType === "h5p"
                                          ? ALLOWED_H5P_TYPES.join(",")
                                          : [
                                              ...ALLOWED_VIDEO_TYPES,
                                              ...ALLOWED_AUDIO_TYPES,
                                              ...ALLOWED_DOCUMENT_TYPES,
                                              ...ALLOWED_ARCHIVE_TYPES,
                                              ...ALLOWED_H5P_TYPES,
                                            ].join(",")
                                      }
                                      onChange={(e) =>
                                        handleFileChange(e, section.id)
                                      }
                                    />
                                  </div>
                                )}

                                {isUploading[section.id] && (
                                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
                                    <div className="flex items-center gap-3 mb-3">
                                      <div className="w-6 h-6 bg-emerald-100 rounded-xl flex items-center justify-center">
                                        <div className="w-3 h-3 bg-emerald-600 rounded-full animate-pulse"></div>
                                      </div>
                                      <span className="text-sm font-medium text-emerald-900">
                                        Đang tải lên...
                                      </span>
                                    </div>
                                    <Progress
                                      value={50}
                                      className="h-2 bg-emerald-100"
                                    />
                                  </div>
                                )}

                                {section.files.length > 0 && (
                                  <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-gray-900">
                                      Tệp đã tải lên ({section.files.length})
                                    </h4>
                                    <div className="space-y-3">
                                      {section.files.map((file, fileIndex) => (
                                        <div
                                          key={fileIndex}
                                          className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl bg-gray-50/50"
                                        >
                                          <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center border border-gray-200">
                                              {getFileIcon(file.name)}
                                            </div>
                                            <div>
                                              <p className="font-medium text-sm text-gray-900">
                                                {file.name}
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                {getFileSize(file.size)}
                                              </p>
                                              {section.fileUrl &&
                                                fileIndex === 0 && (
                                                  <p className="text-xs text-emerald-600 mt-1 font-medium">
                                                    ✓ Đã tải lên thành công
                                                  </p>
                                                )}
                                            </div>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 rounded-2xl text-gray-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() =>
                                              handleRemoveFile(
                                                section.id,
                                                fileIndex
                                              )
                                            }
                                          >
                                            <LucideX className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Existing file from server (for edit mode) */}
                                {section.fileUrl &&
                                  section.files.length === 0 && (
                                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                          {getFileIcon(section.fileUrl)}
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-emerald-900">
                                            File hiện tại
                                          </p>
                                          <p className="text-xs text-emerald-700">
                                            {section.fileUrl}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                              </TabsContent>
                              <TabsContent value="links" className="space-y-6">
                                <div className="space-y-2">
                                  <Label
                                    htmlFor={`section-${section.id}-url`}
                                    className="text-sm font-medium text-gray-700"
                                  >
                                    URL
                                  </Label>
                                  <Input
                                    id={`section-${section.id}-url`}
                                    value={section.url}
                                    onChange={(e) =>
                                      handleUpdateSection(
                                        section.id,
                                        "url",
                                        e.target.value
                                      )
                                    }
                                    placeholder={
                                      section.contentType === "youtube"
                                        ? "https://youtube.com/watch?v=..."
                                        : section.contentType === "powerpoint"
                                        ? "https://docs.google.com/presentation/d/..."
                                        : "Nhập URL liên kết"
                                    }
                                    className="rounded-2xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200"
                                  />
                                </div>

                                {/* Thông báo về đồng bộ URL */}
                                {section.fileUrl &&
                                  section.fileUrl === section.url && (
                                    <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                                      <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 bg-green-100 rounded-xl flex items-center justify-center">
                                          <LucideCheck className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-green-900">
                                            URL đã được đồng bộ
                                          </p>
                                          <p className="text-xs text-green-700 mt-1">
                                            URL này sẽ hiển thị giống nhau ở cả
                                            tab "Tệp" và tab "Liên kết"
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                {/* Thông báo khi không có file upload */}
                                {!section.fileUrl &&
                                  section.files.length === 0 && (
                                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                                      <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 bg-amber-100 rounded-xl flex items-center justify-center">
                                          <LucideInfo className="h-4 w-4 text-amber-600" />
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-amber-900">
                                            Chưa có file upload
                                          </p>
                                          <p className="text-xs text-amber-700 mt-1">
                                            Bạn có thể nhập URL trực tiếp hoặc
                                            upload file trong tab "Tệp"
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                              </TabsContent>
                            </Tabs>

                            {/* Instructions section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                              <div className="space-y-2">
                                <Label
                                  htmlFor={`section-${section.id}-teacherNotes`}
                                  className="text-sm font-medium text-gray-700"
                                >
                                  Hướng dẫn cho giáo viên
                                </Label>
                                <Textarea
                                  id={`section-${section.id}-teacherNotes`}
                                  value={section.teacherNotes}
                                  onChange={(e) =>
                                    handleUpdateSection(
                                      section.id,
                                      "teacherNotes",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Nhập hướng dẫn và lưu ý dành cho giáo viên"
                                  rows={4}
                                  className="rounded-2xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor={`section-${section.id}-studentInstructions`}
                                  className="text-sm font-medium text-gray-700"
                                >
                                  Hướng dẫn cho học sinh
                                </Label>
                                <Textarea
                                  id={`section-${section.id}-studentInstructions`}
                                  value={section.studentInstructions}
                                  onChange={(e) =>
                                    handleUpdateSection(
                                      section.id,
                                      "studentInstructions",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Nhập hướng dẫn dành cho học sinh"
                                  rows={4}
                                  className="rounded-2xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200"
                                />
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </ScrollArea>

                {/* Upload progress */}
                {submitStatus === "uploading" && (
                  <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200 mt-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-2xl flex items-center justify-center">
                        <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900">
                          {mode === "create"
                            ? "Đang tải lên bài giảng..."
                            : "Đang cập nhật bài giảng..."}
                        </h4>
                        <p className="text-xs text-blue-700">
                          {submitProgress}% hoàn thành
                        </p>
                      </div>
                    </div>
                    <Progress
                      value={submitProgress}
                      className="h-3 bg-blue-100"
                    />
                  </div>
                )}

                {/* Success message */}
                {submitStatus === "success" && (
                  <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 mt-8">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-2xl flex items-center justify-center">
                        <LucideCheck className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-emerald-900">
                          {mode === "create"
                            ? "Tải lên thành công!"
                            : "Cập nhật thành công!"}
                        </h4>
                        <p className="text-xs text-emerald-700">
                          {mode === "create"
                            ? "Bài giảng đã được lưu vào hệ thống"
                            : "Bài giảng đã được cập nhật và lưu vào hệ thống"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error message */}
                {submitStatus === "error" && (
                  <div className="bg-red-50 rounded-2xl p-6 border border-red-200 mt-8">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-2xl flex items-center justify-center">
                        <LucideAlertCircle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-red-900">
                          Đã xảy ra lỗi
                        </h4>
                        <p className="text-xs text-red-700">
                          {mode === "create"
                            ? "Không thể tạo bài giảng. Vui lòng thử lại"
                            : "Không thể cập nhật bài giảng. Vui lòng thử lại"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-100">
                  {onCancel && (
                    <Button
                      variant="outline"
                      onClick={onCancel}
                      className="rounded-2xl border-gray-200 hover:border-gray-300 px-6 py-3 bg-transparent"
                    >
                      Hủy
                    </Button>
                  )}
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-8 py-3 font-semibold shadow-sm"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 bg-white rounded-full animate-pulse mr-2"></div>
                        {mode === "create"
                          ? "Đang tải lên..."
                          : "Đang cập nhật..."}
                      </>
                    ) : (
                      <>
                        {mode === "create" ? (
                          <>
                            <LucideUpload className="h-4 w-4 mr-2" />
                            Tải lên bài giảng
                          </>
                        ) : (
                          <>
                            <LucideSave className="h-4 w-4 mr-2" />
                            Cập nhật bài giảng
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
