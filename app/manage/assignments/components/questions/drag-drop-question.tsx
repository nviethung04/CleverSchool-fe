"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target } from "lucide-react";
import type { QuestionType } from "@/lib/api/questions";
import { TiptapMathViewer } from "@/components/question-editor/tiptap-math-viewer";
import {
  DndContext,
  pointerWithin,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { createPortal } from "react-dom";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { MediaDisplay } from "../media-display";
import { AudioEffects } from "@/lib/utils/audio-utils";

interface DragDropQuestionProps {
  question: QuestionType;
  userAnswer?: {
    placements: Record<string, string>;
    isAnswered: boolean;
  };
  onAnswerUpdate: (answer: any) => void;
  isSubmitted: boolean;
  correctAnswer?: any;
}

// Draggable Item
function DraggableItem({
  item,
  isPlaced,
}: {
  item: { text: string; id: string | number };
  isPlaced: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `item-${item.id}`,
      disabled: isPlaced,
    });

  const style = transform
    ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      zIndex: isDragging ? 1000 : undefined,
      opacity: isDragging ? 0.8 : 1,
      touchAction: "none",
    }
    : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        bg-white rounded-full px-6 py-3 md:px-8 md:py-4 landscape:px-4 landscape:py-2 shadow-md border border-gray-200
        transition-all duration-200 landscape:min-w-[80px] landscape:flex-shrink-0 flex items-center justify-center
        ${isPlaced
          ? "opacity-50 cursor-not-allowed"
          : "cursor-grab hover:scale-105 active:cursor-grabbing"
        }
        ${isDragging ? "shadow-2xl border-blue-400" : ""}
        select-none touch-none
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <span className="text-[#32428D] font-semibold text-lg md:text-xl landscape:text-sm text-center">
        {item.text}
      </span>
    </motion.div>
  );
}

