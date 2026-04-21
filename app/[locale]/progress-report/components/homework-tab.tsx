"use client";
import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Filter,
  Target,
  Download,
  TrendingUp,
  Diamond,
  FileText,
  UserCircle,
  Info,
  Play,
  RotateCcw,
  BarChart3,
  LineChart,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart as RechartsBarChart,
  Bar,
  Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { useEffect, useCallback } from "react";
import {
  getStudentExamDashboard,
  getStudentHomeworkDashboard,
  getStudentListExam,
  getStudentListHomework,
  getListCourse,
} from "@/lib/api/dashboard";
// Đổi tên import Tooltip để tránh xung đột với recharts
import {
  Tooltip as TooltipUI,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  doExamFromReportRoute,
  doHomeworkFromReportRoute,
  resultExamRoute,
  resultExamStudentRoute,
  resultHomeworkRoute,
  resultHomeworkStudentRoute,
  reviewExamStudentRoute,
  reviewResultExamStudentRoute,
  reviewResultHomeworkFromReportStudentRoute,
} from "@/lib/utils/route-utils";
import { useAuth } from "@/lib/context/auth-context";
import { sortByNumberAndAlphabetFromSecondGeneric } from "@/lib/utils";

export default function ProgressReportPage() {
  const t = useTranslations("progressReport");
  const locale = useLocale();

  // Helper function để format thời gian không có giây
  const formatDateTimeWithoutSeconds = (timestamp: string | number) => {
    const date = new Date(Number(timestamp) * 1000);
    return (
      date.toLocaleDateString("vi-VN") +
      " " +
      date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  // Helper functions để quản lý localStorage cho bộ lọc
  const FILTER_STORAGE_KEY = "progress_report_filters";

  const saveFiltersToStorage = (filters: {
    year: string;
    month: string;
    courseId: string;
    startDate: string;
    endDate: string;
    assignmentType: "exam" | "homework";
  }) => {
    try {
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
      console.error("Error saving filters to localStorage:", error);
    }
  };

  const loadFiltersFromStorage = () => {
    try {
      const stored = localStorage.getItem(FILTER_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error loading filters from localStorage:", error);
    }
    return null;
  };

  const clearFiltersFromStorage = () => {
    try {
      localStorage.removeItem(FILTER_STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing filters from localStorage:", error);
    }
  };

  // State cho các bộ lọc mới
  const now = new Date();
  const [year, setYear] = useState<string>(now.getFullYear().toString());
  const [month, setMonth] = useState<string>((now.getMonth() + 1).toString());
  const [courseId, setCourseId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [assignmentType, setAssignmentType] = useState<"exam" | "homework">(
    "homework"
  );
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [courseList, setCourseList] = useState<any[]>([]);
  const [courseLoading, setCourseLoading] = useState(false);

  // State lưu kết quả bảng điểm chi tiết
  const [scoreTableData, setScoreTableData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const monthNames = useMemo(() => {
    try {
      const formatter = new Intl.DateTimeFormat(locale, { month: "long" });
      return Array.from({ length: 12 }, (_, i) =>
        formatter.format(new Date(2020, i, 1))
      );
    } catch {
      return Array.from({ length: 12 }, (_, i) => `${i + 1}`);
    }
  }, [locale]);

  // Mock data generators (luôn trả về theo tuần)
  const generateProgressData = () => {
    const data = [];
    const baseDate = new Date();
    for (let i = 7; i >= 0; i--) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - i * 7);
      const weekData = {
        period: `${t("week")} ${
          Math.floor(
            (Date.now() - date.getTime()) / (7 * 24 * 60 * 60 * 1000)
          ) + 1
        }`,
        date: date.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        }),
        avgScore: Math.round(75 + Math.random() * 20),
        examScore: Math.round(70 + Math.random() * 25),
        homeworkScore: Math.round(80 + Math.random() * 15),
        completedTasks: Math.floor(8 + Math.random() * 5),
        totalTasks: Math.floor(12 + Math.random() * 3),
        gems: Math.floor(50 + Math.random() * 30),
      };
      let score = weekData.avgScore;
      if (assignmentType === "exam") score = weekData.examScore;
      if (assignmentType === "homework") score = weekData.homeworkScore;
      data.push({ ...weekData, score });
    }
    return data;
  };

  const generateGemData = () => {
    const data = [];
    const baseDate = new Date();
    for (let i = 7; i >= 0; i--) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - i * 7);
      data.push({
        period: `${t("week")} ${
          Math.floor(
            (Date.now() - date.getTime()) / (7 * 24 * 60 * 60 * 1000)
          ) + 1
        }`,
        date: date.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        }),
        gems: Math.floor(50 + Math.random() * 30),
        cumulative: Math.floor(300 + (7 - i) * 50 + Math.random() * 100),
      });
    }
    return data;
  };

  // Helper: Tính start_date, end_date từ bộ lọc
  const getTimeRange = useCallback(() => {
    let start, end;
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else if (month !== "all") {
      // Nếu chọn tháng cụ thể
      start = new Date(Number(year), Number(month) - 1, 1);
      end = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
    } else {
      // Mặc định là cả năm
      start = new Date(Number(year), 0, 1);
      end = new Date(Number(year), 11, 31, 23, 59, 59, 999);
    }
    return {
      start_date: Math.floor(start.getTime() / 1000),
      end_date: Math.floor(end.getTime() / 1000),
    };
  }, [year, month, startDate, endDate]);

  // Chuẩn hóa dữ liệu overview và chart cho UI
  const normalizeOverview = (data: any, type: "exam" | "homework") => {
    if (type === "exam") {
      return {
        main1: {
          label: t("avgScore"),
          value: data?.avg_ratio ? Math.round(data.avg_ratio) : 0,
        },
        main2: {
          label: t("submittedCount"),
          value: data?.total_exam_submitted ?? 0,
        },
        main3: { label: t("totalGems"), value: 0 }, // Không có Gem từ backend
        main4: {
          label: t("completionRate"),
          value:
            data?.total_exam_assigned > 0
              ? Math.round(
                  (data.total_exam_submitted / data.total_exam_assigned) * 100
                )
              : 0,
          suffix: "%",
        },
        extra: {
          total_exam_assigned: data?.total_exam_assigned ?? 0,
        },
      };
    } else {
      return {
        main1: {
          label: t("avgScore"),
          value: data?.average_ratio ? Math.round(data.average_ratio) : 0,
        },
        main2: {
          label: t("homeworkDone"),
          value: data?.total_homework_submitted ?? 0,
        },
        main3: {
          label: t("homeworkAssigned"),
          value: data?.total_homework_assigned ?? 0,
        },
        main4: {
          label: t("completionRate"),
          value: data?.percent_completed
            ? Math.round(data.percent_completed)
            : 0,
          suffix: "%",
        },
        extra: {
          questionsCompleted: `${data?.total_questions_completed ?? 0} / ${
            data?.total_questions ?? 0
          }`,
        },
      };
    }
  };

  // Hàm filter và xử lý dữ liệu chart
  const filterChartData = (chart: any[]) => {
    if (!chart || chart.length === 0) return [];

    // Kiểm tra xem tất cả các tuần có course_week === 0 không
    const allZeroWeeks = chart.every((w: any) => w.course_week === 0);
    if (allZeroWeeks) {
      return [];
    }

    // Gộp các tuần 0 liên tiếp thành 1 tuần
    const filtered: any[] = [];
    let i = 0;

    while (i < chart.length) {
      const current = chart[i];

      // Nếu là tuần 0
      if (current.course_week === 0) {
        // Tìm tất cả các tuần 0 liên tiếp
        let j = i;
        while (j < chart.length && chart[j].course_week === 0) {
          j++;
        }

        // Chỉ thêm tuần 0 đầu tiên của chuỗi liên tiếp
        filtered.push(current);

        // Bỏ qua các tuần 0 còn lại
        i = j;
      } else {
        // Thêm tuần không phải 0
        filtered.push(current);
        i++;
      }
    }

    return filtered;
  };

  const normalizeChart = (chart: any[], type: "exam" | "homework") => {
    // Filter dữ liệu trước khi normalize
    const filteredChart = filterChartData(chart || []);

    if (type === "exam") {
      return filteredChart.map((w: any) => ({
        period: `${t("week")} ${w.course_week}`,
        avgScore: Math.round(w.avg_ratio),
        examSubmitted: w.exam_submitted,
        examAssigned: w.exam_assigned,
        gems: w.avg_score ?? 0,
        start_date: w.start_date,
        end_date: w.end_date,
      }));
    } else {
      return filteredChart.map((w: any) => ({
        period: `${t("week")} ${w.course_week}`,
        homeworkSubmitted: w.homework_submitted,
        homeworkAssigned: w.homework_assigned,
        percentCompleted: w.percent_completed
          ? Math.round(w.percent_completed)
          : 0,
        averageRatio: w.average_ratio ? Math.round(w.average_ratio) : 0,
        questionsCompleted: w.questions_completed,
        totalQuestions: w.total_questions,
        start_date: w.start_date,
        end_date: w.end_date,
      }));
    }
  };

  // Gọi API phù hợp khi assignmentType hoặc filter thay đổi
  useEffect(() => {
    // Chỉ gọi API khi có courseId và courseId không phải là placeholder
    if (!courseId || courseId === "loading" || courseId === "no-courses")
      return;

    setApiData(null);
    setLoading(true);
    const { start_date, end_date } = getTimeRange();
    const params: any = { start_date, end_date };

    // Thêm course_id nếu được chọn
    if (courseId) {
      params.course_id = courseId;
    }

    const fetchData = async () => {
      try {
        let res;
        if (assignmentType === "exam") {
          res = await getStudentExamDashboard(params);
        } else {
          res = await getStudentHomeworkDashboard(params);
        }
        setApiData(res?.data || null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [assignmentType, year, month, startDate, endDate, courseId, getTimeRange]);

  // Hàm chuẩn hóa dữ liệu bảng điểm chi tiết
  const mapApiToTableData = (data: any, type: "exam" | "homework") => {
    if (!data) return [];
    if (type === "exam") {
      const exams = data.exams || [];
      return exams.map((exam: any) => ({
        id: exam.id,
        name: exam.name,
        type: "Kiểm tra",
        course: "-", // Không có trường course trong response
        lesson: exam.lesson_title, // Không có trường lesson trong response
        // Các trường cho hiển thị cột mới:
        ratio: exam.ratio,
        is_submitted: exam.is_submitted,
        unscored_count: exam.unscored_count,
        created_at: exam.created_at,
        assigned_at: exam.assigned_at, // Thêm thời gian giao bài
        duration: exam.duration,
        // Cũ:
        score: null, // Không dùng nữa cho exam
        maxScore: 100,
        date:
          exam.deadline && exam.deadline !== "0"
            ? new Date(Number(exam.deadline) * 1000).toLocaleDateString("vi-VN")
            : "",
        // Trạng thái sẽ xử lý ở UI
        status: undefined,
      }));
    } else {
      const homeworks = data.homeworks || [];
      return homeworks.map((hw: any) => ({
        id: hw.id,
        name: hw.name,
        type: "Bài tập",
        course: "-", // Không có trường course trong response
        lesson: hw.lesson_title, // Không có trường lesson trong response
        lesson_id: hw.lesson_id, // Thêm lesson_id từ response
        score: hw.is_submitted ? hw.questions_completed : null, // Số câu hoàn thành nếu đã nộp
        ratio: hw.ratio, // Điểm từ ratio
        skip_questions_count: hw.skip_questions_count ?? 0, // Số câu skip
        questions_completed: hw.questions_completed,
        total_questions: hw.total_questions ?? 100,
        maxScore: hw.total_questions ?? 100, // vẫn giữ cho hiển thị số câu hoàn thành/total
        created_at: hw.created_at,
        assigned_at: hw.assigned_at, // Thêm thời gian giao bài
        status: hw.is_submitted ? "Hoàn thành" : "Chưa làm",
      }));
    }
  };

  // useEffect lấy dữ liệu bảng điểm chi tiết
  useEffect(() => {
    // Chỉ gọi API khi có courseId và courseId không phải là placeholder
    if (!courseId || courseId === "loading" || courseId === "no-courses")
      return;

    setScoreTableData([]);
    setLoading(true);
    const { start_date, end_date } = getTimeRange();
    const params: any = {
      start_date,
      end_date,
      page,
      limit,
    };

    // Thêm course_id nếu được chọn
    if (courseId) {
      params.course_id = courseId;
    }

    const fetchTableData = async () => {
      try {
        let res;
        if (assignmentType === "exam") {
          res = await getStudentListExam(params);
          setScoreTableData(mapApiToTableData(res.data, "exam"));
          setTotal(Number(res.data?.total || 0));
        } else {
          res = await getStudentListHomework(params);
          setScoreTableData(mapApiToTableData(res.data, "homework"));
          setTotal(Number(res.data?.total || 0));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTableData();
  }, [
    assignmentType,
    year,
    month,
    startDate,
    endDate,
    courseId,
    page,
    limit,
    getTimeRange,
  ]);

  // Khôi phục bộ lọc từ localStorage khi component mount
  useEffect(() => {
    const savedFilters = loadFiltersFromStorage();
    if (savedFilters) {
      console.log("Restoring filters from localStorage:", savedFilters);
      setYear(savedFilters.year || now.getFullYear().toString());
      setMonth(savedFilters.month || (now.getMonth() + 1).toString());
      setStartDate(savedFilters.startDate || "");
      setEndDate(savedFilters.endDate || "");
      setAssignmentType(savedFilters.assignmentType || "homework");
      // courseId sẽ được set sau khi load course list
    }
  }, []);

  // Fetch course list when component mounts
  useEffect(() => {
    const fetchCourses = async () => {
      setCourseLoading(true);
      try {
        const res = await getListCourse();
        const courses = res?.data?.courses || [];
        setCourseList(courses);

        // Khôi phục courseId từ localStorage nếu có
        const savedFilters = loadFiltersFromStorage();
        if (savedFilters && savedFilters.courseId) {
          // Kiểm tra xem courseId có tồn tại trong danh sách không
          const courseExists = courses.find(
            (c: any) => c.id === savedFilters.courseId
          );
          if (courseExists) {
            setCourseId(savedFilters.courseId);
          } else if (courses.length > 0) {
            setCourseId(courses[0].id);
          }
        } else if (courses.length > 0 && !courseId) {
          setCourseId(courses[0].id);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        setCourseList([]);
      } finally {
        setCourseLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // Lưu bộ lọc vào localStorage mỗi khi có thay đổi
  useEffect(() => {
    // Chỉ lưu khi courseId đã được set (không phải loading state)
    if (courseId && courseId !== "loading" && courseId !== "no-courses") {
      const filters = {
        year,
        month,
        courseId,
        startDate,
        endDate,
        assignmentType,
      };
      saveFiltersToStorage(filters);
      console.log("Saving filters to localStorage:", filters);
    }
  }, [year, month, courseId, startDate, endDate, assignmentType]);

  // Xóa localStorage sau khi đã load xong và khôi phục bộ lọc
  useEffect(() => {
    // Chỉ xóa localStorage khi đã load xong course list và có courseId hợp lệ
    if (
      courseId &&
      courseId !== "loading" &&
      courseId !== "no-courses" &&
      !courseLoading
    ) {
      // Kiểm tra xem có phải từ trang kết quả quay lại không
      const shouldClearStorage = sessionStorage.getItem(
        "should_clear_progress_filters"
      );

      if (shouldClearStorage) {
        // Delay một chút để đảm bảo tất cả state đã được set
        const timer = setTimeout(() => {
          try {
            localStorage.removeItem(FILTER_STORAGE_KEY);
            sessionStorage.removeItem("should_clear_progress_filters");
          } catch (error) {
            console.error("Error clearing filters from localStorage:", error);
          }
        }, 1000); // Delay 1 giây để đảm bảo trang đã load xong

        return () => clearTimeout(timer);
      }
    }
  }, [courseId, courseLoading]);

  // Chuẩn hóa dữ liệu cho UI
  const overview = apiData?.overview
    ? normalizeOverview(apiData.overview, assignmentType)
    : null;
  const chartData = apiData?.chart
    ? normalizeChart(apiData.chart, assignmentType)
    : [];

  const router = useRouter();
  const { user } = useAuth();

  return (
    <div>
      <div className="container mx-auto px-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filters */}
          <Card className="lg:col-span-3 bg-white/80 shadow border-0 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-blue-700 text-lg">
                <Filter className="h-5 w-5" />
                {t("filters")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col md:flex-row gap-3 md:gap-6 items-center flex-wrap">
                {/* Năm */}
                <div className="w-full md:w-36">
                  <Label className="text-sm font-semibold text-blue-600">
                    {t("year")}
                  </Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="rounded-lg border-blue-200 focus:ring-2 focus:ring-blue-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Tháng */}
                <div className="w-full md:w-36">
                  <Label className="text-sm font-semibold text-blue-600">
                    {t("month")}
                  </Label>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger className="rounded-lg border-blue-200 focus:ring-2 focus:ring-blue-300">
                      <SelectValue placeholder={t("selectMonthPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("all")}</SelectItem>
                      {monthNames.map((name, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Thời gian từ - đến */}
                <div className="w-full md:w-44 flex flex-col">
                  <Label className="text-sm font-semibold text-blue-600">
                    {t("fromDate")}
                  </Label>
                  <input
                    type="date"
                    className="mt-1 w-full h-10 rounded-lg border border-blue-200 px-3 focus:ring-2 focus:ring-blue-300"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="w-full md:w-44 flex flex-col">
                  <Label className="text-sm font-semibold text-blue-600">
                    {t("toDate")}
                  </Label>
                  <input
                    type="date"
                    className="mt-1 w-full h-10 rounded-lg border border-blue-200 px-3 focus:ring-2 focus:ring-blue-300"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                {/* Khóa học */}
                <div className="w-full md:w-48">
                  <Label className="text-sm font-semibold text-blue-600">
                    {t("course")}
                  </Label>
                  <Select value={courseId} onValueChange={setCourseId}>
                    <SelectTrigger className="rounded-lg border-blue-200 focus:ring-2 focus:ring-blue-300">
                      <SelectValue placeholder={t("selectCoursePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {courseLoading ? (
                        <SelectItem value="loading" disabled>
                          {t("loading")}
                        </SelectItem>
                      ) : courseList && courseList.length > 0 ? (
                        sortByNumberAndAlphabetFromSecondGeneric(courseList, item => item.name, true).map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-courses" disabled>
                          {t("noCourses")}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {/* Loại bài tập */}
                <div className="w-full md:w-48">
                  <Label className="text-sm font-semibold text-blue-600">
                    {t("assignmentType")}
                  </Label>
                  <Select
                    value={assignmentType}
                    onValueChange={(value) =>
                      setAssignmentType(value as "exam" | "homework")
                    }
                  >
                    <SelectTrigger className="rounded-lg border-blue-200 focus:ring-2 focus:ring-blue-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homework">{t("homework")}</SelectItem>
                      {/* <SelectItem value="exam">{t("exam")}</SelectItem> */}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Statistics */}
          {courseId && courseId !== "loading" && courseId !== "no-courses" && (
            <Card className="lg:col-span-3 bg-gradient-to-r from-blue-50 via-green-50 to-yellow-50 shadow border-0 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 text-lg">
                  <Target className="h-5 w-5" />
                  {t("summaryTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`grid gap-4 ${
                    assignmentType === "homework"
                      ? "grid-cols-2 md:grid-cols-5"
                      : "grid-cols-2 md:grid-cols-4"
                  }`}
                >
                  {/* Card 1 */}
                  <div className="relative text-center p-5 bg-blue-100 rounded-xl shadow-sm">
                    <TrendingUp className="w-6 h-6 text-blue-400 absolute top-3 right-3 opacity-70" />
                    <div className="text-3xl md:text-4xl font-extrabold text-blue-600 mb-1">
                      {overview?.main1.value ?? 0}%
                    </div>
                    <p className="text-base md:text-lg text-blue-700 font-semibold">
                      {overview?.main1.label}
                    </p>
                  </div>
                  {/* Card 2 */}
                  <div className="relative text-center p-5 bg-green-100 rounded-xl shadow-sm">
                    <FileText className="w-6 h-6 text-green-500 absolute top-3 right-3 opacity-70" />
                    <div className="text-3xl md:text-4xl font-extrabold text-green-600 mb-1">
                      {overview?.main2.value ?? 0}
                    </div>
                    <p className="text-base md:text-lg text-green-700 font-semibold">
                      {overview?.main2.label}
                    </p>
                  </div>
                  {/* Card 3 */}
                  <div className="relative text-center p-5 bg-yellow-100 rounded-xl shadow-sm">
                    <Diamond className="w-6 h-6 text-yellow-500 absolute top-3 right-3 opacity-70" />
                    <div className="text-3xl md:text-4xl font-extrabold text-yellow-600 mb-1">
                      {overview?.main3.value ?? 0}
                    </div>
                    <p className="text-base md:text-lg text-yellow-700 font-semibold">
                      {overview?.main3.label}
                    </p>
                  </div>
                  {/* Card 4 */}
                  <div className="relative text-center p-5 bg-purple-100 rounded-xl shadow-sm">
                    <Target className="w-6 h-6 text-purple-500 absolute top-3 right-3 opacity-70" />
                    <div className="text-3xl md:text-4xl font-extrabold text-purple-600 mb-1">
                      {overview?.main4.value ?? 0}
                      {overview?.main4.suffix || ""}
                    </div>
                    <p className="text-base md:text-lg text-purple-700 font-semibold">
                      {overview?.main4.label}
                    </p>
                  </div>
                  {/* Card 5 - Chỉ hiện khi là homework */}
                  {assignmentType === "homework" && (
                    <div className="relative text-center p-5 bg-orange-100 rounded-xl shadow-sm">
                      <UserCircle className="w-6 h-6 text-orange-500 absolute top-3 right-3 opacity-70" />
                      <div className="text-2xl md:text-3xl font-extrabold text-orange-600 mb-1">
                        {overview?.extra?.questionsCompleted ?? "0 / 0"}
                      </div>
                      <p className="text-sm md:text-base text-orange-700 font-semibold">
                        {t("questionsCompleted")}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chart 1: Bài được giao và Bài đã làm */}
          {courseId && courseId !== "loading" && courseId !== "no-courses" && (
            <Card className="lg:col-span-2 md:col-span-1 col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 text-lg">
                  <LineChart className="h-5 w-5" />
                  {assignmentType === "exam"
                    ? t("examAssignmentChart")
                    : t("homeworkAssignmentChart")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 md:h-80">
                  {chartData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500 text-lg">
                      {t("noData")}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      {assignmentType === "exam" ? (
                        <RechartsLineChart
                          data={
                            chartData.length > 0
                              ? chartData
                              : generateProgressData()
                          }
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="period"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                          />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white p-3 border rounded-lg shadow-lg">
                                    <p className="font-medium">{label}</p>
                                    <p className="text-blue-600">
                                      {t("examSubmitted")}:{" "}
                                      {payload.find(
                                        (p) => p.dataKey === "examSubmitted"
                                      )?.value ?? 0}
                                    </p>
                                    <p className="text-green-600">
                                      {t("examAssigned")}:{" "}
                                      {payload.find(
                                        (p) => p.dataKey === "examAssigned"
                                      )?.value ?? 0}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="examSubmitted"
                            name={t("examSubmitted")}
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ fill: "#3b82f6", strokeWidth: 2, r: 5 }}
                            activeDot={{
                              r: 7,
                              stroke: "#3b82f6",
                              strokeWidth: 2,
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="examAssigned"
                            name={t("examAssigned")}
                            stroke="#10b981"
                            strokeWidth={3}
                            strokeDasharray="5 5"
                            dot={{ fill: "#10b981", strokeWidth: 2, r: 5 }}
                          />
                        </RechartsLineChart>
                      ) : (
                        <RechartsLineChart
                          data={chartData.length > 0 ? chartData : []}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="period"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                          />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white p-3 border rounded-lg shadow-lg">
                                    <p className="font-medium">{label}</p>
                                    <p className="text-green-600">
                                      {t("homeworkSubmitted")}:{" "}
                                      {payload.find(
                                        (p) => p.dataKey === "homeworkSubmitted"
                                      )?.value ?? 0}
                                    </p>
                                    <p className="text-yellow-600">
                                      {t("homeworkAssigned")}:{" "}
                                      {payload.find(
                                        (p) => p.dataKey === "homeworkAssigned"
                                      )?.value ?? 0}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="homeworkSubmitted"
                            name={t("homeworkSubmitted")}
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ fill: "#10b981", strokeWidth: 2, r: 5 }}
                            activeDot={{
                              r: 7,
                              stroke: "#10b981",
                              strokeWidth: 2,
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="homeworkAssigned"
                            name={t("homeworkAssigned")}
                            stroke="#f59e0b"
                            strokeWidth={3}
                            strokeDasharray="5 5"
                            dot={{ fill: "#f59e0b", strokeWidth: 2, r: 5 }}
                          />
                        </RechartsLineChart>
                      )}
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chart 2: Tỷ lệ hoàn thành và Điểm trung bình */}
          {courseId && courseId !== "loading" && courseId !== "no-courses" && (
            <Card className="lg:col-span-1 md:col-span-1 col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 text-lg">
                  <TrendingUp className="h-5 w-5" />
                  {assignmentType === "exam"
                    ? t("examProgressChart")
                    : t("homeworkProgressChart")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 md:h-80">
                  {chartData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500 text-lg">
                      {t("noData")}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      {assignmentType === "exam" ? (
                        <RechartsLineChart
                          data={
                            chartData.length > 0
                              ? chartData
                              : generateProgressData()
                          }
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="period"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                          />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white p-3 border rounded-lg shadow-lg">
                                    <p className="font-medium">{label}</p>
                                    <p className="text-purple-600">
                                      {t("avgScore")}:{" "}
                                      {payload.find(
                                        (p) => p.dataKey === "avgScore"
                                      )?.value ?? 0}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="avgScore"
                            name={t("avgScore")}
                            stroke="#a21caf"
                            strokeWidth={3}
                            dot={{ fill: "#a21caf", strokeWidth: 2, r: 5 }}
                            activeDot={{
                              r: 7,
                              stroke: "#a21caf",
                              strokeWidth: 2,
                            }}
                          />
                        </RechartsLineChart>
                      ) : (
                        <RechartsLineChart
                          data={chartData.length > 0 ? chartData : []}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="period"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            yAxisId="left"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                          />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white p-3 border rounded-lg shadow-lg">
                                    <p className="font-medium">{label}</p>
                                    <p className="text-purple-600">
                                      {t("completionRate")}:{" "}
                                      {payload.find(
                                        (p) => p.dataKey === "percentCompleted"
                                      )?.value ?? 0}
                                      %
                                    </p>
                                    <p className="text-blue-600">
                                      {t("avgScore")}:{" "}
                                      {payload.find(
                                        (p) => p.dataKey === "averageRatio"
                                      )?.value ?? 0}
                                      %
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="percentCompleted"
                            name={t("completionRatePercent")}
                            stroke="#a21caf"
                            strokeWidth={3}
                            dot={{ fill: "#a21caf", strokeWidth: 2, r: 5 }}
                            activeDot={{
                              r: 7,
                              stroke: "#a21caf",
                              strokeWidth: 2,
                            }}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="averageRatio"
                            name={t("avgScore")}
                            stroke="#3b82f6"
                            strokeWidth={3}
                            strokeDasharray="3 3"
                            dot={{ fill: "#3b82f6", strokeWidth: 2, r: 5 }}
                          />
                        </RechartsLineChart>
                      )}
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gem Tracking - chỉ hiện khi là exam */}
          {courseId &&
            courseId !== "loading" &&
            courseId !== "no-courses" &&
            assignmentType === "exam" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Diamond className="h-5 w-5 text-yellow-500" />
                    {t("gemStats")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Gem Chart */}
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={
                          chartData.length > 0
                            ? chartData
                            : generateGemData().slice(-5)
                        }
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="period"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-3 border rounded-lg shadow-lg">
                                  <p className="font-medium">{label}</p>
                                  <p className="text-yellow-600">
                                    {t("gemEarned")} +{payload[0].value}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="gems"
                          fill="#eab308"
                          radius={[4, 4, 0, 0]}
                        />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Current Gem Stats */}
                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-lg font-bold text-yellow-600">
                          +{generateGemData().slice(-1)[0]?.gems || 0}
                        </div>
                        <p className="text-xs text-gray-600">{t("thisWeek")}</p>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-lg font-bold text-yellow-600">
                          {generateGemData().slice(-1)[0]?.cumulative || 0}
                        </div>
                        <p className="text-xs text-gray-600">{t("total")}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Detailed Scores Table */}
          {courseId && courseId !== "loading" && courseId !== "no-courses" && (
            <Card className="lg:col-span-3 bg-white/90 shadow border-0 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 text-lg">
                  <FileText className="h-5 w-5" />
                  {t("detailedScores")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-base md:text-lg">
                    <thead>
                      <tr className="border-b bg-blue-50">
                        <th className="text-left p-4 font-bold text-blue-700">
                          {t("colName")}
                        </th>
                        <th className="text-left p-4 font-bold text-blue-700">
                          {t("colLesson")}
                        </th>
                        <th className="text-center p-4 font-bold text-blue-700">
                          {assignmentType === "homework"
                            ? t("colQuestionsCompleted")
                            : t("colScore")}
                        </th>
                        {assignmentType === "homework" && (
                          <>
                            <th className="text-center p-4 font-bold text-blue-700">
                              {t("colScore")}
                            </th>
                            <th className="text-center p-4 font-bold text-blue-700">
                              {t("colSkipQuestions")}
                            </th>
                          </>
                        )}
                        <th className="text-center p-4 font-bold text-blue-700">
                          {t("colDuration")}
                        </th>
                        <th className="text-center p-4 font-bold text-blue-700">
                          {t("colAssignedAt")}
                        </th>
                        <th className="text-center p-4 font-bold text-blue-700">
                          {t("colStatus")}
                        </th>
                        <th className="text-center p-4 font-bold text-blue-700">
                          {t("colActions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {scoreTableData.length > 0 ? (
                        scoreTableData.map((score, index) => (
                          <tr
                            key={index}
                            className="border-b hover:bg-blue-50/60"
                          >
                            <td className="p-4 font-semibold text-blue-900">
                              {score.name}
                            </td>
                            <td className="p-4 text-blue-700 font-medium">
                              {score.lesson}
                            </td>
                            {/* Cột số câu hoàn thành (cho homework) hoặc điểm (cho exam) */}
                            <td className="p-4 text-center">
                              {assignmentType === "exam" ? (
                                score.ratio !== undefined &&
                                score.ratio !== null ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <span
                                      className={`font-bold text-lg ${
                                        score.ratio >= 80
                                          ? "text-green-600"
                                          : score.ratio >= 60
                                          ? "text-yellow-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {score.ratio}
                                    </span>
                                    {score.unscored_count !== undefined &&
                                      score.unscored_count !== 0 && (
                                        <TooltipProvider>
                                          <TooltipUI>
                                            <TooltipTrigger asChild>
                                              <span className="inline-flex items-center cursor-pointer">
                                                <Info className="w-4 h-4 text-blue-400" />
                                              </span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                              <span>{t("unscoredNote")}</span>
                                            </TooltipContent>
                                          </TooltipUI>
                                        </TooltipProvider>
                                      )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 font-medium">
                                    --
                                  </span>
                                )
                              ) : score.score !== null ? (
                                <span
                                  className={`font-bold text-lg ${
                                    score.score >= 80
                                      ? "text-green-600"
                                      : score.score >= 60
                                      ? "text-yellow-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {score.score}/{score.maxScore}
                                </span>
                              ) : (
                                <span className="text-gray-400 font-medium">
                                  --
                                </span>
                              )}
                            </td>
                            {/* Cột điểm cho homework */}
                            {assignmentType === "homework" && (
                              <td className="p-4 text-center">
                                {score.ratio !== undefined &&
                                score.ratio !== null ? (
                                  <span
                                    className={`font-bold text-lg ${
                                      score.ratio >= 80
                                        ? "text-green-600"
                                        : score.ratio >= 60
                                        ? "text-yellow-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {score.ratio}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 font-medium">
                                    --
                                  </span>
                                )}
                              </td>
                            )}
                            {/* Cột số câu skip cho homework */}
                            {assignmentType === "homework" && (
                              <td className="p-4 text-center">
                                <span className="font-bold text-lg text-orange-600">
                                  {score.skip_questions_count ?? 0}
                                </span>
                              </td>
                            )}
                            {/* Cột thời gian làm */}
                            <td className="p-4 text-center">
                              {score.created_at && score.created_at !== "0" ? (
                                <span>
                                  {formatDateTimeWithoutSeconds(
                                    score.created_at
                                  )}
                                </span>
                              ) : (
                                <span className="text-gray-400 font-medium">
                                  --
                                </span>
                              )}
                            </td>
                            {/* Cột thời gian giao bài */}
                            <td className="p-4 text-center">
                              {score.assigned_at &&
                              score.assigned_at !== "0" ? (
                                <span>
                                  {formatDateTimeWithoutSeconds(
                                    score.assigned_at
                                  )}
                                </span>
                              ) : (
                                <span className="text-gray-400 font-medium">
                                  --
                                </span>
                              )}
                            </td>
                            {/* Cột trạng thái */}
                            <td className="p-4 text-center">
                              <div className="w-40 mx-auto">
                                {assignmentType === "exam" ? (
                                  score.is_submitted === false ? (
                                    <Badge className="text-base px-3 py-1 rounded-full font-bold bg-gray-300 text-gray-700 w-full justify-center">
                                      {t("statusNotDone")}
                                    </Badge>
                                  ) : score.unscored_count !== 0 ? (
                                    <Badge className="text-base px-3 py-1 rounded-full font-bold bg-yellow-400 text-white w-full justify-center">
                                      {t("statusWaitingTeacher")}
                                    </Badge>
                                  ) : (
                                    <Badge className="text-base px-3 py-1 rounded-full font-bold bg-blue-500 text-white w-full justify-center">
                                      {t("statusGraded")}
                                    </Badge>
                                  )
                                ) : score.questions_completed === 0 ? (
                                  <Badge className="text-base px-3 py-1 rounded-full font-bold bg-gray-300 text-gray-700 w-full justify-center">
                                    {t("statusNotDone")}
                                  </Badge>
                                ) : score.questions_completed > 0 &&
                                  score.questions_completed <
                                    score.total_questions ? (
                                  <Badge className="text-base px-3 py-1 rounded-full font-bold bg-yellow-400 text-white w-full justify-center">
                                    {t("statusInProgress")}
                                  </Badge>
                                ) : score.questions_completed ===
                                  score.total_questions ? (
                                  <Badge className="text-base px-3 py-1 rounded-full font-bold bg-blue-500 text-white w-full justify-center">
                                    {t("statusCompleted")}
                                  </Badge>
                                ) : null}
                              </div>
                            </td>
                            {/* Cột hành động */}
                            <td className="p-4 text-center">
                              <div className="w-40 mx-auto">
                                {assignmentType === "exam" ? (
                                  score.is_submitted === false ? (
                                    <Button
                                      size="lg"
                                      className="bg-green-600 text-white hover:bg-green-700 text-base px-6 py-2 rounded-full shadow w-full"
                                      onClick={() =>
                                        router.push(
                                          doExamFromReportRoute(user, score.id)
                                        )
                                      }
                                    >
                                      <Play className="h-4 w-4 mr-2" />
                                      {t("actionStart")}
                                    </Button>
                                  ) : score.unscored_count !== 0 ? (
                                    <Button
                                      size="lg"
                                      className="bg-blue-600 text-white hover:bg-blue-700 text-base px-6 py-2 rounded-full shadow w-full"
                                      onClick={() => {
                                        if (user?.type === "student") {
                                          const from = "progress-report";
                                          router.push(
                                            reviewExamStudentRoute(
                                              user,
                                              score.id,
                                              from
                                            )
                                          );
                                        } else {
                                          router.push(
                                            `/assignments/exam/${score.id}/review`
                                          );
                                        }
                                      }}
                                    >
                                      <RotateCcw className="h-4 w-4 mr-2" />
                                      {t("actionReview")}
                                    </Button>
                                  ) : (
                                    <Button
                                      size="lg"
                                      className="bg-blue-600 text-white hover:bg-blue-700 text-base px-6 py-2 rounded-full shadow w-full"
                                      onClick={() => {
                                        if (user?.type === "student") {
                                          const from = "progress-report";
                                          router.push(
                                            reviewResultExamStudentRoute(
                                              user,
                                              score.id,
                                              from
                                            )
                                          );
                                        } else {
                                          router.push(
                                            resultExamRoute(user, score.id)
                                          );
                                        }
                                      }}
                                    >
                                      <BarChart3 className="h-4 w-4 mr-2" />
                                      {t("actionViewResult")}
                                    </Button>
                                  )
                                ) : score.questions_completed === 0 ? (
                                  <Button
                                    size="lg"
                                    className="bg-green-600 text-white hover:bg-green-700 text-base px-6 py-2 rounded-full shadow w-full"
                                    onClick={() =>
                                      router.push(
                                        doHomeworkFromReportRoute(
                                          user,
                                          score.id,
                                          score.lesson_id
                                        )
                                      )
                                    }
                                  >
                                    <Play className="h-4 w-4 mr-2" />
                                    {t("actionStart")}
                                  </Button>
                                ) : score.questions_completed > 0 &&
                                  score.questions_completed <
                                    score.total_questions ? (
                                  <Button
                                    size="lg"
                                    className="bg-[#EB8922] text-white hover:bg-[#d97a1d] text-base px-6 py-2 rounded-full shadow w-full"
                                    onClick={() =>
                                      router.push(
                                        doHomeworkFromReportRoute(
                                          user,
                                          score.id,
                                          score.lesson_id
                                        )
                                      )
                                    }
                                  >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    {t("actionContinue")}
                                  </Button>
                                ) : score.questions_completed ===
                                  score.total_questions ? (
                                  <Button
                                    size="lg"
                                    className="bg-blue-600 text-white hover:bg-blue-700 text-base px-6 py-2 rounded-full shadow w-full"
                                    onClick={() =>
                                      router.push(
                                        reviewResultHomeworkFromReportStudentRoute(
                                          user,
                                          score.id
                                        )
                                      )
                                    }
                                  >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    {t("actionReview")}
                                  </Button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={assignmentType === "exam" ? 6 : 9}
                            className="text-center text-gray-500 py-8"
                          >
                            {t("noData")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2">
                  <div className="order-3 sm:order-1">
                    <span className="mr-2">{t("rowsPerPage")}:</span>
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                      className="border rounded px-2 py-1"
                    >
                      {[5, 10, 20, 50].map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 order-1 sm:order-2">
                    <button
                      className="px-2 py-1 border rounded disabled:opacity-50"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      {t("prev")}
                    </button>
                    <span>
                      {t("pageOf", {
                        page,
                        totalPages: Math.max(1, Math.ceil(total / limit)),
                      })}
                    </span>
                    <button
                      className="px-2 py-1 border rounded disabled:opacity-50"
                      onClick={() =>
                        setPage((p) =>
                          Math.min(Math.ceil(total / limit), p + 1)
                        )
                      }
                      disabled={page >= Math.ceil(total / limit)}
                    >
                      {t("next")}
                    </button>
                  </div>
                  <div className="order-2 sm:order-3">
                    {t("total")}: {total}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
