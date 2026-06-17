"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/context/auth-context";
import { ExerciseForm } from "../components/exercise-form";
import { useToast } from "@/components/ui/use-toast";
import { createExercise } from "@/lib/api/exercises";
import { CreateQuestionRelation } from "@/lib/api/exams";
import {
  uploadFile,
  getQuestions,
  type QuestionType,
} from "@/lib/api/questions";
import { getAssignmentsRoute } from "@/lib/utils/route-utils";
import { ASSIGNMENTS_EXERCISES_REFRESH_KEY, markListForRefresh } from "@/lib/utils/list-refresh";
import { getUploadedFileUrl, isBlobUrl } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { useTypedTranslations } from "@/lib/i18n/client";

export default function CreateExercisePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
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

  // Fetch questions when question bank is opened or filters change
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!questionBankOpen) return;

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
        const questionsData = await getQuestions(params);

        if (questionsData && Array.isArray(questionsData.questions)) {
          setQuestions(questionsData.questions);
          setHasMoreQuestions(
            questionsData.current_page < questionsData.total_pages
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
  }, [questionBankOpen, questionFilters, debouncedSearch]);

  // Reset filters when question bank is opened/closed (giống homework form)
  useEffect(() => {
    if (questionBankOpen) {
      setQuestionFilters((prev) => ({ ...prev, page: 1 }));
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
          throw new Error("Không nhận được URL file từ server");
        }

        setCoverImageUrl(fileUrl);
        toast({
          title: "Tải lên thành công",
          description: "Ảnh cover đã được tải lên thành công.",
        });
      } catch (error: any) {
        console.error("Lỗi khi upload ảnh cover:", error);
        toast({
          title: "Lỗi tải lên",
          description:
            error.message ||
            "Không thể tải lên ảnh cover. Vui lòng thử lại sau.",
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
      throw new Error("Ảnh bìa chưa tải lên xong. Vui lòng chọn lại ảnh.");
    }
    const uploadResponse = await uploadFile(coverImageFile, "exercise-covers");
    if (uploadResponse.error) {
      throw new Error(uploadResponse.error);
    }
    const fileUrl = getUploadedFileUrl(uploadResponse);
    if (!fileUrl) {
      throw new Error("Không nhận được URL file từ server");
    }
    setCoverImageUrl(fileUrl);
    return fileUrl;
  };

  // Handle question toggle (giống homework form)
  const handleQuestionToggle = (questionId: string, defaultPoints = 0) => {
    console.log("🔄 handleQuestionToggle called with:", questionId);
    const question = questions.find((q) => q.id.toString() === questionId);
    console.log("🔍 Found question:", question ? question.id : "NOT FOUND");

    const isCurrentlySelected = selectedQuestions.includes(questionId);
    console.log("📊 Currently selected:", isCurrentlySelected);

    if (isCurrentlySelected) {
      // Unselecting the question
      setSelectedQuestions((prev) => prev.filter((id) => id !== questionId));
      setSelectedQuestionsData((prev) =>
        prev.filter((q) => q.id.toString() !== questionId)
      );
      setQuestionScores((prev) => {
        const newScores = { ...prev };
        delete newScores[questionId];
        return newScores;
      });
    } else {
      // Selecting the question
      if (question) {
        setSelectedQuestions((prev) => [...prev, questionId]);
        setSelectedQuestionsData((prev) => {
          const exists = prev.find((q) => q.id.toString() === questionId);
          if (!exists) {
            return [...prev, question];
          }
          return prev;
        });
        setQuestionScores((prev) => ({
          ...prev,
          [questionId]: defaultPoints,
        }));
      } else {
        console.error("❌ Question not found for ID:", questionId);
      }
    }
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

  // Handle close question bank (đơn giản như homework form)
  const handleCloseQuestionBank = () => {
    setQuestionBankOpen(false);
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

    if (uploadingCover) {
      toast({
        title: t("lessonForm.missingInfo"),
        description: "Ảnh bìa đang được tải lên. Vui lòng đợi.",
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
        max_score: selectedQuestions.reduce(
          (total, id) => total + (questionScores[id] || 0),
          0
        ),
        lesson_id: 0, // Có thể được cập nhật sau hoặc để user chọn
        cover_image: resolvedCoverImage,
        deadline: deadlineTimestamp,
      };

      const createdExercise = await createExercise(exerciseData);
      console.log("Exercise created:", createdExercise);

      if (selectedQuestions.length > 0) {
        const questionScoresObj: Record<string, number> = {};
        selectedQuestions.forEach((id) => {
          questionScoresObj[id] = questionScores[id] || 0;
        });

        const relationData = {
          exercise_id: Number(createdExercise.id),
          homework_id: null,
          exam_id: null,
          lesson_plan_part_id: null,
          question_scores: questionScoresObj,
        };

        await CreateQuestionRelation(relationData);
        console.log("Question relation created successfully");
      }

      // Clear draft after successful save
      // clearDraft();

      toast({
        title: t("lessonForm.success"),
        description: t("lessonForm.exerciseCreatedSuccess"),
      });

      markListForRefresh(ASSIGNMENTS_EXERCISES_REFRESH_KEY);
      await queryClient.invalidateQueries({ queryKey: ["exercises"] });
      setIsNavigating(true);
      router.push(`${getAssignmentsRoute(user)}?tab=exercise`);
    } catch (error: any) {
      console.error("Error creating exercise:", error);
      toast({
        title: t("lessonForm.error"),
        description: error.message || t("lessonForm.cannotCreateExercise"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    // clearDraft();
    setIsNavigating(true);
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
      selectedQuestionsData={selectedQuestionsData}
      setSelectedQuestionsData={setSelectedQuestionsData}
      questionScores={questionScores}
      setQuestionScores={setQuestionScores}
      exerciseQuestions={[]}
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
      isLoading={false}
      // UI props
      title={t("createExerciseTitle")}
      subtitle={t("createExerciseSubtitle")}
      backUrl={getAssignmentsRoute(user)}
      saveButtonText={t("exerciseForm.saveCreate")}
      // Exercise ID for edit functionality (not available during creation)
      exerciseId={undefined}
      // Auto-save functionality
      handleCloseQuestionBank={handleCloseQuestionBank}
    />
  );
}
