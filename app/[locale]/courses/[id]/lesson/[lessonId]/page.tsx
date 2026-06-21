"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { DashboardHeader } from "@/components/dashboard-header";
import { useState, useEffect } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { useRouter } from "@/lib/i18n/routing";
import Image from "next/image";
import { Link } from "@/lib/i18n/routing";
import { useTranslations } from "next-intl";
import {
  LucideArrowLeft,
  LucideBookOpen,
  LucideClipboard,
  LucideFileCheck,
  LucidePlayCircle,
  LucideChevronLeft,
  LucideChevronRight,
  LucideCheck,
  LucideX,
  LucideVolume2,
  LucideDownload,
  LucideRepeat,
  LucideEye,
  LucideListChecks,
  BookOpen,
  Loader2,
  RotateCcw,
  RefreshCw,
  RotateCw,
  CheckCircle,
  XCircle,
  Volume2,
  BarChart3,
  Play,
  ArrowLeft,
  ArrowRight,
  X,
  Users,
  Clock,
  Target,
  Mic,
} from "lucide-react";
import { GetLessonDetail } from "@/lib/api/lessons";
import { markLessonComplete } from "@/lib/api/students";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import {
  doHomeworkFromDetailLessonRoute,
  reviewResultHomeworkFromDetailLessonStudentRoute,
  doExamFromDetailLessonRoute,
  reviewExamStudentRoute,
  reviewExerciseStudentRoute,
  doExerciseFromDetailLessonRoute,
} from "@/lib/utils/route-utils";
import { useAuth } from "@/lib/context/auth-context";
import axiosInstance from "@/lib/api/axios";
import { SessionCompleteDialog } from "@/components/flashcard/session-complete-dialog";

// Flashcard API functions
const createFlashcardSession = async (lessonId: string, forceNew = false) => {
  const response = await axiosInstance.post(
    `/manage/flashcard/sessions${forceNew ? "?force_new=true" : ""}`,
    {
      lesson_id: parseInt(lessonId),
      session_type: "learning",
    }
  );
  return response.data;
};

const getFlashcardActivities = async (sessionId: number) => {
  const response = await axiosInstance.get(
    `/manage/flashcard/sessions/${sessionId}/activities`
  );
  return response.data;
};

const completeFlashcardSession = async (
  sessionId: number,
  payload: {
    total_time_spent: number;
    words_studied?: number;
    words_known?: number;
    words_learning?: number;
    completion_rate?: number;
  }
) => {
  const response = await axiosInstance.put(
    `/manage/flashcard/sessions/${sessionId}/complete`,
    payload
  );
  return response.data;
};

// Track activity function
const trackActivity = async (
  sessionId: number,
  vocabularyId: number,
  activityType: string,
  responseTime: number = 0,
  isCorrect: boolean = false
) => {
  let response = "";
  if (activityType === "mark_known") response = "known";
  else if (activityType === "mark_unknown") response = "unknown";
  else if (isCorrect) response = "correct";

  const responseData = await axiosInstance.post(
    `/manage/flashcard/sessions/${sessionId}/activities`,
    {
      vocabulary_id: vocabularyId,
      activity_type: activityType,
      response_time: responseTime,
      response,
    }
  );
  return responseData.data;
};

