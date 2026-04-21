"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { X, Upload, ImageIcon, Video } from "lucide-react"
import { useTranslations } from 'next-intl';

interface FileItem {
  id: string
  file: File
  type: "image" | "video" | "document"
  preview?: string
  serverUrl?: string
}

interface FileUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onSendFiles: (fileItems: FileItem[], message?: string) => void
  maxFiles?: number
  maxFileSize?: number // in MB
}

export default function FileUploadDialog({
  isOpen,
  onClose,
  onSendFiles,
  maxFiles = 10,
  maxFileSize = 50,
}: FileUploadDialogProps) {
  const t = useTranslations('chat');
  const [files, setFiles] = useState<FileItem[]>([])
  const [message, setMessage] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files || [])

      console.log("[v0] FileUploadDialog: Selected files:", selectedFiles.length)

      const newFiles: FileItem[] = selectedFiles.map((file, index) => {
        const fileType = file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("video/")
            ? "video"
            : "document"

        const fileItem: FileItem = {
          id: `file-${Date.now()}-${index}`,
          file,
          type: fileType,
        }

        // Create preview for images
        if (fileType === "image") {
          fileItem.preview = URL.createObjectURL(file)
        }

        return fileItem
      })

      setFiles((prev) => [...prev, ...newFiles].slice(0, maxFiles))
    },
    [maxFiles],
  )

  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles((prev) => {
      const updated = prev.filter((f) => f.id !== fileId)
      // Clean up preview URLs
      const removed = prev.find((f) => f.id === fileId)
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview)
      }
      return updated
    })
  }, [])

  const handleSend = useCallback(async () => {
    if (files.length === 0) return

    console.log("[v0] FileUploadDialog: Starting upload process...")
    console.log(
      "[v0] Files to upload:",
      files.map((f) => ({ name: f.file.name, size: f.file.size, type: f.file.type })),
    )

    setIsUploading(true)

    try {
      await onSendFiles(files, message)

      // Clean up
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })

      setFiles([])
      setMessage("")
      onClose()
    } catch (error) {
      console.error("[v0] FileUploadDialog: Upload failed:", error)
      alert(`${t("uploadFailed")}: ${error instanceof Error ? error.message : t("unknownError")}`)
    } finally {
      setIsUploading(false)
    }
  }, [files, message, onSendFiles, onClose])

  const getFileIcon = (type: string) => {
    if (type === "image") return <ImageIcon className="w-4 h-4" />
    if (type === "video") return <Video className="w-4 h-4" />
    return <ImageIcon className="w-4 h-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("uploadFiles")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Input */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 mb-2">{t("dragDropFiles")}</p>
            <Input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById("file-input")?.click()}
              disabled={files.length >= maxFiles}
            >
              {t("selectFiles")}
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              {t("maxFiles", { maxFiles, maxFileSize })}
            </p>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">{t("selectedFiles", { count: files.length })}</h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {files.map((fileItem) => (
                  <div key={fileItem.id} className="flex items-center gap-3 p-2 border rounded">
                    {fileItem.preview ? (
                      <img
                        src={fileItem.preview || "/placeholder.svg"}
                        alt={fileItem.file.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                        {getFileIcon(fileItem.type)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{fileItem.file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(fileItem.file.size)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(fileItem.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message Input */}
          <div>
            <label className="block text-sm font-medium mb-2"></label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("addMessageWithFiles")}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isUploading}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSend} disabled={files.length === 0 || isUploading}>
              {isUploading ? t("uploading") : t("sendFileCount", { count: files.length })}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
