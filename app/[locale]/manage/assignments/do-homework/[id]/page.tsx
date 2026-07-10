"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Send, ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
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
  skipHomeworkQuestion,
  submitHomeworkFinal,
  type SubmitHomeworkRequest,
  checkSubmitHomework,
  type CheckSubmitHomeworkResponse,
} from "@/lib/api/homeworks";
import { getHomeworkAnswersByStudent } from "@/lib/api/exam-answers";
import HomeworkSubmissionPage from "../../components/homework-submission-page";
import {
  resultHomeworkRoute,
  resultHomeworkStudentRoute,
} from "@/lib/utils/route-utils";
import { useAuth } from "@/lib/context/auth-context";
import { useTypedTranslations } from "@/lib/i18n/client";
import MobileOrientationGuard from "@/components/MobileOrientationGuard";

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
import { HomeworkWriteQuestion } from "../../components/questions/homework-write-question";

// Import sound effects for correct/wrong answers
import { AudioEffects } from "@/lib/utils/audio-utils";
import { toast } from "sonner";

type FeedbackState = "initial" | "correct" | "incorrect";

export default function HomeworkPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTypedTranslations("homework");
  const homeworkId = params.id as string;
  const [homeworkName, setHomeworkName] = useState<string>(
    searchParams.get("name") || ""
  );
  const [lessonId, setLessonId] = useState<string | null>(
    searchParams.get("lessonId")
  );
  const [weekParam, setWeekParam] = useState<string | null>(
    searchParams.get("week")
  );
  const [courseIdParam, setCourseIdParam] = useState<string | null>(
    searchParams.get("courseId")
  );

  // Log lessonId, week và courseId để debug
  useEffect(() => {
  }, [lessonId, weekParam, courseIdParam]);

  // State management
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackState, setFeedbackState] = useState<FeedbackState>("initial");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
  // Celebration image shown when user gets correct on first check for certain types
  const [celebrateImg, setCelebrateImg] = useState<string | null>(null);
  const [showCelebrate, setShowCelebrate] = useState(false);
  // Track consecutive correct answers (excluding writing/speaking) and streak unlocks
  const [consecutiveCorrectCount, setConsecutiveCorrectCount] = useState(0);
  const [showFourRow, setShowFourRow] = useState(false);
  const [rowBadgeImage, setRowBadgeImage] = useState<string | null>(null);
  // Track celebration image index for sequential display
  const [celebrationIndex, setCelebrationIndex] = useState(0);

  // Show a celebration image in the center of the screen (sequential order)
  const showCelebrateRandom = useCallback(() => {
    const imgs = [
      "/images/awesome.png",
      "/images/perfect.png",
      "/images/fabulous.png",
      "/images/nicework.png",
    ];
    const audios = [
      "/images/awesome.wav",
      "/images/perfect.wav",
      "/images/fabulous.wav",
      "/images/nicework.wav",
    ];

    // Use sequential index instead of random
    const idx = celebrationIndex;
    const pick = imgs[idx];
    const audioPick = audios[idx];

    // Increment index and reset to 0 when reaching 4
    setCelebrationIndex((prev) => (prev + 1) % 4);

    setCelebrateImg(pick);
    setShowCelebrate(true);

    // Play corresponding audio
    if (audioPick) {
      const audio = new Audio(audioPick);
      audio.volume = 0.7; // Set volume to 70%
      audio.play().catch((error) => {
        console.error("Error playing celebration audio:", error);
      });
    }

    // Hide after animation duration
    setTimeout(() => {
      setShowCelebrate(false);
      // clear src after fade-out to remove DOM image
      setTimeout(() => setCelebrateImg(null), 400);
    }, 1600);
  }, [celebrationIndex]);
  const [maxViewedQuestionIndex, setMaxViewedQuestionIndex] = useState(0);
  const [lastQuestionIdCompleted, setLastQuestionIdCompleted] =
    useState<number>(0);
  const [homeworkDetail, setHomeworkDetail] = useState<any>(null);
  // State để lưu uploaded files cho write form
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{
      id?: string;
      type: string;
      url: string;
      name?: string;
      isUploading?: boolean;
      uploadProgress?: number;
    }>
  >([]);
  // State cho sidebar trong write form
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
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
  const [pendingSkipInfo, setPendingSkipInfo] = useState<{
    skippedCount: number;
    skippedQuestionIds: Array<number | string>;
    notCompletedCount: number;
  } | null>(null);
  // State để lưu thông báo lỗi từ API
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);
  // State để lưu thông báo lỗi khi check answer
  const [checkAnswerError, setCheckAnswerError] = useState<string | null>(null);
  // State để lưu danh sách câu bị bỏ qua từ API
  const [skippedQuestionIds, setSkippedQuestionIds] = useState<Set<string>>(
    new Set()
  );
  const [pendingCompletedQuestionIds, setPendingCompletedQuestionIds] =
    useState<Set<number>>(new Set());
  // State để lưu đáp án đã check lần cuối cho mỗi câu hỏi
  const [lastCheckedAnswers, setLastCheckedAnswers] = useState<
    Record<string, any>
  >({});

  const buildCompletionMap = useCallback((answerQuestions?: any[]) => {
    const completionMap = new Map<string, boolean>();

    if (Array.isArray(answerQuestions)) {
      answerQuestions.forEach((item) => {
        if (item?.id != null) {
          completionMap.set(String(item.id), item.is_completed === true);
        }
      });
    }

    return completionMap;
  }, []);

  const applyCompletionMapToQuestions = useCallback(
    (completionMap: Map<string, boolean>) => {
      if (completionMap.size === 0) return;

      setQuestions((prevQuestions) => {
        let hasChanges = false;

        const updatedQuestions = prevQuestions.map((question) => {
          const questionId = String(question.id);

          if (!completionMap.has(questionId)) {
            return question;
          }

          const shouldBeCompleted = completionMap.get(questionId) ?? false;

          if (!!question.is_completed !== shouldBeCompleted) {
            hasChanges = true;
            return { ...question, is_completed: shouldBeCompleted };
          }

          return question;
        });

        return hasChanges ? updatedQuestions : prevQuestions;
      });
    },
    []
  );

  const markQuestionAsCompleted = useCallback((questionId: number) => {
    setQuestions((prevQuestions) => {
      let hasChanges = false;

      const updatedQuestions = prevQuestions.map((question) => {
        if (String(question.id) === String(questionId)) {
          if (!question.is_completed) {
            hasChanges = true;
            return { ...question, is_completed: true };
          }
        }
        return question;
      });

      return hasChanges ? updatedQuestions : prevQuestions;
    });
  }, []);

  const queueQuestionCompletion = useCallback((questionId: number) => {
    if (Number.isNaN(questionId)) return;
    setPendingCompletedQuestionIds((prev) => {
      if (prev.has(questionId)) return prev;
      const nextSet = new Set(prev);
      nextSet.add(questionId);
      return nextSet;
    });
  }, []);

  const flushPendingCompletion = useCallback(
    (questionId: number | null | undefined) => {
      if (questionId == null || Number.isNaN(questionId)) return;
      setPendingCompletedQuestionIds((prev) => {
        if (!prev.has(questionId)) return prev;
        const nextSet = new Set(prev);
        nextSet.delete(questionId);
        markQuestionAsCompleted(questionId);
        return nextSet;
      });
    },
    [markQuestionAsCompleted]
  );

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset";
    };
  }, []);

  // Detect mobile device cho write form
  useEffect(() => {
    const checkDevice = () => {
      const isMobileDevice =
        typeof navigator !== "undefined"
          ? /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
              navigator.userAgent
            )
          : false;
      const isMobileScreen =
        typeof window !== "undefined" ? window.innerWidth <= 768 : false;
      setIsMobile(isMobileDevice || isMobileScreen);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  // Load questions data, homework detail và homework answers
  useEffect(() => {
    const loadQuestionsAndHomework = async () => {
      try {
        setIsLoading(true);
        setIsAnswersLoading(true);

        // Load homework detail trước để kiểm tra question_form
        const homeworkDetail = await GetHomeworkDetail(homeworkId);
        setHomeworkDetail(homeworkDetail);

        // Nếu question_form === "write", chỉ cần GetHomeworkDetail, không gọi getQuestions
        if (homeworkDetail?.question_form === "write") {
          // Chỉ set questions rỗng và không load answers
          setQuestions([]);
          setHomeworkAnswers(null);
          setIsAnswersLoading(false);
        } else {
          // Load cả questions và answers song song cho question_form === "question"
          const [questionsResponse, answersResData] = await Promise.all([
            getQuestions({
              homework_id: Number(homeworkId),
            }),
            getHomeworkAnswersByStudent({
              homework_id: Number(homeworkId),
              lesson_id: Number(lessonId),
            }),
          ]);
          const questionsData = questionsResponse.questions || [];
          const answersData = answersResData?.data || null;
          const completionMap = buildCompletionMap(answersData?.questions);

          const questionsWithCompletion = questionsData.map((question: any) => {
            const questionId = String(question.id);
            return {
              ...question,
              is_completed:
                completionMap.get(questionId) ?? question.is_completed ?? false,
            };
          });

          setQuestions(questionsWithCompletion);
          setHomeworkAnswers(answersData);
          setIsAnswersLoading(false);

          // Logic cũ cho question form
          const skippedIds = answersResData?.data?.skipped_question_ids || [];
          const skippedSet = new Set<string>(
            skippedIds.map((id: any) => String(id))
          );
          setSkippedQuestionIds(skippedSet);

          // Use last_question_id_completed from API instead of localStorage
          const lastQuestionIdCompleted =
            homeworkDetail.last_question_id_completed;

          // Lưu lastQuestionIdCompleted vào state
          setLastQuestionIdCompleted(lastQuestionIdCompleted || 0);

          if (questionsData && questionsData.length > 0) {
            if (lastQuestionIdCompleted && lastQuestionIdCompleted !== 0) {
              const idx = questionsData.findIndex(
                (q: any) => String(q.id) === String(lastQuestionIdCompleted)
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
        }

        // Set homework name from API (fallback to URL param if missing)
        setHomeworkName(
          (homeworkDetail && (homeworkDetail as any).name) ||
            searchParams.get("name") ||
            ""
        );
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
  }, [homeworkId, buildCompletionMap]);

  const currentQuestion = questions[currentQuestionIndex];
  const previousQuestionIdRef = useRef<number | null>(null);

  const completedQuestionIds = useMemo(() => {
    if (!Array.isArray(questions) || questions.length === 0) {
      return new Set<number>();
    }

    return new Set(
      questions
        .filter((question) => question?.is_completed)
        .map((question) => {
          const id = Number(question.id);
          return Number.isNaN(id) ? null : id;
        })
        .filter((id): id is number => id !== null)
    );
  }, [questions]);

  // Câu được coi là đã làm nếu backend đánh dấu hoàn thành
  const isDone = currentQuestion?.is_completed ? true : false;

  useEffect(() => {
    const currentId = currentQuestion?.id
      ? Number(currentQuestion.id)
      : undefined;

    // Khi chuyển câu hỏi, hoàn tất trạng thái các câu đã chờ
    if (
      previousQuestionIdRef.current != null &&
      previousQuestionIdRef.current !== currentId
    ) {
      flushPendingCompletion(previousQuestionIdRef.current);
    }

    previousQuestionIdRef.current = currentId ?? null;
  }, [currentQuestion?.id, flushPendingCompletion]);

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

  const handleFinishHomework = useCallback(async () => {
    // Reset error message
    setApiErrorMessage(null);

    // Nếu là write form, logic popup khác với question form
    if (homeworkDetail?.question_form === "write") {
      if (!lessonId) {
        setApiErrorMessage("Lesson ID là bắt buộc");
        setShowConfirmDialog(true);
        return;
      }
      // Hiển thị popup xác nhận (nút Submit đã bị disable khi file = 0)
      setApiErrorMessage(null);
      setPendingSkipInfo({
        skippedCount: 0,
        skippedQuestionIds: [],
        notCompletedCount: 0,
      });
      setShowConfirmDialog(true);
      return;
    }

    // Logic cũ cho question form
    // Trước khi hiện popup, gọi API check-submit để biết còn bao nhiêu câu bỏ qua
    try {
      if (!lessonId) {
        setPendingSkipInfo({
          skippedCount: 0,
          skippedQuestionIds: [],
          notCompletedCount: 0,
        });
        setShowConfirmDialog(true);
        return;
      }

      const check = await checkSubmitHomework(
        Number(homeworkId),
        Number(lessonId)
      );
      const skippedCount = Number(check?.data?.skipped_count || 0);
      const skippedQuestionIds = (check?.data?.skipped_question_ids ||
        []) as Array<number | string>;

      // Sử dụng not_completed_count từ API (đã bao gồm cả câu skip)
      const notCompletedCount = Number(check?.data?.not_completed_count || 0);

      setPendingSkipInfo({
        skippedCount,
        skippedQuestionIds,
        notCompletedCount,
      });
    } catch (e: any) {
      console.error("checkSubmitHomework failed:", e);

      // Lấy thông báo lỗi từ response
      let errorMessage = "Có lỗi xảy ra khi kiểm tra bài tập";
      if (e?.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e?.message) {
        errorMessage = e.message;
      }

      setApiErrorMessage(errorMessage);
      setPendingSkipInfo({
        skippedCount: 0,
        skippedQuestionIds: [],
        notCompletedCount: 0,
      });
    }
    setShowConfirmDialog(true);
  }, [homeworkId, lessonId, homeworkDetail, uploadedFiles]);

  const handleConfirmSubmit = useCallback(async () => {
    // Đóng popup và nộp bài
    setShowConfirmDialog(false);
    setPendingSkipInfo(null);

    if (!lessonId) {
      console.error("Lesson ID is required for submitting homework");
      return;
    }

    try {
      const req: SubmitHomeworkRequest = {
        homework_id: Number(homeworkId),
        lesson_id: Number(lessonId),
      };

      // Nếu là write form, thêm files vào request
      if (homeworkDetail?.question_form === "write") {
        // Chỉ lấy các file đã upload thành công (có url và không đang upload)
        const validFiles = uploadedFiles.filter(
          (file) => file.url && !file.isUploading && file.url.trim() !== ""
        );
        req.files = validFiles.map((file) => ({
          type: file.type || "other",
          url: file.url,
        }));

        // Validate: đảm bảo có ít nhất 1 file
        if (req.files.length === 0) {
          console.error("No valid files to submit!");
          setApiErrorMessage(
            "Không có file hợp lệ để nộp bài. Vui lòng kiểm tra lại các file đã upload."
          );
          setShowConfirmDialog(true);
          return;
        }
      }

      const resp = await submitHomeworkFinal(req);
      const ratio =
        typeof resp?.data?.ratio === "number" ? resp.data.ratio : undefined;
      const star = resp?.data?.star;
      const exp = resp?.data?.exp;
      const totalStar = resp?.data?.total_star;
      const totalExp = resp?.data?.total_exp;
      const completionRate = resp?.data?.completion_rate;
      const hasManualScoring = resp?.data?.has_manual_scoring === true;

      // Lưu ratio vào localStorage thay vì URL params để bảo mật
      if (ratio != null) {
        localStorage.setItem(`homework_${homeworkId}_ratio`, ratio.toString());
      }

      if (star != null) {
        localStorage.setItem(`homework_${homeworkId}_star`, star.toString());
      }

      if (exp != null) {
        localStorage.setItem(`homework_${homeworkId}_exp`, exp.toString());
      }

      if (totalStar != null) {
        localStorage.setItem(`homework_${homeworkId}_total_star`, totalStar.toString());
      }

      if (totalExp != null) {
        localStorage.setItem(`homework_${homeworkId}_total_exp`, totalExp.toString());
      }

      if (completionRate != null) {
        localStorage.setItem(`homework_${homeworkId}_completion_rate`, completionRate.toString());
      }

      if (user?.type === "student") {
        const from = searchParams.get("from") || undefined;
        const courseId =
          courseIdParam || searchParams.get("courseId") || undefined;
        const lessonIdParam = lessonId || undefined;
        const url = resultHomeworkStudentRoute(
          user,
          homeworkId,
          from,
          courseId,
          lessonIdParam
        );
        let finalUrl = url;
        if (hasManualScoring) {
          finalUrl += `&has_manual_scoring=true`;
        }
        if (weekParam) {
          finalUrl += `&week=${weekParam}`;
        }
        if (courseId) {
          finalUrl += `&courseId=${courseId}`;
        }
        router.push(finalUrl);
      } else {
        const url = resultHomeworkRoute(user, homeworkId);
        let finalUrl = url;
        if (hasManualScoring) {
          const separator = url.includes("?") ? "&" : "?";
          finalUrl += `${separator}has_manual_scoring=true`;
        }
        if (weekParam) {
          const separator = finalUrl.includes("?") ? "&" : "?";
          finalUrl += `${separator}week=${weekParam}`;
        }
        if (lessonId) {
          const separator = finalUrl.includes("?") ? "&" : "?";
          finalUrl += `${separator}lessonId=${lessonId}`;
        }
        if (courseIdParam) {
          const separator = finalUrl.includes("?") ? "&" : "?";
          finalUrl += `${separator}courseId=${courseIdParam}`;
        }
        router.push(finalUrl);
      }
      return;
    } catch (e) {
      console.error("Submit homework failed:", e);
      // vẫn điều hướng để không chặn luồng người dùng
    }

    if (user?.type === "student") {
      const from = searchParams.get("from") || undefined;
      const courseId =
        courseIdParam || searchParams.get("courseId") || undefined;
      const lessonIdParam = lessonId || undefined;
      let resultUrl = resultHomeworkStudentRoute(
        user,
        homeworkId,
        from,
        courseId,
        lessonIdParam
      );

      if (weekParam) {
        resultUrl += `${resultUrl.includes("?") ? "&" : "?"}week=${weekParam}`;
      }

      if (courseId) {
        resultUrl += `${
          resultUrl.includes("?") ? "&" : "?"
        }courseId=${courseId}`;
      }

      router.push(resultUrl);
    } else {
      let resultUrl = resultHomeworkRoute(user, homeworkId);

      if (weekParam) {
        resultUrl += `${resultUrl.includes("?") ? "&" : "?"}week=${weekParam}`;
      }

      if (lessonId) {
        resultUrl += `${
          resultUrl.includes("?") ? "&" : "?"
        }lessonId=${lessonId}`;
      }

      if (courseIdParam) {
        resultUrl += `${
          resultUrl.includes("?") ? "&" : "?"
        }courseId=${courseIdParam}`;
      }

      router.push(resultUrl);
    }
  }, [
    router,
    homeworkId,
    user,
    searchParams,
    lessonId,
    weekParam,
    courseIdParam,
    homeworkDetail,
    uploadedFiles,
  ]);

  const handleCancelSubmit = useCallback(() => {
    // Đóng popup, không nộp bài
    setShowConfirmDialog(false);
    setApiErrorMessage(null);

    // Nếu còn câu bị skip hoặc chưa hoàn thành, chuyển đến câu đầu tiên trong danh sách
    if (pendingSkipInfo && pendingSkipInfo.skippedQuestionIds?.length > 0) {
      const targetId = pendingSkipInfo.skippedQuestionIds[0];
      const idx = questions.findIndex((q) => String(q.id) === String(targetId));
      if (idx >= 0) {
        setCurrentQuestionIndex(idx);
        setFeedbackState("initial");
        setShowFeedback(false);
      }
    } else if (pendingSkipInfo && pendingSkipInfo.notCompletedCount === 0) {
      // Nếu đã làm hết câu hỏi, chuyển về câu đầu tiên để review
      setCurrentQuestionIndex(0);
      setFeedbackState("initial");
      setShowFeedback(false);
    }

    setPendingSkipInfo(null);
  }, [pendingSkipInfo, questions]);

  const handleAnswerUpdate = useCallback(
    (answer: any) => {
      const key = answer?.questionId ?? currentQuestion?.id;
      if (!key) return;
      setAnswers((prev) => ({
        ...prev,
        [key]: answer,
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

  const handleSkip = useCallback(async () => {
    if (!currentQuestion || !canSkip() || !lessonId) return;

    try {
      await skipHomeworkQuestion({
        homework_id: Number(homeworkId),
        lesson_id: Number(lessonId),
        question_id: Number(currentQuestion.id),
      });
    } catch (error) {
      console.error("Error calling skip question API:", error);
    }

    const questionId = currentQuestion.id.toString();
    setSkippableQuestions((prev) => new Set([...prev, questionId]));

    if (currentQuestionIndex === questions.length - 1) {
      if (user?.type === "student") {
        const from = searchParams.get("from") || undefined;
        const courseId = searchParams.get("courseId") || undefined;
        const lessonIdParam = lessonId || undefined;
        router.push(
          resultHomeworkStudentRoute(
            user,
            homeworkId,
            from,
            courseId,
            lessonIdParam
          )
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
    currentQuestionIndex,
    questions.length,
    router,
    homeworkId,
    handleNext,
    user,
    searchParams,
    lessonId,
  ]);

  // Function to upload file for speaking questions
  const handleUploadFile = useCallback(async (file: File) => {
    try {
      const response = await uploadFile(file, "homework-audio");
      return response;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Lỗi", {
        description: "Tải file ghi âm lỗi, vui lòng thử ghi âm lại!"
      })
      throw error;
    }
  }, []);

  // Function to refresh homework answers from API
  const refreshHomeworkAnswers = useCallback(async () => {
    try {
      const answersRes = await getHomeworkAnswersByStudent({
        homework_id: Number(homeworkId),
        lesson_id: Number(lessonId),
      });
      setHomeworkAnswers(answersRes.data);
      const completionMap = buildCompletionMap(answersRes?.data?.questions);
      applyCompletionMapToQuestions(completionMap);
    } catch (error) {
      console.error("Error refreshing homework answers:", error);
      // Không throw error để không làm gián đoạn luồng người dùng
    }
  }, [homeworkId, applyCompletionMapToQuestions, buildCompletionMap]);

  const handleCheck = useCallback(async () => {
    if (!currentQuestion || isCheckingAnswer || !lessonId) return;

    const userAnswer = answers[currentQuestion.id];
    if (!userAnswer) return;

    // Determine if this is the first time the user presses Check for this question
    // (we look at the existing snapshot; do NOT update snapshot until after receiving the check result)
    const wasFirstCheck = !lastCheckedAnswers?.[currentQuestion?.id];

    // Helper to save current answer snapshot as last checked (called after server response)
    const saveCheckedSnapshot = () => {
      try {
        setLastCheckedAnswers((prev) => ({
          ...prev,
          [currentQuestion.id]: JSON.parse(JSON.stringify(userAnswer)), // Deep copy
        }));
      } catch (err) {
        // ignore serialization issues
        console.error("Failed to save lastCheckedAnswers snapshot", err);
      }
    };

    setIsCheckingAnswer(true);

    // Helper function to handle correct answer - check if it's last question and auto-submit
    const handleCorrectAnswer = () => {
      queueQuestionCompletion(Number(currentQuestion.id));

      const isManualType =
        currentQuestion?.type === "speaking" ||
        currentQuestion?.type === "writing";

      // Increase consecutive correct count only for auto-graded types (exclude speaking & writing)
      if (!isManualType) {
        setConsecutiveCorrectCount((prev) => {
          const next = prev + 1;

          // Determine which streak badge (if any) should be shown
          let badgeImage: string | null = null;
          if (next === 4) {
            badgeImage = "/images/4row.png";
          } else if (next === 8) {
            badgeImage = "/images/8row.png";
          } else if (next === 12) {
            badgeImage = "/images/12row.png";
          } else if (next === 16) {
            badgeImage = "/images/16row.png";
          }

          if (badgeImage) {
            setRowBadgeImage(badgeImage);
            // Trigger streak-row celebration (sidebar badge)
            setShowFourRow(true);
            // Auto-hide the small sidebar badge after 6s
            setTimeout(() => setShowFourRow(false), 6000);
          }

          return next;
        });
      }

      // Show celebration only for certain question types when it's the first correct check
      if (
        wasFirstCheck &&
        ["matching", "category", "labeling"].includes(currentQuestion?.type)
      ) {
        showCelebrateRandom();
      }

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
          lesson_id: Number(lessonId),
          question_id: Number.parseInt(currentQuestion.id),
          answer_ids: answerIds.map((id: string | number) => Number(id)),
        };

        const response = await saveScoreMultipleChoice(requestData);

        const isCorrect = response.data.is_correct;
        setFeedbackState(isCorrect ? "correct" : "incorrect");
        setShowFeedback(true);
        // Save snapshot of checked answer so later comparisons know this was checked
        saveCheckedSnapshot();

        // Play audio effect based on answer correctness
        if (isCorrect) {
          AudioEffects.answerCorrect();
          handleCorrectAnswer();
        } else {
          AudioEffects.answerWrong();
          // Reset consecutive correct streak on wrong answer
          setConsecutiveCorrectCount(0);
          setShowFourRow(false);
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
            (ua: any) => ua.correct_position === qa.correct_position.toString()
          );
          const text = userInput ? userInput.text : "";
          // Key là vị trí (correct_position), value là text học sinh nhập
          answersObject[qa.correct_position] = text;
        });

        const requestData: SaveScoreFillInBlankRequest = {
          homework_id: Number.parseInt(homeworkId),
          lesson_id: Number(lessonId),
          question_id: Number.parseInt(currentQuestion.id),
          answers: answersObject,
        };

        const response = await saveScoreFillInBlank(requestData);

        const isCorrect = response.data.is_all_correct;
        setFeedbackState(isCorrect ? "correct" : "incorrect");
        setShowFeedback(true);
        saveCheckedSnapshot();

        // Play audio effect based on answer correctness
        if (isCorrect) {
          AudioEffects.answerCorrect();
          handleCorrectAnswer();
        } else {
          AudioEffects.answerWrong();
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
          lesson_id: Number(lessonId),
          question_id: Number.parseInt(currentQuestion.id),
          answers: answersObject,
        };

        const response = await saveScoreOrderingDragdrop(requestData);

        const isCorrect = response.data.is_all_correct;
        setFeedbackState(isCorrect ? "correct" : "incorrect");
        setShowFeedback(true);
        saveCheckedSnapshot();

        // Play audio effect based on answer correctness
        if (isCorrect) {
          AudioEffects.answerCorrect();
          handleCorrectAnswer();
        } else {
          AudioEffects.answerWrong();
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
          lesson_id: Number(lessonId),
          question_id: Number.parseInt(currentQuestion.id),
          answers: answersObject,
        };
        const response = await saveScoreOrderingDragdrop(requestData);
        const isCorrect = response.data.is_all_correct;
        setFeedbackState(isCorrect ? "correct" : "incorrect");
        setShowFeedback(true);
        saveCheckedSnapshot();
        saveCheckedSnapshot();

        // Play audio effect based on answer correctness
        if (isCorrect) {
          AudioEffects.answerCorrect();
          handleCorrectAnswer();
        } else {
          AudioEffects.answerWrong();
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
          lesson_id: Number(lessonId),
          question_id: Number.parseInt(currentQuestion.id),
          answers: answersObject,
        };
        const response = await saveScoreMatching(requestData);
        const isCorrect = response.data.is_all_correct;
        setFeedbackState(isCorrect ? "correct" : "incorrect");
        setShowFeedback(true);
        saveCheckedSnapshot();

        // Play audio effect based on answer correctness
        if (isCorrect) {
          AudioEffects.answerCorrect();
          handleCorrectAnswer();
        } else {
          AudioEffects.answerWrong();
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
        // Khởi tạo tất cả answers với giá trị 0 (chưa gắn vào category nào)
        const answersObject: Record<number, number> = {};
        const allAnswerIds = (currentQuestion.options?.items || []).map(
          (item: any) => Number(item.id?.toString())
        );
        allAnswerIds.forEach((answerId: number) => {
          answersObject[answerId] = 0;
        });
        // Cập nhật các answers đã được gắn vào category
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
          lesson_id: Number(lessonId),
          question_id: Number.parseInt(currentQuestion.id),
          answers: answersObject,
        };
        const response = await saveScoreCategory(requestData);
        const isCorrect = response.data.is_all_correct;
        setFeedbackState(isCorrect ? "correct" : "incorrect");
        setShowFeedback(true);
        saveCheckedSnapshot();

        // Play audio effect based on answer correctness
        if (isCorrect) {
          AudioEffects.answerCorrect();
          handleCorrectAnswer();
        } else {
          AudioEffects.answerWrong();
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
        if (!userAnswer.isAnswered) return;

        // Đổi answersObject: { blankId: labelId }
        const answersObject: Record<number, number> = {};

        // Lấy tất cả blanks từ question
        const allBlanks = currentQuestion.options.blanks || [];

        // Khởi tạo tất cả blanks với giá trị 0
        allBlanks.forEach((blank: any) => {
          answersObject[Number(blank.id)] = 0;
        });

        // Cập nhật những nhãn đã được kéo vào vị trí
        if (userAnswer.placements) {
          Object.entries(userAnswer.placements).forEach(
            ([blankId, labelId]) => {
              if (blankId && labelId) {
                answersObject[Number(blankId)] = Number(labelId);
              }
            }
          );
        }

        const requestData: SaveScoreLabelingRequest = {
          homework_id: Number.parseInt(homeworkId),
          lesson_id: Number(lessonId),
          question_id: Number.parseInt(currentQuestion.id),
          answers: answersObject,
        };
        const response = await saveScoreLabeling(requestData);
        const isCorrect = response.data.is_all_correct;
        setFeedbackState(isCorrect ? "correct" : "incorrect");
        setShowFeedback(true);
        saveCheckedSnapshot();

        // Play audio effect based on answer correctness
        if (isCorrect) {
          AudioEffects.answerCorrect();
          handleCorrectAnswer();
        } else {
          AudioEffects.answerWrong();
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
          lesson_id: Number(lessonId),
          question_id: Number.parseInt(currentQuestion.id),
          answer: answerText,
          file_url: "", // Writing questions don't have file uploads
        };

        const response = await saveScoreManual(requestData);

        // For manual scoring, we consider it successful if the API call succeeds
        // The actual scoring will be done by teachers later
        const isSuccess = response.code === 200;
        setFeedbackState(isSuccess ? "correct" : "incorrect");
        setShowFeedback(true);

        // Play audio effect based on API success
        if (isSuccess) {
          // Refresh homework answers sau khi lưu thành công
          await refreshHomeworkAnswers();
          AudioEffects.answerCorrect();
          handleCorrectAnswer();
        } else {
          AudioEffects.answerWrong();
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
          lesson_id: Number(lessonId),
          question_id: Number.parseInt(currentQuestion.id),
          answer: "", // Speaking questions don't have text answers
          file_url: fileUrl,
        };

        const response = await saveScoreManual(requestData);

        // For manual scoring, we consider it successful if the API call succeeds
        // The actual scoring will be done by teachers later
        const isSuccess = response.code === 200;
        setFeedbackState(isSuccess ? "correct" : "incorrect");
        setShowFeedback(true);

        // Play audio effect based on API success
        if (isSuccess) {
          // Refresh homework answers sau khi lưu thành công
          await refreshHomeworkAnswers();
          AudioEffects.answerCorrect();
          handleCorrectAnswer();
        } else {
          AudioEffects.answerWrong();
          setTimeout(() => {
            setShowFeedback(false);
            setFeedbackState("initial");
          }, 5000);
        }
        return;
      } else if (homeworkDetail?.question_form === "write") {
        // Xử lý cho trường hợp question_form === "write"
        const uploadedFiles = userAnswer.uploadedFiles || [];

        if (uploadedFiles.length === 0) {
          setIsCheckingAnswer(false);
          setFeedbackState("incorrect");
          setShowFeedback(true);
          AudioEffects.answerWrong();
          setTimeout(() => {
            setShowFeedback(false);
            setFeedbackState("initial");
          }, 3000);
          return;
        }

        // Chuyển đổi uploadedFiles thành file_urls array
        const fileUrls = uploadedFiles
          .map((file: any) => file.url)
          .filter(Boolean);

        const requestData: SaveScoreManualRequest = {
          homework_id: Number.parseInt(homeworkId),
          lesson_id: Number(lessonId),
          question_id: Number.parseInt(currentQuestion.id),
          answer: "", // Không có text answer cho trường hợp này
          file_url: fileUrls.join(","), // Gửi danh sách URL file, phân cách bởi dấu phẩy
        };

        try {
          const response = await saveScoreManual(requestData);

          const isSuccess = response.code === 200;
          setFeedbackState(isSuccess ? "correct" : "incorrect");
          setShowFeedback(true);
          saveCheckedSnapshot();

          if (isSuccess) {
            AudioEffects.answerCorrect();
            handleCorrectAnswer();
          } else {
            AudioEffects.answerWrong();
            setTimeout(() => {
              setShowFeedback(false);
              setFeedbackState("initial");
            }, 5000);
          }
        } catch (error) {
          console.error("Error saving score for write form:", error);
          setFeedbackState("incorrect");
          setShowFeedback(true);
          AudioEffects.answerWrong();
          setTimeout(() => {
            setShowFeedback(false);
            setFeedbackState("initial");
          }, 5000);
        }
        return;
      } else {
        setFeedbackState("correct");
        setShowFeedback(true);
        saveCheckedSnapshot();

        AudioEffects.answerCorrect();
        handleCorrectAnswer();
      }
    } catch (error: any) {
      console.error("Error checking answer:", error);

      // Xử lý lỗi 500 từ API
      if (error?.response?.status === 500 && error?.response?.data?.message) {
        const errorMessage = error.response.data.message;
        setCheckAnswerError(errorMessage);
        // Hiển thị alert với thông báo lỗi
        alert(errorMessage);
      }

      setFeedbackState("incorrect");
      setShowFeedback(true);

      AudioEffects.answerWrong();
      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackState("initial");
        setCheckAnswerError(null); // Reset error message sau khi ẩn feedback
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
    queueQuestionCompletion,
    router,
    user,
    searchParams,
    lessonId,
    homeworkDetail,
    uploadedFiles,
    refreshHomeworkAnswers,
    lastCheckedAnswers,
    showCelebrateRandom,
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
      default:
        return "#fff"; // mặc định
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

    // Với Writing/Speaking/Write form: luôn hiển thị thông điệp giáo viên sẽ chấm
    if (
      currentQuestion?.type === "writing" ||
      currentQuestion?.type === "speaking" ||
      currentQuestion?.type === "write" ||
      homeworkDetail?.question_form === "write"
    ) {
      return "Your teacher will check this soon!";
    }

    return feedbackState === "correct"
      ? "Correct! Great job!"
      : "Oops! Try again!";
  };

  // Reset consecutive streak when feedback becomes incorrect
  useEffect(() => {
    if (feedbackState === "incorrect") {
      setConsecutiveCorrectCount(0);
      setShowFourRow(false);
    }
  }, [feedbackState]);

  // Helper function để format message số lượng
  const formatMessageWithHighlightedNumbers = (message: string) => {
    return message.replace(
      /(\d+)/g,
      '<span class="inline-flex items-center justify-center min-w-[28px] h-7 px-2 mx-1 bg-red-100 text-red-700 font-bold text-lg rounded-full border-2 border-red-300 shadow-sm">$1</span>'
    );
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

    // Check if current question has correct answer
    const hasCorrectAnswer = !!correctAnswer || !!studentAnswer;
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
            key={currentQuestion.id} // Force re-render khi question.id thay đổi
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
      case "write":
        // Kiểm tra nếu question_form === "write", render component mới
        if (homeworkDetail?.question_form === "write") {
          return (
            <HomeworkWriteQuestion
              question={currentQuestion}
              questionFiles={homeworkDetail?.question_files || []}
              userAnswer={userAnswer}
              onAnswerUpdate={handleAnswerUpdate}
              isSubmitted={isSubmitted}
              studentAnswer={studentAnswer}
            />
          );
        }
      // Fall through to default nếu không phải write form
      default:
        // Kiểm tra nếu question_form === "write", render component mới (fallback)
        if (homeworkDetail?.question_form === "write") {
          return (
            <HomeworkWriteQuestion
              question={currentQuestion}
              questionFiles={homeworkDetail?.question_files || []}
              userAnswer={userAnswer}
              onAnswerUpdate={handleAnswerUpdate}
              isSubmitted={isSubmitted}
              studentAnswer={studentAnswer}
            />
          );
        }
        return <div>Unsupported question type: {currentQuestion.type}</div>;
    }
  };

  // Hàm so sánh đáp án hiện tại với đáp án đã check lần cuối
  const hasAnswerChanged = (questionId: string, currentAnswer: any) => {
    const lastChecked = lastCheckedAnswers[questionId];
    if (!lastChecked) return true; // Nếu chưa check lần nào, cho phép check

    // So sánh theo từng loại câu hỏi
    if (currentQuestion?.type === "multiple_choice") {
      const currentIds = JSON.stringify(
        (currentAnswer.selectedIds || []).sort()
      );
      const lastIds = JSON.stringify((lastChecked.selectedIds || []).sort());
      return currentIds !== lastIds;
    } else if (currentQuestion?.type === "fill_in_blanks") {
      const currentAnswers = JSON.stringify(
        (currentAnswer.answers || []).sort((a: any, b: any) =>
          a.correct_position.localeCompare(b.correct_position)
        )
      );
      const lastAnswers = JSON.stringify(
        (lastChecked.answers || []).sort((a: any, b: any) =>
          a.correct_position.localeCompare(b.correct_position)
        )
      );
      return currentAnswers !== lastAnswers;
    } else if (currentQuestion?.type === "ordering") {
      const currentOrder = JSON.stringify(currentAnswer.order || []);
      const lastOrder = JSON.stringify(lastChecked.order || []);
      return currentOrder !== lastOrder;
    } else if (currentQuestion?.type === "drag_drop") {
      const currentPlacements = JSON.stringify(currentAnswer.placements || {});
      const lastPlacements = JSON.stringify(lastChecked.placements || {});
      return currentPlacements !== lastPlacements;
    } else if (currentQuestion?.type === "matching") {
      const currentMatches = JSON.stringify(currentAnswer.matches || {});
      const lastMatches = JSON.stringify(lastChecked.matches || {});
      return currentMatches !== lastMatches;
    } else if (currentQuestion?.type === "category") {
      const currentConnections = JSON.stringify(
        currentAnswer.connections || {}
      );
      const lastConnections = JSON.stringify(lastChecked.connections || {});
      return currentConnections !== lastConnections;
    } else if (currentQuestion?.type === "labeling") {
      const currentPlacements = JSON.stringify(currentAnswer.placements || {});
      const lastPlacements = JSON.stringify(lastChecked.placements || {});
      return currentPlacements !== lastPlacements;
    } else if (currentQuestion?.type === "writing") {
      const currentText = (currentAnswer.text || "").trim();
      const lastText = (lastChecked.text || "").trim();
      return currentText !== lastText;
    } else if (currentQuestion?.type === "speaking") {
      const currentFileUrl = (currentAnswer.fileUrl || "").trim();
      const lastFileUrl = (lastChecked.fileUrl || "").trim();
      return currentFileUrl !== lastFileUrl;
    } else if (
      homeworkDetail?.question_form === "write" ||
      currentQuestion?.type === "write"
    ) {
      const currentFiles = JSON.stringify(
        (currentAnswer.uploadedFiles || []).map((f: any) => f.url).sort()
      );
      const lastFiles = JSON.stringify(
        (lastChecked.uploadedFiles || []).map((f: any) => f.url).sort()
      );
      return currentFiles !== lastFiles;
    }
    return true; // Mặc định cho phép check nếu không xác định được loại
  };

  // Kiểm tra xem có thể check được không
  const canCheck = () => {
    const userAnswer = answers[currentQuestion?.id];
    if (!userAnswer) return false;

    // Kiểm tra xem đáp án đã thay đổi chưa
    const answerChanged = hasAnswerChanged(
      currentQuestion?.id || "",
      userAnswer
    );
    if (!answerChanged) return false; // Không cho phép check nếu đáp án chưa thay đổi

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
      // Cho phép check ngay cả khi có nhãn chưa được kéo vào vị trí
      return userAnswer.isAnswered === true;
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
    } else if (
      homeworkDetail?.question_form === "write" ||
      currentQuestion?.type === "write"
    ) {
      // Kiểm tra nếu đã upload ít nhất 1 file
      return (
        userAnswer.isAnswered === true &&
        Array.isArray(userAnswer.uploadedFiles) &&
        userAnswer.uploadedFiles.length > 0 &&
        userAnswer.uploadedFiles.every(
          (file: any) => file.url && file.url.trim().length > 0
        )
      );
    }
    return false;
  };

  // Hiển thị nút Nộp bài khi ở câu cuối hoặc khi user muốn nộp bài
  const shouldShowSubmitButton = () => {
    // Luôn hiển thị nút nộp bài khi ở câu cuối
    return currentQuestionIndex === questions.length - 1;
  };

  // Callback cho write form - phải được định nghĩa ở top level
  const handleWriteFormAnswerUpdate = useCallback((answer: any) => {
    const newFiles = answer.uploadedFiles || [];
    setUploadedFiles((prev) => {
      // Chỉ update nếu có thay đổi thực sự
      if (
        prev.length !== newFiles.length ||
        prev.some(
          (f, i) => f.url !== newFiles[i]?.url || f.type !== newFiles[i]?.type
        )
      ) {
        // Đảm bảo cấu trúc file đúng: có id, type, url, name, isUploading
        const formattedFiles = newFiles.map((file: any, index: number) => ({
          id: file.id || `file-${index}-${Date.now()}`,
          type: file.type || "other",
          url: file.url || "",
          name: file.name || `File ${index + 1}`,
          isUploading: file.isUploading || false,
          uploadProgress: file.uploadProgress || 0,
        }));
        return formattedFiles;
      }
      return prev;
    });
  }, []);

  // Nếu question_form === "write", render UI riêng hoàn toàn khác
  if (homeworkDetail?.question_form === "write") {
    return (
      <MobileOrientationGuard requireLandscape={true}>
        <div className="fixed inset-0 flex overflow-hidden">
          {/* Main Content Area - UI riêng cho write form */}
          <div
            className={`flex-1 flex flex-col overflow-y-auto min-w-0 transition-all duration-300 ease-in-out 
            ${isSidebarOpen ? (isMobile ? "pr-48" : "pr-80") : ""}
          `}
          >
            {/* Question Content - Hiển thị file từ question_files và upload */}
            <div className="flex-1 overflow-y-auto overflow-x-auto pb-4 md:pb-6 lg:pb-8 px-8 md:px-12 lg:px-16 xl:px-20">
              <div className="max-w-7xl mx-auto w-full min-h-full py-8">
                <HomeworkWriteQuestion
                  question={{
                    id: "write-homework",
                    content: {
                      text: homeworkDetail?.description || "",
                    },
                    metadata: {
                      instructions: homeworkName || "Upload bài làm của bạn",
                    },
                  }}
                  questionFiles={homeworkDetail?.question_files || []}
                  userAnswer={{
                    uploadedFiles,
                    isAnswered: uploadedFiles.length > 0,
                  }}
                  onAnswerUpdate={handleWriteFormAnswerUpdate}
                  isSubmitted={isSubmitted}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div
            className={`fixed right-0 top-0 h-full bg-white shadow-lg transition-transform duration-300 ease-in-out z-[9998]
            ${
              isSidebarOpen
                ? "translate-x-0 visible"
                : "translate-x-full invisible pointer-events-none"
            }
            ${isMobile ? "w-48" : "w-80"}
          `}
          >
            {/* Sidebar Content */}
            <div className="relative z-10 flex flex-col h-full">
              {/* Title Section - Fixed at top - Hidden on mobile */}
              {!isMobile && (
                <div className="flex-shrink-0 p-6 border-b border-gray-200 bg-white z-10">
                  <h1 className="text-xl font-bold text-[#32428D] text-center flex items-center justify-center gap-2">
                    <ClipboardList className="w-4 h-4" />
                    <span>{homeworkName || `Homework`}</span>
                  </h1>
                </div>
              )}

              {/* Scrollable middle area (Circle Progress) */}
              <div className="flex-1 overflow-y-auto px-4 md:px-6 flex flex-col justify-center">
                {/* Circle Progress */}
                <div className={`flex flex-col items-center justify-center`}>
                  <div
                    className={`relative flex items-center justify-center ${
                      isMobile ? "w-24 h-24" : "w-32 h-32 md:w-44 md:h-44"
                    }`}
                    style={{ padding: 8 }}
                  >
                    <svg
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                      width={isMobile ? "96" : "160"}
                      height={isMobile ? "96" : "160"}
                      viewBox={isMobile ? "0 0 96 96" : "0 0 144 144"}
                    >
                      <circle
                        cx={isMobile ? "48" : "72"}
                        cy={isMobile ? "48" : "72"}
                        r={isMobile ? "40" : "64"}
                        fill="none"
                        stroke="#69AAFA"
                        strokeWidth={isMobile ? "3" : "6"}
                        strokeDasharray={2 * Math.PI * (isMobile ? 40 : 64)}
                        strokeDashoffset={
                          2 *
                          Math.PI *
                          (isMobile ? 40 : 64) *
                          (1 - Math.min(uploadedFiles.length / 10, 1)) // Progress based on uploaded files (max 10)
                        }
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 0.5s" }}
                        transform={`rotate(-90 ${
                          isMobile ? "48 48" : "72 72"
                        })`}
                      />
                    </svg>
                    <Image
                      src="/images/ic_progress_do.png"
                      alt="Progress Icon"
                      width={isMobile ? 80 : 144}
                      height={isMobile ? 80 : 144}
                      className="object-contain aspect-square"
                      priority
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className={`text-[#69AAFA] font-bold text-center select-none ${
                          isMobile ? "text-sm" : "text-2xl md:text-3xl"
                        }`}
                      >
                        {uploadedFiles.length}
                      </span>
                    </div>
                  </div>
                  <p
                    className={`text-[#32428D] font-medium mt-2 text-center ${
                      isMobile ? "text-xs" : "text-sm"
                    }`}
                  >
                    Files đã upload
                  </p>
                </div>
              </div>

              {/* Bottom buttons */}
              <div
                className="flex-shrink-0 p-4 md:p-6 border-t border-gray-200 space-y-3"
                style={{
                  paddingBottom: "max(env(safe-area-inset-bottom), 1rem)",
                }}
              >
                <button
                  onClick={handleFinishHomework}
                  disabled={uploadedFiles.length === 0}
                  className={`w-full bg-green-600 text-white font-bold px-6 transition-all hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg inline-flex items-center justify-center gap-2 ${
                    isMobile
                      ? "py-2 text-xs rounded-lg"
                      : "py-3 text-base rounded-2xl"
                  }`}
                >
                  <Send className={isMobile ? `w-3 h-3` : `w-4 h-4`} />
                  Submit
                </button>
              </div>
            </div>
          </div>

          {/* Nút Đóng/Mở Sidebar */}
          <div
            className={`fixed top-1/2 transform -translate-y-1/2 flex items-center transition-all duration-300 ease-in-out gap-x-2 ${
              isSidebarOpen ? (isMobile ? "right-48" : "right-80") : "right-0"
            }`}
            style={{ zIndex: 9999 }}
          >
            {/* Sidebar Toggle Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`h-24 w-6 bg-white text-[#32428D] transition-all duration-300 hover:w-7 shadow-xl flex flex-col items-center justify-center border border-gray-300 rounded-l-lg group ${
                isSidebarOpen ? "opacity-100" : "opacity-60 hover:opacity-100"
              }`}
              title={isSidebarOpen ? "Ẩn sidebar" : "Hiện sidebar"}
            >
              {isSidebarOpen ? (
                <ChevronRight className="h-5 w-5 transition-all duration-300 group-hover:scale-110" />
              ) : (
                <ChevronLeft className="h-5 w-5 transition-all duration-300 group-hover:scale-110" />
              )}
            </button>
          </div>

          {/* Floating Action Panel - Xuất hiện khi sidebar ẩn */}
          {!isSidebarOpen && (
            <div className="fixed bottom-4 right-4 bg-white border border-gray-200 shadow-2xl rounded-xl z-[9998] transition-all duration-300 ease-in-out">
              <div className="flex flex-row gap-2 p-2">
                {/* Submit Button */}
                <button
                  onClick={handleFinishHomework}
                  disabled={uploadedFiles.length === 0}
                  className={`bg-green-600 text-white font-bold transition-all hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg inline-flex items-center justify-center ${
                    isMobile ? "w-10 h-10 rounded-lg" : "w-12 h-12 rounded-xl"
                  }`}
                  title="Nộp bài"
                >
                  <Send className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
                </button>
              </div>
            </div>
          )}

          {/* Floating Progress - Xuất hiện khi sidebar ẩn */}
          {!isSidebarOpen && (
            <div className="fixed top-4 right-4 z-[9998] transition-all duration-300 ease-in-out">
              <div
                className={`bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 ${
                  isMobile ? "p-2 min-w-[80px]" : "p-3 min-w-[120px]"
                }`}
              >
                <div
                  className={`flex items-center justify-center ${
                    isMobile ? "gap-1 mb-1" : "gap-2 mb-2"
                  }`}
                >
                  <div
                    className={`bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center ${
                      isMobile ? "w-4 h-4" : "w-6 h-6"
                    }`}
                  >
                    <span
                      className={`text-white font-bold ${
                        isMobile ? "text-[8px]" : "text-xs"
                      }`}
                    >
                      {uploadedFiles.length}
                    </span>
                  </div>
                  <span
                    className={`text-gray-700 font-medium ${
                      isMobile ? "text-[10px]" : "text-sm"
                    }`}
                  >
                    files
                  </span>
                </div>
                {/* Progress Bar */}
                <div
                  className={`w-full bg-gray-200 rounded-full ${
                    isMobile ? "h-1" : "h-2"
                  }`}
                >
                  <div
                    className={`bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300 ${
                      isMobile ? "h-1" : "h-2"
                    }`}
                    style={{
                      width: `${Math.min(
                        (uploadedFiles.length / 10) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {apiErrorMessage
                    ? "Thông báo"
                    : homeworkDetail?.question_form === "write"
                    ? "Xác nhận nộp bài"
                    : t("confirmSubmissionTitle")}
                </h3>

                {homeworkDetail?.question_form === "write" ? (
                  // Logic riêng cho write form
                  <>
                    <p className="text-gray-600 mb-6">
                      Bạn có chắc chắn nộp bài?
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancelSubmit}
                        className="flex-1 bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-all hover:bg-gray-600"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleConfirmSubmit}
                        className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-all hover:bg-green-700"
                      >
                        Xác nhận
                      </button>
                    </div>
                  </>
                ) : (
                  // Logic cũ cho question form
                  <>
                    {apiErrorMessage ? (
                      <div className="mb-6">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                          <p className="text-sm text-red-800 font-medium">
                            {apiErrorMessage}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600 mb-6">
                        {t("submitConfirmAllDone")}
                      </p>
                    )}
                    <div className="flex gap-3">
                      {apiErrorMessage ? (
                        <button
                          onClick={handleCancelSubmit}
                          className="w-full bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-all hover:bg-gray-600"
                        >
                          Đóng
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleCancelSubmit}
                            className="flex-1 bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-all hover:bg-gray-600"
                          >
                            {t("iWantToReview")}
                          </button>
                          <button
                            onClick={handleConfirmSubmit}
                            className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-all hover:bg-green-700"
                          >
                            {t("yes")}
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </MobileOrientationGuard>
    );
  }

  // Logic và UI ban đầu cho question_form === "question"
  // Calculate hasCorrectAnswer for current question
  // CHỈ áp dụng cho 7 dạng tự động chấm (không bao gồm Speaking và Writing)
  const currentCorrectAnswer = isDone
    ? getCorrectAnswer(currentQuestion?.id)
    : null;
  const currentStudentManualAnswer = getStudentManualAnswer(
    currentQuestion?.id
  );
  const currentStudentAnswer = currentStudentManualAnswer
    ? {
        answer: currentStudentManualAnswer.answer,
        fileUrl: currentStudentManualAnswer.file_url,
      }
    : null;

  // Check if current question is auto-graded (not Speaking or Writing)
  const isAutoGradedQuestion =
    currentQuestion?.type &&
    !["speaking", "writing"].includes(currentQuestion.type);

  const currentQuestionIdNumber = Number(currentQuestion?.id);

  // Only show completed message for 7 auto-graded question types
  const currentHasCorrectAnswer =
    isAutoGradedQuestion &&
    !Number.isNaN(currentQuestionIdNumber) &&
    completedQuestionIds.has(currentQuestionIdNumber);

  return (
    <MobileOrientationGuard requireLandscape={true}>
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
        onSkip={handleSkip}
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
        completedQuestions={completedQuestionIds}
        onFinishHomework={handleFinishHomework}
        isSubmitButtonEnabled={showSubmitButton}
        hasCorrectAnswer={currentHasCorrectAnswer}
        showFourRow={showFourRow}
        rowBadgeImage={rowBadgeImage || undefined}
      />

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {apiErrorMessage ? "Thông báo" : t("confirmSubmissionTitle")}
              </h3>

              {/* Hiển thị thông báo lỗi nếu có */}
              {apiErrorMessage ? (
                <div className="mb-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-800 font-medium">
                          {apiErrorMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p
                  className="text-gray-600 mb-6"
                  dangerouslySetInnerHTML={{
                    __html: (() => {
                      if (
                        !pendingSkipInfo ||
                        pendingSkipInfo.notCompletedCount === 0
                      ) {
                        return t("submitConfirmAllDone");
                      }

                      let message = "";
                      if (pendingSkipInfo.skippedCount > 0) {
                        message = t("submitConfirmWithSkipped", {
                          notCompletedCount: pendingSkipInfo.notCompletedCount,
                          skippedCount: pendingSkipInfo.skippedCount,
                        });
                      } else {
                        message = t("submitConfirmWithoutSkipped", {
                          notCompletedCount: pendingSkipInfo.notCompletedCount,
                        });
                      }

                      return formatMessageWithHighlightedNumbers(message);
                    })(),
                  }}
                />
              )}
              <div className="flex gap-3">
                {apiErrorMessage ? (
                  // Khi có lỗi, chỉ hiển thị nút Đóng
                  <button
                    onClick={handleCancelSubmit}
                    className="w-full bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-all hover:bg-gray-600"
                  >
                    Đóng
                  </button>
                ) : (
                  // Khi không có lỗi, hiển thị cả 2 nút như cũ
                  <>
                    <button
                      onClick={handleCancelSubmit}
                      className="flex-1 bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-all hover:bg-gray-600"
                    >
                      {(() => {
                        if (
                          !pendingSkipInfo ||
                          pendingSkipInfo.notCompletedCount === 0
                        ) {
                          return t("iWantToReview");
                        }
                        return t("redoSkippedQuestions");
                      })()}
                    </button>
                    <button
                      onClick={handleConfirmSubmit}
                      className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-all hover:bg-green-700"
                    >
                      {t("yes")}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Celebration overlay (question form) */}
      {celebrateImg && (
        <div className="fixed inset-0 z-[10002] pointer-events-none flex items-center justify-center">
          <div
            className={`transform transition-all duration-1000 ${
              showCelebrate ? "scale-125 opacity-100" : "scale-75 opacity-0"
            }`}
          >
            <div className="w-[420px] h-[420px] max-w-[85vw] max-h-[85vh] flex items-center justify-center">
              <Image
                src={celebrateImg}
                alt="Great job"
                width={500}
                height={500}
                className="select-none drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </MobileOrientationGuard>
  );
}
