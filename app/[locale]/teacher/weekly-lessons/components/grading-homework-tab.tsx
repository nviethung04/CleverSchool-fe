"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTypedTranslations, useCurrentLocale } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Clock,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  Eye,
  Pencil,
  ClipboardList,
  Info,
  Calendar,
  BookOpen,
  Search,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ProfessionalPagination from "@/components/ui/professional-pagination";

import {
  getListCourse,
  getListHomework,
  getTeacherHomeworkScored,
  getTeacherHomeworkUnscored,
  getTeacherHomeworkOverviewGrade,
} from "@/lib/api/dashboard";
import { useTabQueryString } from "@/hooks/use-tab-query-string";
import { sortByNumberAndAlphabetFromSecondGeneric } from "@/lib/utils";

type CourseOption = {
  id: string;
  name?: string;
  object_title?: string;
  [key: string]: any;
};

export function GradingHomeworkTab() {
  // Sử dụng hook với namespace "homework"
  const { getValue, setParams } = useTabQueryString("homework");
  const router = useRouter();
  const t = useTypedTranslations("gradingHomeworkTab");
  const currentLocale = useCurrentLocale();

  // Helper function for locale-aware date formatting
  const formatDate = (timestamp: string | number) => {
    const date = new Date(parseInt(timestamp.toString()) * 1000);
    try {
      return new Intl.DateTimeFormat(currentLocale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(date);
    } catch {
      return date.toLocaleString();
    }
  };

  // Get current date info
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear().toString();
  const currentMonth = (currentDate.getMonth() + 1).toString();

  // Grading states
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedHomework, setSelectedHomework] = useState("all");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  // const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // API data states
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [scoredHomeworks, setScoredHomeworks] = useState<any[]>([]);
  const [unscoredHomeworks, setUnscoredHomeworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalAssignments: 0,
    submitted: 0,
    pending: 0,
    completionRate: 0,
  });
  const [overviewStats, setOverviewStats] = useState({
    total_submitted: "0",
    total_scored: "0",
    total_unscored: "0",
    completion_rate: 0,
    total_no_manual_scoring: "0",
  });

  // Pagination states
  const [currentPageScored, setCurrentPageScored] = useState(1);
  const [currentPageUnscored, setCurrentPageUnscored] = useState(1);
  const [totalItemsScored, setTotalItemsScored] = useState(0);
  const [totalItemsUnscored, setTotalItemsUnscored] = useState(0);
  const [pageSizeScored, setPageSizeScored] = useState(10);
  const [pageSizeUnscored, setPageSizeUnscored] = useState(10);

  // Search states
  const [searchScored, setSearchScored] = useState("");
  const [searchUnscored, setSearchUnscored] = useState("");

  const totalPagesScored =
    Math.max(1, Math.ceil(totalItemsScored / pageSizeScored) || 1);
  const totalPagesUnscored =
    Math.max(1, Math.ceil(totalItemsUnscored / pageSizeUnscored) || 1);

  // Calculate date range based on selected filters
  const calculateDateRange = () => {
    let startDate: Date;
    let endDate: Date;

    if (fromDate && toDate) {
      // Set startDate to 00:00:00 and endDate to 23:59:59
      startDate = new Date(fromDate + "T00:00:00");
      endDate = new Date(toDate + "T23:59:59");
    } else if (selectedYear !== "all") {
      if (selectedMonth !== "all") {
        // Month-based range
        const year = parseInt(selectedYear);
        const month = parseInt(selectedMonth) - 1;
        startDate = new Date(year, month, 1, 0, 0, 0);
        endDate = new Date(year, month + 1, 0, 23, 59, 59);
      } else {
        // Year-based range
        const year = parseInt(selectedYear);
        startDate = new Date(year, 0, 1, 0, 0, 0);
        endDate = new Date(year, 11, 31, 23, 59, 59);
      }
    } else {
      // Default to current year
      const year = currentDate.getFullYear();
      startDate = new Date(year, 0, 1, 0, 0, 0);
      endDate = new Date(year, 11, 31, 23, 59, 59);
    }

    return {
      start_date: Math.floor(startDate.getTime() / 1000),
      end_date: Math.floor(endDate.getTime() / 1000),
    };
  };

  // Fetch courses
  useEffect(() => {
    let isMounted = true;

    // Bỏ dòng xóa week và courseId - không cần thiết vì đã dùng namespace
    const fetchCourses = async () => {
      try {
        const response = await getListCourse();
        if (!isMounted) return; // Không update nếu component đã unmount hoặc effect đã cleanup

        const fetchedCourses: CourseOption[] = response.data?.courses ?? [];
        setCourses(fetchedCourses);

        if (fetchedCourses.length === 0) {
          if (isMounted) setSelectedCourse("all");
          return;
        }

        // Đọc courseId từ URL với namespace "homework"
        const urlCourseId = getValue("courseId");
        if (isMounted) {
          setSelectedCourse((prevSelectedCourse) => {
            // Ưu tiên giá trị từ URL
            if (urlCourseId && urlCourseId !== "all") {
              const exists = fetchedCourses.some((c) => c.id === urlCourseId);
              if (exists) return urlCourseId;
            }

            // Nếu đã chọn một khóa học hợp lệ (khác "all") thì giữ nguyên
            const stillExists = fetchedCourses.some(
              (course) => course.id === prevSelectedCourse
            );
            if (
              prevSelectedCourse &&
              prevSelectedCourse !== "all" &&
              stillExists
            ) {
              return prevSelectedCourse;
            }
            // Mặc định là "Tất cả khóa học"
            return "all";
          });
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching courses:", error);
        }
      }
    };

    fetchCourses();

    return () => {
      isMounted = false;
    };
  }, [getValue]);

  // Fetch homeworks when course changes
  useEffect(() => {
    let isMounted = true;

    const fetchHomeworks = async () => {
      if (!selectedCourse) {
        if (isMounted) setHomeworks([]);
        return;
      }

      try {
        const { start_date, end_date } = calculateDateRange();

        const params: any = {
          is_assigned: true,
          start_date,
          end_date,
        };

        if (selectedCourse && selectedCourse !== "all") {
          params.course_id = selectedCourse;
        }

        const response = await getListHomework(params);
        if (!isMounted) return; // Không update nếu component đã unmount

        if (response.data?.homeworks) {
          setHomeworks(response.data.homeworks);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching homeworks:", error);
        }
      }
    };

    fetchHomeworks();

    return () => {
      isMounted = false;
    };
  }, [selectedCourse, fromDate, toDate]);

  // Fetch homework data when filters change
  useEffect(() => {
    let isMounted = true;

    const fetchHomeworkData = async () => {
      if (!selectedCourse) {
        return;
      }

      // Lưu lại giá trị hiện tại để kiểm tra race condition
      const currentCourseId = selectedCourse;
      const currentHomeworkId = selectedHomework;

      setLoading(true);
      try {
        const { start_date, end_date } = calculateDateRange();

        // Prepare params for scored homeworks
        const scoredParams: any = {
          start_date,
          end_date,
          page: currentPageScored,
          limit: pageSizeScored,
        };
        if (selectedCourse !== "all") {
          scoredParams.course_id = selectedCourse;
        }
        if (selectedHomework !== "all") {
          scoredParams.homework_id = selectedHomework;
        }
        if (searchScored) {
          scoredParams.student_name = searchScored;
        }

        // Prepare params for unscored homeworks
        const unscoredParams: any = {
          start_date,
          end_date,
          page: currentPageUnscored,
          limit: pageSizeUnscored,
        };
        if (selectedCourse !== "all") {
          unscoredParams.course_id = selectedCourse;
        }
        if (selectedHomework !== "all") {
          unscoredParams.homework_id = selectedHomework;
        }
        if (searchUnscored) {
          unscoredParams.student_name = searchUnscored;
        }

        // Prepare params for overview API
        const overviewParams: any = {
          start_date,
          end_date,
        };
        if (selectedCourse !== "all") {
          overviewParams.course_id = selectedCourse;
        }
        if (selectedHomework !== "all") {
          overviewParams.homework_id = selectedHomework;
        }

        // Fetch all data in parallel
        const [scoredResponse, unscoredResponse, overviewResponse] =
          await Promise.all([
            getTeacherHomeworkScored(scoredParams),
            getTeacherHomeworkUnscored(unscoredParams),
            getTeacherHomeworkOverviewGrade(overviewParams),
          ]);

        // Chỉ update state nếu component vẫn mounted và params vẫn đúng (tránh race condition)
        if (!isMounted) return;

        // Kiểm tra xem filter có thay đổi không (tránh update với data cũ)
        if (
          currentCourseId !== selectedCourse ||
          currentHomeworkId !== selectedHomework
        ) {
          return; // Bỏ qua response này vì filter đã thay đổi
        }

        if (scoredResponse.data?.homeworks) {
          setScoredHomeworks(scoredResponse.data.homeworks);
          setTotalItemsScored(scoredResponse.data.total || 0);
        }
        if (unscoredResponse.data?.homeworks) {
          setUnscoredHomeworks(unscoredResponse.data.homeworks);
          setTotalItemsUnscored(unscoredResponse.data.total || 0);
        }

        // Handle overview stats
        if (overviewResponse.data?.overview) {
          setOverviewStats(overviewResponse.data.overview);
        }

        // Calculate stats
        const total =
          (scoredResponse.data?.total || 0) +
          (unscoredResponse.data?.total || 0);
        const submitted = scoredResponse.data?.total || 0;
        const pending = unscoredResponse.data?.total || 0;
        const completionRate = total > 0 ? (submitted / total) * 100 : 0;

        setStats({
          totalAssignments: total,
          submitted,
          pending,
          completionRate,
        });
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching homework data:", error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHomeworkData();

    return () => {
      isMounted = false;
    };
  }, [
    selectedCourse,
    selectedHomework,
    selectedYear,
    selectedMonth,
    fromDate,
    toDate,
    currentPageScored,
    currentPageUnscored,
    searchScored,
    searchUnscored,
    pageSizeScored,
    pageSizeUnscored,
  ]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPageScored(1);
    setCurrentPageUnscored(1);
  }, [
    selectedCourse,
    selectedHomework,
    selectedYear,
    selectedMonth,
    fromDate,
    toDate,
    searchScored,
    searchUnscored,
  ]);

  const handleGradeHomework = (
    homeworkId: string,
    userId: string,
    lessonId: string
  ) => {
    router.push(
      `/teacher/lessons/${lessonId}/homework/${homeworkId}/student/${userId}`
    );
  };

  const handleViewResult = (
    homeworkId: string,
    userId: string,
    lessonId: string
  ) => {
    router.push(
      `/teacher/lessons/${lessonId}/homework/${homeworkId}/student/${userId}`
    );
  };

  // Đọc tất cả params từ URL với namespace "homework"
  useEffect(() => {
    const year = getValue("year");
    const month = getValue("month");
    const fromDateParam = getValue("from_date");
    const toDateParam = getValue("to_date");
    const courseId = getValue("courseId");
    const homework = getValue("homework");

    // Chỉ update nếu giá trị thực sự thay đổi để tránh re-render không cần thiết
    // Sử dụng functional update để tránh dependency trên state
    if (year) {
      setSelectedYear((prev) => (prev !== year ? year : prev));
    }
    if (month) {
      setSelectedMonth((prev) => (prev !== month ? month : prev));
    }
    if (fromDateParam) {
      setFromDate((prev) => (prev !== fromDateParam ? fromDateParam : prev));
    }
    if (toDateParam) {
      setToDate((prev) => (prev !== toDateParam ? toDateParam : prev));
    }
    if (courseId) {
      setSelectedCourse((prev) => (prev !== courseId ? courseId : prev));
    }
    if (homework) {
      setSelectedHomework((prev) => (prev !== homework ? homework : prev));
    }
  }, [getValue]);

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <Card className="bg-white rounded-2xl border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 xl:grid-cols-6 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" />
                {t("filters.year")}
              </label>
              <Select
                value={selectedYear}
                onValueChange={(value) => {
                  setSelectedYear(value);
                  setParams({ year: value });
                }}
              >
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors">
                  <SelectValue placeholder={t("filters.selectYear")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  <SelectItem value="all" className="rounded-lg">
                    {t("filters.allYears")}
                  </SelectItem>
                  <SelectItem value="2026" className="rounded-lg">
                    2026
                  </SelectItem>
                  <SelectItem value="2025" className="rounded-lg">
                    2025
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" />
                {t("filters.month")}
              </label>
              <Select
                value={selectedMonth}
                onValueChange={(value) => {
                  setSelectedMonth(value);
                  setParams({ month: value });
                }}
              >
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors">
                  <SelectValue placeholder={t("filters.selectMonth")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  <SelectItem value="all" className="rounded-lg">
                    {t("filters.allMonths")}
                  </SelectItem>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem
                      key={month}
                      value={month.toString()}
                      className="rounded-lg"
                    >
                      {t("filters.monthNumber", { month })}
                    </SelectItem>
                  ))}
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
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setParams({ from_date: e.target.value });
                }}
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
                onChange={(e) => {
                  setToDate(e.target.value);
                  setParams({ to_date: e.target.value });
                }}
                className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                {t("filters.course")}
              </label>
              <Select
                value={selectedCourse}
                onValueChange={(value) => {
                  setSelectedCourse(value);
                  setParams({ courseId: value });
                }}
              >
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors">
                  <SelectValue placeholder={t("filters.selectCourse")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  <SelectItem value="all" className="rounded-lg">
                    {t("filters.allCourses")}
                  </SelectItem>
                  {sortByNumberAndAlphabetFromSecondGeneric(courses, item => item.name as string, true).map((course) => (
                    <SelectItem
                      key={course.id}
                      value={course.id}
                      className="rounded-lg"
                    >
                      {course.object_title
                        ? `${course.name} (${course.object_title})`
                        : course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-emerald-600" />
                {t("filters.homework")}
              </label>
              <Select
                value={selectedHomework}
                onValueChange={(value) => {
                  setSelectedHomework(value);
                  setParams({ homework: value });
                }}
              >
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors">
                  <SelectValue placeholder={t("filters.selectHomework")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  <SelectItem value="all" className="rounded-lg">
                    {t("filters.allHomeworks")}
                  </SelectItem>
                  {sortByNumberAndAlphabetFromSecondGeneric(homeworks, item => item.name, true).map((homework) => (
                    <SelectItem
                      key={homework.id}
                      value={homework.id}
                      className="rounded-lg"
                    >
                      {homework.name} - {homework.lesson_title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ClipboardList className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-blue-600 text-sm font-semibold mb-2">
                  {t("stats.totalSubmitted")}
                </p>
                <p className="text-3xl font-bold text-blue-900">
                  {overviewStats.total_submitted}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-pink-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ClipboardList className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-pink-600 text-sm font-semibold mb-2">
                  {t("stats.totalNoManualScoring")}
                </p>
                <p className="text-3xl font-bold text-pink-900">
                  {overviewStats.total_no_manual_scoring}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-green-600 text-sm font-semibold mb-2">
                  {t("stats.graded")}
                </p>
                <p className="text-3xl font-bold text-green-900">
                  {overviewStats.total_scored}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-orange-600 text-sm font-semibold mb-2">
                  {t("stats.pending")}
                </p>
                <p className="text-3xl font-bold text-orange-900">
                  {overviewStats.total_unscored}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-purple-600 text-sm font-semibold mb-2">
                  {t("stats.completionRate")}
                </p>
                <p className="text-3xl font-bold text-purple-900">
                  {overviewStats.completion_rate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Homework */}
      <Card className="bg-white rounded-2xl border-0 shadow-lg">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {t("pendingHomework.title")}
                </CardTitle>
                <p className="text-gray-500 text-sm mt-1">
                  {t("pendingHomework.subtitle", { count: totalItemsUnscored })}
                </p>
              </div>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Tìm kiếm theo tên học sinh..."
                value={searchUnscored}
                onChange={(e) => setSearchUnscored(e.target.value)}
                className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100 bg-gray-50">
                  <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 rounded-l-xl px-6">
                    {t("table.student")}
                  </TableHead>
                  <TableHead className="text-sm font-bold text-gray-700 bg-gray-50">
                    {t("table.course")}
                  </TableHead>
                  <TableHead className="text-sm font-bold text-gray-700 bg-gray-50">
                    {t("table.homework")}
                  </TableHead>
                  <TableHead className="text-sm font-bold text-gray-700 bg-gray-50">
                    {t("table.submittedDate")}
                  </TableHead>
                  <TableHead className="text-sm font-bold text-gray-700 bg-gray-50">
                    {t("table.ratio")}
                  </TableHead>
                  <TableHead className="text-sm font-bold text-gray-700 bg-gray-50">
                    {t("table.unscoredQuestions")}
                  </TableHead>
                  <TableHead className="text-sm font-bold text-gray-700 bg-gray-50">
                    {t("table.hasComment")}
                  </TableHead>
                  <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 rounded-r-xl px-6">
                    {t("table.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                        <span className="text-gray-600 font-medium">
                          {t("loading")}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : unscoredHomeworks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                          <ClipboardList className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium text-lg">
                          {t("emptyStates.noPendingHomeworks")}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          {t("emptyStates.allProcessed")}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  unscoredHomeworks.map((homework, index) => (
                    <TableRow
                      key={`${homework.homework_id}-${homework.user_id}-${index}`}
                      className="border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="font-semibold text-gray-900 px-6">
                        {homework.student_name}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {`${homework.course_name}${
                            homework.object_title
                              ? ` (${homework.object_title})`
                              : ""
                          }`}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700 font-medium">
                        {`${homework.homework_name} ${
                          homework.lesson_title
                            ? ` - ${homework.lesson_title}`
                            : ""
                        }`}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {homework.submitted_at
                          ? formatDate(homework.submitted_at)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            homework.ratio >= 80
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : homework.ratio >= 65
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                              : homework.ratio >= 50
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          } rounded-full px-3 py-1 font-bold`}
                        >
                          {homework.ratio?.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700 font-medium">
                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-lg text-sm">
                          {homework.unscored_questions} /{" "}
                          {homework.manual_questions}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-700 font-medium">
                        <span
                          className={`px-2 py-1 rounded-lg text-sm ${
                            homework.has_comment
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {homework.has_comment ? "Đã có" : "Chưa có"}
                        </span>
                      </TableCell>
                      <TableCell className="px-6">
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                          onClick={() =>
                            handleGradeHomework(
                              homework.homework_id,
                              homework.user_id,
                              homework.lesson_id
                            )
                          }
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          {t("actions.grade")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {/* Pagination for Pending Homework */}
        {!loading && unscoredHomeworks.length > 0 && (
          <CardFooter className="border-t border-gray-100 bg-gray-50 px-6 py-1 rounded-b-2xl">
            <div className="w-full">
              <ProfessionalPagination
                currentPage={currentPageUnscored}
                totalPages={totalPagesUnscored}
                totalCount={totalItemsUnscored}
                pageSize={pageSizeUnscored}
                pageSizeOptions={[10, 30, 50, 100]}
                onPageChange={setCurrentPageUnscored}
                onPageSizeChange={(size) => {
                  setPageSizeUnscored(size);
                  setCurrentPageUnscored(1);
                }}
              />
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Graded Homework */}
      <Card className="bg-white rounded-2xl border-0 shadow-lg">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {t("gradedHomework.title")}
                </CardTitle>
                <p className="text-gray-500 text-sm mt-1">
                  {t("gradedHomework.subtitle", { count: totalItemsScored })}
                </p>
              </div>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Tìm kiếm theo tên học sinh..."
                value={searchScored}
                onChange={(e) => setSearchScored(e.target.value)}
                className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100 bg-gray-50">
                  <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 rounded-l-xl px-6">
                    {t("table.student")}
                  </TableHead>
                  <TableHead className="text-sm font-bold text-gray-700 bg-gray-50">
                    {t("table.course")}
                  </TableHead>
                  <TableHead className="text-sm font-bold text-gray-700 bg-gray-50">
                    {t("table.homework")}
                  </TableHead>
                  <TableHead className="text-sm font-bold text-gray-700 bg-gray-50">
                    {t("table.teacher")}
                  </TableHead>
                  <TableHead className="text-sm font-bold text-gray-700 bg-gray-50">
                    {t("table.submittedDate")}
                  </TableHead>
                  <TableHead className="text-sm font-bold text-gray-700 bg-gray-50">
                    <div className="flex items-center gap-2">
                      {t("table.score")}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("table.gradedScoreTooltip")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableHead>
                  <TableHead className="text-sm font-bold text-gray-700 bg-gray-50">
                    {t("table.hasComment")}
                  </TableHead>
                  <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 rounded-r-xl px-6">
                    {t("table.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                        <span className="text-gray-600 font-medium">
                          {t("loading")}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : scoredHomeworks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                          <CheckCircle className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium text-lg">
                          {t("emptyStates.noGradedHomeworks")}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          {t("emptyStates.noneCompleted")}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  scoredHomeworks.map((homework, index) => (
                    <TableRow
                      key={`${homework.homework_id}-${homework.user_id}-${index}`}
                      className="border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="font-semibold text-gray-900 px-6">
                        {homework.student_name}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {`${homework.course_name}${
                            homework.object_title
                              ? ` (${homework.object_title})`
                              : ""
                          }`}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700 font-medium">
                        {`${homework.homework_name} ${
                          homework.lesson_title
                            ? ` - ${homework.lesson_title}`
                            : ""
                        }`}
                      </TableCell>
                      <TableCell className="text-gray-700 font-medium">
                        {homework.graders?.[0]?.name || ""}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {homework.submitted_at
                          ? formatDate(homework.submitted_at)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            homework.ratio >= 80
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : homework.ratio >= 65
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                              : homework.ratio >= 50
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          } rounded-full px-3 py-1 font-bold`}
                        >
                          {homework.ratio?.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700 font-medium">
                        <span
                          className={`px-2 py-1 rounded-lg text-sm ${
                            homework.has_comment
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {homework.has_comment ? "Đã có" : "Chưa có"}
                        </span>
                      </TableCell>
                      <TableCell className="px-6">
                        <Button
                          size="sm"
                          variant="outline"
                          className={`rounded-xl font-medium transition-colors ${
                            homework.has_comment
                              ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                              : "border-orange-300 text-orange-700 hover:bg-orange-50"
                          }`}
                          onClick={() =>
                            handleViewResult(
                              homework.homework_id,
                              homework.user_id,
                              homework.lesson_id
                            )
                          }
                        >
                          {homework.has_comment ? (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              {t("actions.viewResult")}
                            </>
                          ) : (
                            <>
                              <Pencil className="h-4 w-4 mr-2" />
                              {t("actions.writeComment")}
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {/* Pagination for Graded Homework */}
        {!loading && scoredHomeworks.length > 0 && (
          <CardFooter className="border-t border-gray-100 bg-gray-50 px-6 py-4 rounded-b-2xl">
            <div className="w-full">
              <ProfessionalPagination
                currentPage={currentPageScored}
                totalPages={totalPagesScored}
                totalCount={totalItemsScored}
                pageSize={pageSizeScored}
                pageSizeOptions={[10, 30, 50, 100]}
                onPageChange={setCurrentPageScored}
                onPageSizeChange={(size) => {
                  setPageSizeScored(size);
                  setCurrentPageScored(1);
                }}
              />
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
