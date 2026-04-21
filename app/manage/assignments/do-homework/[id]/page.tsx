"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getQuestions, uploadFile } from "@/lib/api/questions";
import {
  saveScoreMultipleChoice,
  saveScoreFillInBlank,
  saveScoreOrderingDragdrop,
  saveScoreMatching,
  saveScoreCategory,
  saveScoreLabeling,
  saveScoreManual,
  GetHomeworkDetail,
  type SaveScoreFillInBlankRequest,
  type SaveScoreOrderingDragdropRequest,
  type SaveScoreMatchingRequest,
  type SaveScoreCategoryRequest,
  type SaveScoreLabelingRequest,
  type SaveScoreManualRequest,
} from "@/lib/api/homeworks";
import { getHomeworkAnswersByStudent } from "@/lib/api/exam-answers";
import HomeworkSubmissionPage from "../../components/homework-submission-page";
import {
  resultHomeworkRoute,
  resultHomeworkStudentRoute,
} from "@/lib/utils/route-utils";
import { useAuth } from "@/lib/context/auth-context";

// Import shared question components
import { DragDropQuestion } from "../../components/questions/drag-drop-question";
import { MultipleChoiceQuestion } from "../../components/questions/multiple-choice-question";
import { FillInBlankQuestion } from "../../components/questions/fill-in-blank-question";
import { OrderingQuestion } from "../../components/questions/ordering-question";
import { MatchingQuestion } from "../../components/questions/matching-question";
import { WritingQuestion } from "../../components/questions/writing-question";
import { SpeakingQuestion } from "../../components/questions/speaking-question";
import { CategoryQuestion } from "../../components/questions/category-question";
import { LabelingQuestion } from "../../components/questions/labeling-question";

type FeedbackState = "initial" | "correct" | "incorrect";

