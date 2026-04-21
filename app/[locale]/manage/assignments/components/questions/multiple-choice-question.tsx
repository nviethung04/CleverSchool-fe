"use client";

import { useState, useEffect, useRef } from "react";
import type { QuestionType } from "@/lib/api/questions";
import { MediaDisplay } from "../media-display";
import { TiptapMathViewer } from "@/components/question-editor/tiptap-math-viewer";
import { LatexText } from "@/components/latex-text";
import MobileOrientationGuard from "@/components/MobileOrientationGuard";
import {
  CheckCircle,
  Star,
  XCircle,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AudioEffects } from "@/lib/utils/audio-utils";
import { motion } from "framer-motion";

interface MultipleChoiceQuestionProps {
  question: QuestionType;
  selectedAnswerIds?: (string | number)[];
  onAnswerSelect: (answerIds: (string | number)[]) => void;
  isSubmitted: boolean;
  correctAnswer?: any;
}

// Shuffle answers
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function processTextForLatex(text: string): string {
  if (!text) return "";
  let processed = text.replace(/<[^>]*>/g, ""); // remove HTML tags
  return processed;
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

export function MultipleChoiceQuestion({
  question,
  selectedAnswerIds = [],
  onAnswerSelect,
  isSubmitted,
  correctAnswer,
}: MultipleChoiceQuestionProps) {
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [shuffledAnswers, setShuffledAnswers] = useState<any[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Audio player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isMultipleChoice =
    question.correct_answers?.ids && question.correct_answers.ids.length > 1;

  useEffect(() => {
    setSelectedIds(selectedAnswerIds);
  }, [selectedAnswerIds]);

  useEffect(() => {
    if (question.options.answers) {
      setShuffledAnswers(shuffleArray(question.options.answers));
    }
  }, [question.options.answers]);

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

  // Audio player functions
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

  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    audioRef.current.muted = newMutedState;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      audioRef.current.muted = false;
    }
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

  const handleOptionSelect = (answerId: string | number) => {
    if (isSubmitted) return;

    let newSelectedIds: (string | number)[] = isMultipleChoice
      ? selectedIds.includes(answerId)
        ? selectedIds.filter((id) => id !== answerId)
        : [...selectedIds, answerId]
      : [answerId];

    setSelectedIds(newSelectedIds);
    onAnswerSelect(newSelectedIds);

    if (isSubmitted && correctAnswer?.ids?.includes(answerId)) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
  };

  const hasMedia =
    question.content.media && question.content.media.type !== "text";

  const correctIds = correctAnswer?.ids || [];
  const isShowCorrect = !!correctAnswer;

  const renderOptions = () =>
    shuffledAnswers.map((option, index) => {
      const isSelected = selectedIds.includes(option.id);
      // Thử cả option.id và index để tương thích với cả hai cách lưu trữ
      // Convert về cùng type để so sánh đúng
      const isCorrect =
        correctIds.includes(Number(option.id)) ||
        correctIds.includes(String(option.id)) ||
        correctIds.includes(option.id) ||
        correctIds.includes(index);
      const hasOptionMedia = option.media && option.media.url;

      return (
        <button
          key={option.id}
          onClick={() => handleOptionSelect(option.id)}
          disabled={isShowCorrect}
          className={`
            relative w-full max-w-[250px] sm:max-w-[300px] md:max-w-[350px] lg:max-w-[400px] xl:max-w-[450px] landscape:max-w-[280px] 
            min-h-[50px] sm:min-h-[55px] md:min-h-[60px] landscape:min-h-[40px] rounded-lg sm:rounded-xl border-2 overflow-hidden
            flex flex-col items-center justify-center
            transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98]
            ${
              isShowCorrect && isCorrect
                ? "!border-green-400 !bg-green-50 !shadow-green-200"
                : isShowCorrect && isSelected && !isCorrect
                ? "!border-red-400 !bg-red-50 !shadow-red-200"
                : !isShowCorrect && isSelected
                ? "!border-blue-400 !bg-blue-50 !shadow-blue-200 scale-[1.02]"
                : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-blue-100"
            }
          `}
        >
          {/* Image background - sử dụng img tag thay vì backgroundImage */}
          {hasOptionMedia && option.media.type === "image" && (
            <img
              src={option.media.url}
              alt={option.text || ""}
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
          )}

          {/* Correct marker */}
          {isCorrect && isShowCorrect && (
            <div className="absolute top-2 right-2 z-10">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          )}

          {/* Wrong marker */}
          {isShowCorrect && isSelected && !isCorrect && (
            <div className="absolute top-2 right-2 z-10">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          )}

          {/* Selected marker (when not showing correct answers) */}
          {isSelected && !isShowCorrect && (
            <div className="absolute top-2 right-2 z-10">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
          )}

          {hasOptionMedia && option.media.type === "image" ? (
            // Layout cho đáp án có ảnh: Fix height
            <div className="relative z-10 h-[120px] sm:h-[140px] md:h-[160px] lg:h-[180px] w-full">
              {/* Text overlay nếu có text */}
              {option.text && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2">
                  {/* Hiển thị tối đa 2 dòng */}
                  <div className="text-xs font-medium text-center line-clamp-2">
                    <LatexText
                      value={processTextForLatex(option.text)}
                      inline
                    />
                  </div>
                </div>
              )}
            </div>
          ) : hasOptionMedia && option.media.type === "audio" ? (
            <div className="relative z-10 h-[70px] w-full">
              <div className="absolute bottom-0 left-0 right-0 bg-gray/60 text-white p-2">
                <audio controls className="w-[80%]" src={option.media.url}></audio>
                {option.text && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2">
                    {/* Hiển thị tối đa 2 dòng */}
                    <div className="text-xs font-medium text-center line-clamp-2">
                      <LatexText
                        value={processTextForLatex(option.text)}
                        inline
                      />
                    </div>
                  </div>
                )}
              </div>
          </div>
          ) : (
            // Layout cho đáp án chỉ có text
            <div className="flex-1 w-full flex items-center justify-center px-3 py-2">
              <div
                className={`${
                  isMobile
                    ? "text-xs sm:text-sm"
                    : "text-sm sm:text-base md:text-lg"
                } font-semibold text-center break-words ${
                  isShowCorrect && isCorrect
                    ? "!text-green-700 !font-semibold"
                    : isShowCorrect && isSelected && !isCorrect
                    ? "!text-red-700 !font-semibold"
                    : !isShowCorrect && isSelected
                    ? "!text-blue-700 !font-semibold"
                    : "text-[#32428D] "
                }`}
              >
                <LatexText
                  value={processTextForLatex(option.text || "")}
                  inline
                />
              </div>
            </div>
          )}
        </button>
      );
    });

  const mediasWithImage = question.content.medias?.find((media) => media.type === "image")

  return (
    <MobileOrientationGuard>
      <div className="w-full h-full">
        {/* Animation 🎉 */}
        {showCelebration && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
            <div className="text-6xl animate-bounce">🎉</div>
          </div>
        )}

        <div className="h-full flex flex-col">
          {/* Question */}
          <div className={"flex-shrink-0 mb-16 sm:mb-18 md:mb-20 lg:mb-24 xl:mb-28 landscape:mb-6 mx-10"}
            >
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
                <div className={`flex flex-1 gap-6 flex-wrap justify-center items-center ${mediasWithImage ? "sm:flex-nowrap" : ""}`}>
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
              : hasMedia ? (
              // Check media type for different layouts
              question.content.media?.type === "audio" ? (
                // Audio Layout - text trên, audio dưới
                <div className="flex flex-col items-center gap-6 landscape:gap-4 max-w-5xl mx-auto">
                  {/* Text content trên (nếu có) */}
                  {!isTextContentEmpty(question.content.text) && (
                    <div className="w-full flex items-center justify-center">
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
                  )}
                  {/* Simple Audio Player dưới */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm w-full max-w-md">
                    {/* Hidden audio element */}
                    <audio
                      ref={audioRef}
                      src={question.content.media.url}
                      preload="metadata"
                    />

                    {/* Simple Controls */}
                    <div className="flex items-center gap-4">
                      {/* Play/Pause Button */}
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

                      {/* Progress Bar with Time */}
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
                ) : // Check if question has only media and no text
                isTextContentEmpty(question.content.text) ? (
                  // Non-audio media only - no text
                  <div className="flex justify-center max-w-5xl mx-auto">
                    <MediaDisplay
                      media={question.content.media}
                      alt="Question media"
                      className={`object-cover rounded-xl shadow-lg ${
                        isMobile ? "max-h-48 max-w-64" : "h-full max-w-2xl"
                      }`}
                    />
                  </div>
                ) : (
                // Non-audio media with text
                <div className="flex flex-row items-center gap-4 md:gap-6 landscape:gap-4 max-w-5xl mx-auto">
                  {/* Ảnh bên trái - chiếm ít không gian hơn */}
                  <div className="flex-shrink-0 w-1/3 flex justify-center md:justify-start">
                    <MediaDisplay
                      media={question.content.media}
                      alt="Hình ảnh câu hỏi"
                      className="max-h-full max-w-full object-contain rounded-xl shadow-lg"
                    />
                  </div>
                  {/* Text bên phải - chiếm nhiều không gian hơn và gần ảnh hơn */}
                  <div className="flex-1 w-2/3 flex items-center justify-center md:justify-start min-h-[224px] md:min-h-[288px] lg:min-h-[320px] landscape:min-h-[160px]">
                    <div className="w-full text-center md:text-left">
                      <div
                        className={`text-[#32428D] font-medium leading-relaxed ${
                          isMobile
                            ? "text-sm sm:text-base"
                            : "text-base lg:text-lg xl:text-xl 2xl:text-2xl"
                        }`}
                      >
                        <TiptapMathViewer
                          value={
                            question.content.text?.split("\n").join("<br />") ||
                            ""
                          }
                          isHtml
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
              ) : (
              <div className="text-center max-w-4xl mx-auto">
                <div
                  className={`text-[#32428D] font-medium leading-relaxed text-center ${
                    isMobile
                      ? "text-sm sm:text-base"
                      : "text-base lg:text-lg xl:text-xl 2xl:text-2xl"
                  }`}
                >
                  <TiptapMathViewer
                    value={
                      question.content.text?.split("\n").join("<br />") || ""
                    }
                    isHtml
                  />
                </div>
              </div>
            )}

            {isMultipleChoice && (
              <div className="mt-6 sm:mt-8 landscape:mt-3 text-center">
                <div className="inline-flex items-center bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium">
                  <Star className="w-4 h-4 mr-2" />
                  Có thể chọn nhiều đáp án
                </div>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-5xl">
              {/* Portrait: single column, Landscape: responsive grid with max 3 columns */}
              <div
                className={`
                flex flex-col items-center gap-2 sm:gap-3 
                landscape:grid landscape:gap-2 landscape:justify-items-center landscape:max-w-none
                ${
                  shuffledAnswers.length % 2 === 0
                    ? "landscape:grid-cols-2"
                    : shuffledAnswers.length >= 3 &&
                      shuffledAnswers.length % 2 !== 0
                    ? "landscape:grid-cols-3"
                    : "landscape:grid-cols-1"
                }
              `}
              >
                {renderOptions()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MobileOrientationGuard>
  );
}
