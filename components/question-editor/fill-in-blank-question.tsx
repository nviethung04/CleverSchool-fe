"use client";

import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { useTranslations } from "next-intl";
import {
  setQuestionText,
  updateBlankAnswer,
  addBlankGroup,
  updateBlankGroup,
  removeBlankGroup,
  updateBlankAnswerGroup,
} from "@/lib/redux/question-slice";
import { QuestionMediaControls } from "./question-media-controls";
import { QuestionMediaPreview } from "./question-media-preview";
import React, { forwardRef } from "react";
import { TiptapMathEditor } from "./tiptap-math-editor";
import { MathInput } from "./math-input";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
  useDraggable,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LucideGripVertical, LucideTrash2, LucidePlus } from "lucide-react";

// Define fixed colors for blanks
const BLANK_COLORS = [
  "bg-blue-500",
  "bg-yellow-500",
  "bg-green-500",
  "bg-pink-500",
  "bg-purple-500",
];

// Memo GroupItem, chỉ truyền drag vào icon
const GroupItem = React.memo(function GroupItem({
  item,
  index,
  onEdit,
  onRemove,
  disableRemove,
}: any) {
  const t = useTranslations("questionEditor.fillInBlank");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `group-${item.id}` });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
    minHeight: 80,
    background: isDragging ? "#f3e8ff" : undefined,
  };
  return (
    <div
      style={style}
      className={`rounded-lg p-3 relative mb-2 border-2 ${item.color} flex flex-col justify-between select-none`}
      data-group-id={item.id}
    >
      <div className="flex justify-between mb-2 items-center">
        <button
          className="text-red-600 hover:text-red-700 h-7 w-7"
          onClick={() => onRemove(item.id)}
          disabled={disableRemove}
        >
          <LucideTrash2 className="h-4 w-4" />
        </button>
        {/* Icon drag là phần tử độc lập, chỉ truyền ref/listeners vào đây */}
        <span
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          className="cursor-grab flex items-center ml-2 text-purple-700 hover:text-purple-900 bg-transparent border-none p-0"
          tabIndex={-1}
          style={{ WebkitTapHighlightColor: "transparent" }}
          aria-label="Kéo nhóm"
        >
          <LucideGripVertical className="h-5 w-5" />
        </span>
      </div>
      <MathInput
        value={item.text}
        onChange={(value) => onEdit(item.id, "text", value)}
        placeholder={`${t("groupLabel")} #${index + 1}`}
        className="mb-2"
        size="sm"
      />
      {/* Có thể bổ sung media upload ở đây nếu muốn */}
    </div>
  );
});

export const FillInBlankQuestion = forwardRef(function FillInBlankQuestion(
  props: {},
  ref
) {
  const dispatch = useAppDispatch();
  const t = useTranslations("questionEditor.fillInBlank");
  const { questionText, blankAnswers, blankGroups } = useAppSelector(
    (state) => state.question
  );
  const [activeGroupId, setActiveGroupId] = React.useState<string | null>(null);

  // DnD-kit sensors
  const sensors = useSensors(useSensor(PointerSensor));

  // Xử lý kéo thả group vào answer
  const handleDropGroupToAnswer = (answerId: number, groupIdx: number) => {
    dispatch(updateBlankAnswerGroup({ answerId, groupPosition: groupIdx }));
  };

  // DnD: handle drag start/end
  const handleDragStart = (event: any) => {
    if (String(event.active.id).startsWith("group-")) {
      setActiveGroupId(String(event.active.id));
    }
  };
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveGroupId(null);
    const { active, over } = event;
    if (!over) return;
    if (
      String(active.id).startsWith("group-") &&
      String(over.id).startsWith("answer-")
    ) {
      const groupId = Number(String(active.id).replace("group-", ""));
      const answerId = Number(String(over.id).replace("answer-", ""));
      const groupIdx = blankGroups.findIndex((g) => g.id === groupId);
      if (groupIdx !== -1) {
        handleDropGroupToAnswer(answerId, groupIdx);
      }
    }
  };

  // DragOverlay content
  const activeGroup =
    activeGroupId && blankGroups.length > 0
      ? blankGroups.find((g) => `group-${g.id}` === activeGroupId)
      : null;

  // Answer Dropzone
  function AnswerDropZone({ item, group }: any) {
    const { setNodeRef, isOver } = useDroppable({ id: `answer-${item.id}` });
    return (
      <div
        ref={setNodeRef}
        className={`relative transition-all border-2 rounded-lg min-h-[60px] flex flex-col items-center justify-center bg-white ${isOver ? "ring-2 ring-purple-500" : "border-dashed border-gray-300"
          }`}
      >
        {group ? (
          <div className="w-full flex flex-col items-center">
            <div className="font-semibold text-center mb-1">{group.text}</div>
            {/* Hiển thị media nếu có */}
          </div>
        ) : (
          <div className="text-gray-400 text-center select-none p-2">
            {t("assignToGroup")}
          </div>
        )}
      </div>
    );
  }

  // Xử lý thêm/xóa/sửa group
  const handleAddGroup = () => {
    dispatch(addBlankGroup());
  };
  const handleRemoveGroup = (id: number) => {
    dispatch(removeBlankGroup(id));
  };
  const handleEditGroup = (id: number, field: string, value: string) => {
    if (field === "text") dispatch(updateBlankGroup({ id, text: value }));
  };

  return (
    <>
      {/* 1. Nhập câu hỏi */}
      <div className="bg-purple-900 rounded-lg p-4 mb-4">
        <QuestionMediaControls className="mb-2" />
        <div className="text-white text-sm mb-2">{t("questionText")}</div>
        <TiptapMathEditor
          ref={ref}
          value={questionText}
          onChange={(val) => dispatch(setQuestionText(val))}
          placeholder="Nhập câu hỏi vào đây. Ví dụ: Thủ đô của Việt Nam là [blank]. Hỗn hợp text + công thức toán ($...$ hoặc $$...$$)"
        />
        <QuestionMediaPreview />
      </div>
      {/* 2. Đáp án (answer) */}
      {blankAnswers.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
            <h3 className="text-lg font-medium mb-4">{t("answersTitle")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {blankAnswers.map((item, idx) => {
                const groupPosition = (item as any).groupPosition;
                const group =
                  groupPosition !== undefined &&
                    groupPosition !== null &&
                    blankGroups[groupPosition]
                    ? blankGroups[groupPosition]
                    : null;
                return (
                  <AnswerDropZone key={item.id} item={item} group={group} />
                );
              })}
            </div>
          </div>
          {/* 3. Group section */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <span className="font-semibold mr-2">{t("groupLabel")}</span>
              <button
                className="ml-2 px-2 py-1 border rounded text-sm"
                onClick={handleAddGroup}
              >
                <LucidePlus className="inline h-4 w-4 mr-1" /> {t("addGroup")}
              </button>
            </div>
            <SortableContext
              items={blankGroups.map((g) => `group-${g.id}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 min-h-[90px]">
                {blankGroups.map((item, idx) => (
                  <GroupItem
                    key={item.id}
                    item={{ ...item, disableRemove: blankGroups.length <= 1 }}
                    index={idx}
                    onEdit={handleEditGroup}
                    onRemove={handleRemoveGroup}
                    disableRemove={blankGroups.length <= 1}
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
      ) : (
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center text-gray-500">
          <p>{t("hintAddBlank")}</p>
        </div>
      )}
    </>
  );
});