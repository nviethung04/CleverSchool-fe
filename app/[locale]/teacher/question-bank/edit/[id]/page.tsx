"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LucideArrowLeft,
  LucideCheckSquare,
  LucideType,
  LucideArrowUpDown,
  LucideArrowLeftRight,
  LucideCheck,
  LucideMessageSquare,
  LucideFileText,
  LucideMic,
  LucideLoader2,
  LucideEye,
} from "lucide-react";
import Link from "next/link";
import { CustomSelect } from "@/components/question-editor/custom-select";
import { ReduxProvider } from "@/components/providers/redux-provider";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  setQuestionType,
  setPoints,
  setTimeLimit,
  resetState,
  setQuestionText,
  setAnswerOptions,
  setBlankAnswers,
  setOrderItems,
  setOrderDirection,
  setMatchItems,
  setDragDropOptions,
  setLabelPositions,
  setLabelImage,
  setCategories,
  setWritingMaxCharacters,
  setWritingAllowImageUpload,
  setWritingInstructions,
  setSpeakingMaxDuration,
  setSpeakingInstructions,
  setQuestionImage,
  setQuestionAudio,
  setQuestionVideo,
  setBlankCount,
  setOrderGroups,
  setBlankGroups,
  setDragDropGroups,
  setLabelGroups,
  setDisplay,
} from "@/lib/redux/question-slice";
import { OrderingQuestion } from "@/components/question-editor/ordering-question";
import { MatchingQuestion } from "@/components/question-editor/matching-question";
import { MultipleChoiceQuestion } from "@/components/question-editor/multiple-choice-question";
import { FillInBlankQuestion } from "@/components/question-editor/fill-in-blank-question";
import { DragDropQuestion } from "@/components/question-editor/drag-drop-question";
import { DefaultQuestion } from "@/components/question-editor/default-question";
import { LabelingQuestion } from "@/components/question-editor/labeling-question";
import { CategoryQuestion } from "@/components/question-editor/category-question";
import { WritingQuestion } from "@/components/question-editor/writing-question";
import { SpeakingQuestion } from "@/components/question-editor/speaking-question";
import {
  getQuestionById,
  updateQuestion,
  convertMultipleChoiceToApiFormat,
  convertFillInBlankToApiFormat,
  convertOrderingToApiFormat,
  convertMatchingToApiFormat,
  convertDragDropToApiFormat,
  convertLabelingToApiFormat,
  convertWritingToApiFormat,
  convertSpeakingToApiFormat,
  convertCategoryToApiFormat,
  getQuestionAttributes,
  QuestionAttributeNode,
  type QuestionAttributePayload,
  QuestionMedia,
} from "@/lib/api/questions";
import { useToast } from "@/components/ui/use-toast";
import { useRouter, useParams } from "next/navigation";
import { QUESTION_BANK_LIST_REFRESH_KEY, markListForRefresh } from "@/lib/utils/list-refresh";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RoleBasedHeaderSidebar } from "@/components/layout/role-based-header-sidebar";
import { GetSubjectsList } from "@/lib/api/subjects";
import { useTranslations } from "next-intl";
import { isValidSubjectId, sortAlphabetGeneric } from "@/lib/utils";
import { CLONE_QUESTION_EDIT_ENABLED } from "@/config/hiddenModules";

const EditableMathField = dynamic(
  () => import("react-mathquill").then((mod) => mod.EditableMathField),
  { ssr: false }
);

// Map API question type to UI question type
const mapApiTypeToUiType = (apiType: string): string => {
  const typeMap: Record<string, string> = {
    multiple_choice: "multiple-choice",
    fill_in_blanks: "fill-in-blank",
    ordering: "ordering",
    matching: "matching",
    drag_drop: "drag-drop",
    labeling: "labeling",
    category: "category",
    speaking: "speaking",
    writing: "writing",
  };
  return typeMap[apiType] || apiType;
};

// Component to preview question media
const MediaPreview = ({
  media,
}: {
  media: { type?: string; url?: string }[];
}) => {
  if (!media || media.length === 0) return null;
  return media.map((m, index) => (
    <div key={index} className="flex flex-col items-center gap-4 p-4">
      {m.type === "image" && (
        <img
          src={m.url || "/icons/placeholder.svg"}
          alt="Question media"
          className="max-w-full max-h-[70vh] object-contain rounded-lg"
        />
      )}
      {m.type === "audio" && (
        <audio controls className="w-full max-w-md">
          <source src={m.url} />
          Your browser does not support the audio element.
        </audio>
      )}
      {m.type === "video" && (
        <video controls className="max-w-full max-h-[70vh]">
          <source src={m.url} />
          Your browser does not support the video element.
        </video>
      )}
    </div>
  ));
};

