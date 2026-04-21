"use client"

import { Button } from "@/components/ui/button"
import { LucideImage, LucideMic, LucideVideo } from "lucide-react"
import { useAppDispatch } from "@/lib/redux/hooks"
import { useAppSelector } from "@/lib/redux/hooks";
import { setQuestionImage, setQuestionAudio, setQuestionVideo } from "@/lib/redux/question-slice"
import { MediaUploadDialog } from "./media-upload-dialog"

interface QuestionMediaControlsProps {
  className?: string
}

export function QuestionMediaControls({ className = "" }: QuestionMediaControlsProps) {
  const dispatch = useAppDispatch()
  const {
    questionType
  } = useAppSelector((state) => state.question);

  const handleImageSelect = (url: string, previewUrl?: string) => {
    dispatch(setQuestionImage({ payload: { type: 'image', url, previewUrl }}))
  }

  const handleAudioSelect = (url: string, previewUrl?: string) => {
    dispatch(setQuestionAudio({ payload: { type: 'audio', url, previewUrl }}))
  }

  const handleVideoSelect = (url: string, previewUrl?: string) => {
    dispatch(setQuestionVideo({ payload: { type: 'video', url, previewUrl }}))
  }

  const shouldShowImage = questionType !== "labeling"

  return (
    <div className={`flex space-x-2 ${className}`}>
      {shouldShowImage && 
        <MediaUploadDialog
          type="image"
          onMediaSelect={handleImageSelect}
          trigger={
            <Button variant="ghost" size="icon" className="text-white opacity-70 hover:opacity-100 hover:bg-white/20">
              <LucideImage className="h-4 w-4" />
            </Button>
          }
        />
      }
      <MediaUploadDialog
        type="audio"
        onMediaSelect={handleAudioSelect}
        trigger={
          <Button variant="ghost" size="icon" className="text-white opacity-70 hover:opacity-100 hover:bg-white/20">
            <LucideMic className="h-4 w-4" />
          </Button>
        }
      />
      <MediaUploadDialog
        type="video"
        onMediaSelect={handleVideoSelect}
        trigger={
          <Button variant="ghost" size="icon" className="text-white opacity-70 hover:opacity-100 hover:bg-white/20">
            <LucideVideo className="h-4 w-4" />
          </Button>
        }
      />
    </div>
  )
}
