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

import { MediaDisplay } from "../media-display";
import { TiptapMathViewer } from "@/components/question-editor/tiptap-math-viewer";

interface CategoryQuestionProps {
  question: any;
  userAnswer: any;
  onAnswerUpdate: (answer: any) => void;
  isSubmitted: boolean;
  onCheck?: () => void;
  onSkip?: () => void;
  onFeedback?: (state: "correct" | "incorrect") => void;
  correctAnswer?: any;
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
}: CategoryQuestionProps) {
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

  // dnd-kit sensors - improved for both mouse and touch
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
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

  // dnd-kit: handle drag start
  const handleDragStart = useCallback(
    (event: any) => {
      const draggedId = event.active.id;
      setActiveId(draggedId);
      setIsDragging(true); // Start drag state

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
      const style = {
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        opacity: isDragging ? 0.3 : 1, // Make original item more transparent when dragging
        touchAction: "none",
        cursor: isDragging ? "grabbing" : "grab",
      };
      const handleClick = () => {
        if (isAssigned && categoryId) {
          removeResponseFromCategory(response.id, categoryId);
        }
      };
      return (
        <motion.div
          ref={setNodeRef}
          style={style}
          className={`${
            isAssigned
              ? "bg-transparent border-none shadow-none mb-0 p-0"
              : "bg-white rounded-full px-6 py-3 shadow-md mb-2 border border-gray-200"
          } ${
            isDragging ? "shadow-2xl scale-105" : ""
          } flex items-center justify-center gap-2 select-none w-fit min-w-[120px] sm:min-w-[140px] max-w-[300px] relative ${
            isAssigned ? "pointer-events-none z-0" : "pointer-events-auto z-10"
          }`}
          whileHover={{ scale: isDragging ? 1.05 : 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Clickable overlay for interaction - only for assigned items */}
          {isAssigned && (
            <div
              className="absolute inset-0 cursor-pointer z-20"
              style={{ pointerEvents: isDragging ? "none" : "auto" }}
              {...attributes}
              {...listeners}
              onClick={handleClick}
            />
          )}

          {/* For unassigned items, apply listeners directly */}
          {!isAssigned && (
            <div
              className="absolute inset-0 cursor-grab z-20"
              {...attributes}
              {...listeners}
            />
          )}

          {response.media && (response.media.url || response.media.file) ? (
            response.media.type === "audio" ||
            response.media.type === "video" ? (
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-1 bg-blue-50 rounded-lg border border-blue-200 min-w-[100px] sm:min-w-[120px]">
                <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
                <MediaDisplay
                  media={response.media}
                  alt={response.text || "Response media"}
                  className="h-4 w-16 sm:h-5 sm:w-20 min-w-[64px] sm:min-w-[80px]"
                />
              </div>
            ) : (
              <MediaDisplay
                media={response.media}
                alt={response.text || "Response image"}
                className="object-contain pointer-events-none w-10 h-10"
              />
            )
          ) : null}
          {response.text && (
            <span className="text-[#32428D] font-medium text-center pointer-events-none text-sm leading-tight">
              <LatexText value={processTextForLatex(response.text)} inline />
            </span>
          )}
        </motion.div>
      );
    },
    [removeResponseFromCategory]
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
              <h3 className="text-[#32428D] text-sm sm:text-base lg:text-lg font-semibold mb-2 sm:mb-3 lg:mb-4 flex-shrink-0">
                Các lựa chọn
              </h3>
              <div
                ref={(node) => {
                  setNodeRef(node);
                  scrollRef.current = node;
                }}
                className={`w-full overflow-y-auto flex-1 max-h-[250px] sm:max-h-[300px] md:max-h-[350px] lg:max-h-[400px] xl:max-h-[430px] 2xl:max-h-[460px] pr-1 sm:pr-2 p-2 sm:p-3 lg:p-4 rounded-lg scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent min-w-[140px] sm:min-w-[160px] lg:min-w-[180px] ${
                  isOver
                    ? "bg-blue-50 border-2 border-blue-300 border-dashed"
                    : "border-2 border-transparent"
                }`}
                style={{
                  scrollBehavior: "auto",
                  overscrollBehavior: "contain",
                  contain: "layout style paint",
                }}
              >
                <div
                  className="flex flex-col items-center space-y-1 sm:space-y-2 lg:space-y-3"
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
    [scrollHelpers, DraggableResponse]
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
              className={`flex flex-col flex-1 ${
                widthClass ||
                "min-w-[160px] sm:min-w-[200px] max-w-[200px] sm:max-w-[280px]"
              } h-full max-h-[300px] sm:max-h-[350px] md:max-h-[400px] lg:max-h-[450px] xl:max-h-[480px] 2xl:max-h-[520px] relative rounded-xl ${
                isOver
                  ? `shadow-2xl scale-105 bg-white border border-gray-300`
                  : `shadow-lg bg-white border border-gray-200`
              } transition-all duration-300 ease-in-out`}
            >
              {/* Category Header - Clean minimal design */}
              <div
                className={`w-full bg-white rounded-t-xl p-2 sm:p-3 lg:p-4 relative flex-shrink-0 ${
                  isOver ? `bg-gray-50` : ""
                } transition-all duration-300`}
              >
                <div className="text-center">
                  {category.media &&
                  (category.media.url || category.media.file) ? (
                    <div className="flex flex-col items-center gap-1 sm:gap-2 lg:gap-3">
                      <div className="p-1 sm:p-1.5 lg:p-2 rounded-lg bg-gray-50">
                        {category.media.type === "audio" ||
                        category.media.type === "video" ? (
                          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-1 sm:p-2 bg-blue-50 rounded-lg border border-blue-200 min-w-[120px] sm:min-w-[140px]">
                            <MediaDisplay
                              media={category.media}
                              alt={category.text || "Category media"}
                              className="h-5 w-20 sm:h-6 sm:w-24 lg:h-8 lg:w-28 min-w-[80px] sm:min-w-[96px] lg:min-w-[112px]"
                            />
                          </div>
                        ) : (
                          <MediaDisplay
                            media={category.media}
                            alt={category.text || "Category image"}
                            className="object-contain pointer-events-none w-8 h-8 sm:w-10 sm:h-10"
                          />
                        )}
                      </div>
                      {category.text && (
                        <div className="flex flex-col items-center gap-1 sm:gap-2">
                          <h3 className="text-gray-800 text-xs sm:text-sm font-semibold tracking-wide uppercase select-none pointer-events-none text-center">
                            <LatexText
                              value={processTextForLatex(category.text)}
                              inline
                            />
                          </h3>
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
                        <h3 className="text-gray-800 text-xs sm:text-sm font-semibold tracking-wide uppercase select-none pointer-events-none py-1 text-center">
                          <LatexText
                            value={processTextForLatex(category.text)}
                            inline
                          />
                        </h3>
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
                className="flex-1 w-full flex flex-col items-center justify-start p-2 sm:p-3 lg:p-5 pt-1 sm:pt-2 lg:pt-4 bg-white rounded-b-xl overflow-y-auto"
                style={{
                  contain: "layout style paint",
                  scrollBehavior: "auto",
                  overscrollBehavior: "contain",
                }}
                ref={scrollRef}
              >
                {/* Connected responses */}
                <div
                  className="w-full space-y-1 sm:space-y-2 lg:space-y-3 relative flex-1"
                  style={{
                    pointerEvents: "none",
                    minHeight: "max-content",
                  }}
                >
                  {categoryResponses.map((response: any, idx: number) => (
                    <div
                      key={`${category.id}-${response.id}`}
                      className="flex justify-center items-center gap-1 sm:gap-2 lg:gap-3 p-1 sm:p-2 lg:p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      style={{ pointerEvents: "auto" }}
                    >
                      <div
                        className={`w-1 h-1 sm:w-1.5 sm:h-1.5 lg:w-2 lg:h-2 rounded-full ${accentColor}`}
                      ></div>
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
    [scrollHelpers, DraggableResponse]
  );

  // DragOverlay Component - this will follow the cursor
  const DragPreview = useMemo(
    () =>
      React.memo(({ item }: { item: any }) => {
        if (!item) return null;
        return (
          <div className="bg-white rounded-full px-6 py-3 shadow-2xl border-2 border-blue-400 flex items-center justify-center gap-2 opacity-95 transform rotate-2 scale-110 pointer-events-none z-50 w-fit min-w-[80px] max-w-[300px]">
            {item.media && (item.media.url || item.media.file) ? (
              item.media.type === "audio" || item.media.type === "video" ? (
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-1 bg-blue-50 rounded-lg border border-blue-200 min-w-[100px] sm:min-w-[120px]">
                  <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                  <MediaDisplay
                    media={item.media}
                    alt={item.text || "Response media"}
                    className="h-5 w-16 sm:h-6 sm:w-20 min-w-[64px] sm:min-w-[80px]"
                  />
                </div>
              ) : (
                <MediaDisplay
                  media={item.media}
                  alt={item.text || "Response image"}
                  className="object-contain w-10 h-10"
                />
              )
            ) : null}
            {item.text && (
              <span className="text-[#32428D] font-medium text-center whitespace-nowrap text-sm leading-tight">
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
      <div className="h-full w-full flex flex-col items-center justify-center -mt-8 sm:-mt-12 md:-mt-16">
        <div className="mb-4 sm:mb-6 text-center flex flex-col items-center max-w-4xl mx-auto px-2 sm:px-4">
          {contentText && (
            <div className="text-[#32428D] font-medium leading-relaxed text-center text-base sm:text-lg lg:text-xl xl:text-2xl mb-3 sm:mb-4">
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
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 flex flex-col items-center">
          <div className="w-full bg-white shadow-lg rounded-xl p-2 sm:p-4 lg:p-6 border border-gray-200 h-[400px] sm:h-[450px] md:h-[500px] lg:h-[550px] xl:h-[580px] 2xl:h-[620px]">
            <div className="flex flex-col lg:flex-row justify-center items-start gap-2 sm:gap-3 lg:gap-4 h-full min-h-0">
              {/* Categories Section - Center */}
              <div className="lg:w-4/5 w-full h-full flex-shrink-0 flex justify-center">
                <div className="flex flex-wrap lg:flex-nowrap justify-center items-start gap-1 sm:gap-2 lg:gap-3 h-full w-full max-w-5xl overflow-x-auto">
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
                      ? "min-w-[140px] sm:min-w-[160px]"
                      : "min-w-[160px] sm:min-w-[200px]";
                    const maxWidth = isFiveCategories
                      ? "max-w-[160px] sm:max-w-[200px]"
                      : "max-w-[200px] sm:max-w-[280px]";

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
                                    <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-1 sm:p-2 bg-blue-50 rounded-lg border border-blue-200 min-w-[120px] sm:min-w-[140px]">
                                      <MediaDisplay
                                        media={cat.media}
                                        alt={cat.text || "Category media"}
                                        className="h-5 w-20 sm:h-6 sm:w-24 lg:h-8 lg:w-28 min-w-[80px] sm:min-w-[96px] lg:min-w-[112px]"
                                      />
                                    </div>
                                  ) : (
                                    <MediaDisplay
                                      media={cat.media}
                                      alt={cat.text || "Category image"}
                                      className="object-contain pointer-events-none sm:w-10 sm:h-10"
                                    />
                                  )}
                                </div>
                                {cat.text && (
                                  <div className="flex flex-col items-center gap-1 sm:gap-2">
                                    <h3 className="text-gray-800 text-xs sm:text-sm font-semibold tracking-wide uppercase select-none pointer-events-none text-center">
                                      {cat.text}
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
                                  <h3 className="text-gray-800 text-xs sm:text-sm font-semibold tracking-wide uppercase select-none pointer-events-none py-1 text-center">
                                    {cat.text}
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
                                <div
                                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${accentColor}`}
                                ></div>
                                <span className="text-[#32428D] font-medium text-center pointer-events-none text-sm leading-tight">
                                  {item.text}
                                </span>
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
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    >
      <div className="h-full w-full flex flex-col items-center justify-center -mt-8 sm:-mt-12 md:-mt-16">
        {/* Question Text & Media */}
        <div className="mb-4 sm:mb-6 text-center flex flex-col items-center max-w-4xl mx-auto px-2 sm:px-4">
          {contentText && (
            <div className="text-[#32428D] font-medium leading-relaxed text-center text-base sm:text-lg lg:text-xl xl:text-2xl mb-3 sm:mb-4">
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

        {/* Main Content Area - Centered */}
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 flex flex-col items-center">
          <div className="w-full bg-white shadow-lg rounded-xl p-2 sm:p-4 lg:p-6 border border-gray-200 h-[400px] sm:h-[450px] md:h-[500px] lg:h-[550px] xl:h-[580px] 2xl:h-[620px]">
            <div className="flex flex-col lg:flex-row justify-center items-start gap-2 sm:gap-3 lg:gap-4 h-full min-h-0">
              {/* Categories Section - Center */}
              <div className="lg:w-4/5 w-full h-full flex-shrink-0 flex justify-center">
                <div className="flex flex-wrap lg:flex-nowrap justify-center items-start gap-1 sm:gap-2 lg:gap-3 h-full w-full max-w-5xl overflow-x-auto">
                  {categoriesWithResponses.map((categoryWithResponses: any) => {
                    // Calculate dynamic width for each category
                    const isFiveCategories =
                      categoriesWithResponses.length === 5;
                    const minWidth = isFiveCategories
                      ? "min-w-[140px] sm:min-w-[160px]"
                      : "min-w-[160px] sm:min-w-[200px]";
                    const maxWidth = isFiveCategories
                      ? "max-w-[160px] sm:max-w-[200px]"
                      : "max-w-[200px] sm:max-w-[280px]";
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
                        widthClass={`${minWidth} ${maxWidth}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Unassigned Responses Section - Right */}
              <div className="lg:w-1/5 w-full h-full flex-shrink-0">
                <DroppableUnassigned
                  unassignedResponses={getUnassignedResponses}
                  isDragging={isDragging}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drag Overlay - this follows the cursor */}
      <DragOverlay
        dropAnimation={{
          duration: 300,
          easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
        }}
      >
        {activeId && activeItem ? <DragPreview item={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
