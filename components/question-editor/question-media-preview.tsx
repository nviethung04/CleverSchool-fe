"use client";

import { useAppSelector } from "@/lib/redux/hooks";
import { useAppDispatch } from "@/lib/redux/hooks";
import {
  setQuestionImage,
  setQuestionAudio,
  setQuestionVideo,
} from "@/lib/redux/question-slice";
import { Button } from "@/components/ui/button";
import { LucideX } from "lucide-react";

export function QuestionMediaPreview() {
  const dispatch = useAppDispatch();
  const {
    questionImage,
    questionImagePreview,
    questionAudio,
    questionAudioPreview,
    questionVideo,
    questionVideoPreview,
    questionType,
  } = useAppSelector((state) => state.question);

  const handleRemoveImage = (index: number) => {
    dispatch(setQuestionImage({payload: { type: "image", url: "", previewUrl: "" }, index}));
  };

  const handleRemoveAudio = (index: number) => {
    dispatch(setQuestionAudio({payload: { type: "audio", url: "", previewUrl: "" }, index}));
  };

  const handleRemoveVideo = (index: number) => {
    dispatch(setQuestionVideo({payload: { type: "video", url: "", previewUrl: "" }, index}));
  };

  // Đối với labeling, không hiển thị questionImage (chỉ dùng labelImage)
  const shouldShowImage = questionType !== "labeling" && questionImage  && questionImage.length > 0;
  const shouldShowAudio = questionAudio  && questionAudio.length > 0;
  const shouldShowVideo = questionVideo  && questionVideo.length > 0;

  if (!shouldShowImage && !shouldShowAudio && !shouldShowVideo) {
    return null;
  }

  return (
    <div className="space-y-3 mt-3">
      {shouldShowImage &&
        questionImagePreview &&
        questionImagePreview.map((image, index) => {
          return (
            <div
              key={image.url || 'image' + index}
              className="relative border rounded-md overflow-hidden"
            > 
            <div className="absolute top-2 right-2 z-10">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={() => handleRemoveImage(index)}
                >
                  <LucideX className="h-3 w-3" />
                </Button>
              </div>
              <img
                src={image.url}
                alt="Question"
                className="max-h-[300px] w-full object-contain"
              />
            </div>
          )
        })
      }
      {shouldShowAudio &&
        questionAudioPreview &&
        questionAudioPreview.map((audio, index) => {
          return (
            <div
              key={audio.url || 'audio' + index}
              className="relative border rounded-md p-3 bg-gray-50"
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 absolute top-2 right-2"
                onClick={() => handleRemoveAudio(index)}
              >
                <LucideX className="h-3 w-3" />
              </Button>
              <audio controls className="w-full mt-2">
                <source src={audio.url} />
                Your browser does not support the audio element.
              </audio>
            </div>
          )
        })
      }
      {shouldShowVideo &&
        questionVideoPreview &&
        questionVideoPreview.map((video, index) => {
          return (
            <div
              key={video.url || 'video' + index}
              className="relative border rounded-md overflow-hidden"
            >
              <div className="absolute top-2 right-2 z-10">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={() => handleRemoveVideo(index)}
                >
                  <LucideX className="h-3 w-3" />
                </Button>
              </div>
              <video controls className="max-h-[300px] w-full">
                <source src={video.url} />
                Your browser does not support the video element.
              </video>
            </div>
          )
        })
      }
    </div>
  );
}
