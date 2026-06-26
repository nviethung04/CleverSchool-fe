"use client";
import { useState, useEffect, useRef } from "react";
import { TiptapMathViewer } from "@/components/question-editor/tiptap-math-viewer";
import { MediaDisplay } from "../media-display";
import { AudioEffects, isAudioExcludedKey } from "@/lib/utils/audio-utils";
import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";

interface WritingQuestionProps {
  question: {
    id: string;
    text?: string;
    kind: string;
    type: string;
    skill: string;
    level: string;
    topic: string;
    metadata: {
      instructions: string;
      points: number;
      time: number;
    };
    content: {
      text: string;
      media?: {
        type: "image" | "audio" | "video" | "text";
        url: string;
      };
      medias?: {
        type: "image" | "audio" | "video" | "text";
        url: string;
      }[]
      prompt?: string;
    };
    options: {
      maxCharacters?: number;
      allowRichText?: boolean;
      allowImageUpload?: boolean;
    };
  };
  userAnswer?: {
    text: string;
    richText?: string;
    image?: string;
    isAnswered: boolean;
  };
  onAnswerUpdate: (answer: any) => void;
  onSkip?: () => void;
  onCheck?: () => void;
  onFeedback?: (state: "correct" | "incorrect" | "initial") => void;
  isSubmitted?: boolean;
  className?: string;
  studentAnswer?: any;
}

