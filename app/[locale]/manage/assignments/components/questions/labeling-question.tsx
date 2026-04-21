"use client";

import { useState, useEffect, useRef } from "react";
import type { QuestionType } from "@/lib/api/questions";
import { TiptapMathViewer } from "@/components/question-editor/tiptap-math-viewer";
import { LatexText } from "@/components/latex-text";
import { ZoomIn, X } from "lucide-react";
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
import { createPortal } from "react-dom";
import Image from "next/image";
import MobileOrientationGuard from "@/components/MobileOrientationGuard";
import { AudioEffects } from "@/lib/utils/audio-utils";
import { MediaDisplay } from "../media-display";

interface LabelingQuestionProps {
  question: QuestionType;
  userAnswer?: {
    placements: Record<string, string>;
    isAnswered: boolean;
  };
  onAnswerUpdate: (answer: any) => void;
  isSubmitted: boolean;
  correctAnswer?: any;
  isPopupMode?: boolean;
}

// Simple zoom button component for question image
function ZoomableImage({
  imageSrc,
  onZoomChange,
  isMobile,
}: {
  imageSrc: string;
  onZoomChange?: (isZoomed: boolean) => void;
  isMobile?: boolean;
}) {
  const [isZoomed, setIsZoomed] = useState(false);

  // Dispatch event to hide/show floating menus
  useEffect(() => {
    const event = new CustomEvent("imageZoomChange", {
      detail: { isZoomed },
    });
    window.dispatchEvent(event);
    onZoomChange?.(isZoomed);
  }, [isZoomed, onZoomChange]);

  const handleZoomClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsZoomed(true);
    onZoomChange?.(true);
  };

  const handleCloseZoom = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsZoomed(false);
    onZoomChange?.(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleZoomClick}
        className="bg-white/90 backdrop-blur-sm text-gray-700 rounded-lg p-1.5 hover:bg-white hover:scale-110 hover:shadow-lg transition-all duration-300 border border-white/20"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>

      {/* Zoom Modal - render in portal to ensure overlay is always on top */}
      {isZoomed &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] overflow-auto animate-in fade-in-0 duration-300"
            onClick={handleCloseZoom}
            style={{ touchAction: "manipulation" }}
          >
            <div className="relative max-w-4xl max-h-[90vh] p-4 animate-in zoom-in-95 duration-300">
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
              <Image
                src={imageSrc}
                alt="Labeling question - zoomed"
                width={1200}
                height={800}
                className="max-w-full max-h-full object-contain rounded-lg transition-all duration-300 z-5"
                priority
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

