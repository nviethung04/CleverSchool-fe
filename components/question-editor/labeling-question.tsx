"use client";

import React, { forwardRef } from "react";
import { useTranslations } from "next-intl";
import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LucideX,
  LucideSearch,
  LucidePlus,
  LucideHelpCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  setQuestionText,
  setLabelImage,
  addLabelPosition,
  updateLabelPosition,
  removeLabelPosition,
  addLabelGroup,
  updateLabelGroup,
  removeLabelGroup,
  updateLabelPositionGroup,
} from "@/lib/redux/question-slice";
import { MediaUploadDialog } from "./media-upload-dialog";
import { TiptapMathEditor } from "./tiptap-math-editor";
import { QuestionMediaControls } from "./question-media-controls";
import { QuestionMediaPreview } from "./question-media-preview";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { TiptapMathViewer } from "./tiptap-math-viewer";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";

// Draggable label component for preview mode
function DraggableLabel({
  id,
  text,
  isActive,
}: {
  id: number | string;
  text: string;
  isActive: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `label-${id}`,
    data: {
      text,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isActive ? 50 : 10,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`inline-flex items-center justify-center px-3 py-1 text-sm font-medium rounded-md 
        ${isActive
          ? "bg-purple-600 text-white shadow-lg"
          : "bg-white border border-purple-300 text-purple-800"
        } 
        cursor-grab active:cursor-grabbing`}
    >
      {text}
    </div>
  );
}

// Droppable area component for preview mode
function DroppableArea({
  id,
  position,
  onDrop,
}: {
  id: number;
  position: { x: number; y: number; width: number; height: number };
  onDrop: (id: number, labelId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `area-${id}`,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        position: "absolute",
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: `${position.width}%`,
        height: `${position.height}%`,
        border: `2px dashed ${isOver ? "purple" : "#9333ea80"}`,
        borderRadius: "4px",
        backgroundColor: isOver
          ? "rgba(147, 51, 234, 0.2)"
          : "rgba(147, 51, 234, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 5,
      }}
    />
  );
}

