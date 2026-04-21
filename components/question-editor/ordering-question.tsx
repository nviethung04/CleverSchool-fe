"use client";

import { Button } from "@/components/ui/button";
import { LucideGripVertical, LucideTrash2, LucidePlus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { useTranslations } from "next-intl";
import {
  setQuestionText,
  updateOrderItem,
  addOrderItem,
  removeOrderItem,
  reorderOrderItems,
  setOrderDirection,
  setOrderItemImage,
  addOrderGroup,
  updateOrderGroup,
  removeOrderGroup,
  setOrderItemAudio,
  setOrderItemVideo,
  setDisplay,
} from "@/lib/redux/question-slice";
import { QuestionMediaControls } from "./question-media-controls";
import { QuestionMediaPreview } from "./question-media-preview";
import { ItemMediaUpload } from "./item-media-upload";
import { useEffect, useRef, forwardRef } from "react";
import { getColorByIndex } from "@/utils/question-colors";
import { TiptapMathEditor } from "./tiptap-math-editor";
import { MathInput } from "./math-input";
import React from "react";

// Import dnd-kit
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
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Define fixed colors for order items
const ITEM_COLORS_DARK = [
  "bg-blue-700",
  "bg-yellow-700",
  "bg-green-700",
  "bg-pink-700",
  "bg-purple-700",
  "bg-indigo-700",
  "bg-teal-700",
  "bg-orange-700",
  "bg-rose-700",
  "bg-cyan-700",
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
  const t = useTranslations("questionEditor.ordering");
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: item.id.toString(),
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleItemImageSelect = (url: string, previewUrl?: string) => {
    onEdit(item.id, "image", url, previewUrl);
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
        value={item.text}
        onChange={(value) => onEdit(item.id, "text", value)}
        placeholder={t("item")}
        className="mb-2"
        size="sm"
      />
      <ItemMediaUpload
        onImageSelect={handleItemImageSelect}
        currentImage={item.image}
        currentImagePreview={item.imagePreview}
      />
    </div>
  );
}

// Dropzone cho answer
interface AnswerDropZoneProps {
  item: any;
  group: any | null;
}
function AnswerDropZone({ item, group }: AnswerDropZoneProps) {
  const t = useTranslations("questionEditor.ordering");
  const { setNodeRef, isOver } = useDroppable({ id: `answer-${item.id}` });
  // Chuyển bg-... sang border-... để dùng cho border
  const borderColor = item.color ? item.color.replace("bg-", "border-") : "";
  return (
    <div
      ref={setNodeRef}
      className={`relative transition-all border-2 rounded-lg min-h-[120px] flex flex-col items-center justify-center bg-white ${borderColor} ${isOver ? "ring-2 ring-purple-500" : "border-dashed border-gray-300"
        }`}
    >
      {group ? (
        <div className="w-full flex flex-col items-center">
          {group.text && (
            <div className="font-semibold text-center mb-1">{group.text}</div>
          )}
          {group.image && (
            <img src={group.image} alt="group-img" className="max-h-16 mb-1" />
          )}
          {group.audio && <audio controls src={group.audio} className="mb-1" />}
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
}

// Group Item Component (giống answer cũ, cho phép nhập text, media, xóa)
function GroupItem({
  item,
  index,
  onEdit,
  onRemove,
}: {
  item: any;
  index: number;
  onEdit: (
    id: number,
    field: string,
    value: string,
    previewUrl?: string
  ) => void;
  onRemove: (id: number) => void;
  disableRemove?: boolean;
}) {
  const t = useTranslations("questionEditor.ordering");
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: `group-${item.id}` });
  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
  };
  const handleItemImageSelect = (url: string, previewUrl?: string) => {
    onEdit(item.id, "image", url, previewUrl);
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg p-3 relative mb-2 border-2 ${item.color} border-2`}
    >
      <div className="flex justify-between mb-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-red-600 hover:text-red-700 h-7 w-7"
          onClick={() => onRemove(item.id)}
          disabled={item.disableRemove}
        >
          <LucideTrash2 className="h-4 w-4" />
        </Button>
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab flex items-center ml-2 text-purple-700 hover:text-purple-900"
          tabIndex={-1}
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <LucideGripVertical className="h-5 w-5" />
        </div>
      </div>
      <MathInput
        value={item.text}
        onChange={(value) => onEdit(item.id, "text", value)}
        placeholder={`${t("groupPlaceholder")} #${index + 1}`}
        className="mb-2"
        size="sm"
      />
      <ItemMediaUpload
        onImageSelect={handleItemImageSelect}
        onAudioSelect={(url: string, previewUrl?: string) => {
          onEdit(item.id, "audio", url, previewUrl);
        }}
        currentImage={item.image}
        currentImagePreview={item.imagePreview}
        currentAudio={item.audio}
      />
    </div>
  );
}

export const OrderingQuestion = forwardRef(function OrderingQuestion(
  props: {},
  ref
) {
  const dispatch = useAppDispatch();
  const t = useTranslations("questionEditor.ordering");
  const { questionText, orderItems, orderGroups, orderDirection, display } =
    useAppSelector((state) => state.question);

  // DnD-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group logic
  const MAX_GROUPS = 15;
  const MAX_ANSWERS = 15;
  const handleAddGroup = () => {
    if (orderGroups.length < MAX_GROUPS) dispatch(addOrderGroup());
  };
  const handleRemoveGroup = (id: number) => {
    if (orderGroups.length > 1) dispatch(removeOrderGroup(id));
  };
  const handleEditGroup = (
    id: number,
    field: string,
    value: string,
    previewUrl?: string
  ) => {
    if (field === "text") dispatch(updateOrderGroup({ id, text: value }));
    if (field === "image") dispatch(updateOrderGroup({ id, image: value }));
    if (field === "audio") dispatch(updateOrderGroup({ id, audio: value }));
  };

  // Xử lý drop group vào answer (dùng cho dragEnd)
  const handleDropGroupToAnswer = (answerId: number, groupIdx: number) => {
    const group = orderGroups[groupIdx];
    const answer = orderItems.find((item) => item.id === answerId);
    if (group && answer) {
      dispatch(
        updateOrderItem({
          id: answer.id,
          text: group.text,
          groupPosition: groupIdx,
          color: group.color,
        })
      );
      if (group.image) {
        dispatch(setOrderItemImage({ id: answer.id, url: group.image }));
      }
      if (group.audio) {
        dispatch(setOrderItemAudio({ id: answer.id, url: group.audio }));
      }
      if (group.video) {
        dispatch(setOrderItemVideo({ id: answer.id, url: group.video }));
      }
    }
  };

  // Sort answer theo position
  const sortedAnswers = [...orderItems].sort((a, b) => a.position - b.position);

  // DnD: handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    // Nếu kéo group vào answer
    if (
      String(active.id).startsWith("group-") &&
      String(over.id).startsWith("answer-")
    ) {
      const groupId = Number(String(active.id).replace("group-", ""));
      const answerId = Number(String(over.id).replace("answer-", ""));
      const groupIdx = orderGroups.findIndex((g) => g.id === groupId);
      if (groupIdx !== -1) {
        handleDropGroupToAnswer(answerId, groupIdx);
      }
    }
  };

  // Answer logic
  const handleAddAnswer = () => {
    if (orderItems.length < MAX_ANSWERS) dispatch(addOrderItem());
  };
  const handleRemoveAnswer = (id: number) => {
    if (orderItems.length > 3) dispatch(removeOrderItem(id));
  };

  return (
    <>
      {/* 1. Câu hỏi */}
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
      {/* 2. Group */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <span className="font-semibold mr-2">{t("groupLabel")}</span>
            {orderGroups.length < MAX_GROUPS && (
              <Button size="sm" variant="outline" onClick={handleAddGroup}>
                + {t("addGroup")}
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {orderGroups.map((item, idx) => (
              <GroupItem
                key={item.id}
                item={{ ...item, disableRemove: orderGroups.length <= 1 }}
                index={idx}
                onEdit={handleEditGroup}
                onRemove={handleRemoveGroup}
              />
            ))}
          </div>
        </div>
        {/* 3. Answer */}
        <div className="flex items-center mb-2 flex-wrap gap-2">
          <span className="font-semibold mr-2">{t("answersLabel")}</span>
          {orderItems.length < MAX_ANSWERS && (
            <Button
              size="sm"
              variant="outline"
              className="mr-4"
              onClick={handleAddAnswer}
            >
              + {t("addAnswer")}
            </Button>
          )}
          {/* Giao diện hiển thị */}
          <div className="flex items-center flex-wrap gap-2">
            <span className="font-semibold mr-2">{t("displayLayout")}</span>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className={`${display === "vertical"
                    ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                    : "border-blue-600 text-blue-600 hover:bg-blue-50"
                  }`}
                onClick={() => dispatch(setDisplay("vertical"))}
              >
                {t("vertical")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`${display === "horizontal"
                    ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                    : "border-blue-600 text-blue-600 hover:bg-blue-50"
                  }`}
                onClick={() => dispatch(setDisplay("horizontal"))}
              >
                {t("horizontal")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`${display === "word_count"
                    ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                    : "border-blue-600 text-blue-600 hover:bg-blue-50"
                  }`}
                onClick={() => dispatch(setDisplay("word_count"))}
              >
                {t("wordCount")}
              </Button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {sortedAnswers.map((item) => {
            const group =
              item.groupPosition !== undefined &&
                item.groupPosition !== null &&
                orderGroups[item.groupPosition]
                ? orderGroups[item.groupPosition]
                : null;
            return (
              <div className="relative" key={item.id}>
                <AnswerDropZone item={item} group={group} />
                {orderItems.length > 3 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 z-10 text-red-600 hover:text-red-700"
                    onClick={() => handleRemoveAnswer(item.id)}
                  >
                    <LucideTrash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </DndContext>
      {/* Số thứ tự */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-3">
        {sortedAnswers.map((item, index) => (
          <div
            key={`number-${item.id}`}
            className={`bg-gray-200 rounded-lg p-3 flex items-center justify-center`}
          >
            <div className="text-gray-700 text-2xl font-bold">
              {orderDirection === "ascending"
                ? index + 1
                : sortedAnswers.length - index}
            </div>
          </div>
        ))}
      </div>
      <div className="flex mt-4 flex-wrap gap-2 md:gap-4">
        <Button
          variant="outline"
          className={`w-full md:w-auto ${orderDirection === 'ascending'
              ? 'bg-purple-900 text-white border-purple-800 hover:bg-purple-800'
              : 'border-purple-800 text-purple-900 hover:bg-purple-100'
            }`}
          onClick={() => dispatch(setOrderDirection("ascending"))}
        >
          {t("ascending")}
        </Button>
        <Button
          variant="outline"
          className={`w-full md:w-auto ${orderDirection === 'descending'
              ? 'bg-purple-900 text-white border-purple-800 hover:bg-purple-800'
              : 'border-purple-800 text-purple-900 hover:bg-purple-100'
            }`}
          onClick={() => dispatch(setOrderDirection("descending"))}
        >
          {t("descending")}
        </Button>
      </div>
    </>
  );
});
