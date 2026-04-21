"use client";

import { useState, useEffect, useMemo } from "react";
import type { QuestionType } from "@/lib/api/questions";
import { TiptapMathViewer } from "@/components/question-editor/tiptap-math-viewer";
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
}: {
  id: string;
  text: string;
  media?: any;
  index: number;
  isSubmitted: boolean;
  questionId: string;
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
        transition,
        zIndex: isDragging ? 99 : undefined,
        opacity: isDragging ? 0.7 : 1,
        touchAction: "none",
      }}
      className={`flex items-center bg-white rounded-xl border border-gray-200 shadow-md px-4 py-3 gap-3 select-none flex-shrink-0 ${hasMedia ? "min-h-[80px]" : ""
        }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex-1 flex items-center gap-3">
        {/* Media display */}
        {hasMedia && (
          <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0">
            <MediaDisplay
              key={`${questionId}-${id}-${media.url}`}
              media={media}
              alt={text || "Answer media"}
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        )}

        {/* Text content */}
        <span className="text-[#32428D] font-semibold text-base sm:text-lg">
          {text}
        </span>
      </div>

      {/* Drag remains enabled from the entire item; handle icon removed */}
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
function shouldUseVerticalLayout(answers: any[] | undefined): boolean {
  if (!answers || answers.length === 0) return false;
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
  return maxTotalCharsAcrossItems > 8;
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

  // Reset orderedItems when question changes
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
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const isVertical = useMemo(
    () => shouldUseVerticalLayout(question.options.answers),
    [question.options.answers]
  );

  return (
    <div
      className={`h-full flex flex-col ${question.content.media?.url ? "justify-start" : "justify-center"
        }`}
    >
      <div className="space-y-6">
        <p className="text-[#32428D] font-medium leading-relaxed text-center text-lg sm:text-xl lg:text-2xl">
          <TiptapMathViewer
            value={question.content.text?.split("\n").join("<br />")}
            isHtml
          />
        </p>

        {/* Layout 2 phần: Trên (câu hỏi + media), Dưới (danh sách đáp án) */}
        {question.content.media?.url && !correctAnswer ? (
          <div className="max-w-6xl w-full mx-auto space-y-4">
            {/* Phần trên: media */}
            <div className="flex justify-center items-center">
              <div className="bg-white rounded-3xl p-4 shadow-lg w-full max-w-md lg:max-w-lg aspect-[4/3] border border-gray-200">
                <MediaDisplay
                  key={`question-media-${question.id}-${question.content.media.url}`}
                  media={question.content.media}
                  alt="Question media"
                  className="w-full h-full object-contain rounded-2xl"
                />
              </div>
            </div>
            {/* Phần dưới: danh sách kéo thả */}
            <div className="flex flex-col items-center">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[
                  isVertical
                    ? restrictToVerticalAxis
                    : restrictToHorizontalAxis,
                ]}
                autoScroll
                onDragEnd={({ active, over }) => {
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
                        ? "w-full max-w-4xl mx-auto flex flex-col gap-3 overflow-y-auto"
                        : "w-full max-w-4xl mx-auto flex flex-row flex-nowrap gap-3 overflow-x-auto"
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
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        ) : null}

        {/* Nếu không có media và chưa có correctAnswer, hiển thị kéo thả đơn giản */}
        {!question.content.media?.url && !correctAnswer && (
          <div className="flex flex-col items-center">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[
                isVertical ? restrictToVerticalAxis : restrictToHorizontalAxis,
              ]}
              autoScroll
              onDragEnd={({ active, over }) => {
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
                      ? "w-full max-w-4xl mx-auto flex flex-col gap-3 overflow-y-auto"
                      : "w-full max-w-4xl mx-auto flex flex-row flex-nowrap gap-3 overflow-x-auto"
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
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {/* Hiển thị đáp án đúng nếu có */}
        {correctAnswer && (
          <div className="mt-4">
            <div className="max-w-6xl w-full mx-auto space-y-4">
              {/* Phần trên: media nếu có */}
              {question.content.media?.url && (
                <div className="flex justify-center items-center">
                  <div className="bg-white rounded-3xl p-4 shadow-lg w-full max-w-md lg:max-w-lg aspect-[4/3] border border-gray-200">
                    <MediaDisplay
                      key={`question-media-correct-${question.id}-${question.content.media.url}`}
                      media={question.content.media}
                      alt="Question media"
                      className="w-full h-full object-contain rounded-2xl"
                    />
                  </div>
                </div>
              )}

              {/* Phần dưới: danh sách đáp án đúng */}
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

                  return (
                    <ul className="w-full max-w-4xl mx-auto flex flex-row flex-nowrap gap-3 overflow-x-auto">
                      {ordered.map((item: any) => {
                        const hasMedia = item?.media && item.media.url;
                        return (
                          <li
                            key={item.id}
                            className={`flex items-center bg-green-50 rounded-xl border border-green-200 shadow px-4 py-3 gap-3 select-none flex-shrink-0 ${hasMedia ? "min-h-[96px]" : ""
                              }`}
                          >
                            <div className="flex-1 flex items-center gap-3">
                              {hasMedia && (
                                <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0">
                                  <MediaDisplay
                                    key={`correct-${question.id}-${item.id}-${item.media.url}`}
                                    media={item.media}
                                    alt={item.text || "Answer media"}
                                    className="w-full h-full object-contain rounded-lg"
                                  />
                                </div>
                              )}
                              <span className="text-[#32428D] font-semibold text-base sm:text-lg">
                                {item.text}
                              </span>
                            </div>
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
