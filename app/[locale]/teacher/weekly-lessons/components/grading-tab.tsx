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
  ClipboardList,
  Info,
  Calendar,
  BookOpen,
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

import {
  getListCourse,
  getListExam,
  getTeacherExamScored,
  getTeacherExamUnscored,
  getTeacherExamOverview,
} from "@/lib/api/dashboard";

export function GradingTab() {
  const router = useRouter();
  const t = useTypedTranslations("gradingTab");
  const currentLocale = useCurrentLocale();

  // Helper function for locale-aware date formatting
  const formatDate = (timestamp: string | number) => {
    const date = new Date(parseInt(timestamp.toString()) * 1000);
    try {
      return new Intl.DateTimeFormat(currentLocale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
    } catch {
      return date.toLocaleDateString();
    }
  };

  // Get current date info
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear().toString();
  const currentMonth = (currentDate.getMonth() + 1).toString();
  const currentQuarter = getCurrentQuarter(currentDate);

  // Helper function to get current quarter
  function getCurrentQuarter(date: Date) {
    const month = date.getMonth() + 1;
    if (month >= 1 && month <= 3) return "Q1";
    if (month >= 4 && month <= 6) return "Q2";
    if (month >= 7 && month <= 9) return "Q3";
    return "Q4";
  }

  // Grading states
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedHomework, setSelectedHomework] = useState("all");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  // const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // API data states
  const [courses, setCourses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [scoredExams, setScoredExams] = useState<any[]>([]);
  const [unscoredExams, setUnscoredExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalAssignments: 0,
    submitted: 0,
    graded: 0,
    pending: 0,
    completionRate: 0,
  });

  // Pagination states
  const [currentPageScored, setCurrentPageScored] = useState(1);
  const [currentPageUnscored, setCurrentPageUnscored] = useState(1);
  const [totalPagesScored, setTotalPagesScored] = useState(1);
  const [totalPagesUnscored, setTotalPagesUnscored] = useState(1);
  const [totalItemsScored, setTotalItemsScored] = useState(0);
  const [totalItemsUnscored, setTotalItemsUnscored] = useState(0);
  const itemsPerPage = 10;

  // Helper function to calculate date range from filters
  const calculateDateRange = () => {
    let startDate = new Date();
    let endDate = new Date();

    // Set year
    if (selectedYear !== "all") {
      startDate.setFullYear(parseInt(selectedYear));
      endDate.setFullYear(parseInt(selectedYear));
    }

    // Quarter logic removed

    // Set month
    if (selectedMonth !== "all") {
      const monthIndex = parseInt(selectedMonth) - 1;
      startDate.setMonth(monthIndex, 1); // Set to first day of month
      endDate.setMonth(monthIndex + 1, 0); // Set to last day of month
    }

    // Set specific date range (overrides all above)
    if (fromDate) {
      startDate = new Date(fromDate);
    }
    if (toDate) {
      endDate = new Date(toDate);
    }

    // Set to start and end of day
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return {
      start_date: Math.floor(startDate.getTime() / 1000), // Convert to Unix timestamp
      end_date: Math.floor(endDate.getTime() / 1000), // Convert to Unix timestamp
    };
  };

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await getListCourse({});
        if (response.data?.courses) {
          setCourses(response.data.courses);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    fetchCourses();
  }, []);

  // Fetch exams when course changes
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const params: any = {};
        if (selectedCourse !== "all") {
          params.course_id = selectedCourse;
        }

        const response = await getListExam(params);
        if (response.data?.exams) {
          setExams(response.data.exams);
        }
      } catch (error) {
        console.error("Error fetching exams:", error);
      }
    };

    fetchExams();
  }, [selectedCourse]);

  // Fetch exam data when filters change
  useEffect(() => {
    const fetchExamData = async () => {
      setLoading(true);
      try {
        const { start_date, end_date } = calculateDateRange();

        // Prepare params for scored exams
        const scoredParams: any = {
          start_date,
          end_date,
          page: currentPageScored,
          limit: itemsPerPage,
        };
        if (selectedCourse !== "all") {
          scoredParams.course_id = selectedCourse;
        }
        if (selectedHomework !== "all") {
          scoredParams.exam_id = selectedHomework;
        }

        // Prepare params for unscored exams
        const unscoredParams: any = {
          start_date,
          end_date,
          page: currentPageUnscored,
          limit: itemsPerPage,
        };
        if (selectedCourse !== "all") {
          unscoredParams.course_id = selectedCourse;
        }
        if (selectedHomework !== "all") {
          unscoredParams.exam_id = selectedHomework;
        }

        // Prepare params for overview
        const overviewParams: any = {
          start_date,
          end_date,
        };
        if (selectedCourse !== "all") {
          overviewParams.course_id = selectedCourse;
        }
        if (selectedHomework !== "all") {
          overviewParams.exam_id = selectedHomework;
        }

        // Fetch all data in parallel
        const [scoredResponse, unscoredResponse, overviewResponse] =
          await Promise.all([
            getTeacherExamScored(scoredParams),
            getTeacherExamUnscored(unscoredParams),
            getTeacherExamOverview(overviewParams),
          ]);

        if (scoredResponse.data?.exams) {
          setScoredExams(scoredResponse.data.exams);
          setTotalItemsScored(scoredResponse.data.total || 0);
          setTotalPagesScored(
            Math.ceil((scoredResponse.data.total || 0) / itemsPerPage)
          );
        }
        if (unscoredResponse.data?.exams) {
          setUnscoredExams(unscoredResponse.data.exams);
          setTotalItemsUnscored(unscoredResponse.data.total || 0);
          setTotalPagesUnscored(
            Math.ceil((unscoredResponse.data.total || 0) / itemsPerPage)
          );
        }

        // Update stats from overview API
        if (overviewResponse.data?.overview) {
          const overview = overviewResponse.data.overview;
          setStats({
            totalAssignments: parseInt(overview.total_submitted) || 0,
            submitted: parseInt(overview.total_submitted) || 0,
            graded: parseInt(overview.total_scored) || 0,
            pending: parseInt(overview.total_unscored) || 0,
            completionRate: overview.completion_rate || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching exam data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [
    selectedCourse,
    selectedHomework,
    selectedYear,
    selectedMonth,
    fromDate,
    toDate,
    currentPageScored,
    currentPageUnscored,
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
  ]);

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
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors">
                  <SelectValue placeholder={t("filters.selectYear")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  <SelectItem value="all" className="rounded-lg">
                    {t("filters.allYears")}
                  </SelectItem>
                  <SelectItem value="2025" className="rounded-lg">
                    2025
                  </SelectItem>
                  <SelectItem value="2024" className="rounded-lg">
                    2024
                  </SelectItem>
                  <SelectItem value="2023" className="rounded-lg">
                    2023
                  </SelectItem>
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
                  <SelectValue placeholder={t("filters.selectCourse")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  <SelectItem value="all" className="rounded-lg">
                    {t("filters.allCourses")}
                  </SelectItem>
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
                {t("filters.exam")}
              </label>
              <Select
                value={selectedHomework}
                onValueChange={setSelectedHomework}
              >
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors">
                  <SelectValue placeholder={t("filters.selectExam")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  <SelectItem value="all" className="rounded-lg">
                    {t("filters.allExams")}
                  </SelectItem>
                  {exams.map((exam) => (
                    <SelectItem
                      key={exam.id}
                      value={exam.id}
                      className="rounded-lg"
                    >
                      {exam.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ClipboardList className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-blue-600 text-sm font-semibold mb-2">
                  {t("stats.totalAssignments")}
                </p>
                <p className="text-3xl font-bold text-blue-900">
                  {stats.totalAssignments}
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
                  {stats.graded}
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
                  {stats.pending}
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
                  {stats.completionRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Homework */}
      <Card className="bg-white rounded-2xl border-0 shadow-lg">
        <CardHeader className="pb-6">
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
                    {t("table.exam")}
                  </TableHead>
                  <TableHead className="text-sm font-bold text-gray-700 bg-gray-50">
                    {t("table.submittedDate")}
                  </TableHead>
                  <TableHead className="text-sm font-bold text-gray-700 bg-gray-50">
                    {t("table.deadline")}
                  </TableHead>
                  <TableHead className="text-sm font-bold text-gray-700 bg-gray-50">
                    {t("table.status")}
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
                            <p>{t("table.scoreTooltip")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableHead>
                  <TableHead className="text-sm font-bold text-gray-700 bg-gray-50">
                    {t("table.unscoredQuestions")}
                  </TableHead>
                  <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 rounded-r-xl px-6">
                    {t("table.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                        <span className="text-gray-600 font-medium">
                          {t("loading")}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : unscoredExams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                          <ClipboardList className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium text-lg">
                          {t("emptyStates.noPendingExams")}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          {t("emptyStates.allProcessed")}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  unscoredExams.map((exam) => (
                    <TableRow
                      key={exam.id}
                      className="border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="font-semibold text-gray-900 px-6">
                        {exam.student_name}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {exam.course_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700 font-medium">
                        {exam.exam_name}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {exam.submitted_at
                          ? formatDate(exam.submitted_at)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {exam.deadline && exam.deadline !== "0"
                          ? formatDate(exam.deadline)
                          : t("noDeadline")}
                      </TableCell>
                      <TableCell>
                        {exam.submit_on_time ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-200 rounded-full px-3 py-1 font-medium">
                            {t("status.onTime")}
                          </Badge>
                        ) : (
                          <Badge className="flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-full px-3 py-1 font-medium">
                            <AlertCircle className="h-3 w-3" />
                            {t("status.overdue")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            exam.ratio >= 80
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : exam.ratio >= 65
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                              : exam.ratio >= 50
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          } rounded-full px-3 py-1 font-bold`}
                        >
                          {exam.ratio?.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700 font-medium">
                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-lg text-sm">
                          {exam.unscored_questions} / {exam.total_questions}
                        </span>
                      </TableCell>
                      <TableCell className="px-6">
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                          onClick={() => {
                            router.push(
                              `/teacher/lessons/${exam.lesson_id}/exam/${exam.exam_id}/student/${exam.user_id}`
                            );
                          }}
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
        {!loading && unscoredExams.length > 0 && totalItemsUnscored > 10 && (
          <CardFooter className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4 rounded-b-2xl">
            <div className="text-sm text-gray-600 font-medium">
              {t("pagination.showing", {
                from: (currentPageUnscored - 1) * itemsPerPage + 1,
                to: Math.min(
                  currentPageUnscored * itemsPerPage,
                  totalItemsUnscored
                ),
                total: totalItemsUnscored,
              })}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPageUnscored(currentPageUnscored - 1)}
                disabled={currentPageUnscored === 1}
                className="rounded-xl border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 font-medium"
              >
                {t("pagination.prev")}
              </Button>
              <div className="flex items-center gap-1">
                {Array.from(
                  { length: totalPagesUnscored },
                  (_, i) => i + 1
                ).map((page) => (
                  <Button
                    key={page}
                    variant={
                      currentPageUnscored === page ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setCurrentPageUnscored(page)}
                    className={`rounded-xl font-medium ${
                      currentPageUnscored === page
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                    }`}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPageUnscored(currentPageUnscored + 1)}
                disabled={currentPageUnscored === totalPagesUnscored}
                className="rounded-xl border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 font-medium"
              >
                {t("pagination.next")}
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Graded Homework */}
      <Card className="bg-white rounded-2xl border-0 shadow-lg">
        <CardHeader className="pb-6">
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
                    {t("table.exam")}
                  </TableHead>
                  <TableHead className="text-sm font-bold text-gray-700 bg-gray-50">
                    {t("table.submittedDate")}
                  </TableHead>
                  <TableHead className="text-sm font-bold text-gray-700 bg-gray-50">
                    {t("table.deadline")}
                  </TableHead>
                  <TableHead className="text-sm font-bold text-gray-700 bg-gray-50">
                    {t("table.submitStatus")}
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
                    {t("table.gradedDate")}
                  </TableHead>
                  <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 rounded-r-xl px-6">
                    {t("table.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                        <span className="text-gray-600 font-medium">
                          {t("loading")}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : scoredExams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                          <CheckCircle className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium text-lg">
                          {t("emptyStates.noGradedExams")}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          {t("emptyStates.noneCompleted")}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  scoredExams.map((exam) => (
                    <TableRow
                      key={exam.id}
                      className="border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="font-semibold text-gray-900 px-6">
                        {exam.student_name}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {exam.course_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700 font-medium">
                        {exam.exam_name}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {exam.submitted_at
                          ? formatDate(exam.submitted_at)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {exam.deadline && exam.deadline !== "0"
                          ? formatDate(exam.deadline)
                          : t("noDeadline")}
                      </TableCell>
                      <TableCell>
                        {exam.submit_on_time ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-200 rounded-full px-3 py-1 font-medium">
                            {t("status.onTime")}
                          </Badge>
                        ) : (
                          <Badge className="flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-full px-3 py-1 font-medium">
                            <AlertCircle className="h-3 w-3" />
                            {t("status.overdue")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            exam.ratio >= 80
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : exam.ratio >= 65
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                              : exam.ratio >= 50
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          } rounded-full px-3 py-1 font-bold`}
                        >
                          {exam.ratio.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {exam.submitted_at
                          ? formatDate(exam.submitted_at)
                          : "-"}
                      </TableCell>
                      <TableCell className="px-6">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 font-semibold transition-all duration-200"
                          onClick={() => {
                            router.push(
                              `/teacher/lessons/${exam.lesson_id}/exam/${exam.exam_id}/student/${exam.user_id}`
                            );
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t("actions.viewResult")}
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
        {!loading && scoredExams.length > 0 && totalItemsScored > 10 && (
          <CardFooter className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4 rounded-b-2xl">
            <div className="text-sm text-gray-600 font-medium">
              {t("pagination.showing", {
                from: (currentPageScored - 1) * itemsPerPage + 1,
                to: Math.min(
                  currentPageScored * itemsPerPage,
                  totalItemsScored
                ),
                total: totalItemsScored,
              })}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPageScored(currentPageScored - 1)}
                disabled={currentPageScored === 1}
                className="rounded-xl border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 font-medium"
              >
                {t("pagination.prev")}
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPagesScored }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={
                        currentPageScored === page ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setCurrentPageScored(page)}
                      className={`rounded-xl font-medium ${
                        currentPageScored === page
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                      }`}
                    >
                      {page}
                    </Button>
                  )
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPageScored(currentPageScored + 1)}
                disabled={currentPageScored === totalPagesScored}
                className="rounded-xl border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 font-medium"
              >
                {t("pagination.next")}
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
