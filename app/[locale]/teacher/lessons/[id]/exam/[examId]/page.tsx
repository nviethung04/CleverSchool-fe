"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Clock,
  FileText,
  CheckCircle,
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
  getExamStudents,
  type UIExamInfo,
  type UIStudentSubmission,
} from "@/lib/api/exam-answers";
import { useToast } from "@/components/ui/use-toast";
import { useTypedTranslations } from "@/lib/i18n/client";

export default function ExamManagementPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const locale = (params as any)?.locale || "vi";
  const t = useTypedTranslations("examManagement");
  const [examInfo, setExamInfo] = useState<UIExamInfo | null>(null);
  const [students, setStudents] = useState<UIStudentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "submitted" | "not_submitted" | "graded" | "not_graded"
  >("all");
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    fetchExamData(page, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  // Helper function to format unix timestamp to datetime
  const formatUnixDateTime = (unixTimestamp: string) => {
    if (unixTimestamp === "0") return "";
    const date = new Date(Number.parseInt(unixTimestamp) * 1000);
    return date.toISOString();
  };

  const fetchExamData = async (pageParam = page, limitParam = limit) => {
    try {
      setLoading(true);

      const courseId = searchParams.get("course_id");
      const response = await getExamStudents({
        exam_id: Number.parseInt(params.examId as string),
        ...(courseId ? { course_id: parseInt(courseId) } : {}),
        page: pageParam,
        limit: limitParam,
      });

      if (response.code === 200 && response.data) {
        const apiExamInfo = response.data.exam_info;
        const apiStudents = response.data.students;
        // Lấy total_count từ API nếu có
        const apiTotalCount = response.data.total_count
          ? Number(response.data.total_count)
          : null;
        setTotalCount(apiTotalCount);

        // Map API exam info to UI interface
        const mappedExamInfo: UIExamInfo = {
          id: params.examId as string,
          title: apiExamInfo.name,
          description: apiExamInfo.description,
          courseId: (params.courseId as string) || "",
          courseName: "",
          lessonId: (params.lessonId as string) || (params.id as string) || "",
          lessonTitle: "",
          totalQuestions: Number.parseInt(apiExamInfo.total_questions),
          maxScore: apiExamInfo.max_score,
          timeLimit: Number.parseInt(apiExamInfo.time_limit),
          startDate: formatUnixDateTime(apiExamInfo.created_at),
          endDate: formatUnixDateTime(apiExamInfo.deadline),
          status: apiExamInfo.status === 1 ? "published" : "draft",
          createdAt: formatUnixDateTime(apiExamInfo.created_at),
        };

        // Map API students to UI interface
        const mappedStudents: UIStudentSubmission[] = apiStudents.map(
          (student) => ({
            studentId: student.user_id,
            studentName: student.name,
            studentAvatar: student.avatar,
            submissionStatus: student.is_submitted
              ? "submitted"
              : "not_started",
            gradingStatus:
              student.is_submitted && student.unscored_count === 0
                ? "graded"
                : "not_graded",
            submittedAt:
              student.submitted_at !== "0"
                ? formatUnixDateTime(student.submitted_at)
                : undefined,
            score: student.is_submitted ? student.score : undefined,
            timeSpent:
              student.duration !== "0"
                ? Number.parseInt(student.duration)
                : undefined,
            lastAccessed:
              student.submitted_at !== "0"
                ? formatUnixDateTime(student.submitted_at)
                : undefined,
            unscoredCount: student.unscored_count,
            ratio: student.ratio, // Add ratio to the mapped student object
          })
        );

        setExamInfo(mappedExamInfo);
        setStudents(mappedStudents);
      } else {
        throw new Error(response.error || "Failed to load exam data");
      }
    } catch (error) {
      console.error("Error fetching exam data:", error);
      toast({
        title: t("error"),
        description: t("cannotLoadExamInfo"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            {t("submitted")}
          </Badge>
        );
      case "not_started":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-600">
            {t("notStarted")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{t("unknown")}</Badge>;
    }
  };

  const getGradingStatusBadge = (status: string, unscoredCount?: number) => {
    switch (status) {
      case "graded":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            {t("graded")}
          </Badge>
        );
      case "not_graded":
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800">
            {unscoredCount && unscoredCount > 0
              ? `${t("notGraded")} (${unscoredCount})`
              : t("notGraded")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{t("unknown")}</Badge>;
    }
  };

  const getExamStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            {t("ongoing")}
          </Badge>
        );
      case "draft":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-600">
            {t("draft")}
          </Badge>
        );
      case "ended":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            {t("ended")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{t("unknown")}</Badge>;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const handleGradeStudent = (studentId: string) => {
    // Lấy id từ params
    const lessonId = params.lessonId || params.id;
    const examId = params.examId;
    const courseId = searchParams.get("course_id");

    if (lessonId && examId && studentId) {
      const courseQuery = courseId ? `?course_id=${courseId}` : "";
      router.push(
        `/${locale}/teacher/lessons/${lessonId}/exam/${examId}/student/${studentId}${courseQuery}`
      );
    }
  };

  const filteredStudents = students.filter((student) => {
    switch (filter) {
      case "submitted":
        return student.submissionStatus === "submitted";
      case "not_submitted":
        return student.submissionStatus !== "submitted";
      case "graded":
        return student.gradingStatus === "graded";
      case "not_graded":
        return student.gradingStatus === "not_graded";
      default:
        return true;
    }
  });

  const stats = {
    total: totalCount !== null ? totalCount : students.length,
    submitted: students.filter((s) => s.submissionStatus === "submitted")
      .length,
    graded: students.filter((s) => s.gradingStatus === "graded").length,
    averageScore:
      students
        .filter((s) => s.submissionStatus === "submitted" && s.ratio !== undefined)
        .reduce((acc, s) => acc + (s.ratio || 0), 0) /
        students.filter((s) => s.submissionStatus === "submitted" && s.ratio !== undefined).length || 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("loadingExamInfo")}</p>
        </div>
      </div>
    );
  }

  if (!examInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{t("examNotFound")}</p>
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
                  {t("examManagement")}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-4 sm:px-8 lg:px-12 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Exam Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-8">
              {/* Exam Details */}
              <Card className="rounded-2xl shadow-xl border-0 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl font-bold text-blue-700">
                    <FileText className="h-6 w-6 mr-2 text-blue-500" />
                    {t("examInfo")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-bold text-2xl text-gray-900 mb-1">
                      {examInfo.title}
                    </h3>
                    <p className="text-base text-gray-500 mt-1">
                      {examInfo.description}
                    </p>
                  </div>
                  <div className="space-y-2 text-base">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">{t("status")}:</span>
                      {getExamStatusBadge(examInfo.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">
                        {t("questionCount")}:
                      </span>
                      <span className="font-semibold text-blue-700">
                        {examInfo.totalQuestions}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">{t("timeLimit")}:</span>
                      <span className="font-semibold text-indigo-700">
                        {examInfo.timeLimit} {t("minutes")}
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-base">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-600">{t("startTime")}:</span>
                    </div>
                    <p className="text-base font-medium ml-7">
                      {formatDateTime(examInfo.startDate)}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-600">{t("endTime")}:</span>
                    </div>
                    <p className="text-base font-medium ml-7">
                      {formatDateTime(examInfo.endDate)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card className="rounded-2xl shadow-xl border-0 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg font-bold text-green-700">
                    <GraduationCap className="h-5 w-5 mr-2 text-green-500 animate-bounce" />
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
                          {t("submitted")}:
                        </span>
                        <span className="font-semibold text-green-700">
                          {stats.submitted}/{stats.total}
                        </span>
                      </div>
                      <Progress
                        value={(stats.submitted / stats.total) * 100}
                        className="h-2 rounded-full"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-base text-gray-600">
                          {t("graded")}:
                        </span>
                        <span className="font-semibold text-indigo-700">
                          {stats.graded}/{stats.submitted}
                        </span>
                      </div>
                      <Progress
                        value={
                          stats.submitted > 0
                            ? (stats.graded / stats.submitted) * 100
                            : 0
                        }
                        className="h-2 rounded-full"
                      />
                    </div>
                    {stats.graded > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-base text-gray-600">
                          {t("averageScore")}:
                        </span>
                        <span className="font-semibold text-pink-700">
                          {stats.averageScore.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content: Students List & Questions */}
          <div className="lg:col-span-3 space-y-8">
            {/* Filter Button Group */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { key: "all", label: t("all") },
                { key: "submitted", label: t("submitted") },
                { key: "not_submitted", label: t("notSubmitted") },
                { key: "not_graded", label: t("notGraded") },
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
                          {t("submissionTime")}
                        </TableHead>
                        <TableHead className="text-center font-bold text-blue-700 text-base">
                          {t("score")}
                        </TableHead>
                        <TableHead className="text-center font-bold text-blue-700 text-base">
                          {t("gradingStatus")}
                        </TableHead>
                        <TableHead className="text-center font-bold text-blue-700 text-base">
                          {t("actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student, idx) => (
                        <TableRow
                          key={student.studentId}
                          className={
                            idx % 2 === 1
                              ? "even:bg-blue-50 hover:bg-blue-100 transition-all"
                              : "hover:bg-blue-100 transition-all"
                          }
                        >
                          <TableCell className="text-left font-bold text-gray-900 flex items-center gap-3">
                            <Avatar className="w-9 h-9 border-2 border-blue-200 shadow">
                              <AvatarImage
                                src={student.studentAvatar}
                                alt={student.studentName}
                              />
                              <AvatarFallback>
                                {student.studentName[0]}
                              </AvatarFallback>
                            </Avatar>
                            {student.studentName}
                          </TableCell>
                          <TableCell className="text-center">
                            {getSubmissionStatusBadge(student.submissionStatus)}
                          </TableCell>
                          <TableCell className="text-center">
                            {student.submittedAt ? (
                              <span className="text-base font-medium">
                                {formatDateTime(student.submittedAt)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                            {student.timeSpent && (
                              <p className="text-xs text-gray-500">
                                {t("timeSpent")}:{" "}
                                {formatTime(student.timeSpent)}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {typeof student.ratio !== "undefined" ? (
                              <span className="font-bold text-lg text-pink-600">
                                {student.ratio}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {getGradingStatusBadge(
                              student.gradingStatus,
                              student.unscoredCount
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {student.submissionStatus === "submitted" ? (
                              <Button
                                size="sm"
                                className={`rounded-full font-semibold shadow-sm px-4 py-2 transition-all duration-150 ${
                                  student.gradingStatus === "graded"
                                    ? "bg-white text-blue-700 border border-blue-400 hover:bg-blue-50"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                                onClick={() =>
                                  handleGradeStudent(student.studentId)
                                }
                                variant="ghost"
                              >
                                {student.gradingStatus === "graded" ? (
                                  <>
                                    <Eye className="h-4 w-4 mr-1" />
                                    {t("viewScore")}
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    {t("grade")}
                                  </>
                                )}
                              </Button>
                            ) : (
                              <span className="text-gray-400 text-base">
                                {t("notSubmitted")}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
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
                {/* Pagination */}
                <div className="flex justify-end items-center gap-2 mt-4 px-4 pb-2">
                  <Button
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="rounded-full font-semibold shadow-sm px-4 py-2 bg-white text-blue-700 border border-blue-400 hover:bg-blue-50"
                  >
                    {t("previousPage")}
                  </Button>
                  <span className="text-base font-medium">
                    {t("page")} {page} /{" "}
                    {totalCount ? Math.ceil(totalCount / limit) : 1}
                  </span>
                  <Button
                    size="sm"
                    disabled={page >= Math.ceil((totalCount || 0) / limit)}
                    onClick={() => setPage(page + 1)}
                    className="rounded-full font-semibold shadow-sm px-4 py-2 bg-white text-blue-700 border border-blue-400 hover:bg-blue-50"
                  >
                    {t("nextPage")}
                  </Button>
                  <select
                    className="ml-2 rounded-full border border-blue-300 px-3 py-1 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors hover:border-blue-500 bg-white text-blue-700"
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                  >
                    {[10, 20, 50].map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}/{t("page")}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
