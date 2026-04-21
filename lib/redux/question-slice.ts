import {
  createSlice,
  type PayloadAction,
  createAction,
} from "@reduxjs/toolkit";
import { getColorByIndex, getDarkColorByIndex } from "@/utils/question-colors";

// Multiple Choice
interface AnswerOption {
  id: number;
  text: string;
  isCorrect: boolean;
  color: string;
  image?: string;
  imagePreview?: string;
  audio?: string;
  audioPreview?: string;
  video?: string;
  videoPreview?: string;
}

// Fill in Blank
interface BlankAnswer {
  id: number;
  text: string;
  image?: string;
  imagePreview?: string;
  audio?: string;
  audioPreview?: string;
  video?: string;
  videoPreview?: string;
  position?: number;
  groupPosition?: number | null;
}

// Ordering
interface OrderGroup {
  id: number; // chỉ dùng nội bộ, không gửi lên API
  text: string;
  color: string;
  image?: string;
  imagePreview?: string;
  audio?: string;
  audioPreview?: string;
  video?: string;
  videoPreview?: string;
  position: number; // index của group
}

interface OrderItem {
  id: number;
  text: string;
  color: string;
  image?: string;
  imagePreview?: string;
  audio?: string;
  audioPreview?: string;
  video?: string;
  videoPreview?: string;
  position: number;
  groupPosition: number | null; // index của group (bắt đầu từ 0)
}

// Matching
interface MatchItem {
  id: number;
  leftId?: string;
  rightId?: string;
  leftText: string;
  rightText: string;
  color: string;
  leftImage?: string;
  leftImagePreview?: string;
  leftAudio?: string;
  leftAudioPreview?: string;
  leftVideo?: string;
  leftVideoPreview?: string;
  rightImage?: string;
  rightImagePreview?: string;
  rightAudio?: string;
  rightAudioPreview?: string;
  rightVideo?: string;
  rightVideoPreview?: string;
  position: number;
}

// Drag and Drop
interface DragDropOption {
  id: number;
  text: string;
  isCorrect: boolean;
  correctPosition?: number;
  color: string;
  image?: string;
  imagePreview?: string;
  audio?: string;
  audioPreview?: string;
  video?: string;
  videoPreview?: string;
  groupPosition?: number | null; // index of group (start from 0)
}

// DragDropGroup (like OrderGroup)
interface DragDropGroup {
  id: number;
  text: string;
  color: string;
  image?: string;
  audio?: string;
  video?: string;
  position: number; // index of group
}

// Labeling
interface LabelPosition {
  id: number;
  labelId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  answer?: string; // sẽ lấy từ group nếu có groupPosition
  groupPosition?: number | null; // index của group trong labelGroups
  image?: string;
  imagePreview?: string;
}

interface LabelGroup {
  id: number;
  text: string;
}

interface LabelOption {
  id: number;
  text: string;
  isCorrect: boolean;
  image?: string;
  imagePreview?: string;
}

// Category
interface Category {
  id: number;
  name: string;
  color: string;
  image?: string;
  imagePreview?: string;
  audio?: string;
  audioPreview?: string;
  items: CategoryItem[];
}

interface CategoryItem {
  id: number;
  text: string;
  categoryId: number;
  image?: string;
  imagePreview?: string;
  audio?: string;
  audioPreview?: string;
}

// Interface BlankGroup
interface BlankGroup {
  id: number;
  text: string;
  color: string;
  image?: string;
  audio?: string;
  video?: string;
  position: number;
}

interface QuestionState {
  questionText: string;
  questionType: string;
  questionImage?: { type?: string; url?: string }[]
  questionImagePreview?: { type?: string; url?: string }[]
  questionAudio?: { type?: string; url?: string }[]
  questionAudioPreview?: { type?: string; url?: string }[]
  questionVideo?: { type?: string; url?: string }[]
  questionVideoPreview?: { type?: string; url?: string }[]

  // Multiple Choice
  allowMultipleAnswers: boolean;
  answerOptions: AnswerOption[];

  // Fill in Blank
  blankAnswers: BlankAnswer[];

  // Ordering
  orderItems: OrderItem[];
  orderGroups: OrderGroup[];
  orderDirection: "ascending" | "descending";
  display: "vertical" | "horizontal" | "word_count";

  // Matching
  matchItems: MatchItem[];

  // Drag and Drop
  dragDropOptions: DragDropOption[];
  dragDropGroups: DragDropGroup[];
  blankCount: number;

  // Labeling
  labelImage?: string;
  labelImagePreview?: string;
  labelPositions: LabelPosition[];
  labelOptions: LabelOption[];
  labelGroups: LabelGroup[];
  imageWidth?: number;
  imageHeight?: number;

  // Category
  categories: Category[];

  // General
  points: number;
  timeLimit: number;

  // Writing
  writingMaxCharacters: number;
  writingAllowImageUpload: boolean;
  writingInstructions: string;

  // Speaking
  speakingMaxDuration: number;
  speakingInstructions: string;

  // Blank Groups
  blankGroups: BlankGroup[];
}

// Removed old color arrays - now using getColorByIndex from utils

const initialState: QuestionState = {
  questionText: "",
  questionType: "multiple-choice",
  questionImage: undefined,
  questionImagePreview: undefined,
  questionAudio: undefined,
  questionAudioPreview: undefined,
  questionVideo: undefined,
  questionVideoPreview: undefined,

  // Multiple Choice
  allowMultipleAnswers: false,
  answerOptions: [
    { id: 1, text: "", isCorrect: false, color: getColorByIndex(0) },
    { id: 2, text: "", isCorrect: false, color: getColorByIndex(1) },
    { id: 3, text: "", isCorrect: false, color: getColorByIndex(2) },
    { id: 4, text: "", isCorrect: false, color: getColorByIndex(3) },
  ],

  // Fill in Blank
  blankAnswers: [
    { id: 1, text: "" },
    { id: 2, text: "" },
  ],

  // Ordering
  orderGroups: [
    { id: 1, text: "", color: getColorByIndex(0), position: 0 },
    { id: 2, text: "", color: getColorByIndex(1), position: 1 },
    { id: 3, text: "", color: getColorByIndex(2), position: 2 },
  ],
  orderItems: [
    {
      id: 1,
      text: "",
      color: getColorByIndex(0),
      position: 0,
      groupPosition: null,
    },
    {
      id: 2,
      text: "",
      color: getColorByIndex(1),
      position: 1,
      groupPosition: null,
    },
    {
      id: 3,
      text: "",
      color: getColorByIndex(2),
      position: 2,
      groupPosition: null,
    },
  ],
  orderDirection: "ascending",
  display: "vertical",

  // Matching
  matchItems: [
    {
      id: 1,
      leftText: "",
      rightText: "",
      color: getColorByIndex(0),
      position: 0,
    },
    {
      id: 2,
      leftText: "",
      rightText: "",
      color: getColorByIndex(1),
      position: 1,
    },
    {
      id: 3,
      leftText: "",
      rightText: "",
      color: getColorByIndex(2),
      position: 2,
    },
    {
      id: 4,
      leftText: "",
      rightText: "",
      color: getColorByIndex(3),
      position: 3,
    },
  ],

  // Drag and Drop
  dragDropOptions: [
    {
      id: 1,
      text: "",
      isCorrect: true,
      color: getColorByIndex(0),
      groupPosition: null,
    },
    {
      id: 2,
      text: "",
      isCorrect: true,
      color: getColorByIndex(1),
      groupPosition: null,
    },
    {
      id: 3,
      text: "",
      isCorrect: false,
      color: getColorByIndex(2),
      groupPosition: null,
    },
    {
      id: 4,
      text: "",
      isCorrect: false,
      color: getColorByIndex(3),
      groupPosition: null,
    },
  ],
  dragDropGroups: [
    { id: 1, text: "", color: getColorByIndex(0), position: 0 },
    { id: 2, text: "", color: getColorByIndex(1), position: 1 },
    { id: 3, text: "", color: getColorByIndex(2), position: 2 },
  ],
  blankCount: 1,

  // Labeling
  labelImage: undefined,
  labelImagePreview: undefined,
  labelPositions: [],
  labelOptions: [
    { id: 1, text: "", isCorrect: true },
    { id: 2, text: "", isCorrect: true },
    { id: 3, text: "", isCorrect: false },
    { id: 4, text: "", isCorrect: false },
  ],
  labelGroups: [],
  imageWidth: undefined,
  imageHeight: undefined,

  // Category
  categories: [
    { id: 1, name: "", color: getColorByIndex(0), items: [] },
    { id: 2, name: "", color: getColorByIndex(1), items: [] },
    { id: 3, name: "", color: getColorByIndex(2), items: [] },
    { id: 4, name: "", color: getColorByIndex(3), items: [] },
  ],

  // General
  points: 1,
  timeLimit: 1.5,

  // Writing
  writingMaxCharacters: 1000,
  writingAllowImageUpload: true,
  writingInstructions: "",

  // Speaking
  speakingMaxDuration: 30, // in seconds
  speakingInstructions: "",

  // Blank Groups
  blankGroups: [],
};