// Group Item Component (draggable group)
function DraggableGroup({
  group,
  idx,
  active,
  onEdit,
  onRemove,
}: {
  group: any;
  idx: number;
  active: boolean;
  onEdit: (id: number, text: string) => void;
  onRemove: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `group-${group.id}`,
    });
  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
    minWidth: 120,
    textAlign: "center" as const,
    display: "flex" as const,
    alignItems: "center" as const,
    gap: 6,
    cursor: "grab" as const,
    background: active ? "#ede9fe" : "#faf5ff",
    border: active ? "2px solid #a21caf" : "1.5px solid #a78bfa",
    borderRadius: 8,
    padding: "8px 12px",
    marginBottom: 6,
    position: "relative" as const,
  };
  return (
    <div ref={setNodeRef} style={style} className="group-item">
      {/* Drag handle icon */}
      <span
        {...attributes}
        {...listeners}
        style={{
          display: "flex",
          alignItems: "center",
          marginRight: 6,
          cursor: "grab",
        }}
        tabIndex={-1}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="5" cy="4" r="1.5" fill="#9333ea" />
          <circle cx="5" cy="9" r="1.5" fill="#9333ea" />
          <circle cx="5" cy="14" r="1.5" fill="#9333ea" />
          <circle cx="13" cy="4" r="1.5" fill="#9333ea" />
          <circle cx="13" cy="9" r="1.5" fill="#9333ea" />
          <circle cx="13" cy="14" r="1.5" fill="#9333ea" />
        </svg>
      </span>
      <input
        value={group.text}
        onChange={(e) => onEdit(group.id, e.target.value)}
        placeholder={`Nhóm #${idx + 1}`}
        className="flex-1 bg-transparent border-none outline-none text-purple-800 font-medium text-base px-1"
        style={{ minWidth: 60 }}
      />
      <button
        type="button"
        onClick={() => onRemove(group.id)}
        className="ml-2 text-gray-400 hover:text-red-500 focus:outline-none"
        tabIndex={-1}
        aria-label="Xóa nhóm"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 5L13 13M13 5L5 13"
            stroke="#9333ea"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

// Draggable position component for editor mode (as droppable for group)
function DraggablePosition({
  id,
  position,
  groupPosition,
  labelGroups,
  onPositionChange,
  onDelete,
  imageRef,
  index,
  onGroupChange,
  ...rest
}: {
  id: number;
  position: { x: number; y: number; width: number; height: number };
  groupPosition?: number | null;
  labelGroups: any[];
  onPositionChange: (
    id: number,
    changes: { x?: number; y?: number; width?: number; height?: number }
  ) => void;
  onDelete: (id: number) => void;
  imageRef: React.RefObject<HTMLImageElement | null>;
  index: number;
  onGroupChange: (positionId: number, groupPosition: number | null) => void;
}) {
  const t = useTranslations("questionEditor.labeling");
  const [isDragging, setIsDragging] = useState(false);
  // Chỉ kéo thả khi bấm vào icon drag
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const initialX = e.clientX;
    const initialY = e.clientY;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!imageRef.current) return;
      const imageRect = imageRef.current.getBoundingClientRect();
      const deltaX = moveEvent.clientX - initialX;
      const deltaY = moveEvent.clientY - initialY;
      const deltaXPercent = (deltaX / imageRect.width) * 100;
      const deltaYPercent = (deltaY / imageRect.height) * 100;
      const newX = Math.max(
        0,
        Math.min(100 - position.width, position.x + deltaXPercent)
      );
      const newY = Math.max(
        0,
        Math.min(100 - position.height, position.y + deltaYPercent)
      );
      onPositionChange(id, { x: newX, y: newY });
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };
  const groupOptions = labelGroups.map((g, i) => ({
    value: i,
    label: g.text || `Nhóm #${i + 1}`,
  }));
  const selectedGroupIdx =
    typeof groupPosition === "number" ? groupPosition : "";
  const groupText =
    typeof groupPosition === "number" && labelGroups[groupPosition]
      ? labelGroups[groupPosition].text
      : "";
  return (
    <div
      style={{
        position: "absolute",
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: `${position.width}%`,
        height: `${position.height}%`,
        border: isDragging ? "2.5px solid #a21caf" : "2px solid #9333ea",
        borderRadius: "4px",
        background: isDragging ? "rgba(168, 28, 175, 0.13)" : "#faf5ff",
        zIndex: isDragging ? 50 : 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transition: "border 0.15s, background 0.15s",
        padding: 4,
      }}
    >
      {/* ĐÃ XÓA ICON DRAG PHỤ Ở ĐÂY */}
      <select
        value={selectedGroupIdx}
        onChange={(e) => {
          const value = e.target.value === "" ? null : Number(e.target.value);
          onGroupChange(id, value);
        }}
        style={{ marginBottom: 4, minWidth: 80 }}
      >
        <option value="">{t("selectGroup")}</option>
        {groupOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div style={{ fontWeight: 600, color: "#9333ea", minHeight: 24 }}>
        {groupText && groupText.trim() !== "" ? (
          groupText
        ) : (
          <span className="text-gray-400">{t("noGroupSelected")}</span>
        )}
      </div>
      <div
        className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full border border-purple-500 flex items-center justify-center cursor-pointer hover:bg-red-100 delete-label-position"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(id);
        }}
      >
        <LucideX className="w-3 h-3 text-purple-800" />
      </div>
      <div className="absolute -top-6 left-0 text-base text-purple-800 font-medium">
        {index + 1}.
      </div>
      <button
        type="button"
        className="absolute"
        style={{
          bottom: "-10px",
          right: "-10px",
          width: "24px",
          height: "24px",
          background: "#E9D5FF",
          border: "1.5px solid #A78BFA",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: isDragging ? "grabbing" : "grab",
          boxShadow: "0 1px 4px 0 rgba(0,0,0,0.08)",
          zIndex: 100,
        }}
        onMouseDown={handleDragStart}
        tabIndex={-1}
        aria-label="Di chuyển vùng nhãn"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="3.5" cy="3.5" r="1.5" fill="#9333ea" />
          <circle cx="10.5" cy="3.5" r="1.5" fill="#9333ea" />
          <circle cx="3.5" cy="10.5" r="1.5" fill="#9333ea" />
          <circle cx="10.5" cy="10.5" r="1.5" fill="#9333ea" />
        </svg>
      </button>
    </div>
  );
}

