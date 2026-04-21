"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderPlus,
  Upload,
  Search,
  Copy,
  Eye,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  File,
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronFirst,
  ChevronLast,
  Calendar,
  HardDrive,
  CloudUpload,
  X,
} from "lucide-react";
import { mediaApi, type MediaFolder, type MediaFile } from "@/lib/api/medias";
import { uploadFile } from "@/lib/api/questions";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { uploadApi } from "@/lib/api/upload";
import { useAuth } from "@/lib/context/auth-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useRouter, useSearchParams } from "next/navigation";

export default function FileManagerPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["1"])
  );
  const [deleteLoading, setDeleteLoading] = useState<string>("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(30);
  const [totalFiles, setTotalFiles] = useState(0);

  // Create folder dialog state
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [createFolderLoading, setCreateFolderLoading] = useState(false);

  // Large file upload dialog state
  const [largeFileUploadOpen, setLargeFileUploadOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<
    Record<
      string,
      {
        progress: number;
        status: "pending" | "uploading" | "processing" | "completed" | "error";
        jobId?: string;
        finalUrl?: string;
        message?: string;
        error?: string;
      }
    >
  >({});
  const [uploadedLinks, setUploadedLinks] = useState<
    Array<{ filename: string; url: string }>
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const largeFileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const router = useRouter();
  const searchParams = useSearchParams();

  // Lấy folder id từ URL nếu có
  const folderFromUrl = searchParams.get("folder") || "1";
  const [selectedFolder, setSelectedFolder] = useState<string>(folderFromUrl);
  // Khi selectedFolder thay đổi => cập nhật URL
  useEffect(() => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("folder", selectedFolder);
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.replace(`${window.location.pathname}${query}`);
  }, [selectedFolder]);

  // Mở tất cả folder cha của folder hiện tại
  const expandParents = (
    folders: MediaFolder[],
    targetId: string,
    parents: string[] = []
  ): string[] => {
    for (const folder of folders) {
      if (folder.id === targetId) {
        return parents;
      }
      if (folder.children && folder.children.length > 0) {
        const result = expandParents(folder.children, targetId, [
          ...parents,
          folder.id,
        ]);
        if (result.length > 0) {
          return result;
        }
      }
    }
    return [];
  };

  // Load folders on component mount
  useEffect(() => {
    loadFolders();
  }, []);

  // Load files when selected folder changes
  useEffect(() => {
    if (selectedFolder) {
      setCurrentPage(1); // Reset to first page when folder changes
      loadFiles(selectedFolder);
    }
  }, [selectedFolder]);

  // Load files when pagination changes
  useEffect(() => {
    if (selectedFolder) {
      loadFiles(selectedFolder);
    }
  }, [currentPage, perPage, searchTerm]);

  // Reset large file upload state when dialog closes
  useEffect(() => {
    if (!largeFileUploadOpen) {
      // Use a timeout to ensure we only clear after dialog fully closes
      const timeoutId = setTimeout(() => {
        setSelectedFiles([]);
        setUploadProgress({});
        setUploadedLinks([]);
        setIsDragging(false);
        if (largeFileInputRef.current) {
          largeFileInputRef.current.value = "";
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [largeFileUploadOpen]);

  const loadFolders = async () => {
    try {
      setLoading(true);
      const response = await mediaApi.getFolders();
      if (response.code === 200 && response.data) {
        setFolders([response.data]);

        // Auto expand parents when load folders
        const parentIds = expandParents([response.data], selectedFolder);
        setExpandedFolders(new Set(["1", ...parentIds]));
      } else {
        console.warn("[FileManager] Unexpected folders response:", response);
      }
    } catch (error) {
      console.error("[FileManager] Error loading folders:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách thư mục",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async (folderId: string) => {
    try {
      setFilesLoading(true);
      const response = await mediaApi.getFiles(
        folderId,
        currentPage,
        perPage,
        searchTerm
      );
      if (response.code === 200 && response.data) {
        setFiles(response.data.files);
        const totalCount = Number.parseInt(response.data.total_count) || 0;
        setTotalFiles(totalCount);
      } else {
        console.warn("[FileManager] Unexpected files response:", response);
      }
    } catch (error) {
      console.error("[FileManager] Error loading files:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách file",
        variant: "destructive",
      });
      setFiles([]);
      setTotalFiles(0);
    } finally {
      setFilesLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      console.warn("[FileManager] Empty folder name provided");
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên thư mục",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreateFolderLoading(true);
      const response = await mediaApi.createFolder({
        parent_id: Number.parseInt(selectedFolder),
        file_path: newFolderName.trim(),
      });

      if (response.code === 200) {
        toast({
          title: "Thành công",
          description: "Tạo thư mục thành công",
        });
        setCreateFolderOpen(false);
        setNewFolderName("");
        // Reload folders to show new folder
        await loadFolders();
      } else {
        console.error("[FileManager] Failed to create folder:", response);
        toast({
          title: "Lỗi",
          description: response.message || "Không thể tạo thư mục",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[FileManager] Create folder error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tạo thư mục",
        variant: "destructive",
      });
    } finally {
      setCreateFolderLoading(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getCurrentFolderPath = (): string => {
    const buildAbsolutePath = (
      folders: MediaFolder[],
      targetId: string,
      currentPath: string = ""
    ): string => {
      for (const folder of folders) {
        const folderPath = currentPath
          ? `${currentPath}/${folder.path}`
          : folder.path;

        if (folder.id === targetId) {
          return folderPath || "";
        }

        if (folder.children && folder.children.length > 0) {
          const childPath = buildAbsolutePath(
            folder.children,
            targetId,
            folderPath
          );
          if (childPath !== "") {
            return childPath;
          }
        }
      }
      return "";
    };

    return buildAbsolutePath(folders, selectedFolder);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) {
      console.warn("[FileManager] No files selected");
      return;
    }

    try {
      setUploadLoading(true);
      const uploadPromises = Array.from(uploadedFiles).map(async (file) => {
        try {
          const result = await uploadFile(file, getCurrentFolderPath());
          return { success: true, fileName: file.name, result };
        } catch (error) {
          console.error(`[FileManager] Error uploading ${file.name}:`, error);
          return { success: false, fileName: file.name, error };
        }
      });

      const results = await Promise.all(uploadPromises);
      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      if (successCount > 0) {
        toast({
          title: "Upload thành công",
          description: `Đã upload ${successCount} file(s)${
            failCount > 0 ? `, ${failCount} file(s) thất bại` : ""
          }`,
        });
        // Reload files to show newly uploaded files
        await loadFiles(selectedFolder);
      } else {
        toast({
          title: "Upload thất bại",
          description: "Không thể upload file nào",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[FileManager] Upload error:", error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi upload file",
        variant: "destructive",
      });
    } finally {
      setUploadLoading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Large file upload handlers
  const handleLargeFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setSelectedFiles((prev) => {
      // Avoid duplicate files by checking name and size
      const existingNames = new Set(prev.map((f) => `${f.name}-${f.size}`));
      const uniqueNewFiles = newFiles.filter(
        (f) => !existingNames.has(`${f.name}-${f.size}`)
      );
      return [...prev, ...uniqueNewFiles];
    });
    // Initialize progress for new files
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      newFiles.forEach((file) => {
        // Only add if not already exists
        if (!newProgress[file.name]) {
          newProgress[file.name] = { progress: 0, status: "pending" };
        }
      });
      return newProgress;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleLargeFileSelect(e.dataTransfer.files);
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.name !== fileName));
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    setUploadProgress({});
    setUploadedLinks([]);
    if (largeFileInputRef.current) {
      largeFileInputRef.current.value = "";
    }
  };

  const upsertUploadedLink = (fileName: string, url?: string) => {
    if (!url) return;
    setUploadedLinks((prev) => {
      const filtered = prev.filter((link) => link.filename !== fileName);
      return [...filtered, { filename: fileName, url }];
    });
  };

  const pollUploadProgress = async (
    fileName: string,
    jobId?: string,
    fallbackUrl?: string
  ) => {
    if (!jobId) {
      setUploadProgress((prev) => ({
        ...prev,
        [fileName]: {
          ...prev[fileName],
          status: "completed",
        },
      }));
      return;
    }

    const POLL_INTERVAL = 2000;
    const MAX_ATTEMPTS = 60;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const progressResponse = await uploadApi.progress(jobId);

        if (!progressResponse.success || !progressResponse.data) {
          console.error(
            "[FileManager] Invalid progress response:",
            progressResponse
          );
          throw new Error("Không thể lấy tiến độ xử lý");
        }

        const { progress, status, message, error, final_url } =
          progressResponse.data;

        const normalizedStatus =
          status === "completed"
            ? "completed"
            : status === "failed"
            ? "error"
            : "processing";

        let urlToUse = final_url || fallbackUrl;

        setUploadProgress((prev) => {
          const previous = prev[fileName];
          const nextUrl = urlToUse || previous?.finalUrl;
          urlToUse = nextUrl;
          return {
            ...prev,
            [fileName]: {
              ...previous,
              progress,
              status: normalizedStatus,
              jobId,
              finalUrl: nextUrl,
              message,
              error,
            },
          };
        });

        if (normalizedStatus === "completed") {
          upsertUploadedLink(fileName, urlToUse);
          toast({
            title: "Hoàn tất",
            description: message || "File đã xử lý xong",
          });
          return;
        }

        if (normalizedStatus === "error") {
          console.error("[FileManager] Upload error:", {
            fileName,
            error,
            message,
          });
          throw new Error(error || message || "Xử lý thất bại");
        }
      } catch (error) {
        console.error("[FileManager] Error polling progress:", {
          fileName,
          attempt: attempt + 1,
          error,
        });
        setUploadProgress((prev) => ({
          ...prev,
          [fileName]: {
            ...prev[fileName],
            status: "error",
            error:
              error instanceof Error
                ? error.message
                : "Không thể xử lý tiến trình",
          },
        }));

        toast({
          title: "Lỗi xử lý",
          description:
            error instanceof Error
              ? error.message
              : "Không thể xử lý tiến trình",
          variant: "destructive",
        });
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    }

    console.error("[FileManager] Polling timeout:", { fileName, jobId });
    throw new Error("Quá thời gian xử lý file");
  };

  const uploadLargeFile = async (file: File): Promise<void> => {
    const fileName = file.name;
    const folderPath = getCurrentFolderPath();

    try {
      // Update status to uploading
      setUploadProgress((prev) => ({
        ...prev,
        [fileName]: { progress: 0, status: "uploading" },
      }));

      // Step 1: Get presigned URL
      const presignResponse = await uploadApi.presign({
        filename: fileName,
        content_type: file.type || "application/octet-stream",
        folder: folderPath || "public",
      });

      if (!presignResponse.success || !presignResponse.data) {
        console.error(
          "[FileManager] Failed to get presigned URL:",
          presignResponse
        );
        throw new Error("Failed to get presigned URL");
      }

      // Step 2: Upload file to S3 using presigned URL
      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            if (percentComplete % 10 === 0 || percentComplete === 100) {
            }
            setUploadProgress((prev) => ({
              ...prev,
              [fileName]: { progress: percentComplete, status: "uploading" },
            }));
          }
        });

        xhr.addEventListener("load", async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              // Step 3: Complete upload
              if (!user?.role_id) {
                console.error("[FileManager] User ID not found:", user);
                throw new Error("User ID not found");
              }

              setUploadProgress((prev) => ({
                ...prev,
                [fileName]: {
                  ...prev[fileName],
                  progress: 100,
                  status: "processing",
                },
              }));

              const completeResponse = await uploadApi.complete({
                filename: fileName,
                key: presignResponse.data.key,
                url: presignResponse.data.object_url,
                size: file.size,
                content_type: file.type || "application/octet-stream",
                user_id: user.id,
              });

              const finalUrl =
                completeResponse.data?.final_url ||
                presignResponse.data.object_url;
              const jobId = completeResponse.data?.job_id;
              const backgroundMessage =
                completeResponse.data?.message || completeResponse.message;

              upsertUploadedLink(fileName, finalUrl);

              setUploadProgress((prev) => ({
                ...prev,
                [fileName]: {
                  ...prev[fileName],
                  progress: 100,
                  status: "processing",
                  jobId,
                  finalUrl,
                  message: backgroundMessage,
                },
              }));

              await pollUploadProgress(fileName, jobId, finalUrl);

              resolve();
            } catch (error) {
              console.error(
                `[FileManager] Error completing upload for ${fileName}:`,
                error
              );
              setUploadProgress((prev) => ({
                ...prev,
                [fileName]: { progress: 100, status: "error" },
              }));
              reject(error);
            }
          } else {
            console.error(
              `[FileManager] Upload failed with status ${xhr.status}`,
              xhr.responseText
            );
            throw new Error(`Upload failed with status ${xhr.status}`);
          }
        });

        xhr.addEventListener("error", (e) => {
          console.error("[FileManager] XHR upload error:", e);
          setUploadProgress((prev) => ({
            ...prev,
            [fileName]: { progress: 0, status: "error" },
          }));
          reject(new Error("Upload failed"));
        });

        xhr.addEventListener("abort", () => {
          console.warn("[FileManager] Upload aborted:", fileName);
        });

        xhr.open("PUT", presignResponse.data.upload_url);
        xhr.setRequestHeader(
          "Content-Type",
          file.type || "application/octet-stream"
        );
        xhr.send(file);
      });
    } catch (error) {
      console.error(`[FileManager] Error uploading ${fileName}:`, error);
      setUploadProgress((prev) => ({
        ...prev,
        [fileName]: { progress: 0, status: "error" },
      }));
      throw error;
    }
  };

  const handleStartUpload = async () => {
    if (selectedFiles.length === 0) {
      console.warn("[FileManager] No files selected for upload");
      return;
    }

    try {
      // Upload all files sequentially
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        if (uploadProgress[file.name]?.status === "completed") {
          continue; // Skip already completed files
        }
        await uploadLargeFile(file);
      }
      toast({
        title: "Upload thành công",
        description: `Đã upload ${selectedFiles.length} file(s)`,
      });

      // Reload files after upload
      await loadFiles(selectedFolder);
    } catch (error) {
      console.error("[FileManager] Upload error:", error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi upload file",
        variant: "destructive",
      });
    }
  };

  const formatFileSizeBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const getFileType = (
    mimeType: string
  ): "image" | "video" | "audio" | "zip" | "other" | "pdf" => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType === "application/pdf") return "pdf";
    if (
      mimeType.includes("zip") ||
      mimeType.includes("rar") ||
      mimeType.includes("7z")
    )
      return "zip";
    return "other";
  };

  const formatFileSize = (sizeStr: string): string => {
    const bytes = Number.parseInt(sizeStr) || 0;
    if (bytes === 0) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const getFileIcon = (type: "image" | "video" | "audio" | "zip" | "other") => {
    switch (type) {
      case "image":
        return <FileImage className="w-4 h-4" />;
      case "video":
        return <FileVideo className="w-4 h-4" />;
      case "audio":
        return <FileAudio className="w-4 h-4" />;
      case "zip":
        return <FileArchive className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  const copyToClipboard = (url: string, fileName: string) => {
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Đã sao chép",
        description: `Đường dẫn của ${fileName} đã được sao chép`,
      });
    });
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa thư mục "${folderName}"? Cần xóa file trong thư mục thì mới có thể xóa thư mục.`
      )
    ) {
      return;
    }

    try {
      setDeleteLoading(folderId);
      const response = await mediaApi.deleteFolder(folderId);

      if (response.code === 200) {
        toast({
          title: "Thành công",
          description: `Đã xóa thư mục "${folderName}"`,
        });
        // Reload folders to reflect changes
        await loadFolders();
        // If deleted folder was selected, reset to root
        if (selectedFolder === folderId) {
          setSelectedFolder("1");
        }
      } else {
        console.error("[FileManager] Failed to delete folder:", response);
        toast({
          title: "Lỗi",
          description: response.message || "Không thể xóa thư mục",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[FileManager] Delete folder error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa thư mục",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading("");
    }
  };

  const handleDeleteFile = async (fileId: number, fileName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa file "${fileName}"?`)) {
      return;
    }

    try {
      setDeleteLoading(fileId.toString());
      const response = await mediaApi.deleteFile(fileId.toString());

      if (response.code === 200) {
        toast({
          title: "Thành công",
          description: `Đã xóa file "${fileName}"`,
        });
        // Reload files to reflect changes
        await loadFiles(selectedFolder);
      } else {
        console.error("[FileManager] Failed to delete file:", response);
        toast({
          title: "Lỗi",
          description: response.message || "Không thể xóa file",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[FileManager] Delete file error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa file",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading("");
    }
  };

  // Pagination helpers
  const totalPages = Math.ceil(totalFiles / perPage);
  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalFiles);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setCurrentPage(1); // Reset to first page when changing per page
  };

  const renderFolderTree = (folders: MediaFolder[], level = 0) => {
    return folders.map((folder) => (
      <div key={folder.id} className={`ml-${level * 4}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`flex items-center justify-between group py-1 px-2 hover:bg-gray-100 cursor-pointer rounded text-sm ${
                selectedFolder === folder.id
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : ""
              }`}
              onClick={() => {
                if (folder.children && folder.children.length > 0) {
                  toggleFolder(folder.id);
                }
                setSelectedFolder(folder.id);
              }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {folder.children && folder.children.length > 0 ? (
                  expandedFolders.has(folder.id) ? (
                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                  )
                ) : (
                  <div className="w-4 flex-shrink-0" />
                )}
                <Folder className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="truncate flex-1" title={folder.path || "Root"}>
                  {folder.path || "Root"}
                </span>
              </div>

              {folder.id !== "1" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-red-500 hover:text-red-700 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder.id, folder.path || "Root");
                  }}
                  disabled={deleteLoading === folder.id}
                >
                  {deleteLoading === folder.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </Button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <p className="font-medium">{folder.path || "Root"}</p>
            {folder.children && folder.children.length > 0 && (
              <p className="text-xs text-gray-500">
                {folder.children.length} thư mục con
              </p>
            )}
          </TooltipContent>
        </Tooltip>
        {expandedFolders.has(folder.id) &&
          folder.children &&
          folder.children.length > 0 && (
            <div className="ml-4">
              {renderFolderTree(folder.children, level + 1)}
            </div>
          )}
      </div>
    ));
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-xl font-semibold text-gray-900">
              File Manager
            </h1>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="w-full sm:w-auto relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Nhập tên tệp..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full max-w-80"
                />
              </div>

              <Dialog
                open={createFolderOpen}
                onOpenChange={setCreateFolderOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <FolderPlus className="w-4 h-4" />
                    TẠO FOLDER
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tạo thư mục mới</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="folder-name">Tên thư mục</Label>
                      <Input
                        id="folder-name"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Nhập tên thư mục..."
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setCreateFolderOpen(false)}
                        disabled={createFolderLoading}
                      >
                        Hủy
                      </Button>
                      <Button
                        onClick={handleCreateFolder}
                        disabled={createFolderLoading}
                      >
                        {createFolderLoading && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        Tạo
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                className="gap-2 bg-orange-500 hover:bg-orange-600"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLoading}
              >
                {uploadLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang upload...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    UPLOAD
                  </>
                )}
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.zip,.rar,.7z,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
                <Dialog
                  open={largeFileUploadOpen}
                  onOpenChange={setLargeFileUploadOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-purple-500 hover:bg-purple-600">
                      <HardDrive className="w-4 h-4" />
                      UPLOAD FILE LỚN
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-2xl">
                        <CloudUpload className="w-6 h-6" />
                        Upload File
                      </DialogTitle>
                      <p className="text-sm text-gray-500 mt-2">
                        Kéo thả file vào đây hoặc click để chọn file
                      </p>
                    </DialogHeader>

                    <div className="space-y-6 mt-4">
                      {/* Upload Area */}
                      <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                          isDragging
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <div className="flex flex-col items-center justify-center gap-4">
                          <Upload className="w-12 h-12 text-gray-400" />
                          <div className="space-y-2">
                            <p className="text-gray-600 font-medium">
                              Kéo thả file vào đây
                            </p>
                            <p className="text-gray-500">hoặc</p>
                            <Button
                              variant="outline"
                              onClick={() => largeFileInputRef.current?.click()}
                            >
                              Chọn File
                            </Button>
                          </div>
                        </div>
                        <input
                          ref={largeFileInputRef}
                          type="file"
                          multiple
                          onChange={(e) =>
                            handleLargeFileSelect(e.target.files)
                          }
                          className="hidden"
                        />
                      </div>

                      {/* File List */}
                      {selectedFiles.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg">
                            Danh sách file đã chọn:
                          </h3>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {selectedFiles.map((file) => (
                              <Card
                                key={file.name}
                                className="p-3 flex items-center justify-between"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <File className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                      {file.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {formatFileSizeBytes(file.size)}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(file.name)}
                                  className="flex-shrink-0"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Upload Progress */}
                      {Object.keys(uploadProgress).length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-semibold text-lg">
                            Tiến trình upload:
                          </h3>
                          <div className="space-y-3">
                            {Object.entries(uploadProgress).map(
                              ([fileName, progress]) => (
                                <div key={fileName} className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="truncate flex-1">
                                      {fileName}
                                    </span>
                                    <span className="ml-2 flex-shrink-0">
                                      {["uploading", "processing"].includes(
                                        progress.status
                                      ) && `${progress.progress}%`}
                                      {progress.status === "completed" &&
                                        (progress.message || "Thành công 🎉")}
                                      {progress.status === "error" &&
                                        (progress.error || "Thất bại ❌")}
                                      {progress.status === "pending" &&
                                        "Đang chờ..."}
                                    </span>
                                  </div>
                                  <Progress value={progress.progress} />
                                  {progress.finalUrl && (
                                    <p className="text-xs text-blue-600 truncate">
                                      {progress.finalUrl}
                                    </p>
                                  )}
                                  {progress.message &&
                                    progress.status !== "error" && (
                                      <p className="text-xs text-gray-500">
                                        {progress.message}
                                      </p>
                                    )}
                                  {progress.error && (
                                    <p className="text-xs text-red-500">
                                      {progress.error}
                                    </p>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* Uploaded Links */}
                      {uploadedLinks.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg">
                            Link tải về / chia sẻ:
                          </h3>
                          <div className="space-y-2">
                            {uploadedLinks.map((link, index) => (
                              <Card key={index} className="p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">
                                      {link.filename}
                                    </p>
                                    <p className="text-xs text-blue-600 truncate">
                                      {link.url}
                                    </p>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(link.url);
                                      toast({
                                        title: "Đã sao chép",
                                        description: "Link đã được sao chép",
                                      });
                                    }}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Upload Actions */}
                      <div className="flex gap-3 justify-end pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={clearAllFiles}
                          disabled={
                            selectedFiles.length === 0 &&
                            Object.keys(uploadProgress).length === 0
                          }
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Xóa tất cả
                        </Button>
                        <Button
                          onClick={handleStartUpload}
                          disabled={
                            selectedFiles.length === 0 ||
                            Object.values(uploadProgress).some(
                              (p) => p.status === "uploading"
                            )
                          }
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Bắt đầu Upload
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
            </div>
          </div>
        </div>

        <PanelGroup direction="horizontal" className="h-screen">
          {/* Sidebar Panel */}
          <Panel
            defaultSize={25}
            minSize={15}
            maxSize={60}
            className="bg-white border-r"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Folders</h2>
            </div>

            <div className="p-4 h-full overflow-y-auto">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-6 w-6 rounded" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">{renderFolderTree(folders)}</div>
              )}
            </div>
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-blue-400 transition-colors duration-200 group relative">
            {/* Visual indicator */}
            <div className="absolute inset-y-0 -left-2 -right-2 bg-transparent group-hover:bg-blue-100 transition-colors duration-200" />
            {/* Dots indicator */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="flex flex-col space-y-1">
                <div className="w-1 h-1 bg-blue-500 rounded-full" />
                <div className="w-1 h-1 bg-blue-500 rounded-full" />
                <div className="w-1 h-1 bg-blue-500 rounded-full" />
              </div>
            </div>
            {/* Resize text indicator */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                Kéo để resize
              </div>
            </div>
          </PanelResizeHandle>

          {/* Main Content Panel */}
          <Panel defaultSize={75} minSize={40} className="bg-gray-50">
            <div className="p-6 h-full overflow-y-auto">
              {filesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center space-x-4 p-4 border rounded-lg"
                    >
                      <Skeleton className="h-12 w-12 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Loại</TableHead>
                        <TableHead>Tên File</TableHead>
                        <TableHead className="w-24">Kích thước</TableHead>
                        <TableHead className="w-32">Định dạng</TableHead>
                        <TableHead className="w-40">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {files.map((file) => {
                        const fileType = getFileType(file.file_mime_type);
                        return (
                          <TableRow key={file.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
                                {fileType === "image" ? (
                                  <img
                                    src={file.url || "/placeholder.svg"}
                                    alt={file.file_name}
                                    className="w-full h-full object-cover rounded-lg"
                                    onError={(e) => {
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.style.display = "none";
                                      target.nextElementSibling?.classList.remove(
                                        "hidden"
                                      );
                                    }}
                                  />
                                ) : null}
                                <div
                                  className={`w-full h-full flex items-center justify-center ${
                                    fileType === "image" ? "hidden" : ""
                                  }`}
                                >
                                  {getFileIcon(fileType)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p
                                  className="font-medium text-gray-900 truncate max-w-xs"
                                  title={file.file_name}
                                >
                                  {file.file_name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {file.path || "Root"}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">
                                {formatFileSize(file.file_size)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600 uppercase">
                                {file.file_extension}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                  onClick={() =>
                                    copyToClipboard(file.url, file.file_name)
                                  }
                                  title="Copy URL"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                  onClick={() =>
                                    window.open(file.url, "_blank")
                                  }
                                  title="Preview"
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 w-8 p-0"
                                  onClick={() =>
                                    handleDeleteFile(file.id, file.file_name)
                                  }
                                  disabled={
                                    deleteLoading === file.id.toString()
                                  }
                                  title="Delete"
                                >
                                  {deleteLoading === file.id.toString() ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {!filesLoading && files.length === 0 && (
                <div className="bg-white rounded-lg border">
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <FileImage className="w-16 h-16 mx-auto" />
                    </div>
                    <p className="text-gray-500">
                      {searchTerm
                        ? "Không tìm thấy file nào"
                        : "Chưa có file nào trong thư mục này"}
                    </p>
                  </div>
                </div>
              )}

              {/* Pagination */}
              {!filesLoading && totalFiles > 0 && (
                <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-700">
                      Hiển thị {startItem}-{endItem} trong tổng số {totalFiles}{" "}
                      file
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">Hiển thị:</span>
                      <select
                        value={perPage}
                        onChange={(e) =>
                          handlePerPageChange(Number.parseInt(e.target.value))
                        }
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value={30}>30</option>
                        <option value={60}>60</option>
                        <option value={90}>90</option>
                      </select>
                    </div>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronFirst className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>

                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={
                                currentPage === pageNum ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronLast className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </TooltipProvider>
  );
}
