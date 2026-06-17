"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  HelpCircle,
  Check,
  X,
  Clipboard,
  FileText,
  ImageIcon,
  Music,
  Video,
  ListFilter,
  BookOpen,
  Layers,
  PenTool,
  Shuffle,
  Tag,
  MoreHorizontal,
  Copy,
  MoveHorizontal,
  GripHorizontal,
  MessageSquare,
  Clock,
  User,
  Loader2,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import katex from "katex";
import "katex/dist/katex.min.css";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  getQuestions,
  deleteQuestion,
  getQuestionAttributes,
  QuestionMedia,
} from "@/lib/api/questions";
import { useToast } from "@/components/ui/use-toast";
import { TiptapMathViewer } from "@/components/question-editor/tiptap-math-viewer";
import { LatexText } from "@/components/latex-text";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleBasedHeaderSidebar } from "@/components/layout/role-based-header-sidebar";
import { useDebounce } from "@/hooks/use-debounce";
import { BRAND_COLORS } from "@/lib/constants/colors";
import {
  QUESTION_TYPES,
  DIFFICULTY_LEVELS,
  CATEGORIES,
  mapQuestionType,
  getQuestionTypeOptions,
  getCategoryLabel,
} from "@/lib/constants/questionTypes";
import ExportData from "@/components/ui/export-data";
import ImportData from "@/components/ui/import-data";
import { exportQuestion, importQuestion } from "@/lib/api/export-import";
import { useCurrentLocale, useTypedTranslations } from "@/lib/i18n/client";
import { useQueryString } from "@/hooks/use-query-string";
import {
  adminPrimaryButtonClass,
  adminSecondaryButtonClass,
} from "@/components/admin/admin-list-header";