// Helper function để validate xem text có thực sự empty không (bao gồm cả empty HTML tags)
function isTextContentEmpty(text: string | undefined | null): boolean {
  // Kiểm tra null, undefined hoặc chuỗi rỗng
  if (!text) return true;

  // Loại bỏ khoảng trống và kiểm tra xem nội dung còn lại có rỗng không
  const trimmed = text.trim();
  if (!trimmed) return true;

  // Loại bỏ HTML tags và kiểm tra xem nội dung còn lại có rỗng không
  const withoutTags = trimmed.replace(/<[^>]*>/g, "").trim();
  if (!withoutTags) return true;

  // Kiểm tra các mẫu rỗng phổ biến như &nbsp;
  const withoutEntities = withoutTags
    .replace(/&nbsp;|&#160;|\u00A0/g, "")
    .trim();
  return !withoutEntities;
}

export function WritingQuestion({
  question,
  userAnswer,
  onAnswerUpdate,
  onSkip,
  onCheck,
  onFeedback,
  isSubmitted = false,
  className = "",
  studentAnswer,
}: WritingQuestionProps) {
  const [text, setText] = useState(userAnswer?.text || "");
  const [isMobile, setIsMobile] = useState(false);
  // Audio player states (match Multiple Choice)
  const [isPlaying, setIsPlaying] = useState(false);

  // Writing: only enforce a character limit when explicitly provided (> 0).
  const maxCharacters =
    question.options?.maxCharacters && question.options.maxCharacters > 0
      ? question.options.maxCharacters
      : undefined;
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Ưu tiên hiển thị đáp án đã làm nếu có
    if (studentAnswer?.answer) {
      setText(studentAnswer.answer);
    } else {
      setText(userAnswer?.text || "");
    }
  }, [question.id, studentAnswer?.answer]);

  useEffect(() => {
    const checkDevice = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      const isMobileScreen = window.innerWidth <= 768;
      const newIsMobile = isMobileDevice || isMobileScreen;

      setIsMobile(newIsMobile);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  // Handle typing audio feedback
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isSubmitted) return;

    // Play type audio feedback on key press (except for some special keys)
    if (!isAudioExcludedKey(e.key)) {
      AudioEffects.type();
    }
  };

  // Update answer when content changes
  useEffect(() => {
    onAnswerUpdate({
      text,
      isAnswered: text.trim().length > 0,
      wordCount: text.trim() ? text.trim().split(/\s+/).length : 0,
      characterCount: text.length,
    });
  }, [text, onAnswerUpdate]);

  // Audio helpers (reuse behavior from Multiple Choice)
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getProgressPercentage = (): number => {
    if (!duration) return 0;
    return (currentTime / duration) * 100;
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [question.content.media?.url]);

  const mediasWithImage = question.content.medias?.find((media) => media.type === "image")

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* QUESTION LAYOUT (TOP) */}
      <div className="flex-shrink-0 w-full max-w-5xl mx-auto px-4 pt-4 pb-3 sm:pt-6 sm:pb-4 landscape:pt-3 landscape:pb-2">
        {question.content.medias && question.content.medias.length > 1 ? 
          <>
            {/* Text content trên (nếu có) */}
              {!isTextContentEmpty(question.content.text) && (
                <div className="w-full flex items-center justify-center mb-5">
                  <div className="text-center">
                    <TiptapMathViewer
                      className={`text-[#32428D] font-medium leading-relaxed text-center ${
                        isMobile
                          ? "text-sm sm:text-base"
                          : "text-base lg:text-lg xl:text-xl 2xl:text-2xl"
                      } whitespace-normal break-words`}
                      value={question.content.text}
                    />
                  </div>
                </div>
              )
            }
            <div className={`flex flex-1 gap-6 flex-wrap justify-center items-center sm:px-8 ${mediasWithImage ? "sm:flex-nowrap" : ""}`}>
              {question.content.medias.map((media, index) => {
                if (media.type === 'audio') {
                  return (
                    <audio
                      key={index}
                      controls
                      src={media.url}
                      preload="metadata"
                      className={"lg:w-3/5 sm:w-4/5 w-full"}
                    />
                  )
                }
                if (media.type === 'image') {
                  return (
                    <MediaDisplay
                      key={index}
                      media={media}
                      alt="Hình ảnh câu hỏi"
                      className="max-h-full max-w-full object-contain rounded-xl shadow-lg w-1/5"
                    />
                  )
                }
              })}
            </div>
          </>
        :
        question.content.media && question.content.media?.type !== "text" ? (
          // If audio, render the same Simple Audio Player UI as Multiple Choice
          question.content.media?.type === "audio" ? (
            <div className="flex flex-col items-center gap-6 landscape:gap-4 max-w-5xl mx-auto">
              {!isTextContentEmpty(question.content.text) && (
                <div className="w-full flex items-center justify-center">
                  <div className="text-center">
                    <TiptapMathViewer
                      className={`text-[#32428D] font-medium leading-relaxed text-center ${isMobile ? "text-sm sm:text-base" : "text-base lg:text-lg xl:text-xl 2xl:text-2xl"} whitespace-normal break-words`}
                      value={question.content.text}
                    />
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm w-full max-w-md">
                <audio
                  ref={audioRef}
                  src={question.content.media.url}
                  preload="metadata"
                />

                <div className="flex items-center gap-4">
                  <motion.button
                    onClick={togglePlayPause}
                    className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" />
                    )}
                  </motion.button>

                  <div className="flex-1">
                    <style jsx>{`
                      .simple-range-slider::-webkit-slider-thumb {
                        appearance: none;
                        width: 16px;
                        height: 16px;
                        border-radius: 50%;
                        background: #3b82f6;
                        cursor: pointer;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                        border: 2px solid white;
                      }
                      .simple-range-slider::-moz-range-thumb {
                        width: 16px;
                        height: 16px;
                        border-radius: 50%;
                        background: #3b82f6;
                        cursor: pointer;
                        border: 2px solid white;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                      }
                    `}</style>
                    <input
                      type="range"
                      min="0"
                      max={duration || 0}
                      value={currentTime}
                      step="any"
                      onChange={handleSeek}
                      className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer simple-range-slider"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${getProgressPercentage()}%, #e5e7eb ${getProgressPercentage()}%, #e5e7eb 100%)`,
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : // Non-audio media paths (image/video) retain existing layout
            isTextContentEmpty(question.content.text) ? (
              <div className="flex justify-center">
                <MediaDisplay
                  media={question.content.media}
                  className={`object-cover rounded-xl shadow-lg ${isMobile ? "max-h-40 max-w-56" : "max-h-64 max-w-2xl"
                    }`}
                  showControls={true}
                />
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 md:gap-6">
                <div className="flex-shrink-0 flex justify-center">
                  <MediaDisplay
                    media={question.content.media}
                    className={`object-contain rounded-xl shadow-lg ${isMobile ? "max-h-32 max-w-40" : "max-h-52 max-w-64"
                      }`}
                    showControls={true}
                  />
                </div>
                <div className="flex-1 flex items-center justify-center sm:justify-start">
                  <div className="w-full text-center sm:text-left">
                    <div className={`text-[#32428D] font-medium leading-relaxed ${isMobile ? "text-sm sm:text-base" : "text-base lg:text-lg xl:text-xl 2xl:text-2xl"}`}>
                      <TiptapMathViewer
                        value={
                          question.content.text?.split("\n").join("<br />") || ""
                        }
                        isHtml
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
        ) : (
          <div className="text-center">
            <div className={`text-[#32428D] font-medium leading-relaxed ${isMobile ? "text-sm sm:text-base" : "text-base lg:text-lg xl:text-xl 2xl:text-2xl"}`}>
              <TiptapMathViewer
                value={question.content.text?.split("\n").join("<br />") || ""}
                isHtml
              />
            </div>
          </div>
        )}
      </div>

      {/* ANSWER LAYOUT (BOTTOM) - Flexible height with more spacing */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 pt-6 sm:pt-8 md:pt-12 lg:pt-16 pb-4 sm:pb-6 landscape:pt-4 landscape:pb-3 flex items-start justify-center">
        <div className="w-full max-w-3xl">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitted}
            placeholder="Viết đáp án của bạn..."
            className="w-full p-3 sm:p-4 text-[#32428D] text-base sm:text-lg font-medium border-2 border-[#60A5FA] rounded-xl resize-none focus:outline-none focus:border-[#60A5FA] focus:ring-2 focus:ring-[#60A5FA] placeholder-gray-400 bg-white"
            style={{
              height: isMobile ? "8rem" : "12rem", // Mobile: 128px, Desktop: 288px
              minHeight: isMobile ? "8rem" : "12rem",
            }}
            maxLength={maxCharacters}
          />
          <div className="mt-2 text-right">
            <span className="text-[#32428D] text-sm">
              {maxCharacters ? `${text.length}/${maxCharacters}` : `${text.length}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