function QuestionEditor() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useParams() as { id: string; locale: string };
  const { toast } = useToast();
  const t = useTranslations("createQuestion");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{
    open: boolean;
    media: {
      type?: string;
      url?: string;
    }[];
  }>({
    open: false,
    media: [],
  });
  const [mathquillLatex, setMathquillLatex] = useState("");
  const [mathquillOpen, setMathquillOpen] = useState(false);
  const mathquillPopupRef = useRef<HTMLDivElement>(null);
  const tiptapEditorRef = useRef<any>(null);
  const mathquillFieldRef = useRef<any>(null);
  const mathquillApiRef = useRef<any>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(
    null
  );
  const [popupPos, setPopupPos] = useState<{ x: number; y: number }>({
    x: typeof window !== "undefined" ? window.innerWidth - 300 : 1000,
    y: 80,
  });
  const questionState = useAppSelector((state) => state.question);
  const { questionType, points, timeLimit } = questionState as { questionType: any, points: any, timeLimit: any };
  const questionId = Number(params.id);

  // State cho attributes và lựa chọn
  const [attributes, setAttributes] = useState<QuestionAttributeNode[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string>("");
  const [selectedLevelId, setSelectedLevelId] = useState<string>("");
  const [selectedCognitionId, setSelectedCognitionId] = useState<string>("");
  const [customInstructions, setCustomInstructions] = useState<string>("");
  // Subject select state
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [subjectOptions, setSubjectOptions] = useState<
    { value: string; label: string }[]
  >([]);

  // Lấy từng attribute (theo thứ tự hoặc theo name)
  const skillAttr =
    attributes.find((attr) => attr.name === "Kỹ năng") || attributes[0];
  const levelAttr =
    attributes.find((attr) => attr.name === "Mức độ") || attributes[1];
  const cognitionAttr =
    attributes.find((attr) => attr.name === "Mức độ nhận thức") ||
    attributes[2];

  // Get homework_id from URL query parameters
  const getHomeworkIdFromUrl = () => {
    if (!CLONE_QUESTION_EDIT_ENABLED) return undefined;
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const homeworkId = urlParams.get("homework_id");
      return homeworkId ? Number(homeworkId) : undefined;
    }
    return undefined;
  };

  // Get exam_id from URL query parameters
  const getExamIdFromUrl = () => {
    if (!CLONE_QUESTION_EDIT_ENABLED) return undefined;
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const examId = urlParams.get("exam_id");
      return examId ? Number(examId) : undefined;
    }
    return undefined;
  };

  // Fetch subjects for select
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await GetSubjectsList();
        const subjects = res?.data?.subjects || [];
        const options = subjects.map((s: any) => ({
          value: String(s.id),
          label: s.name,
        }));
        if (!isMounted) return;
        setSubjectOptions(options);
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Tải attributes ngay khi component mount (không phụ thuộc môn học)
  useEffect(() => {
    getQuestionAttributes("1").then((attrs) => {
      setAttributes(attrs);
    });
  }, []);

  // Check token and fetch question data when component mounts
  useEffect(() => {
    const token = localStorage.getItem("token");
    setHasToken(!!token);

    if (!token) {
      toast({
        title: "Cảnh báo",
        description:
          "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        variant: "destructive",
      });
      return;
    }

    // Reset state before loading new question data
    dispatch(resetState());

    // Fetch question data
    const fetchQuestionData = async () => {
      try {
        setIsLoading(true);
        if (!questionId) return;
        // Lấy homework_id và exam_id từ URL query param
        const homeworkId = getHomeworkIdFromUrl();
        const examId = getExamIdFromUrl();
        // Truyền homework_id hoặc exam_id vào getQuestionById nếu có
        const questionData = await getQuestionById(
          questionId,
          homeworkId
            ? { homework_id: homeworkId }
            : examId
              ? { exam_id: examId }
              : undefined
        );

        if (!questionData) {
          toast({
            title: "Lỗi",
            description:
              "Không thể tải thông tin câu hỏi. Vui lòng thử lại sau.",
            variant: "destructive",
          });
          return;
        }

        // Map the API data to Redux state
        dispatch(resetState());
        populateFormWithQuestionData(questionData);
        if (isValidSubjectId(questionData.subject_id)) {
          setSelectedSubjectId(String(questionData.subject_id));
        }

      } catch (error) {
        console.error("Error fetching question data:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin câu hỏi. Vui lòng thử lại sau.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestionData();
  }, [dispatch, questionId, toast]);

  // Populate form with question data
  const populateFormWithQuestionData = (questionData: any) => {
    // Set basic question properties
    const uiQuestionType = mapApiTypeToUiType(questionData.type);
    dispatch(setQuestionType(uiQuestionType));

    // Set points and time limit
    if (questionData.metadata) {
      dispatch(setPoints(questionData.metadata.points || 10));
      dispatch(
        setTimeLimit(
          Math.round(((questionData.metadata.time || 60) / 60) * 10) / 10
        )
      ); // Convert seconds to minutes with 1 decimal precision
      // Set custom instructions if available
      if (questionData.metadata.instructions) {
        setCustomInstructions(questionData.metadata.instructions);
      }
    }

    // Set question text and media
    if (questionData.content) {
      dispatch(setQuestionText(questionData.content.text || ""));
      // Set question media if available
      if (
        questionData.type !== "labeling" &&
        questionData.content.medias &&
        questionData.content.medias.length > 0
      ) {
        questionData?.content.medias?.forEach((media: QuestionMedia) => {
          if (media.type === 'image' && media.url) {
            dispatch(setQuestionImage({ payload: { type: 'image', url: media.url } }))
          } else if (media.type === 'audio' && media.url) {
            dispatch(setQuestionAudio({ payload: { type: 'audio', url: media.url } }))
          } else if (media.type === 'video' && media.url) {
            dispatch(setQuestionVideo({ payload: { type: 'video', url: media.url } }))
          }
        });
      }
    }

    // Populate attributes if available
    if (questionData.attributes && Array.isArray(questionData.attributes)) {
      questionData.attributes.forEach((attr: any) => {
        if (attr.value && attr.value.id) {
          // Map based on attribute name or id
          if (attr.name === "Kỹ năng" || attr.id === "1" || attr.id === 1) {
            setSelectedSkillId(attr.value.id);
          } else if (
            attr.name === "Mức độ" ||
            attr.id === "2" ||
            attr.id === 2
          ) {
            setSelectedLevelId(attr.value.id);
          } else if (
            attr.name === "Mức độ nhận thức" ||
            attr.id === "14" ||
            attr.id === 14
          ) {
            setSelectedCognitionId(attr.value.id);
          }
        }
      });
    }

    // Handle different question types
    switch (questionData.type) {
      case "multiple_choice":
        handleMultipleChoiceData(questionData);
        break;

      case "fill_in_blanks":
        handleFillInBlankData(questionData);
        break;

      case "ordering":
        handleOrderingData(questionData);
        break;

      case "matching":
        handleMatchingData(questionData);
        break;

      case "drag_drop":
        handleDragDropData(questionData);
        break;

      case "labeling":
        handleLabelingData(questionData);
        break;

      case "category":
        handleCategoryData(questionData);
        break;

      case "writing":
        handleWritingData(questionData);
        break;

      case "speaking":
        handleSpeakingData(questionData);
        break;
    }
  };

  // Helper functions for populating data by question type
  const handleMultipleChoiceData = (questionData: any) => {
    if (questionData.options && questionData.options.answers) {
      const answerOptions = questionData.options.answers.map((answer: any) => {
        // Handle media for each answer option
        let image, audio, video;
        if (answer.media) {
          if (answer.media.type === "image") image = answer.media.url;
          if (answer.media.type === "audio") audio = answer.media.url;
          if (answer.media.type === "video") video = answer.media.url;
        }

        return {
          id: answer.id
            ? Number.parseInt(answer.id)
            : Math.floor(Math.random() * 1000),
          text: answer.text || "",
          isCorrect: answer.is_correct || false,
          color: `bg-${["blue", "teal", "yellow", "pink", "purple"][
            Math.floor(Math.random() * 5)
            ]
            }-500`,
          image,
          audio,
          video,
        };
      });
      dispatch(setAnswerOptions(answerOptions));
    }
  };

  const handleFillInBlankData = (questionData: any) => {
    if (questionData.options && questionData.options.answers) {
      // Lấy group từ API nếu có
      let blankGroups: any[] = [];
      if (
        questionData.options.groups &&
        questionData.options.groups.length > 0
      ) {
        // Sắp xếp groups theo position trước khi map
        const sortedGroups = questionData.options.groups
          .slice()
          .sort((a: any, b: any) => a.position - b.position);

        blankGroups = sortedGroups.map((group: any, idx: number) => {
          let mediaType = "text";
          let mediaUrl = undefined;
          if (group.media) {
            if (group.media.type === "image")
              (mediaType = "image"), (mediaUrl = group.media.url);
            else if (group.media.type === "audio")
              (mediaType = "audio"), (mediaUrl = group.media.url);
            else if (group.media.type === "video")
              (mediaType = "video"), (mediaUrl = group.media.url);
          }
          return {
            id: group.position, // position bắt đầu từ 1
            text: group.text || "",
            color: `bg-${["blue", "yellow", "green", "pink", "purple"][idx % 5]
              }-700`,
            position: group.position - 1,
            image: mediaType === "image" ? mediaUrl : undefined,
            audio: mediaType === "audio" ? mediaUrl : undefined,
            video: mediaType === "video" ? mediaUrl : undefined,
          };
        });
      } else {
        // fallback: tạo group từ group_position trong answers
        const groupPositions = questionData.options.answers
          .map((answer: any) => answer.group_position)
          .filter((pos: any) => typeof pos === "number" && pos > 0);
        const groupCount =
          groupPositions.length > 0 ? Math.max(...groupPositions) : 1;
        blankGroups = Array.from({ length: groupCount }, (_, idx) => ({
          id: idx + 1,
          text: "",
          color: `bg-${["blue", "yellow", "green", "pink", "purple"][idx % 5]
            }-700`,
          position: idx,
        }));
      }
      // Sắp xếp answers theo correct_position trước khi map
      const sortedAnswers = questionData.options.answers
        .slice()
        .sort(
          (a: any, b: any) =>
            (a.correct_position || 0) - (b.correct_position || 0)
        );

      // Map answer
      const blankAnswers = sortedAnswers.map((answer: any, index: number) => {
        let image, audio;
        if (answer.media) {
          if (answer.media.type === "image") image = answer.media.url;
          if (answer.media.type === "audio") audio = answer.media.url;
        }
        // group_position trên API bắt đầu từ 1, Redux cần index bắt đầu từ 0 hoặc null
        let groupPosition = null;
        if (
          typeof answer.group_position === "number" &&
          answer.group_position > 0
        ) {
          groupPosition = blankGroups.findIndex(
            (g) => g.id === answer.group_position
          );
        }
        return {
          id: answer.id
            ? Number.parseInt(answer.id)
            : Math.floor(Math.random() * 1000),
          text: answer.text || "",
          position: answer.correct_position || 0,
          groupPosition,
          image,
          audio,
        };
      });
      dispatch(setBlankGroups(blankGroups));
      dispatch(setBlankAnswers(blankAnswers));
    }
  };

  const handleOrderingData = (questionData: any) => {
    if (questionData.options) {
      if (questionData.options.direction) {
        dispatch(setOrderDirection(questionData.options.direction));
      }

      // Xử lý trường display từ metadata
      if (questionData.metadata && questionData.metadata.display) {
        dispatch(setDisplay(questionData.metadata.display));
      }

      // Lấy group từ API nếu có
      let orderGroups: any[] = [];
      if (
        questionData.options.groups &&
        questionData.options.groups.length > 0
      ) {
        // Sắp xếp groups theo position trước khi map
        const sortedGroups = questionData.options.groups
          .slice()
          .sort((a: any, b: any) => a.position - b.position);

        orderGroups = sortedGroups.map((group: any, idx: number) => {
          let mediaType = "text";
          let mediaUrl = undefined;
          if (group.media) {
            if (group.media.type === "image")
              (mediaType = "image"), (mediaUrl = group.media.url);
            else if (group.media.type === "audio")
              (mediaType = "audio"), (mediaUrl = group.media.url);
            else if (group.media.type === "video")
              (mediaType = "video"), (mediaUrl = group.media.url);
          }
          return {
            id: group.position, // position bắt đầu từ 1
            text: group.text || "",
            color: `bg-${["blue", "yellow", "green", "pink", "purple"][idx % 5]
              }-700`,
            position: group.position - 1,
            image: mediaType === "image" ? mediaUrl : undefined,
            audio: mediaType === "audio" ? mediaUrl : undefined,
            video: mediaType === "video" ? mediaUrl : undefined,
          };
        });
      } else {
        // fallback: tạo group từ group_position trong answers
        const groupPositions = questionData.options.answers
          .map((answer: any) => answer.group_position)
          .filter((pos: any) => typeof pos === "number" && pos > 0);
        const groupCount =
          groupPositions.length > 0 ? Math.max(...groupPositions) : 1;
        orderGroups = Array.from({ length: groupCount }, (_, idx) => ({
          id: idx + 1,
          text: "",
          color: `bg-${["blue", "yellow", "green", "pink", "purple"][idx % 5]
            }-700`,
          position: idx,
        }));
      }

      // Sắp xếp answers theo correct_position trước khi map
      const sortedAnswers = questionData.options.answers
        .slice()
        .sort(
          (a: any, b: any) =>
            (a.correct_position || 0) - (b.correct_position || 0)
        );

      // Map answer
      const orderItems = sortedAnswers.map((answer: any, index: number) => {
        let image, audio, video;
        if (answer.media) {
          if (answer.media.type === "image") image = answer.media.url;
          if (answer.media.type === "audio") audio = answer.media.url;
          if (answer.media.type === "video") video = answer.media.url;
        }
        // group_position trên API bắt đầu từ 1, Redux cần index bắt đầu từ 0 hoặc null
        let groupPosition = null;
        if (
          typeof answer.group_position === "number" &&
          answer.group_position > 0
        ) {
          // Tìm index của group có position = answer.group_position
          groupPosition = orderGroups.findIndex(
            (g) => g.id === answer.group_position
          );
        }
        return {
          id: answer.id
            ? Number.parseInt(answer.id)
            : Math.floor(Math.random() * 1000),
          text: answer.text || "",
          position: answer.correct_position
            ? answer.correct_position - 1
            : index,
          color:
            groupPosition !== null && groupPosition >= 0
              ? orderGroups[groupPosition]?.color
              : `bg-blue-700`,
          groupPosition,
          image,
          audio,
          video,
        };
      });
      dispatch(setOrderItems(orderItems));
      dispatch(setOrderGroups(orderGroups));
    }
  };

  const handleMatchingData = (questionData: any) => {
    if (
      questionData.options &&
      questionData.options.sources &&
      questionData.options.targets
    ) {
      const sources = questionData.options.sources || [];
      const targets = questionData.options.targets || [];
      const matchItems: any[] = [];
      const maxLen = Math.max(sources.length, targets.length);
      for (let i = 0; i < maxLen; i++) {
        const source = sources[i];
        const target = targets[i];
        if (!source || !target) continue;
        // Handle media for each matching item
        let leftImage, leftAudio, leftVideo, rightImage, rightAudio, rightVideo;
        if (source.content?.media) {
          if (source.content.media.type === "image")
            leftImage = source.content.media.url;
          if (source.content.media.type === "audio")
            leftAudio = source.content.media.url;
          if (source.content.media.type === "video")
            leftVideo = source.content.media.url;
        }
        if (target.content?.media) {
          if (target.content.media.type === "image")
            rightImage = target.content.media.url;
          if (target.content.media.type === "audio")
            rightAudio = target.content.media.url;
          if (target.content.media.type === "video")
            rightVideo = target.content.media.url;
        }
        matchItems.push({
          id: i + 1,
          sourceId: source.id ? Number.parseInt(String(source.id)) : undefined,
          targetId: target.id ? Number.parseInt(String(target.id)) : undefined,
          leftText: source.content?.text || "",
          rightText: target.content?.text || "",
          color: `bg-${["blue", "teal", "yellow", "pink", "purple"][i % 5]
            }-500`,
          position: i,
          leftImage,
          leftAudio,
          leftVideo,
          rightImage,
          rightAudio,
          rightVideo,
        });
      }
      if (matchItems.length > 0) {
        dispatch(setMatchItems(matchItems));
      } else {
        // fallback: create default match items
        const defaultMatchItems: any[] = [
          {
            id: 1,
            leftText: "",
            rightText: "",
            color: "bg-blue-500",
            position: 0,
          },
          {
            id: 2,
            leftText: "",
            rightText: "",
            color: "bg-teal-500",
            position: 1,
          },
          {
            id: 3,
            leftText: "",
            rightText: "",
            color: "bg-yellow-500",
            position: 2,
          },
          {
            id: 4,
            leftText: "",
            rightText: "",
            color: "bg-pink-500",
            position: 3,
          },
        ];
        dispatch(setMatchItems(defaultMatchItems));
      }
    }
  };

  const handleDragDropData = (questionData: any) => {
    if (questionData.content && questionData.content.text) {
      // Count blanks in the text
      const blankMatches = (questionData.content.text.match(/\[blank\]/g) || [])
        .length;
      dispatch(setBlankCount(blankMatches));

      let dragDropOptions: any[] = [];

      if (questionData.options && questionData.options.answers) {
        const correctList = questionData.correct_answers?.list || {};

        dragDropOptions = questionData.options.answers.map(
          (answer: any, index: number) => {
            // Check if this answer is correct and get its blank position
            // Sử dụng correct_position trực tiếp từ answer thay vì tìm trong correctList
            const correctPosition = answer.correct_position || 0;
            const isCorrect = correctPosition > 0;

            // Handle media for each drag drop option
            let image, audio, video;
            if (answer.media) {
              if (answer.media.type === "image") image = answer.media.url;
              if (answer.media.type === "audio") audio = answer.media.url;
              if (answer.media.type === "video") video = answer.media.url;
            }

            return {
              id: answer.id
                ? Number.parseInt(answer.id)
                : Math.floor(Math.random() * 1000),
              text: answer.text || "",
              isCorrect: isCorrect,
              correctPosition,
              groupPosition: answer.group_position
                ? answer.group_position - 1
                : null,
              color: `bg-${["blue", "teal", "yellow", "pink", "purple"][index % 5]
                }-500`,
              image,
              audio,
              video,
            };
          }
        );

        dispatch(setDragDropOptions(dragDropOptions));
      }

      // Load groups from API
      if (questionData.options && questionData.options.groups) {
        const dragDropGroups = questionData.options.groups
          .slice()
          .sort((a: any, b: any) => a.position - b.position)
          .map((group: any, index: number) => {
            // Handle media for each group
            let image, audio, video;
            if (group.media) {
              if (group.media.type === "image") image = group.media.url;
              if (group.media.type === "audio") audio = group.media.url;
              if (group.media.type === "video") video = group.media.url;
            }

            return {
              id: group.id ? Number.parseInt(group.id) : index + 1,
              text: group.text || "",
              color: `bg-${["blue", "teal", "yellow", "pink", "purple"][index % 5]
                }-500`,
              image,
              audio,
              video,
            };
          });

        dispatch(setDragDropGroups(dragDropGroups));
      } else {
        // If no groups from API, create default groups based on answers that have group_position
        const usedGroupPositions = new Set();
        dragDropOptions.forEach((option: any) => {
          if (
            option.groupPosition !== null &&
            option.groupPosition !== undefined
          ) {
            usedGroupPositions.add(option.groupPosition);
          }
        });

        if (usedGroupPositions.size > 0) {
          const maxGroupPosition = Math.max(
            ...(Array.from(usedGroupPositions) as number[])
          );
          const defaultGroups = Array.from(
            { length: maxGroupPosition + 1 },
            (_, index) => ({
              id: index + 1,
              text: `Nhóm ${index + 1}`,
              color: `bg-${["blue", "teal", "yellow", "pink", "purple"][index % 5]
                }-500`,
              position: index,
            })
          );
          dispatch(setDragDropGroups(defaultGroups));
        }
      }
    }
  };

  // Sửa lại hàm convertLabelingFromApiFormat để map groupPosition
  function convertLabelingFromApiFormat(
    questionData: any,
    imageWidth: number,
    imageHeight: number,
    labelGroups: any[]
  ) {
    const blanks = questionData.options?.blanks || [];
    const labels = questionData.options?.labels || [];
    const labelingList = questionData.correct_answers?.list || {};

    return blanks.map((blank: any) => {
      const blankId = blank.id;
      const labelId = labelingList[blankId];
      // Sửa: ép kiểu khi so sánh label.id và labelId
      const label = labels.find((l: any) => String(l.id) === String(labelId));

      // Tìm group_position của label này (trong options.labels)
      let groupPosition: number | null = null;
      if (label && typeof label.group_position === "number") {
        groupPosition = labelGroups.findIndex(
          (g: any) => g.id === label.group_position
        );
        if (groupPosition === -1) groupPosition = null;
      }

      const coords = blank.coordinates || {};
      return {
        id: blank.id, // id của blank (vùng)
        labelApiId: label ? label.id : undefined, // id gốc của label từ API
        labelId, // id của label (mapping cho correct_answers)
        answer: label ? label.text : "",
        x: coords.x ? (coords.x / imageWidth) * 100 : 0,
        y: coords.y ? (coords.y / imageHeight) * 100 : 0,
        width: coords.w ? (coords.w / imageWidth) * 100 : 10,
        height: coords.h ? (coords.h / imageHeight) * 100 : 10,
        groupPosition,
      };
    });
  }

  const handleLabelingData = (questionData: any) => {
    // Xử lý medias array cho labeling
    if (
      questionData.content &&
      questionData.content.medias &&
      questionData.content.medias.length > 0
    ) {
      // Tìm image cho labelImage
      const imageMedia = questionData.content.medias.find(
        (m: any) => m.type === "image"
      );
      if (imageMedia && imageMedia.url) {
        dispatch(setLabelImage(imageMedia.url));
      }

      // Tìm các media khác cho câu hỏi chính
      const audioMedia = questionData.content.medias.filter(
        (m: any) => m.type === "audio"
      );
      const videoMedia = questionData.content.medias.filter(
        (m: any) => m.type === "video"
      );

      if (audioMedia && audioMedia.url) {
        dispatch(
          setQuestionAudio({
            payload: { type: "audio", url: audioMedia.url },
          })
        );
      }
      if (videoMedia && videoMedia.url) {
        dispatch(
          setQuestionVideo({
            payload: { type: "video", url: videoMedia.url },
          })
        );
      }
    } else if (
      questionData.content &&
      questionData.content.media &&
      questionData.content.media.url
    ) {
      // Fallback về media cũ - nếu là image thì dùng cho labelImage
      if (questionData.content.media.type === "image") {
        dispatch(setLabelImage(questionData.content.media.url));
      } else if (questionData.content.media.type === "audio") {
        dispatch(setQuestionAudio({ payload: { type: "audio", url: questionData.content.media.url } }));
      } else if (questionData.content.media.type === "video") {
        dispatch(setQuestionVideo({ payload: { type: "video", url: questionData.content.media.url } }));
      }
    }

    if (questionData.options) {
      // Lấy kích thước gốc của ảnh (nên lấy từ backend hoặc hardcode nếu biết chắc)
      // Ví dụ: 1024x576
      const imageWidth = 1024;
      const imageHeight = 576;
      // Map group từ API vào redux labelGroups
      let labelGroups: any[] = [];
      if (questionData.options.groups) {
        labelGroups = (
          questionData.options.groups as Array<{
            position: number;
            text: string;
          }>
        )
          .slice()
          .sort(
            (a: { position: number }, b: { position: number }) =>
              a.position - b.position
          )
          .map((group: { position: number; text: string }, idx: number) => ({
            id: group.position, // hoặc idx + 1
            text: group.text || "",
          }));
        dispatch(setLabelGroups(labelGroups));
      }
      // Map labelPositions với groupPosition đúng
      const labelPositions = convertLabelingFromApiFormat(
        questionData,
        imageWidth,
        imageHeight,
        labelGroups
      );
      dispatch(setLabelPositions(labelPositions));
    }
  };

  const handleCategoryData = (questionData: any) => {
    if (questionData.options) {
      const apiCategories = questionData.options.categories || [];
      const apiItems = questionData.options.items || [];
      const categoryList = questionData.correct_answers?.list || {};

      const categories: any[] = [];

      // Process each category
      apiCategories.forEach((apiCategory: any, categoryIndex: number) => {
        const categoryId = apiCategory.id || categoryIndex + 1;
        const categoryItems: any[] = [];

        // Find items for this category
        apiItems.forEach((apiItem: any) => {
          const itemId = apiItem.id;
          const itemCategoryId = categoryList[itemId] ?? categoryList[String(itemId)];
          const groupPosition =
            apiItem.group_position ?? apiItem.groupPosition;

          if (
            String(itemCategoryId) === String(apiCategory.id) ||
            groupPosition === categoryIndex + 1 ||
            groupPosition === categoryId
          ) {
            // Handle media for each category item
            let image, audio;
            if (apiItem.media) {
              if (apiItem.media.type === "image") image = apiItem.media.url;
              if (apiItem.media.type === "audio") audio = apiItem.media.url;
            }

            categoryItems.push({
              id: apiItem.id || categoryItems.length + 1,
              text: apiItem.text || "",
              categoryId,
              image,
              audio,
            });
          }
        });

        // Handle media for category
        let categoryImage, categoryAudio;
        if (apiCategory.media) {
          if (apiCategory.media.type === "image")
            categoryImage = apiCategory.media.url;
          if (apiCategory.media.type === "audio")
            categoryAudio = apiCategory.media.url;
        }

        categories.push({
          id: categoryId,
          name: apiCategory.name || "",
          color: `bg-${["blue", "teal", "yellow", "pink", "purple"][categoryIndex % 5]
            }-500`,
          items: categoryItems,
          image: categoryImage,
          audio: categoryAudio,
        });
      });

      dispatch(setCategories(categories));
    }
  };

  const handleWritingData = (questionData: any) => {
    if (questionData.metadata) {
      dispatch(
        setWritingMaxCharacters(questionData.metadata.max_characters || 0)
      );
      dispatch(
        setWritingAllowImageUpload(
          questionData.metadata.allow_image_upload || false
        )
      );
      dispatch(
        setWritingInstructions(
          questionData.metadata.instructions || "Đọc và trả lời câu hỏi."
        )
      );
    }
  };

  const handleSpeakingData = (questionData: any) => {
    if (questionData.metadata) {
      dispatch(
        setSpeakingMaxDuration(questionData.metadata.max_recording_time || 60)
      );
      dispatch(
        setSpeakingInstructions(
          questionData.metadata.instructions || "Đọc to câu sau đây."
        )
      );
    }
  };

  // Move popup handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (mathquillPopupRef.current && e.target === mathquillPopupRef.current) {
      setDragOffset({ x: e.clientX - popupPos.x, y: e.clientY - popupPos.y });
    }
  };
  const handleMouseMove = (e: MouseEvent) => {
    if (dragOffset) {
      setPopupPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    }
  };
  const handleMouseUp = () => setDragOffset(null);
  useEffect(() => {
    if (dragOffset) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragOffset]);

  // Insert LaTeX into Tiptap
  const handleInsertLatex = () => {
    if (tiptapEditorRef.current && mathquillLatex) {
      if (typeof tiptapEditorRef.current.insertLatexInline === "function") {
        tiptapEditorRef.current.insertLatexInline(mathquillLatex);
      } else if (tiptapEditorRef.current.commands) {
        tiptapEditorRef.current.commands.insertContent(mathquillLatex);
      }
      if (tiptapEditorRef.current.commands)
        tiptapEditorRef.current.commands.focus();
    }
  };

  const renderQuestionEditor = () => {
    switch (questionType) {
      case "multiple-choice":
        return <MultipleChoiceQuestion ref={tiptapEditorRef} />;
      case "fill-in-blank":
        return <FillInBlankQuestion ref={tiptapEditorRef} />;
      case "ordering":
        return <OrderingQuestion ref={tiptapEditorRef} />;
      case "matching":
        return <MatchingQuestion ref={tiptapEditorRef} />;
      case "drag-drop":
        return <DragDropQuestion ref={tiptapEditorRef} />;
      case "labeling":
        return <LabelingQuestion ref={tiptapEditorRef} />;
      case "category":
        return <CategoryQuestion ref={tiptapEditorRef} />;
      case "writing":
        return <WritingQuestion ref={tiptapEditorRef} />;
      case "speaking":
        return <SpeakingQuestion ref={tiptapEditorRef} />;
      default:
        return <DefaultQuestion />;
    }
  };

  // Function to handle media preview
  const handlePreviewMedia = (media: { type?: string; url?: string }[]) => {
    if (media) {
      setPreviewMedia({ open: true, media });
    }
  };

  // Validate question data before saving
  const validateQuestion = () => {
    // Check if user is logged in
    if (!hasToken) {
      toast({
        title: "Lỗi",
        description: "Bạn cần đăng nhập để thực hiện thao tác này",
        variant: "destructive",
      });
      router.push("/login");
      return false;
    }

    // kiểm tra xem đã chọn môn học chưa
    if (!isValidSubjectId(selectedSubjectId)) {
      toast({
        title: "Lỗi",
        description: t("validation.subjectRequired"),
        variant: "destructive",
      });
      return false
    }
    // kiểm tra xem đã chọn kỹ năng chưa
    if (!selectedSkillId) {
      toast({
        title: "Lỗi",
        description: t("validation.skillRequired"),
        variant: "destructive",
      });
      return false
    }
    // kiểm tra xem đã chọn mức độ chưa
    if (!selectedLevelId) {
      toast({
        title: "Lỗi",
        description: t("validation.levelRequired"),
        variant: "destructive",
      });
      return false
    }
    // kiểm tra xem đã chọn mức độ nhận thức chưa
    if (!selectedCognitionId) {
      toast({
        title: "Lỗi",
        description: t("validation.cognitionRequired"),
        variant: "destructive",
      });
      return false
    }

    // Validate based on question type
    if (questionType === "multiple-choice") {
      // Check for at least 2 options
      if (questionState.answerOptions.length < 2) {
        toast({
          title: "Lỗi",
          description: "Cần ít nhất 2 tùy chọn trả lời",
          variant: "destructive",
        });
        return false;
      }

      // Check for at least 1 correct answer
      const hasCorrectAnswer = questionState.answerOptions.some(
        (option) => option.isCorrect
      );
      if (!hasCorrectAnswer) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn ít nhất một đáp án đúng",
          variant: "destructive",
        });
        return false;
      }

      // Check if all options have content
      // const emptyOptions = questionState.answerOptions.some(
      //   (option) => !option.text.trim()
      // );
      // if (emptyOptions) {
      //   toast({
      //     title: "Lỗi",
      //     description: "Vui lòng nhập nội dung cho tất cả các tùy chọn",
      //     variant: "destructive",
      //   });
      //   return false;
      // }
    } else if (questionType === "fill-in-blank") {
      // Check for at least 1 blank
      if (questionState.blankAnswers.length < 1) {
        toast({
          title: "Lỗi",
          description: "Cần ít nhất 1 chỗ trống [blank] trong câu hỏi",
          variant: "destructive",
        });
        return false;
      }

      // Check if all blanks have answers
      const emptyAnswers = questionState.blankAnswers.some(
        (answer) => !answer.text.trim()
      );
      if (emptyAnswers) {
        toast({
          title: "Lỗi",
          description: "Vui lòng nhập đáp án cho tất cả các chỗ trống",
          variant: "destructive",
        });
        return false;
      }
    } else if (questionType === "ordering") {
      // Check for at least 2 items to order
      if (questionState.orderItems.length < 2) {
        toast({
          title: "Lỗi",
          description: "Cần ít nhất 2 mục để sắp xếp",
          variant: "destructive",
        });
        return false;
      }

      // Check if all items have content
      // const emptyItems = questionState.orderItems.some(
      //   (item) => !item.text.trim()
      // );
      // if (emptyItems) {
      //   toast({
      //     title: "Lỗi",
      //     description: "Vui lòng nhập nội dung cho tất cả các mục",
      //     variant: "destructive",
      //   });
      //   return false;
      // }
    } else if (questionType === "matching") {
      // Check for at least 2 matching pairs
      if (questionState.matchItems.length < 2) {
        toast({
          title: "Lỗi",
          description: "Cần ít nhất 2 cặp ghép",
          variant: "destructive",
        });
        return false;
      }

      // Check if all left items have content
      // const emptyLeftItems = questionState.matchItems.some(
      //   (item) => !item.leftText.trim()
      // );
      // if (emptyLeftItems) {
      //   toast({
      //     title: "Lỗi",
      //     description: "Vui lòng nhập nội dung cho tất cả các mục bên trái",
      //     variant: "destructive",
      //   });
      //   return false;
      // }

      // Check if all right items have content
      // const emptyRightItems = questionState.matchItems.some(
      //   (item) => !item.rightText.trim()
      // );
      // if (emptyRightItems) {
      //   toast({
      //     title: "Lỗi",
      //     description: "Vui lòng nhập nội dung cho tất cả các mục bên phải",
      //     variant: "destructive",
      //   });
      //   return false;
      // }
    } else if (questionType === "drag-drop") {
      // Check for at least 1 blank
      if (questionState.blankCount < 1) {
        toast({
          title: "Lỗi",
          description: "Cần ít nhất 1 chỗ trống [blank] trong câu hỏi",
          variant: "destructive",
        });
        return false;
      }

      // Check for at least 1 correct answer
      const correctOptions = questionState.dragDropOptions.filter(
        (option) => option.isCorrect
      );
      if (correctOptions.length < 1) {
        toast({
          title: "Lỗi",
          description: "Cần ít nhất 1 đáp án đúng",
          variant: "destructive",
        });
        return false;
      }

      // Check if number of correct answers equals number of blanks
      if (correctOptions.length !== questionState.blankCount) {
        toast({
          title: "Lỗi",
          description: `Số lượng đáp án đúng (${correctOptions.length}) phải bằng số lượng chỗ trống (${questionState.blankCount})`,
          variant: "destructive",
        });
        return false;
      }

      // Check if all options have content
      // const emptyOptions = questionState.dragDropOptions.some(
      //   (option) => !option.text.trim()
      // );
      // if (emptyOptions) {
      //   toast({
      //     title: "Lỗi",
      //     description: "Vui lòng nhập nội dung cho tất cả các tùy chọn",
      //     variant: "destructive",
      //   });
      //   return false;
      // }
    } else if (questionType === "labeling") {
      // Check for image
      if (!questionState.labelImage) {
        toast({
          title: "Lỗi",
          description: "Vui lòng tải lên hình ảnh cho câu hỏi",
          variant: "destructive",
        });
        return false;
      }

      // Check for at least 1 label position
      if (questionState.labelPositions.length < 1) {
        toast({
          title: "Lỗi",
          description: "Cần ít nhất 1 vị trí nhãn trên hình ảnh",
          variant: "destructive",
        });
        return false;
      }

      // Kiểm tra các vị trí nhãn đã chọn group hợp lệ chưa
      const emptyLabels = questionState.labelPositions.some(
        (position) =>
          typeof position.groupPosition !== "number" ||
          position.groupPosition === null ||
          position.groupPosition === undefined ||
          !questionState.labelGroups[position.groupPosition] ||
          !questionState.labelGroups[position.groupPosition].text.trim()
      );
      if (emptyLabels) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn nhóm cho tất cả các vị trí nhãn",
          variant: "destructive",
        });
        return false;
      }
    } else if (questionType === "writing" || questionType === "speaking") {
      // if (!questionState.questionText.trim()) {
      //   toast({
      //     title: "Lỗi",
      //     description: "Vui lòng nhập nội dung câu hỏi",
      //     variant: "destructive",
      //   });
      //   return false;
      // }
    } else if (questionType === "category") {
      // Check for at least 2 categories
      if (questionState.categories.length < 2) {
        toast({
          title: "Lỗi",
          description: "Cần ít nhất 2 danh mục",
          variant: "destructive",
        });
        return false;
      }

      // Check if all categories have names
      // const emptyCategories = questionState.categories.some(
      //   (category) => !category.name.trim()
      // );
      // if (emptyCategories) {
      //   toast({
      //     title: "Lỗi",
      //     description: "Vui lòng nhập tên cho tất cả các danh mục",
      //     variant: "destructive",
      //   });
      //   return false;
      // }

      // Check if all categories have at least 1 item
      const emptyCategoryItems = questionState.categories.some(
        (category) => category.items.length === 0
      );
      if (emptyCategoryItems) {
        toast({
          title: "Lỗi",
          description: "Mỗi danh mục cần có ít nhất 1 mục",
          variant: "destructive",
        });
        return false;
      }

      // Check if all items have content
      // for (const category of questionState.categories) {
      //   const emptyItems = category.items.some((item) => !item.text.trim());
      //   if (emptyItems) {
      //     toast({
      //       title: "Lỗi",
      //       description: `Vui lòng nhập nội dung cho tất cả các mục trong danh mục "${category.name}"`,
      //       variant: "destructive",
      //     });
      //     return false;
      //   }
      // }
    }

    return true;
  };

  // Handle update question
  const handleUpdateQuestion = async () => {
    if (!validateQuestion()) return;

    setIsSaving(true);
    try {
      let apiData;

      // Build mảng attributes đúng format và đúng type
      const attributes: QuestionAttributePayload[] = [
        skillAttr && selectedSkillId
          ? {
            id: skillAttr.id,
            name: skillAttr.name,
            value: {
              id: selectedSkillId,
              name:
                skillAttr.nodes.find((n) => n.id === selectedSkillId)?.name ||
                "",
            },
          }
          : undefined,
        levelAttr && selectedLevelId
          ? {
            id: levelAttr.id,
            name: levelAttr.name,
            value: {
              id: selectedLevelId,
              name:
                levelAttr.nodes.find((n) => n.id === selectedLevelId)?.name ||
                "",
            },
          }
          : undefined,
        cognitionAttr && selectedCognitionId
          ? {
            id: cognitionAttr.id,
            name: cognitionAttr.name,
            value: {
              id: selectedCognitionId,
              name:
                cognitionAttr.nodes.find((n) => n.id === selectedCognitionId)
                  ?.name || "",
            },
          }
          : undefined,
      ].filter((a): a is QuestionAttributePayload => Boolean(a));

      // Convert data based on question type
      if (questionType === "multiple-choice") {
        apiData = convertMultipleChoiceToApiFormat(
          questionState,
          attributes,
          false,
          customInstructions
        );
      } else if (questionType === "fill-in-blank") {
        apiData = convertFillInBlankToApiFormat(
          questionState,
          attributes,
          false,
          customInstructions
        );
      } else if (questionType === "ordering") {
        apiData = convertOrderingToApiFormat(
          questionState,
          attributes,
          false,
          customInstructions
        );
      } else if (questionType === "matching") {
        apiData = convertMatchingToApiFormat(
          questionState,
          attributes,
          false,
          customInstructions
        );
      } else if (questionType === "drag-drop") {
        apiData = convertDragDropToApiFormat(
          questionState,
          attributes,
          false,
          customInstructions
        );
      } else if (questionType === "labeling") {
        apiData = convertLabelingToApiFormat(
          questionState,
          attributes,
          false,
          customInstructions
        );
      } else if (questionType === "writing") {
        apiData = convertWritingToApiFormat(
          questionState,
          attributes,
          customInstructions
        );
      } else if (questionType === "speaking") {
        apiData = convertSpeakingToApiFormat(
          questionState,
          attributes,
          customInstructions
        );
      } else if (questionType === "category") {
        apiData = convertCategoryToApiFormat(
          questionState,
          attributes,
          false,
          customInstructions
        );
      } else {
        toast({
          title: "Thông báo",
          description:
            "Chức năng cập nhật cho loại câu hỏi này đang được phát triển",
        });
        setIsSaving(false);
        return;
      }

      // Add topic to maintain it
      const currentQuestion = await getQuestionById(questionId);
      if (currentQuestion && currentQuestion.topic) {
        apiData.topic = currentQuestion.topic;
      }

      // Add subject_id to the API data
      if (isValidSubjectId(selectedSubjectId)) {
        apiData.subject_id = selectedSubjectId;
      }

      // Get homework_id and exam_id from URL query parameters
      const homeworkId = getHomeworkIdFromUrl();
      const examId = getExamIdFromUrl();

      // Call API to update question with optional parameters
      const result = await updateQuestion(String(questionId), apiData, {
        homework_id: homeworkId,
        exam_id: examId,
      });

      toast({
        title: "Thành công",
        description: "Đã cập nhật câu hỏi thành công",
      });

      markListForRefresh(QUESTION_BANK_LIST_REFRESH_KEY);
      router.push(`/${params.locale}/manage/question-bank`);
    } catch (error: any) {
      console.error("Error updating question:", error);

      // Display detailed error message
      let errorMessage = "Không thể cập nhật câu hỏi. Vui lòng thử lại sau.";

      if (error && error.response) {
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 401) {
          errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
          setTimeout(() => {
            router.push("/login");
          }, 1500);
        } else if (error.response.status === 500) {
          errorMessage = "Lỗi máy chủ nội bộ. Vui lòng liên hệ quản trị viên.";
        }
      }

      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Function to check if the question has media
  const hasQuestionMedia = () => {
    return !!(
      questionState.questionImage ||
      questionState.questionAudio ||
      questionState.questionVideo
    );
  };

  // Function to get the media type and URL
  const getQuestionMediaInfo = () => {
    const medias: Array<{
      type?: string | undefined;
      url?: string | undefined;
    }> = [];

    if (questionState.questionImage) medias.push(...questionState.questionImage)
    if (questionState.questionAudio) medias.push(...questionState.questionAudio)
    if (questionState.questionVideo) medias.push(...questionState.questionVideo)

    return medias.length > 0 ? medias : null
  };

  return (
    <RoleBasedHeaderSidebar>
      <div className="min-h-screen">
        <main
          className="container mx-auto px-4 py-8"
          style={{ position: "relative" }}
        >
          {/* MathQuill popup float */}
          {mathquillOpen && (
            <div
              ref={mathquillPopupRef}
              style={{
                position: "fixed",
                left: popupPos.x,
                top: popupPos.y,
                zIndex: 1000,
                minWidth: 220,
                maxWidth: 320,
                background: "#e0f2fe",
                borderRadius: 10,
                padding: "16px 16px 12px 16px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.13)",
                cursor: dragOffset ? "move" : "default",
                userSelect: "none",
              }}
              onMouseDown={handleMouseDown}
            >
              <p className="font-bold">Nhập biểu thức:</p>
              {/* Virtual math symbol keys */}
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  marginBottom: 8,
                  flexWrap: "wrap",
                }}
              >
                {[
                  { label: "Phân số", latex: "\\frac{}{}" },
                  { label: "Căn", latex: "\\sqrt{}" },
                  { label: "Số mũ", latex: "^{}" },
                  { label: "π", latex: "\\pi" },
                  { label: "∞", latex: "\\infty" },
                  { label: "≈", latex: "\\approx" },
                  { label: "≠", latex: "\\neq" },
                  { label: "≤", latex: "\\leq" },
                  { label: "≥", latex: "\\geq" },
                ].map((btn, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant="secondary"
                    style={{ minWidth: 32, padding: "0 8px", fontSize: 15 }}
                    onClick={(e) => {
                      e.preventDefault();
                      if (
                        mathquillApiRef.current &&
                        typeof mathquillApiRef.current.write === "function"
                      ) {
                        mathquillApiRef.current.write(btn.latex);
                        mathquillApiRef.current.focus();
                        setMathquillLatex(mathquillApiRef.current.latex());
                      } else {
                        setMathquillLatex((latex) => latex + btn.latex);
                      }
                    }}
                  >
                    {btn.label}
                  </Button>
                ))}
              </div>
              <EditableMathField
                latex={mathquillLatex}
                onChange={(mf) => setMathquillLatex(mf.latex())}
                mathquillDidMount={(mq) => {
                  mathquillApiRef.current = mq;
                }}
                style={{
                  background: "transparent",
                  color: "#222",
                  minWidth: 120,
                  maxWidth: 220,
                  fontSize: 20,
                  border: "1.5px solid #9333ea",
                  borderRadius: 6,
                  outline: "none",
                  padding: "6px 10px",
                  marginBottom: 2,
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                <Button
                  size="sm"
                  onClick={handleInsertLatex}
                  disabled={!mathquillLatex.trim()}
                >
                  Thêm vào câu hỏi
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setMathquillOpen(false)}
                >
                  Đóng
                </Button>
              </div>
            </div>
          )}
          {/* Display warning if not logged in */}
          {!hasToken && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p className="font-bold">Cảnh báo!</p>
              <p>
                Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn. Vui lòng
                đăng nhập để tiếp tục.
              </p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => router.push("/login")}
              >
                Đăng nhập
              </Button>
            </div>
          )}

          {/* Header with back button and question type selector */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <p onClick={() => router.back()} className="cursor-pointer">
                  <LucideArrowLeft className="h-5 w-5" />
                </p>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {t("editTitle")}
                </h1>
              </div>
            </div>
            <div className="flex gap-4 flex-wrap flex-col-reverse md:flex-row items-start md:items-center">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-sm text-gray-500">{t("points")}:</span>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={points}
                  onChange={(e) =>
                    dispatch(setPoints(Number.parseInt(e.target.value) || 1))
                  }
                  className="w-full md:w-16 text-center bg-white"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-sm text-gray-500">{t("time")}:</span>
                <Input
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={timeLimit}
                  onChange={(e) =>
                    dispatch(
                      setTimeLimit(Number.parseFloat(e.target.value) || 1.5)
                    )
                  }
                  className="w-full md:w-16 text-center bg-white"
                />
                <span className="text-sm text-gray-500">
                  {t("minutesShort")}
                </span>
              </div>

              {hasQuestionMedia() && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const mediaInfo = getQuestionMediaInfo();
                    if (mediaInfo) {
                      handlePreviewMedia(mediaInfo);
                    }
                  }}
                  title="Xem trước media"
                >
                  <LucideEye className="h-5 w-5" />
                </Button>
              )}

              <Button
                className="bg-purple-600 text-white hover:bg-purple-700 w-full md:w-auto"
                onClick={handleUpdateQuestion}
                disabled={isSaving || isLoading || !hasToken}
              >
                {isSaving ? (
                  <>
                    <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  t("saveChanges")
                )}
              </Button>
            </div>
          </div>

          {/* Select môn học + 3 select cho attributes */}
          <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-4">
            <CustomSelect
              options={sortAlphabetGeneric(
                subjectOptions,
                (item) => item.label,
                true
              )}
              value={selectedSubjectId}
              onValueChange={setSelectedSubjectId}
              placeholder={t("selectSubject")}
              className="w-full md:w-[150px]"
            />
            {skillAttr && (
              <CustomSelect
                options={skillAttr.nodes.map((node) => ({
                  value: node.id,
                  label: node.name,
                }))}
                value={selectedSkillId}
                onValueChange={setSelectedSkillId}
                placeholder={`${skillAttr.name}`}
                className="w-full md:w-[150px]"
              />
            )}
            {levelAttr && (
              <CustomSelect
                options={levelAttr.nodes.map((node) => ({
                  value: node.id,
                  label: node.name,
                }))}
                value={selectedLevelId}
                onValueChange={setSelectedLevelId}
                placeholder={`${levelAttr.name}`}
                className="w-full md:w-[200px]"
              />
            )}
            {cognitionAttr && (
              <CustomSelect
                options={cognitionAttr.nodes.map((node) => ({
                  value: node.id,
                  label: node.name,
                }))}
                value={selectedCognitionId}
                onValueChange={setSelectedCognitionId}
                placeholder={`${cognitionAttr.name}`}
                className="w-full md:w-[250px]"
              />
            )}
          </div>

          {/* Instructions input */}
          <div className="mb-4">
            <Input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Nhập hướng dẫn làm bài"
              className="w-full max-w-2xl"
            />
          </div>

          {/* Render the appropriate question editor based on type */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between mb-3">
              <div></div>
              {/* <Button
                variant="outline"
                size="sm"
                onClick={() => setMathquillOpen(true)}
              >
                Math
              </Button> */}
            </div>
            {renderQuestionEditor()}
          </div>

          {/* Media preview dialog */}
          <Dialog
            open={previewMedia.open}
            onOpenChange={(open) => {
              setPreviewMedia((prev) => ({ ...prev, open }));
            }}
          >
            <DialogContent className="max-w-2xl p-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">
                  Xem trước media
                </DialogTitle>
              </DialogHeader>

              <div className="mt-4">
                <MediaPreview media={previewMedia.media} />
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </RoleBasedHeaderSidebar>
  );
}

export default QuestionEditor;