// Thêm các action mới
export const setQuestionImage = createAction<
  { 
    payload: {
      type: 'image' | 'audio' | 'video'
      url?: string
      previewUrl?: string
    },
    index?: number
  }
>("question/setQuestionImage");
export const setQuestionAudio = createAction<
  { 
    payload: {
      type: 'image' | 'audio' | 'video'
      url?: string
      previewUrl?: string
    },
    index?: number
  }
>("question/setQuestionAudio");
export const setQuestionVideo = createAction<
  { 
    payload: {
      type: 'image' | 'audio' | 'video'
      url?: string
      previewUrl?: string
    },
    index?: number
  }
>("question/setQuestionVideo");

// Actions cho các mục con
export const setAnswerOptionImage = createAction<{
  id: number;
  url: string;
  previewUrl?: string;
}>("question/setAnswerOptionImage");
export const setAnswerOptionAudio = createAction<{
  id: number;
  url: string;
  previewUrl?: string;
}>("question/setAnswerOptionAudio");
export const setAnswerOptionVideo = createAction<{
  id: number;
  url: string;
  previewUrl?: string;
}>("question/setAnswerOptionVideo");

export const setBlankAnswerImage = createAction<{
  id: number;
  url: string;
  previewUrl?: string;
}>("question/setBlankAnswerImage");
export const setBlankAnswerAudio = createAction<{
  id: number;
  url: string;
  previewUrl?: string;
}>("question/setBlankAnswerAudio");

export const setOrderItemImage = createAction<{
  id: number;
  url: string;
  previewUrl?: string;
}>("question/setOrderItemImage");
export const setOrderItemAudio = createAction<{
  id: number;
  url: string;
  previewUrl?: string;
}>("question/setOrderItemAudio");
export const setOrderItemVideo = createAction<{
  id: number;
  url: string;
  previewUrl?: string;
}>("question/setOrderItemVideo");

export const setMatchItemLeftImage = createAction<{
  id: number;
  url: string;
  previewUrl?: string;
}>("question/setMatchItemLeftImage");
export const setMatchItemLeftAudio = createAction<{
  id: number;
  url: string;
  previewUrl?: string;
}>("question/setMatchItemLeftAudio");
export const setMatchItemLeftVideo = createAction<{
  id: number;
  url: string;
  previewUrl?: string;
}>("question/setMatchItemLeftVideo");
export const setMatchItemRightImage = createAction<{
  id: number;
  url: string;
  previewUrl?: string;
}>("question/setMatchItemRightImage");
export const setMatchItemRightAudio = createAction<{
  id: number;
  url: string;
  previewUrl?: string;
}>("question/setMatchItemRightAudio");
export const setMatchItemRightVideo = createAction<{
  id: number;
  url: string;
  previewUrl?: string;
}>("question/setMatchItemRightVideo");

export const setDragDropOptionImage = createAction<{
  id: number;
  url: string;
  previewUrl?: string;
}>("question/setDragDropOptionImage");
export const setDragDropOptionAudio = createAction<{
  id: number;
  url: string;
  previewUrl?: string;
}>("question/setDragDropOptionAudio");
export const setDragDropOptionVideo = createAction<{
  id: number;
  url: string;
  previewUrl?: string;
}>("question/setDragDropOptionVideo");

export const setLabelPositionImage = createAction<{
  id: number;
  url: string;
  previewUrl?: string;
}>("question/setLabelPositionImage");
export const setLabelOptionImage = createAction<{
  id: number;
  url: string;
  previewUrl?: string;
}>("question/setLabelOptionImage");
export const setLabelImage = createAction<
  string | { url: string; previewUrl?: string }
>("question/setLabelImage");

export const setCategoryImage = createAction<{
  id: number;
  url: string;
  previewUrl?: string;
}>("question/setCategoryImage");
export const setCategoryAudio = createAction<{
  id: number;
  url: string;
  previewUrl?: string;
}>("question/setCategoryAudio");
export const setCategoryItemImage = createAction<{
  id: number;
  url: string;
  previewUrl?: string;
}>("question/setCategoryItemImage");
export const setCategoryItemAudio = createAction<{
  id: number;
  url: string;
  previewUrl?: string;
}>("question/setCategoryItemAudio");

// New actions for edit page
export const setAnswerOptions = createAction<AnswerOption[]>(
  "question/setAnswerOptions"
);
export const setBlankAnswers = createAction<BlankAnswer[]>(
  "question/setBlankAnswers"
);
export const setOrderItems = createAction<OrderItem[]>(
  "question/setOrderItems"
);
export const setMatchItems = createAction<MatchItem[]>(
  "question/setMatchItems"
);
export const setDragDropOptions = createAction<DragDropOption[]>(
  "question/setDragDropOptions"
);
export const setLabelPositions = createAction<LabelPosition[]>(
  "question/setLabelPositions"
);
export const setImageDimensions = createAction<{
  width: number;
  height: number;
}>("question/setImageDimensions");
export const setCategories = createAction<Category[]>("question/setCategories");
export const setBlankCount = createAction<number>("question/setBlankCount");
export const setLabelGroups = createAction<LabelGroup[]>(
  "question/setLabelGroups"
);

// Actions cho group Ordering
export const addOrderGroup = createAction("question/addOrderGroup");
export const updateOrderGroup = createAction<{
  id: number;
  text?: string;
  image?: string;
  audio?: string;
  video?: string;
}>("question/updateOrderGroup");
export const removeOrderGroup = createAction<number>(
  "question/removeOrderGroup"
);

export const setOrderGroups = createAction<any[]>("question/setOrderGroups");

