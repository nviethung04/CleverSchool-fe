"use client";

import { Button } from "@/components/ui/button";
import { LucideImage, LucideMic, LucideX } from "lucide-react";
import { MediaUploadDialog } from "./media-upload-dialog";

interface ItemMediaUploadProps {
  onImageSelect: (url: string, previewUrl?: string) => void;
  onAudioSelect?: (url: string, previewUrl?: string) => void;
  currentImage?: string;
  currentImagePreview?: string;
  currentAudio?: string;
  className?: string;
  hidePreview?: boolean;
}

export function ItemMediaUpload({
  onImageSelect,
  onAudioSelect,
  currentImage,
  currentImagePreview,
  currentAudio,
  className = "",
  hidePreview = false,
}: ItemMediaUploadProps) {
  const handleRemoveImage = () => {
    onImageSelect("", "");
  };

  const handleRemoveAudio = () => {
    if (onAudioSelect) {
      onAudioSelect("", "");
    }
  };

  return (
    <div className={className}>
      <div className="flex gap-1">
        <MediaUploadDialog
          type="image"
          onMediaSelect={onImageSelect}
          trigger={
            <Button
              variant="outline"
              size="icon"
              className={`${currentImage
                  ? "bg-blue-600 border-blue-500 text-white hover:bg-blue-700 hover:text-white"
                  : "bg-purple-800 border-purple-700 text-white hover:bg-purple-700 hover:text-white"
                } h-8 w-8`}
            >
              <LucideImage className="h-4 w-4" />
            </Button>
          }
        />

        {onAudioSelect && (
          <MediaUploadDialog
            type="audio"
            onMediaSelect={onAudioSelect}
            trigger={
              <Button
                variant="outline"
                size="icon"
                className={`${currentAudio
                    ? "bg-green-600 border-green-500 text-white hover:bg-green-700 hover:text-white"
                    : "bg-purple-800 border-purple-700 text-white hover:bg-purple-700 hover:text-white"
                  } h-8 w-8`}
              >
                <LucideMic className="h-4 w-4" />
              </Button>
            }
          />
        )}
      </div>

      {!hidePreview && (
        <>
          {currentImage && (
            <div className="mt-2 relative border border-white/30 rounded overflow-hidden">
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 rounded-full z-10"
                onClick={handleRemoveImage}
              >
                <LucideX className="h-3 w-3" />
              </Button>
              <img
                src={currentImagePreview || currentImage}
                alt="Item"
                className="w-full h-auto max-h-[150px] object-contain"
              />
            </div>
          )}

          {currentAudio && onAudioSelect && (
            <div className="mt-2 relative border border-white/30 rounded overflow-hidden p-2 bg-gray-50">
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 rounded-full z-10"
                onClick={handleRemoveAudio}
              >
                <LucideX className="h-3 w-3" />
              </Button>
              <audio controls className="w-full">
                <source src={currentAudio} />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </>
      )}
    </div>
  );
}
