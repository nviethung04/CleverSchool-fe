"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Clock,
  Eye,
  Play,
  BarChart3,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  ListOrdered,
  Filter,
  FileText,
  Users,
  Target,
  NotebookPen, // homework icon
  GraduationCap, // lesson icon
} from "lucide-react";
import type { Week, Course, Exam, Homework } from "@/lib/api/students";
import { DashboardHeader } from "@/components/dashboard-header";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  doHomeworkFromAssignmentsRoute,
  resultHomeworkRoute,
  resultHomeworkStudentRoute,
  reviewResultHomeworkFromAssignmentsStudentRoute,
  doExamFromAssignmentsRoute,
  resultExamRoute,
  reviewResultExamStudentRoute,
  doExerciseFromAssignmentsRoute,
  reviewResultExerciseStudentRoute,
  resultExerciseRoute,
} from "@/lib/utils/route-utils";
import { useAuth } from "@/lib/context/auth-context";

interface AssignmentsPageProps {
  weeks: Week[];
  selectedWeek: Week | null;
  courses: Course[];
  selectedCourseId: string | null;
  courseOptions: Array<{ id: string; name: string }>;
  isLoading: boolean;
  error: string | null;
  onWeekChange: (weekId: string) => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCourseFilterChange?: (courseId: string) => void;
}