export default function HomeworkPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const homeworkId = params.id as string;
  const [homeworkName, setHomeworkName] = useState<string>(
    searchParams.get("name") || ""
  );

  // State management
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackState, setFeedbackState] = useState<FeedbackState>("initial");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
  const [maxViewedQuestionIndex, setMaxViewedQuestionIndex] = useState(0);
  const [lastQuestionIdCompleted, setLastQuestionIdCompleted] =
    useState<number>(0);
  const [completedQuestions, setCompletedQuestions] = useState<Set<number>>(
    new Set()
  );
  // Skip logic states
  const [wrongAttempts, setWrongAttempts] = useState<Record<string, number>>(
    {}
  );
  const [skippableQuestions, setSkippableQuestions] = useState<Set<string>>(
    new Set()
  );
  // Thêm state để lưu đáp án đúng và đáp án đã làm
  const [homeworkAnswers, setHomeworkAnswers] = useState<any>(null);
  const [isAnswersLoading, setIsAnswersLoading] = useState(true);
  // State để kiểm soát nút Nộp bài và popup xác nhận
  const [showSubmitButton, setShowSubmitButton] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset";
    };
  }, []);

  // Load questions data, homework detail và homework answers
  useEffect(() => {
    const loadQuestionsAndHomework = async () => {
      try {
        setIsLoading(true);
        setIsAnswersLoading(true);
        // Load cả 3 API song song
        const [questionsResponse, homeworkDetail, answersRes] =
          await Promise.all([
            getQuestions({
              homework_id: Number(homeworkId),
            }),
            GetHomeworkDetail(homeworkId),
            getHomeworkAnswersByStudent({
              homework_id: Number(homeworkId),
            }),
          ]);

        // Extract questions array from the response
        const questionsData = questionsResponse.questions || [];
        setQuestions(questionsData);
        setHomeworkAnswers(answersRes.data);
        setIsAnswersLoading(false);

        console.log("Questions loaded:", questionsData);
        console.log("Homework detail loaded:", homeworkDetail);

        // Set homework name from API (fallback to URL param if missing)
        setHomeworkName(
          (homeworkDetail && (homeworkDetail as any).name) ||
            searchParams.get("name") ||
            ""
        );

        // Use last_question_id_completed from API instead of localStorage
        const lastQuestionIdCompleted =
          homeworkDetail.last_question_id_completed;
        console.log(
          "Last question ID completed from API:",
          lastQuestionIdCompleted
        );

        // Lưu lastQuestionIdCompleted vào state
        setLastQuestionIdCompleted(lastQuestionIdCompleted || 0);

        // Nếu có lastQuestionIdCompleted, thêm vào completedQuestions để đảm bảo logic nút Next hoạt động đúng
        if (lastQuestionIdCompleted && lastQuestionIdCompleted !== 0) {
          console.log(
            "Thêm lastQuestionIdCompleted vào completedQuestions:",
            lastQuestionIdCompleted
          );
          setCompletedQuestions((prev) => {
            const newSet = new Set([...prev, Number(lastQuestionIdCompleted)]);
            console.log("completedQuestions sau khi thêm:", Array.from(newSet));
            return newSet;
          });
        }

        if (questionsData && questionsData.length > 0) {
          if (lastQuestionIdCompleted && lastQuestionIdCompleted !== 0) {
            const idx = questionsData.findIndex(
              (q: any) => String(q.id) === String(lastQuestionIdCompleted)
            );
            console.log(
              "Index tìm được:",
              idx,
              "lastQuestionIdCompleted:",
              lastQuestionIdCompleted,
              "questionsData:",
              questionsData.map((q: any) => q.id)
            );
            if (idx !== -1 && idx + 1 < questionsData.length) {
              setCurrentQuestionIndex(idx + 1);
            } else {
              setCurrentQuestionIndex(0);
            }
          } else {
            setCurrentQuestionIndex(0);
          }
        }
      } catch (error) {
        console.error(
          "Failed to load questions/homework detail/answers:",
          error
        );
      } finally {
        setIsLoading(false);
        setIsAnswersLoading(false);
      }
    };

    loadQuestionsAndHomework();
  }, [homeworkId]);

  // Đảm bảo completedQuestions luôn chứa lastQuestionIdCompleted khi giá trị này thay đổi
  useEffect(() => {
    if (lastQuestionIdCompleted && lastQuestionIdCompleted !== 0) {
      console.log(
        "useEffect: Thêm lastQuestionIdCompleted vào completedQuestions:",
        lastQuestionIdCompleted
      );
      setCompletedQuestions((prev) => {
        if (!prev.has(Number(lastQuestionIdCompleted))) {
          const newSet = new Set([...prev, Number(lastQuestionIdCompleted)]);
          console.log(
            "useEffect: completedQuestions sau khi thêm:",
            Array.from(newSet)
          );
          return newSet;
        }
        console.log(
          "useEffect: lastQuestionIdCompleted đã có trong completedQuestions"
        );
        return prev;
      });
    }
  }, [lastQuestionIdCompleted]);

  const currentQuestion = questions[currentQuestionIndex];

  // Xác định index câu đã làm cuối cùng
  const lastDoneIndex = questions.findIndex(
    (q) => String(q.id) === String(lastQuestionIdCompleted)
  );
  const isDone = currentQuestionIndex <= lastDoneIndex;

  // Helper function to add completed question
  const addCompletedQuestion = useCallback((questionId: number) => {
    setCompletedQuestions((prev) => new Set([...prev, questionId]));
  }, []);

  // Skip logic functions
  const canSkip = useCallback(() => {
    if (!currentQuestion) return false;

    // Speaking và Writing luôn có thể skip
    if (
      currentQuestion.type === "speaking" ||
      currentQuestion.type === "writing"
    ) {
      return true;
    }

    // Các dạng khác: có thể skip nếu đã sai 3 lần hoặc đã được đánh dấu skippable
    const questionId = currentQuestion.id.toString();
    return skippableQuestions.has(questionId) || wrongAttempts[questionId] >= 3;
  }, [currentQuestion, wrongAttempts, skippableQuestions]);

  const handleFinishHomework = useCallback(() => {
    // Hiển thị popup xác nhận thay vì nộp bài ngay
    setShowConfirmDialog(true);
  }, []);

  const handleConfirmSubmit = useCallback(() => {
    // Đóng popup và nộp bài
    setShowConfirmDialog(false);
    if (user?.type === "student") {
      const from = searchParams.get("from") || undefined;
      const courseId = searchParams.get("courseId") || undefined;
      const lessonId = searchParams.get("lessonId") || undefined;
      router.push(
        resultHomeworkStudentRoute(user, homeworkId, from, courseId, lessonId)
      );
    } else {
      router.push(resultHomeworkRoute(user, homeworkId));
    }
  }, [router, homeworkId, user, searchParams]);

  const handleCancelSubmit = useCallback(() => {
    // Đóng popup, không nộp bài
    setShowConfirmDialog(false);
  }, []);

  const handleAnswerUpdate = useCallback(
    (answer: any) => {
      console.log(
        "Updating answer for question:",
        currentQuestion?.id,
        "with answer:",
        answer
      );
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion?.id || ""]: answer,
      }));
    },
    [currentQuestion?.id]
  );

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setMaxViewedQuestionIndex((prev) => Math.max(prev, nextIndex));
      setFeedbackState("initial");
      setShowFeedback(false);
    }
  }, [currentQuestionIndex, questions.length]);

  const handleBack = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      setFeedbackState("initial");
      setShowFeedback(false);
    }
  }, [currentQuestionIndex]);

  const handleSkip = useCallback(() => {
    if (!currentQuestion || !canSkip()) return;

    const questionId = currentQuestion.id.toString();

    // Đánh dấu câu hỏi này là skippable để lần sau back lại vẫn có thể skip
    setSkippableQuestions((prev) => new Set([...prev, questionId]));

    // Đánh dấu là đã completed để có thể next
    addCompletedQuestion(Number(currentQuestion.id));

    // Chuyển câu tiếp theo hoặc nộp bài nếu là câu cuối
    if (currentQuestionIndex === questions.length - 1) {
      if (user?.type === "student") {
        const from = searchParams.get("from") || undefined;
        const courseId = searchParams.get("courseId") || undefined;
        const lessonId = searchParams.get("lessonId") || undefined;
        router.push(
          resultHomeworkStudentRoute(user, homeworkId, from, courseId, lessonId)
        );
      } else {
        router.push(resultHomeworkRoute(user, homeworkId));
      }
    } else {
      handleNext();
    }
  }, [
    currentQuestion,
    canSkip,
    addCompletedQuestion,
    currentQuestionIndex,
    questions.length,
    router,
    homeworkId,
    handleNext,
    user,
    searchParams,
  ]);

  // Function to upload file for speaking questions
  const handleUploadFile = useCallback(async (file: File) => {
    try {
      const response = await uploadFile(file, "homework-audio");
      return response;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  }, []);

  const handleCheck = useCallback(async () => {
    if (!currentQuestion || isCheckingAnswer) return;

    const userAnswer = answers[currentQuestion.id];
    if (!userAnswer) return;

    setIsCheckingAnswer(true);

    // Helper function to handle correct answer - check if it's last question and auto-submit
    const handleCorrectAnswer = () => {
      addCompletedQuestion(Number(currentQuestion.id));

      // If this is the last question, enable submit button instead of auto-submit
      if (currentQuestionIndex === questions.length - 1) {
        setTimeout(() => {
          setShowFeedback(false);
          setFeedbackState("initial");
          // Bật nút Nộp bài khi làm đúng câu cuối
          setShowSubmitButton(true);
        }, 2000);
      } else {
        setTimeout(() => {
          handleNext();
          setShowFeedback(false);
          setFeedbackState("initial");
        }, 2000);
      }
    };

    try {
      if (currentQuestion.type === "multiple_choice") {
        if (
          !userAnswer.isAnswered ||
          !Array.isArray(userAnswer.selectedIds) ||
          userAnswer.selectedIds.length === 0
        )
          return;

        // Lấy danh sách answer_id từ selectedIds
        const answerIds = userAnswer.selectedIds
          .map((id: string | number) => id)
          .filter(Boolean);

        if (answerIds.length === 0) {
          throw new Error("No valid answer IDs found for selected options");
        }

        // API expects answer_ids: number[]
        const requestData = {
          homework_id: Number.parseInt(homeworkId),
          question_id: Number.parseInt(currentQuestion.id),
          answer_ids: answerIds.map((id: string | number) => Number(id)),
        };

        const response = await saveScoreMultipleChoice(requestData);
        console.log("Save score response:", response);

        const isCorrect = response.data.is_correct;
        setFeedbackState(isCorrect ? "correct" : "incorrect");
        setShowFeedback(true);

        if (isCorrect) {
          handleCorrectAnswer();
        } else {
          // Tăng số lần sai cho câu hỏi này
          const questionId = currentQuestion.id.toString();
          setWrongAttempts((prev) => ({
            ...prev,
            [questionId]: (prev[questionId] || 0) + 1,
          }));
          setTimeout(() => {
            setShowFeedback(false);
            setFeedbackState("initial");
          }, 5000);
        }
      } else if (currentQuestion.type === "fill_in_blanks") {
        if (!userAnswer.isAnswered || !userAnswer.answers) return;

        // Tạo object answers theo format API mong đợi: { position: text }
        const answersObject: Record<number, string> = {};

        // Lấy danh sách answers từ question để biết correct_position
        const questionAnswers = currentQuestion.options.answers || [];

        // Đảm bảo gửi đủ số ô trống, kể cả khi user chưa nhập
        questionAnswers.forEach((qa: any) => {
          const userInput = userAnswer.answers.find(
            (ua: any) => ua.id === qa.id.toString()
          );
          const text = userInput ? userInput.text : "";
          // Key là vị trí (correct_position), value là text học sinh nhập
          answersObject[qa.correct_position] = text;
        });

        const requestData: SaveScoreFillInBlankRequest = {
          homework_id: Number.parseInt(homeworkId),
          question_id: Number.parseInt(currentQuestion.id),
          answers: answersObject,
        };

        console.log("Calling saveScoreFillInBlank with:", requestData);

        const response = await saveScoreFillInBlank(requestData);
        console.log("Save score response:", response);

        const isCorrect = response.data.is_all_correct;
        setFeedbackState(isCorrect ? "correct" : "incorrect");
        setShowFeedback(true);

        if (isCorrect) {
          handleCorrectAnswer();
        } else {
          // Tăng số lần sai cho câu hỏi này
          const questionId = currentQuestion.id.toString();
          setWrongAttempts((prev) => ({
            ...prev,
            [questionId]: (prev[questionId] || 0) + 1,
          }));
          setTimeout(() => {
            setShowFeedback(false);
            setFeedbackState("initial");
          }, 5000);
        }
      } else if (currentQuestion.type === "ordering") {
        if (!userAnswer.isAnswered || !userAnswer.order) return;

        // Đổi sang object { sort_position: group_position }
        const answersObject: Record<string, number> = {};
        const answerList = currentQuestion.options.answers || [];
        userAnswer.order.forEach((answerId: string, index: number) => {
          const answerObj = answerList.find((a: any) => a.id === answerId);
          if (answerObj) {
            // Key là sort_position (index + 1), value là group_position
            answersObject[(index + 1).toString()] = answerObj.group_position;
          }
        });

        const requestData: SaveScoreOrderingDragdropRequest = {
          homework_id: Number.parseInt(homeworkId),
          question_id: Number.parseInt(currentQuestion.id),
          answers: answersObject,
        };

        console.log("Calling saveScoreOrderingDragdrop with:", requestData);

        const response = await saveScoreOrderingDragdrop(requestData);
        console.log("Save score response:", response);

        const isCorrect = response.data.is_all_correct;
        setFeedbackState(isCorrect ? "correct" : "incorrect");
        setShowFeedback(true);

        if (isCorrect) {
          handleCorrectAnswer();
        } else {
          // Tăng số lần sai cho câu hỏi này
          const questionId = currentQuestion.id.toString();
          setWrongAttempts((prev) => ({
            ...prev,
            [questionId]: (prev[questionId] || 0) + 1,
          }));
          setTimeout(() => {
            setShowFeedback(false);
            setFeedbackState("initial");
          }, 5000);
        }
      } else if (currentQuestion.type === "drag_drop") {
        if (!userAnswer.isAnswered || !userAnswer.placements) return;

        // Đổi sang object { sort_position: group_position }
        const answersObject: Record<string, number> = {};
        const targets = Object.keys(userAnswer.placements);
        const answerList = currentQuestion.options.answers || [];
        targets.forEach((targetId, idx) => {
          const answerText = userAnswer.placements[targetId];
          const answerObj = answerList.find((a: any) => a.text === answerText);
          if (answerObj) {
            // Key là sort_position (idx + 1), value là group_position
            answersObject[(idx + 1).toString()] = answerObj.group_position;
          }
        });
        // Không gửi các đáp án không thuộc blank nào (không set = 0 nữa)
        const requestData: SaveScoreOrderingDragdropRequest = {
          homework_id: Number.parseInt(homeworkId),
          question_id: Number.parseInt(currentQuestion.id),
          answers: answersObject,
        };
        console.log(
          "Calling saveScoreOrderingDragdrop with (drag_drop):",
          requestData
        );
        const response = await saveScoreOrderingDragdrop(requestData);
        console.log("Save score response:", response);
        const isCorrect = response.data.is_all_correct;
        setFeedbackState(isCorrect ? "correct" : "incorrect");
        setShowFeedback(true);

        if (isCorrect) {
          handleCorrectAnswer();
        } else {
          // Tăng số lần sai cho câu hỏi này
          const questionId = currentQuestion.id.toString();
          setWrongAttempts((prev) => ({
            ...prev,
            [questionId]: (prev[questionId] || 0) + 1,
          }));
          setTimeout(() => {
            setShowFeedback(false);
            setFeedbackState("initial");
          }, 5000);
        }
        return;
      } else if (currentQuestion.type === "matching") {
        if (!userAnswer.isAnswered || !userAnswer.matches) return;
        // Convert matches: { [sourceId]: targetId } (string) => { [sourceId: number]: number }
        const answersObject: Record<number, number> = {};
        Object.entries(userAnswer.matches).forEach(([sourceId, targetId]) => {
          if (sourceId && targetId) {
            answersObject[Number(sourceId)] = Number(targetId);
          }
        });
        const requestData: SaveScoreMatchingRequest = {
          homework_id: Number.parseInt(homeworkId),
          question_id: Number.parseInt(currentQuestion.id),
          answers: answersObject,
        };
        const response = await saveScoreMatching(requestData);
        const isCorrect = response.data.is_all_correct;
        setFeedbackState(isCorrect ? "correct" : "incorrect");
        setShowFeedback(true);

        if (isCorrect) {
          handleCorrectAnswer();
        } else {
          // Tăng số lần sai cho câu hỏi này
          const questionId = currentQuestion.id.toString();
          setWrongAttempts((prev) => ({
            ...prev,
            [questionId]: (prev[questionId] || 0) + 1,
          }));
          setTimeout(() => {
            setShowFeedback(false);
            setFeedbackState("initial");
          }, 5000);
        }
        return;
      } else if (currentQuestion.type === "category") {
        if (!userAnswer.isAnswered || !userAnswer.connections) return;
        // Convert connections: { [categoryId]: string[] } => { [answer_id: number]: group_id: number }
        const answersObject: Record<number, number> = {};
        Object.entries(userAnswer.connections).forEach(
          ([categoryId, answerIds]) => {
            (answerIds as string[]).forEach((answerId) => {
              if (answerId && categoryId) {
                answersObject[Number(answerId)] = Number(categoryId);
              }
            });
          }
        );
        const requestData: SaveScoreCategoryRequest = {
          homework_id: Number.parseInt(homeworkId),
          question_id: Number.parseInt(currentQuestion.id),
          answers: answersObject,
        };
        const response = await saveScoreCategory(requestData);
        const isCorrect = response.data.is_all_correct;
        setFeedbackState(isCorrect ? "correct" : "incorrect");
        setShowFeedback(true);

        if (isCorrect) {
          handleCorrectAnswer();
        } else {
          // Tăng số lần sai cho câu hỏi này
          const questionId = currentQuestion.id.toString();
          setWrongAttempts((prev) => ({
            ...prev,
            [questionId]: (prev[questionId] || 0) + 1,
          }));
          setTimeout(() => {
            setShowFeedback(false);
            setFeedbackState("initial");
          }, 5000);
        }
        return;
      } else if (currentQuestion.type === "labeling") {
        if (!userAnswer.isAnswered || !userAnswer.placements) return;

        // Đổi answersObject: { blankId: labelId }
        const answersObject: Record<number, number> = {};
        Object.entries(userAnswer.placements).forEach(([blankId, labelId]) => {
          if (blankId && labelId) {
            answersObject[Number(blankId)] = Number(labelId);
          }
        });

        const requestData: SaveScoreLabelingRequest = {
          homework_id: Number.parseInt(homeworkId),
          question_id: Number.parseInt(currentQuestion.id),
          answers: answersObject,
        };
        const response = await saveScoreLabeling(requestData);
        const isCorrect = response.data.is_all_correct;
        setFeedbackState(isCorrect ? "correct" : "incorrect");
        setShowFeedback(true);

        if (isCorrect) {
          handleCorrectAnswer();
        } else {
          // Tăng số lần sai cho câu hỏi này
          const questionId = currentQuestion.id.toString();
          setWrongAttempts((prev) => ({
            ...prev,
            [questionId]: (prev[questionId] || 0) + 1,
          }));
          setTimeout(() => {
            setShowFeedback(false);
            setFeedbackState("initial");
          }, 5000);
        }
        return;
      } else if (currentQuestion.type === "writing") {
        // Cho phép gửi API kể cả khi user chưa nhập gì (khi bấm Bỏ qua)
        const answerText = userAnswer.text || "";
        const requestData: SaveScoreManualRequest = {
          homework_id: Number.parseInt(homeworkId),
          question_id: Number.parseInt(currentQuestion.id),
          answer: answerText,
          file_url: "", // Writing questions don't have file uploads
        };

        console.log("Calling saveScoreManual for writing:", requestData);
        const response = await saveScoreManual(requestData);
        console.log("Save score response for writing:", response);

        // For manual scoring, we consider it successful if the API call succeeds
        // The actual scoring will be done by teachers later
        const isSuccess = response.code === 200;
        setFeedbackState(isSuccess ? "correct" : "incorrect");
        setShowFeedback(true);

        if (isSuccess) {
          handleCorrectAnswer();
        } else {
          setTimeout(() => {
            setShowFeedback(false);
            setFeedbackState("initial");
          }, 5000);
        }
        return;
      } else if (currentQuestion.type === "speaking") {
        // Cho phép gửi API kể cả khi user chưa ghi âm (khi bấm Bỏ qua)
        const fileUrl =
          userAnswer.fileUrl && userAnswer.fileUrl.trim().length > 0
            ? userAnswer.fileUrl
            : "";
        const requestData: SaveScoreManualRequest = {
          homework_id: Number.parseInt(homeworkId),
          question_id: Number.parseInt(currentQuestion.id),
          answer: "", // Speaking questions don't have text answers
          file_url: fileUrl,
        };

        console.log("Calling saveScoreManual for speaking:", requestData);
        const response = await saveScoreManual(requestData);
        console.log("Save score response for speaking:", response);

        // For manual scoring, we consider it successful if the API call succeeds
        // The actual scoring will be done by teachers later
        const isSuccess = response.code === 200;
        setFeedbackState(isSuccess ? "correct" : "incorrect");
        setShowFeedback(true);

        if (isSuccess) {
          handleCorrectAnswer();
        } else {
          setTimeout(() => {
            setShowFeedback(false);
            setFeedbackState("initial");
          }, 5000);
        }
        return;
      } else {
        console.log("Question type not supported yet:", currentQuestion.type);
        setFeedbackState("correct");
        setShowFeedback(true);

        handleCorrectAnswer();
      }
    } catch (error) {
      console.error("Error checking answer:", error);
      setFeedbackState("incorrect");
      setShowFeedback(true);

      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackState("initial");
      }, 5000);
    } finally {
      setIsCheckingAnswer(false);
    }
  }, [
    currentQuestion,
    answers,
    homeworkId,
    currentQuestionIndex,
    questions.length,
    handleNext,
    isCheckingAnswer,
    addCompletedQuestion,
    router,
    user,
    searchParams,
  ]);

  const getBottomBackgroundColor = () => {
    switch (feedbackState) {
      case "correct":
        return "#22C55E";
      case "incorrect":
        return "#EF4444";
      default:
        return "#C3EBFC66";
    }
  };

  const getFeedbackTextColor = () => {
    switch (feedbackState) {
      case "incorrect":
        return "#fff"; // chữ trắng khi sai
      default:
        return "#222"; // mặc định
    }
  };

  const getRobotImage = () => {
    switch (feedbackState) {
      case "correct":
        return "/images/robot-sparkle.png";
      case "incorrect":
        return "/images/robot-sad.png";
      default:
        return "/images/robot-question.png";
    }
  };

  const getFeedbackMessage = () => {
    if (feedbackState === "initial") {
      return (
        currentQuestion?.metadata?.instructions ||
        "Question 1: Look, read and choose the correct answers!"
      );
    }

    return feedbackState === "correct"
      ? "Chính xác! Làm tốt lắm!"
      : "Ồ! Thử lại lần nữa nhé!";
  };

  // Mapping đáp án đúng cho 7 dạng và đáp án học sinh đã làm cho 2 dạng
  const getCorrectAnswer = (questionId: string) => {
    if (!homeworkAnswers || !homeworkAnswers.questions) return null;
    const q = homeworkAnswers.questions.find(
      (q: any) => String(q.id) === String(questionId)
    );
    return q?.correct_answers || null;
  };
  const getStudentManualAnswer = (questionId: string) => {
    if (!homeworkAnswers || !homeworkAnswers.manual_answers) return null;
    const ans = homeworkAnswers.manual_answers.find(
      (a: any) => String(a.id) === String(questionId)
    );
    return ans || null;
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;
    const userAnswer = answers[currentQuestion.id] || {};
    // Lấy đáp án đúng cho 7 dạng auto-chấm, chỉ truyền nếu là câu đã làm
    const correctAnswer = isDone ? getCorrectAnswer(currentQuestion.id) : null;
    // Lấy đáp án học sinh đã làm cho Speaking/Writing
    const studentManualAnswer = getStudentManualAnswer(currentQuestion.id);
    // Tạo object studentAnswer cho Speaking/Writing
    const studentAnswer = studentManualAnswer
      ? {
          answer: studentManualAnswer.answer,
          fileUrl: studentManualAnswer.file_url,
        }
      : null;
    const commonProps = {
      question: currentQuestion,
      isSubmitted,
    };
    switch (currentQuestion.type) {
      case "multiple_choice":
        return (
          <MultipleChoiceQuestion
            {...commonProps}
            selectedAnswerIds={userAnswer.selectedIds || []}
            onAnswerSelect={(selectedIds) => {
              handleAnswerUpdate({
                ...userAnswer,
                selectedIds,
                isAnswered: selectedIds.length > 0,
              });
            }}
            correctAnswer={correctAnswer}
          />
        );
      case "fill_in_blanks":
        return (
          <FillInBlankQuestion
            {...commonProps}
            onAnswerUpdate={handleAnswerUpdate}
            userAnswers={userAnswer}
            correctAnswer={correctAnswer}
          />
        );
      case "drag_drop":
        return (
          <DragDropQuestion
            {...commonProps}
            userAnswer={userAnswer}
            onAnswerUpdate={handleAnswerUpdate}
            correctAnswer={correctAnswer}
          />
        );
      case "ordering":
        return (
          <OrderingQuestion
            {...commonProps}
            userAnswer={userAnswer}
            onAnswerUpdate={handleAnswerUpdate}
            onFeedback={() => {}}
            correctAnswer={correctAnswer}
          />
        );
      case "matching":
        return (
          <MatchingQuestion
            {...commonProps}
            userAnswer={userAnswer}
            onAnswerUpdate={handleAnswerUpdate}
            correctAnswer={
              correctAnswer ? { matches: correctAnswer.list } : null
            }
          />
        );
      case "writing":
        return (
          <WritingQuestion
            {...commonProps}
            userAnswer={userAnswer}
            onAnswerUpdate={handleAnswerUpdate}
            studentAnswer={studentAnswer}
          />
        );
      case "speaking":
        return (
          <SpeakingQuestion
            {...commonProps}
            userAnswer={userAnswer}
            onAnswerUpdate={handleAnswerUpdate}
            uploadFile={handleUploadFile}
            studentAnswer={studentAnswer}
          />
        );
      case "category":
        return (
          <CategoryQuestion
            {...commonProps}
            userAnswer={userAnswer}
            onAnswerUpdate={handleAnswerUpdate}
            correctAnswer={correctAnswer}
          />
        );
      case "labeling":
        return (
          <LabelingQuestion
            {...commonProps}
            userAnswer={userAnswer}
            onAnswerUpdate={handleAnswerUpdate}
            correctAnswer={correctAnswer}
          />
        );
      default:
        return <div>Unsupported question type: {currentQuestion.type}</div>;
    }
  };

  // Kiểm tra xem có thể check được không
  const canCheck = () => {
    const userAnswer = answers[currentQuestion?.id];
    if (!userAnswer) return false;

    if (currentQuestion?.type === "multiple_choice") {
      return (
        Array.isArray(userAnswer.selectedIds) &&
        userAnswer.selectedIds.length > 0
      );
    } else if (currentQuestion?.type === "fill_in_blanks") {
      return (
        userAnswer.isAnswered &&
        userAnswer.answers?.some((answer: any) => answer.text.trim() !== "")
      );
    } else if (currentQuestion?.type === "ordering") {
      return Array.isArray(userAnswer.order) && userAnswer.order.length > 0;
    } else if (currentQuestion?.type === "drag_drop") {
      const placements = userAnswer.placements || {};
      const text = currentQuestion.content.text || "";
      const numBlanks = (text.match(/\[blank\]/g) || []).length;
      const filled = Object.values(placements).filter(
        (v) => v && v !== ""
      ).length;
      return filled === numBlanks;
    } else if (currentQuestion?.type === "matching") {
      // Require all left items to be matched
      const leftItems = currentQuestion.options.sources || [];
      return (
        userAnswer.isAnswered &&
        Object.keys(userAnswer.matches || {}).length === leftItems.length
      );
    } else if (currentQuestion?.type === "category") {
      // Require at least one item assigned to a category
      return (
        userAnswer.isAnswered &&
        Object.values(userAnswer.connections || {}).some(
          (arr: any) => Array.isArray(arr) && arr.length > 0
        )
      );
    } else if (currentQuestion?.type === "labeling") {
      return (
        userAnswer.isAnswered &&
        Object.keys(userAnswer.placements || {}).length > 0
      );
    } else if (currentQuestion?.type === "writing") {
      return (
        userAnswer.isAnswered === true &&
        userAnswer.text &&
        userAnswer.text.trim().length > 0
      );
    } else if (currentQuestion?.type === "speaking") {
      return (
        userAnswer.isAnswered === true &&
        userAnswer.fileUrl &&
        userAnswer.fileUrl.trim().length > 0
      );
    }
    return false;
  };

  // Hiển thị nút Nộp bài khi ở câu cuối hoặc khi user muốn nộp bài
  const shouldShowSubmitButton = () => {
    // Luôn hiển thị nút nộp bài khi ở câu cuối
    return currentQuestionIndex === questions.length - 1;
  };

  return (
    <div>
      <HomeworkSubmissionPage
        questions={questions}
        currentQuestionIndex={currentQuestionIndex}
        answers={answers}
        isSubmitted={isSubmitted}
        isLoading={isLoading}
        feedbackState={feedbackState}
        showFeedback={showFeedback}
        isCheckingAnswer={isCheckingAnswer}
        onAnswerUpdate={handleAnswerUpdate}
        onNext={handleNext}
        onBack={handleBack}
        onCheck={handleCheck}
        onSkip={handleCheck}
        renderQuestion={renderQuestion}
        canCheck={canCheck}
        canSkip={canSkip}
        getBottomBackgroundColor={getBottomBackgroundColor}
        getRobotImage={getRobotImage}
        getFeedbackMessage={getFeedbackMessage}
        getFeedbackTextColor={getFeedbackTextColor}
        maxViewedQuestionIndex={maxViewedQuestionIndex}
        homeworkName={homeworkName}
        lastQuestionIdCompleted={lastQuestionIdCompleted}
        completedQuestions={completedQuestions}
        onFinishHomework={
          shouldShowSubmitButton() ? handleFinishHomework : undefined
        }
        isSubmitButtonEnabled={showSubmitButton}
      />

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Xác nhận nộp bài
              </h3>
              <p className="text-gray-600 mb-6">
                Bạn có chắc chắn muốn nộp bài không?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelSubmit}
                  className="flex-1 bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-all hover:bg-gray-600"
                >
                  Không
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-all hover:bg-green-700"
                >
                  Có
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
