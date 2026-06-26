"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import React from "react";
import { motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { createPortal } from "react-dom";

import { MediaDisplay } from "../media-display";
import { TiptapMathViewer } from "@/components/question-editor/tiptap-math-viewer";
import { LatexText } from "@/components/latex-text";
import { AudioEffects } from "@/lib/utils/audio-utils";
import { QuestionMedia } from "@/lib/api/questions";

interface CategoryQuestionProps {
  question: any;
  userAnswer: any;
  onAnswerUpdate: (answer: any) => void;
  isSubmitted: boolean;
  onCheck?: () => void;
  onSkip?: () => void;
  onFeedback?: (state: "correct" | "incorrect") => void;
  correctAnswer?: any;
  isPopupMode?: boolean;
}

// Helper function để xử lý HTML entities và tags trước khi render LaTeX
function processTextForLatex(text: string): string {
  if (!text) return "";

  const entityMap: { [key: string]: string } = {};
  let entityCounter = 0;

  // Thay thế entity bằng placeholder để tránh bị xóa khi loại bỏ tag
  let processedText = text.replace(/&[a-zA-Z0-9#]+;/g, (match) => {
    const placeholder = `__ENTITY_${entityCounter}__`;
    entityMap[placeholder] = match;
    entityCounter++;
    return placeholder;
  });

  // Loại bỏ tất cả HTML tags
  processedText = processedText.replace(/<[^>]*>/g, "");

  // Phục hồi entity và decode một số entity phổ biến
  Object.keys(entityMap).forEach((placeholder) => {
    const entity = entityMap[placeholder];
    let decodedEntity = entity;
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
        decodedEntity = entity;
    }
    processedText = processedText.replace(placeholder, decodedEntity);
  });

  return processedText;
}

