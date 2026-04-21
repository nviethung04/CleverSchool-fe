"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import {
  LucideTrash2,
  LucidePlus,
  LucideInfo,
  LucideGripVertical,
  LucideHelpCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  setQuestionText,
  updateDragDropOption,
  addDragDropOption,
  removeDragDropOption,
  toggleDragDropOptionCorrect,
  setDragDropOptionImage,
  setDragDropOptionAudio,
  setDragDropOptionVideo,
  addDragDropGroup,
  updateDragDropGroup,
  removeDragDropGroup,
  updateDragDropOptionGroup,
  setBlankCount,
} from "@/lib/redux/question-slice";
import { QuestionMediaControls } from "./question-media-controls";
import { QuestionMediaPreview } from "./question-media-preview";
import { ItemMediaUpload } from "./item-media-upload";
import { TiptapMathEditor } from "./tiptap-math-editor";
import { TiptapMathViewer } from "./tiptap-math-viewer";
import { forwardRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  useDroppable,
  useDraggable,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React from "react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

function useDebouncedEffect(effect: () => void, deps: any[], delay: number) {
  useEffect(() => {
    const handler = setTimeout(() => effect(), delay);
    return () => clearTimeout(handler);
  }, [...deps, delay]);
}

// Separate input component that doesn't participate in drag
const GroupInput = ({
  initialValue,
  onSave,
  placeholder,
  disabled = false,
}: {
  initialValue: string;
  onSave: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}) => {
  const [localValue, setLocalValue] = React.useState(initialValue);
  React.useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);
  return (
    <textarea
      placeholder={placeholder}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => onSave(localValue)}
      disabled={disabled}
      className="mb-2 text-center min-h-[20px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
    />
  );
};

// Separate draggable grip component
const DraggableGrip = React.memo(function DraggableGrip({
  item,
}: {
  item: any;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: `group-${item.id}` });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 1,
        WebkitTapHighlightColor: "transparent",
      }}
      className="cursor-grab flex items-center ml-2 text-purple-700 hover:text-purple-900"
      tabIndex={-1}
    >
      <LucideGripVertical className="h-5 w-5" />
    </div>
  );
});