export const addBlankGroup = createAction("question/addBlankGroup");
export const updateBlankGroup = createAction<{
  id: number;
  text?: string;
  image?: string;
  audio?: string;
  video?: string;
}>("question/updateBlankGroup");
export const removeBlankGroup = createAction<number>(
  "question/removeBlankGroup"
);
export const setBlankGroups = createAction<BlankGroup[]>(
  "question/setBlankGroups"
);
export const updateBlankAnswerGroup = createAction<{
  answerId: number;
  groupPosition: number | null;
}>("question/updateBlankAnswerGroup");

// ACTIONS for DragDropGroup
export const addDragDropGroup = createAction("question/addDragDropGroup");
export const updateDragDropGroup = createAction<{
  id: number;
  text?: string;
  image?: string;
  audio?: string;
  video?: string;
}>("question/updateDragDropGroup");
export const removeDragDropGroup = createAction<number>(
  "question/removeDragDropGroup"
);
export const setDragDropGroups = createAction<DragDropGroup[]>(
  "question/setDragDropGroups"
);
export const updateDragDropOptionGroup = createAction<{
  optionId: number;
  groupPosition: number | null;
}>("question/updateDragDropOptionGroup");

export const addLabelGroup = createAction("question/addLabelGroup");
export const updateLabelGroup = createAction<{ id: number; text: string }>(
  "question/updateLabelGroup"
);
export const removeLabelGroup = createAction<number>(
  "question/removeLabelGroup"
);
export const updateLabelPositionGroup = createAction<{
  positionId: number;
  groupPosition: number | null;
}>("question/updateLabelPositionGroup");

