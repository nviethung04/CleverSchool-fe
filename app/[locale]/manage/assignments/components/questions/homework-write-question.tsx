"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Upload,
  X,
  FileIcon,
  ImageIcon,
  Video,
  FileText,
  Loader2,
  Eye,
} from "lucide-react";
import { uploadFile } from "@/lib/api/questions";

interface HomeworkWriteQuestionProps {
  question: {
    id: string;
    content: {
      text: string;
    };
    metadata: {
      instructions: string;
    };
  };
  questionFiles?: {
    type: string;
    url: string;
  }[];
  userAnswer?: {
    uploadedFiles?: {
      type: string;
      url: string;
      name?: string;
    }[];
    isAnswered: boolean;
  };
  onAnswerUpdate: (answer: any) => void;
  isSubmitted?: boolean;
  studentAnswer?: any;
}

interface UploadedFile {
  id: string;
  type: string;
  url: string;
  name?: string;
  isUploading?: boolean;
  uploadProgress?: number;
}

export function HomeworkWriteQuestion({
  question,
  questionFiles = [],
  userAnswer,
  onAnswerUpdate,
  isSubmitted = false,
  studentAnswer,
}: HomeworkWriteQuestionProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevUploadedFilesRef = useRef<string>("");

  // Helper function để get file type (đặt trước useEffect để có thể dùng)
  const getFileTypeFromUrlHelper = useCallback((url: string): string => {
    const urlLower = url.toLowerCase();
    if (urlLower.includes(".pdf")) return "pdf";
    if (urlLower.includes(".doc") || urlLower.includes(".docx")) return "doc";
    if (
      urlLower.includes(".jpg") ||
      urlLower.includes(".jpeg") ||
      urlLower.includes(".png") ||
      urlLower.includes(".gif") ||
      urlLower.includes(".webp")
    )
      return "image";
    if (
      urlLower.includes(".mp4") ||
      urlLower.includes(".webm") ||
      urlLower.includes(".mov")
    )
      return "video";
    if (
      urlLower.includes(".mp3") ||
      urlLower.includes(".wav") ||
      urlLower.includes(".ogg")
    )
      return "audio";
    return "document";
  }, []);

  useEffect(() => {
    // Ưu tiên hiển thị đáp án đã làm nếu có
    if (studentAnswer?.file_urls && Array.isArray(studentAnswer.file_urls)) {
      const files = studentAnswer.file_urls.map(
        (url: string, index: number) => ({
          id: `student-${index}`,
          url,
          type: getFileTypeFromUrlHelper(url),
          name: `File ${index + 1}`,
        })
      );
      setUploadedFiles(files);
    } else if (
      userAnswer?.uploadedFiles &&
      userAnswer.uploadedFiles.length > 0
    ) {
      setUploadedFiles(
        userAnswer.uploadedFiles.map((file: any, index: number) => ({
          id: `file-${index}-${Date.now()}`,
          ...file,
        }))
      );
    } else {
      // Reset nếu không có data
      setUploadedFiles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  useEffect(() => {
    const checkDevice = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      const isMobileScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isMobileScreen);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  // Update answer when uploaded files change - sử dụng useMemo để tránh infinite loop
  const filesDataString = useMemo(
    () =>
      JSON.stringify(
        uploadedFiles.map((f) => ({
          type: f.type,
          url: f.url,
          name: f.name,
        }))
      ),
    [uploadedFiles]
  );

  useEffect(() => {
    // Chỉ update khi có thay đổi thực sự, tránh infinite loop
    if (prevUploadedFilesRef.current === filesDataString) {
      return;
    }

    prevUploadedFilesRef.current = filesDataString;

    const filesData = JSON.parse(filesDataString);
    const currentAnswer = {
      uploadedFiles: filesData,
      isAnswered: uploadedFiles.length > 0,
    };

    onAnswerUpdate(currentAnswer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filesDataString]);

  const getFileTypeFromUrl = useCallback(
    (url: string): string => {
      return getFileTypeFromUrlHelper(url);
    },
    [getFileTypeFromUrlHelper]
  );

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="w-6 h-6 text-blue-500" />;
      case "video":
        return <Video className="w-6 h-6 text-purple-500" />;
      case "pdf":
        return <FileText className="w-6 h-6 text-red-500" />;
      case "doc":
        return <FileText className="w-6 h-6 text-blue-600" />;
      default:
        return <FileIcon className="w-6 h-6 text-gray-500" />;
    }
  };

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      // Validate file size (max 50MB per file)
      const maxSize = 50 * 1024 * 1024;
      const oversizedFiles = files.filter((f) => f.size > maxSize);
      if (oversizedFiles.length > 0) {
        alert(
          `Một số file vượt quá 50MB: ${oversizedFiles
            .map((f) => f.name)
            .join(", ")}`
        );
        return;
      }

      // Add files to state with uploading status
      const newFiles: UploadedFile[] = files.map((file, index) => ({
        id: `new-${Date.now()}-${index}`,
        type: getFileTypeFromUrl(file.name),
        url: "",
        name: file.name,
        isUploading: true,
        uploadProgress: 0,
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);

      // Upload files one by one
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileObj = newFiles[i];

        try {
          const response = await uploadFile(file, "homework-files");
          const fileUrl =
            (response as any)?.url || (response as any)?.data?.url;

          if (!fileUrl) {
            throw new Error("Không nhận được URL file từ server");
          }

          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === fileObj.id
                ? {
                    ...f,
                    url: fileUrl,
                    isUploading: false,
                    uploadProgress: 100,
                  }
                : f
            )
          );
        } catch (error) {
          console.error("Error uploading file:", error);
          // Remove failed file
          setUploadedFiles((prev) => prev.filter((f) => f.id !== fileObj.id));
          alert(`Không thể tải file "${file.name}" lên. Vui lòng thử lại.`);
        }
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    []
  );

  const handleRemoveFile = useCallback((fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* QUESTION FILES SECTION - Hiển thị các file từ question_files */}
      {questionFiles && questionFiles.length > 0 && (
        <div className="flex-shrink-0 w-full max-w-5xl mx-auto px-4 pt-4 pb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <h3 className="text-lg font-bold text-[#32428D] mb-3">Bài tập:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {questionFiles.map((file, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        File {index + 1}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {file.type}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        window.open(file.url, "_blank");
                      }}
                      className="flex-shrink-0 p-1 hover:bg-blue-100 rounded transition-colors"
                      title="Xem file"
                    >
                      <Eye className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD SECTION - Cho phép học sinh upload file */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 pt-6 pb-4 overflow-y-auto">
        <div className="bg-white rounded-xl border-2 border-dashed border-[#60A5FA] p-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-[#32428D] mb-2">
              Upload bài làm của bạn
            </h3>
            <p className="text-sm text-gray-600">
              Bạn có thể upload nhiều file (ảnh, PDF, Word, v.v.)
            </p>
          </div>

          {/* Upload Button */}
          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt,video/*"
              disabled={isSubmitted}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitted}
              className="w-full bg-[#4285F4] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#3367D6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Chọn file để upload
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Tối đa 50MB mỗi file
            </p>
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-[#32428D]">
                Files đã upload ({uploadedFiles.length})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-shrink-0">
                      {file.isUploading ? (
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                      ) : (
                        getFileIcon(file.type)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {file.name || "File"}
                      </p>
                      {file.isUploading && (
                        <div className="mt-1">
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full transition-all"
                              style={{
                                width: `${file.uploadProgress || 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!file.isUploading && file.url && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(file.url, "_blank");
                          }}
                          className="flex-shrink-0 p-1 hover:bg-blue-100 rounded transition-colors"
                          title="Xem file"
                        >
                          <Eye className="w-5 h-5 text-blue-600" />
                        </button>
                      )}
                      {!isSubmitted && !file.isUploading && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(file.id);
                          }}
                          className="flex-shrink-0 p-1 hover:bg-red-100 rounded transition-colors"
                          title="Xóa file"
                        >
                          <X className="w-5 h-5 text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