export const DragDropQuestion = forwardRef<any, {}>(function DragDropQuestion(
  props,
  ref
) {
  const dispatch = useAppDispatch();
  const t = useTranslations("questionEditor.dragDrop");
  const { questionText, dragDropOptions, dragDropGroups, blankCount } =
    useAppSelector((state) => state.question);
  const [activeGroupId, setActiveGroupId] = React.useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Sync blankCount with number of [blank] in questionText
  React.useEffect(() => {
    const match = questionText.match(/\[blank\]/g);
    const count = match ? match.length : 0;
    if (count !== blankCount) {
      dispatch(setBlankCount(count));
    }
  }, [questionText, blankCount, dispatch]);

  // Sync answers when groups change
  React.useEffect(() => {
    dragDropOptions.forEach((option) => {
      if (option.groupPosition !== null && option.groupPosition !== undefined) {
        const group = dragDropGroups[option.groupPosition];
        if (group) {
          // Update answer text if group text changed
          if (group.text !== option.text) {
            dispatch(updateDragDropOption({ id: option.id, text: group.text }));
          }
          // Update answer media if group media changed
          if (group.image !== option.image) {
            dispatch(
              setDragDropOptionImage({ id: option.id, url: group.image ?? "" })
            );
          }
          if (group.audio !== option.audio) {
            dispatch(
              setDragDropOptionAudio({ id: option.id, url: group.audio ?? "" })
            );
          }
          if (group.video !== option.video) {
            dispatch(
              setDragDropOptionVideo({ id: option.id, url: group.video ?? "" })
            );
          }
        }
      }
    });
  }, [dragDropGroups, dragDropOptions, dispatch]);

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Group logic with useCallback to prevent re-renders
  const handleAddGroup = React.useCallback(() => {
    dispatch(addDragDropGroup());
  }, [dispatch]);

  const handleRemoveGroup = React.useCallback(
    (id: number) => {
      dispatch(removeDragDropGroup(id));
    },
    [dispatch]
  );

  const handleEditGroup = React.useCallback(
    (id: number, field: string, value: string, previewUrl?: string) => {
      if (field === "text") dispatch(updateDragDropGroup({ id, text: value }));
      if (field === "image")
        dispatch(updateDragDropGroup({ id, image: value }));
      if (field === "audio")
        dispatch(updateDragDropGroup({ id, audio: value }));
    },
    [dispatch]
  );

  // Drop group into answer
  const handleDropGroupToAnswer = React.useCallback(
    (optionId: number, groupIdx: number) => {
      console.log("handleDropGroupToAnswer called:", { optionId, groupIdx });
      const group = dragDropGroups[groupIdx];
      const option = dragDropOptions.find((item) => item.id === optionId);
      console.log("Found group:", group);
      console.log("Found option:", option);

      if (group && option) {
        console.log("Updating option with group data:", {
          groupText: group.text,
          groupImage: group.image,
          groupAudio: group.audio,
          groupVideo: group.video,
        });

        // Update group position and copy all data from group
        dispatch(
          updateDragDropOptionGroup({ optionId, groupPosition: groupIdx })
        );

        // Also update the option's text and media to match the group
        if (group.text) {
          dispatch(updateDragDropOption({ id: optionId, text: group.text }));
        }
        if (group.image) {
          dispatch(setDragDropOptionImage({ id: optionId, url: group.image }));
        }
        if (group.audio) {
          dispatch(setDragDropOptionAudio({ id: optionId, url: group.audio }));
        }
        if (group.video) {
          dispatch(setDragDropOptionVideo({ id: optionId, url: group.video }));
        }

        // Log state after updates
        setTimeout(() => {
          console.log(
            "State after updates - dragDropOptions:",
            dragDropOptions
          );
          console.log("State after updates - dragDropGroups:", dragDropGroups);
        }, 100);
      }
    },
    [dragDropGroups, dragDropOptions, dispatch]
  );

  // dnd-kit drag start/end
  const handleDragStart = React.useCallback((event: any) => {
    if (document.activeElement instanceof HTMLTextAreaElement) {
      document.activeElement.blur(); // commit giá trị
    }
    if (String(event.active.id).startsWith("group-")) {
      setActiveGroupId(String(event.active.id));
    }
  }, []);

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      console.log("handleDragEnd called:", event);
      setActiveGroupId(null);
      const { active, over } = event;
      if (!over) {
        console.log("No over target");
        return;
      }
      console.log("Active:", active.id, "Over:", over.id);

      // Drag group to answer
      if (
        String(active.id).startsWith("group-") &&
        String(over.id).startsWith("answer-")
      ) {
        console.log("Drag group to answer detected");
        const groupId = Number(String(active.id).replace("group-", ""));
        const answerId = Number(String(over.id).replace("answer-", ""));
        const groupIdx = dragDropGroups.findIndex((g) => g.id === groupId);
        console.log("Parsed IDs:", { groupId, answerId, groupIdx });

        if (groupIdx !== -1) {
          console.log("Calling handleDropGroupToAnswer");
          handleDropGroupToAnswer(answerId, groupIdx);
        }
      }
    },
    [dragDropGroups, handleDropGroupToAnswer]
  );

  // DragOverlay content
  const activeGroup =
    activeGroupId && dragDropGroups.length > 0
      ? dragDropGroups.find((g) => `group-${g.id}` === activeGroupId)
      : null;

  // Answer dropzone
  const AnswerDropZone = React.memo(function AnswerDropZone({
    item,
    group,
  }: {
    item: any;
    group: any | null;
  }) {
    const { setNodeRef, isOver } = useDroppable({ id: `answer-${item.id}` });
    const borderColor = item.color ? item.color.replace("bg-", "border-") : "";
    return (
      <div
        ref={setNodeRef}
        className={`relative transition-all border-2 rounded-lg min-h-[100px] flex flex-col items-center justify-center bg-white ${borderColor} ${isOver ? "ring-2 ring-purple-500" : "border-dashed border-gray-300"
          }`}
      >
        {group ? (
          <div className="w-full flex flex-col items-center">
            {group.text && (
              <div className="font-semibold text-center mb-1">{group.text}</div>
            )}
            {group.image && (
              <img
                src={group.image}
                alt="group-img"
                className="max-h-16 mb-1"
              />
            )}
            {group.audio && (
              <audio controls src={group.audio} className="mb-1" />
            )}
            {group.video && (
              <video controls src={group.video} className="max-h-24 mb-1" />
            )}
          </div>
        ) : (
          <div className="text-gray-400 text-center select-none p-4">
            {t("dropGroupHere")}
          </div>
        )}
      </div>
    );
  });

  // Memo GroupItem with completely isolated input
  const GroupItem = React.memo(function GroupItem({
    item,
    index,
    onEdit,
    onRemove,
    disableRemove,
  }: any) {
    const handleItemImageSelect = React.useCallback(
      (url: string, previewUrl?: string) => {
        onEdit(item.id, "image", url, previewUrl);
      },
      [onEdit, item.id]
    );

    const handleRemove = React.useCallback(() => {
      onRemove(item.id);
    }, [onRemove, item.id]);

    return (
      <div
        className={`rounded-lg p-3 relative mb-2 border-2 ${item.color} flex flex-col justify-between`}
        data-group-id={item.id}
      >
        <div className="flex justify-between mb-2 items-center">
          <Button
            variant="ghost"
            size="icon"
            className="text-red-600 hover:text-red-700 h-7 w-7"
            onClick={handleRemove}
            disabled={disableRemove}
          >
            <LucideTrash2 className="h-4 w-4" />
          </Button>
          {/* Separate draggable grip */}
          <DraggableGrip item={item} />
        </div>

        {/* Input component - completely isolated */}
        <GroupInput
          initialValue={item.text || ""}
          onSave={(val) => onEdit(item.id, "text", val)}
          placeholder={`${t("groupPlaceholder")} #${index + 1}`}
        />

        <ItemMediaUpload
          onImageSelect={(url, previewUrl) =>
            onEdit(item.id, "image", url, previewUrl)
          }
          onAudioSelect={(url, previewUrl) =>
            onEdit(item.id, "audio", url, previewUrl)
          }
          currentImage={item.image}
          currentImagePreview={item.imagePreview}
          currentAudio={item.audio}
        />
      </div>
    );
  });

  // Answers sorted by correctPosition (for correct answers)
  const correctAnswers = dragDropOptions
    .filter((a) => a.isCorrect)
    .sort((a, b) => (a.correctPosition || 0) - (b.correctPosition || 0));
  const incorrectAnswers = dragDropOptions
    .filter((a) => !a.isCorrect)
    .sort((a, b) => a.id - b.id);

  return (
    <>
      {/* Guide icon above question input */}
      <div className="flex items-center mb-2">
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
          <DialogContent className="max-w-[1200px]" style={{ width: 1200 }}>
            <div className="w-full aspect-video flex items-center justify-center">
              <video controls style={{ width: "100%", maxHeight: 800 }}>
                <source src="/intruct/drag drop.mp4" type="video/mp4" />
                {t("videoNotSupported")}
              </video>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="bg-purple-900 rounded-lg p-4 mb-4">
        <QuestionMediaControls className="mb-2" />
        <TiptapMathEditor
          ref={ref}
          value={questionText}
          onChange={(val) => dispatch(setQuestionText(val))}
          placeholder={t("questionText")}
        />
        <QuestionMediaPreview />
        <div className="text-white/60 text-xs mt-2 flex items-center">
          <LucideInfo className="h-3 w-3 mr-1" />
          {t("blanksHint")} {blankCount}
        </div>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Two columns: correct and incorrect answers */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Correct answers */}
          <div>
            <div className="flex items-center mb-2">
              <span className="font-semibold mr-2 text-green-700">
                {t("correctAnswersLabel")}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => dispatch(addDragDropOption(true))}
              >
                + {t("addCorrectAnswer")}
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {correctAnswers.map((item) => {
                const group =
                  item.groupPosition !== undefined &&
                    item.groupPosition !== null &&
                    dragDropGroups[item.groupPosition]
                    ? dragDropGroups[item.groupPosition]
                    : null;
                return (
                  <div className="relative" key={item.id}>
                    <AnswerDropZone item={item} group={group} />
                    {correctAnswers.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 z-10 text-red-600 hover:text-red-700"
                        onClick={() => dispatch(removeDragDropOption(item.id))}
                      >
                        <LucideTrash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Incorrect answers */}
          <div>
            <div className="flex items-center mb-2">
              <span className="font-semibold mr-2 text-orange-700">
                {t("incorrectAnswersLabel")}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => dispatch(addDragDropOption(false))}
              >
                + {t("addIncorrectAnswer")}
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {incorrectAnswers.map((item) => {
                const group =
                  item.groupPosition !== undefined &&
                    item.groupPosition !== null &&
                    dragDropGroups[item.groupPosition]
                    ? dragDropGroups[item.groupPosition]
                    : null;
                return (
                  <div className="relative" key={item.id}>
                    <AnswerDropZone item={item} group={group} />
                    {incorrectAnswers.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 z-10 text-red-600 hover:text-red-700"
                        onClick={() => dispatch(removeDragDropOption(item.id))}
                      >
                        <LucideTrash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* Groups */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <span className="font-semibold mr-2">{t("groupLabel")}</span>
            <Button size="sm" variant="outline" onClick={handleAddGroup}>
              + {t("addGroup")}
            </Button>
          </div>
          <SortableContext
            items={dragDropGroups.map((g) => `group-${g.id}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 min-h-[90px]">
              {dragDropGroups.map((item, idx) => (
                <GroupItem
                  key={item.id}
                  item={item}
                  disableRemove={dragDropGroups.length <= 1}
                  index={idx}
                  onEdit={handleEditGroup}
                  onRemove={handleRemoveGroup}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeGroup ? (
              <div
                className={`rounded-lg p-3 border-2 ${activeGroup.color} min-h-[80px] flex flex-col justify-between select-none bg-white/90 shadow-xl`}
              >
                <div className="flex justify-between mb-2 items-center">
                  <span className="text-purple-700 font-bold">
                    {activeGroup.text || t("groupLabel")}
                  </span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </div>
      </DndContext>
      {/* Preview */}
      <div className="mt-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="font-medium text-lg mb-2">{t("previewTitle")}</h3>
        <p className="text-sm text-gray-500 mb-4">{t("previewDescription")}</p>
        <div className="bg-purple-900 text-white p-6 rounded-lg mb-4">
          <div className="text-xl font-medium mb-6 text-center">
            {questionText ? (
              <TiptapMathViewer
                value={questionText}
                className="bg-gray-50 text-gray-800 rounded p-2"
              />
            ) : (
              <span className="text-white/50">{t("questionPlaceholder")}</span>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {[...correctAnswers, ...incorrectAnswers].map((option, index) => {
              const group =
                option.groupPosition !== undefined &&
                  option.groupPosition !== null &&
                  dragDropGroups[option.groupPosition]
                  ? dragDropGroups[option.groupPosition]
                  : null;
              return (
                <div
                  key={option.id}
                  className={`px-4 py-2 rounded-md text-center cursor-pointer ${group ? group.color : "bg-gray-200 text-gray-800"
                    }`}
                >
                  {group ? group.text : option.text || t("answer")}
                  {group && group.image && (
                    <div className="mt-1">
                      <img
                        src={group.image}
                        alt="Group"
                        className="w-full h-auto max-h-[50px] object-contain"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
});