export const LabelingQuestion = forwardRef(function LabelingQuestion(
  props: {},
  ref
) {
  const dispatch = useAppDispatch();
  const t = useTranslations("questionEditor.labeling");
  const {
    questionText,
    questionImage,
    questionAudio,
    questionVideo,
    labelImage,
    labelPositions,
    labelGroups,
  } = useAppSelector((state) => state.question);

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [previewDropped, setPreviewDropped] = useState<Record<number, string>>(
    {}
  );
  const [incorrectOptions, setIncorrectOptions] = useState<string[]>([]);
  const [showGuide, setShowGuide] = useState(false);

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const previewImageRef = useRef<HTMLImageElement>(null);

  // DnD-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleImageClick = (e: React.MouseEvent) => {
    if (!imageRef.current || !labelImage) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    dispatch(
      addLabelPosition({
        x: Math.max(0, Math.min(90, x - 7.5)), // Center the label
        y: Math.max(0, Math.min(90, y - 5)),
        width: 15, // Larger fixed width
        height: 10, // Larger fixed height
      })
    );
  };

  const handlePositionChange = (
    id: number,
    changes: { x?: number; y?: number; width?: number; height?: number }
  ) => {
    dispatch(updateLabelPosition({ id, ...changes }));
  };

  const handleAnswerChange = (id: number, answer: string) => {
    dispatch(updateLabelPosition({ id, answer }));
  };

  const handleDeletePosition = (id: number) => {
    dispatch(removeLabelPosition(id));
  };

  const handleAddIncorrectOption = () => {
    setIncorrectOptions([...incorrectOptions, ""]);
  };

  const handleIncorrectOptionChange = (index: number, value: string) => {
    const newOptions = [...incorrectOptions];
    newOptions[index] = value;
    setIncorrectOptions(newOptions);
  };

  const handleDeleteIncorrectOption = (index: number) => {
    const newOptions = [...incorrectOptions];
    newOptions.splice(index, 1);
    setIncorrectOptions(newOptions);
  };

  // DnD: handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over) return;
    // Nếu kéo group vào label position
    if (
      String(active.id).startsWith("group-") &&
      String(over.id).startsWith("label-position-")
    ) {
      const groupId = Number(String(active.id).replace("group-", ""));
      const positionId = Number(String(over.id).replace("label-position-", ""));
      const groupIdx = labelGroups.findIndex((g) => g.id === groupId);
      if (groupIdx !== -1) {
        handleDropGroupToPosition(positionId, groupIdx);
      }
    }
  };
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleImageUpload = (url: string, previewUrl?: string) => {
    console.log("Image uploaded:", url, "Preview:", previewUrl);
    dispatch(setLabelImage({ url, previewUrl }));
  };

  // Get the appropriate image URL to display
  const displayImageUrl = labelImage || "/placeholder.svg";

  // Generate options for preview from label positions and incorrect options
  const previewOptions = [
    ...labelPositions
      .filter(
        (pos) =>
          typeof pos.groupPosition === "number" &&
          labelGroups[pos.groupPosition] &&
          labelGroups[pos.groupPosition].text.trim() !== ""
      )
      .map((pos) => ({
        id: `correct-${pos.id}`,
        text:
          typeof pos.groupPosition === "number" &&
            labelGroups[pos.groupPosition]
            ? labelGroups[pos.groupPosition].text
            : "",
        isCorrect: true,
      })),
    ...incorrectOptions
      .filter((text) => text.trim() !== "")
      .map((text, index) => ({
        id: `incorrect-${index}`,
        text,
        isCorrect: false,
      })),
  ];

  // Group management
  const handleAddGroup = () => dispatch(addLabelGroup());
  const handleRemoveGroup = (id: number) => dispatch(removeLabelGroup(id));
  const handleEditGroup = (id: number, text: string) =>
    dispatch(updateLabelGroup({ id, text }));
  // Drag group to position
  const handleDropGroupToPosition = (positionId: number, groupIdx: number) => {
    const group = labelGroups[groupIdx];
    if (!group) return;
    dispatch(updateLabelPositionGroup({ positionId, groupPosition: groupIdx }));
    // Luôn copy text group vào answer (kể cả khi rỗng)
    dispatch(updateLabelPosition({ id: positionId, answer: group.text }));
  };

  return (
    <>
      <div className="bg-purple-900 rounded-lg p-4 mb-4">
        <QuestionMediaControls className="mb-2" />
        <TiptapMathEditor
          ref={ref}
          value={questionText}
          onChange={(val) => dispatch(setQuestionText(val))}
          placeholder={t("questionText")}
        />
        <QuestionMediaPreview />
      </div>
      {/* Group management UI */}
      <div className="border rounded-lg p-4 bg-white mb-4">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-1 md:gap-0">
          <h3 className="text-lg font-medium">{t("groupAnswersLabel")}</h3>
          <Button variant="outline" size="sm" onClick={handleAddGroup}>
            <LucidePlus className="h-4 w-4 mr-1" /> {t("addGroup")}
          </Button>
        </div>
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-2 flex-wrap">
            {labelGroups.map((group, idx) => (
              <DraggableGroup
                key={group.id}
                group={group}
                idx={idx}
                active={activeDragId === `group-${group.id}`}
                onEdit={handleEditGroup}
                onRemove={handleRemoveGroup}
              />
            ))}
          </div>
        </DndContext>
      </div>
      {/* Image and label positions */}
      <div className="border rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-1 md:gap-0">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-medium">{t("imageTitle")}</h3>
            <Dialog open={showGuide} onOpenChange={setShowGuide}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  aria-label={t("guideAriaLabel")}
                  className="flex items-center gap-1 text-purple-700 hover:text-purple-900 text-base font-medium"
                >
                  <LucideHelpCircle className="w-5 h-5" />
                  <span>{t("guide")}</span>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-[1200px] w-full p-1 md:p-4">
                <div className="w-full aspect-video flex items-center justify-center">
                  <video controls style={{ width: "100%", maxHeight: 800 }}>
                    <source src="/intruct/labeling.mp4" type="video/mp4" />
                    {t("videoNotSupported")}
                  </video>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <MediaUploadDialog
            type="image"
            onMediaSelect={handleImageUpload}
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <LucideSearch className="h-4 w-4" />
                <span>{t("uploadButton")}</span>
              </Button>
            }
          />
        </div>
        <div
          ref={imageContainerRef}
          className="relative border border-dashed border-gray-300 rounded-lg bg-gray-50 flex justify-center items-center"
          style={{ width: '100%', minHeight: '300px' }}
        >
          {labelImage ? (
            <div
              className="relative mx-auto"
              style={{
                width: '100%',
                maxWidth: '1024px',
                aspectRatio: '16/9'
              }}
            >
              <Image
                ref={imageRef}
                src={displayImageUrl || "/placeholder.svg"}
                alt="Question"
                className="w-full h-full object-contain"
                height={576}
                width={1024}
                onClick={handleImageClick}
              />
              {/* Render label positions as drop zones */}
              <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                {labelPositions.map((pos, idx) => (
                  <DraggablePosition
                    key={pos.id}
                    id={pos.id}
                    position={{ ...pos, width: 15, height: 10 }}
                    groupPosition={pos.groupPosition}
                    labelGroups={labelGroups}
                    onPositionChange={handlePositionChange}
                    onDelete={handleDeletePosition}
                    imageRef={imageRef}
                    index={idx}
                    onGroupChange={(positionId, groupPosition) =>
                      dispatch(
                        updateLabelPositionGroup({ positionId, groupPosition })
                      )
                    }
                  />
                ))}
              </DndContext>
            </div>
          ) : (
            <div className="text-center p-2 md:p-6">
              <MediaUploadDialog
                type="image"
                onMediaSelect={handleImageUpload}
                trigger={
                  <div className="cursor-pointer">
                    <div className="mx-auto h-12 w-12 text-gray-400">
                      <LucideSearch className="h-12 w-12" />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      {t("uploadOrSearchImage")}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {t("clickImageToCreateAreas")}
                    </p>
                  </div>
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Preview Section */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">{t("previewTitle")}</h3>
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-purple-900 text-white p-4">
            <TiptapMathViewer value={questionText} />
            <p className="text-sm mt-2">{t("previewInstruction")}</p>
          </div>

          <div className="p-4 bg-white">
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToParentElement]}
            >
              <div
                className="relative border rounded-lg bg-gray-50 flex justify-center items-center mb-4"
                style={{ width: '100%', minHeight: '300px' }}
              >
                {labelImage ? (
                  <div
                    className="relative mx-auto"
                    style={{
                      width: '100%',
                      maxWidth: '1024px',
                      aspectRatio: '16/9'
                    }}
                  >
                    <Image
                      ref={previewImageRef}
                      src={displayImageUrl || "/icons/placeholder.svg"}
                      alt="Question"
                      className="w-full h-full object-contain"
                      height={576}
                      width={1024}
                    />
                    {labelPositions.map((pos) => (
                      <DroppableArea
                        key={pos.id}
                        id={pos.id}
                        position={{ ...pos, width: 15, height: 10 }}
                        onDrop={(id, labelId) => {
                          setPreviewDropped({
                            ...previewDropped,
                            [id]: labelId,
                          });
                        }}
                      />
                    ))}

                    {/* Show dropped answers */}
                    {Object.entries(previewDropped).map(
                      ([posId, labelId]) => {
                        const position = labelPositions.find(
                          (p) => p.id === Number.parseInt(posId)
                        );
                        const option = previewOptions.find(
                          (o) => o.id === labelId
                        );
                        if (!position || !option) return null;
                        return (
                          <div
                            key={`dropped-${posId}-${labelId}`}
                            style={{
                              position: "absolute",
                              left: `${position.x}%`,
                              top: `${position.y}%`,
                              width: `20%`,
                              height: `7%`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              zIndex: 20,
                            }}
                          >
                            <div className="bg-purple-600 text-white px-3 py-1 rounded-md text-sm font-medium">
                              {option.text}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">{t("noImageUploaded")}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {previewOptions.map((option) => {
                  const isDropped = Object.values(previewDropped).includes(
                    option.id
                  );
                  if (isDropped) return null;

                  return (
                    <DraggableLabel
                      key={option.id}
                      id={option.id}
                      text={option.text || ""}
                      isActive={activeDragId === `label-${option.id}`}
                    />
                  );
                })}
              </div>
            </DndContext>
          </div>
        </div>
      </div>
    </>
  );
});
