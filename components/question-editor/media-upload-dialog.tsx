"use client";

import type React from "react";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LucideImage,
  LucideMic,
  LucideVideo,
  LucideUpload,
  LucideSearch,
  LucideX,
  LucideLoader2,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { postMultipartUpload } from "@/lib/api/axios";
import { useTranslations } from "next-intl";
import { useAppSelector } from "@/lib/redux/hooks";
import { QUESTION_MEDIA_URL_LIBRARY_UI_ENABLED } from "@/config/hiddenModules";

type MediaType = "image" | "audio" | "video";

interface MediaUploadDialogProps {
  type: MediaType;
  onMediaSelect: (url: string, previewUrl?: string) => void;
  trigger?: React.ReactNode;
  className?: string;
}

export function MediaUploadDialog({
  type,
  onMediaSelect,
  trigger,
  className = "",
}: MediaUploadDialogProps) {
  const t = useTranslations("mediaDialog");
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "url" | "library">(
    "upload"
  );
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    questionAudio,
    questionImage
  } = useAppSelector((state) => state.question);

  // check max 2 media 
  const checkMaxMedia = () => {
    if ((questionAudio?.length || 0) + (questionImage?.length || 0) >= 2) {
      alert("Chỉ được có tối đa 2 media bất kỳ!")
      setOpen(false)
      setUploadedFile(null)
      setPreviewUrl(null)
      return true
    }
    return false
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(checkMaxMedia()) return
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);

    // Create a preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!uploadedFile) return;

    setIsUploading(true);

    try {
      // Tạo FormData để gửi file
      const formData = new FormData();
      formData.append("path", "user/media");
      formData.append("file", uploadedFile);

      const response = await postMultipartUpload(formData, "/upload-file");

      console.log("Upload response:", response.data);

      // Lấy URL từ response
      const fileUrl = response.data.data.url;

      if (fileUrl) {
        // Lưu cả URL từ API và URL preview
        onMediaSelect(fileUrl, previewUrl || "");
        setOpen(false);
        // Reset state after successful upload
        setUploadedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        toast({
          title: "Tải lên thành công",
          description: "File đã được tải lên thành công",
        });
      } else {
        throw new Error("Không nhận được URL file từ server");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Lỗi tải lên",
        description: "Không thể tải file lên. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (mediaUrl.trim()) {
      // Khi nhập URL trực tiếp, URL preview và URL API là giống nhau
      onMediaSelect(mediaUrl.trim(), mediaUrl.trim());
      setOpen(false);
      // Reset state after successful submission
      setMediaUrl("");
    }
  };

  const clearSelection = () => {
    setUploadedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Sample library items for demonstration
  const libraryItems = [
    { id: 1, url: "/lush-forest-stream.png", title: "Nature" },
    { id: 2, url: "/vibrant-cityscape.png", title: "City" },
    { id: 3, url: "/diverse-group-outdoors.png", title: "People" },
    { id: 4, url: "/diverse-animal-kingdom.png", title: "Animals" },
  ];

  const getTypeIcon = () => {
    switch (type) {
      case "image":
        return <LucideImage className="h-4 w-4" />;
      case "audio":
        return <LucideMic className="h-4 w-4" />;
      case "video":
        return <LucideVideo className="h-4 w-4" />;
    }
  };

  const getTypeTitle = () => {
    switch (type) {
      case "image":
        return t("title.image");
      case "audio":
        return t("title.audio");
      case "video":
        return t("title.video");
    }
  };

  const getAcceptTypes = () => {
    switch (type) {
      case "image":
        return "image/*";
      case "audio":
        return "audio/*";
      case "video":
        return "video/*";
    }
  };

  const uploadPanel = (
    <div className="space-y-4">
      <div className="grid gap-4">
        <div className="border-2 border-dashed rounded-lg p-4 text-center">
          {previewUrl ? (
            <div className="relative">
              <div className="absolute top-2 right-2">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={clearSelection}
                >
                  <LucideX className="h-3 w-3" />
                </Button>
              </div>
              {type === "image" && (
                <img
                  src={previewUrl || "/placeholder.svg"}
                  alt="Preview"
                  className="max-h-[200px] mx-auto object-contain rounded-md"
                />
              )}
              {type === "audio" && (
                <audio controls className="w-full mt-2">
                  <source src={previewUrl} />
                  Your browser does not support the audio element.
                </audio>
              )}
              {type === "video" && (
                <video controls className="max-h-[200px] mx-auto rounded-md">
                  <source src={previewUrl} />
                  Your browser does not support the video element.
                </video>
              )}
              <p className="mt-2 text-sm text-gray-500">{uploadedFile?.name}</p>
            </div>
          ) : (
            <>
              <LucideUpload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <div className="text-center">
                  <Label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md bg-white font-semibold text-purple-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-purple-600 focus-within:ring-offset-2 hover:text-purple-500"
                  >
                    <span>{t("uploadFile")}</span>
                    <Input
                      id="file-upload"
                      ref={fileInputRef}
                      type="file"
                      accept={getAcceptTypes()}
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </Label>
                  <span className="text-sm text-gray-600"> {t("orDragDrop")}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {type === "image" && t("hints.image")}
                {type === "audio" && t("hints.audio")}
                {type === "video" && t("hints.video")}
              </p>
            </>
          )}
        </div>
        <Button onClick={handleUpload} disabled={!uploadedFile || isUploading}>
          {isUploading ? (
            <>
              <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("uploading")}
            </>
          ) : (
            t("upload")
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className={className}>
            {getTypeIcon()}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getTypeTitle()}</DialogTitle>
        </DialogHeader>

        {!QUESTION_MEDIA_URL_LIBRARY_UI_ENABLED ? (
          uploadPanel
        ) : (
        <Tabs
          defaultValue="upload"
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
        >
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="upload">{t("tabs.upload")}</TabsTrigger>
            <TabsTrigger value="url">{t("tabs.url")}</TabsTrigger>
            <TabsTrigger value="library">{t("tabs.library")}</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            {uploadPanel}
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="media-url">
                  {type === "image" && t("urlLabel.image")}
                  {type === "audio" && t("urlLabel.audio")}
                  {type === "video" && t("urlLabel.video")}
                </Label>
                <Input
                  id="media-url"
                  placeholder={
                    type === "image"
                      ? t("urlPlaceholder.image")
                      : type === "audio"
                      ? t("urlPlaceholder.audio")
                      : t("urlPlaceholder.video")
                  }
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                />
              </div>
              <Button onClick={handleUrlSubmit}>{t("useUrl")}</Button>
            </div>
          </TabsContent>

          <TabsContent value="library" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium">{t("yourLibrary")}</h4>
              <div className="relative">
                <LucideSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input className="pl-8" placeholder={t("searchPlaceholder")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {libraryItems.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-md p-2 cursor-pointer hover:border-purple-500"
                  onClick={() => {
                    // Với thư viện, URL preview và URL API là giống nhau
                    onMediaSelect(item.url, item.url);
                    setOpen(false);
                  }}
                >
                  {type === "image" && (
                    <img
                      src={item.url || "/placeholder.svg"}
                      alt={item.title}
                      className="w-full h-24 object-cover rounded-md"
                    />
                  )}
                  {type === "audio" && (
                    <div className="h-24 flex items-center justify-center bg-gray-100 rounded-md">
                      <LucideMic className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  {type === "video" && (
                    <div className="h-24 flex items-center justify-center bg-gray-100 rounded-md">
                      <LucideVideo className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <p className="mt-1 text-sm truncate">{item.title}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
