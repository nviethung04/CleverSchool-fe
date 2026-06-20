"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import { HomeworkForm } from "../components/homework-form";
import { useToast } from "@/components/ui/use-toast";
import { CreateHomework } from "@/lib/api/homeworks";
import { CreateQuestionRelation } from "@/lib/api/exams";
import {
  uploadFile,
  getQuestions,
  type QuestionType,
  getQuestionById,
} from "@/lib/api/questions";
import { getAssignmentsRoute } from "@/lib/utils/route-utils";
import { useDebounce } from "@/hooks/use-debounce";
import { useTypedTranslations } from "@/lib/i18n/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  ASSIGNMENTS_HOMEWORKS_REFRESH_KEY,
  markListForRefresh,
} from "@/lib/utils/list-refresh";

export default function CreateHomeworkPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const t = useTypedTranslations("manageAssignments");
  const queryClient = useQueryClient();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<number>(1);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [selectedQuestionsData, setSelectedQuestionsData] = useState<
    QuestionType[]
  >([]);
  const [questionScores, setQuestionScores] = useState<Record<string, number>>(
    {}
  );
  const [isSaving, setIsSaving] = useState(false);

  // Question bank state
  const [questionBankOpen, setQuestionBankOpen] = useState(false);
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [questionFilters, setQuestionFilters] = useState({
    page: 1,
    limit: 20,
    search: "",
    type: undefined as string | undefined,
  });
  const [hasMoreQuestions, setHasMoreQuestions] = useState(true);

  // Debounce search term để tránh gọi API quá nhiều
  const debouncedSearch = useDebounce(questionFilters.search, 500);
  const [selectedQuestionId, setSelectedQuestionId] = useState<
    string | number | null
  >(null);
  const [questionDetailOpen, setQuestionDetailOpen] = useState(false);

  // Auto-save state
  const [isNavigating, setIsNavigating] = useState(false);

  // Debug: Log initial state
  console.log("🏁 Initial questionFilters:", questionFilters);

  // Fetch questions when question bank is opened or filters change
  useEffect(() => {
    console.log("🎯 useEffect triggered with dependencies:", {
      questionBankOpen,
      page: questionFilters.page,
      limit: questionFilters.limit,
      type: questionFilters.type,
      debouncedSearch,
    });

    const fetchQuestions = async () => {
      console.log("useEffect triggered:", {
        questionBankOpen,
        page: questionFilters.page,
        search: debouncedSearch,
        type: questionFilters.type,
      });

      console.log("🔍 Checking questionBankOpen:", questionBankOpen);
      if (!questionBankOpen) {
        console.log("❌ Question bank is closed, resetting questions");
        // Reset khi đóng popup
        setQuestions([]);
        return;
      }
      console.log("✅ Question bank is open, proceeding to fetch questions");

      setQuestionLoading(true);
      setQuestionError(null);

      try {
        const params = {
          page: questionFilters.page,
          per_page: questionFilters.limit,
          sort_created_at: "newest",
          keyword: debouncedSearch?.trim() || undefined,
          question_type:
            questionFilters.type && questionFilters.type !== "all"
              ? questionFilters.type
              : undefined,
        };

        if (params.question_type) {
          console.log("🔍 Filtering by question type:", params.question_type);
        }
        console.log("📡 Fetching questions with params:", params);

        const questionsData = await getQuestions(params);

        if (questionsData && Array.isArray(questionsData.questions)) {
          // Set data từ API response object
          setQuestions(questionsData.questions);
          // Cập nhật hasMore dựa trên pagination info
          setHasMoreQuestions(
            questionsData.current_page < questionsData.total_pages
          );
          console.log(
            "Questions fetched for page",
            questionsData.current_page,
            ":",
            questionsData.questions.length,
            "Total:",
            questionsData.total_count
          );
        } else {
          setQuestionError(
            "Failed to fetch questions: Invalid response format"
          );
        }
      } catch (err: any) {
        console.error("Error fetching questions:", err);
        setQuestionError(
          err.message || "An error occurred while fetching questions"
        );
      } finally {
        setQuestionLoading(false);
      }
    };

    fetchQuestions();
  }, [
    questionBankOpen,
    questionFilters.page,
    questionFilters.limit,
    questionFilters.type,
    debouncedSearch,
  ]);

  // Reset page khi mở ngân hàng câu hỏi lần đầu
  useEffect(() => {
    if (questionBankOpen) {
      console.log("🚪 Question bank opened, resetting filters");
      setQuestionFilters((prev) => ({ ...prev, page: 1 }));
    } else {
      console.log("🚪 Question bank closed, resetting all filters");
      setQuestionFilters((prev) => ({
        ...prev,
        page: 1,
        search: "",
        type: undefined,
      }));
    }
  }, [questionBankOpen]);

  // Handle cover image change
  const handleCoverImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);
      setCoverImageUrl(objectUrl);

      setUploadingCover(true);
      try {
        const uploadResponse = await uploadFile(file, "homework-covers");

        if (uploadResponse.error) {
          throw new Error(uploadResponse.error);
        }

        const fileUrl = uploadResponse?.url || uploadResponse?.data?.url;
        if (!fileUrl) {
          throw new Error("Không nhận được URL file từ server");
        }

        setCoverImageUrl(fileUrl);
        toast({
          title: t("uploadSuccessTitle"),
          description: t("uploadSuccessDescription"),
        });
      } catch (error: any) {
        console.error("Lỗi khi upload ảnh cover:", error);
        toast({
          title: t("uploadErrorTitle"),
          description: error.message || t("uploadErrorDescription"),
          variant: "destructive",
        });
      } finally {
        setUploadingCover(false);
      }
    }
  };

  // Handle remove cover image
  const handleRemoveCoverImage = () => {
    setCoverImageUrl("");
  };

  // Handle question toggle
  const handleQuestionToggle = (questionId: string, defaultPoints = 0) => {
    const question = questions.find((q) => q.id.toString() === questionId);

    setSelectedQuestions((prev) => {
      const newSelected = prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId];

      // Update selectedQuestionsData
      if (newSelected.includes(questionId)) {
        // Add question
        if (question) {
          setSelectedQuestionsData((prevData) => {
            if (!prevData.find((q) => q.id.toString() === questionId)) {
              return [...prevData, question];
            }
            return prevData;
          });
        }
      } else {
        // Remove question - luôn xóa khỏi selectedQuestionsData bất kể có question hay không
        setSelectedQuestionsData((prevData) => {
          return prevData.filter((q) => q.id.toString() !== questionId);
        });
      }

      if (!newSelected.includes(questionId)) {
        setQuestionScores((prev) => {
          const newScores = { ...prev };
          delete newScores[questionId];
          return newScores;
        });
      } else {
        setQuestionScores((prev) => ({
          ...prev,
          [questionId]: defaultPoints,
        }));
      }

      return newSelected;
    });
  };

  // Handle score change
  const handleScoreChange = (questionId: string, score: number) => {
    setQuestionScores((prev) => ({
      ...prev,
      [questionId]: score,
    }));
  };

  // Get selected questions list
  const getSelectedQuestionsList = () => {
    return selectedQuestionsData;
  };

  // Get current page questions
  const getCurrentPageQuestions = () => {
    // Vì API đã trả về data cho page cụ thể, ta chỉ cần trả về toàn bộ array questions
    return questions;
  };

  // Handle question page change
  const handleQuestionPageChange = (newPage: number) => {
    if (newPage > 0) {
      setQuestionFilters((prev) => ({ ...prev, page: newPage }));
    }
  };

  // Handle question filter change
  const handleQuestionFilterChange = (key: string, value: string) => {
    console.log("🔄 Filter changed:", { key, value });
    setQuestionFilters((prev) => {
      const newFilters = { ...prev, [key]: value, page: 1 };
      console.log("📝 New filters state:", newFilters);
      return newFilters;
    });
  };

  // Handle question search
  const handleQuestionSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuestionFilters((prev) => ({ ...prev, page: 1 }));
  };

  // Handle view question detail
  const handleViewQuestionDetail = (questionId: string | number) => {
    setSelectedQuestionId(questionId);
    setQuestionDetailOpen(true);
  };

  // Format question type
  const formatQuestionType = (type: string) => {
    if (!type) return "Unknown";

    const typeMap: Record<string, string> = {
      fill_in_blanks: "Fill In Blanks",
      matching: "Matching",
      labeling: "Labeling",
      multiple_choice: "Multiple Choice",
      ordering: "Ordering",
      drag_drop: "Drag & Drop",
      writing: "Writing",
      speaking: "Speaking",
      category: "Category",
    };

    return (
      typeMap[type] ||
      type
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    );
  };

  // Handle close question bank with auto-save
  const handleCloseQuestionBank = () => {
    // saveDraftToLocalStorage();
    setQuestionBankOpen(false);
  };

  // Handle save homework
  const handleSave = async (extra?: {
    question_form: "question" | "write";
    question_files?: { type: string; url: string }[];
  }) => {
    if (isSaving) return; // ✅ stop spam
    
    if (!name.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tên bài tập về nhà",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const homeworkData = {
        name,
        description,
        status,
        max_score: selectedQuestions.reduce(
          (total, id) => total + (questionScores[id] || 0),
          0
        ),
        lesson_id: 0, // Có thể được cập nhật sau hoặc để user chọn
        cover_image: coverImageUrl || undefined,
        question_form: extra?.question_form || "question",
        question_files:
          extra?.question_form === "write" ? extra?.question_files : undefined,
      };

      const createdHomework = await CreateHomework(homeworkData);
      console.log("Homework created:", createdHomework);

      if (selectedQuestions.length > 0) {
        const questionScoresObj: Record<string, number> = {};
        selectedQuestions.forEach((id) => {
          questionScoresObj[id] = questionScores[id] || 0;
        });

        const relationData = {
          exam_id: null,
          homework_id: Number(createdHomework.id),
          exercise_id: null,
          lesson_plan_part_id: null,
          question_scores: questionScoresObj,
        };

        await CreateQuestionRelation(relationData);
        console.log("Question relation created successfully");
      }

      // Clear draft after successful save
      // clearDraft();

      toast({
        title: "Thành công",
        description: "Bài tập về nhà đã được tạo thành công.",
      });

      await queryClient.invalidateQueries({ queryKey: ["homeworks"] });
      markListForRefresh(ASSIGNMENTS_HOMEWORKS_REFRESH_KEY);
      setIsNavigating(true);
      router.replace(`${getAssignmentsRoute(user)}?tab=homework`);
    } catch (error: any) {
      console.error("Error creating homework:", error);
      toast({
        title: "Lỗi",
        description:
          error.message ||
          "Không thể tạo bài tập về nhà. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <HomeworkForm
      name={name}
      setName={setName}
      description={description}
      setDescription={setDescription}
      status={status}
      setStatus={setStatus}
      coverImageUrl={coverImageUrl}
      uploadingCover={uploadingCover}
      handleCoverImageChange={handleCoverImageChange}
      handleRemoveCoverImage={handleRemoveCoverImage}
      selectedQuestions={selectedQuestions}
      selectedQuestionsData={selectedQuestionsData}
      setSelectedQuestions={setSelectedQuestions}
      setSelectedQuestionsData={setSelectedQuestionsData}
      questionScores={questionScores}
      setQuestionScores={setQuestionScores}
      handleQuestionToggle={handleQuestionToggle}
      handleScoreChange={handleScoreChange}
      getSelectedQuestionsList={getSelectedQuestionsList}
      questionBankOpen={questionBankOpen}
      setQuestionBankOpen={setQuestionBankOpen}
      questions={questions}
      questionLoading={questionLoading}
      questionError={questionError}
      questionFilters={questionFilters}
      hasMoreQuestions={hasMoreQuestions}
      handleQuestionPageChange={handleQuestionPageChange}
      handleQuestionFilterChange={handleQuestionFilterChange}
      handleQuestionSearch={handleQuestionSearch}
      getCurrentPageQuestions={getCurrentPageQuestions}
      selectedQuestionId={selectedQuestionId}
      questionDetailOpen={questionDetailOpen}
      handleViewQuestionDetail={handleViewQuestionDetail}
      setQuestionDetailOpen={setQuestionDetailOpen}
      handleSave={handleSave}
      isSaving={isSaving}
      formatQuestionType={formatQuestionType}
      mode="create"
      backUrl={getAssignmentsRoute(user)}
      handleCloseQuestionBank={handleCloseQuestionBank}
    />
  );
}