export default function QuestionBankPage() {
  const { searchParamsUrl, getValueFromQueryString, setQueryParams } = useQueryString()
  const { toast } = useToast();
  const t = useTypedTranslations("questionBank");
  const currentLocale = useCurrentLocale();
  const localePrefix = `/${currentLocale}`;

  // Unified filter state
  const [questionFilters, setQuestionFilters] = useState({
    page: 1,
    limit: 20,
    search: "",
    type: undefined as string | undefined,
  });

  const [questions, setQuestions] = useState<DisplayQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Thêm state cho pagination info
  const [paginationInfo, setPaginationInfo] = useState({
    total: 0,
    currentPage: 1,
    totalPages: 0,
    perPage: 20,
  });

  // Sử dụng debounce cho search query (delay 500ms)
  const debouncedSearchQuery = useDebounce(questionFilters.search, 500);

  // State cho attributes filter
  const [attributeFilters, setAttributeFilters] = useState<string[]>([
    "all",
    "all",
    "all",
  ]);
  const [attributeNodes, setAttributeNodes] = useState<any[]>([]);

  // Lấy danh sách câu hỏi từ API với phân trang server-side
  const fetchQuestions = async (filters = questionFilters) => {
    try {
      setLoading(true);

      const params: any = {
        page: filters.page,
        per_page: filters.limit,
        keyword: filters.search || undefined,
        sort_created_at: "newest",
      };

      if (filters.type && filters.type !== "all") {
        params.question_type = filters.type;
      }
      console.log(attributeFilters);

      // Thêm attribute_ids vào params nếu có filter được chọn
      const selectedAttributeIds = attributeFilters
        .filter((filter, index) => filter !== "all" && attributeNodes[index])
        .map((filter) => parseInt(filter))
        .filter((id) => !isNaN(id));

      if (selectedAttributeIds.length > 0) {
        params.attribute_ids = selectedAttributeIds.join(",");
      }

      const apiResponse = await getQuestions(params);

      // Kiểm tra nếu apiResponse có cấu trúc đúng
      if (!apiResponse || !Array.isArray(apiResponse.questions)) {
        setQuestions([]);
        setHasMore(false);
        setPaginationInfo({
          total: 0,
          currentPage: filters.page,
          totalPages: 0,
          perPage: filters.limit,
        });
        return;
      }

      // Cập nhật pagination info từ API response
      setPaginationInfo({
        total: apiResponse.total_count,
        currentPage: apiResponse.current_page,
        totalPages: apiResponse.total_pages,
        perPage: filters.limit,
      });

      // Cập nhật hasMore dựa trên total_pages
      setHasMore(apiResponse.current_page < apiResponse.total_pages);

      // Chuyển đổi dữ liệu từ API sang định dạng hiển thị
      const formattedQuestions: DisplayQuestion[] = apiResponse.questions
        .map((question: any): DisplayQuestion | null => {
          try {
            // Xác định loại media - ưu tiên medias array
            const getMediaFromQuestion = () => {
              if (
                question.content?.medias &&
                question.content.medias.length > 0
              ) {
                const imageMedia = question.content.medias.filter(
                  (m: any) => m.type === "image"
                );
                const audioMedia = question.content.medias.filter(
                  (m: any) => m.type === "audio"
                );
                const videoMedia = question.content.medias.filter(
                  (m: any) => m.type === "video"
                );

                // Đối với labeling, không gán image vào questionImage
                if (question.type === "labeling") {
                  return {
                    image: undefined, // Không gán image cho labeling
                    audio: audioMedia,
                    video: videoMedia,
                  };
                }

                return {
                  image: imageMedia,
                  audio: audioMedia,
                  video: videoMedia,
                };
              }
              return {
                image:
                  question.content?.media?.type === 'image'
                    ? [question.content.media]
                    : undefined,
                audio:
                  question.content?.media?.type === 'audio'
                    ? [question.content.media]
                    : undefined,
                video:
                  question.content?.media?.type === 'video'
                    ? [question.content.media]
                    : undefined
              };
            };

            const media = getMediaFromQuestion();
            const hasImage = !!media.image;
            const hasAudio = !!media.audio;
            const hasVideo = !!media.video;

            // Chuyển đổi loại câu hỏi
            const type = mapQuestionType(question.type);

            // Thông tin cơ bản
            const displayQuestion: DisplayQuestion = {
              id:
                question.id ||
                `temp-${Math.random().toString(36).substring(2, 9)}`,
              question: question.content?.text || t("noContent"),
              type,
              points: question.metadata?.points || 10,
              timeLimit: question.metadata?.time || 60,
              createdAt: question.created_at
                ? new Date(question.created_at).toLocaleString()
                : "",
              updatedAt: question.updated_at
                ? new Date(question.updated_at).toLocaleString()
                : "",
              attributes: question.attributes || [],
            };

            // Thêm media nếu có
            if (hasImage) displayQuestion.image = media.image;
            if (hasAudio) displayQuestion.audio = media.audio;
            if (hasVideo) displayQuestion.video = media.video;

            // Xử lý đáp án dựa trên loại câu hỏi
            switch (question.type) {
              case "multiple_choice":
                displayQuestion.answers =
                  (question.options?.answers?.map(
                    (answer: any): QuestionAnswer => ({
                      id: answer.id,
                      text: answer.text || "",
                      isCorrect: answer.is_correct || false,
                      image:
                        answer.media?.type === "image"
                          ? answer.media?.url || null
                          : null,
                      // add audio support
                      ...(answer.media?.type === "audio"
                        ? { audio: answer.media?.url || null }
                        : {}),
                    })
                  ) as QuestionAnswer[]) || [];
                break;

              case "fill_in_blanks":
                displayQuestion.content = question.content?.text || "";
                displayQuestion.answers =
                  (question.options?.answers?.map(
                    (answer: any): QuestionAnswer => ({
                      id: answer.id,
                      position: answer.correct_position || 0,
                      text: answer.text || "",
                      isCorrect: true,
                    })
                  ) as QuestionAnswer[]) || [];
                break;

              case "ordering":
                const orderingItems: QuestionAnswer[] =
                  (question.options?.answers?.map(
                    (answer: any): QuestionAnswer => ({
                      id: answer.id,
                      text: answer.text || "",
                      image:
                        answer.media?.type === "image"
                          ? answer.media?.url || null
                          : null,
                      // add audio support
                      ...(answer.media?.type === "audio"
                        ? { audio: answer.media?.url || null }
                        : {}),
                      correctPosition: answer.correct_position || null,
                    })
                  ) as QuestionAnswer[]) || [];
                const correctOrderIds: (string | number)[] =
                  question.correct_answers?.ids || [];
                orderingItems.forEach((item: QuestionAnswer) => {
                  const index = correctOrderIds.findIndex(
                    (id: string | number) => id === item.id
                  );
                  if (index !== -1) {
                    item.correctPosition = index + 1;
                  }
                });
                const sortedOrderingItems = [...orderingItems].sort(
                  (a: QuestionAnswer, b: QuestionAnswer) => {
                    if (a.correctPosition && b.correctPosition) {
                      return a.correctPosition - b.correctPosition;
                    }
                    return 0;
                  }
                );
                displayQuestion.answers = sortedOrderingItems;
                break;

              case "matching":
                const sources: any[] = question.options?.sources || [];
                const targets: any[] = question.options?.targets || [];
                const matchingList: Record<string, string> =
                  question.correct_answers?.list || {};
                const matchItems: MatchItem[] = [];

                // Xử lý từ sources và targets với logic mới
                for (const source of sources) {
                  const sourceId = source.id;
                  const targetText = matchingList[sourceId]; // Lấy text từ mapping

                  if (targetText) {
                    // Tìm target có content.text hoặc content.correct_position trùng với targetText
                    const target = targets.find((t: any) => {
                      return (
                        t.content?.text === targetText ||
                        t.content?.correct_position?.toString() ===
                        targetText ||
                        t.id === targetText
                      );
                    });

                    if (target) {
                      matchItems.push({
                        leftId: sourceId,
                        leftText: source.content?.text || source.text || "",
                        leftImage:
                          source.content?.media?.url &&
                            source.content.media.type === "image"
                            ? source.content.media.url
                            : source.media?.type === "image"
                              ? source.media?.url || null
                              : null,
                        // add left audio
                        ...(source.content?.media?.type === "audio"
                          ? { leftAudio: source.content.media.url }
                          : source.media?.type === "audio"
                            ? { leftAudio: source.media.url }
                            : {}),
                        rightId: target.id,
                        rightText: target.content?.text || target.text || "",
                        rightImage:
                          target.content?.media?.url &&
                            target.content.media.type === "image"
                            ? target.content.media.url
                            : target.media?.type === "image"
                              ? target.media?.url || null
                              : null,
                        // add right audio
                        ...(target.content?.media?.type === "audio"
                          ? { rightAudio: target.content.media.url }
                          : target.media?.type === "audio"
                            ? { rightAudio: target.media.url }
                            : {}),
                      } as any);
                    }
                  }
                }

                // Nếu không có matchItems từ cách trên, thử với logic cũ
                if (matchItems.length === 0) {
                  for (const source of sources) {
                    const sourceId = source.id;
                    const targetId = matchingList[sourceId];
                    if (targetId) {
                      const target = targets.find(
                        (t: any) =>
                          t.id === targetId ||
                          t.content?.correct_position === targetId
                      );
                      if (target) {
                        matchItems.push({
                          leftId: sourceId,
                          leftText: source.content?.text || source.text || "",
                          leftImage:
                            source.content?.media?.url &&
                              source.content.media.type === "image"
                              ? source.content.media.url
                              : source.media?.type === "image"
                                ? source.media?.url || null
                                : null,
                          ...(source.content?.media?.type === "audio"
                            ? { leftAudio: source.content.media.url }
                            : source.media?.type === "audio"
                              ? { leftAudio: source.media.url }
                              : {}),
                          rightId: target.id,
                          rightText: target.content?.text || target.text || "",
                          rightImage:
                            target.content?.media?.url &&
                              target.content.media.type === "image"
                              ? target.content.media.url
                              : target.media?.type === "image"
                                ? target.media?.url || null
                                : null,
                          ...(target.content?.media?.type === "audio"
                            ? { rightAudio: target.content.media.url }
                            : target.media?.type === "audio"
                              ? { rightAudio: target.media.url }
                              : {}),
                        } as any);
                      }
                    }
                  }
                }

                // Fallback cuối cùng: sử dụng answers array
                if (matchItems.length === 0 && question.options?.answers) {
                  const answers = question.options.answers;
                  for (let i = 0; i < answers.length; i += 2) {
                    if (answers[i] && answers[i + 1]) {
                      matchItems.push({
                        leftId: answers[i].id,
                        leftText: answers[i].text || "",
                        leftImage:
                          answers[i].media?.type === "image"
                            ? answers[i].media?.url || null
                            : null,
                        ...(answers[i].media?.type === "audio"
                          ? { leftAudio: answers[i].media?.url }
                          : {}),
                        rightId: answers[i + 1].id,
                        rightText: answers[i + 1].text || "",
                        rightImage:
                          answers[i + 1].media?.type === "image"
                            ? answers[i + 1].media?.url || null
                            : null,
                        ...(answers[i + 1].media?.type === "audio"
                          ? { rightAudio: answers[i + 1].media?.url }
                          : {}),
                      } as any);
                    }
                  }
                }

                displayQuestion.matchItems = matchItems;
                break;

              case "drag_drop":
                displayQuestion.questionText = question.content?.text || "";
                const dragDropOptions: DragDropOption[] =
                  (question.options?.answers?.map(
                    (answer: any): DragDropOption => {
                      const correctPosition =
                        question.correct_answers?.list?.[answer.id] || 0;
                      return {
                        id: answer.id,
                        text: answer.text || "",
                        correctPosition,
                        isCorrect: correctPosition > 0,
                      };
                    }
                  ) as DragDropOption[]) || [];
                displayQuestion.dragDropOptions = dragDropOptions;
                break;

              case "labeling":
                // Lấy image cho labeling từ medias array hoặc media cũ
                const getLabelImageForDisplay = () => {
                  if (
                    question.content?.medias &&
                    question.content.medias.length > 0
                  ) {
                    const imageMedia = question.content.medias.find(
                      (m: any) => m.type === "image"
                    );
                    return imageMedia?.url;
                  }
                  return question.content?.media?.type === "image"
                    ? question.content.media.url
                    : null;
                };
                displayQuestion.labelImage = getLabelImageForDisplay();
                const labels: any[] = question.options?.labels || [];
                const blanks: any[] = question.options?.blanks || [];
                const labelingList: Record<string, string> =
                  question.correct_answers?.list || {};
                displayQuestion.labels = labels.map(
                  (label: any): Label => ({
                    id: label.id,
                    text: label.text || "",
                  })
                );
                const labelPositions: LabelPosition[] = [];
                for (const blank of blanks) {
                  const blankId = blank.id;
                  const labelId = labelingList[blankId];
                  const label = labelId
                    ? labels.find((l: any) => l.id === labelId)
                    : null;
                  if (blank.coordinates) {
                    labelPositions.push({
                      id: blankId,
                      labelId: labelId,
                      answer: label ? label.text : "",
                      x: blank.coordinates.x || 0,
                      y: blank.coordinates.y || 0,
                      width: blank.coordinates.w || 10,
                      height: blank.coordinates.h || 10,
                    });
                  }
                }
                if (labelPositions.length === 0 && labels.length > 0) {
                  labels.forEach((label: any, index: number) => {
                    const yPosition = 20 + index * 20;
                    labelPositions.push({
                      id: `default-${index}`,
                      labelId: label.id,
                      answer: label.text || "",
                      x: 10,
                      y: yPosition,
                      width: 20,
                      height: 15,
                    });
                  });
                }
                displayQuestion.labelPositions = labelPositions;
                break;

              case "category":
                const items: any[] = question.options?.items || [];
                const categories: any[] = question.options?.categories || [];
                const categoryList: Record<string, string> =
                  question.correct_answers?.list || {};
                const categoryStructure: CategoryStruct[] = [];
                const categoryMap: Record<string, CategoryStruct> = {};
                categories.forEach((cat: any) => {
                  const catId = cat.id;
                  if (!categoryMap[catId]) {
                    categoryMap[catId] = {
                      id: catId,
                      name: cat.name || "",
                      image:
                        cat.media?.type === "image"
                          ? cat.media?.url || null
                          : null,
                      ...(cat.media?.type === "audio"
                        ? { audio: cat.media?.url || null }
                        : {}),
                      items: [],
                    } as any;
                    categoryStructure.push(categoryMap[catId]);
                  }
                });
                items.forEach((item: any) => {
                  const itemId = item.id;
                  const categoryId = categoryList[itemId];
                  if (categoryId && categoryMap[categoryId]) {
                    categoryMap[categoryId].items.push({
                      id: itemId,
                      text: item.text || "",
                      image:
                        item.media?.type === "image"
                          ? item.media?.url || null
                          : null,
                      ...(item.media?.type === "audio"
                        ? { audio: item.media?.url || null }
                        : {}),
                    } as any);
                  }
                });
                displayQuestion.categories = categoryStructure;
                break;
            }

            return displayQuestion;
          } catch {
            return null;
          }
        })
        .filter(Boolean) as DisplayQuestion[]; // Lọc bỏ các phần tử null

      setQuestions(formattedQuestions);
    } catch {
      toast({
        title: t("errorTitle"),
        description: t("loadQuestionsError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Lấy attributes và load dữ liệu lần đầu khi mount
  useEffect(() => {
    getQuestionAttributes("1").then((attrs) => {
      setAttributeNodes(attrs || []);
    });
    // Load dữ liệu lần đầu
    fetchQuestions({ ...questionFilters, page: 1 });
    setIsInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gọi lại fetchQuestions mỗi khi debouncedSearchQuery, type hoặc attributeFilters thay đổi
  useEffect(() => {
    if (isInitialized) {
      setQuestionFilters((prev) => ({ ...prev, page: 1 })); // Reset về trang 1 khi search, type hoặc attributes thay đổi
      fetchQuestions({
        ...questionFilters,
        page: 1,
        search: debouncedSearchQuery,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearchQuery,
    questionFilters.type,
    attributeFilters,
    isInitialized,
  ]);

  // Gọi fetchQuestions khi page thay đổi
  useEffect(() => {
    if (isInitialized) {
      fetchQuestions(questionFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionFilters.page]);

  // Hiển thị tất cả câu hỏi từ API (đã được lọc ở server-side)
  const displayedQuestions = questions;

  // Danh sách loại câu hỏi để lọc
  const questionTypes = getQuestionTypeOptions(t);

  // Hàm xử lý xóa câu hỏi
  const handleDeleteQuestion = async (id: number) => {
    try {
      setLoading(true);
      await deleteQuestion(id);
      toast({
        title: "Thành công",
        description: "Đã xóa câu hỏi thành công",
      });
      // Thêm timeout 500ms trước khi fetch lại danh sách
      await new Promise((resolve) => setTimeout(resolve, 500));
      await fetchQuestions(questionFilters);
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể xóa câu hỏi. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuestionFilters((prev) => ({
      ...prev,
      search: e.target.value,
      page: 1,
    }));
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQuestionFilters((prev) => ({
      ...prev,
      type: e.target.value === "all" ? undefined : e.target.value,
      page: 1,
    }));
    e.target.value === "all" || setQueryParams({ type: e.target.value })
  };

  const handlePageChange = (newPage: number) => {
    setQuestionFilters((prev) => ({ ...prev, page: newPage }));
  };

  useEffect(() => {
    if (getValueFromQueryString('type')) {
      setQuestionFilters((prev) => ({ ...prev, type: getValueFromQueryString('type') as string }))
    }
    if (getValueFromQueryString('skill')) {
      setAttributeFilters((prev) => ([
        getValueFromQueryString('skill') as string,
        prev[1],
        prev[2]
      ]))
    }
    if (getValueFromQueryString('level')) {
      setAttributeFilters((prev) => ([
        prev[0],
        getValueFromQueryString('level') as string,
        prev[2]
      ]))
    }
    if (getValueFromQueryString('level_awareness')) {
      setAttributeFilters((prev) => ([
        prev[0],
        prev[1],
        getValueFromQueryString('level_awareness') as string
      ]))
    }
  }, [searchParamsUrl])

  return (
    <RoleBasedHeaderSidebar>
      <div className="min-h-screen overflow-x-hidden">
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header Section - Mobile First */}
          <div className="mb-1 sm:mb-2">
            <div className="flex flex-col space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                    {t("title")}
                  </h1>
                  <p className="text-gray-500 font-medium text-sm sm:text-base mt-1">
                    {t("subtitle")}
                  </p>
                </div>

                {/* Export and Import Buttons */}
                <div className="flex gap-2 justify-center sm:justify-end">
                  <ExportData
                    onExport={async () => {
                      try {
                        const response = await exportQuestion();
                        if (response.data && response.data.url) {
                          const link = document.createElement("a");
                          link.href = response.data.url;
                          link.download = `questions_${new Date().toISOString().split("T")[0]
                            }.xlsx`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      } catch {
                        toast({
                          title: t("exportErrorTitle"),
                          description: t("exportErrorDesc"),
                          variant: "destructive",
                        });
                      }
                    }}
                    label={t("exportLabel")}
                  />
                  <ImportData
                    onImport={async (file) => {
                      try {
                        const response = await importQuestion(file);
                        if (response.code === 200) {
                          toast({
                            title: t("importSuccessTitle"),
                            description:
                              response.data.message || t("importSuccessDesc"),
                          });
                          // Refresh danh sách câu hỏi sau khi import thành công
                          fetchQuestions();
                        } else {
                          toast({
                            title: t("importErrorTitle"),
                            description:
                              response.message || t("importErrorDesc"),
                            variant: "destructive",
                          });
                        }
                      } catch {
                        toast({
                          title: t("importErrorTitle"),
                          description: t("importErrorDesc"),
                          variant: "destructive",
                        });
                      }
                    }}
                    accept={".csv,.xlsx"}
                    label={t("importLabel")}
                  />
                </div>
              </div>

              {/* Search and Action Section */}
              <div className="flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 xl:h-5 xl:w-5" />
                  <input
                    type="text"
                    placeholder={t("searchPlaceholder")}
                    value={questionFilters.search}
                    onChange={handleSearchChange}
                    className="w-full pl-11 sm:pl-12 pr-4 py-3 rounded-2xl border-0 bg-white shadow-sm focus:shadow-md transition-shadow text-gray-700 placeholder:text-gray-400 text-sm sm:text-base"
                  />
                </div>

                {/* Filter Controls */}
                <div className="flex flex-col xl:flex-row gap-3 xl:items-center">
                  {/* Question Type Filter */}
                  <div className="relative">
                    <select
                      className="w-full xl:w-auto px-4 py-3 rounded-2xl border-0 bg-white shadow-sm focus:shadow-md transition-shadow text-gray-700 text-sm xl:text-base appearance-none pr-10 min-w-[160px]"
                      value={questionFilters.type || "all"}
                      onChange={handleTypeChange}
                    >
                      {questionTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Attribute filter 1 */}
                  {attributeNodes[0] && (
                    <div className="relative">
                      <select
                        className="w-full xl:w-auto px-4 py-3 rounded-2xl border-0 bg-white shadow-sm focus:shadow-md transition-shadow text-gray-700 text-sm xl:text-base appearance-none pr-10 min-w-[140px]"
                        value={attributeFilters[0]}
                        onChange={(e) => {
                          setAttributeFilters([
                            e.target.value,
                            attributeFilters[1],
                            attributeFilters[2],
                          ])
                          setQueryParams({ skill: e.target.value })
                        }
                        }
                      >
                        <option value="all">
                          {t("allOf", { name: attributeNodes[0].name })}
                        </option>
                        {attributeNodes[0].nodes.map((node: any) => (
                          <option key={node.id} value={node.id}>
                            {node.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  )}

                  {/* Attribute filter 2 */}
                  {attributeNodes[1] && (
                    <div className="relative">
                      <select
                        className="w-full xl:w-auto px-4 py-3 rounded-2xl border-0 bg-white shadow-sm focus:shadow-md transition-shadow text-gray-700 text-sm xl:text-base appearance-none pr-10 min-w-[140px]"
                        value={attributeFilters[1]}
                        onChange={(e) => {
                          setAttributeFilters([
                            attributeFilters[0],
                            e.target.value,
                            attributeFilters[2],
                          ])
                          setQueryParams({ level: e.target.value })
                        }
                        }
                      >
                        <option value="all">
                          {t("allOf", { name: attributeNodes[1].name })}
                        </option>
                        {attributeNodes[1].nodes.map((node: any) => (
                          <option key={node.id} value={node.id}>
                            {node.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  )}

                  {/* Attribute filter 3 */}
                  {attributeNodes[2] && (
                    <div className="relative">
                      <select
                        className="w-full xl:w-auto px-4 py-3 rounded-2xl border-0 bg-white shadow-sm focus:shadow-md transition-shadow text-gray-700 text-sm xl:text-base appearance-none pr-10 min-w-[140px]"
                        value={attributeFilters[2]}
                        onChange={(e) => {
                          setAttributeFilters([
                            attributeFilters[0],
                            attributeFilters[1],
                            e.target.value,
                          ])
                          setQueryParams({ level_awareness: e.target.value })
                        }}
                      >
                        <option value="all">
                          {t("allOf", { name: attributeNodes[2].name })}
                        </option>
                        {attributeNodes[2].nodes.map((node: any) => (
                          <option key={node.id} value={node.id}>
                            {node.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  )}

                  {/* Create Question Button */}
                  <Button
                    className="w-full xl:w-auto px-4 sm:px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm xl:text-base rounded-2xl"
                    style={{
                      backgroundColor: BRAND_COLORS.orange,
                      color: "white",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#d97a1a";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        BRAND_COLORS.orange;
                    }}
                    asChild
                  >
                    <Link
                      href={`${localePrefix}/manage/question-bank/create-question`}
                    >
                      <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden sm:inline">
                        {t("createNewFull")}
                      </span>
                      <span className="sm:hidden">{t("createNewShort")}</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Thông tin tổng số câu hỏi */}
          {!loading && (
            <div className="mb-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                <FileText className="h-4 w-4" />
                <span className="font-medium">
                  {t("totalQuestions", { total: String(paginationInfo.total) })}
                </span>
              </div>
            </div>
          )}

          {/* Danh sách câu hỏi */}
          <Tabs defaultValue="all" className="mb-8">
            <TabsContent value="all">
              {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              ) : displayedQuestions.length > 0 ? (
                <div className="space-y-4">
                  {displayedQuestions.map((question) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      handleDeleteQuestion={handleDeleteQuestion}
                    />
                  ))}

                  {/* Phân trang */}
                  {(questionFilters.page > 1 || hasMore) && (
                    <div className="mt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() =>
                                handlePageChange(
                                  Math.max(1, questionFilters.page - 1)
                                )
                              }
                              className={
                                questionFilters.page === 1
                                  ? "pointer-events-none opacity-50"
                                  : ""
                              }
                            />
                          </PaginationItem>

                          {/* Hiển thị số trang cụ thể */}
                          {paginationInfo.totalPages > 0 && (
                            <>
                              {/* Trang đầu */}
                              {questionFilters.page > 3 && (
                                <PaginationItem>
                                  <PaginationLink
                                    onClick={() => handlePageChange(1)}
                                  >
                                    1
                                  </PaginationLink>
                                </PaginationItem>
                              )}

                              {/* Dấu ... */}
                              {questionFilters.page > 4 && (
                                <PaginationItem>
                                  <span className="px-3 py-2 text-sm text-gray-500">
                                    ...
                                  </span>
                                </PaginationItem>
                              )}

                              {/* Trang hiện tại và 2 trang xung quanh */}
                              {Array.from(
                                {
                                  length: Math.min(
                                    3,
                                    paginationInfo.totalPages
                                  ),
                                },
                                (_, i) => {
                                  const pageNum = Math.max(
                                    1,
                                    Math.min(
                                      questionFilters.page - 1 + i,
                                      paginationInfo.totalPages
                                    )
                                  );
                                  return (
                                    <PaginationItem key={pageNum}>
                                      <PaginationLink
                                        onClick={() =>
                                          handlePageChange(pageNum)
                                        }
                                        isActive={
                                          pageNum === questionFilters.page
                                        }
                                      >
                                        {pageNum}
                                      </PaginationLink>
                                    </PaginationItem>
                                  );
                                }
                              ).filter(
                                (_, index, array) =>
                                  array.findIndex(
                                    (item) => item.key === array[index].key
                                  ) === index
                              )}

                              {/* Dấu ... */}
                              {questionFilters.page <
                                paginationInfo.totalPages - 2 && (
                                  <PaginationItem>
                                    <span className="px-3 py-2 text-sm text-gray-500">
                                      ...
                                    </span>
                                  </PaginationItem>
                                )}

                              {/* Trang cuối */}
                              {questionFilters.page <
                                paginationInfo.totalPages - 1 && (
                                  <PaginationItem>
                                    <PaginationLink
                                      onClick={() =>
                                        handlePageChange(
                                          paginationInfo.totalPages
                                        )
                                      }
                                    >
                                      {paginationInfo.totalPages}
                                    </PaginationLink>
                                  </PaginationItem>
                                )}
                            </>
                          )}

                          <PaginationItem>
                            <PaginationNext
                              onClick={() =>
                                handlePageChange(questionFilters.page + 1)
                              }
                              className={
                                !hasMore ? "pointer-events-none opacity-50" : ""
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>

                      {/* Thông tin phân trang */}
                      <div className="text-center mt-2 text-sm text-gray-500">
                        {t("pageStatus", {
                          page: String(questionFilters.page),
                          isLast: hasMore ? "" : t("lastPageSuffix"),
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                  <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-600">
                    {t("emptyTitle")}
                  </h3>
                  <p className="text-gray-500 mt-1">{t("emptySubtitle")}</p>
                  <Button className={`mt-4 ${adminPrimaryButtonClass}`} asChild>
                    <Link
                      href={`${localePrefix}/manage/question-bank/create-question`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t("createNewFull")}
                    </Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="recent">
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                <Clipboard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-600">
                  {t("recentLoadingTitle")}
                </h3>
                <p className="text-gray-500 mt-1">{t("pleaseWait")}</p>
              </div>
            </TabsContent>

            <TabsContent value="most-used">
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-600">
                  {t("mostUsedLoadingTitle")}
                </h3>
                <p className="text-gray-500 mt-1">{t("pleaseWait")}</p>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </RoleBasedHeaderSidebar>
  );
}

// Component hiển thị câu hỏi dạng card
function QuestionCard({
  question,
  handleDeleteQuestion,
}: {
  question: DisplayQuestion;
  handleDeleteQuestion: (id: number) => void;
}) {
  const t = useTypedTranslations("questionBank");
  const currentLocale = useCurrentLocale();
  const localePrefix = `/${currentLocale}`;
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  // Lấy thông tin loại câu hỏi
  const questionType = QUESTION_TYPES[
    question.type as keyof typeof QUESTION_TYPES
  ] || {
    name: t("typeOther"),
    icon: HelpCircle,
    color: "bg-gray-100 text-gray-600",
  };

  const localizedTypeName = (() => {
    switch (question.type) {
      case "multiple_choice":
        return t("type.multiple_choice");
      case "fill_in_blanks":
        return t("type.fill_in_blanks");
      case "matching":
        return t("type.matching");
      case "ordering":
        return t("type.ordering");
      case "writing":
        return t("type.writing");
      case "speaking":
        return t("type.speaking");
      case "labeling":
        return t("type.labeling");
      case "category":
        return t("type.category");
      case "drag_drop":
        return t("type.drag_drop");
      default:
        return questionType.name;
    }
  })();

  // Get Icon component
  const IconComponent = questionType.icon;

  // Xác định nếu câu hỏi có media
  const hasImage = !!question.image?.length
  const hasAudio = !!question.audio?.length
  const hasVideo = !!question.video?.length

  // Định dạng thời gian
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Deprecated helper replaced by LatexText; keep for legacy if needed
  const renderInlineMath = (text: string, className = "text-sm") => (
    <LatexText value={text} className={className} inline />
  );

  // Hiển thị đáp án dựa trên loại câu hỏi
  const renderAnswers = () => {
    switch (question.type) {
      case "multiple_choice":
        return (
          <div className="mt-3">
            <div className="flex flex-wrap gap-3">
              {question.answers?.map((answer: any, index: number) => (
                <div
                  key={index}
                  className={`flex flex-col p-2 rounded-lg ${answer.isCorrect
                      ? "bg-green-50 border border-green-200"
                      : "bg-gray-50 border border-gray-200"
                    }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${answer.isCorrect ? "bg-green-100" : "bg-gray-100"
                        }`}
                    >
                      {answer.isCorrect ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                    {renderInlineMath(answer.text || "", "text-sm")}
                  </div>
                  {answer.image && (
                    <div className="w-24 h-24 relative rounded overflow-hidden mb-2">
                      <Image
                        src={answer.image || "/placeholder.svg"}
                        alt={answer.text}
                        fill
                        className="object-cover"
                        sizes="96px"
                        loading="lazy"
                        style={{ maxWidth: 400, maxHeight: 200 }}
                      />
                    </div>
                  )}
                  {answer.audio && (
                    <audio controls className="w-48">
                      <source src={answer.audio} />
                    </audio>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "fill_in_blanks":
        return (
          <div className="mt-3">
            {/* <p className="text-sm mb-2 flex flex-col gap-0.5">
              {(question.content || "")
                .replace(/<p>|<\/p>/g, "\n")
                .split(/\n+/)
                .filter((line) => line.trim() !== "")
                .map((line, lineIdx) => (
                  <span
                    key={lineIdx}
                    className="flex flex-wrap items-center gap-y-1"
                  >
                    {line.split(/(\[blank\d*\])/).map((part, index) => {
                      const blankMatch = part.match(/\[blank(\d*)\]/);
                      return blankMatch ? (
                        <span
                          key={index}
                          className="inline-block px-2 py-0.5 bg-purple-100 rounded mx-1 align-middle"
                        >
                          ___
                        </span>
                      ) : part.trim() !== "" ? (
                        <span key={index} className="inline align-middle">
                          <TiptapMathViewer
                            value={part}
                            className="inline"
                            isHtml
                          />
                        </span>
                      ) : null;
                    })}
                  </span>
                ))}
            </p> */}
            <div className="flex flex-wrap gap-2 mt-2">
              {question.answers?.map((answer: any, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-600">
                    Blank {answer.position || index + 1}:
                  </Badge>
                  {renderInlineMath(answer.text || "", "text-sm font-medium")}
                </div>
              ))}
            </div>
          </div>
        );

      case "ordering":
        return (
          <div className="mt-3">
            <div className="flex flex-col gap-1">
              {question.answers?.map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-amber-50 rounded-md border border-amber-200"
                >
                  <span className="w-6 h-6 flex items-center justify-center bg-amber-100 rounded-full text-amber-700 text-xs font-medium">
                    {index + 1}
                  </span>
                  {renderInlineMath(item.text || "", "text-sm")}
                  {item.image && (
                    <div className="w-8 h-8 relative ml-auto">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.text}
                        fill
                        className="object-cover rounded"
                        sizes="32px"
                        loading="lazy"
                        style={{ maxWidth: 400, maxHeight: 200 }}
                      />
                    </div>
                  )}
                  {item.audio && (
                    <audio controls className="w-40 ml-auto">
                      <source src={item.audio} />
                    </audio>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "matching":
        return (
          <div className="mt-3">
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700">
                {t("matchingHeader")}
              </div>
              {question.matchItems && question.matchItems.length > 0 ? (
                question.matchItems.map((item: any, index: number) => (
                  <div key={index} className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        {item.leftImage && (
                          <div className="w-12 h-12 relative flex-shrink-0">
                            <Image
                              src={item.leftImage || "/placeholder.svg"}
                              alt={item.leftText || "Left item"}
                              fill
                              className="object-cover rounded"
                              sizes="48px"
                              loading="lazy"
                              style={{ maxWidth: 400, maxHeight: 200 }}
                            />
                          </div>
                        )}
                        <span className="text-sm font-medium flex-1">
                          {renderInlineMath(
                            item.leftText || "",
                            "text-sm font-medium"
                          )}
                        </span>
                      </div>
                      {item.leftAudio && (
                        <div className="mt-2">
                          <audio controls className="w-full">
                            <source src={item.leftAudio} />
                          </audio>
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        {item.rightImage && (
                          <div className="w-12 h-12 relative flex-shrink-0">
                            <Image
                              src={item.rightImage || "/placeholder.svg"}
                              alt={item.rightText || "Right item"}
                              fill
                              className="object-cover rounded"
                              sizes="48px"
                              loading="lazy"
                              style={{ maxWidth: 400, maxHeight: 200 }}
                            />
                          </div>
                        )}
                        <span className="text-sm font-medium flex-1">
                          {renderInlineMath(
                            item.rightText || "",
                            "text-sm font-medium"
                          )}
                        </span>
                      </div>
                      {item.rightAudio && (
                        <div className="mt-2">
                          <audio controls className="w-full">
                            <source src={item.rightAudio} />
                          </audio>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 italic">
                  {t("noMatchingData")}
                </div>
              )}
            </div>
          </div>
        );

      case "drag_drop":
        return (
          <div className="mt-3">
            {/* <p className="text-sm mb-2 flex flex-col gap-0.5">
              {(question.questionText || "")
                .replace(/<p>|<\/p>/g, "\n")
                .split(/\n+/)
                .filter((line) => line.trim() !== "")
                .map((line, lineIdx) => (
                  <span
                    key={lineIdx}
                    className="flex flex-wrap items-center gap-y-1"
                  >
                    {line.split(/(\[blank\d*\])/).map((part, index) => {
                      const blankMatch = part.match(/\[blank(\d*)\]/);
                      return blankMatch ? (
                        <span
                          key={index}
                          className="inline-block px-2 py-0.5 bg-cyan-100 rounded mx-1 align-middle"
                        >
                          ___
                        </span>
                      ) : part.trim() !== "" ? (
                        <span key={index} className="inline align-middle">
                          <TiptapMathViewer
                            value={part}
                            className="inline"
                            isHtml
                          />
                        </span>
                      ) : null;
                    })}
                  </span>
                ))}
            </p> */}
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-700 mb-1">
                {t("optionsHeader")}
              </p>
              <div className="flex flex-wrap gap-2">
                {question.dragDropOptions?.map((option: any, index: number) => (
                  <div
                    key={index}
                    className={`px-3 py-1.5 rounded-md text-sm ${option.isCorrect
                        ? "bg-cyan-100 border border-cyan-200 text-cyan-800"
                        : "bg-gray-100 border border-gray-200 text-gray-700"
                      }`}
                  >
                    {renderInlineMath(option.text || "", "text-sm")}
                    {option.isCorrect && (
                      <span className="ml-2 text-xs text-cyan-600">
                        {option.correctPosition > 0
                          ? t("positionLabel", {
                            pos: String(option.correctPosition),
                          })
                          : ""}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "labeling":
        return (
          <div className="mt-3">
            {/* Hiển thị hình ảnh và các ô trống */}
            <div className="relative w-full max-w-xs h-40 bg-gray-100 rounded-md border border-gray-200 overflow-hidden">
              {question.labelImage ? (
                <div className="relative w-full h-full">
                  <Image
                    src={question.labelImage || "/placeholder.svg"}
                    alt="Labeling image"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 256px"
                    loading="lazy"
                    style={{ maxWidth: 400, maxHeight: 200 }}
                  />

                  {/* Hiển thị các ô trống dựa trên tọa độ chính xác */}
                  {question.labelPositions?.map(
                    (position: any, index: number) => (
                      <div
                        key={index}
                        className="absolute border-2 border-solid border-pink-500 rounded-md bg-pink-100 bg-opacity-40"
                        style={{
                          left: `${position.x}%`,
                          top: `${position.y}%`,
                          width: `${position.width}%`,
                          height: `${position.height}%`,
                          zIndex: 10,
                        }}
                      >
                        {/* Hiển thị số thứ tự của ô trống */}
                        <div className="absolute -top-6 left-0 text-xs font-medium bg-pink-100 px-1.5 py-0.5 rounded text-pink-800 border border-pink-300">
                          {index + 1}
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="h-12 w-12 text-gray-300" />
                </div>
              )}
            </div>

            {/* Hiển thị danh sách nhãn */}
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                {t("labelsHeader")}
              </p>
              <div className="flex flex-wrap gap-2">
                {/* Ưu tiên hiển thị nhãn từ labels nếu có */}
                {question.labels && question.labels.length > 0
                  ? question.labels.map((label: any, index: number) => {
                    // Tìm vị trí tương ứng với nhãn này (nếu có)
                    const position = question.labelPositions?.find(
                      (pos) => pos.labelId === label.id
                    );
                    const positionIndex = position
                      ? (question.labelPositions ?? []).findIndex(
                        (pos) => pos.labelId === label.id
                      )
                      : index;

                    return (
                      <div
                        key={index}
                        className="px-3 py-1.5 rounded-full bg-pink-100 text-pink-800 text-sm border border-pink-200 flex items-center gap-1"
                      >
                        {/* Hiển thị số thứ tự tương ứng với vị trí trên hình ảnh */}
                        {position && (
                          <span className="w-4 h-4 flex items-center justify-center bg-pink-200 rounded-full text-pink-800 text-xs font-medium">
                            {positionIndex + 1}
                          </span>
                        )}
                        {renderInlineMath(label.text || "", "text-sm")}
                      </div>
                    );
                  })
                  : // Fallback: hiển thị nhãn từ labelPositions nếu không có labels
                  question.labelPositions?.map(
                    (position: any, index: number) => (
                      <div
                        key={index}
                        className="px-3 py-1.5 rounded-full bg-pink-100 text-pink-800 text-sm border border-pink-200 flex items-center gap-1"
                      >
                        <span className="w-4 h-4 flex items-center justify-center bg-pink-200 rounded-full text-pink-800 text-xs font-medium">
                          {index + 1}
                        </span>
                        {renderInlineMath(position.answer || "", "text-sm")}
                      </div>
                    )
                  )}
              </div>
            </div>
          </div>
        );

      case "category":
        return (
          <div className="mt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {question.categories?.map((category: any, catIndex: number) => (
                <div
                  key={catIndex}
                  className="border rounded-md overflow-hidden"
                >
                  <div className="bg-orange-100 p-2 font-medium text-sm border-b">
                    {category.image && (
                      <div className="w-6 h-6 inline-block mr-2 relative">
                        <Image
                          src={category.image || "/placeholder.svg"}
                          alt={category.name}
                          fill
                          className="object-cover rounded"
                          sizes="24px"
                          loading="lazy"
                          style={{ maxWidth: 400, maxHeight: 200 }}
                        />
                      </div>
                    )}
                    {renderInlineMath(
                      category.name || "",
                      "text-sm font-medium"
                    )}
                    {category.audio && (
                      <div className="mt-2">
                        <audio controls className="w-full max-w-xs">
                          <source src={category.audio} />
                        </audio>
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-white">
                    {category.items?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {category.items.map((item: any, itemIndex: number) => (
                          <div
                            key={itemIndex}
                            className="px-2 py-1 bg-orange-50 text-xs rounded border border-orange-200 flex flex-col gap-1 w-[160px]"
                          >
                            <div>
                              {renderInlineMath(item.text || "", "text-xs")}
                            </div>
                            {item.image && (
                              <div className="w-full h-16 relative">
                                <Image
                                  src={item.image || "/placeholder.svg"}
                                  alt={item.text}
                                  fill
                                  className="object-cover rounded"
                                  sizes="64px"
                                  loading="lazy"
                                  style={{ maxWidth: 400, maxHeight: 200 }}
                                />
                              </div>
                            )}
                            {item.audio && (
                              <audio controls className="w-full">
                                <source src={item.audio} />
                              </audio>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">
                        {t("noItems")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "writing":
        return (
          <div className="mt-3">
            <div className="p-3 bg-indigo-50 rounded-md border border-indigo-200">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium text-indigo-700">
                  {t("writingHeader")}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {question.writingMaxCharacters
                  ? t("charLimit", {
                    count: String(question.writingMaxCharacters),
                  })
                  : t("noCharLimit")}
              </p>
              {question.writingAllowImageUpload && (
                <p className="text-sm text-gray-600">{t("allowImageUpload")}</p>
              )}
            </div>
          </div>
        );

      case "speaking":
        return (
          <div className="mt-3">
            <div className="p-3 bg-rose-50 rounded-md border border-rose-200">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-rose-500" />
                <span className="text-sm font-medium text-rose-700">
                  {t("speakingHeader")}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {t("speakingMaxDurationLabel")}{" "}
                {String(question.speakingMaxDuration || 60)} {t("secondsShort")}
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-sm italic text-gray-600">
              {t("seeDetailsInfo")}
            </p>
          </div>
        );
    }
  };

  // Cập nhật hàm renderQuestionMedia() để hiển thị media dạng audio và video tốt hơn
  const renderQuestionMedia = () => {
    const mediaElements: React.ReactNode[] = []
    // image
    if (
      question.image &&
      Array.isArray(question.image) &&
      question.image.length > 0
    ) {
      mediaElements.push(
        ...question.image.map((image, index) => (
          <div
            key={image.type + index}
            className="mt-3 w-full max-w-xs h-40 relative rounded overflow-hidden"
          >
            <Image
              src={
                image.url ||
                '/icons/placeholder.svg?height=160&width=320&query=question image'
              }
              alt="media content"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 256px"
              loading="lazy"
              style={{ maxWidth: 400, maxHeight: 200 }}
            />
          </div>
        ))
      )
    }

    // audio
    if (
      question.audio &&
      Array.isArray(question.audio) &&
      question.audio.length > 0
    ) {
      mediaElements.push(
        ...question.audio.map((audio, index) => (
          <div
            key={audio.type + index}
            className="mt-3 p-3 bg-purple-50 rounded-md border border-purple-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <Music className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-purple-700">
                {t('audioLabel')}
              </span>
            </div>
            <audio controls className="w-full max-w-xs">
              <source src={audio.url} type="audio/mpeg" />
              {t('audioNotSupported')}
            </audio>
          </div>
        ))
      )
    }

    // video
    if (
      question.video &&
      Array.isArray(question.video) &&
      question.video.length > 0
    ) {
      mediaElements.push(
        ...question.video.map((video, index) => (
          <div
            key={video.type + index}
            className="mt-3 p-3 bg-amber-50 rounded-md border border-amber-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <Video className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-700">
                {t('videoLabel')}
              </span>
            </div>
            <div className="relative w-full max-w-xs aspect-video rounded overflow-hidden">
              <video
                controls
                className="w-full h-full object-cover"
                poster="/video-thumbnail.png"
              >
                <source src={video.url} type="video/mp4" />
                {t('videoNotSupported')}
              </video>
            </div>
          </div>
        ))
      )
    }

    return mediaElements.length > 0 ? mediaElements : null
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Phần thông tin câu hỏi */}
          <div className="flex-1">
            <div className="flex items-start gap-3">
              {/* Icon loại câu hỏi */}
              <div
                className={`p-2 rounded-full ${questionType.color} flex-shrink-0 mt-1`}
              >
                <IconComponent className="h-4 w-4" />
              </div>

              <div className="flex-1">
                {/* Tiêu đề và loại câu hỏi */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge className={questionType.color}>
                    {localizedTypeName}
                  </Badge>
                  {question.attributes &&
                    question.attributes[0]?.value?.name && (
                      <Badge variant="outline">
                        {question.attributes[0].value.name}
                      </Badge>
                    )}
                  {question.attributes &&
                    question.attributes[1]?.value?.name && (
                      <Badge variant="outline">
                        {question.attributes[1].value.name}
                      </Badge>
                    )}
                  {question.attributes &&
                    question.attributes[2]?.value?.name && (
                      <Badge variant="outline">
                        {question.attributes[2].value.name}
                      </Badge>
                    )}

                  {/* Hiển thị badge cho media */}
                  {hasImage && (
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-600"
                    >
                      <ImageIcon className="h-3 w-3 mr-1" /> {t("mediaImage")}
                    </Badge>
                  )}
                  {hasAudio && (
                    <Badge
                      variant="outline"
                      className="bg-purple-50 text-purple-600"
                    >
                      <Music className="h-3 w-3 mr-1" /> {t("mediaAudio")}
                    </Badge>
                  )}
                  {hasVideo && (
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-600"
                    >
                      <Video className="h-3 w-3 mr-1" /> {t("mediaVideo")}
                    </Badge>
                  )}
                </div>

                {/* Nội dung câu hỏi */}
                <h3>
                  <TiptapMathViewer
                    value={question.question}
                    className="text-lg font-semibold text-gray-800"
                    isHtml
                  />
                </h3>

                {/* Hiển thị media của câu hỏi */}
                {renderQuestionMedia()}

                {/* Hiển thị đáp án */}
                {renderAnswers()}
              </div>
            </div>
          </div>

          {/* Phần thông tin bổ sung và thao tác */}
          <div className="md:w-48 flex flex-row md:flex-col justify-between md:justify-start items-end md:items-stretch flex-shrink-0 mt-3 md:mt-0 gap-2 md:gap-4 flex-wrap">
            <div className="space-y-2 w-full">
              <div className="text-sm">
                <span className="text-gray-500">{t("pointsLabel")}</span>
                <span className="font-medium">{question.points}</span>
              </div>

              <div className="text-sm">
                <span className="text-gray-500">{t("createdAtLabel")}</span>
                <span className="font-medium">{question.createdAt}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">{t("updatedAtLabel")}</span>
                <span className="font-medium">{question.updatedAt}</span>
              </div>

              <div className="text-sm flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-gray-500">{t("timeLimitLabel")}</span>
                <span className="font-medium">
                  {formatTime(question.timeLimit || 60)}
                </span>
              </div>
            </div>

            <div className="flex md:flex-col gap-1 md:mt-auto">
              <Button
                size="sm"
                className="text-white text-xs px-3 h-8 bg-cs-blue"
                asChild
              >
                <Link
                  href={`${localePrefix}/manage/question-bank/${question.id}`}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  {t("actions.detail")}
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs px-2 h-8"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link
                      href={`${localePrefix}/manage/question-bank/edit/${question.id}`}
                      rel="noopener noreferrer"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {t("actions.edit")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy className="h-4 w-4 mr-2" />
                    {t("actions.copy")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onSelect={() => setOpenDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("actions.delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("deleteConfirmTitle")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("deleteConfirmDesc", {
                        title: question.question || String(question.id),
                      })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        handleDeleteQuestion(Number(question.id));
                        setOpenDeleteDialog(false); 
                      }}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {t("actions.delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Định nghĩa các loại TypeScript cho câu hỏi, đáp án, danh mục, v.v.
type QuestionType =
  | "multiple_choice"
  | "fill_in_blanks"
  | "ordering"
  | "matching"
  | "drag_drop"
  | "labeling"
  | "category"
  | "writing"
  | "speaking"
  | string;

type QuestionAnswer = {
  id: string | number;
  text?: string;
  isCorrect?: boolean;
  image?: string | null;
  audio?: string | null;
  position?: number;
  correctPosition?: number | null;
};

type MatchItem = {
  leftId: string | number;
  leftText: string;
  leftImage?: string | null;
  leftAudio?: string | null;
  rightId: string | number;
  rightText: string;
  rightImage?: string | null;
  rightAudio?: string | null;
};

type DragDropOption = {
  id: string | number;
  text: string;
  correctPosition: number;
  isCorrect: boolean;
};

type Label = {
  id: string | number;
  text: string;
};

type LabelPosition = {
  id: string | number;
  labelId?: string | number;
  answer: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type CategoryItem = {
  id: string | number;
  text: string;
  image?: string | null;
  audio?: string | null;
};

type CategoryStruct = {
  id: string | number;
  name: string;
  image?: string | null;
  audio?: string | null;
  items: CategoryItem[];
};

type DisplayQuestion = {
  id: string | number;
  question: string;
  type: QuestionType;
  points: number;
  timeLimit: number;
  createdAt: string;
  updatedAt: string;
  attributes?: any[];
  image?: QuestionMedia[];
  audio?: QuestionMedia[];
  video?: QuestionMedia[];
  answers?: QuestionAnswer[];
  content?: string;
  matchItems?: MatchItem[];
  questionText?: string;
  dragDropOptions?: DragDropOption[];
  labelImage?: string | null;
  labels?: Label[];
  labelPositions?: LabelPosition[];
  categories?: CategoryStruct[];
  writingMaxCharacters?: number;
  writingAllowImageUpload?: boolean;
  speakingMaxDuration?: number;
};
