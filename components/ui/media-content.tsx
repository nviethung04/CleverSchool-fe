import React from "react";
import { Volume2 } from "lucide-react";

export type MediaType = "image" | "video" | "audio";

export interface MediaContentProps {
  media?: { type: MediaType; url: string };
  className?: string;
}

const MediaContent: React.FC<MediaContentProps> = ({ media, className }) => {
  if (!media) return null;

  switch (media.type) {
    case "image":
      return (
        <div className={className ? className + " mt-2" : "mt-2"}>
          <img
            src={media.url || "/placeholder.svg?height=120&width=180"}
            alt="Question media"
            className="max-w-full h-auto rounded border max-h-32"
          />
        </div>
      );
    case "video":
      return (
        <div className={className ? className + " mt-2" : "mt-2"}>
          <video
            controls
            className="max-w-full h-auto rounded border max-h-32"
            src={media.url}
          />
        </div>
      );
    case "audio":
      return (
        <div
          className={
            className
              ? className +
                " flex items-center space-x-2 p-2 bg-gray-100 rounded mt-2"
              : "flex items-center space-x-2 p-2 bg-gray-100 rounded mt-2"
          }
        >
          <Volume2 className="h-4 w-4" />
          <audio controls src={media.url} className="flex-1" />
        </div>
      );
    default:
      return null;
  }
};

export default MediaContent;
