"use client";

import { useState, useRef, forwardRef } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { useTranslations } from "next-intl";
import {
  updateCategoryName,
  addCategoryItem,
  updateCategoryItem,
  removeCategoryItem,
  moveCategoryItem,
  setCategoryImage,
  setCategoryItemImage,
  setQuestionText,
  addCategory,
  removeCategory,
  setCategoryItemAudio,
  setCategoryAudio,
} from "@/lib/redux/question-slice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LucideGripVertical, LucideX, LucidePlus } from "lucide-react";
import { QuestionMediaControls } from "./question-media-controls";
import { QuestionMediaPreview } from "./question-media-preview";
import { ItemMediaUpload } from "./item-media-upload";
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { TiptapMathEditor } from "./tiptap-math-editor";
import { TiptapMathViewer } from "./tiptap-math-viewer";
import { MathInput } from "./math-input";

// Define fixed colors for categories
const CATEGORY_COLORS = [
  "bg-blue-500",
  "bg-yellow-500",
  "bg-green-500",
  "bg-pink-500",
  "bg-purple-500",
];

// Category Item component for the editor
const CategoryItem = ({
  id,
  text,
  categoryId,
  image,
  imagePreview,
  audio,
  audioPreview,
}: {
  id: number;
  text: string;
  categoryId: number;
  image?: string;
  imagePreview?: string;
  audio?: string;
  audioPreview?: string;
}) => {
  const t = useTranslations("questionEditor.category");
  const dispatch = useAppDispatch();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `item-${id}`,
    data: {
      type: "item",
      id,
      categoryId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleItemImageSelect = (url: string, previewUrl?: string) => {
    dispatch(setCategoryItemImage({ id, url, previewUrl }));
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col gap-2 p-2 sm:p-3 bg-white rounded-md border mb-2",
        isDragging ? "z-10 shadow-lg" : ""
      )}
    >
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab flex-shrink-0"
        >
          <LucideGripVertical className="h-4 w-4 text-gray-400" />
        </div>
        <div className="flex-grow min-w-0">
          <MathInput
            value={text}
            onChange={(value: string) =>
              dispatch(updateCategoryItem({ id, text: value }))
            }
            placeholder={t("item")}
            className="w-full"
            size="sm"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            dispatch(removeCategoryItem({ categoryId, itemId: id }))
          }
          className="h-8 w-8 text-gray-400 hover:text-red-500 flex-shrink-0"
        >
          <LucideX className="h-4 w-4" />
        </Button>
      </div>
      <div className="ml-6 sm:ml-8">
        <ItemMediaUpload
          onImageSelect={handleItemImageSelect}
          onAudioSelect={(url: string, previewUrl?: string) => {
            dispatch(setCategoryItemAudio({ id, url, previewUrl }));
          }}
          currentImage={image}
          currentImagePreview={imagePreview}
          currentAudio={audio}
        />
      </div>
    </div>
  );
};

