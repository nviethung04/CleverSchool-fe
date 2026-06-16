"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import { ExerciseForm } from "../../components/exercise-form";
import { useToast } from "@/components/ui/use-toast";
import {
  getExerciseDetail,
  UpdateExercise,
} from "@/lib/api/exercises";
import { CreateQuestionRelation } from "@/lib/api/exams";
import {
  uploadFile,
  getQuestions,
  type QuestionType,
} from "@/lib/api/questions";
import { getAssignmentsRoute } from "@/lib/utils/route-utils";
import { getUploadedFileUrl, isBlobUrl } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { useTypedTranslations } from "@/lib/i18n/client";

export default function EditExercisePage() {
  const router = useRouter();
  const params = useParams();
  const exerciseId = params.id as string;
  const { toast } = useToast();
  const { user } = useAuth();
  const t = useTypedTranslations("manageAssignments");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<number>(1);
  const [timeLimit, setTimeLimit] = useState(60);
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [deadlineTime, setDeadlineTime] = useState<string>("00:00:00");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [questionScores, setQuestionScores] = useState<Record<string, number>>(
    {}
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [exerciseQuestions, setExerciseQuestions] = useState<QuestionType[]>([]);
  // Thêm state lưu is_assigned
  const [isAssigned, setIsAssigned] = useState(false);

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

  // Fetch exercise data
  useEffect(() => {
    const fetchExerciseData = async () => {
      setIsLoading(true);
      try {
        const exerciseData = await getExerciseDetail(exerciseId);

        setName(exerciseData.name || "");
        setDescription(exerciseData.description || "");
        setStatus(exerciseData.status !== undefined ? exerciseData.status : 1);
        setTimeLimit(Number(exerciseData.time_limit) || 60);
        setCoverImageUrl(exerciseData.cover_image || "");
        // Lưu is_assigned vào state
        setIsAssigned(!!exerciseData.is_assigned);

        if (exerciseData.deadline) {
          const deadlineDate = new Date(Number(exerciseData.deadline) * 1000);
          setDeadline(deadlineDate);

          const hours = deadlineDate.getHours().toString().padStart(2, "0");
          const minutes = deadlineDate.getMinutes().toString().padStart(2, "0");
          const seconds = deadlineDate.getSeconds().toString().padStart(2, "0");
          setDeadlineTime(`${hours}:${minutes}:${seconds}`);
        }

        const questionsData = await getQuestions({ exercise_id: Number(exerciseId) });
        const exerciseQuestions = questionsData?.questions || questionsData || [];
        setExerciseQuestions(exerciseQuestions);

        if (Array.isArray(exerciseQuestions) && exerciseQuestions.length > 0) {
          const questionIds = exerciseQuestions.map((q) => q.id.toString());
          const scores: Record<string, number> = {};

          exerciseQuestions.forEach((q) => {
            scores[q.id.toString()] = q.metadata?.points || 0;
          });

          setSelectedQuestions(questionIds);
          setQuestionScores(scores);
        }
      } catch (error: any) {
        console.error("Error fetching exercise data:", error);
        toast({
          title: t("common.error"),
          description: error.message || t("exerciseForm.loadExerciseError"),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (exerciseId) {
      fetchExerciseData();
    }
  }, [exerciseId, toast]);

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
      setCoverImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setCoverImageUrl(objectUrl);

      setUploadingCover(true);
      try {
        const uploadResponse = await uploadFile(file, "exercise-covers");

        if (uploadResponse.error) {
          throw new Error(uploadResponse.error);
        }

        const fileUrl = getUploadedFileUrl(uploadResponse);
        if (!fileUrl) {
          throw new Error(t("exerciseForm.uploadNoUrlError"));
        }

        setCoverImageUrl(fileUrl);
        toast({
          title: t("exerciseForm.uploadSuccessTitle"),
          description: t("exerciseForm.uploadSuccessDesc"),
        });
      } catch (error: any) {
        console.error("Cover image upload error:", error);
        toast({
          title: t("exerciseForm.uploadErrorTitle"),
          description: error.message || t("exerciseForm.uploadErrorDesc"),
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
    setCoverImageFile(null);
  };

  const resolveCoverImageUrl = async (): Promise<string | undefined> => {
    if (!coverImageUrl) return undefined;
    if (!isBlobUrl(coverImageUrl)) return coverImageUrl;
    if (!coverImageFile) {
      throw new Error(t("exerciseForm.uploadNoUrlError"));
    }
    const uploadResponse = await uploadFile(coverImageFile, "exercise-covers");
    if (uploadResponse.error) {
      throw new Error(uploadResponse.error);
    }
    const fileUrl = getUploadedFileUrl(uploadResponse);
    if (!fileUrl) {
      throw new Error(t("exerciseForm.uploadNoUrlError"));
    }
    setCoverImageUrl(fileUrl);
    return fileUrl;
  };

  // Handle question toggle
  const handleQuestionToggle = (questionId: string, defaultPoints = 0) => {
    console.log(
      "🔄 Toggle question:",
      questionId,
      "Current selected:",
      selectedQuestions
    );

    // Find question from either current questions or exercise questions
    const question =
      questions.find((q) => q.id.toString() === questionId) ||
      exerciseQuestions.find((q) => q.id.toString() === questionId);

    if (!question) {
      console.error("❌ Question not found:", questionId);
      return;
    }

    const isCurrentlySelected = selectedQuestions.includes(questionId);
    console.log("📊 Is currently selected:", isCurrentlySelected);

    setSelectedQuestions((prev) => {
      const newSelected = isCurrentlySelected
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId];

      console.log("📊 New selected questions:", newSelected);

      // Update exerciseQuestions (selectedQuestionsData) based on selection
      if (newSelected.includes(questionId)) {
        // Add question to exerciseQuestions if not already there
        setExerciseQuestions((prevData) => {
          if (!prevData.find((q) => q.id.toString() === questionId)) {
            console.log("📝 Adding question to exerciseQuestions:", question.id);
            return [...prevData, question];
          }
          return prevData;
        });
      } else {
        // Remove question from exerciseQuestions
        console.log("❌ Removing question from exerciseQuestions:", questionId);
        setExerciseQuestions((prevData) => {
          return prevData.filter((q) => q.id.toString() !== questionId);
        });
      }

      return newSelected;
    });

    // Update question scores
    if (isCurrentlySelected) {
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
  };

  // Handle score change
  const handleScoreChange = (questionId: string, score: number) => {
    setQuestionScores((prev) => ({
      ...prev,
      [questionId]: score,
    }));
  };

  // Get selected questions list - ensure data consistency
  const getSelectedQuestionsList = () => {
    console.log("📋 Getting selected questions list");
    console.log("Selected IDs:", selectedQuestions);

    const questionsList = selectedQuestions
      .map(
        (id) =>
          questions.find((q) => q.id.toString() === id) ||
          exerciseQuestions.find((q) => q.id.toString() === id)
      )
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

  // Get deadline timestamp
  const getDeadlineTimestamp = (): number | null => {
    if (!deadline) return null;

    const [hours, minutes, seconds] = deadlineTime.split(":").map(Number);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(hours, minutes, seconds);
    return Math.floor(deadlineDate.getTime() / 1000);
  };

  // Handle save exercise
  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: t("lessonForm.missingInfo"),
        description: t("lessonForm.enterExerciseName"),
        variant: "destructive",
      });
      return;
    }
    // Nếu đã được giao thì không cho lưu, hiển thị thông báo
    if (isAssigned) {
      toast({
        title: t("exerciseForm.alreadyAssignedTitle"),
        description: t("exerciseForm.alreadyAssignedDesc"),
        variant: "destructive",
      });
      return;
    }

    if (uploadingCover) {
      toast({
        title: t("lessonForm.missingInfo"),
        description: t("exerciseForm.uploadErrorDesc"),
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const deadlineTimestamp = getDeadlineTimestamp();
      const resolvedCoverImage = await resolveCoverImageUrl();

      const exerciseData = {
        name,
        description,
        status,
        time_limit: timeLimit,
        cover_image: resolvedCoverImage,
        deadline: deadlineTimestamp,
      };

      const updatedExercise = await UpdateExercise(exerciseId, exerciseData);
      console.log("Exercise updated:", updatedExercise);

      if (selectedQuestions.length > 0) {
        const questionScoresObj: Record<string, number> = {};
        selectedQuestions.forEach((id) => {
          questionScoresObj[id] = questionScores[id] || 0;
        });

        const relationData = {
          exercise_id: Number(exerciseId),
          homework_id: null,
          exam_id: null,
          lesson_plan_part_id: null,
          question_scores: questionScoresObj,
        };

        await CreateQuestionRelation(relationData);
        console.log("Question relation updated successfully");
      }

      toast({
        title: t("lessonForm.success"),
        description: t("exerciseForm.updateSuccess"),
      });

      setTimeout(() => {
        router.push(getAssignmentsRoute(user));
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }, 500);
    } catch (error: any) {
      console.error("Error updating exercise:", error);
      toast({
        title: t("lessonForm.error"),
        description: error.message || t("exerciseForm.cannotUpdateExercise"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.push(getAssignmentsRoute(user));
  };

  return (
    <ExerciseForm
      // Form data
      name={name}
      setName={setName}
      description={description}
      setDescription={setDescription}
      status={status}
      setStatus={setStatus}
      timeLimit={timeLimit}
      setTimeLimit={setTimeLimit}
      deadline={deadline}
      setDeadline={setDeadline}
      deadlineTime={deadlineTime}
      setDeadlineTime={setDeadlineTime}
      // Cover image
      coverImageUrl={coverImageUrl}
      uploadingCover={uploadingCover}
      handleCoverImageChange={handleCoverImageChange}
      handleRemoveCoverImage={handleRemoveCoverImage}
      // Questions
      selectedQuestions={selectedQuestions}
      setSelectedQuestions={setSelectedQuestions}
      selectedQuestionsData={exerciseQuestions}
      setSelectedQuestionsData={setExerciseQuestions}
      questionScores={questionScores}
      setQuestionScores={setQuestionScores}
      exerciseQuestions={exerciseQuestions}
      handleQuestionToggle={handleQuestionToggle}
      handleScoreChange={handleScoreChange}
      getSelectedQuestionsList={getSelectedQuestionsList}
      // Question bank
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
      // Question detail
      selectedQuestionId={selectedQuestionId}
      questionDetailOpen={questionDetailOpen}
      setQuestionDetailOpen={setQuestionDetailOpen}
      handleViewQuestionDetail={handleViewQuestionDetail}
      // Actions
      handleSave={handleSave}
      handleCancel={handleCancel}
      isSaving={isSaving}
      isLoading={isLoading}
      // UI props
      title={t("editExerciseTitle")}
      subtitle={t("editExerciseSubtitle")}
      backUrl={getAssignmentsRoute(user)}
      saveButtonText={t("exerciseForm.saveUpdate")}
      // Exercise ID for edit functionality
      exerciseId={exerciseId}
    />
  );
}
