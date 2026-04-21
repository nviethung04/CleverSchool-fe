"use client";

import { Button } from "@/components/ui/button";
import { LucideGripVertical, LucideTrash2, LucidePlus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { useTranslations } from "next-intl";
import {
  setQuestionText,
  updateMatchItem,
  addMatchItem,
  removeMatchItem,
  reorderMatchItems,
  setMatchItemLeftImage,
  setMatchItemRightImage,
  setMatchItemLeftAudio,
  setMatchItemRightAudio,
} from "@/lib/redux/question-slice";
import { QuestionMediaControls } from "./question-media-controls";
import { QuestionMediaPreview } from "./question-media-preview";
import { ItemMediaUpload } from "./item-media-upload";
import { useEffect, useRef, forwardRef } from "react";
import { getColorByIndex } from "@/utils/question-colors";
import { TiptapMathEditor } from "./tiptap-math-editor";
import { MathInput } from "./math-input";

// Import dnd-kit
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Define fixed colors for matching items
const ITEM_COLORS_DARK = [
  "bg-blue-700",
  "bg-yellow-700",
  "bg-green-700",
  "bg-pink-700",
  "bg-purple-700",
];

// Sortable Item Component
type SortableItemProps = {
  item: any;
  index: number;
  onEdit: (
    id: number,
    field: string,
    value: string,
    previewUrl?: string
  ) => void;
  onRemove: (id: number) => void;
};
function SortableItem({ item, index, onEdit, onRemove }: SortableItemProps) {
  const t = useTranslations("questionEditor.matching");
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: item.id.toString(),
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleLeftImageSelect = (url: string, previewUrl?: string) => {
    onEdit(item.id, "leftImage", url, previewUrl);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${getColorByIndex(index)} rounded-lg p-3 relative`}
    >
      <div className="flex justify-between mb-2">
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-white opacity-70 hover:opacity-100 hover:bg-white/20 h-7 w-7"
            onClick={() => onRemove(item.id)}
          >
            <LucideTrash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div {...attributes} {...listeners} className="cursor-grab">
          <LucideGripVertical className="h-5 w-5 text-white opacity-70" />
        </div>
      </div>
      <MathInput
        value={item.leftText}
        onChange={(value) => onEdit(item.id, "left", value)}
        placeholder={t("leftSide")}
        className="mb-2"
        size="sm"
      />
      <ItemMediaUpload
        onImageSelect={handleLeftImageSelect}
        onAudioSelect={(url: string, previewUrl?: string) => {
          onEdit(item.id, "leftAudio", url, previewUrl);
        }}
        currentImage={item.leftImage}
        currentImagePreview={item.leftImagePreview}
        currentAudio={item.leftAudio}
      />
    </div>
  );
}

export const MatchingQuestion = forwardRef(function MatchingQuestion(
  props: {},
  ref
) {
  const dispatch = useAppDispatch();
  const t = useTranslations("questionEditor.matching");
  const { questionText, matchItems } = useAppSelector(
    (state) => state.question
  );

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Ensure we always have at least 3 items
  useEffect(() => {
    // Add items if we have less than 3
    if (matchItems.length < 3) {
      const itemsToAdd = 3 - matchItems.length;
      for (let i = 0; i < itemsToAdd; i++) {
        dispatch(addMatchItem());
      }
    }
  }, [matchItems.length, dispatch]);

  // Handle drag end for matching items
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Find positions in the sorted array
      const sortedItems = [...matchItems].sort(
        (a, b) => a.position - b.position
      );
      const activeIndex = sortedItems.findIndex(
        (item) => item.id.toString() === active.id.toString()
      );
      const overIndex = sortedItems.findIndex(
        (item) => item.id.toString() === over.id.toString()
      );

      if (activeIndex !== -1 && overIndex !== -1) {
        dispatch(
          reorderMatchItems({
            sourceIndex: activeIndex,
            destinationIndex: overIndex,
          })
        );
      }
    }
  };

  // Handle item edit
  const handleItemEdit = (
    id: number,
    field: string,
    value: string,
    previewUrl?: string
  ) => {
    if (field === "left") {
      dispatch(updateMatchItem({ id, side: "left", text: value }));
    } else if (field === "right") {
      dispatch(updateMatchItem({ id, side: "right", text: value }));
    } else if (field === "leftImage") {
      dispatch(setMatchItemLeftImage({ id, url: value, previewUrl }));
    } else if (field === "rightImage") {
      dispatch(setMatchItemRightImage({ id, url: value, previewUrl }));
    } else if (field === "leftAudio") {
      dispatch(setMatchItemLeftAudio({ id, url: value, previewUrl }));
    } else if (field === "rightAudio") {
      dispatch(setMatchItemRightAudio({ id, url: value, previewUrl }));
    }
  };

  // Sort items by position
  const sortedItems = [...matchItems].sort((a, b) => a.position - b.position);

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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedItems.map((item) => item.id.toString())}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Prompts (top row) */}
            {sortedItems.map((item, index) => (
              <SortableItem
                key={item.id}
                item={item}
                index={index}
                onEdit={handleItemEdit}
                onRemove={(id: number) =>
                  matchItems.length > 3 && dispatch(removeMatchItem(id))
                }
              />
            ))}

            {/* Add new pair button */}
            {matchItems.length < 5 && (
              <div
                onClick={() => dispatch(addMatchItem())}
                className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center h-[162px] bg-transparent hover:bg-gray-100 cursor-pointer"
              >
                <LucidePlus className="h-6 w-6" />
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-3">
        {/* Answers (bottom row) */}
        {sortedItems.map((item, index) => (
          <div
            key={`answer-${item.id}`}
            className={`${ITEM_COLORS_DARK[index % ITEM_COLORS_DARK.length]
              } rounded-lg p-3 relative`}
          >
            <MathInput
              value={item.rightText}
              onChange={(value) =>
                handleItemEdit(item.id, "right", value, undefined)
              }
              placeholder={t("rightSide")}
              className="mb-2"
              size="sm"
            />
            <ItemMediaUpload
              onImageSelect={(url, previewUrl) =>
                handleItemEdit(item.id, "rightImage", url, previewUrl)
              }
              onAudioSelect={(url: string, previewUrl?: string) => {
                handleItemEdit(item.id, "rightAudio", url, previewUrl);
              }}
              currentImage={item.rightImage}
              currentImagePreview={item.rightImagePreview}
              currentAudio={item.rightAudio}
            />
          </div>
        ))}

        {/* Empty space to align with the add button in the top row */}
        {matchItems.length < 5 && <div className="h-[162px]"></div>}
      </div>
    </>
  );
});