export const questionSlice = createSlice({
  name: "question",
  initialState,
  reducers: {
    // General
    setQuestionText: (state, action: PayloadAction<string>) => {
      state.questionText = action.payload;

      // For drag-drop, count [blank] occurrences and update blank count
      if (state.questionType === "drag-drop") {
        const blankMatches = action.payload.match(/\[blank\]/g) || [];
        state.blankCount = blankMatches.length;
      }

      // For fill-in-blank, count [blank] occurrences and update answer fields
      if (state.questionType === "fill-in-blank") {
        const blankMatches = action.payload.match(/\[blank\]/g) || [];
        const blankCount = blankMatches.length;

        // Ensure we have the right number of blank answers
        if (blankCount > state.blankAnswers.length) {
          // Add more blank answers if needed
          for (let i = state.blankAnswers.length; i < blankCount; i++) {
            state.blankAnswers.push({
              id: i + 1,
              text: "",
            });
          }
        } else if (blankCount < state.blankAnswers.length) {
          // Remove excess blank answers
          state.blankAnswers = state.blankAnswers.slice(0, blankCount);
        }
      }
    },
    setQuestionType: (state, action: PayloadAction<string>) => {
      state.questionType = action.payload;

      // If switching to fill-in-blank, initialize blank answers based on [blank] occurrences
      if (action.payload === "fill-in-blank") {
        const blankMatches = state.questionText.match(/\[blank\]/g) || [];
        const blankCount = blankMatches.length;

        if (blankCount === 0) {
          // If no blanks yet, initialize with 2 blank answers
          state.blankAnswers = [
            { id: 1, text: "" },
            { id: 2, text: "" },
          ];
        } else {
          // Create blank answers based on count
          state.blankAnswers = Array.from({ length: blankCount }, (_, i) => ({
            id: i + 1,
            text: "",
          }));
        }
      }

      // If switching to drag-drop, count [blank] occurrences
      if (action.payload === "drag-drop") {
        const blankMatches = state.questionText.match(/\[blank\]/g) || [];
        state.blankCount = blankMatches.length;
      }

      // If switching to ordering, ensure we have 4 items
      if (action.payload === "ordering" && state.orderItems.length < 4) {
        state.orderItems = [
          {
            id: 1,
            text: "",
            color: getColorByIndex(0),
            position: 0,
            groupPosition: null,
          },
          {
            id: 2,
            text: "",
            color: getColorByIndex(1),
            position: 1,
            groupPosition: null,
          },
          {
            id: 3,
            text: "",
            color: getColorByIndex(2),
            position: 2,
            groupPosition: null,
          },
          {
            id: 4,
            text: "",
            color: getColorByIndex(3),
            position: 3,
            groupPosition: null,
          },
        ];
      }

      // If switching to matching, ensure we have 4 items
      if (action.payload === "matching" && state.matchItems.length < 4) {
        state.matchItems = [
          {
            id: 1,
            leftText: "",
            rightText: "",
            color: getColorByIndex(0),
            position: 0,
          },
          {
            id: 2,
            leftText: "",
            rightText: "",
            color: getColorByIndex(1),
            position: 1,
          },
          {
            id: 3,
            leftText: "",
            rightText: "",
            color: getColorByIndex(2),
            position: 2,
          },
          {
            id: 4,
            leftText: "",
            rightText: "",
            color: getColorByIndex(3),
            position: 3,
          },
        ];
      }

      // If switching to category, ensure we have at least 1 category
      if (action.payload === "category" && state.categories.length === 0) {
        state.categories = [
          { id: 1, name: "", color: getColorByIndex(0), items: [] },
        ];
      }
    },
    setQuestionMedia: (
      state,
      action: PayloadAction<{
        type: "image" | "audio" | "video";
        url?: string;
        previewUrl?: string;
      }>
    ) => {
      const { type, url, previewUrl } = action.payload;
      if (type === "image") {
        state.questionImage ??= []
        state.questionImagePreview ??= []
        state.questionImage.push({ type, url: previewUrl || url })
        state.questionImagePreview.push({ type, url: previewUrl || url })
      }
      if (type === "audio") {
        state.questionAudio ??= []
        state.questionAudioPreview ??= []
        state.questionAudio.push({ type, url: previewUrl || url })
        state.questionAudioPreview.push({ type, url: previewUrl || url })
      }
      if (type === "video") {
        state.questionVideo ??= []
        state.questionVideoPreview ??= []
        state.questionVideo.push({ type, url: previewUrl || url })
        state.questionVideoPreview.push({ type, url: previewUrl || url })
      }
    },
    setPoints: (state, action: PayloadAction<number>) => {
      state.points = action.payload;
    },
    setTimeLimit: (state, action: PayloadAction<number>) => {
      state.timeLimit = action.payload;
    },

    // Multiple Choice
    setAllowMultipleAnswers: (state, action: PayloadAction<boolean>) => {
      state.allowMultipleAnswers = action.payload;

      // If switching to single answer mode, ensure only one answer is correct
      if (!action.payload) {
        const correctAnswers = state.answerOptions.filter(
          (option) => option.isCorrect
        );
        if (correctAnswers.length > 1) {
          state.answerOptions.forEach((option) => {
            option.isCorrect = false;
          });
          if (correctAnswers.length > 0) {
            const firstCorrectId = correctAnswers[0].id;
            const firstCorrect = state.answerOptions.find(
              (option) => option.id === firstCorrectId
            );
            if (firstCorrect) {
              firstCorrect.isCorrect = true;
            }
          }
        }
      }
    },
    updateAnswerOption: (
      state,
      action: PayloadAction<{ id: number; text: string }>
    ) => {
      const { id, text } = action.payload;
      const option = state.answerOptions.find((option) => option.id === id);
      if (option) {
        option.text = text;
      }
    },
    toggleAnswerCorrect: (state, action: PayloadAction<number>) => {
      const id = action.payload;

      if (state.allowMultipleAnswers) {
        // For multiple answers, toggle the current option
        const option = state.answerOptions.find((option) => option.id === id);
        if (option) {
          option.isCorrect = !option.isCorrect;
        }
      } else {
        // For single answer, set only this option as correct
        state.answerOptions.forEach((option) => {
          option.isCorrect = option.id === id;
        });
      }
    },
    addAnswerOption: (state) => {
      // Đáp án mới thêm sẽ có id âm duy nhất để quản lý UI, không gửi lên API
      const newId = -(Date.now() + Math.floor(Math.random() * 1000));
      state.answerOptions.push({
        id: newId,
        text: "",
        isCorrect: false,
        color: `bg-${
          [
            "blue",
            "teal",
            "yellow",
            "pink",
            "purple",
            "indigo",
            "green",
            "red",
          ][state.answerOptions.length % 8]
        }-500`,
      });
    },
    removeAnswerOption: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      if (state.answerOptions.length > 2) {
        state.answerOptions = state.answerOptions.filter(
          (option) => option.id !== id
        );
      }
    },

    // Fill in Blank
    updateBlankAnswer: (
      state,
      action: PayloadAction<{ id: number; text: string }>
    ) => {
      const { id, text } = action.payload;
      const answer = state.blankAnswers.find((a) => a.id === id);
      if (answer) {
        answer.text = text;
      }
    },

    // Ordering
    updateOrderItem: (
      state,
      action: PayloadAction<{
        id: number;
        text: string;
        groupPosition?: number | null;
        color?: string;
      }>
    ) => {
      const { id, text, groupPosition, color } = action.payload;
      const item = state.orderItems.find((item) => item.id === id);
      if (item) {
        item.text = text;
        if (typeof groupPosition === "number" && groupPosition !== null) {
          item.groupPosition = groupPosition;
          const group = state.orderGroups[groupPosition];
          if (group) {
            item.color = color || group.color;
          }
        } else if (groupPosition === null) {
          item.groupPosition = null;
          item.color = getColorByIndex(item.position);
        }
      }
    },
    addOrderItem: {
      reducer(
        state,
        action: PayloadAction<{ groupPosition: number } | undefined>
      ) {
        if (state.orderItems.length < 15) {
          // Đáp án mới thêm sẽ có id âm duy nhất để quản lý UI, không gửi lên API
          const newId = -(Date.now() + Math.floor(Math.random() * 1000));
          const newPosition = state.orderItems.length;
          state.orderItems.push({
            id: newId,
            text: "",
            color: getColorByIndex(newPosition),
            position: newPosition,
            groupPosition: null,
          });
        }
      },
      prepare(groupPosition?: number) {
        return {
          payload: groupPosition !== undefined ? { groupPosition } : undefined,
        };
      },
    },
    removeOrderItem: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      if (state.orderItems.length > 3) {
        state.orderItems = state.orderItems.filter((item) => item.id !== id);
        // Update positions after removal
        state.orderItems.sort((a, b) => a.position - b.position);
        state.orderItems.forEach((item, index) => {
          item.position = index;
        });
      }
    },
    reorderOrderItems: (
      state,
      action: PayloadAction<{ sourceIndex: number; destinationIndex: number }>
    ) => {
      const { sourceIndex, destinationIndex } = action.payload;
      const sortedItems = [...state.orderItems].sort(
        (a, b) => a.position - b.position
      );
      const [movedItem] = sortedItems.splice(sourceIndex, 1);
      sortedItems.splice(destinationIndex, 0, movedItem);
      sortedItems.forEach((item, index) => {
        const originalItem = state.orderItems.find((i) => i.id === item.id);
        if (originalItem) {
          originalItem.position = index;
        }
      });
    },
    setOrderDirection: (
      state,
      action: PayloadAction<"ascending" | "descending">
    ) => {
      state.orderDirection = action.payload;
    },
    setDisplay: (
      state,
      action: PayloadAction<"vertical" | "horizontal" | "word_count">
    ) => {
      state.display = action.payload;
    },

    // Matching
    updateMatchItem: (
      state,
      action: PayloadAction<{
        id: number;
        side: "left" | "right";
        text: string;
      }>
    ) => {
      const { id, side, text } = action.payload;
      const item = state.matchItems.find((item) => item.id === id);
      if (item) {
        if (side === "left") {
          item.leftText = text;
        } else {
          item.rightText = text;
        }
      }
    },
    addMatchItem: (state) => {
      if (state.matchItems.length < 5) {
        // Đáp án mới thêm sẽ có id âm duy nhất để quản lý UI, không gửi lên API
        const newId = -(Date.now() + Math.floor(Math.random() * 1000));
        const newPosition = state.matchItems.length;
        state.matchItems.push({
          id: newId,
          leftText: "",
          rightText: "",
          color: `bg-${
            [
              "blue",
              "teal",
              "yellow",
              "pink",
              "purple",
              "indigo",
              "green",
              "red",
            ][state.matchItems.length % 8]
          }-500`,
          position: newPosition,
        });
      }
    },
    removeMatchItem: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      if (state.matchItems.length > 3) {
        state.matchItems = state.matchItems.filter((item) => item.id !== id);

        // Update positions after removal
        state.matchItems.sort((a, b) => a.position - b.position);
        state.matchItems.forEach((item, index) => {
          item.position = index;
        });
      }
    },
    reorderMatchItems: (
      state,
      action: PayloadAction<{ sourceIndex: number; destinationIndex: number }>
    ) => {
      const { sourceIndex, destinationIndex } = action.payload;

      // Get the items sorted by position
      const sortedItems = [...state.matchItems].sort(
        (a, b) => a.position - b.position
      );

      // Get the item being moved
      const [movedItem] = sortedItems.splice(sourceIndex, 1);

      // Insert the item at the new position
      sortedItems.splice(destinationIndex, 0, movedItem);

      // Update positions
      sortedItems.forEach((item, index) => {
        const originalItem = state.matchItems.find((i) => i.id === item.id);
        if (originalItem) {
          originalItem.position = index;
        }
      });
    },

    // Drag and Drop
    updateDragDropOption: (
      state,
      action: PayloadAction<{ id: number; text: string }>
    ) => {
      const { id, text } = action.payload;
      const option = state.dragDropOptions.find((o) => o.id === id);
      if (option) {
        option.text = text;
      }
    },
    addDragDropOption: (state, action: PayloadAction<boolean>) => {
      const isCorrect = action.payload;
      if (state.dragDropOptions.length < 8) {
        // Đáp án mới thêm sẽ có id âm duy nhất để quản lý UI, không gửi lên API
        const newId = -(Date.now() + Math.floor(Math.random() * 1000));
        state.dragDropOptions.push({
          id: newId,
          text: "",
          isCorrect,
          color: `bg-${
            [
              "blue",
              "teal",
              "yellow",
              "pink",
              "purple",
              "indigo",
              "green",
              "red",
            ][state.dragDropOptions.length % 8]
          }-500`,
          groupPosition: null,
        });
      }
    },
    removeDragDropOption: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      if (state.dragDropOptions.length > 2) {
        state.dragDropOptions = state.dragDropOptions.filter(
          (o) => o.id !== id
        );
      }
    },
    toggleDragDropOptionCorrect: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      const option = state.dragDropOptions.find((o) => o.id === id);
      if (option) {
        option.isCorrect = !option.isCorrect;
      }
    },

    // Labeling
    setLabelImageAction: (state, action: PayloadAction<string | undefined>) => {
      state.labelImage = action.payload;
      state.labelImagePreview = action.payload;
    },
    addLabelPosition: (
      state,
      action: PayloadAction<Omit<LabelPosition, "id" | "answer">>
    ) => {
      // Đáp án mới thêm sẽ có id âm duy nhất để quản lý UI, không gửi lên API
      const newId = -(Date.now() + Math.floor(Math.random() * 1000));

      state.labelPositions.push({
        id: newId,
        answer: "",
        ...action.payload,
      });
    },
    updateLabelPosition: (
      state,
      action: PayloadAction<Partial<LabelPosition> & { id: number }>
    ) => {
      const index = state.labelPositions.findIndex(
        (p) => p.id === action.payload.id
      );
      if (index !== -1) {
        state.labelPositions[index] = {
          ...state.labelPositions[index],
          ...action.payload,
        };
      }
    },
    removeLabelPosition: (state, action: PayloadAction<number>) => {
      state.labelPositions = state.labelPositions.filter(
        (p) => p.id !== action.payload
      );
    },
    addLabelOption: (state, action: PayloadAction<boolean>) => {
      const isCorrect = action.payload;
      // Đáp án mới thêm sẽ có id âm duy nhất để quản lý UI, không gửi lên API
      const newId = -(Date.now() + Math.floor(Math.random() * 1000));
      // const newId =
      // state.labelOptions.length > 0
      //   ? Math.max(...state.labelOptions.map((opt) => opt.id)) + 1
      //   : 1;

      state.labelOptions.push({
        id: newId,
        text: "",
        isCorrect,
      });
    },
    updateLabelOption: (
      state,
      action: PayloadAction<{ id: number; text: string }>
    ) => {
      const { id, text } = action.payload;
      const option = state.labelOptions.find((opt) => opt.id === id);

      if (option) {
        option.text = text;
      }
    },
    removeLabelOption: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      if (state.labelOptions.length > 2) {
        state.labelOptions = state.labelOptions.filter((opt) => opt.id !== id);
      }
    },
    toggleLabelOptionCorrect: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      const option = state.labelOptions.find((opt) => opt.id === id);

      if (option) {
        option.isCorrect = !option.isCorrect;
      }
    },

    // Category
    updateCategoryName: (
      state,
      action: PayloadAction<{ id: number; name: string }>
    ) => {
      const { id, name } = action.payload;
      const category = state.categories.find((cat) => cat.id === id);
      if (category) {
        category.name = name;
      }
    },
    addCategoryItem: (
      state,
      action: PayloadAction<{ categoryId: number; text: string }>
    ) => {
      const { categoryId, text } = action.payload;
      const category = state.categories.find((cat) => cat.id === categoryId);

      if (category) {
        // Đáp án mới thêm sẽ có id âm duy nhất để quản lý UI, không gửi lên API
        const newId = -(Date.now() + Math.floor(Math.random() * 1000));

        category.items.push({
          id: newId,
          text,
          categoryId,
        });
      }
    },
    updateCategoryItem: (
      state,
      action: PayloadAction<{ id: number; text: string }>
    ) => {
      const { id, text } = action.payload;

      for (const category of state.categories) {
        const item = category.items.find((item) => item.id === id);
        if (item) {
          item.text = text;
          break;
        }
      }
    },
    removeCategoryItem: (
      state,
      action: PayloadAction<{ categoryId: number; itemId: number }>
    ) => {
      const { categoryId, itemId } = action.payload;
      const category = state.categories.find((cat) => cat.id === categoryId);

      if (category) {
        category.items = category.items.filter((item) => item.id !== itemId);
      }
    },
    moveCategoryItem: (
      state,
      action: PayloadAction<{
        itemId: number;
        sourceCategoryId: number;
        targetCategoryId: number;
      }>
    ) => {
      const { itemId, sourceCategoryId, targetCategoryId } = action.payload;

      if (sourceCategoryId === targetCategoryId) return;

      const sourceCategory = state.categories.find(
        (cat) => cat.id === sourceCategoryId
      );
      const targetCategory = state.categories.find(
        (cat) => cat.id === targetCategoryId
      );

      if (sourceCategory && targetCategory) {
        const itemIndex = sourceCategory.items.findIndex(
          (item) => item.id === itemId
        );

        if (itemIndex !== -1) {
          const [item] = sourceCategory.items.splice(itemIndex, 1);
          item.categoryId = targetCategoryId;
          targetCategory.items.push(item);
        }
      }
    },
    addCategory: (state) => {
      if (state.categories.length < 5) {
        // Category mới thêm sẽ có id âm duy nhất để quản lý UI, không gửi lên API
        const newId = -(Date.now() + Math.floor(Math.random() * 1000));
        const colorIndex = state.categories.length;
        state.categories.push({
          id: newId,
          name: "",
          color: getColorByIndex(colorIndex),
          items: [],
        });
      }
    },
    removeCategory: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      if (state.categories.length > 1) {
        // Move items from this category to the first remaining category
        const categoryToRemove = state.categories.find((cat) => cat.id === id);
        if (categoryToRemove && categoryToRemove.items.length > 0) {
          const firstRemainingCategory = state.categories.find(
            (cat) => cat.id !== id
          );
          if (firstRemainingCategory) {
            categoryToRemove.items.forEach((item) => {
              item.categoryId = firstRemainingCategory.id;
              firstRemainingCategory.items.push(item);
            });
          }
        }

        state.categories = state.categories.filter((cat) => cat.id !== id);
      }
    },

    // Writing
    setWritingMaxCharacters: (state, action: PayloadAction<number>) => {
      state.writingMaxCharacters = action.payload;
    },
    setWritingAllowImageUpload: (state, action: PayloadAction<boolean>) => {
      state.writingAllowImageUpload = action.payload;
    },
    setWritingInstructions: (state, action: PayloadAction<string>) => {
      state.writingInstructions = action.payload;
    },

    // Speaking
    setSpeakingMaxDuration: (state, action: PayloadAction<number>) => {
      state.speakingMaxDuration = action.payload;
    },
    setSpeakingInstructions: (state, action: PayloadAction<string>) => {
      state.speakingInstructions = action.payload;
    },

    // Reset state
    resetState: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle setters for question media
      .addCase(setQuestionImage, (state, action) => {
        if (typeof action.payload.index === 'number') {
          state.questionImage = state.questionImage?.filter(
            (_, i) => i !== action.payload.index
          )
          state.questionImagePreview = state.questionImagePreview?.filter(
            (_, i) => i !== action.payload.index
          )
          // reset về undefined nếu mảng rỗng
          if (state.questionImage?.length === 0) state.questionImage = undefined
          if (state.questionImagePreview?.length === 0) state.questionImagePreview = undefined
        } else {
          const {type, url, previewUrl} = action.payload.payload
          state.questionImage ??= []
          state.questionImagePreview ??= []
          state.questionImage.push({ type, url: url || previewUrl })
          state.questionImagePreview.push({ type, url: url || previewUrl })
        }
      })
      .addCase(setQuestionAudio, (state, action) => {
        if (typeof action.payload.index === 'number') {
          state.questionAudio = state.questionAudio?.filter(
            (_, i) => i !== action.payload.index
          )
          state.questionAudioPreview = state.questionAudioPreview?.filter(
            (_, i) => i !== action.payload.index
          )
          // reset về undefined nếu mảng rỗng
          if (state.questionAudio?.length === 0) state.questionAudio = undefined
          if (state.questionAudioPreview?.length === 0) state.questionAudioPreview = undefined
        } else {
          const {type, url, previewUrl} = action.payload.payload
          state.questionAudio ??= []
          state.questionAudioPreview ??= []
          state.questionAudio.push({ type, url: url || previewUrl })
          state.questionAudioPreview.push({ type, url: url || previewUrl })
        }
      })
      .addCase(setQuestionVideo, (state, action) => {
        if (typeof action.payload.index === 'number') {
          state.questionVideo = state.questionVideo?.filter(
            (_, i) => i !== action.payload.index
          )
          state.questionVideoPreview = state.questionVideoPreview?.filter(
            (_, i) => i !== action.payload.index
          )
          // reset về undefined nếu mảng rỗng
          if (state.questionVideo?.length === 0) state.questionVideo = undefined
          if (state.questionVideoPreview?.length === 0) state.questionVideoPreview = undefined
        } else {
          const {type, url, previewUrl} = action.payload.payload
          state.questionVideo ??= []
          state.questionVideoPreview ??= []
          state.questionVideo.push({ type, url: url || previewUrl })
          state.questionVideoPreview.push({ type, url: url || previewUrl })
        }
      })

      // Handle setters for answer options media
      .addCase(setAnswerOptionImage, (state, action) => {
        const option = state.answerOptions.find(
          (o) => o.id === action.payload.id
        );
        if (option) {
          option.image = action.payload.url;
          option.imagePreview = action.payload.previewUrl || action.payload.url;
        }
      })
      .addCase(setAnswerOptionAudio, (state, action) => {
        const option = state.answerOptions.find(
          (o) => o.id === action.payload.id
        );
        if (option) {
          option.audio = action.payload.url;
          option.audioPreview = action.payload.previewUrl || action.payload.url;
        }
      })
      .addCase(setAnswerOptionVideo, (state, action) => {
        const option = state.answerOptions.find(
          (o) => o.id === action.payload.id
        );
        if (option) {
          option.video = action.payload.url;
          option.videoPreview = action.payload.previewUrl || action.payload.url;
        }
      })

      // Handle setters for blank answers media
      .addCase(setBlankAnswerImage, (state, action) => {
        const answer = state.blankAnswers.find(
          (a) => a.id === action.payload.id
        );
        if (answer) {
          answer.image = action.payload.url;
          answer.imagePreview = action.payload.previewUrl || action.payload.url;
        }
      })
      .addCase(setBlankAnswerAudio, (state, action) => {
        const answer = state.blankAnswers.find(
          (a) => a.id === action.payload.id
        );
        if (answer) {
          answer.audio = action.payload.url;
          answer.audioPreview = action.payload.previewUrl || action.payload.url;
        }
      })

      // Handle setters for order items media
      .addCase(setOrderItemImage, (state, action) => {
        const item = state.orderItems.find((i) => i.id === action.payload.id);
        if (item) {
          item.image = action.payload.url;
          item.imagePreview = action.payload.previewUrl || action.payload.url;
        }
      })
      .addCase(setOrderItemAudio, (state, action) => {
        const item = state.orderItems.find((i) => i.id === action.payload.id);
        if (item) {
          item.audio = action.payload.url;
          item.audioPreview = action.payload.previewUrl || action.payload.url;
        }
      })
      .addCase(setOrderItemVideo, (state, action) => {
        const item = state.orderItems.find((i) => i.id === action.payload.id);
        if (item) {
          item.video = action.payload.url;
          item.videoPreview = action.payload.previewUrl || action.payload.url;
        }
      })

      // Handle setters for match items media
      .addCase(setMatchItemLeftImage, (state, action) => {
        const item = state.matchItems.find((i) => i.id === action.payload.id);
        if (item) {
          item.leftImage = action.payload.url;
          item.leftImagePreview =
            action.payload.previewUrl || action.payload.url;
        }
      })
      .addCase(setMatchItemLeftAudio, (state, action) => {
        const item = state.matchItems.find((i) => i.id === action.payload.id);
        if (item) {
          item.leftAudio = action.payload.url;
          item.leftAudioPreview =
            action.payload.previewUrl || action.payload.url;
        }
      })
      .addCase(setMatchItemLeftVideo, (state, action) => {
        const item = state.matchItems.find((i) => i.id === action.payload.id);
        if (item) {
          item.leftVideo = action.payload.url;
          item.leftVideoPreview =
            action.payload.previewUrl || action.payload.url;
        }
      })
      .addCase(setMatchItemRightImage, (state, action) => {
        const item = state.matchItems.find((i) => i.id === action.payload.id);
        if (item) {
          item.rightImage = action.payload.url;
          item.rightImagePreview =
            action.payload.previewUrl || action.payload.url;
        }
      })
      .addCase(setMatchItemRightAudio, (state, action) => {
        const item = state.matchItems.find((i) => i.id === action.payload.id);
        if (item) {
          item.rightAudio = action.payload.url;
          item.rightAudioPreview =
            action.payload.previewUrl || action.payload.url;
        }
      })
      .addCase(setMatchItemRightVideo, (state, action) => {
        const item = state.matchItems.find((i) => i.id === action.payload.id);
        if (item) {
          item.rightVideo = action.payload.url;
          item.rightVideoPreview =
            action.payload.previewUrl || action.payload.url;
        }
      })

      // Handle setters for drag drop options media
      .addCase(setDragDropOptionImage, (state, action) => {
        const option = state.dragDropOptions.find(
          (o) => o.id === action.payload.id
        );
        if (option) {
          option.image = action.payload.url;
          option.imagePreview = action.payload.previewUrl || action.payload.url;
        }
      })
      .addCase(setDragDropOptionAudio, (state, action) => {
        const option = state.dragDropOptions.find(
          (o) => o.id === action.payload.id
        );
        if (option) {
          option.audio = action.payload.url;
          option.audioPreview = action.payload.previewUrl || action.payload.url;
        }
      })
      .addCase(setDragDropOptionVideo, (state, action) => {
        const option = state.dragDropOptions.find(
          (o) => o.id === action.payload.id
        );
        if (option) {
          option.video = action.payload.url;
          option.videoPreview = action.payload.previewUrl || action.payload.url;
        }
      })

      // Handle setters for label positions and options
      .addCase(setLabelPositionImage, (state, action) => {
        const position = state.labelPositions.find(
          (pos) => pos.id === action.payload.id
        );
        if (position) {
          position.image = action.payload.url;
          position.imagePreview =
            action.payload.previewUrl || action.payload.url;
        }
      })
      .addCase(setLabelOptionImage, (state, action) => {
        const option = state.labelOptions.find(
          (o) => o.id === action.payload.id
        );
        if (option) {
          option.image = action.payload.url;
          option.imagePreview = action.payload.previewUrl || action.payload.url;
        }
      })
      .addCase(setLabelImage, (state, action) => {
        if (typeof action.payload === "string") {
          state.labelImage = action.payload;
          state.labelImagePreview = action.payload;
        } else {
          state.labelImage = action.payload.url;
          state.labelImagePreview =
            action.payload.previewUrl || action.payload.url;
        }
      })

      // Handle setters for category media
      .addCase(setCategoryImage, (state, action) => {
        const category = state.categories.find(
          (cat) => cat.id === action.payload.id
        );
        if (category) {
          category.image = action.payload.url;
          category.imagePreview =
            action.payload.previewUrl || action.payload.url;
        }
      })
      .addCase(setCategoryAudio, (state, action) => {
        const category = state.categories.find(
          (cat) => cat.id === action.payload.id
        );
        if (category) {
          category.audio = action.payload.url;
          category.audioPreview =
            action.payload.previewUrl || action.payload.url;
        }
      })
      .addCase(setCategoryItemImage, (state, action) => {
        for (const category of state.categories) {
          const item = category.items.find(
            (item) => item.id === action.payload.id
          );
          if (item) {
            item.image = action.payload.url;
            item.imagePreview = action.payload.previewUrl || action.payload.url;
            break;
          }
        }
      })
      .addCase(setCategoryItemAudio, (state, action) => {
        for (const category of state.categories) {
          const item = category.items.find(
            (item) => item.id === action.payload.id
          );
          if (item) {
            item.audio = action.payload.url;
            item.audioPreview = action.payload.previewUrl || action.payload.url;
            break;
          }
        }
      })

      // === ORDER GROUPS HANDLERS ===
      .addCase(addOrderGroup, (state) => {
        if (state.orderGroups.length < 15) {
          const newId =
            state.orderGroups.length > 0
              ? Math.max(...state.orderGroups.map((g) => g.id)) + 1
              : 1;
          const newPosition = state.orderGroups.length;
          state.orderGroups.push({
            id: newId,
            text: "",
            color: getColorByIndex(newPosition),
            position: newPosition,
          });
        }
      })
      .addCase(updateOrderGroup, (state, action) => {
        const { id, text, image, audio, video } = action.payload;
        const group = state.orderGroups.find((g) => g.id === id);
        if (group) {
          if (typeof text === "string") group.text = text;
          if (typeof image === "string") group.image = image;
          if (typeof audio === "string") group.audio = audio;
          if (typeof video === "string") group.video = video;
          // Đồng bộ lại các answer liên kết group này
          state.orderItems.forEach((item) => {
            if (
              item.groupPosition !== null &&
              typeof item.groupPosition === "number"
            ) {
              // Tìm group theo position
              const groupIdx = state.orderGroups.findIndex((g) => g.id === id);
              if (item.groupPosition === groupIdx) {
                if (typeof text === "string") item.text = text;
                if (typeof image === "string") item.image = image;
                if (typeof audio === "string") item.audio = audio;
                if (typeof video === "string") item.video = video;
              }
            }
          });
        }
      })
      .addCase(removeOrderGroup, (state, action) => {
        if (state.orderGroups.length > 1) {
          const id = action.payload;
          // Tìm index của group bị xóa trước khi xóa
          const removedIndex = state.orderGroups.findIndex((g) => g.id === id);
          
          // Xóa group
          state.orderGroups = state.orderGroups.filter((g) => g.id !== id);
          // Re-index position
          state.orderGroups.forEach((g, idx) => (g.position = idx));
          
          // Cập nhật groupPosition của các đáp án
          state.orderItems.forEach((item) => {
            if (item.groupPosition !== null && item.groupPosition !== undefined) {
              if (item.groupPosition === removedIndex) {
                // Đáp án tham chiếu đến group bị xóa -> reset về null
                item.groupPosition = null;
                item.color = getColorByIndex(item.position);
              } else if (item.groupPosition > removedIndex) {
                // Đáp án tham chiếu đến group có index lớn hơn -> giảm đi 1
                item.groupPosition = item.groupPosition - 1;
              }
              // Nếu groupPosition < removedIndex thì không cần thay đổi
            }
          });
        }
      })

      // New setters for edit page
      .addCase(setAnswerOptions, (state, action) => {
        state.answerOptions = action.payload;
      })
      .addCase(setBlankAnswers, (state, action) => {
        state.blankAnswers = action.payload;
      })
      .addCase(setOrderItems, (state, action) => {
        state.orderItems = action.payload;
      })
      .addCase(setMatchItems, (state, action) => {
        state.matchItems = action.payload;
      })
      .addCase(setDragDropOptions, (state, action) => {
        state.dragDropOptions = action.payload;
      })
      .addCase(setLabelPositions, (state, action) => {
        state.labelPositions = action.payload;
      })
      .addCase(setCategories, (state, action) => {
        state.categories = action.payload;
      })
      .addCase(setBlankCount, (state, action) => {
        const newCount = action.payload;
        state.blankCount = newCount;
        // Ensure number of correct options == blankCount
        let correctOptions = state.dragDropOptions.filter((o) => o.isCorrect);
        // Preserve existing correct options' data
        if (correctOptions.length < newCount) {
          // Add more correct options
          const nextId =
            state.dragDropOptions.length > 0
              ? Math.max(...state.dragDropOptions.map((o) => o.id)) + 1
              : 1;
          for (let i = correctOptions.length; i < newCount; i++) {
            state.dragDropOptions.push({
              id: nextId + i - correctOptions.length,
              text: "",
              isCorrect: true,
              color: getColorByIndex(state.dragDropOptions.length + i),
              groupPosition: null,
            });
          }
        } else if (correctOptions.length > newCount) {
          // Remove correct options from the end, but preserve order
          let toRemove = correctOptions.length - newCount;
          for (
            let i = state.dragDropOptions.length - 1;
            i >= 0 && toRemove > 0;
            i--
          ) {
            if (state.dragDropOptions[i].isCorrect) {
              state.dragDropOptions.splice(i, 1);
              toRemove--;
            }
          }
        }
        // After add/remove, ensure only blankCount correct options
        let corrects = state.dragDropOptions.filter((o) => o.isCorrect);
        if (corrects.length > newCount) {
          // Remove extra
          let toRemove = corrects.length - newCount;
          for (
            let i = state.dragDropOptions.length - 1;
            i >= 0 && toRemove > 0;
            i--
          ) {
            if (state.dragDropOptions[i].isCorrect) {
              state.dragDropOptions.splice(i, 1);
              toRemove--;
            }
          }
        } else if (corrects.length < newCount) {
          // Add missing
          const nextId =
            state.dragDropOptions.length > 0
              ? Math.max(...state.dragDropOptions.map((o) => o.id)) + 1
              : 1;
          for (let i = corrects.length; i < newCount; i++) {
            state.dragDropOptions.push({
              id: nextId + i - corrects.length,
              text: "",
              isCorrect: true,
              color: getColorByIndex(state.dragDropOptions.length + i),
              groupPosition: null,
            });
          }
        }
      })
      .addCase(setOrderGroups, (state, action) => {
        state.orderGroups = action.payload;
      })
      .addCase(setLabelGroups, (state, action) => {
        state.labelGroups = action.payload;
      })

      // Blank Groups handlers
      .addCase(addBlankGroup, (state) => {
        if (state.blankGroups.length < state.blankAnswers.length) {
          const newId =
            state.blankGroups.length > 0
              ? Math.max(...state.blankGroups.map((g) => g.id)) + 1
              : 1;
          const newPosition = state.blankGroups.length;
          state.blankGroups.push({
            id: newId,
            text: "",
            color: getColorByIndex(newPosition),
            position: newPosition,
          });
        }
      })
      .addCase(updateBlankGroup, (state, action) => {
        const { id, text, image, audio, video } = action.payload;
        const group = state.blankGroups.find((g) => g.id === id);
        if (group) {
          if (typeof text === "string") group.text = text;
          if (typeof image === "string") group.image = image;
          if (typeof audio === "string") group.audio = audio;
          if (typeof video === "string") group.video = video;
          // Đồng bộ lại các answer liên kết group này
          state.blankAnswers.forEach((item) => {
            if (
              item.groupPosition !== null &&
              typeof item.groupPosition === "number"
            ) {
              const groupIdx = state.blankGroups.findIndex((g) => g.id === id);
              if (item.groupPosition === groupIdx) {
                if (typeof text === "string") item.text = text;
                if (typeof image === "string") item.image = image;
                if (typeof audio === "string") item.audio = audio;
                if (typeof video === "string") item.video = video;
              }
            }
          });
        }
      })
      .addCase(removeBlankGroup, (state, action) => {
        if (state.blankGroups.length > 0) {
          const id = action.payload;
          state.blankGroups = state.blankGroups.filter((g) => g.id !== id);
          // Re-index position
          state.blankGroups.forEach((g, idx) => (g.position = idx));
          // Nếu có blankAnswers tham chiếu group bị xóa, reset groupPosition về null
          state.blankAnswers.forEach((item) => {
            if (
              item.groupPosition !== undefined &&
              (item.groupPosition === null ||
                !state.blankGroups[item.groupPosition])
            ) {
              item.groupPosition = null;
            }
          });
        }
      })
      .addCase(setBlankGroups, (state, action) => {
        state.blankGroups = action.payload;
      })
      .addCase(updateBlankAnswerGroup, (state, action) => {
        const { answerId, groupPosition } = action.payload;
        const answer = state.blankAnswers.find((item) => item.id === answerId);
        if (answer) {
          answer.groupPosition = groupPosition;
          if (groupPosition !== null && state.blankGroups[groupPosition]) {
            const group = state.blankGroups[groupPosition];
            answer.text = group.text;
            answer.image = group.image;
            answer.audio = group.audio;
            answer.video = group.video;
          }
        }
      })

      // DragDropGroup handlers
      .addCase(addDragDropGroup, (state) => {
        // Remove the limit on number of groups
        const newId =
          state.dragDropGroups.length > 0
            ? Math.max(...state.dragDropGroups.map((g) => g.id)) + 1
            : 1;
        const newPosition = state.dragDropGroups.length;
        state.dragDropGroups.push({
          id: newId,
          text: "",
          color: getColorByIndex(newPosition),
          position: newPosition,
        });
      })
      .addCase(updateDragDropGroup, (state, action) => {
        const { id, text, image, audio, video } = action.payload;
        const group = state.dragDropGroups.find((g) => g.id === id);
        if (group) {
          if (typeof text === "string") group.text = text;
          if (typeof image === "string") group.image = image;
          if (typeof audio === "string") group.audio = audio;
          if (typeof video === "string") group.video = video;
          // Sync all options linked to this group
          const groupIdx = state.dragDropGroups.findIndex((g) => g.id === id);
          state.dragDropOptions.forEach((option) => {
            if (option.groupPosition === groupIdx) {
              // Optionally update color/text/media if needed
              option.color = group.color;
            }
          });
        }
      })
      .addCase(removeDragDropGroup, (state, action) => {
        const id = action.payload;
        if (state.dragDropGroups.length > 1) {
          state.dragDropGroups = state.dragDropGroups.filter(
            (g) => g.id !== id
          );
          // Re-index positions
          state.dragDropGroups.forEach((g, idx) => (g.position = idx));
          // Reset groupPosition for options referencing removed group
          state.dragDropOptions.forEach((option) => {
            if (
              option.groupPosition !== undefined &&
              (option.groupPosition === null ||
                !state.dragDropGroups[option.groupPosition])
            ) {
              option.groupPosition = null;
            }
          });
        }
      })
      .addCase(setDragDropGroups, (state, action) => {
        state.dragDropGroups = action.payload;
      })
      .addCase(updateDragDropOptionGroup, (state, action) => {
        const { optionId, groupPosition } = action.payload;
        const option = state.dragDropOptions.find((o) => o.id === optionId);
        if (option) {
          option.groupPosition = groupPosition;
          if (groupPosition !== null && state.dragDropGroups[groupPosition]) {
            const group = state.dragDropGroups[groupPosition];
            option.color = group.color;
            option.text = group.text;
            option.image = group.image;
            option.audio = group.audio;
            option.video = group.video;
          }
        }
      })

      // Labeling handlers
      .addCase(addLabelGroup, (state) => {
        const newId =
          state.labelGroups.length > 0
            ? Math.max(...state.labelGroups.map((g) => g.id)) + 1
            : 1;
        state.labelGroups.push({ id: newId, text: "" });
      })
      .addCase(updateLabelGroup, (state, action) => {
        const { id, text } = action.payload;
        const group = state.labelGroups.find((g) => g.id === id);
        if (group) group.text = text;
      })
      .addCase(removeLabelGroup, (state, action) => {
        const id = action.payload;
        state.labelGroups = state.labelGroups.filter((g) => g.id !== id);
        // Reset groupPosition ở các labelPositions nếu group không còn tồn tại
        state.labelPositions.forEach((pos) => {
          if (
            typeof pos.groupPosition === "number" &&
            (!state.labelGroups[pos.groupPosition] ||
              state.labelGroups[pos.groupPosition].id === id)
          ) {
            pos.groupPosition = null;
          }
        });
      })
      .addCase(updateLabelPositionGroup, (state, action) => {
        const { positionId, groupPosition } = action.payload;
        const pos = state.labelPositions.find((p) => p.id === positionId);
        if (pos) pos.groupPosition = groupPosition;
      });
  },
});

