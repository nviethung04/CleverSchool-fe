"use client";

import { useState, useEffect } from "react";
import { useTypedTranslations, useCurrentLocale } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import {
  Users,
  BarChart3,
  TrendingUp,
  Eye,
  Download,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Calendar,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { getExamRanking, getListExam } from "@/lib/api/dashboard";

// Interface cho response của API
interface ExamRankingData {
  students: {
    student_id: string;
    student_name: string;
    average_ratio: number;
    average_time: number;
    avatar: string;
    number_exams: string;
  }[];
  total: string;
  score_chart: {
    score_range: string;
    student_count: string;
  }[];
  current_ranking: string;
}

interface ExamTabProps {
  courses: any[];
  exams: any[];
}

export function ExamTab({ courses, exams }: ExamTabProps) {
  const t = useTypedTranslations("examTab");
  const currentLocale = useCurrentLocale();

  // Get current date info
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear().toString();
  const currentMonth = (currentDate.getMonth() + 1).toString();

  // Filter states
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedSpecificAssignment, setSelectedSpecificAssignment] =
    useState("all");

  // State cho dữ liệu từ API
  const [examData, setExamData] = useState<ExamRankingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [localExams, setLocalExams] = useState<any[]>([]);

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalStudents, setTotalStudents] = useState(0);

  // Hàm tính toán start_date và end_date từ các bộ lọc
  const calculateDateRange = (): {
    start_date?: number;
    end_date?: number;
  } => {
    if (fromDate && toDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      return {
        start_date: Math.floor(start.getTime() / 1000),
        end_date: Math.floor(end.getTime() / 1000),
      };
    }

    if (selectedYear === "all" && selectedMonth === "all") {
      return {};
    }

    const year =
      selectedYear !== "all"
        ? parseInt(selectedYear)
        : new Date().getFullYear();

    if (selectedMonth && selectedMonth !== "all") {
      const month = parseInt(selectedMonth) - 1;
      const startDate = new Date(year, month, 1, 0, 0, 0, 0);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
      return {
        start_date: Math.floor(startDate.getTime() / 1000),
        end_date: Math.floor(endDate.getTime() / 1000),
      };
    }

    if (selectedYear !== "all") {
      const startDate = new Date(year, 0, 1, 0, 0, 0, 0);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      return {
        start_date: Math.floor(startDate.getTime() / 1000),
        end_date: Math.floor(endDate.getTime() / 1000),
      };
    }

    return {};
  };

  const yearOptions = Array.from({ length: 6 }, (_, i) =>
    (parseInt(currentYear) - i).toString()
  );

  // Auto-select first course when none selected
  useEffect(() => {
    if (Array.isArray(courses) && courses.length > 0) {
      const firstId =
        (courses[0] as any)?.id ??
        (courses[0] as any)?.value ??
        (courses[0] as any)?.course_id;
      if (firstId && (!selectedCourse || selectedCourse === "all")) {
        setSelectedCourse(String(firstId));
      }
    }
  }, [courses, selectedCourse, setSelectedCourse]);

  // Reset specific assignment when course changes
  useEffect(() => {
    if (selectedCourse) {
      setSelectedSpecificAssignment("all");
    }
  }, [selectedCourse]);

  // Fetch exams when course changes
  useEffect(() => {
    const fetchExams = async () => {
      if (!selectedCourse) {
        setLocalExams([]);
        return;
      }

      try {
        const response = await getListExam({ course_id: selectedCourse });
        if (response.data?.exams) {
          setLocalExams(response.data.exams);
        } else {
          setLocalExams([]);
        }
      } catch (error) {
        console.error("Error fetching exams:", error);
        setLocalExams([]);
      }
    };

    fetchExams();
  }, [selectedCourse]);

  // Reset specific assignment when there are no exams for selected course
  useEffect(() => {
    if (localExams.length === 0 && selectedSpecificAssignment !== "all") {
      setSelectedSpecificAssignment("all");
    }
  }, [localExams.length, selectedSpecificAssignment]);

  // Reset về trang đầu khi thay đổi filter (KHÔNG phải khi thay đổi trang)
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedCourse,
    selectedYear,
    selectedMonth,
    fromDate,
    toDate,
    selectedSpecificAssignment,
    sortOrder,
  ]);

  // Fetch exam ranking data khi course, exam, hoặc trang thay đổi
  useEffect(() => {
    const fetchExamData = async () => {
      if (!selectedCourse) {
        setExamData(null);
        return;
      }

      setLoading(true);
      try {
        const dateRange = calculateDateRange();

        const params: any = {
          course_id: selectedCourse,
          order_by: sortOrder,
          limit: pageSize,
          page: currentPage,
        };

        if (dateRange.start_date != null) {
          params.start_date = dateRange.start_date;
        }
        if (dateRange.end_date != null) {
          params.end_date = dateRange.end_date;
        }

        // Thêm exam_id nếu có bài cụ thể được chọn
        if (
          selectedSpecificAssignment &&
          selectedSpecificAssignment !== "all"
        ) {
          params.exam_id = selectedSpecificAssignment;
        }

        const response = await getExamRanking(params);
        if (response.data) {
          setExamData(response.data);
          setTotalStudents(parseInt(response.data.total));
        }
      } catch (error) {
        console.error("Error fetching exam data:", error);
        setExamData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [
    selectedCourse,
    selectedYear,
    selectedMonth,
    fromDate,
    toDate,
    selectedSpecificAssignment,
    sortOrder,
    currentPage,
    pageSize,
  ]);

  // Chuẩn bị dữ liệu cho biểu đồ
  const chartData =
    examData?.score_chart?.map((item) => ({
      range: item.score_range,
      count: parseInt(item.student_count),
    })) || [];

  // Helpers to format values for display
  const formatAverageRatio = (value: number | string | null | undefined) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (num === null || num === undefined || isNaN(Number(num))) return "-";
    return `${Math.round(Number(num))}%`;
  };

  const parseAverageRatio = (value: number | string | null | undefined) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return isNaN(Number(num)) ? 0 : Number(num);
  };

  const formatSecondsToMinutesSeconds = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(Number(value)))
      return "-";
    const totalSeconds = Math.floor(Number(value));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Exam Filters */}
      <Card className="bg-white rounded-2xl border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 xl:grid-cols-7 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" />
                {t("filters.year")}
              </label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors">
                  <SelectValue placeholder={t("filters.selectYear")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  <SelectItem value="all" className="rounded-lg">
                    {t("filters.allYears")}
                  </SelectItem>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year} className="rounded-lg">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" />
                {t("filters.month")}
              </label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors">
                  <SelectValue placeholder={t("filters.selectMonth")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  <SelectItem value="all" className="rounded-lg">
                    {t("filters.allMonths")}
                  </SelectItem>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                    const date = new Date(2024, month - 1, 1); // month - 1 vì JavaScript month bắt đầu từ 0
                    const monthName = new Intl.DateTimeFormat(currentLocale, {
                      month: "long",
                    }).format(date);
                    return (
                      <SelectItem
                        key={month}
                        value={month.toString()}
                        className="rounded-lg"
                      >
                        {monthName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" />
                {t("filters.fromDate")}
              </label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" />
                {t("filters.toDate")}
              </label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                {t("filters.course")}
              </label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors">
                  <SelectValue placeholder={t("filters.selectCourse")}>
                    {courses.find((course) => course.id === selectedCourse)
                      ?.name || t("filters.selectCourse")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  {courses.map((course) => (
                    <SelectItem
                      key={course.id}
                      value={course.id}
                      className="rounded-lg"
                    >
                      {course.name} ({course.object_title})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-emerald-600" />
                {t("filters.specificExam")}
              </label>
              <Select
                value={selectedSpecificAssignment}
                onValueChange={setSelectedSpecificAssignment}
                disabled={!selectedCourse || localExams.length === 0}
              >
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue
                    placeholder={
                      !selectedCourse
                        ? t("filters.pleaseSelectCourse")
                        : localExams.length === 0
                        ? t("filters.noExamsAvailable")
                        : t("filters.selectSpecificExam")
                    }
                  >
                    {selectedSpecificAssignment === "all"
                      ? t("filters.allExams")
                      : localExams.find(
                          (exam) => exam.id === selectedSpecificAssignment
                        )?.name || t("filters.selectSpecificExam")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  <SelectItem value="all" className="rounded-lg">
                    {t("filters.allExams")}
                  </SelectItem>
                  {!selectedCourse ? (
                    <SelectItem
                      value="no-course"
                      disabled
                      className="rounded-lg text-gray-400"
                    >
                      {t("filters.pleaseSelectCourse")}
                    </SelectItem>
                  ) : localExams.length === 0 ? (
                    <SelectItem
                      value="no-exams"
                      disabled
                      className="rounded-lg text-gray-400"
                    >
                      {t("filters.noExamsAvailable")}
                    </SelectItem>
                  ) : (
                    localExams.map((exam) => (
                      <SelectItem
                        key={exam.id}
                        value={exam.id}
                        className="rounded-lg"
                      >
                        {exam.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exam Reports */}
      <div>
        <Card className="bg-white rounded-2xl border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {t("chart.title")}
                </CardTitle>
                <p className="text-gray-500 text-sm mt-1">
                  {t("chart.subtitle")}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[200px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : examData ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="range"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    stroke="#6b7280"
                  />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    stroke="#6b7280"
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 border rounded-lg shadow-lg">
                            <p className="font-medium">
                              {t("chart.scoreLabel", { range: label })}
                            </p>
                            <p className="text-blue-600">
                              {t("chart.studentCount", {
                                count: Number(payload[0].value) || 0,
                              })}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-500">
                {!selectedCourse
                  ? t("chart.selectCourseFirst")
                  : t("chart.noData")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Student Exam Details */}
      <Card className="bg-white rounded-2xl border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between ">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {t("ranking.title")}
                </CardTitle>
                <p className="text-gray-500 text-sm mt-1">
                  {examData
                    ? t("ranking.totalStudents", { total: examData.total })
                    : t("ranking.subtitle")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                {t("ranking.sortBy")}
              </span>
              <Select
                value={sortOrder}
                onValueChange={(value: "asc" | "desc") => setSortOrder(value)}
              >
                <SelectTrigger className="w-32 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">
                    {t("ranking.descending")}
                  </SelectItem>
                  <SelectItem value="asc">{t("ranking.ascending")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : examData?.students ? (
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow className="border-gray-100 bg-gray-50">
                    <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 rounded-l-xl px-6">
                      {t("ranking.rank")}
                    </TableHead>
                    <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 px-6">
                      {t("ranking.student")}
                    </TableHead>
                    <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 text-center px-6">
                      {t("ranking.averageScore")}
                    </TableHead>
                    <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 text-center px-6">
                      {t("ranking.averageTime")}
                    </TableHead>
                    <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 text-center px-6 rounded-r-xl">
                      {t("ranking.examCount")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examData.students.map((student, index) => (
                    <TableRow
                      key={student.student_id}
                      className="border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="px-6 py-3 font-semibold text-gray-900">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                            index === 0
                              ? "bg-yellow-100 text-yellow-700"
                              : index === 1
                              ? "bg-gray-100 text-gray-700"
                              : index === 2
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-50 text-gray-600"
                          }`}
                        >
                          {index + 1}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3 font-semibold text-gray-900">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.avatar || `/avatar-kid.png`}
                            alt={student.student_name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          {student.student_name}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3 text-center">
                        <Badge
                          className={`${
                            parseAverageRatio(student.average_ratio) >= 80
                              ? "bg-green-100 text-green-700"
                              : parseAverageRatio(student.average_ratio) >= 65
                              ? "bg-blue-100 text-blue-700"
                              : parseAverageRatio(student.average_ratio) >= 50
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          } rounded-full px-3 py-1 font-bold`}
                        >
                          {formatAverageRatio(student.average_ratio)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-3 text-center tabular-nums text-gray-600">
                        {formatSecondsToMinutesSeconds(student.average_time)}
                      </TableCell>
                      <TableCell className="px-6 py-3 text-center tabular-nums text-gray-600">
                        {parseInt(String(student.number_exams ?? 0), 10) || 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              {!selectedCourse
                ? t("ranking.selectCourseFirst")
                : t("ranking.noData")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {examData?.students && examData.students.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border-0 shadow-lg p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{t("pagination.showing")}</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(parseInt(value));
                setCurrentPage(1); // Reset về trang đầu khi thay đổi page size
              }}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span>
              {t("pagination.of")} {totalStudents} {t("pagination.students")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1">
              {(() => {
                const totalPages = Math.ceil(totalStudents / pageSize);
                const maxVisiblePages = 5;
                let startPage = 1;
                let endPage = totalPages;

                if (totalPages > maxVisiblePages) {
                  if (currentPage <= 3) {
                    endPage = maxVisiblePages;
                  } else if (currentPage >= totalPages - 2) {
                    startPage = totalPages - maxVisiblePages + 1;
                  } else {
                    startPage = currentPage - 2;
                    endPage = currentPage + 2;
                  }
                }

                const pages = [];
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(i);
                }

                return pages.map((pageNum) => {
                  const isCurrentPage = pageNum === currentPage;

                  return (
                    <Button
                      key={pageNum}
                      variant={isCurrentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="h-8 w-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                });
              })()}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= Math.ceil(totalStudents / pageSize)}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}