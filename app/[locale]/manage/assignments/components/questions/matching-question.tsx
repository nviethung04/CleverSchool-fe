"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, X } from "lucide-react";
import type { QuestionType } from "@/lib/api/questions";
import { TiptapMathViewer } from "@/components/question-editor/tiptap-math-viewer";
import { LatexText } from "@/components/latex-text";
import {
  useDraggable,
  useDroppable,
  DndContext,
  pointerWithin,
  rectIntersection,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  type DragMoveEvent,
} from "@dnd-kit/core";
import { createPortal } from "react-dom";
import React from "react";
import { MediaDisplay } from "../media-display";
import { AudioEffects } from "@/lib/utils/audio-utils";

// Helper function để xử lý HTML entities và tags
function processTextForLatex(text: string): string {
  if (!text) return "";

  // First, replace HTML entities with temporary placeholders to protect them
  const entityMap: { [key: string]: string } = {};
  let entityCounter = 0;

  // Replace HTML entities with placeholders
  let processedText = text.replace(/&[a-zA-Z0-9#]+;/g, (match) => {
    const placeholder = `__ENTITY_${entityCounter}__`;
    entityMap[placeholder] = match;
    entityCounter++;
    return placeholder;
  });

  // Remove HTML tags but keep the content
  processedText = processedText.replace(/<[^>]*>/g, "");

  // Restore HTML entities
  Object.keys(entityMap).forEach((placeholder) => {
    const entity = entityMap[placeholder];
    let decodedEntity = entity;

    // Decode common HTML entities
    switch (entity) {
      case "&lt;":
        decodedEntity = "<";
        break;
      case "&gt;":
        decodedEntity = ">";
        break;
      case "&amp;":
        decodedEntity = "&";
        break;
      case "&quot;":
        decodedEntity = '"';
        break;
      case "&#39;":
        decodedEntity = "'";
        break;
      default:
        decodedEntity = entity; // Keep as is if not recognized
    }

    processedText = processedText.replace(placeholder, decodedEntity);
  });

  return processedText;
}

interface MatchingQuestionProps {
  question: QuestionType;
  userAnswer?: {
    matches: Record<string, string>;
    isAnswered: boolean;
  };
  onAnswerUpdate: (answer: any) => void;
  isSubmitted: boolean;
  correctAnswer?: any;
  isPopupMode?: boolean;
}