// Drop Zone
function DropZone({
  blankId,
  placedItem,
  onRemoveItem,
  isSubmitted,
  addMarginLeft = false,
}: {
  blankId: string;
  placedItem: string | null;
  onRemoveItem: () => void;
  isSubmitted: boolean;
  addMarginLeft?: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `blank-${blankId}`,
    disabled: isSubmitted || !!placedItem,
  });

  return (
    <motion.div
      ref={setNodeRef}
      className={`
        relative inline-block min-w-[140px] lg:min-w-[160px] landscape:min-w-[100px] h-12 lg:h-14 landscape:h-10 rounded-full mx-1 align-middle
        transition-all duration-300
        ${addMarginLeft ? "ml-2" : ""}
        ${isOver && !placedItem
          ? "shadow-xl border-blue-400 bg-blue-50"
          : placedItem
            ? "bg-green-50 border-green-400 border-solid shadow-lg"
            : "border-2 border-dashed border-gray-300"
        }
      `}
      style={{ verticalAlign: "middle" }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {isOver && !placedItem && (
        <motion.div
          className="absolute inset-0 bg-blue-400 opacity-20 rounded-full border-2 border-dashed border-blue-400"
          animate={{ opacity: [0.2, 0.3, 0.2] }}
          transition={{
            duration: 1,
            repeat: Number.POSITIVE_INFINITY,
          }}
        />
      )}

      {placedItem ? (
        <motion.div
          className="absolute inset-0 rounded-full flex items-center justify-center cursor-pointer bg-white shadow-lg border border-gray-200"
          onClick={() => !isSubmitted && onRemoveItem()}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        >
          <span className="text-lg lg:text-xl landscape:text-sm font-semibold px-4 landscape:px-2 text-[#32428D] text-center">
            {placedItem}
          </span>
        </motion.div>
      ) : (
        <div className="absolute inset-0 rounded-full flex items-center justify-center">
          <span className="text-[#32428D]/40 text-lg landscape:text-xs text-center">
            Kéo vào đây
          </span>
        </div>
      )}
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

export function DragDropQuestion({
  question,
  userAnswer,
  onAnswerUpdate,
  isSubmitted,
  correctAnswer,
}: DragDropQuestionProps) {
  // Nếu có correctAnswer, tạo placements readonly
  const isReadonly = !!correctAnswer;

  // Nếu có correctAnswer.list dạng { sort_position: group_position }
  const readonlyPlacements: Record<string, string> = React.useMemo(() => {
    if (!correctAnswer || !correctAnswer.list) return {};
    // Lấy danh sách answers từ options
    const answerList = question.options?.answers || [];
    // Map: sort_position (key) -> group_position (value)
    // Ta cần map: blank index (sort_position) -> answer text
    const placements: Record<string, string> = {};
    // Sắp xếp sort_position tăng dần
    const sorted = Object.entries(correctAnswer.list).sort(
      ([a], [b]) => Number(a) - Number(b)
    );
    sorted.forEach(([sortPos, groupPos], idx) => {
      // Tìm đáp án có group_position = groupPos
      const answer = answerList.find(
        (a: any) => String(a.group_position) === String(groupPos)
      );
      if (answer) {
        // blank index (idx) sẽ là vị trí trên UI (bắt đầu từ 0 hoặc 1 tuỳ blank)
        // Để tương thích với UI hiện tại, dùng sortPos làm key
        placements[sortPos] = answer.text;
      }
    });
    return placements;
  }, [correctAnswer, question.options?.answers]);

  // Nếu readonly thì dùng placements từ correctAnswer, ngược lại dùng userAnswer
  const [placements, setPlacements] = useState<Record<string, string>>(
    isReadonly ? readonlyPlacements : userAnswer?.placements || {}
  );

  useEffect(() => {
    if (isReadonly) {
      setPlacements(readonlyPlacements);
      onAnswerUpdate({
        placements: readonlyPlacements,
        isAnswered: Object.keys(readonlyPlacements).length > 0,
      });
    } else {
      const initialPlacements = userAnswer?.placements || {};
      setPlacements(initialPlacements);
      onAnswerUpdate({
        placements: initialPlacements,
        isAnswered: Object.keys(initialPlacements).length > 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, isReadonly, readonlyPlacements]);

  const [activeId, setActiveId] = useState<string | null>(null);

  const answers = React.useMemo(() => {
    const arr = question.options?.answers || [];
    return shuffleArray(arr);
  }, [question.id, question.options?.answers]);

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

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: getTouchSensorConfig(),
    }),
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Nếu readonly thì không cho update placements nữa
  useEffect(() => {
    if (!isReadonly) {
      onAnswerUpdate({
        placements,
        isAnswered: Object.keys(placements).length > 0,
      });
    }
  }, [placements, onAnswerUpdate, isReadonly]);

  const handleDragStart = (event: DragStartEvent) => {
    if (isReadonly) return;
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (isReadonly) return;
    const { active, over } = event;
    setActiveId(null);
    if (!over || isSubmitted) return;
    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;
    if (activeIdStr.startsWith("item-") && overIdStr.startsWith("blank-")) {
      const itemId = activeIdStr.replace("item-", "");
      const blankId = overIdStr.replace("blank-", "");
      const newPlacements = { ...placements };

      // Tìm item dựa trên id
      const draggedItem = answers.find((item) => String(item.id) === itemId);

      if (!draggedItem) return;

      console.log("Dragged item:", draggedItem);
      console.log("Current placements:", placements);

      // Remove existing placements for this specific item (using id)
      Object.keys(newPlacements).forEach((key) => {
        const placedItem = answers.find(
          (item) => item.text === newPlacements[key]
        );
        if (placedItem && placedItem.id === draggedItem.id) {
          console.log("Removing placement for item with same id:", placedItem);
          delete newPlacements[key];
        }
      });

      // Add new placement
      newPlacements[blankId] = draggedItem.text;
      console.log("New placements:", newPlacements);
      setPlacements(newPlacements);
    }
  };

  const handleRemoveItem = (blankId: string) => {
    if (isSubmitted || isReadonly) return;

    const newPlacements = { ...placements };
    delete newPlacements[blankId];
    setPlacements(newPlacements);
  };

  const getPlacedItem = (blankId: string) => {
    return placements[blankId] || null;
  };

  const getAvailableItems = () => {
    // Tạo map để đếm số lượng item đã được đặt theo text
    const placedItemCounts: Record<string, number> = {};

    // Đếm số lượng item đã được đặt cho mỗi text
    Object.values(placements).forEach((placedText) => {
      placedItemCounts[placedText] = (placedItemCounts[placedText] || 0) + 1;
    });

    // Lọc ra những item còn lại
    return answers.filter((item) => {
      const placedCount = placedItemCounts[item.text] || 0;

      // Đếm số lượng item cùng text trước item này (bao gồm cả item này)
      const sameTextBeforeCount = answers
        .slice(0, answers.findIndex((a) => a.id === item.id) + 1)
        .filter((a) => a.text === item.text).length;

      // Nếu số lượng item cùng text đã được đặt < số lượng item cùng text trước item này
      // thì item này chưa được đặt
      return placedCount < sameTextBeforeCount;
    });
  };

  const hasMedia = question.content.media && question.content.media.url;
  const activeItem = activeId?.startsWith("item-")
    ? answers.find((item) => String(item.id) === activeId.replace("item-", ""))
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      autoScroll
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full h-full">
        <div className="h-full flex flex-col p-6 landscape:p-3">
          {/* Question Section */}
          <div className="flex-shrink-0 mb-16 sm:mb-18 md:mb-20 lg:mb-24 xl:mb-28 landscape:mb-6">
            {hasMedia ? (
              <div className="flex flex-row items-center gap-4 md:gap-6 landscape:gap-4 max-w-5xl mx-auto">
                {/* Media bên trái - chiếm ít không gian hơn */}
                <div className="flex-shrink-0 w-1/3 flex justify-center md:justify-start">
                  <MediaDisplay
                    media={question.content.media}
                    alt="Hình ảnh câu hỏi"
                    className="max-h-full max-w-48 md:max-w-56 lg:max-w-64 object-contain rounded-xl shadow-lg"
                  />
                </div>
                {/* Text bên phải - chiếm nhiều không gian hơn */}
                <div className="flex-1 w-2/3 flex items-center justify-center md:justify-start min-h-[224px] md:min-h-[288px] lg:min-h-[320px] landscape:min-h-[160px]">
                  <div className="w-full text-center md:text-left">
                    <div className="text-[#32428D] font-medium text-xl lg:text-2xl xl:text-3xl landscape:text-lg leading-relaxed flex flex-wrap justify-center md:justify-start items-baseline">
                      <div className="flex flex-col gap-0.5">
                        {(question.content.text || "")
                          .replace(/<p>|<\/p>/g, "\n")
                          .replace(/<br\s*\/?\>/gi, "\n")
                          .split(/\n+/)
                          .filter((line) => line.trim() !== "")
                          .map((line, lineIdx) => {
                            let lineBlankCounter = 0;
                            return (
                              <span
                                key={lineIdx}
                                className="flex flex-wrap items-center gap-y-1 justify-center md:justify-start"
                                style={{
                                  wordBreak: "break-word",
                                  overflowWrap: "break-word",
                                }}
                              >
                                {line
                                  .split(/(\[blank\d*\])/)
                                  .map((part, index, arr) => {
                                    const blankMatch = part.match(/\[blank(\d*)\]/);
                                    if (blankMatch) {
                                      lineBlankCounter++;
                                      const previousLines = (
                                        question.content.text || ""
                                      )
                                        .replace(/<p>|<\/p>/g, "\n")
                                        .replace(/<br\s*\/?\>/gi, "\n")
                                        .split(/\n+/)
                                        .filter((line) => line.trim() !== "")
                                        .slice(0, lineIdx);
                                      const previousBlanksCount =
                                        previousLines.reduce((count, prevLine) => {
                                          return (
                                            count +
                                            (prevLine.match(/\[blank\d*\]/g) || [])
                                              .length
                                          );
                                        }, 0);
                                      const blankId = String(
                                        previousBlanksCount + lineBlankCounter
                                      );
                                      let addMarginLeft = false;
                                      if (index > 0) {
                                        const prev = arr[index - 1];
                                        if (
                                          prev &&
                                          !prev.match(/^\s*$/) &&
                                          !prev.match(/\[blank\d*\]/)
                                        ) {
                                          addMarginLeft = true;
                                        }
                                      }
                                      return (
                                        <DropZone
                                          key={index}
                                          blankId={blankId}
                                          placedItem={getPlacedItem(blankId)}
                                          onRemoveItem={() =>
                                            handleRemoveItem(blankId)
                                          }
                                          isSubmitted={isSubmitted || isReadonly}
                                          addMarginLeft={addMarginLeft}
                                        />
                                      );
                                    } else if (part !== "") {
                                      const words = part.split(/(\s)/);
                                      return words.map((word, wordIndex) => {
                                        if (word === " ") {
                                          return (
                                            <span
                                              key={`${index}-space-${wordIndex}`}
                                              className="inline"
                                            >
                                              {word}
                                            </span>
                                          );
                                        } else if (word !== "") {
                                          return (
                                            <span
                                              key={`${index}-word-${wordIndex}`}
                                              className="inline align-middle pl-2"
                                            >
                                              <TiptapMathViewer
                                                value={`${word}`}
                                                className="inline-flex"
                                                isHtml
                                              />
                                            </span>
                                          );
                                        }
                                        return null;
                                      });
                                    }
                                    return null;
                                  })}
                              </span>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center max-w-4xl mx-auto">
                <div className="text-[#32428D] font-medium text-xl lg:text-2xl xl:text-3xl landscape:text-lg leading-relaxed flex flex-wrap justify-center items-baseline">
                  <div className="flex flex-col gap-0.5">
                    {(question.content.text || "")
                      .replace(/<p>|<\/p>/g, "\n")
                      .replace(/<br\s*\/?\>/gi, "\n")
                      .split(/\n+/)
                      .filter((line) => line.trim() !== "")
                      .map((line, lineIdx) => {
                        let lineBlankCounter = 0;
                        return (
                          <span
                            key={lineIdx}
                            className="flex flex-wrap items-center gap-y-1 justify-center"
                            style={{
                              wordBreak: "break-word",
                              overflowWrap: "break-word",
                            }}
                          >
                            {line
                              .split(/(\[blank\d*\])/)
                              .map((part, index, arr) => {
                                const blankMatch = part.match(/\[blank(\d*)\]/);
                                if (blankMatch) {
                                  lineBlankCounter++;
                                  const previousLines = (
                                    question.content.text || ""
                                  )
                                    .replace(/<p>|<\/p>/g, "\n")
                                    .replace(/<br\s*\/?\>/gi, "\n")
                                    .split(/\n+/)
                                    .filter((line) => line.trim() !== "")
                                    .slice(0, lineIdx);
                                  const previousBlanksCount =
                                    previousLines.reduce((count, prevLine) => {
                                      return (
                                        count +
                                        (prevLine.match(/\[blank\d*\]/g) || [])
                                          .length
                                      );
                                    }, 0);
                                  const blankId = String(
                                    previousBlanksCount + lineBlankCounter
                                  );
                                  let addMarginLeft = false;
                                  if (index > 0) {
                                    const prev = arr[index - 1];
                                    if (
                                      prev &&
                                      !prev.match(/^\s*$/) &&
                                      !prev.match(/\[blank\d*\]/)
                                    ) {
                                      addMarginLeft = true;
                                    }
                                  }
                                  return (
                                    <DropZone
                                      key={index}
                                      blankId={blankId}
                                      placedItem={getPlacedItem(blankId)}
                                      onRemoveItem={() =>
                                        handleRemoveItem(blankId)
                                      }
                                      isSubmitted={isSubmitted || isReadonly}
                                      addMarginLeft={addMarginLeft}
                                    />
                                  );
                                } else if (part !== "") {
                                  const words = part.split(/(\s)/);
                                  return words.map((word, wordIndex) => {
                                    if (word === " ") {
                                      return (
                                        <span
                                          key={`${index}-space-${wordIndex}`}
                                          className="inline"
                                        >
                                          {word}
                                        </span>
                                      );
                                    } else if (word !== "") {
                                      return (
                                        <span
                                          key={`${index}-word-${wordIndex}`}
                                          className="inline align-middle pl-2"
                                        >
                                          <TiptapMathViewer
                                            value={`${word}`}
                                            className="inline-flex"
                                            isHtml
                                          />
                                        </span>
                                      );
                                    }
                                    return null;
                                  });
                                }
                                return null;
                              })}
                          </span>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Available Items Section */}
          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-5xl">
              {isReadonly ? (
                <div className="flex flex-wrap justify-center gap-3">
                  {answers
                    .filter((item) => {
                      const placedItemCounts: Record<string, number> = {};
                      Object.values(readonlyPlacements).forEach((placedText) => {
                        placedItemCounts[placedText] =
                          (placedItemCounts[placedText] || 0) + 1;
                      });
                      const sameTextBeforeCount = answers
                        .slice(0, answers.findIndex((a) => a.id === item.id) + 1)
                        .filter((a) => a.text === item.text).length;
                      const placedCount = placedItemCounts[item.text] || 0;
                      return placedCount < sameTextBeforeCount;
                    })
                    .map((item, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-full px-6 py-3 md:px-8 md:py-4 shadow-md border border-gray-200 opacity-70 select-none cursor-default"
                        style={{ pointerEvents: "none" }}
                      >
                        <span className="text-[#32428D] font-semibold text-lg md:text-xl">
                          {item.text}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <motion.div
                  className={`flex flex-wrap justify-center gap-3 landscape:gap-2 ${getAvailableItems().length > 6 ||
                    getAvailableItems().some((item) => item.text.length > 8)
                    ? "landscape:max-w-full landscape:overflow-x-auto landscape:flex-nowrap landscape:justify-start landscape:pb-2"
                    : "landscape:flex-wrap landscape:justify-center"
                    }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <AnimatePresence>
                    {getAvailableItems().map((item, index) => (
                      <DraggableItem key={index} item={item} isPlaced={false} />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Drag Overlay */}
        {!isReadonly && typeof window !== "undefined" && (
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
                    className="bg-white rounded-full px-6 py-3 landscape:px-4 landscape:py-2 shadow-2xl border-2 border-blue-400 opacity-90"
                    style={{
                      transform: "translate3d(0, 0, 0)",
                      willChange: "transform",
                    }}
                  >
                    <span className="text-[#32428D] font-semibold text-lg md:text-xl landscape:text-base">
                      {activeItem.text}
                    </span>
                  </div>
                )}
              </DragOverlay>,
              document.getElementById("drag-overlay-portal") || document.body
            )}
          </>
        )}
      </div>
    </DndContext>
  );
}