// Hàm shuffle Fisher-Yates
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function CategoryQuestion({
  question,
  userAnswer,
  onAnswerUpdate,
  isSubmitted,
  onCheck,
  onSkip,
  onFeedback,
  correctAnswer,
  isPopupMode = false,
}: CategoryQuestionProps) {
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

  // Safely access categories and responses with fallbacks - MEMOIZED
  const categories = useMemo(
    () =>
      (question?.options?.categories || []).map((cat: any) => ({
        id: cat.id?.toString(),
        text: cat.name || cat.text,
        media: cat.media,
      })),
    [question?.options?.categories]
  );

  const [shuffledResponses, setShuffledResponses] = useState<any[]>([]);

  useEffect(() => {
    if (question?.options?.items) {
      const mapped = question.options.items.map((item: any) => ({
        id: item.id?.toString(),
        text: item.text,
        media: item.media,
      }));
      setShuffledResponses(shuffleArray(mapped));
    }
  }, [question?.id, question?.options?.items]);

  // Initialize connections state with user answer or empty object
  const [connections, setConnections] = useState<Record<string, string[]>>(
    () => {
      if (userAnswer && userAnswer.connections) {
        return userAnswer.connections;
      }

      // Initialize with empty arrays for each category
      const initialConnections: Record<string, string[]> = {};
      categories.forEach((category: any) => {
        initialConnections[category.id] = [];
      });
      return initialConnections;
    }
  );

  // Reset connections when question changes
  useEffect(() => {
    if (!question?.id) return;

    const newConnections: Record<string, string[]> =
      userAnswer?.connections ?? {};

    const initialized: Record<string, string[]> = {};
    categories.forEach((category: any) => {
      initialized[category.id] = newConnections[category.id] || [];
    });

    setConnections(initialized);
  }, [question?.id, categories, userAnswer?.connections]);

  // Track if we're currently in a drag operation to prevent unnecessary re-renders
  const [isDragging, setIsDragging] = useState(false);

  // Update parent component when connections change - memoize the answer object
  const currentAnswer = useMemo(() => {
    const answerMap: Record<string, string | number> = {};
    shuffledResponses.forEach((response: any) => {
      for (const [categoryId, responseIds] of Object.entries(connections)) {
        if (responseIds.includes(response.id)) {
          answerMap[response.id] = categoryId;
          return;
        }
      }
      answerMap[response.id] = 0;
    });

    const isAnswered = Object.values(connections).some(
      (arr) => Array.isArray(arr) && arr.length > 0
    );

    return {
      answers: answerMap,
      connections,
      isAnswered,
    };
  }, [connections, shuffledResponses]);

  // Keep latest onAnswerUpdate in a ref to avoid re-renders when it changes
  const onAnswerUpdateRef = React.useRef(onAnswerUpdate);
  React.useEffect(() => {
    onAnswerUpdateRef.current = onAnswerUpdate;
  }, [onAnswerUpdate]);

  // Use useRef to track previous answer to avoid unnecessary calls
  const prevAnswerRef = React.useRef(currentAnswer);

  useEffect(() => {
    // Only call onAnswerUpdate if the answer actually changed
    if (
      JSON.stringify(prevAnswerRef.current) !== JSON.stringify(currentAnswer)
    ) {
      onAnswerUpdateRef.current(currentAnswer);
      prevAnswerRef.current = currentAnswer;
    }
  }, [currentAnswer]);

  // Add a response to a category with optimized state update
  const addResponseToCategory = useCallback(
    (responseId: string, categoryId: string) => {
      setConnections((prev) => {
        // Check if already in correct position to avoid unnecessary update
        const currentCategory = Object.entries(prev).find(([_, ids]) =>
          ids.includes(responseId)
        )?.[0];
        if (
          currentCategory === categoryId &&
          prev[categoryId]?.[0] === responseId
        ) {
          return prev; // No change needed
        }

        const updatedConnections = { ...prev };

        // Remove from all categories
        Object.keys(updatedConnections).forEach((catId) => {
          updatedConnections[catId] = updatedConnections[catId].filter(
            (id) => id !== responseId
          );
        });

        // Add to the beginning of the new category
        updatedConnections[categoryId] = [
          responseId,
          ...(updatedConnections[categoryId] || []),
        ];

        return updatedConnections;
      });
    },
    []
  );

  // Remove a response from a category with optimized state update
  const removeResponseFromCategory = useCallback(
    (responseId: string, categoryId: string) => {
      setConnections((prev) => {
        // Check if item exists in category to avoid unnecessary update
        if (!prev[categoryId]?.includes(responseId)) {
          return prev; // No change needed
        }

        return {
          ...prev,
          [categoryId]: prev[categoryId].filter((id) => id !== responseId),
        };
      });
    },
    []
  );

  // Find which category a response is in
  const findResponseCategory = useCallback(
    (responseId: string): string | null => {
      for (const [categoryId, responseIds] of Object.entries(connections)) {
        if (responseIds.includes(responseId)) {
          return categoryId;
        }
      }
      return null;
    },
    [connections]
  );

  // Get all responses that are not assigned to any category - memoized
  const getUnassignedResponses = useMemo(() => {
    const assignedResponseIds = Object.values(connections).flat();
    return shuffledResponses.filter(
      (response: any) => !assignedResponseIds.includes(response.id)
    );
  }, [connections, shuffledResponses]);

  // Get responses assigned to a specific category - memoized per category
  const getCategoryResponsesMap = useMemo(() => {
    const map: { [key: string]: any[] } = {};
    Object.keys(connections).forEach((categoryId) => {
      const responseIds = connections[categoryId] || [];
      map[categoryId] = shuffledResponses.filter((response: any) =>
        responseIds.includes(response.id)
      );
    });
    return map;
  }, [connections, shuffledResponses]);

  // Memoize categories with their responses to prevent unnecessary re-renders
  const categoriesWithResponses = useMemo(() => {
    return categories.map((category: any, index: number) => ({
      ...category,
      categoryResponses: getCategoryResponsesMap[category.id] || [],
      index,
    }));
  }, [categories, getCategoryResponsesMap]);

  if (
    !correctAnswer &&
    categories.length === 0 &&
    shuffledResponses.length === 0
  ) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-amber-800">
        Câu hỏi danh mục chưa có dữ liệu (nhóm hoặc mục trả lời). Vui lòng mở
        ngân hàng câu hỏi, chỉnh sửa câu hỏi này và lưu lại.
      </div>
    );
  }

  // dnd-kit sensors - optimized for new layout
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Giảm distance để responsive hơn
        delay: 0,
        tolerance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint:
      {
        delay: 150, // Giảm delay để responsive hơn
        tolerance: 5,
      },
    })
  );

  // Custom collision detection to be more precise
  const customCollisionDetection = useCallback((args: any) => {
    const pointerIntersections = closestCenter(args);
    return pointerIntersections;
  }, []);

  // dnd-kit: track active drag and active item
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<any>(null);

  // --- SCROLL POSITION STATE (parent-level, persistent) ---
  // Store scroll positions for each list by id
  const scrollPositionsRef = React.useRef<{ [key: string]: number }>({});

  // Helper to get/set scroll position for a given id - stable references
  const scrollHelpers = useMemo(
    () => ({
      getScrollPosition: (id: string) => scrollPositionsRef.current[id] || 0,
      setScrollPosition: (id: string, pos: number) => {
        scrollPositionsRef.current[id] = pos;
      },
    }),
    []
  );

  // dnd-kit: handle drag end
  const handleDragEnd = useCallback(
    (event: any) => {
      const { active, over } = event;
      setActiveId(null);
      setActiveItem(null);
      setIsDragging(false); // Stop drag state

      // Reset drag started flag after a short delay
      setTimeout(() => setDragStarted(false), 100);

      if (!over) return;

      // If dropped over a category, assign
      if (over.data?.current?.categoryId) {
        addResponseToCategory(active.id, over.data.current.categoryId);
      }
      // If dropped over the unassigned area, remove from any category
      else if (over.id === "unassigned") {
        // Find which category the item is currently in and remove it
        const currentCategory = findResponseCategory(active.id);
        if (currentCategory) {
          removeResponseFromCategory(active.id, currentCategory);
        }
      }
    },
    [addResponseToCategory, findResponseCategory, removeResponseFromCategory]
  );

  // Track if a drag actually happened (vs just a click)
  const [dragStarted, setDragStarted] = useState(false);

  // dnd-kit: handle drag start
  const handleDragStart = useCallback(
    (event: any) => {
      const draggedId = event.active.id;
      setActiveId(draggedId);
      setIsDragging(true); // Start drag state
      setDragStarted(true); // Mark that drag started

      // Find the active item data from all responses
      const draggedItem = shuffledResponses.find(
        (response: any) => response.id === draggedId
      );
      setActiveItem(draggedItem);
    },
    [shuffledResponses]
  );

  // dnd-kit: Draggable Response
  const DraggableResponse = useCallback(
    ({ response, isAssigned = false, categoryId = null }: any) => {
      const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({
          id: response.id,
        });

      const [clickStartTime, setClickStartTime] = useState<number | null>(null);

      // Khi dùng DragOverlay, ẩn hẳn phần tử gốc để tránh "bóng" theo sau
      const style = {
        transform:
          !isDragging && transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
        touchAction: "none" as const,
        zIndex: isDragging ? 0 : undefined,
        willChange: "transform",
      } as React.CSSProperties;

      const handlePointerDown = (e: React.PointerEvent) => {
        // Kiểm tra nếu click vào MediaDisplay thì không xử lý drag
        const target = e.target as HTMLElement;
        if (target.closest('[data-media-display]')) {
          e.stopPropagation();
          return;
        }
        setClickStartTime(Date.now());
      };

      const handlePointerUp = (e: React.PointerEvent) => {
        // Kiểm tra nếu click vào MediaDisplay thì không xử lý
        const target = e.target as HTMLElement;
        if (target.closest('[data-media-display]')) {
          e.stopPropagation();
          setClickStartTime(null);
          return;
        }
        if (isAssigned && categoryId && clickStartTime) {
          const clickDuration = Date.now() - clickStartTime;
          // Nếu click ngắn (< 200ms) và không có drag, thì xử lý như click
          if (clickDuration < 200 && !dragStarted) {
            e.preventDefault();
            e.stopPropagation();
            removeResponseFromCategory(response.id, categoryId);
          }
        }
        setClickStartTime(null);
      };
      return (
        <motion.div
          ref={setNodeRef}
          style={{
            ...style,
            cursor: isAssigned ? "pointer" : isDragging ? "grabbing" : "grab",
          }}
          className={`${isAssigned
            ? isMobile
              // Mobile: bỏ min-w khi đã assigned
              ? "bg-transparent border-none shadow-none mb-0 p-0 w-fit max-w-[300px]"
              // Desktop: giữ min-w
              : "bg-transparent border-none shadow-none mb-0 p-0 w-fit min-w-[120px] sm:min-w-[140px] max-w-[300px]"
            : "bg-white rounded-lg px-4 py-3 sm:px-5 sm:py-4 shadow-md border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200"
            } ${isDragging ? "shadow-2xl scale-105" : ""
            } flex items-center justify-center gap-2 select-none ${isAssigned
              ? ""
              : `w-fit min-w-[100px] sm:min-w-[120px] max-w-[200px] ${response.media && (response.media.url || response.media.file)
                ? "h-16 sm:h-20"
                : "h-10 sm:h-12"
              } text-center`
            } relative ${isAssigned ? "pointer-events-none z-0" : "pointer-events-auto z-10"
            } ${isDragging ? "invisible" : "visible"}`}
          whileHover={{ scale: isDragging ? 1 : 1.02 }}
          whileTap={{ scale: 0.98 }}
          {...attributes}
          {...(isAssigned ? {} : {
            ...listeners,
            onPointerDown: (e: React.PointerEvent) => {
              // Kiểm tra nếu click vào MediaDisplay thì không bắt đầu drag
              const target = e.target as HTMLElement;
              const mediaDisplay = target.closest('[data-media-display]');
              if (mediaDisplay) {
                e.stopPropagation();
                e.preventDefault();
                return;
              }
              // Nếu không phải MediaDisplay, gọi handler gốc từ listeners
              if (listeners?.onPointerDown) {
                listeners.onPointerDown(e as any);
              }
            },
            onPointerMove: (e: React.PointerEvent) => {
              // Chỉ cho phép drag nếu không phải từ MediaDisplay
              const target = e.target as HTMLElement;
              if (!target.closest('[data-media-display]')) {
                if (listeners?.onPointerMove) {
                  listeners.onPointerMove(e as any);
                }
              }
            }
          })}
        >
          {/* Clickable overlay for interaction - only for assigned items */}
          {isAssigned && (
            <div
              className="absolute inset-0 cursor-pointer z-10"
              style={{ pointerEvents: isDragging ? "none" : "auto" }}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                // Ngăn click vào MediaDisplay (khung blue)
                if (target.closest('[data-media-display]')) {
                  e.stopPropagation();
                  return;
                }
                // Ngăn click vào text
                if (target.closest('span') || target.tagName === 'SPAN') {
                  e.stopPropagation();
                  return;
                }
                // Click vào vùng trống (giữa khung gray và khung blue) → Bỏ item ra khỏi nhóm
                // Chỉ xử lý khi click trực tiếp vào overlay (không phải vào phần tử con)
                if (target === e.currentTarget) {
                  if (categoryId) {
                    e.stopPropagation();
                    removeResponseFromCategory(response.id, categoryId);
                  }
                }
              }}
            />
          )}

          {response.media && (response.media.url || response.media.file) ? (
            response.media.type === "audio" ||
              response.media.type === "video" ? (
              <div 
                data-media-display
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-1 sm:p-2 bg-blue-50 rounded-lg border border-blue-200 w-full max-w-[160px] sm:max-w-[200px] relative z-20 flex-shrink-0 overflow-hidden"
                style={{ 
                  pointerEvents: "auto",
                  cursor: "default"
                }}
                onClick={(e) => {
                  // Ngăn event bubble lên drag handlers
                  e.stopPropagation();
                }}
                onPointerDown={(e) => {
                  // Ngăn drag khi click vào MediaDisplay
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onPointerMove={(e) => {
                  // Ngăn drag khi di chuyển trong MediaDisplay
                  e.stopPropagation();
                }}
              >
                <MediaDisplay
                  media={response.media}
                  alt={response.text || "Response media"}
                  className="w-full"
                />
              </div>
            ) : (
              <MediaDisplay
                media={response.media}
                alt={response.text || "Response image"}
                className="object-contain pointer-events-none w-16 h-16 sm:w-20 sm:h-20 rounded flex-shrink-0"
              />
            )
          ) : null}
          {response.text && (
            <span
              className={`text-[#32428D] font-medium text-center pointer-events-none leading-tight flex-shrink-0 ${isAssigned ? "text-sm" : "text-md sm:text-base"
                } break-words max-w-full px-1`}
            >
              <LatexText value={processTextForLatex(response.text)} inline />
            </span>
          )}
        </motion.div>
      );
    },
    [removeResponseFromCategory, dragStarted, isMobile]
  );

  // dnd-kit: Droppable Unassigned Area
  const DroppableUnassigned = useMemo(
    () =>
      React.memo(
        function DroppableUnassigned({
          unassignedResponses,
          isDragging,
        }: {
          unassignedResponses: any[];
          isDragging: boolean;
        }) {
          const { setNodeRef, isOver } = useDroppable({
            id: "unassigned",
          });
          const scrollRef = React.useRef<HTMLDivElement>(null);

          // Restore scroll position from parent-level ref
          React.useLayoutEffect(() => {
            const node = scrollRef.current;
            if (node) {
              const savedPos = scrollHelpers.getScrollPosition("unassigned");
              node.scrollTop = savedPos;
            }
          });

          // Save scroll position to parent-level ref
          React.useEffect(() => {
            const node = scrollRef.current;
            if (!node) return;
            const handleScroll = () => {
              const pos = node.scrollTop;
              scrollHelpers.setScrollPosition("unassigned", pos);
            };
            node.addEventListener("scroll", handleScroll);
            return () => {
              node.removeEventListener("scroll", handleScroll);
            };
          }, []);

          return (
            <div className="w-full flex flex-col items-center h-full">
              {/* Ẩn phần header ở trên mobile */}
              {!isMobile && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-3 sm:mb-4 flex-shrink-0 text-center w-full justify-center">
                  <div className="flex items-center gap-2 justify-center">
                    <h3 className="text-[#32428D] text-sm sm:text-base lg:text-lg font-semibold">
                      Các lựa chọn
                    </h3>
                    {unassignedResponses.length > 0 && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                        {unassignedResponses.length}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-md sm:text-base">
                    Di chuyển chuột vào khoảng trống để kéo thả đáp án
                  </p>
                </div>
              )}
              <div
                ref={(node) => {
                  setNodeRef(node);
                  scrollRef.current = node;
                }}
                className={`w-full flex-1 ${isMobile
                  ? ""
                  : unassignedResponses.length > 12
                    ? "max-h-[250px] sm:max-h-[300px] md:max-h-[350px]"
                    : "max-h-[300px] sm:max-h-[350px] md:max-h-[400px] lg:max-h-[450px]"
                  } ${isMobile ? "p-1.5 sm:p-2 lg:p-3" : "p-3 sm:p-4 lg:p-5"} rounded-xl scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent flex justify-center`}
                style={{
                  scrollBehavior: "auto",
                  overscrollBehavior: "contain",
                  contain: "layout style paint",
                }}
              >
                <div
                  className="flex flex-wrap justify-center items-start gap-1.5 sm:gap-2 md:gap-2.5"
                  style={{ minHeight: "max-content" }}
                >
                  {unassignedResponses.map((response: any) => (
                    <DraggableResponse key={response.id} response={response} />
                  ))}
                </div>
              </div>
            </div>
          );
        },
        (prevProps, nextProps) => {
          // Only re-render when actually needed
          const shouldNotRerender =
            prevProps.unassignedResponses.length ===
            nextProps.unassignedResponses.length &&
            prevProps.unassignedResponses.every(
              (resp: any, idx: number) =>
                resp.id === nextProps.unassignedResponses[idx]?.id
            ) &&
            prevProps.isDragging === nextProps.isDragging;

          return shouldNotRerender;
        }
      ),
    [scrollHelpers, DraggableResponse, isMobile]
  );

  // dnd-kit: Droppable Category
  const DroppableCategory = useMemo(
    () =>
      React.memo(
        function DroppableCategory({
          category,
          index,
          categoryResponses,
          isDragging,
          widthClass,
        }: {
          category: any;
          index: number;
          categoryResponses: any[];
          isDragging: boolean;
          widthClass?: string;
        }) {
          const { setNodeRef, isOver } = useDroppable({
            id: `category-${category.id}`,
            data: { categoryId: category.id },
          });
          const scrollRef = React.useRef<HTMLDivElement>(null);

          // Restore scroll position from parent-level ref
          React.useLayoutEffect(() => {
            const node = scrollRef.current;
            if (node) {
              const savedPos = scrollHelpers.getScrollPosition(
                `category-${category.id}`
              );
              node.scrollTop = savedPos;
            }
          });

          // Save scroll position to parent-level ref
          React.useEffect(() => {
            const node = scrollRef.current;
            if (!node) return;
            const handleScroll = () => {
              const pos = node.scrollTop;
              scrollHelpers.setScrollPosition(`category-${category.id}`, pos);
            };
            node.addEventListener("scroll", handleScroll);
            return () => {
              node.removeEventListener("scroll", handleScroll);
            };
          }, [category.id]);

          // Random accent colors for each category
          const accentColors = [
            "bg-green-400",
            "bg-blue-400",
            "bg-purple-400",
            "bg-pink-400",
            "bg-yellow-400",
            "bg-red-400",
            "bg-indigo-400",
            "bg-teal-400",
          ];

          const colorIndex = index % accentColors.length;
          const accentColor = accentColors[colorIndex];

          return (
            <div
              ref={(node) => {
                setNodeRef(node);
                scrollRef.current = node;
              }}
              className={`flex flex-col ${widthClass || "w-full"
                } h-full max-h-[250px] sm:max-h-[300px] md:max-h-[350px] lg:max-h-[400px] relative rounded-xl ${isOver
                  ? `shadow-2xl scale-105 bg-white border border-gray-300`
                  : `shadow-lg bg-white border border-gray-200`
                } transition-all duration-300 ease-in-out`}
            >
              {/* Category Header - Clean minimal design */}
              <div
                className={`w-full bg-white rounded-t-xl p-2 sm:p-3 lg:p-4 relative flex-shrink-0 ${isOver ? `bg-gray-50` : ""
                  } transition-all duration-300`}
              >
                <div className="text-center">
                  {category.media &&
                    (category.media.url || category.media.file) ? (
                    <div className="flex flex-col items-center gap-1 sm:gap-2 lg:gap-3">
                      <div className="p-1 sm:p-1.5 lg:p-2 rounded-lg bg-gray-50">
                        {category.media.type === "audio" ||
                          category.media.type === "video" ? (
                          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-1 sm:p-2 bg-blue-50 rounded-lg border border-blue-200 w-full max-w-[280px] sm:max-w-[320px] overflow-hidden">
                            <MediaDisplay
                              media={category.media}
                              alt={category.text || "Category media"}
                              className="w-full"
                            />
                          </div>
                        ) : (
                          <MediaDisplay
                            media={category.media}
                            alt={category.text || "Category image"}
                            className="object-contain pointer-events-none w-32 h-32 sm:w-36 sm:h-36 rounded-lg"
                          />
                        )}
                      </div>
                      {category.text && (
                        <div className="flex flex-col items-center gap-1 sm:gap-2">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <h3 className="text-[#32428D] text-md sm:text-base font-bold tracking-wide uppercase select-none pointer-events-none text-center">
                              <LatexText
                                value={processTextForLatex(category.text)}
                                inline
                              />
                            </h3>
                            {categoryResponses.length > 0 && (
                              <span className="bg-green-100 text-green-700 text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">
                                {categoryResponses.length}
                              </span>
                            )}
                          </div>
                          {/* Color accent bar under title */}
                          <div
                            className={`w-6 sm:w-8 lg:w-12 h-0.5 sm:h-1 ${accentColor} rounded-full`}
                          ></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    category.text && (
                      <div className="flex flex-col items-center gap-1 sm:gap-2">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <h3 className="text-[#32428D] text-md sm:text-base font-bold tracking-wide uppercase select-none pointer-events-none py-1 text-center">
                            <LatexText
                              value={processTextForLatex(category.text)}
                              inline
                            />
                          </h3>
                          {categoryResponses.length > 0 && (
                            <span className="bg-green-100 text-green-700 text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">
                              {categoryResponses.length}
                            </span>
                          )}
                        </div>
                        {/* Color accent bar under title */}
                        <div
                          className={`w-6 sm:w-8 lg:w-12 h-0.5 sm:h-1 ${accentColor} rounded-full`}
                        ></div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Content Area - Clean and spacious */}
              <div
                className="flex-1 w-full flex flex-col items-center justify-start p-2 sm:p-3 lg:p-5 pt-1 sm:pt-2 lg:pt-4 bg-white rounded-b-xl overflow-y-auto relative"
                style={{
                  contain: "layout style paint",
                  scrollBehavior: "auto",
                  overscrollBehavior: "contain",
                }}
                ref={scrollRef}
              >
                {/* Connected responses */}
                <div
                  className={
                    isMobile
                      ? // Mobile: căn giữa các đáp án theo chiều ngang
                      "w-full flex flex-wrap justify-center gap-1 sm:gap-2 lg:gap-3 relative flex-1"
                      : // Desktop: mỗi đáp án một dòng
                      "w-full space-y-1 sm:space-y-2 lg:space-y-3 relative flex-1"
                  }
                  style={{
                    pointerEvents: "none",
                    minHeight: "max-content",
                  }}
                >
                  {categoryResponses.map((response: any, idx: number) => (
                    <div
                      key={`${category.id}-${response.id}`}
                      data-response-item
                      className={
                        isMobile
                          ? "inline-flex justify-center items-center gap-1 sm:gap-2 lg:gap-3 p-3 sm:p-4 lg:p-5 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-200 hover:border-gray-300 transition-colors w-fit cursor-pointer"
                          : "flex justify-center items-center gap-1 sm:gap-2 lg:gap-3 p-3 sm:p-4 lg:p-5 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                      }
                      style={{ pointerEvents: "auto" }}
                      title="Click vào vùng trống (loại trừ khung blue) để xóa khỏi nhóm"
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        // Loại trừ: không xử lý nếu click vào khung blue (media audio)
                        if (target.closest('[data-media-display]')) {
                          e.stopPropagation();
                          return;
                        }
                        // Click vào khung gray (A) nhưng không phải khung blue (B) → Bỏ item ra khỏi nhóm
                        removeResponseFromCategory(response.id, category.id);
                      }}
                    >
                      <DraggableResponse
                        response={response}
                        isAssigned={true}
                        categoryId={category.id}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        },
        (prevProps, nextProps) => {
          // Only re-render when actually needed
          const shouldNotRerender =
            prevProps.category.id === nextProps.category.id &&
            prevProps.category.text === nextProps.category.text &&
            prevProps.category.media === nextProps.category.media &&
            prevProps.index === nextProps.index &&
            prevProps.categoryResponses.length ===
            nextProps.categoryResponses.length &&
            prevProps.categoryResponses.every(
              (resp: any, idx: number) =>
                resp.id === nextProps.categoryResponses[idx]?.id
            ) &&
            prevProps.isDragging === nextProps.isDragging;

          return shouldNotRerender;
        }
      ),
    [scrollHelpers, DraggableResponse, removeResponseFromCategory]
  );

  // DragOverlay Component - this will follow the cursor
  const DragPreview = useMemo(
    () =>
      React.memo(({ item }: { item: any }) => {
        if (!item) return null;
        return (
          <div
            className={`bg-white rounded-lg px-4 py-3 sm:px-5 sm:py-4 shadow-2xl border-2 border-blue-400 flex items-center justify-center gap-2 opacity-95 transform rotate-1 scale-105 pointer-events-none z-50 w-fit min-w-[100px] sm:min-w-[120px] max-w-[200px] ${item.media && (item.media.url || item.media.file)
              ? "h-16 sm:h-20"
              : "h-10 sm:h-12"
              } text-center`}
            style={{
              transform: "translate3d(0, 0, 0)",
              willChange: "transform",
              backfaceVisibility: "hidden",
            }}
          >
            {item.media && (item.media.url || item.media.file) ? (
              item.media.type === "audio" || item.media.type === "video" ? (
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-1 sm:p-2 bg-blue-50 rounded-lg border border-blue-200 w-full max-w-[160px] sm:max-w-[200px] overflow-hidden">
                  <MediaDisplay
                    media={item.media}
                    alt={item.text || "Response media"}
                    className="w-full"
                  />
                </div>
              ) : (
                <MediaDisplay
                  media={item.media}
                  alt={item.text || "Response image"}
                  className="object-contain w-16 h-16 sm:w-20 sm:h-20 rounded"
                />
              )
            ) : null}
            {item.text && (
              <span className="text-[#32428D] font-medium text-center leading-tight">
                <LatexText value={processTextForLatex(item.text)} inline />
              </span>
            )}
          </div>
        );
      }),
    []
  );

  // Extract question instructions and content
  const instructions = question?.metadata?.instructions;
  const contentText = question?.content?.text;
  const media =
    question?.content?.media &&
      (question?.content?.media.url || question?.content?.media.file)
      ? question.content.media
      : null;

  const mediasWithImage = question.content.medias?.find((media: QuestionMedia) => media.type === "image")

  // Hàm render đáp án đúng với UI giống hệt UI thao tác
  function renderCorrectAnswer() {
    if (!correctAnswer || !correctAnswer.list) return null;
    // Map: answerId -> categoryId
    const answerToCategory: Record<string, string> = correctAnswer.list;
    // Map: categoryId -> list of item objects
    const categoryToItems: Record<string, any[]> = {};
    (question.options.items || []).forEach((item: any) => {
      const catId = answerToCategory[item.id];
      if (!catId) return;
      if (!categoryToItems[catId]) categoryToItems[catId] = [];
      categoryToItems[catId].push(item);
    });
    return (
      <div className="h-full w-full flex flex-col items-center md:justify-start landscape:justify-center">
        <div className={`mb-4 sm:mb-6 text-center flex flex-col items-center mx-auto px-2 sm:px-4
            ${question.content.medias && question.content.medias.length > 1 ? "w-full" : ""}
          `}>
          {contentText && (
            <div className={`text-[#32428D] font-medium leading-relaxed text-center ${isMobile ? "text-sm sm:text-base" : "text-base lg:text-lg xl:text-xl 2xl:text-2xl"}`}>
              <TiptapMathViewer
                value={contentText.split("\n").join("<br />")}
                isHtml
              />
            </div>
          )}
          {question.content.medias && question.content.medias.length > 1 ?
            <div className={`w-full flex flex-1 gap-6 flex-wrap justify-center items-center my-5 sm:px-8 ${mediasWithImage ? "sm:flex-nowrap" : ""}`}>
              {question.content.medias.map((media: QuestionMedia, index: number) => {
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
              })
            }
          </div>
          : media && (
            <div className="mb-3 sm:mb-4 max-w-sm sm:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto">
              <MediaDisplay
                media={media}
                className="bg-white shadow-lg rounded-2xl border border-gray-200"
              />
            </div>
          )}
        </div>
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 flex flex-col items-center">
          <div className="w-full bg-white shadow-lg rounded-xl p-2 sm:p-4 lg:p-6 border border-gray-200 h-auto min-h-full">
            <div className="flex flex-col justify-center items-center gap-4 sm:gap-5 md:gap-6 h-full min-h-0">
              {/* Categories Section - Center */}
              <div className="w-full h-auto flex-shrink-0 flex justify-center">
                <div className="flex flex-wrap justify-center items-start gap-1 sm:gap-2 lg:gap-3 h-full w-full md:overflow-hidden landscape:overflow-x-auto">
                  {categories.map((cat: any, idx: number) => {
                    // Accent color logic giống DroppableCategory
                    const accentColors = [
                      "bg-green-400",
                      "bg-blue-400",
                      "bg-purple-400",
                      "bg-pink-400",
                      "bg-yellow-400",
                      "bg-red-400",
                      "bg-indigo-400",
                      "bg-teal-400",
                    ];
                    const colorIndex = idx % accentColors.length;
                    const accentColor = accentColors[colorIndex];

                    // Calculate dynamic width for each category
                    const isFiveCategories = categories.length === 5;
                    const minWidth = isFiveCategories
                      ? "min-w-[100px] sm:min-w-[120px] md:min-w-[140px]"
                      : "min-w-[120px] sm:min-w-[140px] md:min-w-[160px]";
                    const maxWidth = isFiveCategories
                      ? "max-w-[120px] sm:max-w-[150px] md:max-w-[170px]"
                      : "max-w-[140px] sm:max-w-[180px] md:max-w-[220px]";

                    return (
                      <div
                        key={cat.id}
                        className={`flex flex-col flex-1 ${minWidth} ${maxWidth} h-full max-h-[400px] sm:max-h-[450px] md:max-h-[500px] lg:max-h-[550px] xl:max-h-[580px] 2xl:max-h-[620px] relative rounded-xl shadow-lg bg-white border border-gray-200`}
                      >
                        {/* Header giống hệt */}
                        <div
                          className={`w-full bg-white rounded-t-xl p-3 sm:p-4 relative flex-shrink-0`}
                        >
                          <div className="text-center">
                            {cat.media && (cat.media.url || cat.media.file) ? (
                              <div className="flex flex-col items-center gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 rounded-lg bg-gray-50">
                                  {cat.media.type === "audio" ||
                                    cat.media.type === "video" ? (
                                    <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-1 sm:p-2 bg-blue-50 rounded-lg border border-blue-200 w-full max-w-[280px] sm:max-w-[320px] overflow-hidden">
                                      <MediaDisplay
                                        media={cat.media}
                                        alt={cat.text || "Category media"}
                                        className="w-full"
                                      />
                                    </div>
                                  ) : (
                                    <MediaDisplay
                                      media={cat.media}
                                      alt={cat.text || "Category image"}
                                      className="object-contain pointer-events-none w-32 h-32 sm:w-36 sm:h-36 rounded-lg"
                                    />
                                  )}
                                </div>
                                {cat.text && (
                                  <div className="flex flex-col items-center gap-1 sm:gap-2">
                                    <h3 className="text-[#32428D] text-md sm:text-base font-bold tracking-wide uppercase select-none pointer-events-none text-center">
                                      <LatexText
                                        value={processTextForLatex(cat.text)}
                                        inline
                                      />
                                    </h3>
                                    <div
                                      className={`w-8 sm:w-12 h-0.5 sm:h-1 ${accentColor} rounded-full`}
                                    ></div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              cat.text && (
                                <div className="flex flex-col items-center gap-1 sm:gap-2">
                                  <h3 className="text-[#32428D] text-md sm:text-base font-bold tracking-wide uppercase select-none pointer-events-none py-1 text-center">
                                    <LatexText
                                      value={processTextForLatex(cat.text)}
                                      inline
                                    />
                                  </h3>
                                  <div
                                    className={`w-8 sm:w-12 h-0.5 sm:h-1 ${accentColor} rounded-full`}
                                  ></div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                        {/* Content giống hệt */}
                        <div className="flex-1 w-full flex flex-col items-center justify-start p-3 sm:p-5 pt-2 sm:pt-4 bg-white rounded-b-xl overflow-y-auto">
                          <div className="w-full space-y-2 sm:space-y-3 relative flex-1">
                            {(categoryToItems[cat.id] || []).map((item, i) => (
                              <div
                                key={item.id}
                                className="flex justify-center items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-green-100 rounded-lg border border-green transition-colors"
                                style={{ pointerEvents: "auto" }}
                              >
                                {item.media &&
                                  (item.media.url || item.media.file) ? (
                                  item.media.type === "audio" ||
                                    item.media.type === "video" ? (
                                    <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-1 sm:p-2 bg-blue-50 rounded-lg border border-blue-200 w-full max-w-[160px] sm:max-w-[200px] overflow-hidden">
                                      <MediaDisplay
                                        media={item.media}
                                        alt={item.text || "Response media"}
                                        className="w-full"
                                      />
                                    </div>
                                  ) : (
                                    <MediaDisplay
                                      media={item.media}
                                      alt={item.text || "Response image"}
                                      className="object-contain pointer-events-none w-16 h-16 sm:w-20 sm:h-20 rounded"
                                    />
                                  )
                                ) : null}
                                {item.text && (
                                  <span className="text-[#32428D] font-medium text-center pointer-events-none text-sm leading-tight">
                                    <LatexText
                                      value={processTextForLatex(item.text)}
                                      inline
                                    />
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Không render Unassigned Responses Section */}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (correctAnswer && correctAnswer.list) {
    return renderCorrectAnswer();
  }

  return (
    <>
      {question.content.medias && question.content.medias.length > 1 ?
        <div className="flex flex-col w-full">
          {contentText && (
            <div className={`text-[#32428D] mb-5 font-medium leading-relaxed text-center ${isMobile ? "text-sm sm:text-base" : "text-lg sm:text-xl lg:text-2xl"}`}>
              <TiptapMathViewer
                value={contentText.split("\n").join("<br />")}
                isHtml
              />
            </div>
          )}
          <div className={`flex flex-1 gap-6 flex-wrap justify-center items-center mb-5 sm:px-8 ${mediasWithImage ? "sm:flex-nowrap" : ""}`}>
            {question.content.medias.map((media: QuestionMedia, index: number) => {
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
            collisionDetection={customCollisionDetection}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
          >
            <div
              className={`h-full w-full flex flex-col items-center ${isPopupMode
                ? ""
                : "md:justify-start landscape:justify-center"
                } min-w-0`}
            >
              {/* Question Text & Media */}
              <div
                className={`text-center flex flex-col items-center w-full max-w-4xl mx-auto px-2 sm:px-4 flex-shrink-0 ${isPopupMode ? "mb-2 sm:mb-4" : "mb-4 sm:mb-6"
                  }`}
              >
              </div>
              {/* Main Content Area - Takes remaining height */}
              <div className="w-full mx-auto px-2 sm:px-4 flex flex-col items-center min-w-0 flex-1 min-h-0">
                <div
                  className={`w-full bg-white shadow-lg rounded-xl border border-gray-200 min-w-0 flex flex-col h-full ${isPopupMode ? "p-2 sm:p-4" : "p-2 sm:p-4 lg:p-6"
                    }`}
                >
                  {/* Header trên mobile - Hiển thị trên đầu area */}
                  {isMobile && (
                    <div className="w-full flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-3 flex-shrink-0 text-center justify-center">
                      <div className="flex items-center gap-2 justify-center">
                        <h3 className="text-[#32428D] text-sm sm:text-base lg:text-lg font-semibold">
                          Các lựa chọn
                        </h3>
                        {getUnassignedResponses.length > 0 && (
                          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                            {getUnassignedResponses.length}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-md sm:text-base">
                        Di chuyển chuột vào khoảng trống để kéo thả đáp án
                      </p>
                    </div>
                  )}

                  <div
                    className={`flex justify-start items-center min-h-0 flex-1 
                      ${isPopupMode ? "gap-2 sm:gap-3" : "gap-3 sm:gap-4 md:gap-5"}
                      ${isMobile ? "flex-row-reverse" : "flex-col"}
                    `}
                  >
                    {/* Categories Section - Flexible height */}
                    <div
                      className={`flex-shrink-0 flex justify-center items-start ${isMobile ? "w-1/2" : "w-full"
                        }`}
                    >
                      <div
                        className={`flex flex-wrap justify-center items-start ${isPopupMode ? "gap-2 sm:gap-3" : "gap-2 sm:gap-3 md:gap-4"
                          }`}
                      >
                        {categoriesWithResponses.map((categoryWithResponses: any) => {
                          return (
                            <DroppableCategory
                              key={categoryWithResponses.id}
                              category={{
                                id: categoryWithResponses.id,
                                text: categoryWithResponses.text,
                                media: categoryWithResponses.media,
                              }}
                              index={categoryWithResponses.index}
                              categoryResponses={
                                categoryWithResponses.categoryResponses
                              }
                              isDragging={isDragging}
                              widthClass="w-auto flex-1 min-w-[160px] sm:min-w-[200px] max-w-[280px] sm:max-w-[300px]"
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Unassigned Responses Section - Takes remaining space */}
                    <div
                      className={`flex-1 min-h-0 flex flex-col ${isMobile ? "w-1/2" : "w-full"
                        }`}
                    >
                      <DroppableUnassigned
                        unassignedResponses={getUnassignedResponses}
                        isDragging={isDragging}
                      />
                    </div>
                  </div>
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
                      willChange: "transform",
                    }}
                    dropAnimation={{
                      duration: 180,
                      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  >
                    {activeId && activeItem ? (
                      <DragPreview item={activeItem} />
                    ) : null}
                  </DragOverlay>,
                  document.getElementById("drag-overlay-portal") || document.body
                )}
              </>
            )}
          </DndContext>
        </div> 
        :
        <>
        <DndContext
          sensors={sensors}
          collisionDetection={customCollisionDetection}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
        >
          <div
            className={`h-full w-full flex flex-col items-center ${isPopupMode
              ? ""
              : "md:justify-start landscape:justify-center"
              } min-w-0`}
          >
            {/* Question Text & Media */}
            <div
              className={`text-center flex flex-col items-center w-full max-w-4xl mx-auto px-2 sm:px-4 flex-shrink-0 ${isPopupMode ? "mb-2 sm:mb-4" : "mb-4 sm:mb-6"
                }`}
            >
              {contentText && (
                <div className={`text-[#32428D] font-medium leading-relaxed text-center ${isMobile ? "text-sm sm:text-base" : "text-lg sm:text-xl lg:text-2xl"}`}>
                  <TiptapMathViewer
                    value={contentText.split("\n").join("<br />")}
                    isHtml
                  />
                </div>
              )}
              {media && (
                <div className="mb-3 sm:mb-4 max-w-sm sm:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto">
                  <MediaDisplay
                    media={media}
                    className="bg-white shadow-lg rounded-2xl border border-gray-200"
                  />
                </div>
              )}
            </div>

            {/* Main Content Area - Takes remaining height */}
            <div className="w-full mx-auto px-2 sm:px-4 flex flex-col items-center min-w-0 flex-1 min-h-0">
              <div
                className={`w-full bg-white shadow-lg rounded-xl border border-gray-200 min-w-0 flex flex-col h-full ${isPopupMode ? "p-2 sm:p-4" : "p-2 sm:p-4 lg:p-6"
                  }`}
              >
                {/* Header trên mobile - Hiển thị trên đầu area */}
                {isMobile && (
                  <div className="w-full flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-3 flex-shrink-0 text-center justify-center">
                    <div className="flex items-center gap-2 justify-center">
                      <h3 className="text-[#32428D] text-sm sm:text-base lg:text-lg font-semibold">
                        Các lựa chọn
                      </h3>
                      {getUnassignedResponses.length > 0 && (
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                          {getUnassignedResponses.length}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-md sm:text-base">
                      Di chuyển chuột vào khoảng trống để kéo thả đáp án
                    </p>
                  </div>
                )}

                <div
                  className={`flex justify-start items-center min-h-0 flex-1 
                    ${isPopupMode ? "gap-2 sm:gap-3" : "gap-3 sm:gap-4 md:gap-5"}
                    ${isMobile ? "flex-row-reverse" : "flex-col"}
                  `}
                >
                  {/* Categories Section - Flexible height */}
                  <div
                    className={`flex-shrink-0 flex justify-center items-start ${isMobile ? "w-1/2" : "w-full"
                      }`}
                  >
                    <div
                      className={`flex flex-wrap justify-center items-start ${isPopupMode ? "gap-2 sm:gap-3" : "gap-2 sm:gap-3 md:gap-4"
                        }`}
                    >
                      {categoriesWithResponses.map((categoryWithResponses: any) => {
                        return (
                          <DroppableCategory
                            key={categoryWithResponses.id}
                            category={{
                              id: categoryWithResponses.id,
                              text: categoryWithResponses.text,
                              media: categoryWithResponses.media,
                            }}
                            index={categoryWithResponses.index}
                            categoryResponses={
                              categoryWithResponses.categoryResponses
                            }
                            isDragging={isDragging}
                            widthClass="w-auto flex-1 min-w-[160px] sm:min-w-[200px] max-w-[280px] sm:max-w-[300px]"
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Unassigned Responses Section - Takes remaining space */}
                  <div
                    className={`flex-1 min-h-0 flex flex-col ${isMobile ? "w-1/2" : "w-full"
                      }`}
                  >
                    <DroppableUnassigned
                      unassignedResponses={getUnassignedResponses}
                      isDragging={isDragging}
                    />
                  </div>
                </div>
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
                    willChange: "transform",
                  }}
                  dropAnimation={{
                    duration: 180,
                    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  {activeId && activeItem ? (
                    <DragPreview item={activeItem} />
                  ) : null}
                </DragOverlay>,
                document.getElementById("drag-overlay-portal") || document.body
              )}
            </>
          )}
        </DndContext>
        </>
      }
    </>
  );
}
