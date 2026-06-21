"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  RotateCcw,
  Send,
  ClipboardCheck,
  User,
  FileText,
  BookOpen,
  PenTool,
  Monitor,
  Play,
  Download,
  Edit,
  Eye,
  Loader2,
  Volume2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GetLessonDetail, UpdateLesson } from "@/lib/api/lessons";
import {
  getLessonPlanById,
  getLessonPlanParts,
  LessonPlan,
  LessonPlanPart,
} from "@/lib/api/lectures";
import { useParams, useSearchParams } from "next/navigation";
import { useTypedTranslations } from "@/lib/i18n/client";
import { RoleBasedHeaderSidebar } from "@/components/layout/role-based-header-sidebar";
import { useAuth } from "@/lib/context/auth-context";
import { GetCourseList } from "@/lib/api/courses";
import axiosInstance from "@/lib/api/axios";
import { useToast } from "@/components/ui/use-toast";
import { usePermissions } from "@/hooks/use-permissions";

// Get lesson vocabularies for teacher view
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

export default function LessonDetailPage() {
  const { user } = useAuth();
  const { canEditLessons, canManageAssignments } = usePermissions();
  const isTeacher = user?.type === "teacher";
  /** Giao bài / chấm bài: GV luôn được; admin cần quyền assignments. */
  const canAssignInLesson = isTeacher || canManageAssignments();
  const canGradeAssignments = isTeacher;
  const canPreviewAssignment = isTeacher || canManageAssignments();
  const params = useParams();
  const { toast } = useToast();
  const id = params?.id as string;
  const locale = (params as any)?.locale || "vi";
  const t = useTypedTranslations("lessonDetail");
  const searchParams = useSearchParams();
  const courseId = searchParams.get("course_id");

  const [activeTab, setActiveTab] = useState("lesson");
  const [lesson, setLesson] = useState<any>(null);
  const [lecture, setLecture] = useState<LessonPlan | null>(null);
  const [lectureParts, setLectureParts] = useState<LessonPlanPart[]>([]);
  const [tabLoaded, setTabLoaded] = useState<{
    assignments: boolean;
    tests: boolean;
  }>({ assignments: false, tests: false });
  const [loading, setLoading] = useState(true);
  const [loadingTeachingMode, setLoadingTeachingMode] = useState(false);
  const [assigningHomeworks, setAssigningHomeworks] = useState<Set<string>>(
    new Set()
  );
  const [assigningExams, setAssigningExams] = useState<Set<string>>(new Set());
  const [assigningExercises, setAssigningExercises] = useState<Set<string>>(
    new Set()
  );
  const [showCoursePopup, setShowCoursePopup] = useState(false);
  const [popupCourses, setPopupCourses] = useState<any[]>([]);
  const [popupSelectedCourseId, setPopupSelectedCourseId] = useState("");
  const [popupSelectedChapterId, setPopupSelectedChapterId] = useState("");
  const [updatingLesson, setUpdatingLesson] = useState(false);

  // Vocabulary states for teacher (view only)
  const [showVocabViewer, setShowVocabViewer] = useState(false);
  const [lessonVocabularies, setLessonVocabularies] = useState<any[]>([]);
  const [loadingVocabularies, setLoadingVocabularies] = useState(false);
  const [vocabulariesLoaded, setVocabulariesLoaded] = useState(false);

  const fetchLesson = useCallback(
    async (options?: { showLoading?: boolean }) => {
      if (!id) return;
      const showLoading = options?.showLoading ?? true;
      if (showLoading) setLoading(true);

      const urlParams = new URLSearchParams(window.location.search);
      const courseIdParam = urlParams.get("course_id");

      try {
        const res = await GetLessonDetail(id, courseIdParam || undefined);
        const lessonData = res?.data || res;
        setLesson(lessonData);

        if (lessonData.lesson_plans && lessonData.lesson_plans.length > 0) {
          const lectureId = lessonData.lesson_plans[0].id;
          getLessonPlanById(
            lectureId,
            courseIdParam ? Number(courseIdParam) : undefined
          )
            .then(setLecture)
            .catch(() => setLecture(null));
          getLessonPlanParts(
            lectureId,
            courseIdParam ? Number(courseIdParam) : undefined
          )
            .then(setLectureParts)
            .catch(() => setLectureParts([]));
        } else {
          setLecture(null);
          setLectureParts([]);
        }
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson, courseId]);

  // Refetch when tab regains focus (admin may have changed assignment in another tab)
  useEffect(() => {
    const refreshLesson = () => {
      if (document.visibilityState === "visible") {
        fetchLesson({ showLoading: false });
      }
    };

    window.addEventListener("focus", refreshLesson);
    document.addEventListener("visibilitychange", refreshLesson);
    return () => {
      window.removeEventListener("focus", refreshLesson);
      document.removeEventListener("visibilitychange", refreshLesson);
    };
  }, [fetchLesson]);

  // Gọi API lấy danh sách câu hỏi khi click tab (chỉ gọi 1 lần)
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "vocabularies" && !vocabulariesLoaded) {
      loadLessonVocabularies();
    }
  };

  // Load lesson vocabularies for teacher viewing
  const loadLessonVocabularies = async () => {
    if (vocabulariesLoaded) return;

    setLoadingVocabularies(true);
    try {
      const vocabResponse = await getLessonVocabularies(id, 1, 100);

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
      console.error("❌ Error loading vocabularies:", error);
      setLessonVocabularies([]);
      setVocabulariesLoaded(true);
    } finally {
      setLoadingVocabularies(false);
    }
  };

  // Open vocabulary viewer for teacher
  const openVocabularyViewer = async () => {
    if (!vocabulariesLoaded) {
      await loadLessonVocabularies();
    }
    setShowVocabViewer(true);
  };

  // Text-to-speech function for teacher to hear pronunciation
  const speakText = (text: string, lang: string = "en-US") => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.8;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Xử lý giao bài tập về nhà
  const handleAssignHomework = async (
    homeworkId: string,
    isAssigned: boolean
  ) => {
    setAssigningHomeworks((prev) => new Set(prev).add(homeworkId));
    try {
      // Use the lesson ID from the lesson state
      const lessonId = lesson?.id;
      if (!lessonId) {
        throw new Error("Lesson ID is not available");
      }

      const urlParams = new URLSearchParams(window.location.search);
      const courseIdParam = urlParams.get("course_id");
      if (!courseIdParam) {
        throw new Error("course_id is required");
      }

      await import("@/lib/api/homeworks").then(({ AssignHomework }) =>
        AssignHomework(homeworkId, Number(lessonId), {
          is_assigned: isAssigned,
          course_id: Number(courseIdParam),
        })
      );

      await fetchLesson({ showLoading: false });
      toast({
        title: "Thành công",
        description: isAssigned ? "Đã giao bài" : "Đã hoàn tác giao bài",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating homework assignment status:", error);
      toast({
        title: "Thất bại",
        description:
          error instanceof Error && error.message === "course_id is required"
            ? "Thiếu course_id trong URL. Mở bài học từ khóa học để giao bài."
            : "Thao tác thất bại",
        variant: "destructive",
      });
    } finally {
      setAssigningHomeworks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(homeworkId);
        return newSet;
      });
    }
  };

  // Xử lý giao bài tập
  const handleAssignExercise = async (
    exerciseId: string,
    isAssigned: boolean
  ) => {
    setAssigningExercises((prev) => new Set(prev).add(exerciseId));
    try {
      // Use the lesson ID from the lesson state
      const lessonId = lesson?.id;
      if (!lessonId) {
        throw new Error("Lesson ID is not available");
      }

      const urlParams = new URLSearchParams(window.location.search);
      const courseIdParam = urlParams.get("course_id");
      if (!courseIdParam) {
        throw new Error("course_id is required");
      }

      await import("@/lib/api/exercises").then(({ AssignExercise }) =>
        AssignExercise(exerciseId, Number(lessonId), {
          is_assigned: isAssigned,
          course_id: Number(courseIdParam),
        })
      );

      await fetchLesson({ showLoading: false });
      toast({
        title: "Thành công",
        description: isAssigned ? "Đã giao bài" : "Đã hoàn tác giao bài",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating exercise assignment status:", error);
      toast({
        title: "Thất bại",
        description:
          error instanceof Error && error.message === "course_id is required"
            ? "Thiếu course_id trong URL. Mở bài học từ khóa học để giao bài."
            : "Thao tác thất bại",
        variant: "destructive",
      });
    } finally {
      setAssigningExercises((prev) => {
        const newSet = new Set(prev);
        newSet.delete(exerciseId);
        return newSet;
      });
    }
  };

  // Xử lý giao bài kiểm tra
  const handleAssignExam = async (examId: string, isAssigned: boolean) => {
    setAssigningExams((prev) => new Set(prev).add(examId));
    try {
      // Use the lesson ID from the lesson state
      const lessonId = lesson?.id;
      if (!lessonId) {
        throw new Error("Lesson ID is not available");
      }

      const urlParams = new URLSearchParams(window.location.search);
      const courseIdParam = urlParams.get("course_id");
      if (!courseIdParam) {
        throw new Error("course_id is required");
      }

      await import("@/lib/api/exams").then(({ AssignExam }) =>
        AssignExam(examId, Number(lessonId), {
          is_assigned: isAssigned,
          course_id: Number(courseIdParam),
        })
      );

      await fetchLesson({ showLoading: false });
      toast({
        title: "Thành công",
        description: isAssigned ? "Đã giao bài" : "Đã hoàn tác giao bài",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating exam assignment status:", error);
      toast({
        title: "Thất bại",
        description:
          error instanceof Error && error.message === "course_id is required"
            ? "Thiếu course_id trong URL. Mở bài học từ khóa học để giao bài."
            : "Thao tác thất bại",
        variant: "destructive",
      });
    } finally {
      setAssigningExams((prev) => {
        const newSet = new Set(prev);
        newSet.delete(examId);
        return newSet;
      });
    }
  };

  // Popup: fetch course list when open
  useEffect(() => {
    if (showCoursePopup) {
      GetCourseList().then((res) => {
        if (res.code === 200 && res.data) {
          setPopupCourses(res.data.courses || []);
        }
      });
      // Reset selections when opening popup
      setPopupSelectedCourseId("");
      setPopupSelectedChapterId("");
    }
  }, [showCoursePopup]);

  // Helper: get chapters for selected course
  const popupChapters = React.useMemo(() => {
    if (!popupSelectedCourseId) return [];
    const selectedCourse = popupCourses.find(
      (c: any) => String(c.id) === String(popupSelectedCourseId)
    );
    return selectedCourse?.chapters || [];
  }, [popupSelectedCourseId, popupCourses]);

  if (loading)
    return (
      <RoleBasedHeaderSidebar>
        <div className="p-8 text-center text-gray-500">{t("loading")}</div>
      </RoleBasedHeaderSidebar>
    );
  if (!lesson)
    return (
      <RoleBasedHeaderSidebar>
        <div className="p-8 text-center text-gray-500">{t("notFound")}</div>
      </RoleBasedHeaderSidebar>
    );

  // Chuẩn hóa dữ liệu cho UI cũ
  const objectives = lesson.objectives || [];
  const materials = lesson.materials || [];
  const assignments = lesson.homeworks || [];
  const tests = lesson.exams || [];

  return (
    <RoleBasedHeaderSidebar>
      <div className="container mx-auto px-6 py-8">
        {/* Header Section - Minimalist */}
        <div className="mb-12">
          <div className="space-y-3">
            {(() => {
              const match = /^(.*?)(\s*\(([^)]+)\))?$/.exec(lesson.title || "");
              const mainTitle = match ? match[1].trim() : lesson.title;
              const badge = match && match[3] ? match[3] : null;
              return (
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    {mainTitle}
                  </h1>
                  {badge && (
                    <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-3 py-1 text-lg font-semibold whitespace-nowrap ml-2">
                      {badge}
                    </span>
                  )}
                </div>
              );
            })()}
            <p className="text-gray-500 font-medium">{t("subtitle")}</p>
            {/* Nếu chưa gắn chương/khóa học thì hiển thị button chọn */}
            {lesson.chapter.id == 0 ? (
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl px-6 py-3 font-medium"
                onClick={() => setShowCoursePopup(true)}
              >
                {t("chooseCourse")}
              </Button>
            ) : (
              lesson.chapter &&
              lesson.chapter.title && (
                <div className="flex flex-wrap gap-3">
                  {lesson.course && lesson.course.name && (
                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-medium">
                      <BookOpen className="h-4 w-4 mr-2" />
                      {t("courseLabel")}: {lesson.course.name}
                    </Badge>
                  )}
                  <Badge className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-medium">
                    <BookOpen className="h-4 w-4 mr-2" />
                    {t("chapterLabel")}: {lesson.chapter.title}
                  </Badge>
                </div>
              )
            )}
          </div>
        </div>

        {/* Tabs and Actions */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
          <Tabs
            defaultValue="lesson"
            value={activeTab}
            onValueChange={handleTabChange}
            className="space-y-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <TabsList className="max-sm:flex max-sm:flex-col max-sm:gap-1 grid w-full lg:w-auto h-auto grid-cols-5 bg-gray-50 rounded-2xl p-1">
                <TabsTrigger
                  value="lesson"
                  className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm w-full"
                >
                  <BookOpen className="h-4 w-4" />
                  {t("tabLesson")}
                </TabsTrigger>
                <TabsTrigger
                  value="assignments"
                  className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm w-full"
                >
                  <FileText className="h-4 w-4" />
                  {t("tabAssignments")}
                </TabsTrigger>
                <TabsTrigger
                  value="exercises"
                  className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm w-full"
                >
                  <PenTool className="h-4 w-4" />
                  {t("tabExercises")}
                </TabsTrigger>
                <TabsTrigger
                  value="tests"
                  className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm w-full"
                >
                  <PenTool className="h-4 w-4" />
                  {t("tabTests")}
                </TabsTrigger>
                <TabsTrigger
                  value="vocabularies"
                  className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm w-full"
                >
                  <BookOpen className="h-4 w-4" />
                  Từ vựng
                </TabsTrigger>
              </TabsList>

              <div className="flex gap-3 flex-wrap sm:flex-nowrap">
                {activeTab === "lesson" && (
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-6 py-3 font-medium w-full"
                    disabled={loadingTeachingMode}
                    onClick={async () => {
                      if (loadingTeachingMode) return;

                      setLoadingTeachingMode(true);
                      try {
                        // Đảm bảo có dữ liệu chi tiết đầy đủ trước khi chuyển sang chế độ giảng dạy
                        if (
                          lesson &&
                          (lesson.homeworks?.length > 0 ||
                            lesson.exams?.length > 0)
                        ) {
                          // Chuẩn bị dữ liệu đầy đủ để truyền sang preview mode
                          const assignmentData = {
                            lessonTitle: lesson.title,
                            homeworks: lesson.homeworks.map((hw: any) => ({
                              ...hw,
                              questions: [],
                              questionCount: hw.total_questions || 0,
                            })),
                            exams: lesson.exams.map((ex: any) => ({
                              ...ex,
                              questions: [],
                              questionCount: ex.total_questions || 0,
                            })),
                            timestamp: Date.now(),
                          };

                          sessionStorage.setItem(
                            `lessonAssignments_${id}`,
                            JSON.stringify(assignmentData)
                          );
                        }

                        if (
                          lesson.lesson_plans &&
                          lesson.lesson_plans.length > 0
                        ) {
                          window.open(
                            `/${locale}/manage/lecture-bank/preview/${lesson.lesson_plans[0].id}?lesson_id=${id}&course_id=${courseId}`,
                            "_blank"
                          )
                        }
                      } catch (error) {
                        console.error("Error preparing teaching mode:", error);
                      } finally {
                        setLoadingTeachingMode(false);
                      }
                    }}
                  >
                    {loadingTeachingMode ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        {t("preparing")}
                      </>
                    ) : (
                      <>
                        <Monitor className="h-5 w-5 mr-2" />
                        {t("teachingMode")}
                      </>
                    )}
                  </Button>
                )}
                {/* Hiển thị button chỉnh sửa nếu có quyền */}
                {canEditLessons() && (
                  <Button
                    variant="outline"
                    className="border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 rounded-2xl px-6 py-3 font-medium w-full"
                    asChild
                  >
                    <Link
                      href={`/${locale}/manage/lessons/${id}/edit?course_id=${courseId}`}
                    >
                      <Edit className="h-5 w-5 mr-2" />
                      {t("edit")}
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            <TabsContent value="lesson" className="space-y-6">
              <Card className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <CardHeader className="bg-gray-50 border-b border-gray-100 p-8">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">
                        {t("lessonDescription")}
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        {t("lessonDescriptionDetail")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {lesson.description}
                      </p>
                    </div>

                    {lesson.dependencies?.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                        <h4 className="font-semibold text-amber-900 mb-3">
                          {t("dependencies")}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {lesson.dependencies.map((d: any) => (
                            <Badge
                              key={d.id}
                              className="bg-amber-100 text-amber-700 border-none px-3 py-1 rounded-lg"
                            >
                              {d.title}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lecture Content */}
                    {lecture && (
                      <div className="border-t border-gray-200 pt-6">
                        <div
                          className="flex items-center gap-3 mb-6 cursor-pointer rounded-xl transition-all border border-orange-200 bg-orange-50/60 hover:bg-orange-100/80 px-4 py-3 shadow-sm active:scale-[0.98] focus:outline-none flex-wrap"
                          tabIndex={0}
                          role="button"
                          aria-label={`${t("goToTeachingAriaPrefix")}: ${lecture.name
                            }`}
                          onClick={async () => {
                            if (loadingTeachingMode) return;
                            // Copy logic từ nút "Chế độ giảng dạy"
                            setLoadingTeachingMode(true);
                            try {
                              if (
                                lesson &&
                                (lesson.homeworks?.length > 0 ||
                                  lesson.exams?.length > 0)
                              ) {
                                // Chuẩn bị dữ liệu đầy đủ để truyền sang preview mode
                                const assignmentData = {
                                  lessonTitle: lesson.title,
                                  homeworks: lesson.homeworks.map(
                                    (hw: any) => ({
                                      ...hw,
                                      questions: [], // Không cần truyền danh sách câu hỏi
                                      questionCount: hw.total_questions || 0,
                                    })
                                  ),
                                  exams: lesson.exams.map((ex: any) => ({
                                    ...ex,
                                    questions: [], // Không cần truyền danh sách câu hỏi
                                    questionCount: ex.total_questions || 0,
                                  })),
                                  timestamp: Date.now(),
                                };
                                sessionStorage.setItem(
                                  `lessonAssignments_${id}`,
                                  JSON.stringify(assignmentData)
                                );
                              }
                              if (
                                lesson.lesson_plans &&
                                lesson.lesson_plans.length > 0
                              ) {
                                window.open(
                                  `/${locale}/manage/lecture-bank/preview/${lesson.lesson_plans[0].id}?lesson_id=${id}&course_id=${courseId}`,
                                  "_blank"
                                )
                              }
                            } catch (error) {
                              console.error(
                                "Error preparing teaching mode:",
                                error
                              );
                            } finally {
                              setLoadingTeachingMode(false);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ")
                              e.currentTarget.click();
                          }}
                        >
                          <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center">
                            <Play className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {t("lectureLabel")}: {lecture.name}
                            </h3>
                            <p className="text-gray-600">
                              {lecture.description}
                            </p>
                            <span className="mt-1 text-xs text-orange-700 font-medium flex items-center gap-1">
                              <Monitor className="w-4 h-4" />
                              {t("tapToTeach")}
                            </span>
                          </div>
                        </div>
                        <div className="grid gap-4">
                          {lectureParts.length > 0 ? (
                            lectureParts.map((part) => (
                              <div
                                key={part.id}
                                className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-orange-300 hover:bg-orange-50/30 transition-all duration-200"
                              >
                                <div className="flex items-start md:justify-between mb-3 flex-wrap justify-center">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 mb-2">
                                      {part.title}
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-3">
                                      {part.guide_teacher}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      <span className="bg-gray-100 px-2 py-1 rounded-lg">
                                        {part.file_type}
                                      </span>
                                      <span className="bg-gray-100 px-2 py-1 rounded-lg">
                                        {part.time} {t("minutes")}
                                      </span>
                                    </div>
                                  </div>
                                  {part.link && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="rounded-xl mt-5 md:m-0"
                                      asChild
                                    >
                                      <a
                                        href={part.link}
                                        target="_blank"
                                        rel="noopener"
                                      >
                                        <Download className="h-4 w-4 mr-2" />
                                        {t("document")}
                                      </a>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-gray-400">
                              <Play className="h-12 w-12 mx-auto mb-3 opacity-50" />
                              <p>{t("noLectureParts")}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assignments" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {lesson.homeworks && lesson.homeworks.length > 0 ? (
                  lesson.homeworks
                    .sort((a: any, b: any) => {
                      const numA =
                        parseInt(a.name.replace(/^\D+/g, ""), 10) || 0;
                      const numB =
                        parseInt(b.name.replace(/^\D+/g, ""), 10) || 0;
                      return numA - numB;
                    })
                    .map((assignment: any) => (
                      <Card
                        key={assignment.id}
                        className="bg-white rounded-3xl border border-gray-200 hover:border-orange-300 hover:shadow-xl transition-all duration-300 group flex flex-col h-full cursor-pointer"
                      >
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                              <FileText className="h-6 w-6 text-orange-600" />
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {Boolean(assignment.is_assigned) && (
                                <Badge className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
                                  ✓ {t("assigned")}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <CardTitle className="text-xl font-bold text-gray-900 line-clamp-2 leading-snug mb-2">
                            {assignment.name}
                          </CardTitle>
                          <CardDescription className="text-sm text-gray-600 line-clamp-2">
                            {assignment.description}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="flex-1 pb-4">
                          <div className="space-y-4">
                            <div className="bg-orange-50 rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                <span className="text-xs font-medium text-orange-700 uppercase tracking-wider">
                                  {t("homeworkLabel")}
                                </span>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between flex-wrap">
                                  <span className="text-gray-600">
                                    {t("type")}:
                                  </span>
                                  <span className="font-medium text-gray-700">
                                    {assignment.question_form === "write"
                                      ? t("write")
                                      : assignment.question_form === "question"
                                        ? t("question")
                                        : ""}
                                  </span>
                                </div>
                                <div className="flex justify-between flex-wrap">
                                  <span className="text-gray-600">
                                    {t("createdAt")}:
                                  </span>
                                  <span className="font-medium text-gray-700">
                                    {new Date(
                                      assignment.created_at
                                    ).toLocaleDateString("vi-VN")}
                                  </span>
                                </div>
                                <div className="flex justify-between flex-wrap">
                                  <span className="text-gray-600">
                                    {t("questionCount")}:
                                  </span>
                                  <span className="font-semibold text-gray-900">
                                    {assignment.total_questions || 0}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>

                        <CardFooter className="pt-0 pb-6 px-6 mt-auto">
                          <div className="w-full space-y-3">
                            {/* Hàng 1: Nút Giao bài / Hoàn tác giao bài */}
                            {canAssignInLesson && courseId && (
                              <Button
                                size="sm"
                                className={`w-full rounded-xl ${Boolean(assignment.is_assigned)
                                    ? "bg-red-600 hover:bg-red-700 text-white"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                  }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAssignHomework(
                                    assignment.id,
                                    !Boolean(assignment.is_assigned)
                                  );
                                }}
                                disabled={assigningHomeworks.has(assignment.id)}
                              >
                                {assigningHomeworks.has(assignment.id) ? (
                                  Boolean(assignment.is_assigned) ? (
                                    <>
                                      <RotateCcw className="h-4 w-4 mr-2" />
                                      {t("undoing")}
                                    </>
                                  ) : (
                                    <>
                                      <Send className="h-4 w-4 mr-2" />
                                      {t("assigning")}
                                    </>
                                  )
                                ) : Boolean(assignment.is_assigned) ? (
                                  <>
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    {t("undoAssign")}
                                  </>
                                ) : (
                                  <>
                                    <Send className="h-4 w-4 mr-2" />
                                    {t("assign")}
                                  </>
                                )}
                              </Button>
                            )}

                            {/* Hàng 3: Nút Xem và Chấm điểm */}
                            {canPreviewAssignment && (
                              <div className="flex gap-2 flex-wrap">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 rounded-xl border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
                                  asChild
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Link
                                    href={`/${locale}/manage/lessons/${id}/homework/${assignment.id}`}
                                    target="_blank"
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    {t("view")}
                                  </Link>
                                </Button>
                                {canGradeAssignments && (
                                  <Button
                                    size="sm"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const urlParams = new URLSearchParams(
                                        window.location.search
                                      );
                                      const courseId = urlParams.get("course_id");
                                      window.location.href = `/${locale}/teacher/lessons/${id}/homework/${assignment.id
                                        }${courseId ? `?course_id=${courseId}` : ""
                                        }`;
                                    }}
                                  >
                                    <ClipboardCheck className="h-4 w-4 mr-2" />
                                    {t("grade")}
                                  </Button>
                                )}
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="flex-1 rounded-xl border-green-200 hover:border-green-300 hover:bg-green-50 hover:text-green-600"
                                asChild
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Link
                                  href={`/${locale}/manage/assignments/do-homework/${assignment.id}?lessonId=${lesson.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="whitespace-pre-line h-auto md:h-9 py-2"
                                >
                                  <User className="h-4 w-4 mr-2" />
                                  {t("viewStudent")}
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardFooter>
                      </Card>
                    ))
                ) : (
                  <div className="col-span-full text-center py-16">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Không có bài tập
                    </h3>
                    <p className="text-gray-500">
                      Chưa có bài tập nào được tạo cho bài học này.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="exercises" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {lesson.exercises && lesson.exercises.length > 0 ? (
                  lesson.exercises.map((exercise: any) => (
                    <Card
                      key={exercise.id}
                      className="bg-white rounded-3xl border border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300 group flex flex-col h-full cursor-pointer"
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <PenTool className="h-6 w-6 text-purple-600" />
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {Boolean(exercise.is_assigned) && (
                              <Badge className="bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full font-medium">
                                ✓ {t("assigned")}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <CardTitle className="text-xl font-bold text-gray-900 line-clamp-2 leading-snug mb-2">
                          {exercise.name}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600 line-clamp-2">
                          {exercise.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="flex-1 pb-4">
                        <div className="space-y-4">
                          <div className="bg-purple-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span className="text-xs font-medium text-purple-700 uppercase tracking-wider">
                                {t("exerciseLabel")}
                              </span>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  {t("time")}:
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {exercise.time_limit} {t("minutes")}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  {t("createdAt")}:
                                </span>
                                <span className="font-medium text-gray-700">
                                  {new Date(
                                    exercise.created_at
                                  ).toLocaleDateString("vi-VN")}
                                </span>
                              </div>
                              {exercise.deadline && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    {t("deadline")}:
                                  </span>
                                  <span className="font-medium text-red-600">
                                    {new Date(
                                      exercise.deadline
                                    ).toLocaleDateString("vi-VN")}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  {t("questionCount")}:
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {exercise.total_questions || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter className="pt-0 pb-6 px-6 mt-auto">
                        <div className="w-full space-y-3">
                          {/* Hàng 1: Nút Giao bài / Hoàn tác giao bài */}
                          {canAssignInLesson && courseId && (
                            <Button
                              size="sm"
                              className={`w-full rounded-xl ${Boolean(exercise.is_assigned)
                                  ? "bg-red-600 hover:bg-red-700 text-white"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAssignExercise(
                                  exercise.id,
                                  !Boolean(exercise.is_assigned)
                                );
                              }}
                              disabled={assigningExercises.has(exercise.id)}
                            >
                              {assigningExercises.has(exercise.id)
                                ? Boolean(exercise.is_assigned)
                                  ? t("undoing")
                                  : t("assigning")
                                : Boolean(exercise.is_assigned)
                                  ? t("undoAssign")
                                  : t("assign")}
                            </Button>
                          )}

                          {/* Hàng 3: Nút Xem cho teacher và Chấm điểm */}
                          {canPreviewAssignment && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 rounded-xl border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600"
                                asChild
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Link
                                  href={`/${locale}/manage/lessons/${id}/exercise/${exercise.id}`}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  {t("view")}
                                </Link>
                              </Button>
                              {canGradeAssignments && (
                                <Button
                                  size="sm"
                                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const urlParams = new URLSearchParams(
                                      window.location.search
                                    );
                                    const courseId = urlParams.get("course_id");
                                    window.location.href = `/${locale}/teacher/lessons/${id}/exercise/${exercise.id
                                      }${courseId ? `?course_id=${courseId}` : ""}`;
                                  }}
                                >
                                  {t("grade")}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-16">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <PenTool className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {t("noTestsTitle")}
                    </h3>
                    <p className="text-gray-500">{t("noTestsDescription")}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="tests" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {lesson.exams && lesson.exams.length > 0 ? (
                  lesson.exams.map((test: any) => (
                    <Card
                      key={test.id}
                      className="bg-white rounded-3xl border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 group flex flex-col h-full cursor-pointer"
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <PenTool className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {Boolean(test.is_assigned) && (
                              <Badge className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
                                ✓ {t("assigned")}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <CardTitle className="text-xl font-bold text-gray-900 line-clamp-2 leading-snug mb-2">
                          {test.name}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600 line-clamp-2">
                          {test.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="flex-1 pb-4">
                        <div className="space-y-4">
                          <div className="bg-blue-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-xs font-medium text-blue-700 uppercase tracking-wider">
                                {t("testLabel")}
                              </span>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  {t("time")}:
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {test.time_limit} {t("minutes")}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  {t("createdAt")}:
                                </span>
                                <span className="font-medium text-gray-700">
                                  {new Date(test.created_at).toLocaleDateString(
                                    "vi-VN"
                                  )}
                                </span>
                              </div>
                              {test.deadline && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    {t("deadline")}:
                                  </span>
                                  <span className="font-medium text-red-600">
                                    {new Date(test.deadline).toLocaleDateString(
                                      "vi-VN"
                                    )}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  {t("questionCount")}:
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {test.total_questions || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter className="pt-0 pb-6 px-6 mt-auto">
                        <div className="w-full space-y-3">
                          {/* Hàng 1: Nút Giao bài / Hoàn tác giao bài */}
                          {canAssignInLesson && courseId && (
                            <Button
                              size="sm"
                              className={`w-full rounded-xl ${Boolean(test.is_assigned)
                                  ? "bg-red-600 hover:bg-red-700 text-white"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAssignExam(
                                  test.id,
                                  !Boolean(test.is_assigned)
                                );
                              }}
                              disabled={assigningExams.has(test.id)}
                            >
                              {assigningExams.has(test.id) ? (
                                Boolean(test.is_assigned) ? (
                                  <>
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    {t("undoing")}
                                  </>
                                ) : (
                                  <>
                                    <Send className="h-4 w-4 mr-2" />
                                    {t("assigning")}
                                  </>
                                )
                              ) : Boolean(test.is_assigned) ? (
                                <>
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  {t("undoAssign")}
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-2" />
                                  {t("assign")}
                                </>
                              )}
                            </Button>
                          )}

                          {/* Hàng 3: Nút Xem cho teacher và Chấm điểm */}
                          {canPreviewAssignment && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 rounded-xl border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                                asChild
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Link
                                  href={`/${locale}/manage/lessons/${id}/exam/${test.id}`}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  {t("view")}
                                </Link>
                              </Button>
                              {canGradeAssignments && (
                                <Button
                                  size="sm"
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const urlParams = new URLSearchParams(
                                      window.location.search
                                    );
                                    const courseId = urlParams.get("course_id");
                                    window.location.href = `/${locale}/teacher/lessons/${id}/exam/${test.id
                                      }${courseId ? `?course_id=${courseId}` : ""}`;
                                  }}
                                >
                                  <ClipboardCheck className="h-4 w-4 mr-2" />
                                  {t("grade")}
                                </Button>
                              )}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="flex-1 rounded-xl border-green-200 hover:border-green-300 hover:bg-green-50 hover:text-green-600"
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Link
                                href={`/${locale}/manage/assignments/do/${test.id}?lessonId=${lesson.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <User className="h-4 w-4 mr-2" />
                                {t("viewStudent")}
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-16">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <PenTool className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {t("noTestsTitle")}
                    </h3>
                    <p className="text-gray-500">{t("noTestsDescription")}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="vocabularies" className="space-y-6">
              <div className="grid grid-cols-1 gap-8">
                {/* Xem từ vựng - chỉ dành cho giáo viên */}
                <Card className="bg-white rounded-3xl border border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300 group cursor-pointer">
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:bg-purple-200 transition-colors mb-4">
                      <BookOpen className="h-6 w-6 text-purple-600" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                      Từ vựng bài học
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Xem danh sách từ vựng, nghĩa và phiên âm của bài học
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
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 pb-6 px-6">
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                      onClick={openVocabularyViewer}
                      disabled={loadingVocabularies}
                    >
                      {loadingVocabularies ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang tải từ vựng...
                        </>
                      ) : lessonVocabularies.length > 0 ? (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Xem từ vựng
                        </>
                      ) : (
                        "Chưa có từ vựng"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Vocabulary Viewer Modal for Teacher */}
        {showVocabViewer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded-3xl shadow-xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Từ vựng bài học
                    </h2>
                    <p className="text-gray-500">
                      Tổng cộng: {lessonVocabularies.length} từ vựng
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-2xl"
                  onClick={() => setShowVocabViewer(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Vocabulary List */}
              {lessonVocabularies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {lessonVocabularies.map((item, index) => {
                    const vocab = item.vocabulary || item;
                    return (
                      <Card
                        key={index}
                        className="bg-gray-50 border border-gray-200 rounded-2xl p-6"
                      >
                        <div className="space-y-4">
                          {/* Word */}
                          <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-gray-900">
                              {vocab.word}
                            </h3>
                            <Button
                              variant="outline"
                              size="icon"
                              className="rounded-full"
                              onClick={() => speakText(vocab.word, "en-US")}
                              title="Nghe phát âm"
                            >
                              <Volume2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Phonetic */}
                          {vocab.phonetic && (
                            <p className="text-lg text-gray-600 font-medium">
                              /{vocab.phonetic}/
                            </p>
                          )}

                          {/* Translation/Meaning */}
                          <div className="space-y-2">
                            {vocab.translation && (
                              <p className="text-gray-800 font-medium">
                                <span className="text-gray-600">Nghĩa:</span>{" "}
                                {vocab.translation}
                              </p>
                            )}
                            {vocab.meaning &&
                              vocab.meaning !== vocab.translation && (
                                <p className="text-gray-800">
                                  <span className="text-gray-600">
                                    Định nghĩa:
                                  </span>{" "}
                                  {vocab.meaning}
                                </p>
                              )}
                          </div>

                          {/* Example */}
                          {vocab.example && (
                            <div className="bg-blue-50 rounded-xl p-4">
                              <p className="text-gray-600 text-sm font-medium mb-1">
                                Ví dụ:
                              </p>
                              <p className="text-gray-800 italic">
                                {vocab.example}
                              </p>
                            </div>
                          )}

                          {/* Level */}
                          {vocab.level && (
                            <Badge className="w-fit bg-purple-100 text-purple-700">
                              Level: {vocab.level}
                            </Badge>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Không có từ vựng
                  </h3>
                  <p className="text-gray-500">
                    Bài học này chưa có từ vựng nào được thêm.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </RoleBasedHeaderSidebar>
  );
}
