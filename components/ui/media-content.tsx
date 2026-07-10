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

export type AnswerOptionLike = {
  content?: string;
  file_url?: string;
  kind?: string;
};

function inferMediaKind(
  kind?: string,
  url?: string
): "image" | "video" | "audio" | "text" {
  const normalized = (kind || "").toLowerCase();
  if (normalized === "audio" || normalized === "video" || normalized === "image") {
    return normalized;
  }
  if (!url) return "text";
  if (/\.(mp3|wav|ogg|m4a|aac|flac)(\?|$)/i.test(url)) return "audio";
  if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) return "video";
  if (/\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url)) return "image";
  return "text";
}

export function RenderAnswerOptionContent({
  option,
}: {
  option: AnswerOptionLike;
}) {
  const mediaKind = inferMediaKind(option.kind, option.file_url);

  return (
    <div className="flex items-center space-x-2 flex-1 min-w-0">
      {option.content ? <span>{option.content}</span> : null}
      {option.file_url && mediaKind === "audio" ? (
        <audio controls src={option.file_url} className="max-w-full h-8" />
      ) : null}
      {option.file_url && mediaKind === "video" ? (
        <video
          controls
          src={option.file_url}
          className="max-h-20 max-w-full rounded border"
        />
      ) : null}
      {option.file_url && mediaKind === "image" ? (
        <img
          src={option.file_url || "/placeholder.svg"}
          alt="Answer option"
          className="max-h-12 max-w-24 object-contain"
        />
      ) : null}
    </div>
  );
}

export function isMcOptionSelected(
  studentAnswer: {
    selectedAnswerIds?: Array<string | number>;
    selectedAnswers?: string[];
    selectedFileUrls?: string[];
  },
  option: AnswerOptionLike & { id?: string | number }
) {
  const optionId = option.id != null ? Number(option.id) : null;
  if (
    optionId != null &&
    studentAnswer.selectedAnswerIds?.some((id) => Number(id) === optionId)
  ) {
    return true;
  }
  if (
    option.file_url &&
    studentAnswer.selectedFileUrls?.includes(option.file_url)
  ) {
    return true;
  }
  if (
    option.content &&
    studentAnswer.selectedAnswers?.includes(option.content)
  ) {
    return true;
  }
  return false;
}

export function isMcOptionCorrect(
  correctAnswer: {
    correctAnswerIds?: Array<string | number>;
    correctAnswers?: string[];
    correctFileUrls?: string[];
  },
  option: AnswerOptionLike & { id?: string | number }
) {
  const optionId = option.id != null ? Number(option.id) : null;
  if (
    optionId != null &&
    correctAnswer.correctAnswerIds?.some((id) => Number(id) === optionId)
  ) {
    return true;
  }
  if (
    option.file_url &&
    correctAnswer.correctFileUrls?.includes(option.file_url)
  ) {
    return true;
  }
  if (
    option.content &&
    correctAnswer.correctAnswers?.includes(option.content)
  ) {
    return true;
  }
  return false;
}

export default MediaContent;
