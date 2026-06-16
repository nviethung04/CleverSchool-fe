"use client";
import React, { useEffect, useRef, useState } from "react";
import { MediaDisplay } from "../media-display";
import type { QuestionType } from "@/lib/api/questions";
import { AudioEffects, isAudioExcludedKey } from "@/lib/utils/audio-utils";
import { motion } from "framer-motion";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface FillInBlankQuestionProps {
  question: QuestionType;
  userAnswers?: any;
  onAnswerUpdate: (answer: any) => void;
  isSubmitted: boolean;
  correctAnswer?: any;
}

export function FillInBlankQuestion({
  question,
  userAnswers,
  onAnswerUpdate,
  isSubmitted,
  correctAnswer,
}: FillInBlankQuestionProps) {
  const BLANK_PLACEHOLDER = "___BLANK___";
  const htmlWithPlaceholders = question.content.text.replace(
    /\[blank\]/g,
    BLANK_PLACEHOLDER
  );
  const blanksCount = (
    htmlWithPlaceholders.match(new RegExp(BLANK_PLACEHOLDER, "g")) || []
  ).length;

  const [answers, setAnswers] = useState<string[]>(() => {
    if (correctAnswer && correctAnswer.list) {
      return Array.from(
        { length: blanksCount },
        (_, i) => correctAnswer.list[i + 1] || ""
      );
    }
    if (userAnswers?.answers && Array.isArray(userAnswers.answers)) {
      return userAnswers.answers.map((a: any) => a.text || "");
    }
    return Array(blanksCount).fill("");
  });

  // Audio player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Ref để luôn giữ giá trị mới nhất của answers
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
    console.log("answers state updated:", answers);
  }, [answers]);

  // Reset answers khi sang câu mới
  useEffect(() => {
    if (correctAnswer && correctAnswer.list) {
      setAnswers(
        Array.from(
          { length: blanksCount },
          (_, i) => correctAnswer.list[i + 1] || ""
        )
      );
    } else if (userAnswers?.answers && Array.isArray(userAnswers.answers)) {
      setAnswers(userAnswers.answers.map((a: any) => a.text || ""));
    } else {
      setAnswers(Array(blanksCount).fill(""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, blanksCount]);

  // Khi answers thay đổi, gọi onAnswerUpdate
  useEffect(() => {
    onAnswerUpdate({
      isAnswered: answers.some((a) => a.trim() !== ""),
      answers: answers.map((text, idx) => {
        const option = question.options.answers?.[idx];
        return {
          id: option?.id?.toString() ?? idx.toString(),
          correct_position: (option?.correct_position ?? idx + 1).toString(),
          text,
        };
      }),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  // Audio player functions
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [question.content.media?.url]);

  // Ref cho vùng nội dung
  const contentRef = useRef<HTMLDivElement>(null);

  // Effect để chèn input vào đúng vị trí placeholder (chỉ khi sang câu mới)
  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.innerHTML = htmlWithPlaceholders;
    let blankIndex = 0;
    const inputs: HTMLInputElement[] = [];
    const handlers: Array<(e: Event) => void> = [];
    const keydownHandlers: Array<(e: KeyboardEvent) => void> = [];
    const walker = document.createTreeWalker(
      contentRef.current,
      NodeFilter.SHOW_TEXT,
      null
    );
    const textNodes: Text[] = [];
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      if (node.nodeValue?.includes(BLANK_PLACEHOLDER)) {
        textNodes.push(node);
      }
    }
    textNodes.forEach((textNode) => {
      const parts = textNode.nodeValue!.split(BLANK_PLACEHOLDER);
      const fragment = document.createDocumentFragment();
      parts.forEach((part, idx) => {
        if (part) fragment.appendChild(document.createTextNode(part));
        if (idx < parts.length - 1) {
          const input = document.createElement("input");
          input.type = "text";
          input.value = answersRef.current[blankIndex] || "";
          input.disabled = isSubmitted || !!correctAnswer;
          input.placeholder = "__";
          input.setAttribute("autocapitalize", "none");
          input.setAttribute("autocorrect", "off");
          input.setAttribute("spellcheck", "false");
          input.setAttribute("data-blank-idx", blankIndex.toString());
          input.className =
            (answersRef.current[blankIndex] &&
              answersRef.current[blankIndex].length > 0
              ? "text-[#FF8800]"
              : "text-gray-400") +
            " placeholder-transparent bg-white text-left font-medium leading-tight mx-0.5 " +
            "text-base landscape:text-lg lg:text-xl xl:text-2xl";

          // Border bottom để thay underline
          input.style.borderBottom =
            answersRef.current[blankIndex] &&
              answersRef.current[blankIndex].length > 0
              ? "2px solid #FF8800"
              : "2px solid #ccc";
          input.style.background = "transparent";
          // input.style.padding = "0 2px";
          // Đo width thực tế của text
          const getTextWidth = (text: string, font: string) => {
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            if (!context) return 40;
            context.font = font;
            return context.measureText(text).width;
          };
          // Lấy font thực tế từ parent text
          const parent = input.parentElement;
          if (parent) {
            input.style.fontSize = window.getComputedStyle(parent).fontSize;
            input.style.fontFamily = window.getComputedStyle(parent).fontFamily;
            input.style.fontWeight = window.getComputedStyle(parent).fontWeight;
            input.style.lineHeight = window.getComputedStyle(parent).lineHeight;
          }
          const font = window.getComputedStyle(input).font;
          const textWidth = getTextWidth(
            answersRef.current[blankIndex] || input.placeholder,
            font
          );
          // Increase width by 1.5x on mobile for better visibility
          const isMobile = window.innerWidth < 768;
          const multiplier = isMobile ? 1.5 : 1;
          input.style.width = `${Math.ceil(textWidth * multiplier)}px`;
          input.style.display = "inline-block";
          input.style.verticalAlign = "baseline";
          input.style.position = "relative";
          input.style.top = "-1px";
          // Use a local variable to capture the correct index
          const thisIndex = blankIndex;
          const handler = (e: Event) => {
            const newAnswers = [...answersRef.current];
            newAnswers[thisIndex] = (e.target as HTMLInputElement).value;
            console.log("input event:", {
              blankIndex: thisIndex,
              value: (e.target as HTMLInputElement).value,
              newAnswers,
            });
            setAnswers(newAnswers);
          };

          // Handle typing audio feedback
          const keydownHandler = (e: KeyboardEvent) => {
            if (isSubmitted || !!correctAnswer) return;

            // Play type audio feedback on key press (except for some special keys)
            if (!isAudioExcludedKey(e.key)) {
              AudioEffects.type();
            }
          };

          input.addEventListener("input", handler);
          input.addEventListener("keydown", keydownHandler);
          inputs.push(input);
          handlers.push(handler);
          keydownHandlers.push(keydownHandler);
          fragment.appendChild(input);
          blankIndex++;
        }
      });
      textNode.parentNode?.replaceChild(fragment, textNode);
    });
    // Cleanup: remove all event listeners when effect cleanup
    return () => {
      inputs.forEach((input, idx) => {
        input.removeEventListener("input", handlers[idx]);
        input.removeEventListener("keydown", keydownHandlers[idx]);
      });
    };
    // eslint-disable-next-line
  }, [
    question.id,
    blanksCount,
    htmlWithPlaceholders,
    isSubmitted,
    correctAnswer,
  ]);

  // Effect để update value và style của input khi answers đổi (KHÔNG render lại HTML)
  useEffect(() => {
    if (!contentRef.current) return;
    for (let i = 0; i < blanksCount; i++) {
      const input = contentRef.current.querySelector(
        `input[data-blank-idx='${i}']`
      ) as HTMLInputElement | null;
      if (input) {
        input.value = answers[i] || "";
        // Đảm bảo các thuộc tính touch-friendly được áp dụng
        input.setAttribute("autocapitalize", "none");
        input.setAttribute("autocorrect", "off");
        input.setAttribute("spellcheck", "false");
        input.className =
          (answers[i] && answers[i].length > 0
            ? "text-[#FF8800]"
            : "text-gray-400") +
          " placeholder-transparent bg-white text-left font-medium leading-tight mx-0.5 " +
          "text-base landscape:text-lg lg:text-xl xl:text-2xl";

        // Border bottom để thay underline
        input.style.borderBottom =
          answers[i] && answers[i].length > 0
            ? "2px solid #FF8800"
            : "2px solid #ccc";
        input.style.background = "transparent";
        // input.style.padding = "0 2px";
        // Đo width thực tế của text
        const getTextWidth = (text: string, font: string) => {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) return 40;
          context.font = font;
          return context.measureText(text).width;
        };
        // Lấy font thực tế từ parent text
        const parent = input.parentElement;
        if (parent) {
          input.style.fontSize = window.getComputedStyle(parent).fontSize;
          input.style.fontFamily = window.getComputedStyle(parent).fontFamily;
          input.style.fontWeight = window.getComputedStyle(parent).fontWeight;
          input.style.lineHeight = window.getComputedStyle(parent).lineHeight;
        }
        const font = window.getComputedStyle(input).font;
        const textWidth = getTextWidth(answers[i] || input.placeholder, font);
        input.style.width = `${Math.ceil(textWidth)}px`;
        input.style.display = "inline-block";
        input.style.verticalAlign = "baseline";
        input.style.position = "relative";
        input.style.top = "-1px";
      }
    }
  }, [answers, blanksCount]);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const isMobileDevice = typeof navigator !== 'undefined'
        ? /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        : false;
      const isMobileScreen = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
      setIsMobile(isMobileDevice || isMobileScreen);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  const mediasWithImage = question.content.medias?.find((media) => media.type === "image")

  return (
    <div className="w-full h-full flex items-center justify-center p-4 sm:p-6 landscape:p-3">
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-4">
        {question.content.medias && question.content.medias.length > 1 ? 
          <>
            <div className="flex items-center justify-center mb-5">
              <div className="text-center">
                <div
                  ref={contentRef}
                  className={`text-[#32428D] font-medium leading-relaxed text-center whitespace-normal break-words ${isMobile ? "text-sm sm:text-base" : "text-base lg:text-lg xl:text-xl 2xl:text-2xl"}`}
                />
              </div>
            </div>
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
        : question.content.media &&
          question.content.media.url &&
          question.content.media.type === "audio" ? (
          // Audio Layout - text trên, audio dưới
          <div className="flex flex-col items-center gap-6 landscape:gap-4">
            {/* Text content trên */}
            <div className="w-full flex items-center justify-center">
              <div className="text-center">
                <div
                  ref={contentRef}
                  className={`text-[#32428D] font-medium leading-relaxed text-center whitespace-normal break-words ${isMobile ? "text-sm sm:text-base" : "text-base lg:text-lg xl:text-xl 2xl:text-2xl"}`}
                />
              </div>
            </div>

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
        ) : question.content.media &&
          question.content.media.url &&
          question.content.media.type !== "text" ? (
          // Non-audio media layout (image/video) - text trên, ảnh dưới
          <div className="flex flex-col items-center gap-4 sm:gap-6 md:gap-8 lg:gap-10 landscape:gap-4">
            {/* Text content trên */}
            <div className="w-full flex items-center justify-center">
              <div className="text-center">
                <div
                  ref={contentRef}
                  className={`text-[#32428D] font-medium leading-relaxed text-center whitespace-normal break-words ${isMobile ? "text-sm sm:text-base" : "text-base lg:text-lg xl:text-xl 2xl:text-2xl"}`}
                />
              </div>
            </div>

            {/* Ảnh/Video ở dưới - responsive với padding */}
            <div className="flex justify-center px-4 sm:px-6 md:px-8 w-full">
              <div className="w-full flex justify-center rounded-xl overflow-hidden">
                <MediaDisplay
                  media={question.content.media}
                  alt="Hình ảnh câu hỏi"
                  className="max-h-48 sm:max-h-56 md:max-h-64 lg:max-h-72 max-w-full w-auto block mx-auto object-contain"
                />
              </div>
            </div>
          </div>
        ) : (
          // Text-only layout
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div
                ref={contentRef}
                className={`text-[#32428D] font-medium leading-relaxed text-center whitespace-normal break-words ${isMobile ? "text-sm sm:text-base" : "text-base lg:text-lg xl:text-xl 2xl:text-2xl"}`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}