// Draggable Target Item
function DraggableTargetItem({
  item,
  isMatched,
  isMobile,
}: {
  item: any;
  isMatched: boolean;
  isMobile: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `target-${item.id}`,
      disabled: isMatched,
    });

  const style = transform
    ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      zIndex: isDragging ? 1000 : undefined,
      opacity: isDragging ? 0.8 : 1,
      touchAction: "none",
    }
    : undefined;

  const hasOptionMedia = item.media && item.media.url;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      onTouchStart={(e) => {
        // Ngăn trình duyệt chiếm cử chỉ trên tablet
        e.preventDefault();
      }}
      {...listeners}
      {...attributes}
      className={`
        relative ${isMobile ? "w-40" : "w-44 sm:w-48 md:w-52 lg:w-56 xl:w-60"}
        min-h-[100px] sm:min-h-[110px] md:min-h-[120px] lg:min-h-[130px] xl:min-h-[140px] landscape:min-h-[90px] rounded-lg sm:rounded-xl border-2 overflow-hidden
        flex flex-col items-center justify-center p-1.5 sm:p-2 md:p-2.5 lg:p-3 xl:p-4 landscape:p-1.5
        transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98]
        ${isMatched
          ? "opacity-50 border-gray-200 cursor-not-allowed"
          : "border-gray-200 bg-white cursor-grab active:cursor-grabbing hover:border-blue-300 hover:shadow-blue-100"
        }
        ${isDragging ? "shadow-xl border-blue-400" : ""}
        touch-none select-none
      `}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      {hasOptionMedia ? (
        // Layout cho đáp án có ảnh: Hiển thị trực tiếp
        <>
          {item.media.type === "image" ? (
            <img
              src={item.media.url}
              alt={item.text || "Target item"}
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => console.error("Image load error:", e)}
              onLoad={() =>
                console.log("Image loaded successfully:", item.media.url)
              }
            />
          ) : (
            <MediaDisplay
              media={{
                url: item.media.url,
                type: item.media.type || "image",
              }}
              alt={item.text || "Target item"}
              className="w-full h-full object-cover rounded-lg"
            />
          )}
          {/* Text overlay nếu có text */}
          {item.text && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2">
              {/* Hiển thị tối đa 2 dòng */}
              <div className="text-xs font-medium text-center line-clamp-2">
                <LatexText value={processTextForLatex(item.text)} inline />
              </div>
            </div>
          )}
        </>
      ) : (
        // Layout cho đáp án chỉ có text
        <div className="flex-1 w-full flex items-center justify-center px-3 py-2">
          <div className={`${isMobile ? "text-xs sm:text-sm" : "text-sm sm:text-base md:text-lg"} font-medium text-center break-words text-[#32428D]`}>
            <LatexText value={processTextForLatex(item.text || "")} inline />
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Source Item with Drop Zone
function SourceItemWithDropZone({
  sourceItem,
  matchedTarget,
  onRemoveMatch,
  isSubmitted,
  index,
  isMobile,
}: {
  sourceItem: any;
  matchedTarget: any;
  onRemoveMatch: () => void;
  isSubmitted: boolean;
  index: number;
  isMobile: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `source-${sourceItem.id}`,
    disabled: isSubmitted,
  });

  const hasSourceMedia = sourceItem.media?.url;

  return (
    <motion.div
      className={`bg-white rounded-lg sm:rounded-xl p-1.5 sm:p-2 md:p-2.5 lg:p-3 xl:p-4 landscape:p-1.5 shadow-lg border-2 border-gray-200 min-h-[100px] sm:min-h-[110px] md:min-h-[120px] lg:min-h-[130px] xl:min-h-[140px] landscape:min-h-[90px] 
        ${isMobile ? "flex flex-row gap-x-2" : "flex flex-col"}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1 + 0.3,
      }}
    >
      {/* Source Item */}
      <div
        className={`flex flex-col items-center justify-center relative 
        ${isMobile ? "w-2/3" : "w-full"}`}
      >
        {hasSourceMedia ? (
          <>
            <div className="w-full h-16 sm:h-20 md:h-24 lg:h-28 xl:h-32 relative rounded-xl overflow-hidden">
              <MediaDisplay
                media={{
                  url: sourceItem.media.url,
                  type: (sourceItem.media as any).type || "",
                }}
                alt={sourceItem.text || "Source item"}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Text overlay nếu có text */}
              {sourceItem.text && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-1">
                  <div className="text-xs font-medium text-center line-clamp-2">
                    <LatexText value={sourceItem.text} inline />
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {sourceItem.text && (
              <span className={`font-semibold ${isMobile ? "text-xs sm:text-sm" : "text-sm sm:text-base md:text-lg"} text-center text-[#32428D] break-words px-1`}>
                <LatexText value={sourceItem.text} inline />
              </span>
            )}
            {!sourceItem.text && (
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-36 xl:h-36 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                {/* Target icon hidden for space saving */}
                {/* <Target className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 xl:h-16 xl:w-16 text-gray-400" /> */}
              </div>
            )}
          </>
        )}
      </div>

      {/* Drop Zone - Anchored at bottom via normal flow */}
      <div
        ref={setNodeRef}
        className={`
          bg-white rounded-xl border-2 border-dashed shadow-sm relative
          transition-all duration-300 flex flex-col items-center justify-center
          min-h-[60px] sm:min-h-[70px] md:min-h-[80px] lg:min-h-[90px] xl:min-h-[100px]
          ${isMobile ? "w-1/3" : "w-full mt-auto"}
          ${isOver && !matchedTarget
            ? "shadow-xl border-blue-400 bg-blue-50"
            : matchedTarget
              ? "bg-green-50 border-green-400 border-solid shadow-lg"
              : "border-gray-300"
          }
        `}
      >
        {/* Drop zone indicator */}
        {isOver && !matchedTarget && (
          <motion.div
            className="absolute inset-0 bg-blue-400 opacity-20 rounded-xl border-2 border-dashed border-blue-400"
            animate={{ opacity: [0.2, 0.3, 0.2] }}
            transition={{
              duration: 1,
              repeat: Number.POSITIVE_INFINITY,
            }}
          />
        )}

        {/* Matched Target Display */}
        {matchedTarget ? (
          <motion.div
            className={`absolute inset-0 flex flex-col items-center justify-center ${!isSubmitted ? "cursor-pointer hover:bg-green-100" : ""
              } transition-colors rounded-xl overflow-hidden`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            onClick={!isSubmitted ? onRemoveMatch : undefined}
          >
            {/* Target content */}
            {matchedTarget.media?.url ? (
              <div className="w-full h-full relative">
                <MediaDisplay
                  media={{
                    url: matchedTarget.media.url,
                    type: (matchedTarget.media as any).type || "",
                  }}
                  alt={matchedTarget.text || "Matched target"}
                  className="absolute inset-0 w-full h-full object-cover rounded-xl"
                />
                {/* Text overlay nếu có text */}
                {matchedTarget.text && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-1">
                    <div
                      className="font-medium text-center line-clamp-2 leading-tight"
                      style={{
                        fontSize: `clamp(0.3rem, 2vw, ${isMobile ? "0.65rem" : "1.125rem"
                          })`,
                        lineHeight: "1",
                      }}
                    >
                      <LatexText value={matchedTarget.text} inline />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full p-1">
                <span
                  className="font-semibold text-center text-green-800 break-words leading-tight"
                  style={{
                    fontSize: `clamp(0.3rem, 2vw, ${isMobile ? "0.65rem" : "1.125rem"
                      })`,
                    lineHeight: "1",
                  }}
                >
                  <LatexText value={matchedTarget.text} inline />
                </span>
              </div>
            )}
          </motion.div>
        ) : (
          /* Empty Drop Zone */
          <div className="flex flex-col items-center justify-center text-center py-1 sm:py-1.5 md:py-2">
            <span className="text-xs sm:text-xs md:text-sm lg:text-sm xl:text-base text-gray-400 mt-1">
              Kéo vào đây
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Fisher-Yates shuffle utility
function shuffleArray<T>(array: T[]): T[] {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Hàm detect device type để tối ưu touch sensor
function getTouchSensorConfig() {
  if (typeof window === "undefined") {
    return { delay: 150, tolerance: 8 };
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIPad =
    /ipad/.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /android/.test(userAgent);

  if (isIPad) {
    // iPad: nhạy hơn, delay ngắn hơn
    return { delay: 150, tolerance: 5 };
  } else if (isAndroid) {
    // Android: cần delay dài hơn để tránh kích hoạt nhầm
    return { delay: 200, tolerance: 8 };
  } else {
    // Desktop hoặc device khác
    return { delay: 150, tolerance: 8 };
  }
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

export function MatchingQuestion({
  question,
  userAnswer,
  onAnswerUpdate,
  isSubmitted,
  correctAnswer,
  isPopupMode = false,
}: MatchingQuestionProps) {
  const [matches, setMatches] = useState<Record<string, string>>(
    userAnswer?.matches || {}
  );

  // Sync state khi question thay đổi hoặc khi userAnswer được update từ bên ngoài
  useEffect(() => {
    const initialMatches = userAnswer?.matches || {};
    setMatches(initialMatches);

    onAnswerUpdate({
      matches: initialMatches,
      isAnswered: Object.keys(initialMatches).length > 0,
    });
  }, [question.id, userAnswer?.matches]);

  // Đồng bộ state ngay lập tức khi userAnswer thay đổi từ popup
  useEffect(() => {
    if (userAnswer?.matches) {
      setMatches(userAnswer.matches);
    }
  }, [userAnswer]);

  const [activeId, setActiveId] = useState<string | null>(null);

  const sourceItems = (
    question.options && (question.options as any).sources
      ? (question.options as any).sources
      : []
  ).map((source: any) => ({
    id: String(source.id),
    text: source.content.text,
    media: source.content.media,
  }));

  const targetItems = React.useMemo(() => {
    const items = (
      question.options && (question.options as any).targets
        ? (question.options as any).targets
        : []
    ).map((target: any) => ({
      id: String(target.id),
      text: target.content?.text || "",
      media: target.content?.media || null,
    }));
    console.log("Target items mapped:", items); // Debug log
    // Shuffle per question.id
    return shuffleArray<any>(items);
  }, [question.id, question.options]);

  // Shuffle again for display (to increase randomness on each render)
  const shuffledTargetItems = React.useMemo(
    () => shuffleArray(targetItems),
    [targetItems]
  );

  const availableTargetItems = shuffledTargetItems.filter(
    (item) =>
      !Object.values(matches).includes(item.id) &&
      !(activeId && activeId === `target-${item.id}`)
  );

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: getTouchSensorConfig(),
    }),
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Sử dụng useRef để tránh infinite loop
  const onAnswerUpdateRef = useRef(onAnswerUpdate);
  useEffect(() => {
    onAnswerUpdateRef.current = onAnswerUpdate;
  }, [onAnswerUpdate]);

  // Sử dụng useRef để track previous answer và chỉ update khi thực sự thay đổi
  const prevAnswerRef = useRef<any>(null);

  useEffect(() => {
    const currentAnswer = {
      matches,
      isAnswered: Object.keys(matches).length > 0,
    };

    // Chỉ update nếu answer thực sự thay đổi
    if (
      JSON.stringify(prevAnswerRef.current) !== JSON.stringify(currentAnswer)
    ) {
      onAnswerUpdateRef.current(currentAnswer);
      prevAnswerRef.current = currentAnswer;
    }
  }, [matches]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || isSubmitted) {
      setActiveId(null);
      return;
    }

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    if (activeIdStr.startsWith("target-") && overIdStr.startsWith("source-")) {
      const targetId = activeIdStr.replace("target-", "");
      const sourceId = overIdStr.replace("source-", "");

      const newMatches = { ...matches };

      // Remove existing matches
      if (newMatches[sourceId]) {
        // Source already has a match, remove it
      }
      Object.keys(newMatches).forEach((key) => {
        if (newMatches[key] === targetId) {
          delete newMatches[key];
        }
      });

      // Create new match
      newMatches[sourceId] = targetId;
      setMatches(newMatches);
    }

    // Reset activeId AFTER all match logic is complete
    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  }

  const handleRemoveMatch = (sourceId: string) => {
    if (isSubmitted) return;

    const newMatches = { ...matches };
    delete newMatches[sourceId];
    setMatches(newMatches);
  };

  const getMatchedTarget = (sourceId: string) => {
    const targetId = matches[sourceId];
    return targetItems.find((item) => item.id === targetId);
  };

  const activeItem = activeId?.startsWith("target-")
    ? targetItems.find((item) => item.id === activeId.replace("target-", ""))
    : null;

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      const isMobileScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isMobileScreen);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  const mediasWithImage = question.content.medias?.find((media) => media.type === "image")

  // Hàm render đáp án đúng với UI giống UI thao tác
  function renderCorrectAnswer() {
    if (!correctAnswer || !correctAnswer.matches) return null;
    // correctAnswer.matches: { [sourceId]: targetId }
    // Lấy danh sách source và target như UI gốc
    const sourceItems = (
      question.options && (question.options as any).sources
        ? (question.options as any).sources
        : []
    ).map((source: any) => ({
      id: String(source.id),
      text: source.content.text,
      media: source.content.media,
    }));
    const targetItems = (
      question.options && (question.options as any).targets
        ? (question.options as any).targets
        : []
    ).map((target: any) => ({
      id: String(target.id),
      text: target.content.text,
      media: target.content.media,
    }));
    const getMatchedTarget = (sourceId: string) => {
      const targetId = correctAnswer.matches[sourceId];
      return targetItems.find((item: any) => item.id === String(targetId));
    };
    return (
      <div className={`h-full w-full flex flex-col items-center justify-start ${isPopupMode ? "pt-2 sm:pt-4" : "pt-6 sm:pt-8 md:pt-10 landscape:pt-0"} md:overflow-visible landscape:overflow-y-auto`}>
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 landscape:px-6 flex flex-col items-center md:overflow-hidden">
          {/* Header */}
          {!isTextContentEmpty(question.content.text) && (
            <div className="mb-3 sm:mb-4 md:mb-5 lg:mb-6 max-w-4xl mx-auto landscape:mb-2 text-center">
              <TiptapMathViewer
                value={question.content.text?.split("\n").join("<br />")}
                isHtml
                className={`text-[#32428D] font-medium leading-relaxed ${isMobile
                  ? "text-sm sm:text-base"
                  : "text-base lg:text-lg xl:text-xl 2xl:text-2xl"
                  }`}
              />
            </div>
          )}
          {question.content.medias && question.content.medias.length > 1 &&
          <div className={`flex flex-1 gap-6 flex-wrap justify-center items-center w-full sm:px-8 ${mediasWithImage ? "sm:flex-nowrap" : ""}`}>
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
          }
          {/* Main Content - Responsive Layout */}
          <div className={`w-full ${isPopupMode ? "p-2 sm:p-4 min-h-[400px] sm:min-h-[500px]" : "p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 landscape:p-2 min-h-[300px] sm:min-h-[350px] md:min-h-[400px] lg:min-h-[450px] xl:min-h-[500px] landscape:min-h-[250px]"} flex ${isMobile ? "flex-col items-center gap-3" : "flex-col gap-6"}`}>
            {/* Correct Matches Label */}
            <div className="flex items-center justify-center">
              <span className="text-sm sm:text-base font-semibold text-green-600 uppercase tracking-wider px-3 py-2 rounded-lg">
                Correct Matches
              </span>
            </div>

            {/* Source Items with Drop Zones (Categories) */}
            <div className={`flex-1 mb-3 sm:mb-4 md:mb-5 lg:mb-6 xl:mb-8 landscape:mb-3 landscape:flex-none ${isMobile ? "w-full flex justify-center" : "w-full"}`}>
              <div className={`flex flex-col ${isPopupMode ? "gap-2 sm:gap-3" : "gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 xl:gap-4 landscape:gap-2"} justify-center items-center w-full md:overflow-visible landscape:overflow-visible landscape:flex-wrap landscape:justify-center landscape:pb-2`}>
                <div className={`${isMobile ? "gap-3 flex flex-col items-center" : "gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 xl:gap-4 landscape:gap-1.5 flex flex-row justify-center"} w-full`}>
                  {sourceItems.map((sourceItem: any, index: number) => (
                    <div key={sourceItem.id} className={isMobile ? "w-full max-w-md" : "flex-1"}>
                      <motion.div
                        className={`bg-white rounded-lg sm:rounded-xl p-1.5 sm:p-2 md:p-2.5 lg:p-3 xl:p-4 landscape:p-1.5 shadow-lg border-2 border-gray-200 min-h-[100px] sm:min-h-[110px] md:min-h-[120px] lg:min-h-[130px] xl:min-h-[140px] landscape:min-h-[90px] 
                          ${isMobile ? "flex flex-row gap-x-2" : "flex flex-col"}
                        `}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: index * 0.1 + 0.3,
                        }}
                      >
                        {/* Source Item */}
                        <div className={`flex flex-col items-center justify-center relative ${isMobile ? "w-2/3" : "w-full"}`}>
                          {sourceItem.media?.url ? (
                            <>
                              <div className="w-full h-16 sm:h-20 md:h-24 lg:h-28 xl:h-32 relative rounded-xl overflow-hidden">
                                <MediaDisplay
                                  media={{
                                    url: sourceItem.media.url,
                                    type: (sourceItem.media as any).type || "",
                                  }}
                                  alt={sourceItem.text || "Source item"}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                                {/* Text overlay nếu có text */}
                                {sourceItem.text && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-1">
                                    <div className="text-xs font-medium text-center line-clamp-2">
                                      <LatexText value={sourceItem.text} inline />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              {sourceItem.text && (
                                <span className={`font-semibold ${isMobile ? "text-xs sm:text-sm" : "text-sm sm:text-base md:text-lg"} text-center text-[#32428D] break-words px-1`}>
                                  <LatexText value={sourceItem.text} inline />
                                </span>
                              )}
                              {!sourceItem.text && (
                                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-36 xl:h-36 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                                  {/* Target icon hidden for space saving */}
                                  {/* <Target className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 xl:h-16 xl:w-16 text-gray-400" /> */}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Drop Zone - Anchored at bottom via normal flow */}
                        <div className={`bg-green-50 rounded-xl border-2 border-green-400 border-solid shadow-lg relative transition-all duration-300 flex flex-col items-center justify-center min-h-[60px] sm:min-h-[70px] md:min-h-[80px] lg:min-h-[90px] xl:min-h-[100px] ${isMobile ? "w-1/3" : "w-full mt-auto"}`}>
                          {/* Đáp án đúng - Matched Target Display */}
                          {getMatchedTarget(sourceItem.id) ? (
                            <motion.div
                              className="absolute inset-0 flex flex-col items-center justify-center transition-colors rounded-xl overflow-hidden"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              {/* Target content */}
                              {getMatchedTarget(sourceItem.id).media?.url ? (
                                <div className="w-full h-full relative">
                                  <MediaDisplay
                                    media={{
                                      url: getMatchedTarget(sourceItem.id).media.url,
                                      type: (getMatchedTarget(sourceItem.id).media as any).type || "",
                                    }}
                                    alt={getMatchedTarget(sourceItem.id).text || "Matched target"}
                                    className="absolute inset-0 w-full h-full object-cover rounded-xl"
                                  />
                                  {/* Text overlay nếu có text */}
                                  {getMatchedTarget(sourceItem.id).text && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-1">
                                      <div
                                        className="font-medium text-center line-clamp-2 leading-tight"
                                        style={{
                                          fontSize: `clamp(0.3rem, 2vw, ${isMobile ? "0.65rem" : "1.125rem"})`,
                                          lineHeight: "1",
                                        }}
                                      >
                                        <LatexText value={getMatchedTarget(sourceItem.id).text} inline />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center w-full h-full p-1">
                                  <span
                                    className="font-semibold text-center text-green-800 break-words leading-tight"
                                    style={{
                                      fontSize: `clamp(0.3rem, 2vw, ${isMobile ? "0.65rem" : "1.125rem"})`,
                                      lineHeight: "1",
                                    }}
                                  >
                                    <LatexText value={getMatchedTarget(sourceItem.id).text} inline />
                                  </span>
                                </div>
                              )}
                            </motion.div>
                          ) : (
                            /* Empty Drop Zone */
                            <div className="flex flex-col items-center justify-center text-center py-1 sm:py-1.5 md:py-2">
                              <span className="text-xs sm:text-xs md:text-sm lg:text-sm xl:text-base text-gray-400 mt-1">
                                Không có đáp án
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (correctAnswer && correctAnswer.matches) {
    return renderCorrectAnswer();
  }

  return (
    <>
      {question.content.medias && question.content.medias.length > 1 ?
        <div className="flex flex-col w-full">
          {!isTextContentEmpty(question.content.text) && (
            <div className="text-center max-w-4xl mx-auto mb-5">
              <div
                className={`text-[#32428D] font-medium leading-relaxed text-center ${
                  isMobile
                    ? "text-sm sm:text-base"
                    : "text-base lg:text-lg xl:text-xl 2xl:text-2xl"
                }`}
              >
                <TiptapMathViewer
                  value={question.content.text?.split("\n").join("<br />")}
                  isHtml
                />
              </div>
            </div>
          )}
          <div className={`flex flex-1 gap-6 flex-wrap justify-center items-center mb-10 sm:px-8 ${mediasWithImage ? "sm:flex-nowrap" : ""}`}>
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
          <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            autoScroll
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div
              className={`h-full w-full flex flex-col items-center justify-start ${isPopupMode ? "pt-2 sm:pt-4" : "pt-6 sm:pt-8 md:pt-10 landscape:pt-0"
                } md:overflow-visible landscape:overflow-y-auto`}
            >
              <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 landscape:px-6 flex flex-col items-center md:overflow-hidden">
                {/* Main Content - Responsive Layout */}
                <div
                  className={`w-full ${isPopupMode
                    ? "p-2 sm:p-4 min-h-[400px] sm:min-h-[500px]"
                    : "p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 landscape:p-2 min-h-[300px] sm:min-h-[350px] md:min-h-[400px] lg:min-h-[450px] xl:min-h-[500px] landscape:min-h-[250px]"
                    } flex ${isMobile ? "flex-row gap-3" : "flex-col gap-6"}`}
                >
                  {/* Source Items with Drop Zones (Categories) - Top Row on Landscape */}
                  <div
                    className={`flex-1 mb-3 sm:mb-4 md:mb-5 lg:mb-6 xl:mb-8 landscape:mb-3 landscape:flex-none
                    ${isMobile ? "w-2/3 flex items-center" : "w-full"}`}
                  >
                    <motion.div
                      className={`flex flex-col ${isPopupMode
                        ? "gap-2 sm:gap-3"
                        : "gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 xl:gap-4 landscape:gap-2"
                        } justify-center items-center w-full md:overflow-visible landscape:overflow-visible landscape:flex-wrap landscape:justify-center landscape:pb-2`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      {/* Source Items With Drop Zones - Single row */}
                      <div
                        className={`${isMobile
                          ? "gap-0"
                          : "gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 xl:gap-4 landscape:gap-1.5"
                          } justify-center w-full
                        ${isMobile ? "flex flex-col space-y-3" : "flex flex-row"}`}
                      >
                        {sourceItems.map((sourceItem: any, index: number) => (
                          <div key={sourceItem.id} className="flex-1">
                            <SourceItemWithDropZone
                              sourceItem={sourceItem}
                              matchedTarget={getMatchedTarget(sourceItem.id)}
                              onRemoveMatch={() => handleRemoveMatch(sourceItem.id)}
                              isSubmitted={isSubmitted}
                              index={index}
                              isMobile={isMobile}
                            />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>

                  {/* Target Items Grid (Answers) - Bottom Row on Landscape */}
                  <div
                    className={`flex-1 mb-3 sm:mb-4 md:mb-5 lg:mb-6 xl:mb-8 landscape:mb-3 landscape:flex-none
                    ${isMobile ? "w-1/3 flex items-center" : "w-full"}`}
                  >
                    <motion.div
                      className="flex flex-col w-full md:overflow-visible landscape:overflow-visible"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                    >
                      {/* Target Items - Single row */}
                      <div
                        className={`${isMobile
                          ? "flex flex-col space-y-3 place-items-center"
                          : "flex flex-row flex-wrap"
                          } ${isMobile
                            ? "gap-0"
                            : isPopupMode
                              ? "gap-1.5 sm:gap-2"
                              : "gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 xl:gap-4 landscape:gap-1.5"
                          } justify-center items-center w-full`}
                      >
                        {availableTargetItems.map((item: any) => (
                          <div key={item.id} className="flex-shrink-0">
                            <DraggableTargetItem
                              item={item}
                              isMatched={false}
                              isMobile={isMobile}
                            />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Drag Overlay - Render in portal to avoid layout conflicts */}
              {typeof window !== "undefined" && (
                <>
                  {createPortal(
                    <DragOverlay
                      style={{
                        zIndex: 99999,
                      }}
                      dropAnimation={{
                        duration: 200,
                        easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
                      }}
                    >
                      {activeItem && (
                        <div
                          className={`relative ${isMobile ? "w-40" : "w-44 sm:w-48 md:w-52 lg:w-56 xl:w-60"}
                            min-h-[100px] sm:min-h-[110px] md:min-h-[120px] lg:min-h-[130px] xl:min-h-[140px] landscape:min-h-[90px] rounded-lg sm:rounded-xl border-2 overflow-hidden
                            flex flex-col items-center justify-center p-1.5 sm:p-2 md:p-2.5 lg:p-3 xl:p-4 landscape:p-1.5 shadow-xl border-blue-400 bg-white opacity-90`}
                          style={{
                            transform: "translate3d(0, 0, 0)",
                            willChange: "transform",
                          }}
                        >
                          {activeItem.media?.url ? (
                            // Layout cho đáp án có ảnh: Hiển thị trực tiếp
                            <>
                              <MediaDisplay
                                media={{
                                  url: activeItem.media.url,
                                  type: (activeItem.media as any).type || "",
                                }}
                                alt={activeItem.text || "Dragging item"}
                                className="w-full h-full object-cover rounded-lg"
                              />
                              {/* Text overlay nếu có text */}
                              {activeItem.text && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2">
                                  {/* Hiển thị tối đa 2 dòng */}
                                  <div className="text-xs font-medium text-center line-clamp-2">
                                    <LatexText
                                      value={processTextForLatex(activeItem.text)}
                                      inline
                                    />
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            // Layout cho đáp án chỉ có text
                            <div className="flex-1 w-full flex items-center justify-center px-3 py-2">
                              <div className={`${isMobile ? "text-xs sm:text-sm" : "text-sm sm:text-base md:text-lg"} font-medium text-center break-words text-[#32428D]`}>
                                <LatexText
                                  value={processTextForLatex(activeItem.text || "")}
                                  inline
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </DragOverlay>,
                    document.getElementById("drag-overlay-portal") || document.body
                  )}
                </>
              )}
            </div>
          </DndContext>
        </div> 
        :
        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          autoScroll
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div
            className={`h-full w-full flex flex-col items-center justify-start ${isPopupMode ? "pt-2 sm:pt-4" : "pt-6 sm:pt-8 md:pt-10 landscape:pt-0"
              } md:overflow-visible landscape:overflow-y-auto`}
          >
            <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 landscape:px-6 flex flex-col items-center md:overflow-hidden">
              {/* Question content - Simple display without background */}
              <div className="mb-3 sm:mb-4 md:mb-5 lg:mb-6 max-w-4xl mx-auto landscape:mb-2 text-center">
                <TiptapMathViewer
                  value={question.content.text?.split("\n").join("<br />")}
                  isHtml
                  className={`text-[#32428D] font-medium leading-relaxed ${isMobile
                    ? "text-sm sm:text-base"
                    : "text-base lg:text-lg xl:text-xl 2xl:text-2xl"
                    }`}
                />
              </div>

              {/* Main Content - Responsive Layout */}
              <div
                className={`w-full ${isPopupMode
                  ? "p-2 sm:p-4 min-h-[400px] sm:min-h-[500px]"
                  : "p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 landscape:p-2 min-h-[300px] sm:min-h-[350px] md:min-h-[400px] lg:min-h-[450px] xl:min-h-[500px] landscape:min-h-[250px]"
                  } flex ${isMobile ? "flex-row gap-3" : "flex-col gap-6"}`}
              >
                {/* Source Items with Drop Zones (Categories) - Top Row on Landscape */}
                <div
                  className={`flex-1 mb-3 sm:mb-4 md:mb-5 lg:mb-6 xl:mb-8 landscape:mb-3 landscape:flex-none
                  ${isMobile ? "w-2/3 flex items-center" : "w-full"}`}
                >
                  <motion.div
                    className={`flex flex-col ${isPopupMode
                      ? "gap-2 sm:gap-3"
                      : "gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 xl:gap-4 landscape:gap-2"
                      } justify-center items-center w-full md:overflow-visible landscape:overflow-visible landscape:flex-wrap landscape:justify-center landscape:pb-2`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    {/* Categories Label - Hidden for space saving */}
                    {/* <div className="flex items-center justify-center h-full md:min-h-0 landscape:min-h-[70px]">
                      <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-600 uppercase tracking-wider px-2 py-1 bg-green-100 rounded-lg">
                        Categories
                      </span>
                    </div> */}
                    {/* Source Items With Drop Zones - Single row */}
                    <div
                      className={`${isMobile
                        ? "gap-0"
                        : "gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 xl:gap-4 landscape:gap-1.5"
                        } justify-center w-full
                      ${isMobile ? "flex flex-col space-y-3" : "flex flex-row"}`}
                    >
                      {sourceItems.map((sourceItem: any, index: number) => (
                        <div key={sourceItem.id} className="flex-1">
                          <SourceItemWithDropZone
                            sourceItem={sourceItem}
                            matchedTarget={getMatchedTarget(sourceItem.id)}
                            onRemoveMatch={() => handleRemoveMatch(sourceItem.id)}
                            isSubmitted={isSubmitted}
                            index={index}
                            isMobile={isMobile}
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Target Items Grid (Answers) - Bottom Row on Landscape */}
                <div
                  className={`flex-1 mb-3 sm:mb-4 md:mb-5 lg:mb-6 xl:mb-8 landscape:mb-3 landscape:flex-none
                  ${isMobile ? "w-1/3 flex items-center" : "w-full"}`}
                >
                  <motion.div
                    className="flex flex-col w-full md:overflow-visible landscape:overflow-visible"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  >
                    {/* Answers Label - Hidden for space saving */}
                    {/* <div className="flex items-center justify-center mb-3 sm:mb-4 md:mb-5 lg:mb-6 xl:mb-8 landscape:mb-3">
                      <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-600 uppercase tracking-wider px-2 py-1 bg-blue-100 rounded-lg">
                        Answers
                      </span>
                    </div> */}
                    {/* Target Items - Single row */}
                    <div
                      className={`${isMobile
                        ? "flex flex-col space-y-3 place-items-center"
                        : "flex flex-row flex-wrap"
                        } ${isMobile
                          ? "gap-0"
                          : isPopupMode
                            ? "gap-1.5 sm:gap-2"
                            : "gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 xl:gap-4 landscape:gap-1.5"
                        } justify-center items-center w-full`}
                    >
                      {availableTargetItems.map((item: any) => (
                        <div key={item.id} className="flex-shrink-0">
                          <DraggableTargetItem
                            item={item}
                            isMatched={false}
                            isMobile={isMobile}
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Drag Overlay - Render in portal to avoid layout conflicts */}
            {typeof window !== "undefined" && (
              <>
                {createPortal(
                  <DragOverlay
                    style={{
                      zIndex: 99999,
                    }}
                    dropAnimation={{
                      duration: 200,
                      easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
                    }}
                  >
                    {activeItem && (
                      <div
                        className={`relative ${isMobile ? "w-40" : "w-44 sm:w-48 md:w-52 lg:w-56 xl:w-60"}
                          min-h-[100px] sm:min-h-[110px] md:min-h-[120px] lg:min-h-[130px] xl:min-h-[140px] landscape:min-h-[90px] rounded-lg sm:rounded-xl border-2 overflow-hidden
                          flex flex-col items-center justify-center p-1.5 sm:p-2 md:p-2.5 lg:p-3 xl:p-4 landscape:p-1.5 shadow-xl border-blue-400 bg-white opacity-90`}
                        style={{
                          transform: "translate3d(0, 0, 0)",
                          willChange: "transform",
                        }}
                      >
                        {activeItem.media?.url ? (
                          // Layout cho đáp án có ảnh: Hiển thị trực tiếp
                          <>
                            <MediaDisplay
                              media={{
                                url: activeItem.media.url,
                                type: (activeItem.media as any).type || "",
                              }}
                              alt={activeItem.text || "Dragging item"}
                              className="w-full h-full object-cover rounded-lg"
                            />
                            {/* Text overlay nếu có text */}
                            {activeItem.text && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2">
                                {/* Hiển thị tối đa 2 dòng */}
                                <div className="text-xs font-medium text-center line-clamp-2">
                                  <LatexText
                                    value={processTextForLatex(activeItem.text)}
                                    inline
                                  />
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          // Layout cho đáp án chỉ có text
                          <div className="flex-1 w-full flex items-center justify-center px-3 py-2">
                            <div className={`${isMobile ? "text-xs sm:text-sm" : "text-sm sm:text-base md:text-lg"} font-medium text-center break-words text-[#32428D]`}>
                              <LatexText
                                value={processTextForLatex(activeItem.text || "")}
                                inline
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </DragOverlay>,
                  document.getElementById("drag-overlay-portal") || document.body
                )}
              </>
            )}
          </div>
        </DndContext>
      }
    </>
  );
}