const getVocabularyIdFromItem = (item: any): number | undefined => {
  const id = item?.vocabulary?.id ?? item?.vocabulary_id;
  if (id == null || id === "") return undefined;
  const parsed = Number(id);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const getLessonVocabularies = async (
  lessonId: string,
  page = 1,
  limit = 20
) => {
  const response = await axiosInstance.get(
    `/manage/flashcard/lessons/${lessonId}/vocabularies`,
    {
      params: { page, limit },
    }
  );
  return response.data;
};

export default function LessonDetailPage({
  params,
}: {
  params: { id: string; lessonId: string };
}) {
  const t = useTranslations("lessonDetail");
  const routeParams = useParams();
  const [activeTab, setActiveTab] = useState("lecture");
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [descExpanded, setDescExpanded] = useState(false);
  const toggleDescExpand = () => setDescExpanded((v) => !v);
  const [showConfirm, setShowConfirm] = useState(false);
  const [marking, setMarking] = useState(false);
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get lessonId and courseId from route params, with fallback to props params
  const lessonId = (routeParams?.lessonId as string) || params?.lessonId || "";
  const courseId = (routeParams?.id as string) || params?.id || "";

  // Vocabulary learning states
  const [showVocabLearning, setShowVocabLearning] = useState(false);
  const [currentVocabIndex, setCurrentVocabIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [flashcardSession, setFlashcardSession] = useState<any>(null);
  const [flashcardActivities, setFlashcardActivities] = useState<any[]>([]);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [sessionResults, setSessionResults] = useState<any[]>([]);

  // Track vocabulary knowledge status
  const [vocabKnowledgeStatus, setVocabKnowledgeStatus] = useState<{
    [key: number]: string;
  }>({});
  const [updatingVocabStatus, setUpdatingVocabStatus] = useState(false);

  // Track words studied (viewed)
  const [wordsStudiedCount, setWordsStudiedCount] = useState(0);

  // Completion popup state
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [completionStats, setCompletionStats] = useState<any>(null);

  // Track session timing
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [currentCardStartTime, setCurrentCardStartTime] = useState<number>(0);
  const [flipStartTime, setFlipStartTime] = useState<number>(0);

  // Lesson vocabularies (loaded when entering vocabulary tab)
  const [lessonVocabularies, setLessonVocabularies] = useState<any[]>([]);
  const [loadingVocabularies, setLoadingVocabularies] = useState(false);
  const [vocabulariesLoaded, setVocabulariesLoaded] = useState(false);

  // Simple pronunciation practice states (per vocabulary)
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [recordedAudios, setRecordedAudios] = useState<
    Record<number, string>
  >({});

  // Chỉ hiển thị các bài tập và bài kiểm tra đã được giao (is_assigned = true)
  const assignedHomeworks = Array.isArray(lesson?.homeworks)
    ? lesson.homeworks.filter((hw: any) => Boolean(hw?.is_assigned))
    : [];
  const assignedExams = Array.isArray(lesson?.exams)
    ? lesson.exams.filter((ex: any) => Boolean(ex?.is_assigned))
    : [];
  const assignedExercises = Array.isArray(lesson?.exercises)
    ? lesson.exercises.filter((exercise: any) => Boolean(exercise?.is_assigned))
    : [];

  useEffect(() => {
    if (!lessonId) return;
    const fetchLesson = async () => {
      setLoading(true);
      try {
        const res = await GetLessonDetail(lessonId, courseId);
        setLesson(res.data);
      } catch (e) {
        setLesson(null);
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [lessonId, courseId]);

  // Đồng bộ tab từ query param
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["lecture", "homework", "exercise", "test", "vocabulary"].includes(tab)) {
      setActiveTab(tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Hàm xử lý khi click vào nút "Đến bài tập"
  const handleGoToExercise = () => {
    setActiveTab("exercise");
  };

  // Load lesson vocabularies
  const loadLessonVocabularies = async () => {
    if (vocabulariesLoaded) return; // Avoid duplicate calls

    setLoadingVocabularies(true);
    try {
      const vocabResponse = await getLessonVocabularies(lessonId, 1, 100);

      if (vocabResponse.code === 200 && vocabResponse.data) {
        const vocabularies = Array.isArray(vocabResponse.data)
          ? vocabResponse.data
          : vocabResponse.data.vocabularies || [];
        setLessonVocabularies(vocabularies);
        setVocabulariesLoaded(true);
      } else {
        setLessonVocabularies([]);
        setVocabulariesLoaded(true);
      }
    } catch (error) {
      setLessonVocabularies([]);
      setVocabulariesLoaded(true);
    } finally {
      setLoadingVocabularies(false);
    }
  };

  // Initialize flashcard session
  const startFlashcardSession = async (options?: { forceNew?: boolean }) => {
    setLoadingFlashcards(true);
    try {
      let vocabs = lessonVocabularies;
      if (!vocabs.length) {
        const vocabResponse = await getLessonVocabularies(lessonId, 1, 100);
        if (vocabResponse.code === 200 && vocabResponse.data) {
          vocabs = Array.isArray(vocabResponse.data)
            ? vocabResponse.data
            : vocabResponse.data.vocabularies || [];
          setLessonVocabularies(vocabs);
          setVocabulariesLoaded(true);
        }
      }

      if (!vocabs.length) {
        toast.error("Chưa có từ vựng trong bài học này");
        return;
      }

      const sessionResponse = await createFlashcardSession(
        lessonId,
        options?.forceNew ?? false
      );

      if (sessionResponse.code === 200 || sessionResponse.code === 201) {
        const sessionData = sessionResponse.data;
        setFlashcardSession(sessionData);

        const isResumedSession = !sessionData.is_new_session;
        const resumeIndex = sessionData.current_index || 0;

        setFlashcardActivities(vocabs);
        setShowVocabLearning(true);
        setVocabKnowledgeStatus({});
        setSessionResults([]);
        setWordsStudiedCount(0);

        let startingIndex = 0;
        if (isResumedSession && resumeIndex >= vocabs.length) {
          startingIndex = 0;
        } else if (isResumedSession) {
          const zeroBasedIndex = resumeIndex;
          const oneBasedIndex = resumeIndex - 1;

          if (zeroBasedIndex >= 0 && zeroBasedIndex < vocabs.length) {
            startingIndex = zeroBasedIndex;
          } else if (oneBasedIndex >= 0 && oneBasedIndex < vocabs.length) {
            startingIndex = oneBasedIndex;
          }
        }

        setCurrentVocabIndex(startingIndex);

        const currentTime = Date.now();
        setSessionStartTime(currentTime);
        setCurrentCardStartTime(currentTime);
        setFlipStartTime(0);
        setShowAnswer(false);

        const firstVocabId = getVocabularyIdFromItem(vocabs[startingIndex]);
        if (firstVocabId && sessionData?.session_id) {
          setTimeout(() => {
            trackActivity(sessionData.session_id, firstVocabId, "view", 0, false);
          }, 300);
        }
      }
    } catch (error) {
      console.error("💥 Error starting flashcard session:", error);
      toast.error("Không thể kết nối đến server. Vui lòng thử lại.");
    } finally {
      setLoadingFlashcards(false);
    }
  };

  const restartFlashcardSession = async () => {
    setShowCompletionPopup(false);
    setCompletionStats(null);
    setShowVocabLearning(false);
    setFlashcardSession(null);
    setVocabKnowledgeStatus({});
    setCurrentVocabIndex(0);
    setShowAnswer(false);
    setWordsStudiedCount(0);
    setSessionResults([]);
    stopActiveRecording();
    setRecordedAudios((prev) => {
      Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
      return {};
    });
    await startFlashcardSession({ forceNew: true });
  };

  // Handle vocabulary navigation
  const handlePrevVocab = async () => {
    if (currentVocabIndex > 0) {
      stopActiveRecording();
      const newIndex = currentVocabIndex - 1;
      setCurrentVocabIndex(newIndex);
      setShowAnswer(false);

      const currentTime = Date.now();
      setCurrentCardStartTime(currentTime);
      setFlipStartTime(0);

      const vocabId = getVocabularyIdFromItem(flashcardActivities[newIndex]);
      if (vocabId && flashcardSession?.session_id) {
        setTimeout(() => {
          trackActivity(flashcardSession.session_id, vocabId, "view", 0, false);
        }, 1000);
      }
    }
  };

  const handleNextVocab = async () => {
    if (currentVocabIndex < flashcardActivities.length - 1) {
      stopActiveRecording();
      const newIndex = currentVocabIndex + 1;
      setCurrentVocabIndex(newIndex);
      setShowAnswer(false);

      const currentTime = Date.now();
      setCurrentCardStartTime(currentTime);
      setFlipStartTime(0);

      const vocabId = getVocabularyIdFromItem(flashcardActivities[newIndex]);
      if (vocabId && flashcardSession?.session_id) {
        setTimeout(() => {
          trackActivity(flashcardSession.session_id, vocabId, "view", 0, false);
        }, 1000);
      }
    }
  };

  const flipToAnswer = () => {
    const currentTime = Date.now();
    setShowAnswer(true);
    setFlipStartTime(currentTime);

    const currentVocab = flashcardActivities[currentVocabIndex];
    const vocabId = getVocabularyIdFromItem(currentVocab);
    const timeOnCard = currentTime - currentCardStartTime;

    if (vocabId && flashcardSession?.session_id && timeOnCard > 0) {
      trackActivity(
        flashcardSession.session_id,
        vocabId,
        "flip",
        timeOnCard,
        false
      );
    }
  };

  const flipToWord = () => {
    setShowAnswer(false);
    setFlipStartTime(0);
    setCurrentCardStartTime(Date.now());
  };

  const handleFlipCard = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (showAnswer) {
      flipToWord();
    } else {
      flipToAnswer();
    }
  };

  // Handle vocabulary status update
  const updateVocabularyStatus = async (knownStatus: string) => {
    if (!flashcardSession?.session_id) return;

    const currentVocab = flashcardActivities[currentVocabIndex];
    const vocabId = getVocabularyIdFromItem(currentVocab);
    if (!vocabId) return;

    const currentTime = Date.now();
    const timeOnAnswer = flipStartTime > 0 ? currentTime - flipStartTime : 0;

    try {
      await trackActivity(
        flashcardSession.session_id,
        vocabId,
        knownStatus === "known" ? "mark_known" : "mark_unknown",
        timeOnAnswer,
        true
      );

      setVocabKnowledgeStatus((prev) => ({
        ...prev,
        [vocabId]: knownStatus,
      }));

      const isLastCard = currentVocabIndex === flashcardActivities.length - 1;

      if (isLastCard) {
        await completeFlashcardSessionHandler(vocabId, knownStatus);
      } else {
        handleNextVocab();
      }
    } catch (error) {
      console.error("Error updating vocabulary status:", error);
    }
  };

  // Complete flashcard session
  const completeFlashcardSessionHandler = async (
    lastVocabId?: number,
    lastKnownStatus?: string
  ) => {
    if (!flashcardSession?.session_id) return;

    try {
      const totalTimeSec = Math.round((Date.now() - sessionStartTime) / 1000);
      const totalWords =
        lessonVocabularies.length || flashcardActivities.length || 0;

      const studiedIds = new Set<number>();
      for (let i = 0; i <= currentVocabIndex; i++) {
        const id = getVocabularyIdFromItem(flashcardActivities[i]);
        if (id) studiedIds.add(id);
      }

      const knownMap = { ...vocabKnowledgeStatus };
      if (lastVocabId && lastKnownStatus) {
        knownMap[lastVocabId] = lastKnownStatus;
        studiedIds.add(lastVocabId);
      }
      Object.keys(knownMap).forEach((id) => studiedIds.add(Number(id)));

      const wordsStudied =
        studiedIds.size > 0 ? studiedIds.size : Math.max(currentVocabIndex + 1, 1);
      const wordsKnown = Object.values(knownMap).filter(
        (s) => s === "known"
      ).length;
      const wordsLearning = Math.max(0, wordsStudied - wordsKnown);
      const completionRate =
        totalWords > 0 ? Math.min(1, wordsStudied / totalWords) : 0;

      const stats = {
        totalTimeSpent: totalTimeSec,
        wordsStudied,
        wordsKnown,
        totalWords,
        completionRate,
        knownRate: totalWords > 0 ? wordsKnown / totalWords : 0,
        averageScore: 0,
      };

      try {
        const apiRes = await completeFlashcardSession(
          flashcardSession.session_id,
          {
            total_time_spent: totalTimeSec,
            words_studied: wordsStudied,
            words_known: wordsKnown,
            words_learning: wordsLearning,
            completion_rate: completionRate,
          }
        );
        const sessionData = apiRes?.data;
        if (sessionData) {
          if (sessionData.study_duration > 0) {
            stats.totalTimeSpent = sessionData.study_duration;
          }
          if (typeof sessionData.completed_cards === "number") {
            stats.wordsStudied = Math.max(
              stats.wordsStudied,
              sessionData.completed_cards
            );
          }
          if (sessionData.total_cards > 0) {
            stats.totalWords = sessionData.total_cards;
          }
          if (typeof sessionData.known_cards === "number") {
            stats.wordsKnown = Math.max(
              stats.wordsKnown,
              sessionData.known_cards
            );
          }
          stats.completionRate =
            stats.totalWords > 0
              ? Math.min(1, stats.wordsStudied / stats.totalWords)
              : stats.completionRate;
          stats.knownRate =
            stats.totalWords > 0 ? stats.wordsKnown / stats.totalWords : 0;
        }
      } catch (error) {
        console.error("💥 Error completing session:", error);
      }

      setWordsStudiedCount(stats.wordsStudied);
      setSessionResults(stats);
      setCompletionStats(stats);
      setShowCompletionPopup(true);
      setShowVocabLearning(false);
    } catch (error) {
      console.error("💥 Error completing session:", error);
    }
  };

  // Text-to-speech functionality
  const speakText = (text: string, lang: string = "en-US") => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  // Simple audio recording functions
  const stopActiveRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      stopActiveRecording();
      return;
    }

    const vocabId = getVocabularyIdFromItem(
      flashcardActivities[currentVocabIndex]
    );
    if (!vocabId) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const recorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudios((prev) => {
          const next = { ...prev };
          if (next[vocabId]) {
            URL.revokeObjectURL(next[vocabId]);
          }
          next[vocabId] = audioUrl;
          return next;
        });
        stream.getTracks().forEach((track) => track.stop());
        setMediaRecorder(null);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Không thể truy cập microphone. Vui lòng cho phép quyền ghi âm.");
    }
  };

  // Play recorded audio for current vocabulary
  const playRecordedAudio = (vocabId?: number) => {
    const id =
      vocabId ??
      getVocabularyIdFromItem(flashcardActivities[currentVocabIndex]);
    if (!id) return;
    const audioUrl = recordedAudios[id];
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  // Hàm xử lý đánh dấu hoàn thành bài học
  const handleMarkComplete = async () => {
    if (!lesson?.id) return;
    setMarking(true);
    try {
      await markLessonComplete(lesson.id, true);
      setLesson((prev: any) => ({ ...prev, is_complete: true }));
      toast.success("Đã đánh dấu hoàn thành bài học!");
    } catch (e) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setMarking(false);
      setShowConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <div>{t("loading")}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        {/* Lesson Header */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
          <div className="mb-4">
            <Button
              asChild
              variant="ghost"
              className="flex items-center gap-2 px-0 text-cs-blue"
            >
              <Link href={`/courses/${courseId}`}>
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại khóa học</span>
              </Link>
            </Button>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                {(() => {
                  const name = lesson?.chapter?.title || "";
                  const match = /^(.*?)(\s*\(([^)]+)\))?$/.exec(name);
                  const mainTitle = match ? match[1].trim() : name;
                  const badge = match && match[3] ? match[3] : null;
                  return (
                    <>
                      <span>{mainTitle}</span>
                      {badge && !(user?.type === "student") && (
                        <span className="inline-block bg-white text-cs-blue border border-cs-blue rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ml-2">
                          {badge}
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>
              <h1 className="text-2xl font-bold text-gray-800 break-words flex items-center gap-2">
                {(() => {
                  const name = lesson?.title || "";
                  const match = /^(.*?)(\s*\(([^)]+)\))?$/.exec(name);
                  const mainTitle = match ? match[1].trim() : name;
                  const badge = match && match[3] ? match[3] : null;
                  return (
                    <>
                      {mainTitle}
                      {badge && !(user?.type === "student") && (
                        <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-3 py-1 text-base font-semibold whitespace-nowrap ml-2">
                          {badge}
                        </span>
                      )}
                    </>
                  );
                })()}
              </h1>
              {lesson?.description && (
                <div className="mt-2 text-gray-600 text-sm">
                  <div
                    className={
                      descExpanded
                        ? "whitespace-pre-line"
                        : "whitespace-pre-line line-clamp-2"
                    }
                  >
                    {lesson.description}
                  </div>
                  {lesson.description.split("\n").length > 2 ||
                  lesson.description.length > 120 ? (
                    !descExpanded ? (
                      <button
                        className="mt-1 text-xs underline text-cs-blue font-semibold"
                        onClick={toggleDescExpand}
                        type="button"
                      >
                        {t("seeMore")}
                      </button>
                    ) : (
                      <button
                        className="mt-1 text-xs underline text-cs-blue font-semibold"
                        onClick={toggleDescExpand}
                        type="button"
                      >
                        {t("collapse")}
                      </button>
                    )
                  ) : null}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {lesson?.is_complete ? (
                <Button
                  className="rounded-full bg-cs-blue text-white"
                  disabled
                >
                  <LucideCheck className="w-4 h-4 mr-2" />
                  {t("completed")}
                </Button>
              ) : (
                <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="rounded-full bg-cs-blue text-white"
                      onClick={() => setShowConfirm(true)}
                      disabled={marking}
                    >
                      <LucideFileCheck className="w-4 h-4 mr-2" />
                      {marking ? t("processing") : t("markComplete")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("confirmDesc")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={marking}>
                        {t("cancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction asChild>
                        <Button onClick={handleMarkComplete} disabled={marking}>
                          {t("confirm")}
                        </Button>
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>

        {/* Lesson Content */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value);
            router.replace(
              `/courses/${courseId}/lesson/${lessonId}?tab=${value}`
            );
          }}
          className="mb-8"
        >
          <TabsList className="mb-6 w-fit sm:w-full h-fit bg-white flex flex-col sm:flex-row max-sm:px-2 p-0 gap-0 shadow-none border-none">
            <TabsTrigger
              value="lecture"
              className="px-6 py-3 transition-all font-medium border-b-2 border-transparent data-[state=active]:text-[#0066CC] data-[state=active]:border-[#0066CC] data-[state=active]:font-bold data-[state=inactive]:text-gray-700 data-[state=inactive]:font-medium"
              style={{ borderRadius: 0 }}
            >
              <LucideBookOpen className="h-4 w-4 mr-2" />
              {t("tabs.lecture")}
            </TabsTrigger>
            <TabsTrigger
              value="homework"
              className="px-6 py-3 transition-all font-medium border-b-2 border-transparent data-[state=active]:text-[#0066CC] data-[state=active]:border-[#0066CC] data-[state=active]:font-bold data-[state=inactive]:text-gray-700 data-[state=inactive]:font-medium"
              style={{ borderRadius: 0 }}
            >
              <LucideClipboard className="h-4 w-4 mr-2" />
              {t("tabs.homework")}
            </TabsTrigger>

            <TabsTrigger
              value="exercise"
              className="px-6 py-3 transition-all font-medium border-b-2 border-transparent data-[state=active]:text-[#0066CC] data-[state=active]:border-[#0066CC] data-[state=active]:font-bold data-[state=inactive]:text-gray-700 data-[state=inactive]:font-medium"
              style={{ borderRadius: 0 }}
            >
              <LucideFileCheck className="h-4 w-4 mr-2" />
              {t("tabs.exercise")}
            </TabsTrigger>

            <TabsTrigger
              value="test"
              className="px-6 py-3 transition-all font-medium border-b-2 border-transparent data-[state=active]:text-[#0066CC] data-[state=active]:border-[#0066CC] data-[state=active]:font-bold data-[state=inactive]:text-gray-700 data-[state=inactive]:font-medium"
              style={{ borderRadius: 0 }}
            >
              <LucideFileCheck className="h-4 w-4 mr-2" />
              {t("tabs.test")}
            </TabsTrigger>

            <TabsTrigger
              value="vocabulary"
              className="px-6 py-3 transition-all font-medium border-b-2 border-transparent data-[state=active]:text-[#0066CC] data-[state=active]:border-[#0066CC] data-[state=active]:font-bold data-[state=inactive]:text-gray-700 data-[state=inactive]:font-medium"
              style={{ borderRadius: 0 }}
              onClick={() => {
                if (!vocabulariesLoaded) {
                  loadLessonVocabularies();
                }
              }}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {t("vocabulary.title")}
            </TabsTrigger>
          </TabsList>

          {/* Tab Bài giảng */}
          <TabsContent value="lecture">
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <LucideBookOpen className="h-5 w-5 text-cs-blue" />
                {t("lecture.title")}
              </h2>
              {Array.isArray(lesson?.lesson_plans) &&
              lesson.lesson_plans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {lesson.lesson_plans.map((plan: any, idx: number) => (
                    <Card
                      key={plan.id || idx}
                      className="border-cs-blue h-full flex flex-col"
                    >
                      <CardHeader className="p-4 flex flex-col items-start gap-3">
                        {plan.cover_image && (
                          <div className="w-full aspect-[16/9] relative mb-2">
                            <img
                              src={plan.cover_image}
                              alt={plan.name || ""}
                              className="object-cover w-full h-full rounded-lg border absolute inset-0"
                            />
                          </div>
                        )}
                        <CardTitle className="text-base font-semibold w-full break-words flex items-center gap-2">
                          {(() => {
                            const name =
                              plan.name || plan.title || `Bài giảng ${idx + 1}`;
                            const match = /^(.*?)(\s*\(([^)]+)\))?$/.exec(name);
                            const mainTitle = match ? match[1].trim() : name;
                            const badge = match && match[3] ? match[3] : null;
                            return (
                              <>
                                {mainTitle}
                                {badge && !(user?.type === "student") && (
                                  <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ml-2">
                                    {badge}
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </CardTitle>
                        {plan.total_time && (
                          <div className="text-xs text-gray-500 font-medium mt-1">
                            {t("durationLabel")}: {plan.total_time}{" "}
                            {t("minutes")}
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="p-4 pt-0 flex-1 w-full">
                        <div className="text-gray-700 whitespace-pre-line mb-4">
                          {plan.description || ""}
                        </div>
                        <Button asChild className="w-full mt-2" variant="default">
                          <Link
                            href={`/courses/${courseId}/lesson/${lessonId}/lecture/${plan.id}`}
                          >
                            {t("lecture.viewLecture")}
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-sm">
                  {t("lecture.empty")}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab Bài tập về nhà */}
          <TabsContent value="homework">
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <LucideClipboard className="h-5 w-5 text-cs-green" />
                {t("homework.title")}
              </h2>
              {assignedHomeworks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {assignedHomeworks
                    .slice()
                    .sort((a: any, b: any) => {
                      const numA =
                        parseInt(a.name.replace(/^\D+/g, ""), 10) || 0;
                      const numB =
                        parseInt(b.name.replace(/^\D+/g, ""), 10) || 0;
                      return numA - numB;
                    })
                    .map((hw: any, idx: number) => (
                      <Card
                        key={hw.id || idx}
                        className="border-cs-green h-full flex flex-col"
                      >
                        <CardHeader className="p-4 flex flex-col items-start gap-3">
                          <div className="w-full aspect-[16/9] relative mb-2">
                            {hw.cover_image && hw.cover_image.trim() ? (
                              <img
                                src={hw.cover_image}
                                alt={hw.name || `Bài tập ${idx + 1}`}
                                className="object-cover w-full h-full rounded-lg border absolute inset-0"
                              />
                            ) : (
                              <div
                                className="absolute inset-0 flex flex-col items-center justify-center border rounded-lg overflow-hidden"
                                style={{
                                  backgroundImage: "url(/BG_Clever School.png)",
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                }}
                              >
                                <span className="text-2xl font-bold text-gray-900 text-center px-2 flex items-center gap-2">
                                  {(() => {
                                    const name =
                                      hw.name || `Bài tập ${idx + 1}`;
                                    const match =
                                      /^(.*?)(\s*\(([^)]+)\))?$/.exec(name);
                                    const mainTitle = match
                                      ? match[1].trim()
                                      : name;
                                    const badge =
                                      match && match[3] ? match[3] : null;
                                    return (
                                      <>
                                        {mainTitle}
                                        {badge &&
                                          !(user?.type === "student") && (
                                            <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ml-2">
                                              {badge}
                                            </span>
                                          )}
                                      </>
                                    );
                                  })()}
                                </span>
                                <span className="text-xl font-medium text-cs-blue mt-1 text-center px-2">
                                  {hw.description || ""}
                                </span>
                              </div>
                            )}
                          </div>
                          {hw.total_time && (
                            <div className="text-xs text-gray-500 font-medium mt-1">
                              {t("durationLabel", { minutes: hw.total_time })}
                            </div>
                          )}
                          <div className="text-xs text-gray-600 font-medium mt-1 flex items-center gap-2">
                            <LucideListChecks className="w-4 h-4" />
                            {t("homework.progress")}: {hw.questions_completed}/
                            {hw.total_questions}
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex-1 w-full">
                          <div className="text-gray-700 whitespace-pre-line">
                            {hw.description || ""}
                          </div>
                          <div className="mt-4">
                            {hw.questions_completed === 0 ? (
                              <Button
                                asChild
                                className="w-full bg-red-600 hover:bg-red-700 text-white"
                                variant="default"
                              >
                                <Link
                                  href={doHomeworkFromDetailLessonRoute(
                                    user,
                                    hw.id,
                                    courseId,
                                    lessonId
                                  )}
                                >
                                  <LucidePlayCircle className="w-4 h-4 mr-2" />
                                  {t("actions.do")}
                                </Link>
                              </Button>
                            ) : hw.questions_completed < hw.total_questions ? (
                              <Button
                                asChild
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                variant="default"
                              >
                                <Link
                                  href={doHomeworkFromDetailLessonRoute(
                                    user,
                                    hw.id,
                                    courseId,
                                    lessonId
                                  )}
                                >
                                  <LucidePlayCircle className="w-4 h-4 mr-2" />
                                  {t("actions.continue")}
                                </Link>
                              </Button>
                            ) : (
                              <Button
                                asChild
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                                variant="default"
                              >
                                <Link
                                  href={reviewResultHomeworkFromDetailLessonStudentRoute(
                                    user,
                                    hw.id,
                                    courseId,
                                    lessonId
                                  )}
                                >
                                  <LucideRepeat className="w-4 h-4 mr-2" />
                                  {t("actions.review")}
                                </Link>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="text-gray-500 text-sm space-y-1">
                  <p>{t("homework.empty")}</p>
                  <p className="text-gray-400 text-xs">{t("emptyHintNotAssigned")}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab Bài tập */}
          <TabsContent value="exercise">
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <LucideFileCheck className="h-5 w-5 text-cs-orange" />
                {t("exercise.title")}
              </h2>
              {assignedExercises.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {assignedExercises.map((exercise: any, idx: number) => (
                    <Card
                      key={exercise.id || idx}
                      className="border-cs-orange h-full flex flex-col"
                    >
                      <CardHeader className="p-4 flex flex-col items-start gap-3">
                        <div className="w-full aspect-[16/9] relative mb-2">
                          {exercise.cover_image &&
                          exercise.cover_image.trim() ? (
                            <img
                              src={exercise.cover_image}
                              alt={exercise.name || `Bài kiểm tra ${idx + 1}`}
                              className="object-cover w-full h-full rounded-lg border absolute inset-0"
                            />
                          ) : (
                            <div
                              className="absolute inset-0 flex flex-col items-center justify-center border rounded-lg overflow-hidden"
                              style={{
                                backgroundImage: "url(/BG_Clever School.png)",
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }}
                            >
                              <span className="text-2xl font-bold text-gray-900 text-center px-2">
                                {(() => {
                                  const name =
                                    exercise.name || `Bài tập ${idx + 1}`;
                                  const match = /^(.*?)(\s*\(([^)]+)\))?$/.exec(
                                    name
                                  );
                                  const mainTitle = match
                                    ? match[1].trim()
                                    : name;
                                  const badge =
                                    match && match[3] ? match[3] : null;
                                  return (
                                    <>
                                      {mainTitle}
                                      {badge && !(user?.type === "student") && (
                                        <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ml-2">
                                          {badge}
                                        </span>
                                      )}
                                    </>
                                  );
                                })()}
                              </span>
                              <span className="text-xl font-medium text-cs-blue mt-1 text-center px-2">
                                {exercise.description || ""}
                              </span>
                            </div>
                          )}
                        </div>
                        {exercise.time_limit && (
                          <div className="text-xs text-gray-500 font-medium mt-1">
                            {t("durationLabel")}: {exercise.time_limit}{" "}
                            {t("minutes")}
                          </div>
                        )}
                        <div className="text-xs text-gray-600 font-medium mt-1 flex items-center gap-2">
                          <LucideListChecks className="w-4 h-4" />
                          {t("exercise.questions")}: {exercise.total_questions}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 flex-1 w-full">
                        <div className="text-gray-700 whitespace-pre-line">
                          {exercise.description || ""}
                        </div>
                        <div className="mt-4">
                          {exercise.is_completed ? (
                            <Button
                              asChild
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                              variant="default"
                            >
                              <Link
                                href={reviewExerciseStudentRoute(
                                  user,
                                  exercise.id,
                                  "lesson-detail",
                                  courseId,
                                  lessonId
                                )}
                              >
                                <LucideEye className="w-4 h-4 mr-2" />
                                {t("actions.reviewSubmission")}
                              </Link>
                            </Button>
                          ) : (
                            <Button
                              asChild
                              className="w-full bg-red-600 hover:bg-red-700 text-white"
                              variant="default"
                            >
                              <Link
                                href={doExerciseFromDetailLessonRoute(
                                  user,
                                  exercise.id,
                                  courseId,
                                  lessonId
                                )}
                              >
                                <LucidePlayCircle className="w-4 h-4 mr-2" />
                                {t("actions.do")}
                              </Link>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-sm space-y-1">
                  <p>{t("exercise.empty")}</p>
                  <p className="text-gray-400 text-xs">{t("emptyHintNotAssigned")}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab Bài kiểm tra */}
          <TabsContent value="test">
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <LucideFileCheck className="h-5 w-5 text-cs-orange" />
                {t("test.title")}
              </h2>
              {assignedExams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {assignedExams.map((exam: any, idx: number) => (
                    <Card
                      key={exam.id || idx}
                      className="border-cs-orange h-full flex flex-col"
                    >
                      <CardHeader className="p-4 flex flex-col items-start gap-3">
                        <div className="w-full aspect-[16/9] relative mb-2">
                          {exam.cover_image && exam.cover_image.trim() ? (
                            <img
                              src={exam.cover_image}
                              alt={exam.name || `Bài kiểm tra ${idx + 1}`}
                              className="object-cover w-full h-full rounded-lg border absolute inset-0"
                            />
                          ) : (
                            <div
                              className="absolute inset-0 flex flex-col items-center justify-center border rounded-lg overflow-hidden"
                              style={{
                                backgroundImage: "url(/BG_Clever School.png)",
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }}
                            >
                              <span className="text-2xl font-bold text-gray-900 text-center px-2">
                                {(() => {
                                  const name =
                                    exam.name || `Bài tập ${idx + 1}`;
                                  const match = /^(.*?)(\s*\(([^)]+)\))?$/.exec(
                                    name
                                  );
                                  const mainTitle = match
                                    ? match[1].trim()
                                    : name;
                                  const badge =
                                    match && match[3] ? match[3] : null;
                                  return (
                                    <>
                                      {mainTitle}
                                      {badge && !(user?.type === "student") && (
                                        <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ml-2">
                                          {badge}
                                        </span>
                                      )}
                                    </>
                                  );
                                })()}
                              </span>
                              <span className="text-xl font-medium text-cs-blue mt-1 text-center px-2">
                                {exam.description || ""}
                              </span>
                            </div>
                          )}
                        </div>
                        {exam.time_limit && (
                          <div className="text-xs text-gray-500 font-medium mt-1">
                            {t("durationLabel")}: {exam.time_limit}{" "}
                            {t("minutes")}
                          </div>
                        )}
                        <div className="text-xs text-gray-600 font-medium mt-1 flex items-center gap-2">
                          <LucideListChecks className="w-4 h-4" />
                          {t("test.questions")}: {exam.total_questions}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 flex-1 w-full">
                        <div className="text-gray-700 whitespace-pre-line">
                          {exam.description || ""}
                        </div>
                        <div className="mt-4">
                          {exam.is_completed ? (
                            <Button
                              asChild
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                              variant="default"
                            >
                              <Link
                                href={reviewExamStudentRoute(
                                  user,
                                  exam.id,
                                  "lesson-detail",
                                  courseId,
                                  lessonId
                                )}
                              >
                                <LucideEye className="w-4 h-4 mr-2" />
                                {t("actions.reviewSubmission")}
                              </Link>
                            </Button>
                          ) : (
                            <Button
                              asChild
                              className="w-full bg-red-600 hover:bg-red-700 text-white"
                              variant="default"
                            >
                              <Link
                                href={doExamFromDetailLessonRoute(
                                  user,
                                  exam.id,
                                  courseId,
                                  lessonId
                                )}
                              >
                                <LucidePlayCircle className="w-4 h-4 mr-2" />
                                {t("actions.do")}
                              </Link>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-sm space-y-1">
                  <p>{t("test.empty")}</p>
                  <p className="text-gray-400 text-xs">{t("emptyHintNotAssigned")}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab Từ vựng - Simplified to single card */}
          <TabsContent value="vocabulary" className="space-y-6">
            <div className="grid grid-cols-1 max-w-md mx-auto gap-8">
              {/* Học từ vựng */}
              <Card className="bg-white rounded-3xl border border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300 group cursor-pointer">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:bg-purple-200 transition-colors mb-4">
                    <BookOpen className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                    Học từ vựng
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    Học và ghi nhớ từ vựng mới thông qua flashcard tương tác
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                  <div className="bg-purple-50 rounded-xl p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tổng từ vựng:</span>
                        <span className="font-semibold text-gray-900">
                          {loadingVocabularies
                            ? "..."
                            : lessonVocabularies.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Đã biết:</span>
                        <span className="font-semibold text-green-600">
                          {
                            Object.values(vocabKnowledgeStatus).filter(
                              (status) => status === "known"
                            ).length
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 pb-6 px-6">
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                    onClick={() => {
                      if (!vocabulariesLoaded) {
                        loadLessonVocabularies();
                      }
                      startFlashcardSession();
                    }}
                    disabled={loadingFlashcards || loadingVocabularies}
                  >
                    {loadingFlashcards || loadingVocabularies ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {loadingVocabularies
                          ? "Đang tải từ vựng..."
                          : "Đang tải..."}
                      </>
                    ) : lessonVocabularies.length > 0 ? (
                      "Bắt đầu học"
                    ) : (
                      "Chưa có từ vựng"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Vocabulary Learning Modal */}
      {/* Vocabulary Learning Modal - Copied from teacher page */}
      {showVocabLearning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-3xl shadow-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Học từ vựng
                  </h2>
                  <div className="space-y-1">
                    <p className="text-gray-500">
                      {flashcardActivities.length > 0
                        ? `${currentVocabIndex + 1} / ${
                            flashcardActivities.length
                          }`
                        : "Đang tải..."}
                    </p>
                    {/* Real-time stats */}
                    <div className="flex gap-4 text-sm">
                      <span className="text-blue-600 font-medium">
                        📚 Đã học: {wordsStudiedCount}
                      </span>
                      <span className="text-green-600 font-medium">
                        ✓ Đã biết:{" "}
                        {
                          Object.values(vocabKnowledgeStatus).filter(
                            (status) => status === "known"
                          ).length
                        }
                      </span>
                    </div>
                    {flashcardSession && !flashcardSession.is_new_session && (
                      <p className="text-orange-600 text-sm font-medium">
                        📚 Tiếp tục phiên học dở dang
                      </p>
                    )}
                    {flashcardSession && flashcardSession.is_new_session && (
                      <p className="text-green-600 text-sm font-medium">
                        🆕 Phiên học mới
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="rounded-2xl"
                onClick={() => {
                  setShowVocabLearning(false);
                  setFlashcardSession(null);
                  setFlashcardActivities([]);
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Progress Bar */}
            {flashcardActivities.length > 0 && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Tiến độ học tập
                  </span>
                  <span className="text-sm font-medium text-purple-600">
                    {currentVocabIndex + 1} / {flashcardActivities.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        ((currentVocabIndex + 1) / flashcardActivities.length) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Tổng thẻ: {flashcardActivities.length}</span>
                  <span className="text-green-600">
                    Đã biết:{" "}
                    {
                      Object.values(vocabKnowledgeStatus).filter(
                        (status) => status === "known"
                      ).length
                    }
                  </span>
                  <span className="text-orange-600">
                    Chưa biết:{" "}
                    {
                      Object.values(vocabKnowledgeStatus).filter(
                        (status) => status === "unknown"
                      ).length
                    }
                  </span>
                </div>
              </div>
            )}

            {/* Loading or No Data State */}
            {flashcardActivities.length === 0 && (
              <div className="mb-8 text-center py-12">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {loadingFlashcards
                    ? "Đang tải từ vựng..."
                    : "Không có từ vựng"}
                </h3>
                <p className="text-gray-500">
                  {loadingFlashcards
                    ? "Vui lòng đợi trong giây lát"
                    : "Bài học này chưa có từ vựng nào được thêm"}
                </p>
              </div>
            )}

            {/* Flashcard */}
            {flashcardActivities.length > 0 &&
              flashcardActivities[currentVocabIndex] && (
                <div className="mb-8">
                  <div
                    className={`bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-8 text-center min-h-[400px] flex flex-col justify-center cursor-pointer transition-all duration-300 ${
                      showAnswer ? "from-green-50 to-green-100" : ""
                    }`}
                    onClick={handleFlipCard}
                  >
                    {!showAnswer ? (
                      // Front side - Word
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-5xl font-bold text-gray-900">
                            {flashcardActivities[currentVocabIndex].vocabulary
                              ?.word ||
                              flashcardActivities[currentVocabIndex].word}
                          </h3>

                          {/* Phonetic transcription */}
                          {(flashcardActivities[currentVocabIndex].vocabulary
                            ?.phonetic ||
                            flashcardActivities[currentVocabIndex]
                              .phonetic) && (
                            <p className="text-xl text-gray-600 font-medium">
                              /
                              {flashcardActivities[currentVocabIndex].vocabulary
                                ?.phonetic ||
                                flashcardActivities[currentVocabIndex].phonetic}
                              /
                            </p>
                          )}
                        </div>

                        {/* Show image if available */}
                        {(flashcardActivities[currentVocabIndex].vocabulary
                          ?.image?.url ||
                          flashcardActivities[currentVocabIndex].image
                            ?.url) && (
                          <div className="flex justify-center">
                            <img
                              src={
                                flashcardActivities[currentVocabIndex]
                                  .vocabulary?.image?.url ||
                                flashcardActivities[currentVocabIndex].image
                                  ?.url
                              }
                              alt={
                                flashcardActivities[currentVocabIndex]
                                  .vocabulary?.word ||
                                flashcardActivities[currentVocabIndex].word
                              }
                              className="max-w-40 max-h-40 object-cover rounded-xl shadow-lg"
                            />
                          </div>
                        )}

                        <div className="space-y-4">
                          {/* Audio buttons */}
                          <div className="flex gap-3 justify-center">
                            {/* Sample pronunciation */}
                            <Button
                              variant="outline"
                              size="lg"
                              className="rounded-2xl"
                              onClick={(e) => {
                                e.stopPropagation();
                                speakText(
                                  flashcardActivities[currentVocabIndex]
                                    .vocabulary?.word ||
                                    flashcardActivities[currentVocabIndex].word,
                                  "en-US"
                                );
                              }}
                            >
                              <Volume2 className="h-5 w-5 mr-2" />
                              Nghe mẫu
                            </Button>

                            {/* Record button */}
                            <Button
                              variant={isRecording ? "destructive" : "default"}
                              size="lg"
                              className="rounded-2xl"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRecording();
                              }}
                            >
                              <Mic className="h-5 w-5 mr-2" />
                              {isRecording ? "Dừng" : "Thu âm"}
                            </Button>

                            {/* Play recorded audio */}
                            {recordedAudios[
                              getVocabularyIdFromItem(
                                flashcardActivities[currentVocabIndex]
                              ) ?? -1
                            ] && (
                              <Button
                                variant="outline"
                                size="lg"
                                className="rounded-2xl"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playRecordedAudio();
                                }}
                              >
                                <Play className="h-5 w-5 mr-2" />
                                Phát lại
                              </Button>
                            )}
                          </div>

                          {isRecording && (
                            <p className="text-sm text-red-600 font-medium animate-pulse">
                              🔴 Đang ghi âm... Hãy phát âm từ "
                              {flashcardActivities[currentVocabIndex].vocabulary
                                ?.word ||
                                flashcardActivities[currentVocabIndex].word}
                              "
                            </p>
                          )}

                          <p className="text-sm text-gray-500 font-medium">
                            Nhấn để xem nghĩa
                          </p>
                        </div>
                      </div>
                    ) : (
                      // Back side - Translation and details
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-4xl font-bold text-gray-900">
                            {flashcardActivities[currentVocabIndex].vocabulary
                              ?.translation ||
                              flashcardActivities[currentVocabIndex].vocabulary
                                ?.meaning ||
                              flashcardActivities[currentVocabIndex].meaning}
                          </h3>

                          {/* Part of speech */}
                          {(flashcardActivities[currentVocabIndex].vocabulary
                            ?.part_of_speech ||
                            flashcardActivities[currentVocabIndex]
                              .part_of_speech) && (
                            <div className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                              {flashcardActivities[currentVocabIndex].vocabulary
                                ?.part_of_speech ||
                                flashcardActivities[currentVocabIndex]
                                  .part_of_speech}
                            </div>
                          )}

                          {/* Definition */}
                          {(flashcardActivities[currentVocabIndex].vocabulary
                            ?.definition ||
                            flashcardActivities[currentVocabIndex]
                              .definition) && (
                            <p className="text-lg text-gray-700 leading-relaxed max-w-lg mx-auto">
                              {flashcardActivities[currentVocabIndex].vocabulary
                                ?.definition ||
                                flashcardActivities[currentVocabIndex]
                                  .definition}
                            </p>
                          )}

                          {/* Example sentence */}
                          {(flashcardActivities[currentVocabIndex].vocabulary
                            ?.example_sentence ||
                            flashcardActivities[currentVocabIndex]
                              .example_sentence) && (
                            <div className="bg-white/70 rounded-2xl p-4 max-w-lg mx-auto">
                              <p className="text-gray-700 italic">
                                "
                                {flashcardActivities[currentVocabIndex]
                                  .vocabulary?.example_sentence ||
                                  flashcardActivities[currentVocabIndex]
                                    .example_sentence}
                                "
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Knowledge status */}
                        <div className="bg-white/70 rounded-2xl p-4">
                          <div className="flex items-center justify-center gap-2">
                            {(() => {
                              const vocabularyId = getVocabularyIdFromItem(
                                flashcardActivities[currentVocabIndex]
                              );
                              const knowledgeStatus = vocabularyId
                                ? vocabKnowledgeStatus[vocabularyId]
                                : undefined;

                              if (knowledgeStatus === "known") {
                                return (
                                  <span className="px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-700">
                                    ✓ Đã biết
                                  </span>
                                );
                              } else if (knowledgeStatus === "unknown") {
                                return (
                                  <span className="px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-700">
                                    ✗ Chưa biết
                                  </span>
                                );
                              } else {
                                // Default status based on progress
                                const status =
                                  flashcardActivities[currentVocabIndex]
                                    .progress?.status;
                                if (status === "completed") {
                                  return (
                                    <span className="px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-700">
                                      ✓ Đã hoàn thành
                                    </span>
                                  );
                                } else if (status === "learning") {
                                  return (
                                    <span className="px-4 py-2 rounded-full text-sm font-medium bg-orange-100 text-orange-700">
                                      📚 Đang học
                                    </span>
                                  );
                                } else {
                                  return (
                                    <span className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                                      ⚪ Chưa đánh giá
                                    </span>
                                  );
                                }
                              }
                            })()}
                          </div>
                        </div>

                        <p className="text-sm text-gray-500 font-medium">
                          Nhấn để xem từ vựng
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Controls */}
            {flashcardActivities.length > 0 && (
              <div className="space-y-6">
                {/* Navigation and Flip */}
                <div className="relative z-10 flex justify-between items-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl px-6"
                    onClick={handlePrevVocab}
                    disabled={currentVocabIndex === 0}
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Trước
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl px-6"
                    onClick={(e) => handleFlipCard(e)}
                  >
                    <RotateCcw className="h-5 w-5 mr-2" />
                    {showAnswer ? "Lật lại" : "Lật thẻ"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl px-6"
                    onClick={handleNextVocab}
                    disabled={
                      currentVocabIndex === flashcardActivities.length - 1
                    }
                  >
                    Tiếp theo
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>

                {/* Finish Study Button - Always visible */}
                <div className="flex justify-center">
                  <Button
                    type="button"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-8 py-3"
                    onClick={completeFlashcardSessionHandler}
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Học xong
                  </Button>
                </div>

                {/* Knowledge Status Button - Known/Unknown buttons */}
                {showAnswer && (
                  <div className="relative z-10 flex gap-3 justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl px-6 py-3 border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => updateVocabularyStatus("unknown")}
                      disabled={updatingVocabStatus}
                    >
                      {updatingVocabStatus ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 mr-2" />
                          Chưa biết
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      className="bg-green-600 hover:bg-green-700 text-white rounded-2xl px-6 py-3"
                      onClick={() => updateVocabularyStatus("known")}
                      disabled={updatingVocabStatus}
                    >
                      {updatingVocabStatus ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Đã biết
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {!showAnswer && (
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      Lật thẻ để xem nghĩa và đánh giá từ vựng
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Session Complete Dialog */}
      {showCompletionPopup && completionStats && (
        <SessionCompleteDialog
          open={showCompletionPopup}
          onClose={() => {
            setShowCompletionPopup(false);
            setCompletionStats(null);
          }}
          onRestartSession={restartFlashcardSession}
          onGoBack={() => {
            setShowCompletionPopup(false);
            setCompletionStats(null);
            setShowVocabLearning(false);
          }}
          stats={completionStats}
        />
      )}
    </div>
  );
}