export function LabelingQuestion({
  question,
  userAnswer,
  onAnswerUpdate,
  isSubmitted,
  correctAnswer,
  isPopupMode = false,
}: LabelingQuestionProps) {
  const blanks = question.options?.blanks || [];
  const labels = question.options?.labels || [];

  // Lấy media từ medias array hoặc fallback về media cũ
  const getMediaFromQuestion = () => {
    if (question.content?.medias && question.content.medias.length > 0) {
      const imageMedia = question.content.medias.find(
        (m: any) => m.type === "image"
      );
      const audioMedia = question.content.medias.filter(
        (m: any) => m.type === "audio"
      );
      const videoMedia = question.content.medias.filter(
        (m: any) => m.type === "video"
      );

      return {
        image: imageMedia?.url,
        audio: audioMedia,
        video: videoMedia,
      };
    }

    // Fallback về media cũ
    return {
      image:
        question.content?.media?.type === "image"
          ? question.content.media.url
          : undefined,
      audio:
        question.content?.media?.type === "audio"
          ? question.content.media.url
          : undefined,
      video:
        question.content?.media?.type === "video"
          ? question.content.media.url
          : undefined,
    };
  };

  const media = getMediaFromQuestion();
  const image = media.image; // Ảnh cho labeling

  // State to track if image is zoomed (to hide floating menus)
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  // Dispatch event to parent component to hide/show floating menus
  useEffect(() => {
    const event = new CustomEvent("imageZoomChange", {
      detail: { isZoomed: isImageZoomed },
    });
    window.dispatchEvent(event);
  }, [isImageZoomed]);

  // Refs and states for image sizing (shared between both modes)
  const correctAnswerImgRef = useRef<HTMLImageElement>(null);
  const correctAnswerContainerRef = useRef<HTMLDivElement>(null);
  const [correctAnswerRealSize, setCorrectAnswerRealSize] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });
  const [correctAnswerContainerSize, setCorrectAnswerContainerSize] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });
  const [correctAnswerImageOffset, setCorrectAnswerImageOffset] = useState<{
    x: number;
    y: number;
  }>({
    x: 0,
    y: 0,
  });

  // Update container size and image offset for correct answer display
  useEffect(() => {
    if (correctAnswer && correctAnswer.list) {
      const updateCorrectAnswerSizeAndOffset = () => {
        if (correctAnswerImgRef.current && correctAnswerContainerRef.current) {
          const imgRect = correctAnswerImgRef.current.getBoundingClientRect();
          const containerRect =
            correctAnswerContainerRef.current.getBoundingClientRect();
          const width =
            correctAnswerImgRef.current.clientWidth ||
            correctAnswerRealSize.width ||
            600;
          const height =
            correctAnswerImgRef.current.clientHeight ||
            correctAnswerRealSize.height ||
            400;
          const offsetX = imgRect.left - containerRect.left;
          const offsetY = imgRect.top - containerRect.top;
          setCorrectAnswerContainerSize({ width, height });
          setCorrectAnswerImageOffset({ x: offsetX, y: offsetY });
        }
      };

      updateCorrectAnswerSizeAndOffset();

      const observer = new ResizeObserver(updateCorrectAnswerSizeAndOffset);
      if (correctAnswerContainerRef.current) {
        observer.observe(correctAnswerContainerRef.current);
      }

      return () => {
        if (correctAnswerContainerRef.current) {
          observer.unobserve(correctAnswerContainerRef.current);
        }
      };
    }
  }, [correctAnswer, correctAnswerRealSize]);

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

  // Sử dụng useRef để tránh infinite loop
  const onAnswerUpdateRef = useRef(onAnswerUpdate);
  useEffect(() => {
    onAnswerUpdateRef.current = onAnswerUpdate;
  }, [onAnswerUpdate]);

  // Sử dụng useRef để track previous answer và chỉ update khi thực sự thay đổi
  const prevAnswerRef = useRef<any>(null);

  useEffect(() => {
    const currentAnswer = {
      placements,
      isAnswered: Object.keys(placements).length > 0,
    };

    // Chỉ update nếu answer thực sự thay đổi
    if (
      JSON.stringify(prevAnswerRef.current) !== JSON.stringify(currentAnswer)
    ) {
      onAnswerUpdateRef.current(currentAnswer);
      prevAnswerRef.current = currentAnswer;
    }
  }, [placements]);

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

    // Chỉ xử lý khi drag thành công vào một drop zone
    if (over && over.id && active.id) {
      setPlacements((prev) => ({
        ...prev,
        [over.id]: active.id,
      }));
    }

    // Reset states sau khi xử lý placement
    setActiveId(null);
    setIsDragging(false);
    setCanHighlight(false);
  };

  const handleDragCancel = () => {
    // Reset states khi drag bị cancel
    setActiveId(null);
    setIsDragging(false);
    setCanHighlight(false);
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
    <MobileOrientationGuard>
      <div className="h-full w-full flex flex-col items-center md:justify-start landscape:justify-center md:overflow-visible landscape:overflow-hidden">
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 flex flex-col items-center md:h-auto landscape:h-full">
          {/* Instructions */}
          {!isTextContentEmpty(question.content.text) && (
            <div className={`text-center mb-4 max-w-4xl mx-auto flex-shrink-0`}>
              <div
                className={`text-[#32428D] font-medium leading-relaxed text-center ${isMobile
                  ? "text-sm sm:text-base"
                  : "text-base lg:text-lg xl:text-xl 2xl:text-2xl"
                  }`}
              >
                <TiptapMathViewer
                  value={question.content.text.split("\n").join("<br />")}
                  isHtml
                />
              </div>
            </div>
          )}

          {/* Hiển thị audio/video từ medias array - luôn hiển thị nếu có */}
          {(media.audio || media.video) && (
            <div className="text-center mb-4 max-w-4xl mx-auto flex-shrink-0 w-full">
              {media.audio && (
                <div className="mt-4 flex justify-center w-full">
                  <div className={`w-full flex flex-row flex-wrap ${Array.isArray(media.audio) && media.audio.length > 1 ? 'gap-5 sm:px-4' : 'max-w-md'}`}>
                    {Array.isArray(media.audio) && media.audio.length > 1 ?
                      media.audio.map((m, index) => {
                        return (
                          <audio
                            key={m.url + index}
                            controls
                            src={m.url}
                            preload="metadata"
                            className="flex-1 sm:flex-auto"
                          />
                        )
                      })
                    : 
                    Array.isArray(media.audio) && media.audio.length > 0 ? 
                      <MediaDisplay
                      media={{ type: "audio", url: media.audio[0].url}}
                      className="w-full"
                    />
                    :
                    typeof media.audio === 'string' &&
                    <MediaDisplay
                      media={{ type: "audio", url: media.audio}}
                      className="w-full"
                    />}
                  </div>
                </div>
              )}

              {media.video && (
                <div className="mt-4 flex justify-center">
                  <div className="w-full max-w-md">
                    {Array.isArray(media.video) && media.video.length > 0 ?
                      media.video.map((m) => {
                        return (
                          <video
                            controls
                            src={m.url}
                            preload="metadata"
                            className="flex-1"
                          />
                        )
                      })
                      :
                      typeof media.video === 'string' &&
                      <MediaDisplay
                        media={{ type: "video", url: media.video as string }}
                        className="w-full 1"
                      />
                    }
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- Correct answer view --- */}
          {correctAnswer && correctAnswer.list ? (
            <div className="md:flex-none md:w-fit md:max-w-full landscape:flex-1 w-full md:overflow-hidden landscape:overflow-y-auto overflow-x-hidden scrollbar-none rounded-xl md:mx-auto">
              <div className="p-2 lg:p-4">
                <div className="w-full md:overflow-hidden landscape:overflow-x-hidden scrollbar-none">
                  <div
                    ref={correctAnswerContainerRef}
                    className="relative flex justify-center items-center bg-black/5 rounded-xl shadow-lg mx-auto w-full max-w-4xl aspect-video"
                    style={{ minHeight: 400 }}
                  >
                    {image ? (
                      <Image
                        ref={correctAnswerImgRef}
                        src={image || "/placeholder.svg"}
                        alt="Labeling question"
                        fill
                        sizes="(max-width: 1024px) 100vw, 1024px"
                        className="object-contain w-full h-full rounded-xl"
                        style={{ display: "block" }}
                        onLoad={() => {
                          if (correctAnswerImgRef.current) {
                            setCorrectAnswerRealSize({
                              width: correctAnswerImgRef.current.naturalWidth,
                              height: correctAnswerImgRef.current.naturalHeight,
                            });
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-xl border border-gray-200">
                        <span className="text-gray-500">
                          Image not available
                        </span>
                      </div>
                    )}
                    {/* Render blanks với label đúng, sử dụng scaling như interactive mode */}
                    {blanks.map((blank: any) => {
                      const labelId = correctAnswer.list[blank.id];
                      const label = labels.find((l: any) => l.id === labelId);

                      // Calculate scaled position and size
                      const naturalW = question.image_width || 1024;
                      const naturalH = question.image_height || 576;
                      const scaleX =
                        correctAnswerContainerSize.width / naturalW || 1;
                      const scaleY =
                        correctAnswerContainerSize.height / naturalH || 1;
                      const leftPx = Math.round(
                        correctAnswerImageOffset.x +
                        blank.coordinates.x * scaleX
                      );
                      const topPx = Math.round(
                        correctAnswerImageOffset.y +
                        blank.coordinates.y * scaleY
                      );
                      const widthPx = Math.round(blank.coordinates.w * scaleX);
                      const heightPx = Math.round(blank.coordinates.h * scaleY);

                      return (
                        <BlankDropZone
                          key={blank.id}
                          blank={blank}
                          label={label}
                          disabled={true}
                          offsetX={leftPx}
                          offsetY={topPx}
                          widthPx={widthPx}
                          heightPx={heightPx}
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
          ) : (
            // --- Interactive mode ---
            <div className={`md:flex-none md:w-fit md:max-w-full landscape:flex-1 w-full rounded-xl md:mx-auto 
              ${isMobile ? "landscape:overflow-auto overflow-x-auto scrollbar-thin" : "overflow-visible"}
            `}>
              <DndContext
                sensors={sensors}
                collisionDetection={rectIntersection}
                autoScroll
                onDragEnd={handleDragEnd}
                onDragStart={handleDragStart}
                onDragCancel={handleDragCancel}
              >
                <div
                  className={`flex flex-col landscape:flex-row lg:flex-row md:h-auto landscape:h-full ${isMobile ? "gap-2 landscape:min-w-max" : "gap-6"}`}
                >
                  {/* Labels section */}
                  <div className="flex flex-col items-center justify-center w-full landscape:w-40 lg:w-56 landscape:flex-shrink-0 lg:flex-shrink-0 landscape:order-1 lg:order-1 landscape:h-auto lg:h-auto">
                    <div
                      className={`w-full flex flex-row flex-wrap justify-start content-center gap-1.5 ${isMobile ? "gap-1.5" : "gap-2"}`}
                    >
                      {(activeId
                        ? unplacedLabels.filter(
                          (l: any) => String(l.id) !== String(activeId)
                        )
                        : unplacedLabels
                      ).map((label: any) => (
                        <LabelDraggable
                          key={label.id}
                          label={label}
                          disabled={isSubmitted}
                          isMobile={isMobile}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Image with blanks */}
                  <div className="flex-1 flex flex-col landscape:order-2 lg:order-2 landscape:min-h-0 landscape:min-w-0">
                    <div
                      ref={containerRef}
                      className={`relative flex justify-center items-center bg-black/5 rounded-xl shadow-lg w-full mx-auto ${isMobile
                        ? "landscape:max-w-[calc(100vh*16/9*0.65)] landscape:max-h-[65vh] min-h-[180px] aspect-[16/9]"
                        : "min-h-[320px] lg:min-h-[400px] max-w-3xl aspect-[16/9]"
                        }`}
                    >
                      {image ? (
                        <>
                          <Image
                            ref={imgRef}
                            src={image || "/placeholder.svg"}
                            alt="Labeling question"
                            fill
                            sizes="(max-width: 1024px) 100vw, 1024px"
                            className="object-cover w-full h-full rounded-xl"
                            style={{ display: "block" }}
                          />
                          <div className="absolute top-2 right-2 z-20">
                            {/* Zoom button overlay */}
                            <ZoomableImage
                              imageSrc={image}
                              onZoomChange={setIsImageZoomed}
                              isMobile={isMobile}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-xl border border-gray-200">
                          <span className="text-gray-500">
                            Image not available
                          </span>
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
                        // Thêm multiplier để tăng/giảm kích thước dropzone
                        const multiplier = 1.2;
                        const widthPx = Math.round(
                          blank.coordinates.w * scaleX * multiplier
                        );
                        const heightPx = Math.round(
                          blank.coordinates.h * scaleY
                        );

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
                            isMobile={isMobile}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* DragOverlay - Render in portal to avoid layout conflicts */}
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
                        {activeId ? (
                          <div
                            className={`inline-block bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow-lg border-2 border-[#60A5FA] text-[#60A5FA] font-medium text-center transition-all duration-200 touch-none whitespace-nowrap ${isMobile ? "text-xs px-2 py-1.5" : "text-sm px-3 py-2"
                              }`}
                            style={{
                              touchAction: "none",
                            }}
                          >
                            <LatexText
                              value={
                                labels.find((l: any) => l.id === activeId)
                                  ?.text || ""
                              }
                              inline
                            />
                          </div>
                        ) : null}
                      </DragOverlay>,
                      document.getElementById("drag-overlay-portal") ||
                      document.body
                    )}
                  </>
                )}
                <style jsx>{`
                  .no-scrollbar {
                    -ms-overflow-style: none; /* IE and Edge */
                    scrollbar-width: none; /* Firefox */
                  }
                  .no-scrollbar::-webkit-scrollbar {
                    display: none; /* Chrome, Safari */
                  }
                `}</style>
              </DndContext>
            </div>
          )}
        </div>
      </div>
    </MobileOrientationGuard>
  );
}

function LabelDraggable({
  label,
  disabled,
  isMobile,
}: {
  label: any;
  disabled?: boolean;
  isMobile?: boolean;
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
      className={`inline-block bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl shadow-sm hover:shadow-md cursor-grab text-[#32428D] font-medium text-center border border-blue-200 hover:border-blue-300 transition-all duration-200 ${isDragging ? "opacity-60 scale-105" : "hover:scale-102"
        } touch-none whitespace-nowrap ${isMobile ? "text-xs px-2 py-1.5" : "text-sm px-3 py-2"
        }`}
      style={{
        touchAction: "none",
      }}
    >
      <LatexText value={label.text || ""} inline />
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
  isMobile,
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
  isMobile?: boolean;
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
      className={`absolute flex items-center justify-center border-[1px] rounded-3xl transition-colors ${shouldHighlight
        ? "border-blue-400 bg-green-100/80"
        : "border-blue-400 bg-blue-50/80"
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
        <span className={`text-[#32428D] font-semibold truncate px-1 ${isMobile ? "text-xs" : "text-base"}`}>
          <LatexText value={label.text || ""} inline />
        </span>
      ) : (
        <span></span>
      )}
    </div>
  );
}
