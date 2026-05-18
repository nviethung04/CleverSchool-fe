"use client";

import type React from "react";
import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/dashboard-header";
import { LearningPath } from "@/components/learning-path";
import Image from "next/image";
import { Link } from "@/lib/i18n/routing";
import { useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  LucideArrowLeft,
  LucideBookOpen,
  LucideHeadphones,
  LucideCalendar,
  LucideCheckCircle,
  LucidePlayCircle,
  LucideFileText,
  LucideDownload,
  LucideBarChart2,
  LucideLock,
  Trophy,
  TrendingUp,
  Target,
  Award,
  Clock,
  Filter,
  Star,
  BarChart3,
  Eye,
  ChevronRight,
  MessageSquare,
  MessageCircle,
} from "lucide-react";
import { GetCourseDetail, GetCourseScores } from "@/lib/api/courses";
import { useAuth } from "@/lib/context/auth-context";
import { useSetting } from "@/hooks/use-setting";

// Hàm ép giá trị về string an toàn
function safeString(val: any, fallback = ""): string {
  if (!val) return fallback;
  if (Array.isArray(val)) return safeString(val[0], fallback);
  if (typeof val === "object") return val.title || val.name || fallback;
  return String(val);
}

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const t = useTranslations("courseDetail");
  const { id: courseId, locale } = use(params);
  const searchParams = useSearchParams();
  const [course, setCourse] = useState<any>(null);
  const [courseScores, setCourseScores] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scoresLoading, setScoresLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("course");
  const [expandedChapters, setExpandedChapters] = useState<{
    [id: string]: boolean;
  }>({});
  const toggleExpand = (id: string) => {
    setExpandedChapters((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const { user } = useAuth();
  const { isEnabled: isChatCourseEnabled } = useSetting("chat_course");
  useEffect(() => {
    const loadCourseData = async () => {
      try {
        if (typeof window !== "undefined") {
          const cached = sessionStorage.getItem("courseDetail");
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (parsed && parsed.id?.toString() === courseId?.toString()) {
                setCourse(parsed);
                setLoading(false);
              }
            } catch {}
          }
        }

        // Load course details
        const courseRes = await GetCourseDetail(courseId);
        setCourse(courseRes.data);
        setLoading(false);

        // Load course scores
        try {
          const scoresRes = await GetCourseScores(courseId);
          setCourseScores(scoresRes.data);
        } catch (error) {
          console.error("Error loading course scores:", error);
          setCourseScores(null);
        } finally {
          setScoresLoading(false);
        }
      } catch (error) {
        console.error("Error loading course data:", error);
        setLoading(false);
        setScoresLoading(false);
      }
    };

    loadCourseData();
  }, [courseId]);

  // Kiểm tra query parameter để set active tab
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "scores") {
      setActiveTab("scores");
    } else if (tab === "path") {
      setActiveTab("path");
    } else {
      setActiveTab("course");
    }
  }, [searchParams]);

  // Chuyển đổi dữ liệu từ API thành format cho biểu đồ
  const scoreChartData = courseScores?.exam_ressults
    ? courseScores.exam_ressults
        .filter((exam: any) => exam.score > 0 && exam.date) // Lọc những bài đã có điểm và ngày
        .map((exam: any, index: number) => {
          // Chuyển đổi định dạng ngày từ "10/07/2025" thành Date object
          const dateStr = exam.date;
          let formattedDate = "";
          if (dateStr) {
            const [day, month, year] = dateStr.split("/");
            formattedDate = `${day}/${month}`;
          }
          return {
            date: formattedDate || `Bài ${index + 1}`,
            score: parseFloat(exam.score),
            lesson: exam.exam || `Bài ${index + 1}`,
          };
        })
        .sort((a: any, b: any) => {
          // Sắp xếp theo ngày nếu có
          if (a.date.includes("/") && b.date.includes("/")) {
            const [dayA, monthA] = a.date.split("/");
            const [dayB, monthB] = b.date.split("/");
            return (
              new Date(`2025-${monthA}-${dayA}`).getTime() -
              new Date(`2025-${monthB}-${dayB}`).getTime()
            );
          }
          return 0;
        })
    : [];

  // Chuyển đổi dữ liệu từ API thành format cho bảng điểm
  const detailedScores = courseScores?.exam_ressults
    ? courseScores.exam_ressults.map((exam: any) => ({
        id: exam.id,
        lessonName: exam.lesson || "Bài học",
        testName: exam.exam || "Bài kiểm tra",
        date: exam.date || new Date().toISOString(), // Fallback nếu không có date
        score: exam.score > 0 ? parseFloat(exam.score) : null,
        maxScore: exam.max_score || 10,
        status:
          exam.status === "success"
            ? "completed"
            : exam.score > 0
            ? "completed"
            : "pending",
        duration: exam.exam_time
          ? `${exam.exam_time} phút`
          : exam.time
          ? `${exam.time} phút`
          : "N/A",
      }))
    : [];

  // Tính toán thống kê từ dữ liệu thực
  const completedTests = detailedScores.filter(
    (score: any) => score.status === "completed"
  ).length;
  const totalTests = detailedScores.length;
  const averageScore =
    completedTests > 0
      ? detailedScores
          .filter((score: any) => score.score !== null)
          .reduce((sum: number, score: any) => sum + score.score, 0) /
        completedTests
      : 0;
  const highestScore =
    completedTests > 0
      ? Math.max(
          ...detailedScores
            .filter((score: any) => score.score !== null)
            .map((score: any) => score.score)
        )
      : 0;
  const progressPercentage =
    totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <div>{t("loadingCourse")}</div>
        </main>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="text-red-500">{t("notFound")}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Course Header */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2">
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <div className="overflow-hidden">
                <div className="relative w-full md:w-64 h-48 md:float-left md:mr-6 mb-6 md:mb-0">
                  <Image
                    src={course.image || "/placeholder.svg"}
                    alt={safeString(course.name, t("courseNameFallback"))}
                    fill
                    className="object-cover rounded-xl"
                  />
                  <Badge
                    variant="outline"
                    className="absolute top-2 right-2 bg-Clever School-blue text-white"
                  >
                    {safeString(course.subject, t("subjectFallback"))}
                  </Badge>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2 flex-wrap">
                    {(() => {
                      const name = safeString(
                        course.name,
                        t("courseNameFallback")
                      );
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
                  <p className="text-gray-600 mb-4">
                    {safeString(course.description)}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {course.level && (
                      <Badge
                        className={
                          safeString(course.level) === "easy"
                            ? "bg-green-100 text-green-800"
                            : safeString(course.level) === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {safeString(course.level).charAt(0).toUpperCase() +
                          safeString(course.level).slice(1)}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="text-xs flex items-center gap-1"
                    >
                      <LucideCalendar className="h-3 w-3" />
                      {safeString(course.duration)} {t("weeks")}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs flex items-center gap-1"
                    >
                      <LucideBookOpen className="h-3 w-3" />
                      {/* Tổng số bài học = tổng lessons của tất cả chapters */}
                      {Array.isArray(course.chapters)
                        ? course.chapters.reduce(
                            (sum: number, ch: any) =>
                              sum +
                              (Array.isArray(ch.lessons)
                                ? ch.lessons.length
                                : 0),
                            0
                          )
                        : 0}{" "}
                      {t("lessonsUnit")}
                    </Badge>
                    {course.type && (
                      <Badge
                        variant="outline"
                        className="text-xs flex items-center gap-1"
                      >
                        {safeString(course.type) === "listening" ? (
                          <LucideHeadphones className="h-3 w-3" />
                        ) : (
                          <LucideBookOpen className="h-3 w-3" />
                        )}
                        {safeString(course.type) === "listening"
                          ? t("skills.listening")
                          : safeString(course.type) === "speaking"
                          ? t("skills.speaking")
                          : safeString(course.type) === "reading"
                          ? t("skills.reading")
                          : t("skills.writing")}
                      </Badge>
                    )}
                  </div>
                  {/* Nếu có progress thì hiển thị, còn không thì bỏ */}
                  {typeof course.progress !== "undefined" && (
                    <div className="mb-4 clear-left">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{t("progressTitle")}</span>
                        <span>{safeString(course.progress)}</span>
                      </div>
                      <Progress
                        value={Number(course.progress)}
                        className="h-2 bg-gray-100"
                      >
                        <div
                          className="h-full bg-Clever School-blue rounded-full animated-progress-bar"
                          style={
                            {
                              "--progress-width": `${safeString(
                                course.progress
                              )}%`,
                            } as React.CSSProperties
                          }
                        ></div>
                      </Progress>
                    </div>
                  )}
                </div>
                <div className="clear-both"></div>
              </div>
            </div>
          </div>

          <div>
            <Card className="card-kid border-Clever School-green h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LucideFileText className="h-5 w-5 text-Clever School-green" />
                  {t("courseInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">
                      {t("target")}
                    </h3>
                    <p className="font-bold">
                      {safeString(course.target, t("notUpdated"))}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium text-sm text-gray-500">
                      {t("level")}
                    </h3>
                    {course.level && (
                      <Badge
                        className={
                          safeString(course.level) === "easy"
                            ? "bg-green-100 text-green-800"
                            : safeString(course.level) === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {safeString(course.level).charAt(0).toUpperCase() +
                          safeString(course.level).slice(1)}
                      </Badge>
                    )}
                  </div>

                  {course.type && (
                    <div>
                      <h3 className="font-medium text-sm text-gray-500">
                        {t("skills.title")}
                      </h3>
                      <p className="font-bold flex items-center gap-2">
                        {safeString(course.type) === "listening" ? (
                          <LucideHeadphones className="h-4 w-4" />
                        ) : safeString(course.type) === "speaking" ? (
                          <LucideHeadphones className="h-4 w-4" />
                        ) : (
                          <LucideBookOpen className="h-4 w-4" />
                        )}
                        {safeString(course.type) === "listening"
                          ? t("skills.listening")
                          : safeString(course.type) === "speaking"
                          ? t("skills.speaking")
                          : safeString(course.type) === "reading"
                          ? t("skills.reading")
                          : t("skills.writing")}
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="font-medium text-sm text-gray-500">
                      {t("duration")}
                    </h3>
                    <p className="font-bold">
                      {course.duration
                        ? `${course.duration} ${t("weeks")}`
                        : t("notUpdated")}
                      {course.start_date && course.end_date && (
                        <span className="text-xs text-gray-500">
                          {" "}
                          (
                          {t("fromTo", {
                            from: course.start_date,
                            to: course.end_date,
                          })}
                          )
                        </span>
                      )}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium text-sm text-gray-500">
                      {t("lessonsCount")}
                    </h3>
                    <p className="font-bold">
                      {Array.isArray(course.chapters)
                        ? course.chapters.reduce(
                            (sum: number, ch: any) =>
                              sum +
                              (Array.isArray(ch.lessons)
                                ? ch.lessons.length
                                : 0),
                            0
                          )
                        : 0}{" "}
                      {t("lessonsUnit")}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium text-sm text-gray-500">
                      {t("teacher")}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Image
                        src={course.teacher?.avatar || "/avatar-kid.png"}
                        alt={course.teacher?.name || "Teacher"}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div>
                        <p className="font-bold">
                          {safeString(course.teacher?.name, t("notUpdated"))}
                        </p>
                        <p className="text-xs text-gray-500">
                          {course.teacher?.description || t("teacherRole")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Course Content */}
        <div className="mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 w-full bg-white flex shadow-none border-none h-fit">
              <TabsTrigger
                value="course"
                className="px-6 py-2.5 transition-all font-medium border-b-2 border-transparent
        data-[state=active]:text-[#0066CC] data-[state=active]:border-[#0066CC] data-[state=active]:font-bold
        data-[state=inactive]:text-gray-700 data-[state=inactive]:font-medium"
                style={{ borderRadius: 0 }}
              >
                {t("tab.course")}
              </TabsTrigger>

              {isChatCourseEnabled && (
                <TabsTrigger
                  value="discussion"
                  className="px-6 py-2.5 transition-all font-medium border-b-2 border-transparent
        data-[state=active]:text-[#0066CC] data-[state=active]:border-[#0066CC] data-[state=active]:font-bold
        data-[state=inactive]:text-gray-700 data-[state=inactive]:font-medium flex items-center gap-2"
                  style={{ borderRadius: 0 }}
                >
                  <MessageSquare className="w-4 h-4" />
                  Thảo luận
                </TabsTrigger>
              )}

              {/* <TabsTrigger
                value="path"
                className="px-6 py-2.5 transition-all font-medium border-b-2 border-transparent
        data-[state=active]:text-[#0066CC] data-[state=active]:border-[#0066CC] data-[state=active]:font-bold
        data-[state=inactive]:text-gray-700 data-[state=inactive]:font-medium"
                style={{ borderRadius: 0 }}
              >
                Lộ trình học tập
              </TabsTrigger> */}
              <TabsTrigger
                value="scores"
                className="px-6 py-2.5 transition-all font-medium border-b-2 border-transparent
        data-[state=active]:text-[#0066CC] data-[state=active]:border-[#0066CC] data-[state=active]:font-bold
        data-[state=inactive]:text-gray-700 data-[state=inactive]:font-medium"
                style={{ borderRadius: 0 }}
              >
                {t("tab.scores")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="course">
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-6">
                  {t("courseContent")}
                </h2>

                <div className="space-y-6">
                  {Array.isArray(course.chapters) &&
                  course.chapters.length > 0 ? (
                    course.chapters.map((chapter: any, index: number) => (
                      <Card
                        key={chapter.id}
                        className="border-2 border-Clever School-blue rounded-2xl overflow-hidden bg-Clever School-blue"
                      >
                        <CardHeader className="bg-Clever School-blue rounded-t-2xl px-6 py-4 border-none">
                          <div className="flex flex-row justify-between items-start gap-3">
                            <CardTitle className="text-lg text-white font-semibold flex items-center gap-2 flex-1">
                              {(() => {
                                const name = safeString(
                                  chapter.title,
                                  t("chapter")
                                );
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
                                      <span className="inline-block bg-white text-Clever School-blue border border-Clever School-blue rounded-full px-3 py-1 text-base font-semibold whitespace-nowrap ml-2">
                                        {badge}
                                      </span>
                                    )}
                                  </>
                                );
                              })()}
                            </CardTitle>
                            <Badge
                              variant="outline"
                              className="bg-white text-Clever School-blue font-semibold flex-shrink-0"
                            >
                              {Array.isArray(chapter.lessons)
                                ? chapter.lessons.length
                                : 0}{" "}
                              {t("lessonsUnit")}
                            </Badge>
                          </div>
                          {chapter.description && (
                            <div className="mt-2 text-white text-sm">
                              <div
                                className={
                                  expandedChapters[chapter.id]
                                    ? "whitespace-pre-line"
                                    : "whitespace-pre-line line-clamp-2"
                                }
                              >
                                {chapter.description}
                              </div>
                              {chapter.description.split("\n").length > 2 ||
                              chapter.description.length > 120 ? (
                                !expandedChapters[chapter.id] ? (
                                  <button
                                    className="mt-1 text-xs underline text-white font-semibold"
                                    onClick={() => toggleExpand(chapter.id)}
                                    type="button"
                                  >
                                    {t("seeMore")}
                                  </button>
                                ) : (
                                  <button
                                    className="mt-1 text-xs underline text-white font-semibold"
                                    onClick={() => toggleExpand(chapter.id)}
                                    type="button"
                                  >
                                    {t("collapse")}
                                  </button>
                                )
                              ) : null}
                            </div>
                          )}
                        </CardHeader>
                        <CardContent className="pt-4 bg-white">
                          <div className="space-y-3">
                            {Array.isArray(chapter.lessons) &&
                            chapter.lessons.length > 0 ? (
                              chapter.lessons.map(
                                (lesson: any, lessonIndex: number) => {
                                  const isCompleted =
                                    lesson.is_complete === true;
                                  const isLocked = false; // giữ nguyên logic khoá nếu có
                                  const lessonId = String(
                                    lesson?.id || lesson?.lesson_id || ""
                                  );
                                  const courseIdValue = String(
                                    course?.id || ""
                                  );
                                  return (
                                    <div
                                      key={lesson.id}
                                      className={`p-3 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 ${
                                        isCompleted
                                          ? "bg-green-50 border-green-200"
                                          : isLocked
                                          ? "bg-gray-50 border-gray-200"
                                          : "border-gray-200"
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div
                                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            isCompleted
                                              ? "bg-green-100"
                                              : isLocked
                                              ? "bg-gray-100"
                                              : "bg-blue-100"
                                          }`}
                                        >
                                          {isCompleted ? (
                                            <LucideCheckCircle className="h-5 w-5 text-green-500" />
                                          ) : isLocked ? (
                                            <LucideLock className="h-5 w-5 text-gray-400" />
                                          ) : (
                                            <LucidePlayCircle className="h-5 w-5 text-blue-500" />
                                          )}
                                        </div>
                                        <div>
                                          <p className="font-medium flex items-center gap-2">
                                            {t("lessonN", {
                                              n: lessonIndex + 1,
                                            })}
                                            :{" "}
                                            {(() => {
                                              const name = safeString(
                                                lesson.title,
                                                "Bài học"
                                              );
                                              const match =
                                                /^(.*?)(\s*\(([^)]+)\))?$/.exec(
                                                  name
                                                );
                                              const mainTitle = match
                                                ? match[1].trim()
                                                : name;
                                              const badge =
                                                match && match[3]
                                                  ? match[3]
                                                  : null;
                                              return (
                                                <>
                                                  {mainTitle}
                                                  {badge &&
                                                    !(
                                                      user?.type === "student"
                                                    ) && (
                                                      <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-3 py-1 text-base font-semibold whitespace-nowrap ml-2">
                                                        {badge}
                                                      </span>
                                                    )}
                                                </>
                                              );
                                            })()}
                                          </p>
                                          {/* <p className="text-xs text-gray-500">
                                            20 phút • Bài học
                                          </p> */}
                                        </div>
                                      </div>
                                      {isCompleted ? (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          asChild
                                          className="border-green-500 text-green-500 gap-2"
                                        >
                                          <Link
                                            href={`/courses/${courseIdValue}/lesson/${lessonId}`}
                                          >
                                            <LucideCheckCircle className="w-4 h-4" />
                                            {t("viewAgain")}
                                          </Link>
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="default"
                                          size="sm"
                                          asChild
                                          className="gap-2"
                                        >
                                          <Link
                                            href={`/courses/${courseIdValue}/lesson/${lessonId}`}
                                          >
                                            <LucidePlayCircle className="w-4 h-4" />
                                            {t("start")}
                                          </Link>
                                        </Button>
                                      )}
                                    </div>
                                  );
                                }
                              )
                            ) : (
                              <div className="text-gray-400 text-sm">
                                {t("noLessons")}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-gray-400 text-sm">
                      {t("noChapters")}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {isChatCourseEnabled && (
              <TabsContent value="discussion">
                <div className="bg-white rounded-3xl shadow-lg p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <MessageSquare className="h-6 w-6 text-blue-600" />
                      Thảo luận khóa học
                    </h2>
                    <Button asChild>
                      <Link href={`/courses/${course.id}/chat`}>
                        Tham gia thảo luận
                      </Link>
                    </Button>
                  </div>

                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      Tham gia thảo luận
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Kết nối với giáo viên và các học viên khác để thảo luận về
                      khóa học
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                      <Button variant="outline" asChild>
                        <Link href={`/courses/${course.id}/chat`}>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Chat nhóm
                        </Link>
                      </Button>
                      <Button variant="outline" disabled>
                        <LucideFileText className="w-4 h-4 mr-2" />
                        Q&A (Sắp có)
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}

            <TabsContent value="path">
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <LucideBarChart2 className="h-6 w-6 text-Clever School-blue" />
                  {t("learningPath")}
                </h2>
                <LearningPath />
              </div>
            </TabsContent>

            <TabsContent value="scores">
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-Clever School-blue" />
                  {t("scores.title")}
                </h2>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm font-medium">
                            {t("scores.tests")}
                          </p>
                          <p className="text-3xl font-bold">{totalTests}</p>
                        </div>
                        <LucideBookOpen className="w-8 h-8 text-blue-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-emerald-100 text-sm font-medium">
                            {t("scores.average")}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-3xl font-bold">
                              {averageScore.toFixed(1)}
                            </p>
                            {averageScore > 0 && (
                              <Badge className="bg-emerald-400 text-emerald-900 hover:bg-emerald-400">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                {averageScore >= 8
                                  ? t("scores.excellent")
                                  : averageScore >= 6.5
                                  ? t("scores.good")
                                  : t("scores.averageLabel")}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <BarChart3 className="w-8 h-8 text-emerald-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-yellow-100 text-sm font-medium">
                            {t("scores.completed")}
                          </p>
                          <p className="text-3xl font-bold">{completedTests}</p>
                          <div className="mt-2">
                            <Progress
                              value={progressPercentage}
                              className="h-2 bg-yellow-400"
                            />
                          </div>
                        </div>
                        <Target className="w-8 h-8 text-yellow-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-sm font-medium">
                            {t("scores.highest")}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-3xl font-bold">
                              {highestScore > 0 ? highestScore.toFixed(1) : "0"}
                            </p>
                            {highestScore > 0 && (
                              <Star className="w-6 h-6 text-yellow-300 fill-current" />
                            )}
                          </div>
                        </div>
                        <Award className="w-8 h-8 text-purple-200" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Progress Chart and Scores Table - Side by Side */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-8">
                  {/* Scores Table - Left Side */}
                  <div className="xl:col-span-7">
                    <Card className="border-0 shadow-xl h-full">
                      <CardHeader className="border-b bg-gray-50/80">
                        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-blue-600" />
                          {t("scores.detailedResults")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        {scoresLoading ? (
                          <div className="p-8 text-center">
                            <div className="text-gray-500">
                              {t("scores.loading")}
                            </div>
                          </div>
                        ) : detailedScores.length === 0 ? (
                          <div className="h-80 flex items-center justify-center">
                            <div className="p-8 text-center">
                              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                              <div className="text-gray-500">
                                {t("scores.empty")}
                              </div>
                              <p className="text-sm text-gray-400 mt-2">
                                {t("scores.emptyHint")}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="max-h-96 overflow-y-auto">
                            <table className="w-full">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  <th className="text-left p-4 font-semibold text-gray-700">
                                    {t("table.test")}
                                  </th>
                                  <th className="text-left p-4 font-semibold text-gray-700">
                                    {t("table.date")}
                                  </th>
                                  <th className="text-left p-4 font-semibold text-gray-700">
                                    {t("table.score")}
                                  </th>
                                  <th className="text-left p-4 font-semibold text-gray-700">
                                    {t("table.status")}
                                  </th>
                                  <th className="text-left p-4 font-semibold text-gray-700">
                                    {t("table.actions")}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {detailedScores.map(
                                  (score: any, index: number) => {
                                    const getStatusColor = (status: string) => {
                                      switch (status) {
                                        case "completed":
                                          return "bg-green-100 text-green-700 border-green-200";
                                        case "in_progress":
                                          return "bg-yellow-100 text-yellow-700 border-yellow-200";
                                        case "pending":
                                          return "bg-gray-100 text-gray-700 border-gray-200";
                                        default:
                                          return "bg-gray-100 text-gray-700 border-gray-200";
                                      }
                                    };

                                    const getStatusIcon = (status: string) => {
                                      switch (status) {
                                        case "completed":
                                          return (
                                            <LucideCheckCircle className="w-4 h-4" />
                                          );
                                        case "in_progress":
                                          return (
                                            <LucidePlayCircle className="w-4 h-4" />
                                          );
                                        case "pending":
                                          return <Clock className="w-4 h-4" />;
                                        default:
                                          return <Clock className="w-4 h-4" />;
                                      }
                                    };

                                    const getStatusText = (status: string) => {
                                      switch (status) {
                                        case "completed":
                                          return t("status.completed");
                                        case "in_progress":
                                          return t("status.inProgress");
                                        case "pending":
                                          return t("status.pending");
                                        default:
                                          return t("status.pending");
                                      }
                                    };

                                    const getScoreColor = (
                                      score: number,
                                      maxScore: number
                                    ) => {
                                      const percentage =
                                        (score / maxScore) * 100;
                                      if (percentage >= 90)
                                        return "text-green-600";
                                      if (percentage >= 80)
                                        return "text-blue-600";
                                      if (percentage >= 70)
                                        return "text-yellow-600";
                                      return "text-red-600";
                                    };

                                    return (
                                      <tr
                                        key={score.id}
                                        className={`border-b hover:bg-gray-50 transition-colors ${
                                          index % 2 === 0
                                            ? "bg-white"
                                            : "bg-gray-50/30"
                                        }`}
                                      >
                                        <td className="p-4">
                                          <div className="font-medium text-gray-900">
                                            {score.testName}
                                          </div>
                                          <div className="text-sm text-gray-500">
                                            {score.lessonName}
                                          </div>
                                        </td>
                                        <td className="p-4">
                                          <div className="flex items-center gap-2 text-gray-600">
                                            <LucideCalendar className="w-4 h-4" />
                                            {score.date &&
                                            score.date !==
                                              new Date().toISOString()
                                              ? // Kiểm tra nếu date có định dạng dd/mm/yyyy
                                                score.date.includes("/")
                                                ? score.date
                                                : new Date(
                                                    score.date
                                                  ).toLocaleDateString("vi-VN")
                                              : t("scores.noDate")}
                                          </div>
                                        </td>
                                        <td className="p-4">
                                          {score.score !== null ? (
                                            <div className="flex items-center gap-2">
                                              <span
                                                className={`text-xl font-bold ${getScoreColor(
                                                  score.score,
                                                  score.maxScore
                                                )}`}
                                              >
                                                {score.score}
                                              </span>
                                              <span className="text-gray-500">
                                                / {score.maxScore}
                                              </span>
                                              <div className="ml-2">
                                                <Progress
                                                  value={
                                                    (score.score /
                                                      score.maxScore) *
                                                    100
                                                  }
                                                  className="w-12 h-2"
                                                />
                                              </div>
                                            </div>
                                          ) : (
                                            <span className="text-gray-400">
                                              -
                                            </span>
                                          )}
                                        </td>
                                        <td className="p-4">
                                          <Badge
                                            className={`${getStatusColor(
                                              score.status
                                            )} flex items-center gap-1 w-fit`}
                                          >
                                            {getStatusIcon(score.status)}
                                            {getStatusText(score.status)}
                                          </Badge>
                                        </td>
                                        <td className="p-4">
                                          {score.status === "completed" ? (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="gap-2 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                                              asChild
                                            >
                                              <Link
                                                href={`/assignments/exam/${score.id}/result`}
                                              >
                                                <Eye className="w-4 h-4" />
                                                {t("actions.viewDetail")}
                                              </Link>
                                            </Button>
                                          ) : score.status === "in_progress" ? (
                                            <Button
                                              variant="default"
                                              size="sm"
                                              className="gap-2 bg-blue-600 hover:bg-blue-700"
                                            >
                                              <LucidePlayCircle className="w-4 h-4" />
                                              {t("actions.continue")}
                                            </Button>
                                          ) : (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="gap-2"
                                              disabled
                                            >
                                              <Clock className="w-4 h-4" />
                                              {t("actions.notOpen")}
                                            </Button>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  }
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Progress Chart - Right Side */}
                  <div className="xl:col-span-5">
                    <Card className="border-0 shadow-xl h-full">
                      <CardHeader className="border-b bg-gray-50/80">
                        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-blue-600" />
                          {t("chart.progressTitle")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        {scoresLoading ? (
                          <div className="h-80 flex items-center justify-center">
                            <div className="text-gray-500">
                              {t("scores.loading")}
                            </div>
                          </div>
                        ) : scoreChartData.length === 0 ? (
                          <div className="h-80 flex items-center justify-center">
                            <div className="text-gray-500 text-center">
                              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                              <p>{t("chart.noData")}</p>
                              <p className="text-sm mt-2">
                                {t("chart.noDataHint")}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="h-80">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={scoreChartData}>
                                  <defs>
                                    <linearGradient
                                      id="colorScore"
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop
                                        offset="5%"
                                        stopColor="#3B82F6"
                                        stopOpacity={0.8}
                                      />
                                      <stop
                                        offset="95%"
                                        stopColor="#3B82F6"
                                        stopOpacity={0.1}
                                      />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#E5E7EB"
                                  />
                                  <XAxis
                                    dataKey="date"
                                    stroke="#6B7280"
                                    fontSize={12}
                                  />
                                  <YAxis
                                    domain={[0, 10]}
                                    stroke="#6B7280"
                                    fontSize={12}
                                  />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: "#fff",
                                      border: "1px solid #E5E7EB",
                                      borderRadius: "8px",
                                      boxShadow:
                                        "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                    }}
                                    formatter={(value: any, name: any) => [
                                      `${value}/10`,
                                      t("chart.scoreLabel"),
                                    ]}
                                    labelFormatter={(label) =>
                                      `${t("chart.dayLabel")}: ${label}`
                                    }
                                  />
                                  <Area
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#3B82F6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorScore)"
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                <span className="font-semibold text-blue-900">
                                  {t("trend.title")}
                                </span>
                              </div>
                              <p className="text-sm text-blue-700">
                                {scoreChartData.length > 0
                                  ? `${t("trend.completedAvg", {
                                      completed: completedTests,
                                      avg: averageScore.toFixed(1),
                                    })} ${
                                      highestScore > 0
                                        ? t("trend.highest", {
                                            score: highestScore.toFixed(1),
                                          })
                                        : ""
                                    }`
                                  : t("trend.empty")}
                              </p>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="chat">
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <MessageCircle className="h-6 w-6 text-Clever School-blue" />
                    Thảo luận khóa học
                  </h2>
                  <Button asChild>
                    <Link href={`/courses/${courseId}/chat`}>
                      Mở chat trong trang mới
                    </Link>
                  </Button>
                </div>

                {/* Embedded Chat Preview */}
                <div className="border rounded-lg h-96 bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">
                      Tham gia thảo luận với giáo viên và các bạn học
                    </p>
                    <Button asChild>
                      <Link href={`/courses/${courseId}/chat`}>
                        Bắt đầu thảo luận
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
