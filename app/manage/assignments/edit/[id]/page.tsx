"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import { ExamForm } from "../../components/exam-form";
import { useToast } from "@/components/ui/use-toast";
import {
  GetExamDetail,
  UpdateExam,
  CreateQuestionRelation,
} from "@/lib/api/exams";
import {
  uploadFile,
  getQuestions,
  type QuestionType,
} from "@/lib/api/questions";
import { getAssignmentsRoute } from "@/lib/utils/route-utils";
import { useDebounce } from "@/hooks/use-debounce";

export default function EditExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
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
  const [questionScores, setQuestionScores] = useState<Record<string, number>>(
    {}
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [examQuestions, setExamQuestions] = useState<QuestionType[]>([]);
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

  // Fetch exam data
  useEffect(() => {
    const fetchExamData = async () => {
      setIsLoading(true);
      try {
        const examData = await GetExamDetail(examId);

        setName(examData.name || "");
        setDescription(examData.description || "");
        setStatus(examData.status !== undefined ? examData.status : 1);
        setTimeLimit(Number(examData.time_limit) || 60);
        setCoverImageUrl(examData.cover_image || "");
        // Lưu is_assigned vào state
        setIsAssigned(!!examData.is_assigned);

        if (examData.deadline) {
          const deadlineDate = new Date(Number(examData.deadline) * 1000);
          setDeadline(deadlineDate);

          const hours = deadlineDate.getHours().toString().padStart(2, "0");
          const minutes = deadlineDate.getMinutes().toString().padStart(2, "0");
          const seconds = deadlineDate.getSeconds().toString().padStart(2, "0");
          setDeadlineTime(`${hours}:${minutes}:${seconds}`);
        }

        const questionsData = await getQuestions({ exam_id: Number(examId) });
        const examQuestions = questionsData?.questions || questionsData || [];
        setExamQuestions(examQuestions);

        if (Array.isArray(examQuestions) && examQuestions.length > 0) {
          const questionIds = examQuestions.map((q) => q.id.toString());
          const scores: Record<string, number> = {};

          examQuestions.forEach((q) => {
            scores[q.id.toString()] = q.metadata?.points || 0;
          });

          setSelectedQuestions(questionIds);
          setQuestionScores(scores);
        }
      } catch (error: any) {
        console.error("Error fetching exam data:", error);
        toast({
          title: "Lỗi",
          description:
            error.message ||
            "Không thể tải thông tin bài kiểm tra. Vui lòng thử lại sau.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (examId) {
      fetchExamData();
    }
  }, [examId, toast]);

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

  // Handle question toggle
  const handleQuestionToggle = (questionId: string, defaultPoints = 0) => {
    console.log(
      "🔄 Toggle question:",
      questionId,
      "Current selected:",
      selectedQuestions
    );

    // Find question from either current questions or exam questions
    const question =
      questions.find((q) => q.id.toString() === questionId) ||
      examQuestions.find((q) => q.id.toString() === questionId);

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

      // Update examQuestions (selectedQuestionsData) based on selection
      if (newSelected.includes(questionId)) {
        // Add question to examQuestions if not already there
        setExamQuestions((prevData) => {
          if (!prevData.find((q) => q.id.toString() === questionId)) {
            console.log("📝 Adding question to examQuestions:", question.id);
            return [...prevData, question];
          }
          return prevData;
        });
      } else {
        // Remove question from examQuestions
        console.log("❌ Removing question from examQuestions:", questionId);
        setExamQuestions((prevData) => {
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
          examQuestions.find((q) => q.id.toString() === id)
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
    // Nếu đã được giao thì không cho lưu, hiển thị thông báo
    if (isAssigned) {
      toast({
        title: "Bài kiểm tra đã được giao",
        description:
          "Bài kiểm tra này đã được giao. Vì vậy không thể chỉnh sửa được.",
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
        cover_image: coverImageUrl || undefined,
        deadline: deadlineTimestamp,
      };

      const updatedExam = await UpdateExam(examId, examData);
      console.log("Exam updated:", updatedExam);

      if (selectedQuestions.length > 0) {
        const questionScoresObj: Record<string, number> = {};
        selectedQuestions.forEach((id) => {
          questionScoresObj[id] = questionScores[id] || 0;
        });

        const relationData = {
          exam_id: Number(examId),
          homework_id: null,
          lesson_plan_part_id: null,
          question_scores: questionScoresObj,
        };

        await CreateQuestionRelation(relationData);
        console.log("Question relation updated successfully");
      }

      toast({
        title: "Thành công",
        description: "Bài kiểm tra đã được cập nhật thành công.",
      });

      setTimeout(() => {
        router.push(getAssignmentsRoute(user));
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }, 500);
    } catch (error: any) {
      console.error("Error updating exam:", error);
      toast({
        title: "Lỗi",
        description:
          error.message ||
          "Không thể cập nhật bài kiểm tra. Vui lòng thử lại sau.",
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
      selectedQuestionsData={examQuestions}
      setSelectedQuestionsData={setExamQuestions}
      questionScores={questionScores}
      setQuestionScores={setQuestionScores}
      examQuestions={examQuestions}
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
      title="Chỉnh sửa bài kiểm tra"
      subtitle="Cập nhật thông tin và câu hỏi cho bài kiểm tra"
      backUrl={getAssignmentsRoute(user)}
      saveButtonText="Lưu thay đổi"
      // Exam ID for edit functionality
      examId={examId}
    />
  );
}