// Category component for the editor
const Category = ({
  id,
  name,
  color,
  items,
  image,
  imagePreview,
  audio,
  audioPreview,
  onRemove,
  canRemove,
}: {
  id: number;
  name: string;
  color: string;
  items: any[];
  image?: string;
  imagePreview?: string;
  audio?: string;
  audioPreview?: string;
  onRemove: () => void;
  canRemove: boolean;
}) => {
  const t = useTranslations("questionEditor.category");
  const dispatch = useAppDispatch();
  const [newItemText, setNewItemText] = useState("");

  const handleAddItem = () => {
    if (newItemText.trim()) {
      dispatch(addCategoryItem({ categoryId: id, text: newItemText }));
      setNewItemText("");
    }
  };

  const handleCategoryImageSelect = (url: string, previewUrl?: string) => {
    dispatch(setCategoryImage({ id, url, previewUrl }));
  };

  return (
    <div className={`rounded-md overflow-hidden`}>
      <div className={`${color} p-4 text-white`}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 flex flex-col sm:flex-row flex-wrap sm:items-center gap-2">
            <MathInput
              value={name}
              onChange={(value: string) =>
                dispatch(updateCategoryName({ id, name: value }))
              }
              placeholder={t("categoryName")}
              className="bg-white/20 border-0 text-white placeholder-white/70 flex-1 [&_input]:text-white [&_input]:placeholder-white/70 [&_input]:bg-transparent"
              size="sm"
              inline
            />
            <ItemMediaUpload
              onImageSelect={handleCategoryImageSelect}
              onAudioSelect={(url: string, previewUrl?: string) => {
                dispatch(setCategoryAudio({ id, url, previewUrl }));
              }}
              currentImage={image}
              currentImagePreview={imagePreview}
              currentAudio={audio}
              hidePreview
            />
          </div>
          {canRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/20 flex-shrink-0"
            >
              <LucideX className="h-4 w-4" />
            </Button>
          )}
        </div>
        {(image || audio) && (
          <div className="mt-3 bg-white/10 rounded-md p-3">
            {image && (
              <div className="mb-3 relative">
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 rounded-full z-10"
                  onClick={() =>
                    dispatch(setCategoryImage({ id, url: "", previewUrl: "" }))
                  }
                >
                  <LucideX className="h-4 w-4" />
                </Button>
                <img
                  src={imagePreview || image}
                  alt="Category"
                  className="w-full h-auto max-h-[220px] object-contain rounded"
                />
              </div>
            )}
            {audio && (
              <div className="relative">
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 rounded-full z-10"
                  onClick={() =>
                    dispatch(setCategoryAudio({ id, url: "", previewUrl: "" }))
                  }
                >
                  <LucideX className="h-4 w-4" />
                </Button>
                <audio controls className="w-full">
                  <source src={audio} />
                </audio>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="bg-purple-950 p-4 min-h-[200px]">
        {items.map((item) => (
          <CategoryItem
            key={item.id}
            id={item.id}
            text={item.text}
            categoryId={id}
            image={item.image}
            imagePreview={item.imagePreview}
            audio={item.audio}
            audioPreview={item.audioPreview}
          />
        ))}

        <Button
          variant="ghost"
          className="w-full flex items-center justify-center gap-2 text-white/70 hover:text-white hover:bg-white/10"
          onClick={() =>
            dispatch(addCategoryItem({ categoryId: id, text: "" }))
          }
        >
          <LucidePlus className="h-4 w-4" />
          <span>{t("addItem")}</span>
        </Button>
      </div>
    </div>
  );
};

// Preview Item component
const PreviewItem = ({
  id,
  text,
  color,
  image,
}: {
  id: number;
  text: string;
  color: string;
  image?: string;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `preview-item-${id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 bg-white rounded-md border mb-2 cursor-grab",
        isDragging ? "z-10 shadow-lg" : ""
      )}
      {...attributes}
      {...listeners}
    >
      <LucideGripVertical className="h-4 w-4 text-gray-400" />
      <div className="flex-1">
        <TiptapMathViewer value={text} className="text-sm" />
      </div>
      {image && (
        <div className="w-8 h-8 overflow-hidden rounded">
          <img
            src={image || "/placeholder.svg"}
            alt={text}
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
};

// Preview Category component
const PreviewCategory = ({
  id,
  name,
  color,
  items,
  image,
}: {
  id: number;
  name: string;
  color: string;
  items: any[];
  image?: string;
}) => {
  const dispatch = useAppDispatch();
  return (
    <div className={`rounded-md overflow-hidden`}>
      <div
        className={`${color} p-4 text-white text-center font-medium flex items-center justify-center gap-2`}
      >
        <div className="flex-1">
          <TiptapMathViewer
            value={name || "Category"}
            className="text-white text-sm"
          />
        </div>
        {image && (
          <div className="w-6 h-6 overflow-hidden rounded">
            <img
              src={image || "/placeholder.svg"}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
      <div className="bg-purple-950 p-4 min-h-[200px]">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-2 bg-white rounded-md border mb-2 flex items-center"
          >
            <div className="flex-1">
              <TiptapMathViewer value={item.text} className="text-sm" />
            </div>
            {item.image && (
              <div className="w-8 h-8 overflow-hidden rounded">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.text}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CategoryQuestion = forwardRef(function CategoryQuestion(
  props: {},
  ref
) {
  const dispatch = useAppDispatch();
  const t = useTranslations("questionEditor.category");
  const { questionText, categories } = useAppSelector(
    (state) => state.question
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeData, setActiveData] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setActiveData(event.active.data.current);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setActiveData(null);

    const { active, over } = event;

    if (!over) return;

    // Extract the data from the IDs
    const activeIdParts = (active.id as string).split("-");
    const overIdParts = (over.id as string).split("-");

    if (activeIdParts[0] === "item" && overIdParts[0] === "category") {
      const itemId = Number.parseInt(activeIdParts[1]);
      const sourceCategoryId = (active.data.current as any).categoryId;
      const targetCategoryId = Number.parseInt(overIdParts[1]);

      if (sourceCategoryId !== targetCategoryId) {
        dispatch(
          moveCategoryItem({
            itemId,
            sourceCategoryId,
            targetCategoryId,
          })
        );
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    // Extract the data from the IDs
    const activeIdParts = (active.id as string).split("-");
    const overIdParts = (over.id as string).split("-");

    if (activeIdParts[0] === "item" && overIdParts[0] === "item") {
      const activeItemId = Number.parseInt(activeIdParts[1]);
      const overItemId = Number.parseInt(overIdParts[1]);

      const activeItem = categories
        .flatMap((cat) => cat.items)
        .find((item) => item.id === activeItemId);
      const overItem = categories
        .flatMap((cat) => cat.items)
        .find((item) => item.id === overItemId);

      if (
        activeItem &&
        overItem &&
        activeItem.categoryId !== overItem.categoryId
      ) {
        dispatch(
          moveCategoryItem({
            itemId: activeItemId,
            sourceCategoryId: activeItem.categoryId,
            targetCategoryId: overItem.categoryId,
          })
        );
      }
    }
  };

  // Get all items for the preview
  const allItems = categories
    .flatMap((cat) =>
      cat.items.map((item) => ({
        ...item,
        color: categories.find((c) => c.id === item.categoryId)?.color || "",
      }))
    )
    .filter((item) => item.text.trim() !== "");

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

      {/* Categories */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="mb-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 gap-3">
            <h3 className="text-lg font-medium">
              {t("categoriesTitle", { count: categories.length })}
            </h3>
            {categories.length < 5 && (
              <Button
                onClick={() => {
                  dispatch(addCategory());
                  setTimeout(() => {
                    (document.activeElement as HTMLElement)?.blur(); // force re-render/focus loss for UI update
                  }, 10);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white w-full lg:w-auto"
              >
                <LucidePlus className="h-4 w-4 mr-1" />
                {t("addCategory")}
              </Button>
            )}
          </div>
        </div>

        <div
          className={`grid gap-4 ${categories.length === 1
              ? "grid-cols-1"
              : categories.length === 2
                ? "grid-cols-1 lg:grid-cols-2"
                : categories.length === 3
                  ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
                  : categories.length >= 4
                    ? "grid-cols-1 xl:grid-cols-2 2xl:grid-cols-4"
                    : "grid-cols-1"
            }`}
        >
          {categories.map((category, index) => (
            <SortableContext
              key={`category-${category.id}`}
              id={`category-${category.id}`}
              items={category.items.map((item) => `item-${item.id}`)}
              strategy={verticalListSortingStrategy}
            >
              <div
                id={`category-${category.id}`}
                data-category-id={category.id}
              >
                <Category
                  id={category.id}
                  name={category.name}
                  color={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                  items={category.items}
                  image={category.image}
                  imagePreview={category.imagePreview}
                  audio={category.audio}
                  audioPreview={category.audioPreview}
                  onRemove={() => dispatch(removeCategory(category.id))}
                  canRemove={categories.length > 1}
                />
              </div>
            </SortableContext>
          ))}
        </div>
      </DndContext>

      {/* Preview */}
      <div className="mt-8 border-t pt-6">
        <h3 className="text-lg font-medium mb-4">{t("previewTitle")}</h3>

        <div className="bg-purple-950 rounded-lg p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row justify-between items-center mb-4 gap-2">
            <div className="text-white/70 text-sm">0/0</div>
            <TiptapMathViewer
              className="text-white/80 text-sm text-center"
              value={questionText || t("connectCorrectAnswers")}
            />
            <div></div>
          </div>

          <div
            className="grid gap-3 lg:gap-4 overflow-x-auto"
            style={{
              gridTemplateColumns: `repeat(${allItems.length > 0
                  ? Math.min(
                    categories.filter((cat) => cat.name.trim() !== "")
                      .length + 1,
                    5
                  )
                  : Math.min(categories.length, 5)
                }, minmax(200px, 1fr))`,
            }}
          >
            {allItems.length > 0 && (
              <div className="bg-purple-950 rounded-md p-3 lg:p-4 min-w-[200px]">
                <div className="text-white text-sm mb-2">
                  Options ({allItems.length})
                </div>

                <SortableContext
                  items={allItems.map((item) => `preview-item-${item.id}`)}
                  strategy={verticalListSortingStrategy}
                >
                  {allItems.map((item) => (
                    <PreviewItem
                      key={`preview-${item.id}`}
                      id={item.id}
                      text={item.text}
                      color={item.color}
                      image={item.image}
                    />
                  ))}
                </SortableContext>
              </div>
            )}

            {categories
              .filter((cat) => cat.name.trim() !== "")
              .map((category, index) => (
                <PreviewCategory
                  key={`preview-category-${category.id}`}
                  id={category.id}
                  name={category.name}
                  color={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                  items={[]}
                  image={category.image}
                />
              ))}
          </div>
        </div>
      </div>
    </>
  );
});

export default CategoryQuestion;