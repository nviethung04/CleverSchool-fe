"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useParams,
  useRouter,
  usePathname,
  useSearchParams,
} from "next/navigation";
import { getQuestions, uploadFile } from "@/lib/api/questions";
import {
  getExerciseDetail,
  saveScoreExerciseBulk,
  type SaveScoreBulkRequest,
  type Exercise,
} from "@/lib/api/exercises";
import ExamSubmissionPage from "../../components/exam-submission-page";
import { useAuth } from "@/lib/context/auth-context";
import {
  resultExerciseRoute,
  resultExerciseStudentRoute,
} from "@/lib/utils/route-utils";

// Import shared question components
import { MatchingQuestion } from "../../components/questions/matching-question";
import { LabelingQuestion } from "../../components/questions/labeling-question";
import { FillInBlankQuestion } from "../../components/questions/fill-in-blank-question";
import { DragDropQuestion } from "../../components/questions/drag-drop-question";
import { CategoryQuestion } from "../../components/questions/category-question";
import { MultipleChoiceQuestion } from "../../components/questions/multiple-choice-question";
import { SpeakingQuestion } from "../../components/questions/speaking-question";
import { WritingQuestion } from "../../components/questions/writing-question";
import { OrderingQuestion } from "../../components/questions/ordering-question";

function isStudentDoExerciseRoute(pathname: string): boolean {
  return (
    /\/assignments\/do-exercise\//.test(pathname) &&
    !/\/manage\//.test(pathname) &&
    !/\/teacher\//.test(pathname) &&
    !/\/admin\//.test(pathname)
  );
}

