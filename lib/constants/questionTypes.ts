import {
  ListFilter,
  Layers,
  PenTool,
  Shuffle,
  MoveHorizontal,
} from "lucide-react";

export const QUESTION_TYPES = {
  multiple_choice: {
    name: "Multiple choice", // default English; prefer i18n via questionBank.type.multiple_choice
    icon: ListFilter,
    color: "bg-blue-100 text-blue-600",
  },
  fill_in_blanks: {
    name: "Fill in blanks",
    icon: PenTool,
    color: "bg-purple-100 text-purple-600",
  },
  matching: {
    name: "Matching",
    icon: Layers,
    color: "bg-green-100 text-green-600",
  },
  ordering: {
    name: "Ordering",
    icon: Shuffle,
    color: "bg-amber-100 text-amber-600",
  },
  drag_drop: {
    name: "Drag & drop",
    icon: MoveHorizontal,
    color: "bg-cyan-100 text-cyan-600",
  },
};

// Difficulty levels
export const DIFFICULTY_LEVELS = {
  easy: {
    name: "Easy",
    color: "bg-green-100 text-green-600",
  },
  medium: {
    name: "Medium",
    color: "bg-yellow-100 text-yellow-600",
  },
  hard: {
    name: "Hard",
    color: "bg-red-100 text-red-600",
  },
};

// Categories
export const CATEGORIES = {
  grammar: {
    name: "Grammar",
    color: "bg-blue-50 text-blue-600",
  },
  vocabulary: {
    name: "Vocabulary",
    color: "bg-green-50 text-green-600",
  },
  listening: {
    name: "Listening",
    color: "bg-purple-50 text-purple-600",
  },
  reading: {
    name: "Reading",
    color: "bg-amber-50 text-amber-600",
  },
  writing: {
    name: "Writing",
    color: "bg-indigo-50 text-indigo-600",
  },
  speaking: {
    name: "Speaking",
    color: "bg-rose-50 text-rose-600",
  },
  "general-knowledge": {
    name: "General knowledge",
    color: "bg-gray-50 text-gray-600",
  },
};

export const mapQuestionType = (apiType: string): string => {
  const typeMap: Record<string, string> = {
    multiple_choice: "multiple_choice",
    fill_in_blanks: "fill_in_blanks",
    ordering: "ordering",
    matching: "matching",
    drag_drop: "drag_drop",
    labeling: "labeling",
    category: "category",
    speaking: "speaking",
    writing: "writing",
  };
  return typeMap[apiType] || apiType;
};

// Helper function to get question types for dropdowns (localized if translator provided)
export const getQuestionTypeOptions = (
  t?: (key: string, vars?: Record<string, string | number>) => string
) => [
  { id: "all", name: t ? t("allTypes") : "All types" },
  ...Object.entries(QUESTION_TYPES).map(([id, { name }]) => ({
    id,
    name: t ? t(`type.${id}`) : name,
  })),
];

// Single-label helpers (optional convenience)
export const getQuestionTypeLabel = (
  id: string,
  t?: (key: string, vars?: Record<string, string | number>) => string
) =>
  t
    ? t(`type.${id}`)
    : QUESTION_TYPES[id as keyof typeof QUESTION_TYPES]?.name || id;

export const getDifficultyLabel = (
  level: string,
  t?: (key: string, vars?: Record<string, string | number>) => string
) =>
  t
    ? t(`level.${level}`)
    : DIFFICULTY_LEVELS[level as keyof typeof DIFFICULTY_LEVELS]?.name || level;

export const getCategoryLabel = (
  categoryId: string,
  t?: (key: string, vars?: Record<string, string | number>) => string
) =>
  t
    ? t(`categoryNames.${categoryId}`)
    : CATEGORIES[categoryId as keyof typeof CATEGORIES]?.name || categoryId;
