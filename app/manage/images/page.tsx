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
} from "lucide-react";
import { mediaApi, type MediaFolder, type MediaFile } from "@/lib/api/medias";
import { uploadFile } from "@/lib/api/questions";
import { Skeleton } from "@/components/ui/skeleton";

export default function FileManagerPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("1");
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

  // Large file upload iframe dialog state
  const [largeFileUploadOpen, setLargeFileUploadOpen] = useState(false);

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

  const loadFolders = async () => {
    try {
      setLoading(true);
      const response = await mediaApi.getFolders();
      if (response.code === 200 && response.data) {
        setFolders([response.data]);
      }
    } catch (error) {
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
        setTotalFiles(Number.parseInt(response.data.total_count) || 0);
      }
    } catch (error) {
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
        toast({
          title: "Lỗi",
          description: response.message || "Không thể tạo thư mục",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Create folder error:", error);
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

  // Kiểm tra xem folder hiện tại có nằm trong power_point không
  const isPowerPointFolder = (): boolean => {
    const currentPath = getCurrentFolderPath();
    return currentPath === "power_point";
  };

  // Lấy URL upload từ environment variable
  const getUploadUrl = (): string => {
    let apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "https://Clever Schoolx-api.urp.vn";

    // Loại bỏ /api ở cuối nếu có
    if (apiBaseUrl.endsWith("/api")) {
      apiBaseUrl = apiBaseUrl.slice(0, -4); // Loại bỏ '/api'
    }

    return `${apiBaseUrl}/upload?width=100%&height=100%&path=power_point`;
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    try {
      setUploadLoading(true);
      const uploadPromises = Array.from(uploadedFiles).map(async (file) => {
        try {
          const result = await uploadFile(file, getCurrentFolderPath());
          return { success: true, fileName: file.name, result };
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
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
      console.error("Upload error:", error);
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

  const getFileType = (
    mimeType: string
  ): "image" | "video" | "audio" | "zip" | "other" => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
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
        toast({
          title: "Lỗi",
          description: response.message || "Không thể xóa thư mục",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Delete folder error:", error);
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
        toast({
          title: "Lỗi",
          description: response.message || "Không thể xóa file",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Delete file error:", error);
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
        <div
          className={`flex items-center justify-between group py-1 px-2 hover:bg-gray-100 cursor-pointer rounded text-sm ${
            selectedFolder === folder.id
              ? "bg-blue-50 text-blue-600 font-medium"
              : ""
          }`}
        >
          <div
            className="flex items-center gap-2 flex-1"
            onClick={() => {
              if (folder.children && folder.children.length > 0) {
                toggleFolder(folder.id);
              }
              setSelectedFolder(folder.id);
            }}
          >
            {folder.children && folder.children.length > 0 ? (
              expandedFolders.has(folder.id) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )
            ) : (
              <div className="w-4" />
            )}
            <Folder className="w-4 h-4 text-blue-500" />
            <span>{folder.path || "Root"}</span>
          </div>

          {folder.id !== "1" && (
            <Button
              size="sm"
              variant="ghost"
              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-red-500 hover:text-red-700"
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">File Manager</h1>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Nhập tên tệp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>

            <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
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

            {/* Large File Upload Iframe Dialog */}
            <Dialog
              open={largeFileUploadOpen}
              onOpenChange={setLargeFileUploadOpen}
            >
              <DialogContent className="max-w-6xl h-[80vh]">
                <div className="flex-1 h-full">
                  <iframe src={getUploadUrl()} width="100%" height="100%" />
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
              accept="image/*,video/*,audio/*,.zip,.rar,.7z"
              onChange={handleFileUpload}
              className="hidden"
            />

            {isPowerPointFolder() && (
              <Button
                className="gap-2 bg-purple-500 hover:bg-purple-600"
                onClick={() => setLargeFileUploadOpen(true)}
              >
                <HardDrive className="w-4 h-4" />
                UPLOAD FILE LỚN
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r h-screen overflow-y-auto">
          <div className="p-4">
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
              renderFolderTree(folders)
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
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
                                  const target = e.target as HTMLImageElement;
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
                              onClick={() => window.open(file.url, "_blank")}
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
                              disabled={deleteLoading === file.id.toString()}
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
                  Hiển thị {startItem}-{endItem} trong tổng số {totalFiles} file
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

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                  })}

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
      </div>
    </div>
  );
}
