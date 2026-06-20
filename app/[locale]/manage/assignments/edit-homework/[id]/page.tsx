"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import { HomeworkForm } from "../../components/homework-form";
import { useToast } from "@/components/ui/use-toast";
import { GetHomeworkDetail, UpdateHomework } from "@/lib/api/homeworks";
import { CreateQuestionRelation } from "@/lib/api/exams";
import {
  uploadFile,
  getQuestions,
  type QuestionType,
} from "@/lib/api/questions";
import { getAssignmentsRoute } from "@/lib/utils/route-utils";
import { useDebounce } from "@/hooks/use-debounce";
import { useTypedTranslations } from "@/lib/i18n/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  ASSIGNMENTS_HOMEWORKS_REFRESH_KEY,
  markListForRefresh,
} from "@/lib/utils/list-refresh";

export default function EditHomeworkPage() {
  const router = useRouter();
  const params = useParams();
  const homeworkId = params.id as string;
  const { toast } = useToast();
  const { user } = useAuth();
  const t = useTypedTranslations("manageAssignments");
  const queryClient = useQueryClient();

  // State for loading
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // Thêm state lưu is_assigned
  const [isAssigned, setIsAssigned] = useState(false);

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

  // State for question bank
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

  // State to store homework questions
  const [homeworkQuestions, setHomeworkQuestions] = useState<QuestionType[]>(
    []
  );

  // Fetch homework details
  useEffect(() => {
    const fetchHomeworkDetails = async () => {
      setIsLoading(true);
      try {
        const homeworkData = await GetHomeworkDetail(homeworkId);

        // Set basic homework information
        setName(homeworkData.name);
        setDescription(homeworkData.description || "");
        setStatus(homeworkData.status);
        setCoverImageUrl(homeworkData.cover_image || "");
        // Lưu is_assigned vào state
        setIsAssigned(!!homeworkData.is_assigned);

        // Fetch associated questions
        const questionsData = await getQuestions({
          homework_id: Number(homeworkId),
        });
        const homeworkQuestions =
          questionsData?.questions || questionsData || [];
        setHomeworkQuestions(homeworkQuestions);

        if (Array.isArray(homeworkQuestions) && homeworkQuestions.length > 0) {
          console.log(
            "🔧 Initializing homework questions:",
            homeworkQuestions.map((q) => q.id)
          );

          // Extract question IDs and scores
          const questionIds = homeworkQuestions.map((q) => q.id.toString());
          setSelectedQuestions(questionIds);
          console.log("📝 Set selected questions:", questionIds);

          // Also initialize selectedQuestionsData
          setSelectedQuestionsData(homeworkQuestions);
          console.log(
            "📊 Set selected questions data:",
            homeworkQuestions.map((q) => q.id)
          );

          // Create question scores object
          const scores: Record<string, number> = {};
          homeworkQuestions.forEach((q) => {
            scores[q.id.toString()] = q.metadata?.points || 0;
          });
          setQuestionScores(scores);
          console.log("🎯 Set question scores:", scores);
        } else {
          console.log("🔧 No questions found for homework");
        }
      } catch (error) {
        console.error("Error fetching homework details:", error);
        toast({
          title: t("common.error"),
          description: t("form.loadHomeworkError"),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (homeworkId) {
      fetchHomeworkDetails();
    }
  }, [homeworkId, toast]);

  // Fetch questions when question bank is opened or filters change
  useEffect(() => {
    const fetchQuestions = async () => {
      console.log("🎯 useEffect triggered with dependencies:", {
        questionBankOpen,
        page: questionFilters.page,
        limit: questionFilters.limit,
        type: questionFilters.type,
        debouncedSearch,
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
          throw new Error(t("form.uploadNoUrlError"));
        }

        setCoverImageUrl(fileUrl);
        toast({
          title: t("uploadSuccessTitle"),
          description: t("uploadSuccessDescription"),
        });
      } catch (error: any) {
        console.error("Cover image upload error:", error);
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
    console.log(
      "🔄 Toggle question:",
      questionId,
      "Current selected:",
      selectedQuestions
    );

    // Find question from all available sources
    const question =
      homeworkQuestions.find((q) => q.id.toString() === questionId) ||
      questions.find((q) => q.id.toString() === questionId) ||
      selectedQuestionsData.find((q) => q.id.toString() === questionId);

    if (!question) {
      console.error("❌ Question not found in any source:", questionId);
      return;
    }

    const isCurrentlySelected = selectedQuestions.includes(questionId);
    console.log(
      "📊 Is currently selected:",
      isCurrentlySelected,
      "Question found in:",
      homeworkQuestions.find((q) => q.id.toString() === questionId)
        ? "homework"
        : questions.find((q) => q.id.toString() === questionId)
        ? "bank"
        : "cache"
    );

    if (isCurrentlySelected) {
      // Remove question
      console.log("➖ Removing question:", questionId);
      setSelectedQuestions((prev) => {
        const newSelected = prev.filter((id) => id !== questionId);
        console.log("➖ New selected after removal:", newSelected);
        return newSelected;
      });

      // Also remove from selectedQuestionsData to keep it in sync
      setSelectedQuestionsData((prev) => {
        const newData = prev.filter((q) => q.id.toString() !== questionId);
        console.log(
          "➖ New selected data after removal:",
          newData.map((q) => q.id)
        );
        return newData;
      });

      setQuestionScores((prev) => {
        const newScores = { ...prev };
        delete newScores[questionId];
        console.log("➖ New scores after removal:", Object.keys(newScores));
        return newScores;
      });
    } else {
      // Add question
      console.log("➕ Adding question:", questionId);
      setSelectedQuestions((prev) => {
        const newSelected = [...prev, questionId];
        console.log("➕ New selected after addition:", newSelected);
        return newSelected;
      });

      // Add to selectedQuestionsData if not already there
      setSelectedQuestionsData((prev) => {
        const exists = prev.find((q) => q.id.toString() === questionId);
        if (exists) {
          console.log("⚠️ Question already exists in data cache");
          return prev;
        }
        const newData = [...prev, question];
        console.log(
          "➕ New selected data after addition:",
          newData.map((q) => q.id)
        );
        return newData;
      });

      setQuestionScores((prev) => {
        const newScores = {
          ...prev,
          [questionId]: defaultPoints,
        };
        console.log("➕ New scores after addition:", Object.keys(newScores));
        return newScores;
      });
    }
  };

  // Handle score change
  const handleScoreChange = (questionId: string, score: number) => {
    setQuestionScores((prev) => ({
      ...prev,
      [questionId]: score,
    }));
  };

  // Get selected questions list - ensure data consistency by finding from all sources
  const getSelectedQuestionsList = () => {
    console.log("📋 Getting selected questions list");
    console.log("Selected IDs:", selectedQuestions);
    console.log(
      "Homework questions:",
      homeworkQuestions.map((q) => q.id)
    );
    console.log(
      "Bank questions:",
      questions.map((q) => q.id)
    );
    console.log(
      "Selected data cache:",
      selectedQuestionsData.map((q) => q.id)
    );

    // Build the list by finding each selected question from all available sources
    const questionsList = selectedQuestions
      .map((id) => {
        // Try to find from selectedQuestionsData first (cache)
        let question = selectedQuestionsData.find(
          (q) => q.id.toString() === id
        );

        // If not found in cache, find from homeworkQuestions
        if (!question) {
          question = homeworkQuestions.find((q) => q.id.toString() === id);
        }

        // If still not found, find from current questions (question bank)
        if (!question) {
          question = questions.find((q) => q.id.toString() === id);
        }

        if (!question) {
          console.warn("⚠️ Question not found in any source:", id);
        }

        return question;
      })
      .filter((q): q is QuestionType => q !== undefined);

    console.log(
      "📊 Returning questions:",
      questionsList.map((q) => q.id)
    );
    return questionsList;
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

  // Handle save homework
  const handleSave = async (extra?: {
    question_form: "question" | "write";
    question_files?: { type: string; url: string }[];
  }) => {
    if (!name.trim()) {
      toast({
        title: t("lessonForm.missingInfo"),
        description: t("lessonForm.enterHomeworkName"),
        variant: "destructive",
      });
      return;
    }
    // Nếu đã được giao thì không cho lưu, hiển thị thông báo giữa màn hình
    if (isAssigned) {
      toast({
        title: t("homeworkForm.alreadyAssignedTitle"),
        description: t("homeworkForm.alreadyAssignedDesc"),
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
        cover_image: coverImageUrl || undefined,
        question_form: extra?.question_form || "question",
        question_files:
          extra?.question_form === "write" ? extra?.question_files : undefined,
      };

      await UpdateHomework(homeworkId, homeworkData);
      console.log("Homework updated successfully");

      const questionScoresObj: Record<string, number> = {};
      selectedQuestions.forEach((id) => {
        questionScoresObj[id] = questionScores[id] || 0;
      });

      const relationData = {
        exam_id: null,
        homework_id: Number(homeworkId),
        exercise_id: null,
        lesson_plan_part_id: null,
        question_scores: questionScoresObj,
      };

      await CreateQuestionRelation(relationData);
      console.log("Question relation updated successfully");

      toast({
        title: t("lessonForm.success"),
        description: t("homeworkForm.updateSuccess"),
      });

      await queryClient.invalidateQueries({ queryKey: ["homeworks"] });
      markListForRefresh(ASSIGNMENTS_HOMEWORKS_REFRESH_KEY);
      router.replace(`${getAssignmentsRoute(user)}?tab=homework`);
    } catch (error: any) {
      console.error("Error updating homework:", error);
      toast({
        title: t("lessonForm.error"),
        description: error.message || t("homeworkForm.cannotUpdateHomework"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Sync selectedQuestionsData with selectedQuestions to prevent inconsistencies
  useEffect(() => {
    console.log("🔄 Syncing selectedQuestionsData with selectedQuestions");

    // Remove questions from selectedQuestionsData that are not in selectedQuestions
    setSelectedQuestionsData((prev) => {
      const synced = prev.filter((q) =>
        selectedQuestions.includes(q.id.toString())
      );

      if (synced.length !== prev.length) {
        console.log("🧹 Cleaned up selectedQuestionsData:", {
          before: prev.map((q) => q.id),
          after: synced.map((q) => q.id),
          removed: prev
            .filter((q) => !selectedQuestions.includes(q.id.toString()))
            .map((q) => q.id),
        });
      }

      return synced;
    });
  }, [selectedQuestions]);

  // Validation function to check state consistency
  const validateState = () => {
    const issues = [];

    // Check if all selectedQuestions have corresponding data
    const missingData = selectedQuestions.filter(
      (id) =>
        !selectedQuestionsData.find((q) => q.id.toString() === id) &&
        !homeworkQuestions.find((q) => q.id.toString() === id) &&
        !questions.find((q) => q.id.toString() === id)
    );

    if (missingData.length > 0) {
      issues.push(`Missing question data for IDs: ${missingData.join(", ")}`);
    }

    // Check if selectedQuestionsData has questions not in selectedQuestions
    const extraData = selectedQuestionsData.filter(
      (q) => !selectedQuestions.includes(q.id.toString())
    );

    if (extraData.length > 0) {
      issues.push(
        `Extra question data for IDs: ${extraData.map((q) => q.id).join(", ")}`
      );
    }

    if (issues.length > 0) {
      console.error("🚨 State validation issues:", issues);
    } else {
      console.log("✅ State validation passed");
    }

    return issues.length === 0;
  };

  // Call validation when state changes (for debugging)
  useEffect(() => {
    validateState();
  }, [selectedQuestions, selectedQuestionsData, homeworkQuestions, questions]);

  // Debug effect to monitor state consistency
  useEffect(() => {
    console.log("🔍 State consistency check:");
    console.log("Selected questions (IDs):", selectedQuestions);
    console.log(
      "Selected questions data (objects):",
      selectedQuestionsData.map((q) => q.id)
    );
    console.log("Question scores keys:", Object.keys(questionScores));

    // Check for inconsistencies
    const dataIds = selectedQuestionsData.map((q) => q.id.toString());
    const missingInData = selectedQuestions.filter(
      (id) => !dataIds.includes(id)
    );
    const extraInData = dataIds.filter((id) => !selectedQuestions.includes(id));

    if (missingInData.length > 0) {
      console.warn("⚠️ Missing questions in data:", missingInData);
    }
    if (extraInData.length > 0) {
      console.warn("⚠️ Extra questions in data:", extraInData);
    }
  }, [selectedQuestions, selectedQuestionsData, questionScores]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="h-8 w-8 animate-spin text-green-600">⟳</div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("form.loadingTitle")}
              </h3>
              <p className="text-gray-500">{t("form.loadingSubtitle")}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      mode="edit"
      backUrl={getAssignmentsRoute(user)}
      homeworkId={homeworkId}
    />
  );
}
