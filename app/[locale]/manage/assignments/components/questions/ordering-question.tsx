"use client";

import { useState, useEffect, useMemo } from "react";
import type { QuestionType } from "@/lib/api/questions";
import { TiptapMathViewer } from "@/components/question-editor/tiptap-math-viewer";
import { ZoomIn, X, Pause, Play } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MediaDisplay } from "../media-display";
import { LatexText } from "@/components/latex-text";
import {
  restrictToHorizontalAxis,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import { AudioEffects } from "@/lib/utils/audio-utils";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

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

// Component ZoomableImage tối ưu - chỉ zoom khi click button
function ZoomableImage({
  media,
  alt,
  className,
  showZoomIcon = true,
  isMobile = false,
}: {
  media: any;
  alt: string;
  className: string;
  showZoomIcon?: boolean;
  isMobile?: boolean;
}) {
  const [isZoomed, setIsZoomed] = useState(false);

  const handleZoomClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Ngăn drag event
    setIsZoomed(true);
  };

  const handleCloseZoom = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsZoomed(false);
  };

  return (
    <>
      <div className="relative group">
        <MediaDisplay media={media} alt={alt} className={className} />
        {showZoomIcon && (
          <button
            type="button"
            onClick={handleZoomClick}
            className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-gray-700 rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 hover:shadow-lg z-10 border border-white/20"
            style={{ touchAction: "manipulation" }}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Zoom Modal - render in portal to ensure overlay is always on top */}
      {isZoomed &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999]"
            onClick={handleCloseZoom}
            style={{ touchAction: "manipulation" }}
          >
            <div className="relative max-w-4xl max-h-[90vh] p-4">
              <button
                type="button"
                onClick={handleCloseZoom}
                className="absolute top-2 right-2 bg-white rounded-lg p-2 border-2 border-red-400 shadow-lg hover:bg-red-50 hover:border-red-600 hover:scale-110 transition-all duration-200 z-10"
                style={{ touchAction: "manipulation" }}
              >
                <X
                  className={`${isMobile ? "w-3 h-3" : "w-6 h-6"} text-red-600`}
                />
              </button>
              <MediaDisplay
                media={media}
                alt={alt}
                className="max-w-full max-h-full object-contain rounded-lg z-5"
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
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

interface OrderingQuestionProps {
  question: QuestionType;
  userAnswer?: {
    order: string[];
    isAnswered: boolean;
  };
  onAnswerUpdate: (answer: any) => void;
  isSubmitted: boolean;
  onFeedback: (state: "correct" | "incorrect") => void;
  correctAnswer?: any;
}

function SortableItem({
  id,
  text,
  media,
  index,
  isSubmitted,
  questionId,
  isImageOnlyLayout = false,
  fontSmall = false,
  isMobile = false,
  isVertical = false,
}: {
  id: string;
  text: string;
  media?: any;
  index: number;
  isSubmitted?: boolean;
  questionId: string;
  isImageOnlyLayout?: boolean;
  fontSmall?: boolean;
  isMobile?: boolean;
  isVertical?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const hasMedia = media && media.url;

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? "none" : transition,
        zIndex: isDragging ? 999 : undefined,
        opacity: isDragging ? 0.9 : 1,
        touchAction: "none",
      }}
      className={`flex items-center justify-center bg-white rounded-lg sm:rounded-xl border border-gray-200 ${
        !isDragging ? "hover:border-blue-400" : ""
      }
 select-none overflow-hidden ${
   isImageOnlyLayout
     ? "!flex-shrink-0 p-1 sm:p-2 md:p-2.5 lg:p-3 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36 2xl:w-40 2xl:h-40 min-w-20 min-h-20"
     : hasMedia
     ? `${isVertical ? "w-full" : ""} ${
         isMobile ? "min-h-16" : "min-h-20 sm:min-h-24"
       } p-2 gap-3 sm:gap-4 md:gap-5 flex-shrink-0`
     : fontSmall
     ? `py-2 px-3 ${isVertical ? "w-full" : ""} ${
         isMobile ? "w-fit" : ""
       } min-h-0 flex-shrink-0`
     : `p-2 sm:p-3 gap-2 flex-shrink-0 ${isMobile ? "w-fit" : ""}`
 }`}
      {...attributes}
      {...listeners}
    >
      {hasMedia ? (
        text && text.trim() ? (
          // Có cả ảnh và text
          <>
            {/* Media display - responsive size */}
            <div className="flex-shrink-0 h-full flex items-center">
              <ZoomableImage
                media={media}
                alt={text || "Answer media"}
                className={`object-cover rounded-lg w-full max-w-28 sm:max-w-32 h-full`}
                isMobile={isMobile}
              />
            </div>
            {/* Text content - responsive gap và font */}
            <div className="flex-1 flex items-center">
              <span
                className={`text-[#32428D] font-semibold ${
                  fontSmall
                    ? "text-xs sm:text-sm"
                    : "text-sm sm:text-base md:text-lg"
                } leading-tight`}
              >
                <LatexText value={processTextForLatex(text)} inline />
              </span>
            </div>
          </>
        ) : (
          <div className="flex justify-center items-center h-full">
            <div
              className={
                isImageOnlyLayout
                  ? "w-full aspect-square rounded-xl overflow-hidden flex justify-center items-center"
                  : "w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-xl overflow-hidden flex justify-center items-center"
              }
            >
              <ZoomableImage
                media={media}
                alt="Answer media"
                className="w-full h-full object-cover"
                isMobile={isMobile}
              />
            </div>
          </div>
        )
      ) : (
        <div className="flex items-center justify-center h-full w-full">
          <span
            className={`text-[#32428D] font-semibold ${
              fontSmall
                ? "text-xs sm:text-sm"
                : "text-sm sm:text-base md:text-lg"
            } w-full text-center`}
          >
            <LatexText value={processTextForLatex(text)} inline />
          </span>
        </div>
      )}
    </li>
  );
}

