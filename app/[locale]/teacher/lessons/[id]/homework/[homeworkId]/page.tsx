"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Clock,
  FileText,
  AlertCircle,
  Eye,
  Calendar,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  getHomeworkStudents,
  HomeworkInfo,
  HomeworkStudent,
} from "@/lib/api/exam-answers";
import { useTypedTranslations } from "@/lib/i18n/client";

export default function HomeworkManagementPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = (params as any)?.locale || "vi";
  const t = useTypedTranslations("homeworkManagement");
  const [homeworkInfo, setHomeworkInfo] = useState<HomeworkInfo | null>(null);
  const [students, setStudents] = useState<HomeworkStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "all" | "submitted" | "not_submitted" | "in_progress"
  >("all");

  useEffect(() => {
    fetchHomeworkData();
  }, []);

  const fetchHomeworkData = async () => {
    try {
      setLoading(true);
      setError(null);

      const homeworkId = parseInt(params.homeworkId as string);
      const courseId = searchParams.get("course_id");

      const response = await getHomeworkStudents({
        homework_id: homeworkId,
        ...(courseId ? { course_id: parseInt(courseId) } : {}),
      });

      if (
        response.code === 200 &&
        response.data &&
        response.data.homework_info &&
        response.data.students
      ) {
        setHomeworkInfo(response.data.homework_info);
        setStudents(response.data.students);
      } else {
        console.error("Invalid API response:", response);
        setError(response.message || t("invalidHomeworkData"));
      }
    } catch (error) {
      console.error("Error fetching homework data:", error);
      setError(t("errorLoadingData"));
    } finally {
      setLoading(false);
    }
  };

  // Sửa lại hàm trạng thái làm bài
  const getSubmissionStatusBadge = (
    student: HomeworkStudent,
    totalQuestions: number | string
  ) => {
    const questionForm = homeworkInfo?.question_form;

    // Nếu là write form, dựa vào is_submitted
    if (questionForm === "write") {
      if (student.is_submitted) {
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            {t("submitted")}
          </Badge>
        );
      } else {
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-600">
            {t("notSubmitted")}
          </Badge>
        );
      }
    }

    // Nếu là question form, dựa vào questions_completed
    const completed = Number(student.questions_completed);
    const total = Number(totalQuestions);
    if (completed === 0) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-600">
          {t("notStarted")}
        </Badge>
      );
    } else if (completed > 0 && completed < total) {
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
          {t("inProgress")}
        </Badge>
      );
    } else if (completed === total) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          {t("submitted")}
        </Badge>
      );
    } else {
      return <Badge variant="outline">{t("unknown")}</Badge>;
    }
  };

  const getHomeworkStatusBadge = (status: number) => {
    if (status === 1) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          {t("published")}
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-600">
          {t("draft")}
        </Badge>
      );
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  // Thêm hàm chuyển unix timestamp sang date time
  const formatUnixToDateTime = (unix: number) => {
    if (!unix || unix <= 0) return t("notStarted");
    return new Date(unix * 1000).toLocaleString("vi-VN");
  };

  const handleViewSubmission = (studentId: string) => {
    // Điều hướng sang trang xem bài làm của học sinh
    router.push(
      `/${locale}/teacher/lessons/${params.id}/homework/${params.homeworkId}/student/${studentId}`
    );
  };

  const filteredStudents = students.filter((student) => {
    const questionForm = homeworkInfo?.question_form;

    if (questionForm === "write") {
      // Logic cho write form - dựa vào is_submitted
      switch (filter) {
        case "submitted":
          return student.is_submitted === true;
        case "not_submitted":
          return !student.is_submitted;
        case "in_progress":
          return false; // Write form không có trạng thái in_progress
        default:
          return true;
      }
    } else {
      // Logic cho question form - dựa vào questions_completed
      const completed = Number(student.questions_completed);
      const total = homeworkInfo ? Number(homeworkInfo.total_questions) : 0;
      switch (filter) {
        case "submitted":
          return completed === total && total > 0;
        case "not_submitted":
          return completed === 0;
        case "in_progress":
          return completed > 0 && completed < total;
        default:
          return true;
      }
    }
  });

  const stats = {
    total: students.length,
    submitted:
      homeworkInfo?.question_form === "write"
        ? students.filter((s) => s.is_submitted === true).length
        : students.filter((s) => s.questions_completed > 0).length,
    completionRate:
      students.length > 0
        ? homeworkInfo?.question_form === "write"
          ? (students.filter((s) => s.is_submitted === true).length /
              students.length) *
            100
          : (students.filter((s) => s.questions_completed > 0).length /
              students.length) *
            100
        : 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("loadingHomeworkInfo")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("goBack")}
          </Button>
        </div>
      </div>
    );
  }

  if (!homeworkInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{t("homeworkNotFound")}</p>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("goBack")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-lg border-b rounded-b-3xl sticky top-0 z-30">
        <div className="max-w-full mx-auto px-4 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="lg"
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 rounded-full shadow-md transition-all hover:bg-blue-100"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                {t("goBack")}
              </Button>
              <Separator orientation="vertical" className="h-8" />
              <div>
                <h1 className="text-2xl font-extrabold text-blue-600 drop-shadow-lg">
                  {t("homeworkManagement")}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-4 sm:px-8 lg:px-12 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Homework Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-8">
              {/* Homework Details */}
              <Card className="rounded-2xl shadow-xl border-0 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl font-bold text-blue-700">
                    <FileText className="h-6 w-6 mr-2 text-blue-500" />
                    {t("homeworkInfo")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-bold text-2xl text-gray-900 mb-1">
                      {homeworkInfo.name}
                    </h3>
                    <p className="text-base text-gray-500 mt-1">
                      {homeworkInfo.description}
                    </p>
                  </div>
                  <div className="space-y-2 text-base">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">{t("status")}:</span>
                      {getHomeworkStatusBadge(homeworkInfo.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">{t("type")}:</span>
                      <span className="font-semibold text-gray-800">
                        {homeworkInfo.question_form === "write"
                          ? t("writeOnPaper")
                          : t("questionBank")}
                      </span>
                    </div>
                    {homeworkInfo.question_form === "question" && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">
                          {t("questionCount")}:
                        </span>
                        <span className="font-semibold text-blue-700">
                          {homeworkInfo.total_questions}
                        </span>
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div className="space-y-2 text-base">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-600">{t("createdAt")}:</span>
                    </div>
                    <p className="text-base font-medium ml-7">
                      {formatDateTime(homeworkInfo.created_at)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card className="rounded-2xl shadow-xl border-0 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg font-bold text-green-700">
                    <GraduationCap className="h-5 w-5 mr-2 text-green-500" />
                    {t("statistics")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-base text-gray-600">
                        {t("totalStudents")}:
                      </span>
                      <span className="font-extrabold text-xl text-blue-700">
                        {stats.total}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-base text-gray-600">
                          {t("submittedCount")}:
                        </span>
                        <span className="font-semibold text-green-700">
                          {stats.submitted}/{stats.total}
                        </span>
                      </div>
                      <Progress
                        value={stats.completionRate}
                        className="h-2 rounded-full"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base text-gray-600">
                        {t("completionRate")}:
                      </span>
                      <span className="font-semibold text-pink-700">
                        {stats.completionRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content: Students List & Filters */}
          <div className="lg:col-span-3 space-y-8">
            {/* Filter Button Group */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { key: "all", label: t("all") },
                { key: "submitted", label: t("submitted") },
                { key: "not_submitted", label: t("notSubmitted") },
                { key: "in_progress", label: t("inProgress") },
              ].map((f) => (
                <Button
                  key={f.key}
                  variant={filter === f.key ? "default" : "outline"}
                  size="sm"
                  className={`rounded-full font-semibold shadow-sm px-5 py-2 transition-all duration-150 ${
                    filter === f.key
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-white text-blue-700 border-blue-300 hover:bg-blue-50"
                  }`}
                  onClick={() => setFilter(f.key as any)}
                >
                  {f.label}
                </Button>
              ))}
            </div>

            {/* Students List */}
            <Card className="rounded-2xl shadow-lg border-0 bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-xl font-bold text-blue-700">
                    <Users className="h-6 w-6 mr-2 text-blue-500" />
                    {t("studentsList")} ({filteredStudents.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="min-w-full rounded-xl">
                    <TableHeader>
                      <TableRow className="bg-blue-50">
                        <TableHead className="text-left font-bold text-blue-700 text-base">
                          {t("student")}
                        </TableHead>
                        <TableHead className="text-center font-bold text-blue-700 text-base">
                          {t("submissionStatus")}
                        </TableHead>
                        <TableHead className="text-center font-bold text-blue-700 text-base">
                          {t("questionsCompleted")}
                        </TableHead>
                        <TableHead className="text-center font-bold text-blue-700 text-base">
                          {t("lastActivity")}
                        </TableHead>
                        <TableHead className="text-center font-bold text-blue-700 text-base">
                          {t("actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student, idx) => {
                        const questionForm = homeworkInfo?.question_form;
                        const canViewSubmission =
                          questionForm === "write"
                            ? student.is_submitted
                            : student.questions_completed > 0;

                        return (
                          <TableRow
                            key={student.user_id}
                            className={
                              idx % 2 === 1
                                ? "even:bg-blue-50 hover:bg-blue-100 transition-all"
                                : "hover:bg-blue-100 transition-all"
                            }
                          >
                            <TableCell className="text-left font-bold text-gray-900 flex items-center gap-3">
                              <Avatar className="w-9 h-9 border-2 border-blue-200 shadow">
                                <AvatarImage
                                  src={student.avatar}
                                  alt={student.name}
                                />
                                <AvatarFallback>
                                  {student.name[0]}
                                </AvatarFallback>
                              </Avatar>
                              {student.name}
                            </TableCell>
                            <TableCell className="text-center">
                              {getSubmissionStatusBadge(
                                student,
                                Number(homeworkInfo.total_questions)
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {questionForm === "write" ? (
                                <span className="text-gray-400">-</span>
                              ) : (
                                <span className="text-base font-medium">
                                  {student.questions_completed}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {Number(student.updated_at) > 0 ? (
                                <span className="text-base font-medium">
                                  {formatUnixToDateTime(
                                    Number(student.updated_at) - 7 * 60 * 60
                                  )}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {canViewSubmission ? (
                                <Button
                                  size="sm"
                                  className="rounded-full font-semibold shadow-sm px-4 py-2 transition-all duration-150 bg-blue-600 text-white hover:bg-blue-700"
                                  onClick={() =>
                                    handleViewSubmission(student.user_id)
                                  }
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  {t("viewSubmission")}
                                </Button>
                              ) : (
                                <span className="text-gray-400 text-base">
                                  {t("notSubmitted")}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {filteredStudents.length === 0 && (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {t("noStudentsMatchFilter")}
                    </p>
                  </div>
                )}
                {/* Pagination (optional, add if you have pagination logic) */}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
