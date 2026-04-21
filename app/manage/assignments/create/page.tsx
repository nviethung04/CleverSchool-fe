"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import { ExamForm } from "../components/exam-form";
import { useToast } from "@/components/ui/use-toast";
import { CreateExam, CreateQuestionRelation } from "@/lib/api/exams";
import {
  uploadFile,
  getQuestions,
  type QuestionType,
} from "@/lib/api/questions";
import { getAssignmentsRoute } from "@/lib/utils/route-utils";
import { useDebounce } from "@/hooks/use-debounce";

export default function CreateExamPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<number>(1);
  const [timeLimit, setTimeLimit] = useState(60);
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [deadlineTime, setDeadlineTime] = useState<string>("00:00:00");
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

        console.log("📡 Fetching questions with params:", params);
        const questionsData = await getQuestions(params);

        if (questionsData && Array.isArray(questionsData.questions)) {
          setQuestions(questionsData.questions);
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
  }, [questionBankOpen, questionFilters, debouncedSearch]);

  // Reset filters when question bank is opened/closed (giống homework form)
  useEffect(() => {
    if (questionBankOpen) {
      setQuestionFilters((prev) => ({ ...prev, page: 1 }));
    }
  }, [questionBankOpen]);

  // Clear draft on navigation
  // useEffect(() => {
  //   if (typeof window === "undefined") return;
  //   const handleBeforeUnload = () => {
  //     if (!isNavigating) {
  //       saveDraftToLocalStorage();
  //     }
  //   };

  //   const handleUnload = () => {
  //     if (!isNavigating) {
  //       saveDraftToLocalStorage();
  //     }
  //   };

  //   window.addEventListener("beforeunload", handleBeforeUnload);
  //   window.addEventListener("unload", handleUnload);

  //   return () => {
  //     window.removeEventListener("beforeunload", handleBeforeUnload);
  //     window.removeEventListener("unload", handleUnload);
  //   };
  // }, [
  //   isNavigating,
  //   name,
  //   description,
  //   status,
  //   timeLimit,
  //   deadline,
  //   deadlineTime,
  //   coverImageUrl,
  //   selectedQuestions,
  //   selectedQuestionsData,
  //   questionScores,
  // ]);

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
        const uploadResponse = await uploadFile(file, "exam-covers");

        if (uploadResponse.error) {
          throw new Error(uploadResponse.error);
        }

        const fileUrl = uploadResponse?.url || uploadResponse?.data?.url;
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
    console.log("🔍 getSelectedQuestionsList called");
    console.log("📊 selectedQuestionsData:", selectedQuestionsData);
    console.log(
      "📏 selectedQuestionsData length:",
      selectedQuestionsData.length
    );
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

  // Auto-save functions
  // const saveDraftToLocalStorage = () => {
  //   if (typeof window === "undefined") return;
  //   const draft = {
  //     name,
  //     description,
  //     status,
  //     timeLimit,
  //     deadline: deadline ? deadline.toISOString() : null,
  //     deadlineTime,
  //     coverImageUrl,
  //     selectedQuestions,
  //     selectedQuestionsData,
  //     questionScores,
  //   };
  //   localStorage.setItem("exam-create-draft", JSON.stringify(draft));
  // };

  // const loadDraftFromLocalStorage = () => {
  //   if (typeof window === "undefined") return;
  //   const saved = localStorage.getItem("exam-create-draft");
  //   if (saved) {
  //     try {
  //       const draft = JSON.parse(saved);
  //       setName(draft.name || "");
  //       setDescription(draft.description || "");
  //       setStatus(draft.status || 1);
  //       setTimeLimit(draft.timeLimit || 60);
  //       setDeadline(draft.deadline ? new Date(draft.deadline) : undefined);
  //       setDeadlineTime(draft.deadlineTime || "00:00:00");
  //       setCoverImageUrl(draft.coverImageUrl || "");
  //       setSelectedQuestions(draft.selectedQuestions || []);
  //       setSelectedQuestionsData(draft.selectedQuestionsData || []);
  //       setQuestionScores(draft.questionScores || {});
  //     } catch (error) {
  //       console.error("Error loading draft:", error);
  //     }
  //   }
  // };

  // const clearDraft = () => {
  //   if (typeof window === "undefined") return;
  //   localStorage.removeItem("exam-create-draft");
  // };

  // Handle close question bank (đơn giản như homework form)
  const handleCloseQuestionBank = () => {
    console.log("🚪 Closing question bank");
    console.log("📊 Selected questions:", selectedQuestions);
    console.log("📝 Selected questions data:", selectedQuestionsData);
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

  // Handle save exam
  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tên bài kiểm tra",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const deadlineTimestamp = getDeadlineTimestamp();

      const examData = {
        name,
        description,
        status,
        time_limit: timeLimit,
        max_score: selectedQuestions.reduce(
          (total, id) => total + (questionScores[id] || 0),
          0
        ),
        lesson_id: 0, // Có thể được cập nhật sau hoặc để user chọn
        cover_image: coverImageUrl || undefined,
        deadline: deadlineTimestamp,
      };

      const createdExam = await CreateExam(examData);
      console.log("Exam created:", createdExam);

      if (selectedQuestions.length > 0) {
        const questionScoresObj: Record<string, number> = {};
        selectedQuestions.forEach((id) => {
          questionScoresObj[id] = questionScores[id] || 0;
        });

        const relationData = {
          exam_id: Number(createdExam.id),
          homework_id: null,
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
        description: "Bài kiểm tra đã được tạo thành công.",
      });

      setTimeout(() => {
        setIsNavigating(true);
        router.push(getAssignmentsRoute(user));
      }, 500);
    } catch (error: any) {
      console.error("Error creating exam:", error);
      toast({
        title: "Lỗi",
        description:
          error.message || "Không thể tạo bài kiểm tra. Vui lòng thử lại sau.",
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

  // Debug useEffect to monitor selectedQuestionsData changes
  useEffect(() => {
    console.log("🔄 selectedQuestionsData changed:", selectedQuestionsData);
    console.log(
      "📏 selectedQuestionsData length:",
      selectedQuestionsData.length
    );
  }, [selectedQuestionsData]);

  // Debug useEffect to monitor selectedQuestions changes
  useEffect(() => {
    console.log("🔄 selectedQuestions changed:", selectedQuestions);
    console.log("📏 selectedQuestions length:", selectedQuestions.length);
  }, [selectedQuestions]);

  return (
    <ExamForm
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
      examQuestions={[]}
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
      title="Tạo bài kiểm tra mới"
      subtitle="Tạo bài kiểm tra mới cho học sinh"
      backUrl={getAssignmentsRoute(user)}
      saveButtonText="Tạo bài kiểm tra"
      // Exam ID for edit functionality (not available during creation)
      examId={undefined}
      // Auto-save functionality
      handleCloseQuestionBank={handleCloseQuestionBank}
    />
  );
}