export default function AssignmentsPageSimplified({
  weeks,
  selectedWeek,
  courses,
  selectedCourseId,
  courseOptions,
  isLoading,
  error,
  onWeekChange,
  onPreviousWeek,
  onNextWeek,
  onCourseFilterChange,
}: AssignmentsPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const t = useTranslations("assignments");
  const tc = useTranslations();
  const locale = useLocale();
  const [filter, setFilter] = useState<
    "all" | "pending" | "completed" | "overdue"
  >("all");
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [hoveredCourseId, setHoveredCourseId] = useState<string | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<{
    [id: string]: boolean;
  }>({});
  const [filterCourseId, setFilterCourseId] = useState<string | null>(null);

  // Sync local course selection with prop or default to first course
  useEffect(() => {
    const nextId =
      selectedCourseId ||
      (courseOptions && courseOptions.length > 0 ? courseOptions[0].id : null);
    if (nextId && nextId !== filterCourseId) {
      setFilterCourseId(nextId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId, courseOptions]);

  const toggleDescription = (id: string) => {
    setExpandedDescriptions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Tổng hợp tất cả bài tập/kiểm tra từ tất cả khóa học
  const getAllAssignments = () => {
    const assignments: Array<{
      id: string;
      name: string;
      type: "exam" | "homework" | "exercise";
      courseName: string;
      lessonTitle: string;
      status: "pending" | "completed" | "overdue" | "partial";
      deadline?: string;
      progress?: { completed: number; total: number };
      data: Exam | Homework;
      courseImage?: string;
    }> = [];

    courses.forEach((course) => {
      course.lessons.forEach((lesson) => {
        // Thêm bài kiểm tra
        lesson.exams.forEach((exam) => {
          const deadline = new Date(Number.parseInt(exam.deadline) * 1000);
          const now = new Date();
          let status: "pending" | "completed" | "overdue" = "pending";

          if (exam.is_submitted) {
            status = "completed";
          } else if (deadline < now) {
            status = "overdue";
          }

          assignments.push({
            id: exam.id,
            name: exam.name,
            type: "exam",
            courseName: course.name,
            lessonTitle: lesson.title,
            status,
            deadline: exam.deadline,
            data: exam,
            courseImage: course.image,
          });
        });

        // Thêm bài tập
        lesson.exercises?.forEach((exercise) => {
          const deadline = new Date(Number.parseInt(exercise.deadline) * 1000);
          const now = new Date();
          let status: "pending" | "completed" | "overdue" = "pending";

          if (exercise.is_submitted) {
            status = "completed";
          } else if (deadline < now) {
            status = "overdue";
          }

          assignments.push({
            id: exercise.id,
            name: exercise.name,
            type: "exercise",
            courseName: course.name,
            lessonTitle: lesson.title,
            status,
            deadline: exercise.deadline,
            data: exercise,
            courseImage: course.image,
          });
        });

        // Thêm bài tập về nhà
        lesson.homeworks?.forEach((hw) => {
          let status: "pending" | "completed" | "partial" = "pending";

          // Xử lý logic khác nhau dựa vào question_form
          if (hw.question_form === "write") {
            // Với write type: chỉ dựa vào is_submitted
            status = hw.is_submitted ? "completed" : "pending";
          } else {
            // Với question type: dựa vào question_completed
            if (hw.question_completed === hw.total_question) {
              status = "completed";
            } else if (hw.question_completed > 0) {
              status = "partial";
            }
          }

          assignments.push({
            id: hw.id,
            name: hw.name,
            type: "homework",
            courseName: course.name,
            lessonTitle: lesson.title,
            status,
            progress: {
              completed: hw.question_completed,
              total: hw.total_question,
            },
            data: hw,
            courseImage: course.image,
          });
        });
      });
    });

    return assignments;
  };

  // Phân tách bài tập và bài kiểm tra
  const getExams = () => getAllAssignments().filter((a) => a.type === "exam");
  const getHomeworks = () =>
    getAllAssignments().filter((a) => a.type === "homework");

  const filteredExams = getExams().filter((assignment) => {
    switch (filter) {
      case "pending":
        return assignment.status === "pending";
      case "completed":
        return assignment.status === "completed";
      case "overdue":
        return assignment.status === "overdue";
      default:
        return true;
    }
  });

  const filteredHomeworks = getHomeworks().filter((assignment) => {
    switch (filter) {
      case "pending":
        return (
          assignment.status === "pending" || assignment.status === "partial"
        );
      case "completed":
        return assignment.status === "completed";
      case "overdue":
        return assignment.status === "overdue";
      default:
        return true;
    }
  });

  // Hàm render assignment item
  const renderAssignmentItem = (assignment: any) => {
    const {
      type,
      name,
      courseName,
      lessonTitle,
      status,
      progress,
      data,
      courseImage,
    } = assignment;

    const getStatusBadge = () => {
      switch (status) {
        case "completed":
          return (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              {t("status.completed")}
            </Badge>
          );
        case "partial":
          return (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              {t("status.inProgressWithCounts", {
                completed: progress?.completed ?? 0,
                total: progress?.total ?? 0,
              })}
            </Badge>
          );
        case "overdue":
          return (
            <Badge className="bg-red-100 text-red-800 border-red-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              {t("status.overdue")}
            </Badge>
          );
        default:
          return (
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              {t("status.notStarted")}
            </Badge>
          );
      }
    };

    const getActionButton = () => {
      if (type === "exam") {
        const exam = data as Exam;
        if (!exam.is_submitted) {
          return (
            <Button
              size="sm"
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={() =>
                window.open(doExamFromAssignmentsRoute(user, exam.id), "_blank")
              }
            >
              <Play className="h-4 w-4 mr-1" />
              {t("actions.start")}
            </Button>
          );
        } else if (exam.unscored_count > 0) {
          return (
            <Button
              size="sm"
              className="bg-[#EB8922] text-white hover:bg-[#d97a1d]"
              onClick={() => {
                if (user?.type === "student") {
                  const from = "assignments";
                  window.open(
                    `/${locale}/assignments/exam/${exam.id}/review`,
                    "_blank"
                  );
                } else {
                  router.push(`/${locale}/assignments/exam/${exam.id}/review`);
                }
              }}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              {t("actions.review")}
            </Button>
          );
        } else {
          return (
            <Button
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => {
                if (user?.type === "student") {
                  const from = "assignments";
                  window.open(
                    reviewResultExamStudentRoute(user, exam.id, from),
                    "_blank"
                  );
                } else {
                  router.push(resultExamRoute(user, exam.id));
                }
              }}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              {t("actions.viewResult")}
            </Button>
          );
        }
      } else {
        const hw = data as Homework;

        // Xử lý logic khác nhau dựa vào question_form
        if (hw.question_form === "write") {
          // Với write type: chỉ dựa vào is_submitted
          if (hw.is_submitted) {
            return (
              <Button
                size="sm"
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => {
                  if (user?.type === "student") {
                    const from = "assignments";
                    let resultUrl = resultHomeworkStudentRoute(
                      user,
                      hw.id,
                      from
                    );

                    // Thêm courseId parameter
                    const course = courses.find((c) => c.name === courseName);
                    if (course?.id) {
                      resultUrl += `${
                        resultUrl.includes("?") ? "&" : "?"
                      }courseId=${course.id}`;
                    }

                    router.push(resultUrl);
                  } else {
                    let resultUrl = resultHomeworkRoute(user, hw.id);

                    // Thêm courseId parameter
                    const course = courses.find((c) => c.name === courseName);
                    if (course?.id) {
                      resultUrl += `${
                        resultUrl.includes("?") ? "&" : "?"
                      }courseId=${course.id}`;
                    }

                    router.push(resultUrl);
                  }
                }}
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                {t("actions.viewResult")}
              </Button>
            );
          } else {
            return (
              <Button
                size="sm"
                className="bg-green-600 text-white hover:bg-green-700"
                onClick={() => {
                  // Tìm lessonId từ course và lessonTitle để thêm vào URL params
                  const course = courses.find((c) => c.name === courseName);
                  const lesson = course?.lessons.find(
                    (l) => l.title === lessonTitle
                  );
                  const lessonId = lesson?.id;

                  // Tạo URL với lessonId và week trong params
                  const baseUrl = doHomeworkFromAssignmentsRoute(user, hw.id);
                  let urlWithParams = baseUrl;

                  if (lessonId) {
                    urlWithParams += `&lessonId=${lessonId}`;
                  }

                  // Sử dụng week parameter từ URL thay vì selectedWeek.id
                  const weekParam = searchParams.get("week");
                  if (weekParam) {
                    urlWithParams += `&week=${weekParam}`;
                  }

                  router.push(urlWithParams);
                }}
              >
                <Play className="h-4 w-4 mr-1" />
                {t("actions.start")}
              </Button>
            );
          }
        }

        // Với question type: logic hiện tại
        // Nếu homework đã hoàn thành, hiển thị nút "Xem lại"
        if (hw.question_completed === hw.total_question) {
          return (
            <Button
              size="sm"
              className="bg-[#EB8922] text-white hover:bg-[#d97a1d]"
              onClick={() => {
                if (user?.type === "student") {
                  const from = "assignments";
                  let resultUrl = resultHomeworkStudentRoute(user, hw.id, from);

                  // Thêm courseId parameter
                  const course = courses.find((c) => c.name === courseName);
                  if (course?.id) {
                    resultUrl += `${
                      resultUrl.includes("?") ? "&" : "?"
                    }courseId=${course.id}`;
                  }

                  router.push(resultUrl);
                } else {
                  let resultUrl = resultHomeworkRoute(user, hw.id);

                  // Thêm courseId parameter
                  const course = courses.find((c) => c.name === courseName);
                  if (course?.id) {
                    resultUrl += `${
                      resultUrl.includes("?") ? "&" : "?"
                    }courseId=${course.id}`;
                  }

                  router.push(resultUrl);
                }
              }}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              {t("actions.review")}
            </Button>
          );
        }

        // Nếu chưa hoàn thành, hiển thị nút làm bài
        const buttonText =
          hw.question_completed > 0
            ? t("actions.continue")
            : t("actions.start");

        return (
          <Button
            size="sm"
            className={
              hw.question_completed > 0
                ? "bg-[#EB8922] text-white hover:bg-[#d97a1d]" // Tiếp tục làm - màu cam
                : "bg-green-600 text-white hover:bg-green-700" // Làm bài - màu xanh lá
            }
            onClick={() => {
              localStorage.setItem(
                "lastQuestionIdCompleted",
                String(hw.last_question_id_completed)
              );
              // Tìm lessonId từ course và lessonTitle để thêm vào URL params
              const course = courses.find((c) => c.name === courseName);
              const lesson = course?.lessons.find(
                (l) => l.title === lessonTitle
              );
              const lessonId = lesson?.id;

              // Tạo URL với lessonId và week trong params
              const baseUrl = doHomeworkFromAssignmentsRoute(user, hw.id);
              let urlWithParams = baseUrl;

              if (lessonId) {
                urlWithParams += `&lessonId=${lessonId}`;
              }

              // Sử dụng week parameter từ URL thay vì selectedWeek.id
              const weekParam = searchParams.get("week");
              if (weekParam) {
                urlWithParams += `&week=${weekParam}`;
              }

              router.push(urlWithParams);
            }}
          >
            <Play className="h-4 w-4 mr-1" />
            {buttonText}
          </Button>
        );
      }
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          {/* Icon và hình ảnh */}
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
                type === "exam" ? "bg-red-500" : "bg-blue-500"
              }`}
            >
              {type === "exam" ? (
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              ) : (
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              )}
            </div>
            {courseImage && (
              <img
                src={courseImage}
                alt={courseName}
                className="w-8 h-8 rounded object-cover border"
              />
            )}
          </div>

          {/* Thông tin chính */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
              {type === "exam" && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                  {t("examBadge")}
                </span>
              )}
              {type === "homework" && (
                <span
                  className={`text-xs px-2 py-0.5 rounded font-semibold ${
                    data.question_form === "write"
                      ? "bg-purple-100 text-purple-700 border border-purple-300"
                      : "bg-blue-100 text-blue-700 border border-blue-300"
                  }`}
                >
                  {data.question_form === "write"
                    ? t("badges.writeHomework")
                    : t("badges.questionHomework")}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 truncate">
              {courseName} › {lessonTitle}
            </p>
            {type === "exam" && assignment.deadline && (
              <p className="text-xs text-gray-500 mt-1">
                <Clock className="h-3 w-3 inline mr-1" />
                {t("deadline")}: {formatDeadline(assignment.deadline)}
              </p>
            )}
            {type === "homework" &&
              progress &&
              data.question_form === "question" && (
                <p className="text-xs text-gray-500 mt-1">
                  <ListOrdered className="h-3 w-3 inline mr-1" />
                  {t("progressCounts", {
                    completed: progress.completed,
                    total: progress.total,
                  })}
                </p>
              )}
          </div>

          {/* Status và Action */}
          <div className="flex items-center gap-3">
            {getStatusBadge()}
            {getActionButton()}
          </div>
        </div>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const formatDeadline = (timestamp: string) => {
    const date = new Date(Number.parseInt(timestamp) * 1000);
    return date.toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTotalLessons = () => {
    return courses.reduce(
      (total: number, course: Course) => total + course.lessons.length,
      0
    );
  };

  const getTotalExams = () => {
    return courses.reduce(
      (total: number, course: Course) =>
        total +
        course.lessons.reduce(
          (lessonTotal: number, lesson: any) =>
            lessonTotal + lesson.exams.length + lesson.homeworks.length,
          0
        ),
      0
    );
  };

  const getExamStatusColor = (exam: Exam) => {
    if (exam.is_submitted) {
      return exam.unscored_count > 0
        ? "bg-yellow-100 text-yellow-800 border-yellow-200"
        : "bg-green-100 text-green-800 border-green-200";
    }
    const deadline = new Date(Number.parseInt(exam.deadline) * 1000);
    const now = new Date();
    return deadline < now
      ? "bg-red-100 text-red-800 border-red-200"
      : "bg-blue-100 text-blue-800 border-blue-200";
  };

  const getExamStatusText = (exam: Exam) => {
    if (exam.is_submitted) {
      return exam.unscored_count > 0 ? "Chờ chấm điểm" : "Đã hoàn thành";
    }
    const deadline = new Date(Number.parseInt(exam.deadline) * 1000);
    const now = new Date();
    return deadline < now ? "Quá hạn" : "Chưa làm";
  };

  // Helper: Find current week by real time
  const getCurrentWeek = () => {
    const now = new Date();
    return weeks.find((w) => {
      const startDate = new Date(w.start_date);
      const endDate = new Date(w.end_date);
      endDate.setHours(23, 59, 59, 999); // Kết thúc vào cuối ngày
      return now >= startDate && now <= endDate;
    });
  };
  const currentWeek = getCurrentWeek();
  const isOnCurrentWeek =
    selectedWeek && currentWeek && selectedWeek.id === currentWeek.id;

  if (error) {
    return (
      <div className="min-h-screen">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 text-lg">Có lỗi xảy ra: {error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Header with Week Selector */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="order-1 sm:order-none">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              {t("title")}
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {t("subtitle")}
            </p>
          </div>

          <div className="order-2 sm:order-none flex flex-col sm:flex-col md:flex-row md:items-center gap-3">
            {/* Course filter + Go to current week */}
            <div className="flex items-center gap-3">
              <Select
                value={filterCourseId || (courseOptions[0]?.id ?? "")}
                onValueChange={(val) => {
                  setFilterCourseId(val);
                  onCourseFilterChange?.(val);
                }}
              >
                <SelectTrigger className="w-56 mr-2">
                  <SelectValue placeholder={t("allCourses")}>
                    {courseOptions.find(
                      (c) => c.id === (filterCourseId || courseOptions[0]?.id)
                    )?.name || ""}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {courseOptions.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {currentWeek &&
                selectedWeek &&
                selectedWeek.id !== currentWeek.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 px-4 text-sm font-medium border-blue-400 text-blue-700 hover:bg-blue-50"
                    onClick={() => onWeekChange(currentWeek.id)}
                  >
                    {t("goToCurrentWeek")}
                  </Button>
                )}
            </div>

            {/* Week selector + prev/next */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={onPreviousWeek}
                className="h-10 w-10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Select
                value={selectedWeek?.id || ""}
                onValueChange={onWeekChange}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder={t("selectWeekPlaceholder")}>
                    {selectedWeek && (
                      <span className="font-medium">
                        {t("weekLabel", {
                          n:
                            (selectedWeek as any).number ??
                            selectedWeek.week_number,
                        })}{" "}
                        ({formatDate(selectedWeek.start_date)} -{" "}
                        {formatDate(selectedWeek.end_date)})
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {weeks.map((week) => (
                    <SelectItem key={week.id} value={week.id}>
                      {t("weekLabel", {
                        n: (week as any).number ?? week.week_number,
                      })}{" "}
                      ({formatDate(week.start_date)} -{" "}
                      {formatDate(week.end_date)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={onNextWeek}
                className="h-10 w-10"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* NỔI BẬT: Assignment by Course/Lesson - Hierarchical layout */}
        {!isLoading && courses.length > 0 && (
          <div className="space-y-12">
            {(filterCourseId
              ? courses.filter((course) => course.id === filterCourseId)
              : courses
            ).map((course) => (
              <Card
                key={course.id}
                className="shadow-lg border-2 border-blue-200"
              >
                <CardHeader
                  className="bg-blue-50 border-b flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap hover:bg-blue-100 transition-colors duration-200 rounded-t-xl relative"
                  onMouseEnter={() => setHoveredCourseId(course.id)}
                  onMouseLeave={() => setHoveredCourseId(null)}
                >
                  {/* Mobile layout - course image and view detail button together */}
                  <div className="flex sm:hidden items-center gap-3 w-full">
                    {course.image ? (
                      <img
                        src={course.image}
                        alt={course.name}
                        className="w-28 h-20 rounded-lg object-cover border border-gray-200 shadow-md"
                      />
                    ) : (
                      <div className="w-20 h-12 sm:w-28 sm:h-16 bg-blue-500 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="ml-auto bg-white text-blue-700 border border-blue-600 rounded-lg px-3 py-1.5 text-xs sm:text-sm shadow-sm transition-colors duration-200 hover:bg-blue-700 hover:text-white hover:border-blue-700 focus:bg-blue-700 focus:text-white focus:border-blue-700"
                      onClick={() => {
                        window.location.href = `/${locale}/courses/${course.id}`;
                      }}
                    >
                      {tc("viewDetail")}
                    </Button>
                  </div>

                  {/* Desktop layout - original layout */}
                  {course.image ? (
                    <img
                      src={course.image}
                      alt={course.name}
                      className="hidden sm:block w-28 h-20 rounded-lg object-cover border border-gray-200 shadow-md"
                    />
                  ) : (
                    <div className="hidden sm:flex w-28 h-16 bg-blue-500 rounded-lg items-center justify-center">
                      <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-2xl text-gray-900 truncate whitespace-pre-line flex items-center gap-2">
                      {(() => {
                        const match = /^(.*?)(\s*\(([^)]+)\))?$/.exec(
                          course.name || ""
                        );
                        const mainName = match ? match[1].trim() : course.name;
                        const badge = match && match[3] ? match[3] : null;
                        return <>{mainName}</>;
                      })()}
                    </CardTitle>
                    {course.description && (
                      <div className="mt-1 text-gray-600 text-sm">
                        <div
                          className={
                            expandedDescriptions[`course-${course.id}`]
                              ? "whitespace-pre-line"
                              : "whitespace-pre-line line-clamp-2"
                          }
                        >
                          {course.description}
                        </div>
                        {course.description.split("\n").length > 2 ||
                        course.description.length > 120 ? (
                          !expandedDescriptions[`course-${course.id}`] ? (
                            <button
                              className="mt-1 text-xs underline text-blue-600 font-semibold"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleDescription(`course-${course.id}`);
                              }}
                              type="button"
                            >
                              {tc("seeMore")}
                            </button>
                          ) : (
                            <button
                              className="mt-1 text-xs underline text-blue-600 font-semibold"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleDescription(`course-${course.id}`);
                              }}
                              type="button"
                            >
                              {tc("collapse")}
                            </button>
                          )
                        ) : null}
                      </div>
                    )}
                  </div>
                  <Badge className="ml-auto bg-blue-100 text-blue-800 text-base px-4 py-1 rounded-full shadow whitespace-nowrap">
                    {course.lessons.length} {tc("lessonsLower")}
                  </Badge>
                  {hoveredCourseId === course.id && (
                    <div
                      className="hidden sm:flex absolute inset-0 items-center justify-center z-20"
                      style={{ pointerEvents: "none" }}
                    >
                      <Button
                        size="sm"
                        className="backdrop-blur bg-white text-blue-700 border border-blue-600 rounded-lg px-4 py-2 text-sm shadow-lg transition-colors duration-200 hover:bg-blue-700 hover:text-white hover:border-blue-700 focus:bg-blue-700 focus:text-white focus:border-blue-700"
                        style={{ pointerEvents: "auto" }}
                        onClick={() => {
                          window.location.href = `/${locale}/courses/${course.id}`;
                        }}
                      >
                        {tc("viewDetail")}
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="py-4 px-4 lg:px-12">
                  <div>
                    {course.lessons
                      .slice()
                      .sort((a, b) => {
                        const totalA =
                          (a.exams?.length || 0) +
                          (a.homeworks?.length || 0) +
                          (a.exercises?.length || 0);
                        const totalB =
                          (b.exams?.length || 0) +
                          (b.homeworks?.length || 0) +
                          (b.exercises?.length || 0);
                        return totalB - totalA; // nhiều nhất lên đầu
                      })
                      .map((lesson) => {
                        const hasExams =
                          lesson.exams && lesson.exams.length > 0;
                        const hasHomeworks =
                          lesson.homeworks && lesson.homeworks.length > 0;
                        const hasExercises =
                          lesson.exercises && lesson.exercises.length > 0;
                        // Xác định số cột cho grid ngoài cùng
                        const colCount =
                          (hasHomeworks ? 1 : 0) +
                          (hasExams ? 1 : 0) +
                          (hasExercises ? 1 : 0);
                        return (
                          <div key={lesson.id} className="">
                            <div className="flex items-start gap-3 mb-4">
                              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shadow flex-shrink-0">
                                <GraduationCap className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                  {(() => {
                                    const match =
                                      /^(.*?)(\s*\(([^)]+)\))?$/.exec(
                                        lesson.title || ""
                                      );
                                    const mainTitle = match
                                      ? match[1].trim()
                                      : lesson.title;
                                    const badge =
                                      match && match[3] ? match[3] : null;
                                    return <>{mainTitle}</>;
                                  })()}
                                </h3>
                                {lesson.description && (
                                  <div className="text-base text-gray-500">
                                    <div
                                      className={
                                        expandedDescriptions[
                                          `lesson-${lesson.id}`
                                        ]
                                          ? "whitespace-pre-line"
                                          : "whitespace-pre-line line-clamp-2"
                                      }
                                    >
                                      {lesson.description}
                                    </div>
                                    {lesson.description.split("\n").length >
                                      2 || lesson.description.length > 120 ? (
                                      !expandedDescriptions[
                                        `lesson-${lesson.id}`
                                      ] ? (
                                        <button
                                          className="mt-1 text-xs underline text-blue-600 font-semibold"
                                          onClick={() =>
                                            toggleDescription(
                                              `lesson-${lesson.id}`
                                            )
                                          }
                                          type="button"
                                        >
                                          {tc("seeMore")}
                                        </button>
                                      ) : (
                                        <button
                                          className="mt-1 text-xs underline text-blue-600 font-semibold"
                                          onClick={() =>
                                            toggleDescription(
                                              `lesson-${lesson.id}`
                                            )
                                          }
                                          type="button"
                                        >
                                          {tc("collapse")}
                                        </button>
                                      )
                                    ) : null}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div
                              className={`grid gap-8 ${
                                colCount === 1
                                  ? "md:grid-cols-1"
                                  : colCount === 2
                                  ? "md:grid-cols-2"
                                  : "md:grid-cols-3"
                              } py-6`}
                            >
                              {/* Nếu có cả hai, mỗi cột là 1 tab, item 1 col. Nếu chỉ 1 loại, tab đó fill hết, item 2 col trên md+ */}
                              {hasHomeworks && (
                                <div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <NotebookPen className="h-5 w-5 text-blue-500" />
                                    <span className="font-semibold text-blue-700 text-lg">
                                      {t("homeworksTitle")}
                                    </span>
                                    <Badge className="bg-blue-100 text-blue-800 ml-2 text-base px-3 py-0.5 rounded-full">
                                      {lesson.homeworks.length}
                                    </Badge>
                                  </div>
                                  <div
                                    className={`${
                                      colCount > 1
                                        ? "grid grid-cols-1"
                                        : "grid grid-cols-1 sm:grid-cols-2"
                                    } gap-4`}
                                  >
                                    {lesson.homeworks &&
                                      lesson.homeworks.length > 0 && (
                                        <div className="grid grid-cols-1 gap-4">
                                          {lesson.homeworks
                                            .slice()
                                            .sort((a, b) => {
                                              const numA =
                                                parseInt(
                                                  a.name.replace(/^\D+/g, ""),
                                                  10
                                                ) || 0;
                                              const numB =
                                                parseInt(
                                                  b.name.replace(/^\D+/g, ""),
                                                  10
                                                ) || 0;
                                              return numA - numB;
                                            })
                                            .map((hw) => {
                                              let status = "pending";

                                              // Xử lý logic khác nhau dựa vào question_form
                                              if (
                                                hw.question_form === "write"
                                              ) {
                                                status = hw.is_submitted
                                                  ? "completed"
                                                  : "pending";
                                              } else {
                                                if (
                                                  hw.question_completed ===
                                                  hw.total_question
                                                )
                                                  status = "completed";
                                                else if (
                                                  hw.question_completed > 0
                                                )
                                                  status = "partial";
                                              }

                                              return (
                                                <Card
                                                  key={hw.id}
                                                  className="bg-blue-50/60 shadow-md border-gray-200"
                                                >
                                                  <CardContent className="p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                      <h4 className="font-bold text-gray-900 text-base line-clamp-1 flex items-center gap-2">
                                                        {(() => {
                                                          const match =
                                                            /^(.*?)(\s*\(([^)]+)\))?$/.exec(
                                                              hw.name || ""
                                                            );
                                                          const mainName = match
                                                            ? match[1].trim()
                                                            : hw.name;
                                                          return (
                                                            <>{mainName}</>
                                                          );
                                                        })()}
                                                        {/* Badge loại homework */}
                                                        <span
                                                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                                            hw.question_form ===
                                                            "write"
                                                              ? "bg-purple-100 text-purple-700 border border-purple-300"
                                                              : "bg-blue-100 text-blue-700 border border-blue-300"
                                                          }`}
                                                        >
                                                          {hw.question_form ===
                                                          "write"
                                                            ? t(
                                                                "badges.writeHomework"
                                                              )
                                                            : t(
                                                                "badges.questionHomework"
                                                              )}
                                                        </span>
                                                      </h4>
                                                      <Badge
                                                        className={
                                                          status === "completed"
                                                            ? "bg-green-100 text-green-800 border-green-200 text-sm hover:bg-green-100 hover:text-green-800 hover:border-green-200 focus:bg-green-100 focus:text-green-800 focus:border-green-200 active:bg-green-100 active:text-green-800 active:border-green-200"
                                                            : status ===
                                                              "partial"
                                                            ? "bg-yellow-100 text-yellow-800 border-yellow-200 text-sm hover:bg-yellow-100 hover:text-yellow-800 hover:border-yellow-200 focus:bg-yellow-100 focus:text-yellow-800 active:bg-yellow-100 active:text-yellow-800 active:border-yellow-200"
                                                            : "bg-blue-100 text-blue-800 border-blue-200 text-sm hover:bg-blue-100 hover:text-blue-800 hover:border-blue-200 focus:bg-blue-100 focus:text-blue-800 active:bg-blue-100 active:text-blue-800 active:border-blue-200"
                                                        }
                                                      >
                                                        {status ===
                                                        "completed" ? (
                                                          <>
                                                            <CheckCircle className="h-4 w-4 mr-1" />
                                                            {t(
                                                              "status.completed"
                                                            )}
                                                          </>
                                                        ) : status ===
                                                          "partial" ? (
                                                          <>
                                                            <AlertCircle className="h-4 w-4 mr-1" />
                                                            {t(
                                                              "status.inProgress"
                                                            )}
                                                          </>
                                                        ) : (
                                                          <>
                                                            <AlertCircle className="h-4 w-4 mr-1" />
                                                            {t(
                                                              "status.notStarted"
                                                            )}
                                                          </>
                                                        )}
                                                      </Badge>
                                                    </div>
                                                    {/* Chỉ hiển thị progress cho question type */}
                                                    {hw.question_form ===
                                                      "question" && (
                                                      <div className="flex items-center text-sm text-gray-500 mb-1">
                                                        <ListOrdered className="h-4 w-4 mr-1" />
                                                        <span>
                                                          {t("progressCounts", {
                                                            completed:
                                                              hw.question_completed,
                                                            total:
                                                              hw.total_question,
                                                          })}
                                                        </span>
                                                      </div>
                                                    )}
                                                    <div className="flex justify-end mt-1">
                                                      <Button
                                                        size="sm"
                                                        className={
                                                          status === "completed"
                                                            ? "bg-[#40C8F4] text-white hover:bg-blue-700 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow"
                                                            : status ===
                                                              "partial"
                                                            ? "bg-[#EB8922] text-white hover:bg-[#d97a1d] text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow"
                                                            : "bg-[#A6C74D] text-white hover:bg-green-700 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow"
                                                        }
                                                        onClick={() => {
                                                          // Chỉ lưu lastQuestionIdCompleted cho question type
                                                          if (
                                                            hw.question_form ===
                                                            "question"
                                                          ) {
                                                            localStorage.setItem(
                                                              "lastQuestionIdCompleted",
                                                              String(
                                                                hw.last_question_id_completed
                                                              )
                                                            );
                                                          }

                                                          if (
                                                            status ===
                                                            "completed"
                                                          ) {
                                                            let reviewUrl =
                                                              reviewResultHomeworkFromAssignmentsStudentRoute(
                                                                user,
                                                                hw.id
                                                              );

                                                            const weekParam =
                                                              searchParams.get(
                                                                "week"
                                                              );
                                                            if (weekParam) {
                                                              reviewUrl += `${
                                                                reviewUrl.includes(
                                                                  "?"
                                                                )
                                                                  ? "&"
                                                                  : "?"
                                                              }week=${weekParam}`;
                                                            }

                                                            // Thêm courseId parameter
                                                            if (course.id) {
                                                              reviewUrl += `${
                                                                reviewUrl.includes(
                                                                  "?"
                                                                )
                                                                  ? "&"
                                                                  : "?"
                                                              }courseId=${
                                                                course.id
                                                              }`;
                                                            }

                                                            router.push(
                                                              reviewUrl
                                                            );
                                                          } else {
                                                            // lessonId đã có sẵn từ context
                                                            const lessonId =
                                                              lesson.id;

                                                            // Tạo URL với lessonId, week và courseId trong params
                                                            const baseUrl =
                                                              doHomeworkFromAssignmentsRoute(
                                                                user,
                                                                hw.id
                                                              );
                                                            let urlWithParams =
                                                              baseUrl;

                                                            if (lessonId) {
                                                              urlWithParams += `&lessonId=${lessonId}`;
                                                            }

                                                            // Sử dụng week parameter từ URL
                                                            const weekParam =
                                                              searchParams.get(
                                                                "week"
                                                              );
                                                            if (weekParam) {
                                                              urlWithParams += `&week=${weekParam}`;
                                                            }

                                                            // Thêm courseId parameter
                                                            if (course.id) {
                                                              urlWithParams += `&courseId=${course.id}`;
                                                            }

                                                            router.push(
                                                              urlWithParams
                                                            );
                                                          }
                                                        }}
                                                      >
                                                        <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                                        {status === "completed"
                                                          ? t("actions.review")
                                                          : status === "partial"
                                                          ? t(
                                                              "actions.continue"
                                                            )
                                                          : t("actions.start")}
                                                      </Button>
                                                    </div>
                                                  </CardContent>
                                                </Card>
                                              );
                                            })}
                                        </div>
                                      )}
                                  </div>
                                </div>
                              )}
                              {hasExercises && (
                                <div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <FileText className="h-5 w-5 text-purple-500" />
                                    <span className="font-semibold text-purple-700 text-lg">
                                      {t("exercisesTitle")}
                                    </span>
                                    <Badge className="bg-purple-100 text-purple-800 ml-2 text-base px-3 py-0.5 rounded-full">
                                      {lesson.exercises.length}
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-1 gap-4">
                                    {lesson.exercises.map((exercise) => {
                                      const deadline = new Date(
                                        Number.parseInt(exercise.deadline) *
                                          1000
                                      );
                                      const now = new Date();
                                      let status:
                                        | "pending"
                                        | "completed"
                                        | "overdue" = "pending";
                                      if (exercise.is_submitted)
                                        status = "completed";
                                      else if (deadline < now)
                                        status = "overdue";
                                      return (
                                        <Card
                                          key={exercise.id}
                                          className="border-l-8 border-l-purple-500 bg-purple-50/60 shadow-md"
                                        >
                                          <CardContent className="p-4">
                                            <div className="flex items-center justify-between mb-2">
                                              <h4 className="font-bold text-gray-900 text-base line-clamp-1">
                                                {(() => {
                                                  const match =
                                                    /^(.*?)(\s*\(([^)]+)\))?$/.exec(
                                                      exercise.name || ""
                                                    );
                                                  const mainName = match
                                                    ? match[1].trim()
                                                    : exercise.name;
                                                  const badge =
                                                    match && match[3]
                                                      ? match[3]
                                                      : null;
                                                  return <>{mainName}</>;
                                                })()}
                                              </h4>
                                              <Badge
                                                className={
                                                  status === "completed"
                                                    ? "bg-green-100 text-green-800 border-green-200 text-sm hover:bg-green-100 hover:text-green-800 hover:border-green-200 focus:bg-green-100 focus:text-green-800 focus:border-green-200 active:bg-green-100 active:text-green-800 active:border-green-200"
                                                    : status === "overdue"
                                                    ? "bg-red-100 text-red-800 border-red-200 text-sm hover:bg-red-100 hover:text-red-800 hover:border-red-200 focus:bg-red-100 focus:text-red-800 focus:border-red-200 active:bg-red-100 active:text-red-800 active:border-red-200"
                                                    : "bg-blue-100 text-blue-800 border-blue-200 text-sm hover:bg-blue-100 hover:text-blue-800 hover:border-blue-200 focus:bg-blue-100 focus:text-blue-800 focus:border-blue-200 active:bg-blue-100 active:text-blue-800 active:border-blue-200"
                                                }
                                              >
                                                {status === "completed" ? (
                                                  <>
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    {t("status.completed")}
                                                  </>
                                                ) : status === "overdue" ? (
                                                  <>
                                                    <AlertCircle className="h-4 w-4 mr-1" />
                                                    {t("status.overdue")}
                                                  </>
                                                ) : (
                                                  <>
                                                    <AlertCircle className="h-4 w-4 mr-1" />
                                                    {t("status.notStarted")}
                                                  </>
                                                )}
                                              </Badge>
                                            </div>
                                            <div className="flex items-center text-sm text-gray-500 mb-1">
                                              <Clock className="h-4 w-4 mr-1" />
                                              <span>
                                                {t("deadline")}:{" "}
                                                {formatDeadline(
                                                  exercise.deadline
                                                )}
                                              </span>
                                            </div>
                                            <div className="flex justify-end mt-1">
                                              {exercise.is_submitted ? (
                                                exercise.unscored_count > 0 ? (
                                                  <Button
                                                    size="sm"
                                                    className="bg-[#EB8922] text-white hover:bg-[#d97a1d] text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow"
                                                    onClick={() => {
                                                      let reviewUrl = `/${locale}/assignments/exercise/${exercise.id}/review`;

                                                      const weekParam =
                                                        searchParams.get(
                                                          "week"
                                                        );
                                                      if (weekParam) {
                                                        reviewUrl += `?week=${weekParam}`;
                                                      }

                                                      router.push(reviewUrl);
                                                    }}
                                                  >
                                                    <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                                    {t("actions.review")}
                                                  </Button>
                                                ) : (
                                                  <Button
                                                    size="sm"
                                                    className="bg-blue-600 text-white hover:bg-blue-700 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow"
                                                    onClick={() => {
                                                      if (
                                                        user?.type === "student"
                                                      ) {
                                                        const from =
                                                          "assignments";
                                                        let reviewUrl =
                                                          reviewResultExerciseStudentRoute(
                                                            user,
                                                            exercise.id,
                                                            from
                                                          );

                                                        const weekParam =
                                                          searchParams.get(
                                                            "week"
                                                          );
                                                        if (weekParam) {
                                                          reviewUrl += `${
                                                            reviewUrl.includes(
                                                              "?"
                                                            )
                                                              ? "&"
                                                              : "?"
                                                          }week=${weekParam}`;
                                                        }

                                                        router.push(reviewUrl);
                                                      } else {
                                                        let resultUrl =
                                                          resultExerciseRoute(
                                                            user,
                                                            exercise.id
                                                          );

                                                        const weekParam =
                                                          searchParams.get(
                                                            "week"
                                                          );
                                                        if (weekParam) {
                                                          resultUrl += `${
                                                            resultUrl.includes(
                                                              "?"
                                                            )
                                                              ? "&"
                                                              : "?"
                                                          }week=${weekParam}`;
                                                        }

                                                        router.push(resultUrl);
                                                      }
                                                    }}
                                                  >
                                                    <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                                    {t("actions.viewResult")}
                                                  </Button>
                                                )
                                              ) : (
                                                <Button
                                                  size="sm"
                                                  className="bg-green-600 text-white hover:bg-green-700 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow"
                                                  onClick={() => {
                                                    let exerciseUrl =
                                                      doExerciseFromAssignmentsRoute(
                                                        user,
                                                        exercise.id
                                                      );

                                                    const weekParam =
                                                      searchParams.get("week");
                                                    if (weekParam) {
                                                      exerciseUrl += `${
                                                        exerciseUrl.includes(
                                                          "?"
                                                        )
                                                          ? "&"
                                                          : "?"
                                                      }week=${weekParam}`;
                                                    }

                                                    router.push(exerciseUrl);
                                                  }}
                                                >
                                                  <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                                  {t("actions.start")}
                                                </Button>
                                              )}
                                            </div>
                                          </CardContent>
                                        </Card>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              {hasExams && (
                                <div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <FileText className="h-5 w-5 text-red-500" />
                                    <span className="font-semibold text-red-700 text-lg">
                                      {t("examsTitle")}
                                    </span>
                                    <Badge className="bg-red-100 text-red-800 ml-2 text-base px-3 py-0.5 rounded-full">
                                      {lesson.exams.length}
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-1 gap-4">
                                    {lesson.exams.map((exam) => {
                                      const deadline = new Date(
                                        Number.parseInt(exam.deadline) * 1000
                                      );
                                      const now = new Date();
                                      let status:
                                        | "pending"
                                        | "completed"
                                        | "overdue" = "pending";
                                      if (exam.is_submitted)
                                        status = "completed";
                                      else if (deadline < now)
                                        status = "overdue";
                                      return (
                                        <Card
                                          key={exam.id}
                                          className="bg-red-50/60 shadow-md border-gray-200"
                                        >
                                          <CardContent className="p-4">
                                            <div className="flex items-center justify-between mb-2">
                                              <h4 className="font-bold text-gray-900 text-base line-clamp-1">
                                                {(() => {
                                                  const match =
                                                    /^(.*?)(\s*\(([^)]+)\))?$/.exec(
                                                      exam.name || ""
                                                    );
                                                  const mainName = match
                                                    ? match[1].trim()
                                                    : exam.name;
                                                  const badge =
                                                    match && match[3]
                                                      ? match[3]
                                                      : null;
                                                  return <>{mainName}</>;
                                                })()}
                                              </h4>
                                              <Badge
                                                className={
                                                  status === "completed"
                                                    ? "bg-green-100 text-green-800 border-green-200 text-sm hover:bg-green-100 hover:text-green-800 hover:border-green-200 focus:bg-green-100 focus:text-green-800 focus:border-green-200 active:bg-green-100 active:text-green-800 active:border-green-200"
                                                    : status === "overdue"
                                                    ? "bg-red-100 text-red-800 border-red-200 text-sm hover:bg-red-100 hover:text-red-800 hover:border-red-200 focus:bg-red-100 focus:text-red-800 focus:border-red-200 active:bg-red-100 active:text-red-800 active:border-red-200"
                                                    : "bg-blue-100 text-blue-800 border-blue-200 text-sm hover:bg-blue-100 hover:text-blue-800 hover:border-blue-200 focus:bg-blue-100 focus:text-blue-800 focus:border-blue-200 active:bg-blue-100 active:text-blue-800 active:border-blue-200"
                                                }
                                              >
                                                {status === "completed" ? (
                                                  <>
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    {t("status.completed")}
                                                  </>
                                                ) : status === "overdue" ? (
                                                  <>
                                                    <AlertCircle className="h-4 w-4 mr-1" />
                                                    {t("status.overdue")}
                                                  </>
                                                ) : (
                                                  <>
                                                    <AlertCircle className="h-4 w-4 mr-1" />
                                                    {t("status.notStarted")}
                                                  </>
                                                )}
                                              </Badge>
                                            </div>
                                            <div className="flex items-center text-sm text-gray-500 mb-1">
                                              <Clock className="h-4 w-4 mr-1" />
                                              <span>
                                                {t("deadline")}:{" "}
                                                {formatDeadline(exam.deadline)}
                                              </span>
                                            </div>
                                            <div className="flex justify-end mt-1">
                                              {exam.is_submitted ? (
                                                exam.unscored_count > 0 ? (
                                                  <Button
                                                    size="sm"
                                                    className="bg-[#EB8922] text-white hover:bg-[#d97a1d] text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow"
                                                    onClick={() => {
                                                      let reviewUrl = `/${locale}/assignments/exam/${exam.id}/review`;

                                                      const weekParam =
                                                        searchParams.get(
                                                          "week"
                                                        );
                                                      if (weekParam) {
                                                        reviewUrl += `?week=${weekParam}`;
                                                      }

                                                      router.push(reviewUrl);
                                                    }}
                                                  >
                                                    <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                                    {t("actions.review")}
                                                  </Button>
                                                ) : (
                                                  <Button
                                                    size="sm"
                                                    className="bg-blue-600 text-white hover:bg-blue-700 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow"
                                                    onClick={() => {
                                                      if (
                                                        user?.type === "student"
                                                      ) {
                                                        const from =
                                                          "assignments";
                                                        let reviewUrl =
                                                          reviewResultExamStudentRoute(
                                                            user,
                                                            exam.id,
                                                            from
                                                          );

                                                        const weekParam =
                                                          searchParams.get(
                                                            "week"
                                                          );
                                                        if (weekParam) {
                                                          reviewUrl += `${
                                                            reviewUrl.includes(
                                                              "?"
                                                            )
                                                              ? "&"
                                                              : "?"
                                                          }week=${weekParam}`;
                                                        }

                                                        router.push(reviewUrl);
                                                      } else {
                                                        let resultUrl =
                                                          resultExamRoute(
                                                            user,
                                                            exam.id
                                                          );

                                                        const weekParam =
                                                          searchParams.get(
                                                            "week"
                                                          );
                                                        if (weekParam) {
                                                          resultUrl += `${
                                                            resultUrl.includes(
                                                              "?"
                                                            )
                                                              ? "&"
                                                              : "?"
                                                          }week=${weekParam}`;
                                                        }

                                                        router.push(resultUrl);
                                                      }
                                                    }}
                                                  >
                                                    <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                                    {t("actions.viewResult")}
                                                  </Button>
                                                )
                                              ) : (
                                                <Button
                                                  size="sm"
                                                  className="bg-green-600 text-white hover:bg-green-700 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow"
                                                  onClick={() => {
                                                    let examUrl =
                                                      doExamFromAssignmentsRoute(
                                                        user,
                                                        exam.id
                                                      );

                                                    const weekParam =
                                                      searchParams.get("week");
                                                    if (weekParam) {
                                                      examUrl += `${
                                                        examUrl.includes("?")
                                                          ? "&"
                                                          : "?"
                                                      }week=${weekParam}`;
                                                    }

                                                    router.push(examUrl);
                                                  }}
                                                >
                                                  <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                                  {t("actions.start")}
                                                </Button>
                                              )}
                                            </div>
                                          </CardContent>
                                        </Card>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="py-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-md bg-slate-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-6 w-32 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <div className="mb-4">
                    <Skeleton className="h-5 w-40 mb-2" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <div className="flex gap-2 mb-4">
                    <Skeleton className="h-8 w-24 rounded-full" />
                    <Skeleton className="h-8 w-16 rounded-full" />
                  </div>
                  <div className="flex justify-end">
                    <Skeleton className="h-10 w-32 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && courses.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-14 w-14 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("empty.title")}
              </h3>
              <p className="text-gray-600">{t("empty.subtitle")}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