// Thêm hàm safeShuffle vào đầu file
function safeShuffle<T extends { id: string | number }>(
  array: T[],
  correctOrder: T[]
): T[] {
  if (array.length <= 1) return [...array];
  let shuffled: T[];
  do {
    shuffled = [...array].sort(() => Math.random() - 0.5);
  } while (
    shuffled.every(
      (item, idx) => String(item.id) === String(correctOrder[idx].id)
    )
  );
  return shuffled;
}

// Helper function để kiểm tra xem tất cả đáp án có chỉ là ảnh không
function isAllAnswersImageOnly(answers: any[]): boolean {
  return answers.every(
    (answer) =>
      answer.media && answer.media.url && (!answer.text || !answer.text.trim())
  );
}

// Hàm detect device type để tối ưu touch sensor
function getTouchSensorConfig() {
  if (typeof window === "undefined") {
    return { delay: 100, tolerance: 5 };
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIPad =
    /ipad/.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /android/.test(userAgent);

  if (isIPad) {
    // iPad: nhạy hơn, delay ngắn hơn
    return { delay: 100, tolerance: 3 };
  } else if (isAndroid) {
    // Android: delay vừa phải
    return { delay: 120, tolerance: 5 };
  } else {
    // Desktop hoặc device khác
    return { delay: 100, tolerance: 5 };
  }
}

// Xác định loại media (image/audio/other)
function getMediaKind(media: any): "image" | "audio" | "other" {
  if (!media) return "other";
  const type: string | undefined = media.type || media.mimeType;
  const url: string | undefined = media.url;
  const lowerType = (type || "").toLowerCase();
  if (lowerType.startsWith("image/")) return "image";
  if (lowerType.startsWith("audio/")) return "audio";
  if (url) {
    const lowerUrl = url.toLowerCase();
    if (/(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp|\.svg)$/.test(lowerUrl))
      return "image";
    if (/(\.mp3|\.wav|\.ogg|\.m4a)$/.test(lowerUrl)) return "audio";
  }
  return "other";
}

// Quyết định layout dọc/ngang theo yêu cầu
function shouldUseVerticalLayout(
  answers: any[] | undefined,
  display?: string
): boolean {
  if (!answers || answers.length === 0) return false;

  // Nếu có giá trị display từ metadata, sử dụng nó
  if (display) {
    if (display === "vertical") return true;
    if (display === "horizontal") return false;
    if (display === "word_count") {
      // Chỉ sử dụng điều kiện dựa trên số ký tự
      const maxTotalCharsAcrossItems = answers.reduce(
        (maxLen: number, a: any) => {
          const text = processTextForLatex(String(a?.text || ""));
          const totalChars = text.length; // Tính cả dấu câu và dấu cách
          return Math.max(maxLen, totalChars);
        },
        0
      );
      return maxTotalCharsAcrossItems > 11;
    }
  }

  // Fallback: sử dụng logic cũ nếu không có display
  // Kiểm tra nếu tất cả đáp án chỉ có ảnh -> dùng layout ngang
  if (isAllAnswersImageOnly(answers)) {
    return false; // Sử dụng horizontal layout
  }

  // Điều kiện 1: Có media là image hoặc audio
  const hasImageOrAudio = answers.some((a: any) => {
    const kind = getMediaKind(a?.media);
    return kind === "image" || kind === "audio";
  });
  if (hasImageOrAudio) return true;

  // Điều kiện 2: Tổng số ký tự các từ (bỏ dấu câu) > ngưỡng
  const maxTotalCharsAcrossItems = answers.reduce((maxLen: number, a: any) => {
    const text = processTextForLatex(String(a?.text || ""));
    const totalChars = text.length; // Tính cả dấu câu và dấu cách
    return Math.max(maxLen, totalChars);
  }, 0);
  return maxTotalCharsAcrossItems > 11;
}

export function OrderingQuestion({
  question,
  userAnswer,
  onAnswerUpdate,
  isSubmitted,
  onFeedback,
  correctAnswer,
}: OrderingQuestionProps) {
  const [orderedItems, setOrderedItems] = useState<any[]>(() => {
    if (userAnswer?.order && userAnswer.order.length > 0) {
      return userAnswer.order
        .map((itemId: string) =>
          question.options.answers?.find(
            (item: any) => String(item.id) === itemId
          )
        )
        .filter(Boolean);
    }
    return safeShuffle(
      question.options.answers || [],
      question.options.answers || []
    );
  });

  useEffect(() => {
    if (userAnswer?.order && userAnswer.order.length > 0) {
      const restored = userAnswer.order
        .map((itemId: string) =>
          question.options.answers?.find(
            (item: any) => String(item.id) === itemId
          )
        )
        .filter(Boolean);
      setOrderedItems(restored);
    } else {
      const shuffled = safeShuffle(
        question.options.answers || [],
        question.options.answers || []
      );
      setOrderedItems(shuffled);
    }
  }, [question.id, question.options.answers]);

  useEffect(() => {
    const order = orderedItems.map((item) => String(item.id));
    onAnswerUpdate({
      order,
      isAnswered: order.length > 0,
    });
  }, [orderedItems, onAnswerUpdate]);

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: getTouchSensorConfig(),
    }),
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
  );

  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      const isMobileScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isMobileScreen);
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  // Kiểm tra nếu tất cả đáp án là text
  const isAllTextAnswers = useMemo(() => {
    return question.options.answers?.every((a) => !a.media || !a.media.url);
  }, [question.options.answers]);

  // Quyết định layout dọc/ngang dựa trên shouldUseVerticalLayout
  const isVertical = useMemo(() => {
    const metadata = question.metadata as any;
    return shouldUseVerticalLayout(question.options.answers, metadata?.display);
  }, [question.options.answers, question.metadata]);

  const mediasWithImage = question.content.medias?.find((media) => media.type === "image")

  return (
    <div
      className={`h-full flex flex-col px-2 sm:px-4 ${
        question.content.media?.url ? "justify-start" : "justify-center"
      } ${question.content.medias && question.content.medias.length > 1 ? 'w-full': ""} `}
    >
      <div className={`space-y-4 sm:space-y-6 ${question.content.medias && question.content.medias.length > 1 && 'sm:px-8'}`}>
        {/* Question */}
        {question.content.medias && question.content.medias.length > 1 ? 
          <>
            {!isTextContentEmpty(question.content.text) && (
              <div className="text-center max-w-4xl mx-auto">
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
        :
        question.content.media && question.content.media.type !== "text" ? (
          // Check if question has only media and no text (including empty HTML tags)
          isTextContentEmpty(question.content.text) ? (
            // Media only - no text
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
            // Media with text
            <div className="flex flex-row items-center gap-4 md:gap-6 landscape:gap-4 max-w-5xl mx-auto">
              {/* Ảnh bên trái */}
              <div className="flex-shrink-0 w-1/3 flex justify-center md:justify-start">
                <MediaDisplay
                  media={question.content.media}
                  alt="Question media"
                  className="max-h-full w-full object-cover rounded-xl shadow-lg"
                />
              </div>
              {/* Text bên phải */}
              <div className="flex-1 w-2/3 flex items-center justify-center md:justify-start min-h-[224px] md:min-h-[288px] lg:min-h-[320px] landscape:min-h-[160px]">
                <div className="w-full text-center md:text-left">
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
              </div>
            </div>
          )
        ) : (
          !isTextContentEmpty(question.content.text) && (
            <div className="text-center max-w-4xl mx-auto">
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
          )
        )}

        {/* Drag and drop section - simplified without media check */}
        {!correctAnswer && (
          <div
            className={`flex flex-col items-center px-1 sm:px-2 ${
              !isVertical &&
              question.options.answers &&
              isAllAnswersImageOnly(question.options.answers)
                ? "touch-pan-y"
                : ""
            }`}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[
                isVertical ? restrictToVerticalAxis : restrictToHorizontalAxis,
              ]}
              autoScroll={isVertical}
              onDragStart={() => {
                // Tạm thời tắt scroll để tối ưu performance
                document.body.style.overflow = "hidden";
              }}
              onDragEnd={({ active, over }) => {
                // Khôi phục scroll
                document.body.style.overflow = "";

                if (!over || active.id === over.id) return;

                const oldIndex = orderedItems.findIndex(
                  (i) => String(i.id) === String(active.id)
                );
                const newIndex = orderedItems.findIndex(
                  (i) => String(i.id) === String(over.id)
                );
                const newItems = arrayMove(orderedItems, oldIndex, newIndex);
                setOrderedItems(newItems);
                onAnswerUpdate({
                  order: newItems.map((item) => String(item.id)),
                  isAnswered: newItems.length > 0,
                });
              }}
            >
              <SortableContext
                items={orderedItems.map((i) => String(i.id))}
                strategy={
                  isVertical
                    ? verticalListSortingStrategy
                    : horizontalListSortingStrategy
                }
              >
                <ul
                  className={
                    isVertical
                      ? // Increase max-w-4xl to max-w-6xl for vertical layout
                        `w-full max-w-6xl mx-auto flex flex-col gap-2 sm:gap-3 overflow-y-auto ${
                          isMobile && isLandscape && isAllTextAnswers
                            ? "py-1 gap-1"
                            : ""
                        }`
                      : // Increase max-w-4xl to max-w-6xl for horizontal layout (when not image-only)
                      question.options.answers &&
                        isAllAnswersImageOnly(question.options.answers)
                      ? "w-full mx-auto flex flex-row !flex-nowrap !flex-shrink-0 gap-1 sm:gap-2 md:gap-3 lg:gap-4 justify-center items-center overflow-x-auto py-2 px-2 sm:px-4 min-w-0"
                      : "w-full max-w-6xl mx-auto flex flex-wrap gap-2 sm:gap-3 justify-center"
                  }
                >
                  {orderedItems.map((item, idx) => (
                    <SortableItem
                      key={String(item.id)}
                      id={String(item.id)}
                      text={item.text}
                      media={item.media}
                      index={idx}
                      isSubmitted={isSubmitted}
                      questionId={String(question.id)}
                      isImageOnlyLayout={
                        !isVertical &&
                        question.options.answers &&
                        isAllAnswersImageOnly(question.options.answers)
                      }
                      fontSmall={isMobile && isLandscape && isAllTextAnswers}
                      isMobile={isMobile}
                      isVertical={isVertical}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {/* Hiển thị đáp án đúng nếu có */}
        {correctAnswer && (
          <div>
            <div className="max-w-6xl w-full mx-auto space-y-4">
              {/* Danh sách đáp án đúng */}
              <div className="flex flex-col items-center">
                {(() => {
                  const answers = question.options.answers || [];
                  let ordered: any[] = [];

                  if (
                    answers.length > 0 &&
                    answers.every((a: any) => a.correct_position !== undefined)
                  ) {
                    ordered = [...answers].sort(
                      (a: any, b: any) =>
                        Number(a.correct_position) - Number(b.correct_position)
                    );
                  } else if (
                    correctAnswer?.ids &&
                    Array.isArray(correctAnswer.ids) &&
                    correctAnswer.ids.length > 0
                  ) {
                    ordered = correctAnswer.ids
                      .map((id: any) =>
                        answers.find((a: any) => String(a.id) === String(id))
                      )
                      .filter(Boolean);
                  } else if (correctAnswer?.list) {
                    ordered = Object.entries(correctAnswer.list)
                      .sort(([, aPos], [, bPos]) => Number(aPos) - Number(bPos))
                      .map(([id]) =>
                        answers.find((a: any) => String(a.id) === String(id))
                      )
                      .filter(Boolean);
                  } else {
                    ordered = answers;
                  }

                  // Tính toán lại các biến layout
                  const isAllTextAnswers = answers?.every(
                    (a) => !a.media || !a.media.url
                  );
                  const metadata = question.metadata as any;
                  const isVertical = shouldUseVerticalLayout(
                    answers,
                    metadata?.display
                  );
                  const isImageOnlyLayout =
                    !isVertical && answers && isAllAnswersImageOnly(answers);
                  const fontSmall = isMobile && isLandscape && isAllTextAnswers;

                  return (
                    // Dùng lại SortableItem để hiển thị đáp án đúng, vẫn giữ thuộc tính background green và border green như cũ
                    <ul
                      className={
                        isVertical
                          ? `w-full max-w-6xl mx-auto flex flex-col gap-2 sm:gap-3 overflow-y-auto ${
                              fontSmall ? "py-1 gap-1" : ""
                            }`
                          : answers && isAllAnswersImageOnly(answers)
                          ? "w-full mx-auto flex flex-row !flex-nowrap !flex-shrink-0 gap-1 sm:gap-2 md:gap-3 lg:gap-4 justify-center items-center overflow-x-auto py-2 px-2 sm:px-4 min-w-0"
                          : "w-full max-w-6xl mx-auto flex flex-wrap gap-2 sm:gap-3 justify-center"
                      }
                    >
                      {ordered.map((item: any, idx: number) => {
                        const hasMedia = item?.media && item.media.url;
                        return (
                          <li
                            key={item.id}
                            className={`bg-green-50 border border-green-200 select-none overflow-hidden rounded-lg sm:rounded-xl ${
                              isImageOnlyLayout
                                ? "!flex-shrink-0 p-1 sm:p-2 md:p-2.5 lg:p-3 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36 2xl:w-40 2xl:h-40 min-w-20 min-h-20"
                                : hasMedia
                                ? `${isVertical ? "w-full" : ""} ${
                                    isMobile
                                      ? "min-h-16"
                                      : "min-h-20 sm:min-h-24"
                                  } p-2 gap-3 sm:gap-4 md:gap-5 flex-shrink-0 flex items-center`
                                : fontSmall
                                ? `py-2 px-3 ${
                                    isVertical ? "w-full" : ""
                                  } min-h-0 flex-shrink-0 flex items-center justify-center`
                                : "p-2 sm:p-3 gap-2 flex-shrink-0 flex items-center justify-center"
                            }`}
                          >
                            {hasMedia ? (
                              item.text && item.text.trim() ? (
                                <>
                                  <div className="flex-shrink-0 h-full flex items-center">
                                    <ZoomableImage
                                      media={item.media}
                                      alt={item.text || "Answer media"}
                                      className={`object-cover rounded-lg w-full max-w-28 sm:max-w-32 h-full`}
                                      showZoomIcon={false}
                                    />
                                  </div>
                                  <div className="flex-1 flex items-center">
                                    <span
                                      className={`text-[#32428D] font-semibold ${
                                        fontSmall
                                          ? "text-xs"
                                          : "text-sm sm:text-base md:text-lg"
                                      } leading-tight`}
                                    >
                                      <LatexText
                                        value={processTextForLatex(item.text)}
                                        inline
                                      />
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <div className="flex justify-center items-center h-full w-full">
                                  <div
                                    className={
                                      isImageOnlyLayout
                                        ? "w-full aspect-square rounded-xl overflow-hidden flex justify-center items-center"
                                        : "w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-xl overflow-hidden flex justify-center items-center"
                                    }
                                  >
                                    <ZoomableImage
                                      media={item.media}
                                      alt="Answer media"
                                      className="w-full h-full object-cover"
                                      showZoomIcon={false}
                                    />
                                  </div>
                                </div>
                              )
                            ) : (
                              <div className="flex items-center justify-center h-full w-full">
                                <span
                                  className={`text-[#32428D] font-semibold ${
                                    fontSmall
                                      ? "text-xs"
                                      : "text-sm sm:text-base md:text-lg"
                                  } w-full text-center`}
                                >
                                  <LatexText
                                    value={processTextForLatex(item.text)}
                                    inline
                                  />
                                </span>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