export default function ExercisePage() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const exerciseId = params.id as string;
  const [lessonId, setLessonId] = useState<string | null>(
    searchParams.get("lessonId")
  );
  const [exerciseName, setExerciseName] = useState<string>(
    searchParams.get("name") || ""
  );

  // State management
  const [questions, setQuestions] = useState<any[]>([]);
  const [exerciseDetail, setExerciseDetail] = useState<Exercise | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // Lưu đáp án theo question.id -> answer.id[] cho multiple choice (hỗ trợ cả single và multiple)
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, (string | number)[]>
  >({});
  // Lưu đáp án cho fill in blank
  const [fillInBlankAnswers, setFillInBlankAnswers] = useState<
    Record<string, Record<string, string>> // questionId -> blankId -> text
  >({});
  // Lưu đáp án cho drag & drop
  const [dragDropAnswers, setDragDropAnswers] = useState<
    Record<string, { placements: Record<string, string>; isAnswered: boolean }>
  >({});
  // Lưu đáp án cho category
  const [categoryAnswers, setCategoryAnswers] = useState<
    Record<
      string,
      { connections: Record<string, string[]>; isAnswered: boolean }
    >
  >({});
  // Lưu đáp án cho ordering
  const [orderingAnswers, setOrderingAnswers] = useState<
    Record<string, { order: string[]; isAnswered: boolean }>
  >({});
  // Lưu đáp án cho matching
  const [matchingAnswers, setMatchingAnswers] = useState<
    Record<string, { matches: Record<string, string>; isAnswered: boolean }>
  >({});
  // Lưu đáp án cho labeling
  const [labelingAnswers, setLabelingAnswers] = useState<
    Record<string, { placements: Record<string, string>; isAnswered: boolean }>
  >({});
  // Lưu đáp án cho speaking
  const [speakingAnswers, setSpeakingAnswers] = useState<
    Record<
      string,
      { mediaBlob?: Blob; text?: string; fileUrl?: string; isAnswered: boolean }
    >
  >({});
  // Lưu đáp án cho writing
  const [writingAnswers, setWritingAnswers] = useState<
    Record<string, { text: string; isAnswered: boolean }>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [originalTimeLimit, setOriginalTimeLimit] = useState<number | null>(
    null
  ); // Store original time limit

  // State để kiểm soát popup xác nhận nộp bài
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Prevent scrolling on body
  useEffect(() => {
    // Disable scrolling on mount
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // Re-enable scrolling on unmount
    return () => {
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;

    const forStudent =
      isStudentDoExerciseRoute(pathname) || user?.type === "student";

    const loadExerciseAndQuestions = async () => {
      try {
        setIsLoading(true);
        const exerciseData = await getExerciseDetail(exerciseId, {
          forStudent,
        });
        setExerciseDetail(exerciseData);
        setExerciseName(exerciseData?.name || searchParams.get("name") || "");

        const timeLimitInMinutes =
          typeof exerciseData.time_limit === "string"
            ? Number.parseInt(exerciseData.time_limit, 10)
            : exerciseData.time_limit;

        const timeLimitInSeconds = timeLimitInMinutes * 60;
        setOriginalTimeLimit(timeLimitInSeconds);
        setTimeLeft(timeLimitInSeconds);

        const questionsData = await getQuestions({ exercise_id: Number(exerciseId) });
        if (questionsData && Array.isArray(questionsData.questions)) {
          setQuestions(questionsData.questions);
        } else {
          console.error("Invalid questions data format:", questionsData);
          setQuestions([]);
        }
      } catch (error) {
        console.error("Failed to load exercise data:", error);
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadExerciseAndQuestions();
  }, [exerciseId, authLoading, pathname, user?.type]);

  // Submit exercise logic (bulk)
  const handleSubmitExercise = useCallback(async () => {
    // Calculate elapsed time in seconds
    const elapsedTimeInSeconds =
      originalTimeLimit && timeLeft !== null ? originalTimeLimit - timeLeft : 0;

    // Build list_answers for all questions
    const list_answers: SaveScoreBulkRequest["list_answers"] = [];

    for (const q of questions) {
      if (q.type === "multiple_choice") {
        const selectedAnswerIds = selectedAnswers[q.id] || [];
        list_answers.push({
          type_question: "multiple_choice",
          question_id: Number(q.id),
          data: {
            answer_ids: selectedAnswerIds.map((id) => Number(id)),
          },
        });
      } else if (q.type === "fill_in_blanks") {
        const questionAnswers = fillInBlankAnswers[q.id] || {};
        const answerOptions = q.options.answers || [];

        // Sắp xếp theo correct_position
        const sortedAnswers = [...answerOptions].sort(
          (a, b) => (a.correct_position || 0) - (b.correct_position || 0)
        );

        // Tạo object answers theo format API mong đợi: { position: "user_input" }
        const answersObject: Record<number, string> = {};

        // Đảm bảo gửi đủ số ô trống, kể cả khi user chưa nhập
        sortedAnswers.forEach((answerOption) => {
          const blankId = `${q.id}_blank_${answerOption.correct_position}`;
          const userText = questionAnswers[blankId] || ""; // Lấy text từ user input
          answersObject[answerOption.correct_position] = userText;
        });

        list_answers.push({
          type_question: "fill_in_blank",
          question_id: Number(q.id),
          data: {
            answers: answersObject,
          },
        });
      } else if (q.type === "drag_drop") {
        const answer = dragDropAnswers[q.id];
        const placements = answer?.placements || {};
        const answerOptions = q.options.answers || [];

        // Đếm số lượng blanks từ content text
        const text = q.content.text || "";
        const blankCount = (text.match(/\[blank\]/g) || []).length;

        // Tạo answers object với tất cả positions
        const answers: Record<number, number> = {};

        // Duyệt qua tất cả positions từ 1 đến blankCount
        for (let position = 1; position <= blankCount; position++) {
          const placedItemText = placements[position.toString()];
          if (placedItemText) {
            const answerOption = answerOptions.find(
              (option: any) => option.text === placedItemText
            );
            answers[position] = answerOption ? answerOption.group_position : 0;
          } else {
            answers[position] = 0;
          }
        }

        list_answers.push({
          type_question: "dragdrop",
          question_id: Number(q.id),
          data: {
            answers,
          },
        });
      } else if (q.type === "category") {
        const answer = categoryAnswers[q.id];
        const connections = answer?.connections || {};
        const items = q.options.items || [];

        // Tạo answers object theo format yêu cầu
        const answers: Record<string, number> = {};

        // Duyệt qua tất cả items
        items.forEach((item: any) => {
          const itemId = item.id.toString();
          let categoryId = "0"; // Mặc định là 0 nếu không thuộc category nào

          // Tìm xem item này thuộc category nào
          for (const [catId, itemIds] of Object.entries(connections)) {
            if (itemIds.includes(itemId)) {
              categoryId = catId;
              break;
            }
          }

          // Thêm vào answers object
          answers[itemId] = Number(categoryId);
        });

        list_answers.push({
          type_question: "category",
          question_id: Number(q.id),
          data: {
            answers,
          },
        });
      } else if (q.type === "ordering") {
        const answer = orderingAnswers[q.id];
        const order = answer?.order || [];

        // Tạo answers object theo format yêu cầu: position -> group_position
        const answers: Record<number, number> = {};

        order.forEach((itemId: string, index: number) => {
          // Tìm answer option để lấy group_position
          const answerOption = (q.options.answers || []).find(
            (a: any) => String(a.id) === String(itemId)
          );
          if (answerOption) {
            // key là index+1 (blank_position), value là group_position
            answers[index + 1] = answerOption.group_position;
          }
        });

        list_answers.push({
          type_question: "ordering",
          question_id: Number(q.id),
          data: {
            answers,
          },
        });
      } else if (q.type === "matching") {
        const answer = matchingAnswers[q.id];
        const matches = answer?.matches || {};
        const sources = q.options.sources || [];

        // Tạo answers object theo format yêu cầu: sourceId -> targetId
        const answers: Record<string, number> = {};

        sources.forEach((source: any) => {
          const sourceId = source.id.toString();
          const targetId = matches[sourceId];

          // Nếu có match thì gán targetId, không thì gán 0
          answers[sourceId] = targetId ? Number(targetId) : 0;
        });

        list_answers.push({
          type_question: "matching",
          question_id: Number(q.id),
          data: {
            answers,
          },
        });
      } else if (q.type === "labeling") {
        const answer = labelingAnswers[q.id];
        const placements = answer?.placements || {};
        const blanks = q.options.blanks || [];
        const answers: Record<string, number> = {};
        blanks.forEach((blank: any) => {
          const blankId = blank.id?.toString();
          if (blankId) {
            const labelId = placements[blankId];
            answers[blankId] = labelId ? Number(labelId) : 0;
          }
        });
        list_answers.push({
          type_question: "labeling",
          question_id: Number(q.id),
          data: {
            answers,
          },
        });
      } else if (q.type === "speaking") {
        const answer = speakingAnswers[q.id];
        const data: any = {};

        // Nếu có text answer thì thêm vào
        if (answer?.text && answer.text.trim()) {
          data.answer = answer.text.trim();
        }

        // Nếu có file URL thì thêm vào
        if (answer?.fileUrl) {
          data.file_url = answer.fileUrl;
        }

        list_answers.push({
          type_question: "manual",
          question_id: Number(q.id),
          data,
        });
      } else if (q.type === "writing") {
        const answer = writingAnswers[q.id];
        const data: any = {};

        // Nếu có text answer thì thêm vào
        if (answer?.text && answer.text.trim()) {
          data.answer = answer.text.trim();
        }

        list_answers.push({
          type_question: "manual",
          question_id: Number(q.id),
          data,
        });
      }
    }

    const resolvedLessonId =
      lessonId ||
      searchParams.get("lessonId") ||
      (exerciseDetail?.lesson_id != null
        ? String(exerciseDetail.lesson_id)
        : null);

    if (user?.type === "student" && !resolvedLessonId) {
      console.error("Lesson ID is required for submitting exercise");
      return;
    }

    const requestData: SaveScoreBulkRequest = {
      exercise_id: Number(exerciseId),
      ...(resolvedLessonId ? { lesson_id: Number(resolvedLessonId) } : {}),
      time: elapsedTimeInSeconds, // Send elapsed time as number
      list_answers,
    };

    // Log payload để debug
    console.log("Submit payload:", JSON.stringify(requestData, null, 2));
    console.log("Elapsed time (seconds):", elapsedTimeInSeconds);

    try {
      const response = await saveScoreExerciseBulk(requestData);

      // Store the exercise result data in localStorage for the result page
      localStorage.setItem(`exerciseResult_${exerciseId}`, JSON.stringify(response));
      setTimeout(() => {
        if (user?.type === "student") {
          const from = searchParams.get("from") || undefined;
          const courseId = searchParams.get("courseId") || undefined;
          const lessonId = searchParams.get("lessonId") || undefined;
          router.push(
            resultExerciseStudentRoute(user, exerciseId, from, courseId, lessonId)
          );
        } else {
          router.push(resultExerciseRoute(user, exerciseId));
        }
      }, 200);
    } catch (error) {
      console.error("Error saving exercise (bulk):", error);
    }
  }, [
    questions,
    selectedAnswers,
    fillInBlankAnswers,
    dragDropAnswers,
    categoryAnswers,
    orderingAnswers,
    matchingAnswers,
    labelingAnswers,
    speakingAnswers,
    writingAnswers,
    exerciseId,
    router,
    originalTimeLimit,
    timeLeft,
    user,
    searchParams,
    lessonId,
    exerciseDetail,
  ]);

  // Function để hiển thị popup xác nhận
  const handleShowConfirmDialog = useCallback(() => {
    setShowConfirmDialog(true);
  }, []);

  // Function để xử lý khi user xác nhận nộp bài
  const handleConfirmSubmit = useCallback(() => {
    setShowConfirmDialog(false);
    handleSubmitExercise();
  }, [handleSubmitExercise]);

  // Function để xử lý khi user hủy nộp bài
  const handleCancelSubmit = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  // Timer logic - Moved after handleSubmitExercise definition
  useEffect(() => {
    if (timeLeft && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      // Time's up - auto submit
      handleSubmitExercise();
    }
  }, [timeLeft, handleSubmitExercise]);

  const currentQuestion = questions[currentQuestionIndex];

  // Xử lý khi user chọn đáp án multiple choice
  const handleAnswerSelect = useCallback(
    (answerIds: (string | number)[]) => {
      if (currentQuestion) {
        setSelectedAnswers((prev) => ({
          ...prev,
          [currentQuestion.id]: answerIds,
        }));
        console.log(
          `Selected answers ${answerIds} for question ${currentQuestion.id}`
        );
      }
    },
    [currentQuestion]
  );

  // Xử lý khi user cập nhật đáp án fill in blank
  const handleFillInBlankUpdate = useCallback(
    (answer: any) => {
      if (currentQuestion && answer.answers) {
        const questionAnswers: Record<string, string> = {};
        const options = currentQuestion.options?.answers || [];

        answer.answers.forEach((answerItem: any, idx: number) => {
          const answerOption =
            options.find(
              (opt: any) =>
                (answerItem.id != null &&
                  opt.id?.toString() === answerItem.id) ||
                (answerItem.correct_position != null &&
                  opt.correct_position?.toString() ===
                    answerItem.correct_position)
            ) ?? options[idx];

          const position =
            answerOption?.correct_position ??
            (answerItem.correct_position
              ? Number(answerItem.correct_position)
              : idx + 1);

          const blankId = `${currentQuestion.id}_blank_${position}`;
          questionAnswers[blankId] = answerItem.text || "";
        });

        setFillInBlankAnswers((prev) => ({
          ...prev,
          [currentQuestion.id]: questionAnswers,
        }));
      }
    },
    [currentQuestion]
  );

  // Xử lý khi user cập nhật đáp án drag & drop
  const handleDragDropUpdate = useCallback(
    (answer: any) => {
      if (currentQuestion) {
        setDragDropAnswers((prev) => ({
          ...prev,
          [currentQuestion.id]: answer,
        }));
      }
    },
    [currentQuestion]
  );

  // Xử lý khi user cập nhật đáp án category
  const handleCategoryUpdate = useCallback(
    (answer: any) => {
      if (currentQuestion) {
        setCategoryAnswers((prev) => ({
          ...prev,
          [currentQuestion.id]: answer,
        }));
      }
    },
    [currentQuestion]
  );

  // Xử lý khi user cập nhật đáp án ordering
  const handleOrderingUpdate = useCallback(
    (answer: any) => {
      if (currentQuestion) {
        setOrderingAnswers((prev) => ({
          ...prev,
          [currentQuestion.id]: answer,
        }));
      }
    },
    [currentQuestion]
  );

  // Xử lý khi user cập nhật đáp án matching
  const handleMatchingUpdate = useCallback(
    (answer: any) => {
      if (currentQuestion) {
        setMatchingAnswers((prev) => ({
          ...prev,
          [currentQuestion.id]: answer,
        }));
      }
    },
    [currentQuestion]
  );

  // Xử lý khi user cập nhật đáp án labeling
  const handleLabelingUpdate = useCallback(
    (answer: any) => {
      if (currentQuestion) {
        setLabelingAnswers((prev) => ({
          ...prev,
          [currentQuestion.id]: answer,
        }));
      }
    },
    [currentQuestion]
  );

  // Xử lý khi user cập nhật đáp án speaking
  const handleSpeakingUpdate = useCallback(
    (answer: any) => {
      if (currentQuestion) {
        setSpeakingAnswers((prev) => ({
          ...prev,
          [currentQuestion.id]: {
            mediaBlob: answer.audioBlob || answer.videoBlob,
            text: answer.text || "",
            fileUrl: answer.fileUrl, // fileUrl đã được upload ở component con
            isAnswered: answer.isAnswered,
          },
        }));
      }
    },
    [currentQuestion]
  );

  // Xử lý khi user cập nhật đáp án writing
  const handleWritingUpdate = useCallback(
    (answer: any) => {
      if (currentQuestion) {
        setWritingAnswers((prev) => ({
          ...prev,
          [currentQuestion.id]: {
            text: answer.text || "",
            isAnswered: answer.isAnswered,
          },
        }));
      }
    },
    [currentQuestion]
  );

  const handleNext = useCallback(() => {
    if (!Array.isArray(questions)) return;
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Submit when reaching the last question
      handleSubmitExercise();
    }
  }, [currentQuestionIndex, questions, handleSubmitExercise]);

  const handleBack = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  // Xử lý khi click vào số câu hỏi trong Question List Indicator
  const handleQuestionJump = useCallback(
    (questionIndex: number) => {
      if (!Array.isArray(questions)) return;
      if (questionIndex >= 0 && questionIndex < questions.length) {
        setCurrentQuestionIndex(questionIndex);
      }
    },
    [questions]
  );

  const renderQuestion = () => {
    if (!Array.isArray(questions) || !currentQuestion) return null;

    switch (currentQuestion.type) {
      case "multiple_choice": {
        // Lấy đáp án đã chọn cho câu hỏi multiple choice
        const selectedAnswerIds = selectedAnswers[currentQuestion.id] || [];

        return (
          <MultipleChoiceQuestion
            question={currentQuestion}
            selectedAnswerIds={selectedAnswerIds}
            onAnswerSelect={handleAnswerSelect}
            isSubmitted={false}
          />
        );
      }
      case "fill_in_blanks": {
        // Lấy đáp án đã nhập cho câu hỏi fill in blank
        const questionAnswers = fillInBlankAnswers[currentQuestion.id] || {};

        // Convert sang format { isAnswered, answers: [{ id, text }] } để match với component
        const userAnswers = {
          isAnswered: Object.values(questionAnswers).some(
            (text) => text.trim() !== ""
          ),
          answers: (currentQuestion.options.answers || []).map(
            (answerOption: any) => {
              const blankId = `${currentQuestion.id}_blank_${answerOption.correct_position}`;
              return {
                id: answerOption.id?.toString() || "",
                text: questionAnswers[blankId] || "",
              };
            }
          ),
        };

        return (
          <FillInBlankQuestion
            question={currentQuestion}
            userAnswers={userAnswers}
            onAnswerUpdate={handleFillInBlankUpdate}
            isSubmitted={false}
          />
        );
      }
      case "drag_drop": {
        // Lấy đáp án đã nhập cho câu hỏi drag & drop
        const userAnswer = dragDropAnswers[currentQuestion.id];

        return (
          <DragDropQuestion
            question={currentQuestion}
            userAnswer={userAnswer}
            onAnswerUpdate={handleDragDropUpdate}
            isSubmitted={false}
          />
        );
      }
      case "category": {
        // Lấy đáp án đã nhập cho câu hỏi category
        const userAnswer = categoryAnswers[currentQuestion.id];

        return (
          <CategoryQuestion
            question={currentQuestion}
            userAnswer={userAnswer}
            onAnswerUpdate={handleCategoryUpdate}
            isSubmitted={false}
          />
        );
      }
      case "ordering": {
        // Lấy đáp án đã nhập cho câu hỏi ordering
        const userAnswer = orderingAnswers[currentQuestion.id];

        return (
          <OrderingQuestion
            question={currentQuestion}
            userAnswer={userAnswer}
            onAnswerUpdate={handleOrderingUpdate}
            isSubmitted={false}
            onFeedback={() => {}}
          />
        );
      }
      case "matching": {
        // Lấy đáp án đã nhập cho câu hỏi matching
        const userAnswer = matchingAnswers[currentQuestion.id];

        return (
          <MatchingQuestion
            question={currentQuestion}
            userAnswer={userAnswer}
            onAnswerUpdate={handleMatchingUpdate}
            isSubmitted={false}
          />
        );
      }
      case "labeling": {
        // Lấy đáp án đã nhập cho câu hỏi labeling
        const userAnswer = labelingAnswers[currentQuestion.id];

        return (
          <LabelingQuestion
            question={currentQuestion}
            userAnswer={userAnswer}
            onAnswerUpdate={handleLabelingUpdate}
            isSubmitted={false}
          />
        );
      }
      case "speaking": {
        // Lấy đáp án đã nhập cho câu hỏi speaking
        const userAnswer = speakingAnswers[currentQuestion.id];

        return (
          <SpeakingQuestion
            question={currentQuestion}
            userAnswer={userAnswer}
            onAnswerUpdate={handleSpeakingUpdate}
            isSubmitted={false}
            uploadFile={(file: File) => uploadFile(file, "speaking")}
          />
        );
      }
      case "writing": {
        // Lấy đáp án đã nhập cho câu hỏi writing
        const userAnswer = writingAnswers[currentQuestion.id];

        return (
          <WritingQuestion
            question={currentQuestion}
            userAnswer={userAnswer}
            onAnswerUpdate={handleWritingUpdate}
            isSubmitted={false}
          />
        );
      }
      default:
        return <div>Unsupported question type: {currentQuestion.type}</div>;
    }
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "00:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Kiểm tra câu hỏi đã được trả lời chưa - Fixed return type
  const isQuestionAnswered = (questionId: string): boolean => {
    if (!Array.isArray(questions)) return false;
    const question = questions.find((q) => q.id === questionId);
    if (!question) return false;

    if (question.type === "multiple_choice") {
      const answers = selectedAnswers[questionId];
      return answers && answers.length > 0;
    } else if (question.type === "fill_in_blanks") {
      const questionAnswers = fillInBlankAnswers[questionId] || {};
      return Object.values(questionAnswers).some((text) => text.trim() !== "");
    } else if (question.type === "drag_drop") {
      const answer = dragDropAnswers[questionId];
      return answer && answer.isAnswered;
    } else if (question.type === "category") {
      const answer = categoryAnswers[questionId];
      return answer && answer.isAnswered;
    } else if (question.type === "ordering") {
      const answer = orderingAnswers[questionId];
      return answer && answer.isAnswered;
    } else if (question.type === "matching") {
      const answer = matchingAnswers[questionId];
      return answer && answer.isAnswered;
    } else if (question.type === "labeling") {
      const answer = labelingAnswers[questionId];
      return answer && answer.isAnswered;
    } else if (question.type === "speaking") {
      const answer = speakingAnswers[questionId];
      // Đã trả lời khi đã có fileUrl hoặc mediaBlob (tức là đã ghi xong và có file), KHÔNG tính đang quay là đã trả lời
      return Boolean(
        answer && (answer.isAnswered || answer.fileUrl || answer.mediaBlob)
      );
    } else if (question.type === "writing") {
      const answer = writingAnswers[questionId];
      return answer && answer.isAnswered;
    }
    return false;
  };

  // Thêm logic cảnh báo khi thoát trang
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue =
        "Are you sure you want to leave? Your progress will be lost.";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const pathname = usePathname();

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const confirmLeave = window.confirm(
        "Are you sure you want to leave? Your progress will be lost."
      );
      if (!confirmLeave) {
        router.push(pathname); // Stay on current page
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router, pathname]);

  return (
    <>
      <ExamSubmissionPage
        questions={questions}
        currentQuestionIndex={currentQuestionIndex}
        examDetail={exerciseDetail}
        timeLeft={timeLeft}
        isLoading={isLoading}
        onNext={handleNext}
        onBack={handleBack}
        onSubmit={handleShowConfirmDialog}
        onQuestionJump={handleQuestionJump}
        renderQuestion={renderQuestion}
        formatTime={formatTime}
        isQuestionAnswered={isQuestionAnswered}
        examName={exerciseName}
      />

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Confirm submission
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to submit?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelSubmit}
                  className="flex-1 bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-all hover:bg-gray-600"
                >
                  No
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-all hover:bg-green-700"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
