"use client";

import { useState, useEffect, useRef } from "react";
import type { QuestionType } from "@/lib/api/questions";
import { TiptapMathViewer } from "@/components/question-editor/tiptap-math-viewer";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useDraggable,
  DragOverlay,
  rectIntersection,
} from "@dnd-kit/core";
import Image from "next/image";

interface LabelingQuestionProps {
  question: QuestionType;
  userAnswer?: {
    placements: Record<string, string>;
    isAnswered: boolean;
  };
  onAnswerUpdate: (answer: any) => void;
  isSubmitted: boolean;
  correctAnswer?: any;
}

export function LabelingQuestion({
  question,
  userAnswer,
  onAnswerUpdate,
  isSubmitted,
  correctAnswer,
}: LabelingQuestionProps) {
  const blanks = question.options?.blanks || [];
  const labels = question.options?.labels || [];
  const image = question.content?.media?.url;

  // Nếu có đáp án đúng, chỉ render đáp án đúng với UI blank giống khi làm bài
  if (correctAnswer && correctAnswer.list) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <div className="w-full max-w-7xl mx-auto px-4 flex flex-col items-center max-h-[80vh] overflow-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-blue-50 rounded-xl">
          {/* Instructions */}
          <div className="text-center mb-6 max-w-4xl mx-auto">
            <div className="text-[#32428D] font-medium leading-relaxed text-center text-lg sm:text-xl lg:text-2xl">
              <TiptapMathViewer
                value={question.content.text.split("\n").join("<br />")}
                isHtml
              />
            </div>
          </div>
          {/* Image with blanks và đáp án đúng (giữ kích thước gốc, cho phép cuộn ngang) */}
          <div className="w-full overflow-x-auto">
            <div
              className="relative flex justify-center items-center bg-black/5 rounded-xl border border-[#60A5FA] shadow-lg"
              style={{ width: 1024, height: 576 }}
            >
              {image ? (
                <Image
                  src={image || "/placeholder.svg"}
                  alt="Labeling question"
                  width={1024}
                  height={576}
                  className="object-contain w-full h-full rounded-xl"
                  style={{ display: "block" }}
                />
              ) : (
                <div className="w-[600px] h-[400px] bg-gray-200 flex items-center justify-center rounded-xl border border-gray-200">
                  <span className="text-gray-500">Image not available</span>
                </div>
              )}
              {/* Render blanks với label đúng, sử dụng lại BlankDropZone */}
              {blanks.map((blank: any) => {
                const labelId = correctAnswer.list[blank.id];
                const label = labels.find((l: any) => l.id === labelId);
                return (
                  <BlankDropZone
                    key={blank.id}
                    blank={blank}
                    label={label}
                    disabled={true}
                    offsetX={blank.coordinates.x}
                    offsetY={blank.coordinates.y}
                    widthPx={blank.coordinates.w}
                    heightPx={blank.coordinates.h}
                    onRemove={() => { }}
                    isDragging={false}
                    canHighlight={false}
                    extraClassName="bg-green-100 border-green-400"
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Shuffle labels when question changes
  const [shuffledLabels, setShuffledLabels] = useState<any[]>([]);
  useEffect(() => {
    // Fisher-Yates shuffle
    const arr = [...labels];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setShuffledLabels(arr);
  }, [question.id]);

  // Ref & state for image and container size
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [realSize, setRealSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });
  const [imageOffset, setImageOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // Update container size and image offset
  useEffect(() => {
    const updateSizeAndOffset = () => {
      if (imgRef.current && containerRef.current) {
        const imgRect = imgRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const width = imgRef.current.clientWidth || realSize.width || 600;
        const height = imgRef.current.clientHeight || realSize.height || 400;
        // Calculate offset of image relative to container
        const offsetX = imgRect.left - containerRect.left;
        const offsetY = imgRect.top - containerRect.top;
        setContainerSize({ width, height });
        setImageOffset({ x: offsetX, y: offsetY });
        console.log("Updated containerSize and offset:", {
          containerSize: { width, height },
          imageOffset: { x: offsetX, y: offsetY },
          realSize,
        });
      }
    };

    updateSizeAndOffset();

    const observer = new ResizeObserver(updateSizeAndOffset);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [realSize]);

  // State for placements
  const [placements, setPlacements] = useState<Record<string, string>>(
    userAnswer?.placements || {}
  );

  // Reset placements khi chuyển câu hỏi
  useEffect(() => {
    setPlacements(userAnswer?.placements || {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  // Đồng bộ state ngay lập tức khi userAnswer thay đổi từ popup
  useEffect(() => {
    if (userAnswer?.placements) {
      setPlacements(userAnswer.placements);
    }
  }, [userAnswer]);

  useEffect(() => {
    onAnswerUpdate({
      placements,
      isAnswered: Object.keys(placements).length > 0,
    });
  }, [placements, onAnswerUpdate]);

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
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [canHighlight, setCanHighlight] = useState(false);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveId(null);
    setIsDragging(false);
    setCanHighlight(false);
    if (over && over.id && active.id) {
      setPlacements((prev) => ({
        ...prev,
        [over.id]: active.id,
      }));
    }
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
    setIsDragging(true);
    setCanHighlight(false);
    // Delay nhỏ để tránh highlight ngay lập tức
    setTimeout(() => {
      setCanHighlight(true);
    }, 150);
  };

  // Hàm remove nhãn ra khỏi blank
  const handleRemoveLabel = (blankId: string) => {
    if (isSubmitted) return; // Prevent removal if submitted
    setPlacements((prev) => {
      const newPlacements = { ...prev };
      delete newPlacements[blankId];
      return newPlacements;
    });
  };

  // Unused labels
  const usedLabelIds = Object.values(placements);
  const unplacedLabels = shuffledLabels.filter(
    (l: any) => !usedLabelIds.includes(l.id)
  );

  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      <div className="w-full max-w-7xl mx-auto px-4 flex flex-col items-center max-h-[80vh] overflow-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-blue-50 rounded-xl">
        {/* Instructions */}
        <div className="text-center mb-6 max-w-4xl mx-auto">
          <div className="text-[#32428D] font-medium leading-relaxed text-center text-lg lg:text-xl xl:text-2xl">
            <TiptapMathViewer
              value={question.content.text.split("\n").join("<br />")}
              isHtml
            />
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          autoScroll
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
        >
          <div className="flex flex-col xl:flex-row gap-8 w-full xl:items-start xl:justify-between overflow-x-auto">
            {/* Image with blanks */}
            <div
              ref={containerRef}
              className="relative flex justify-center items-center bg-black/5 rounded-xl border border-[#60A5FA] shadow-lg w-full aspect-[16/9] xl:flex-1 xl:max-w-none xl:min-w-0"
            >
              {image ? (
                <Image
                  ref={imgRef}
                  src={image || "/placeholder.svg"}
                  alt="Labeling question"
                  fill
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  className="object-contain w-full h-full rounded-xl"
                  style={{ display: "block" }}
                />
              ) : (
                <div className="w-[600px] h-[400px] bg-gray-200 flex items-center justify-center rounded-xl border border-gray-200">
                  <span className="text-gray-500">Image not available</span>
                </div>
              )}
              {/* Render blanks - scale theo kích thước ảnh hiển thị và cộng offset */}
              {blanks.map((blank: any) => {
                const naturalW = question.image_width || 1024;
                const naturalH = question.image_height || 576;
                const scaleX = containerSize.width / naturalW || 1;
                const scaleY = containerSize.height / naturalH || 1;
                const leftPx = Math.round(
                  imageOffset.x + blank.coordinates.x * scaleX
                );
                const topPx = Math.round(
                  imageOffset.y + blank.coordinates.y * scaleY
                );
                const widthPx = Math.round(blank.coordinates.w * scaleX);
                const heightPx = Math.round(blank.coordinates.h * scaleY);

                return (
                  <BlankDropZone
                    key={blank.id}
                    blank={blank}
                    label={labels.find(
                      (l: any) => l.id === placements[blank.id]
                    )}
                    disabled={isSubmitted}
                    offsetX={leftPx}
                    offsetY={topPx}
                    widthPx={widthPx}
                    heightPx={heightPx}
                    onRemove={() => handleRemoveLabel(blank.id)}
                    isDragging={isDragging}
                    canHighlight={canHighlight}
                  />
                );
              })}
            </div>
            {/* Choices */}
            <div className="flex flex-col items-center w-full xl:w-56 xl:flex-shrink-0">
              <h3 className="text-[#32428D] text-lg font-semibold mb-4">
                Danh sách nhãn
              </h3>
              <div className="w-full flex flex-col items-center space-y-3">
                {unplacedLabels.map((label: any) => (
                  <LabelDraggable
                    key={label.id}
                    label={label}
                    disabled={isSubmitted}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* DragOverlay để item đi theo con trỏ chuột */}
          <DragOverlay>
            {activeId ? (
              <div className="bg-white rounded-3xl px-4 py-3 shadow-lg border-2 border-[#60A5FA] text-[#60A5FA] font-medium text-center opacity-90 transform rotate-3 scale-105">
                {labels.find((l: any) => l.id === activeId)?.text ||
                  "Dragging..."}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

function LabelDraggable({
  label,
  disabled,
}: {
  label: any;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: label.id,
    disabled,
  });
  return (
    <div
      ref={setNodeRef}
      onTouchStart={(e) => {
        e.preventDefault();
      }}
      {...attributes}
      {...listeners}
      className={`block bg-blue-50 rounded-3xl px-4 py-3 shadow-md cursor-grab text-[#32428D] font-semibold text-center border-2 border-[#32428D] transition-all whitespace-nowrap my-1 ${isDragging ? "opacity-60" : ""
        } touch-none`}
      style={{
        minWidth: 0,
        width: "fit-content",
        maxWidth: "100%",
        touchAction: "none",
      }}
    >
      {label.text}
    </div>
  );
}

function BlankDropZone({
  blank,
  label,
  disabled,
  offsetX,
  offsetY,
  widthPx,
  heightPx,
  onRemove,
  isDragging,
  canHighlight,
  extraClassName,
}: {
  blank: any;
  label?: any;
  isActive?: boolean;
  disabled?: boolean;
  offsetX: number;
  offsetY: number;
  widthPx?: number;
  heightPx?: number;
  onRemove: () => void;
  isDragging?: boolean;
  canHighlight?: boolean;
  extraClassName?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: blank.id,
    disabled,
  });

  // Đơn giản: chỉ highlight khi đang drag VÀ hover vào vùng này VÀ đã được phép highlight
  const shouldHighlight = isDragging && isOver && canHighlight;

  return (
    <div
      ref={setNodeRef}
      onClick={label ? onRemove : undefined}
      className={`absolute flex items-center justify-center border-2 rounded-3xl transition-colors ${shouldHighlight
        ? "border-[#32428D] bg-green-100/80"
        : "border-[#32428D] bg-blue-50/80"
        } ${label && !disabled ? "cursor-pointer" : ""} ${extraClassName}`}
      style={{
        left: offsetX,
        top: offsetY,
        width: widthPx ?? 153.6,
        height: heightPx ?? 57.6,
        zIndex: 10,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      {label ? (
        <span className="text-[#32428D] font-semibold text-base truncate px-2">
          {label.text}
        </span>
      ) : (
        <span className="text-[#32428D] font-medium text-sm xl:text-base">
          Kéo
        </span>
      )}
    </div>
  );
}