export const {
  // General
  setQuestionText,
  setQuestionType,
  setQuestionMedia,
  setPoints,
  setTimeLimit,

  // Multiple Choice
  setAllowMultipleAnswers,
  updateAnswerOption,
  toggleAnswerCorrect,
  addAnswerOption,
  removeAnswerOption,

  // Fill in Blank
  updateBlankAnswer,

  // Ordering
  updateOrderItem,
  addOrderItem,
  removeOrderItem,
  reorderOrderItems,
  setOrderDirection,
  setDisplay,

  // Matching
  updateMatchItem,
  addMatchItem,
  removeMatchItem,
  reorderMatchItems,

  // Drag and Drop
  updateDragDropOption,
  addDragDropOption,
  removeDragDropOption,
  toggleDragDropOptionCorrect,

  // Labeling
  setLabelImageAction,
  addLabelPosition,
  updateLabelPosition,
  removeLabelPosition,
  addLabelOption,
  updateLabelOption,
  removeLabelOption,
  toggleLabelOptionCorrect,

  // Category
  updateCategoryName,
  addCategoryItem,
  updateCategoryItem,
  removeCategoryItem,
  moveCategoryItem,
  addCategory,
  removeCategory,

  // Writing
  setWritingMaxCharacters,
  setWritingAllowImageUpload,
  setWritingInstructions,

  // Speaking
  setSpeakingMaxDuration,
  setSpeakingInstructions,

  // Reset state
  resetState,
} = questionSlice.actions;

export default questionSlice.reducer;
