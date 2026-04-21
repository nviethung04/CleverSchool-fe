"use client";
import { useEffect, useMemo, useState } from "react";
import { getExamRanking, getListCourse } from "@/lib/api/dashboard";
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
  Trophy,
  LucideLineChart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCallback } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useLocale, useTranslations } from "next-intl";
import { sortByNumberAndAlphabetFromSecondGeneric } from "@/lib/utils";

// Interface cho response API mới
interface ExamRankingResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    students: Array<{
      student_id: string;
      student_name: string;
      average_ratio: number;
      average_time: number;
      avatar: string;
      number_exams: string;
    }>;
    total: string;
    score_chart: Array<{
      score_range: string;
      student_count: string;
    }>;
    current_ranking: string;
  };
  error: string;
}

export default function RankingPage() {
  const t = useTranslations("ranking");
  const locale = useLocale();
  // State cho các bộ lọc mới
  const now = new Date();
  const [year, setYear] = useState<string>(now.getFullYear().toString());
  const [month, setMonth] = useState<string>((now.getMonth() + 1).toString());

  const [startDate, setStartDate] = useState<string>(now.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState<string>(now.toISOString().split("T")[0]);

  const [apiData, setApiData] = useState<ExamRankingResponse["data"] | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  // State cho course filter
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");

  // State cho pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);

  const [rankingPeriod, setRankingPeriod] = useState<
    "week" | "month" | "semester"
  >("week");

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

  // Effect để load courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await getListCourse();
        console.log("Response from getListCourse:", response); // Debug log
        const coursesData = response?.data?.courses || response?.courses || [];
        setCourses(coursesData);
        // Set course đầu tiên làm default nếu chưa có course được chọn
        if (!selectedCourse && coursesData && coursesData.length > 0) {
          setSelectedCourse(coursesData[0].id);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        setCourses([]);
      }
    };

    fetchCourses();
  }, []); // Chỉ chạy một lần khi component mount

  // Reset page khi thay đổi course
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCourse]);

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

  useEffect(() => {
    setApiData(null);
    setLoading(true);
    const { start_date, end_date } = getTimeRange();
    const params: any = {
      course_id: selectedCourse,
      page: currentPage,
      limit: itemsPerPage,
      order_by: "desc",
      start_date: start_date, // Đổi tên parameter cho đúng với API
      end_date: end_date, // Đổi tên parameter cho đúng với API
    };
    const fetchData = async () => {
      try {
        let res: ExamRankingResponse;
        res = await getExamRanking(params);

        setApiData(res?.data || null);
        // Cập nhật tổng số items từ API response
        if (res?.data?.total) {
          setTotalItems(parseInt(res.data.total));
        }
      } finally {
        setLoading(false);
      }
    };

    if (selectedCourse) {
      fetchData();
    }
  }, [
    year,
    month,
    selectedCourse,
    currentPage,
    itemsPerPage,
    startDate,
    endDate,
    getTimeRange,
  ]);

  // Mock data generators (copy from AssignmentsPageSimplified)
  const generateRankingTrendData = () => {
    const data = [];
    for (let i = 8; i >= 1; i--) {
      data.push({
        week: `Tuần ${9 - i}`,
        rank: Math.min(10, Math.max(1, 3 + Math.floor(Math.random() * 4) - 2)),
        score: Math.floor(Math.random() * 20) + 75,
      });
    }
    return data;
  };

  // Function để tính toán thống kê user hiện tại
  const getCurrentUserStats = () => {
    // Nếu có dữ liệu thực từ API, sử dụng current_ranking
    if (apiData?.current_ranking) {
      const currentRank = parseInt(apiData.current_ranking);
      const totalStudents = parseInt(apiData.total) || 0;

      // Tính điểm trung bình từ score_chart nếu có
      let averageScore = 0;
      if (apiData.score_chart && apiData.score_chart.length > 0) {
        // Tính điểm trung bình dựa trên score_chart
        let totalScore = 0;
        let totalStudentsInChart = 0;

        apiData.score_chart.forEach((chart) => {
          const range = chart.score_range;
          const count = parseInt(chart.student_count);

          if (range === "0-10") {
            totalScore += 5 * count; // Điểm trung bình của range 0-10 là 5
          } else if (range === "10-20") {
            totalScore += 15 * count;
          } else if (range === "20-30") {
            totalScore += 25 * count;
          } else if (range === "30-40") {
            totalScore += 35 * count;
          } else if (range === "40-50") {
            totalScore += 45 * count;
          } else if (range === "50-60") {
            totalScore += 55 * count;
          } else if (range === "60-70") {
            totalScore += 65 * count;
          } else if (range === "70-80") {
            totalScore += 75 * count;
          } else if (range === "80-90") {
            totalScore += 85 * count;
          } else if (range === "90-100") {
            totalScore += 95 * count;
          }

          totalStudentsInChart += count;
        });

        if (totalStudentsInChart > 0) {
          averageScore = totalScore / totalStudentsInChart;
        }
      }

      return {
        rank: currentRank,
        score: averageScore.toFixed(1),
        completedTasks: totalStudents > 0 ? Math.floor(totalStudents / 3) : 0,
      };
    }

    // Fallback về data cố định
    return {
      rank: 3,
      score: "85.5",
      completedTasks: 45,
    };
  };

  // Helpers to format values for display
  const formatAverageRatio = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(Number(value)))
      return "-";
    return Number(value).toFixed(2);
  };

  const formatSecondsToMinutesSeconds = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(Number(value)))
      return "-";
    const totalSeconds = Math.floor(Number(value));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  // Pagination functions
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex justify-between items-center mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Hiển thị:</Label>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-600">
            của {totalItems} kết quả
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {startPage > 1 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
              >
                1
              </Button>
              {startPage > 2 && <span className="px-2">...</span>}
            </>
          )}

          {pages.map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(page)}
              className={currentPage === page ? "bg-blue-500 text-white" : ""}
            >
              {page}
            </Button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-2">...</span>}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          Trang {currentPage} / {totalPages}
        </div>
      </div>
    );
  };

  // Render score chart
  const renderScoreChart = () => {
    if (!apiData?.score_chart || apiData.score_chart.length === 0) return null;

    // Chuẩn bị dữ liệu biểu đồ giống ExamTab
    const chartData = apiData.score_chart.map((item) => ({
      range: item.score_range,
      count: parseInt(item.student_count),
    }));

    return (
      <Card className="lg:col-span-3 bg-white/90 shadow border-0 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 text-lg">
            <LucideLineChart className="h-5 w-5" />
            {t("scoreChartTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-64 w-full">
            <ResponsiveContainer width="100%" height={250}>
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
                            {t("scoreRangeLabel", { range: label })}
                          </p>
                          <p className="text-blue-600">
                            {t("studentsCountSimple", {
                              count: payload[0].value as number,
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
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-2 md:px-4 overflow-x-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ranking Period Filter */}
          <Card className="lg:col-span-3 bg-white/90 shadow border-0 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-blue-700 text-lg">
                <Filter className="h-5 w-5" />
                {t("filters")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col md:flex-row gap-3 md:gap-6 items-center">
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
                {/* Từ ngày */}
                <div className="w-full md:w-40">
                  <Label className="text-sm font-semibold text-blue-600">
                    {t("fromDate")}
                  </Label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 text-sm"
                  />
                </div>
                {/* Đến ngày */}
                <div className="w-full md:w-40">
                  <Label className="text-sm font-semibold text-blue-600">
                    {t("toDate")}
                  </Label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 text-sm"
                  />
                </div>
                <div className="w-full md:w-48">
                  <Label className="text-sm font-semibold text-blue-600">
                    {t("course")}
                  </Label>
                  <Select
                    value={selectedCourse}
                    onValueChange={(value) => setSelectedCourse(value)}
                  >
                    <SelectTrigger className="rounded-lg border-blue-200 focus:ring-2 focus:ring-blue-300">
                      <SelectValue placeholder={t("selectCoursePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {sortByNumberAndAlphabetFromSecondGeneric(courses, item => item.name, true).map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ranking Table with Current User Stats */}
          <Card className="lg:col-span-3 bg-white/90 shadow border-0 rounded-2xl">
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <CardTitle className="flex items-center gap-2 text-yellow-700 text-lg">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  {t("rankingTitle")}{" "}
                  {apiData?.students
                    ? t("studentsCount", {
                        count: Number(apiData.total || apiData.students.length),
                      })
                    : t("classNameFallback", { name: "8A" })}
                </CardTitle>

                {/* Current Student Stats - moved here */}
                <div className="flex items-center gap-6 bg-blue-50/80 rounded-xl p-4">
                  <div className="text-center">
                    <div className="text-3xl font-extrabold text-blue-600 mb-1">
                      #{getCurrentUserStats().rank}
                    </div>
                    <p className="text-sm text-blue-700 font-medium">
                      {t("currentRank")}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">{t("loadingData")}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {apiData?.students && Array.isArray(apiData.students) ? (
                      apiData.students.map((student, index) => {
                        const rank =
                          (currentPage - 1) * itemsPerPage + index + 1;
                        const isCurrentUser = false; // Mặc định false, có thể cập nhật sau

                        return (
                          <div
                            key={student.student_id}
                            className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-2xl border-0 transition-colors text-lg ${isCurrentUser
                                ? "bg-blue-50/80 shadow-md"
                                : rank === 1
                                ? "bg-yellow-100 shadow"
                                : rank === 2
                                ? "bg-gray-100"
                                : rank === 3
                                ? "bg-amber-100"
                                : "bg-white hover:bg-blue-50/60"
                            }`}
                          >
                            {/* Rank + Avatar + Name */}
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              {/* Rank */}
                              <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center">
                                {rank <= 3 ? (
                                  <div
                                    className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-extrabold text-2xl relative shadow-lg ${rank === 1
                                        ? "bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 ring-4 ring-yellow-200"
                                        : rank === 2
                                          ? "bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 ring-4 ring-gray-200"
                                          : "bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 ring-4 ring-amber-200"
                                      }`}
                                  >
                                    {rank === 1 && (
                                      <Trophy className="absolute -top-3 -right-3 w-8 h-8 text-yellow-300 drop-shadow-lg" />
                                    )}
                                    {rank === 2 && (
                                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                        <span className="text-gray-600 text-xs font-bold">🥈</span>
                                      </div>
                                    )}
                                    {rank === 3 && (
                                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-300 rounded-full flex items-center justify-center">
                                        <span className="text-amber-700 text-xs font-bold">🥉</span>
                                      </div>
                                    )}
                                    <span className="drop-shadow-md">{rank}</span>
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xl shadow-sm">
                                    {rank}
                                  </div>
                                )}
                              </div>
                              {/* Avatar + Name */}
                              <img
                                src={student.avatar || `/avatar-kid.png`}
                                alt={student.student_name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 shadow"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `/avatar-kid${
                                    Math.floor(Math.random() * 3) + 1
                                  }.png`;
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <h4
                                  className={`font-bold truncate ${
                                    isCurrentUser
                                      ? "text-blue-700"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {student.student_name}
                                  {isCurrentUser && (
                                    <Badge className="ml-2 bg-blue-100 text-blue-700 text-base font-bold px-3 py-1 rounded-full">
                                      {t("you")}
                                    </Badge>
                                  )}
                                </h4>
                              </div>
                            </div>
                            {/* Stats */}
                            <div className="flex items-center justify-center gap-8 text-lg">
                              <div className="text-center">
                                <div className="font-bold">
                                  {formatAverageRatio(student.average_ratio)}
                                </div>
                                <div className="text-blue-700 font-medium">
                                  {t("avgScoreShort")}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold">
                                  {formatSecondsToMinutesSeconds(
                                    student.average_time
                                  )}
                                </div>
                                <div className="text-orange-700 font-medium">
                                  {t("avgTimeShort")}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold">
                                  {student.number_exams}
                                </div>
                                <div className="text-green-700 font-medium">
                                  {t("exams")}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-500 text-lg">
                          {t("noRankingData")}
                        </div>
                        <p className="text-gray-400 mt-2">
                          {t("selectCourseTimeHint")}
                        </p>
                      </div>
                    )}
                  </div>
                  {renderPagination()}
                </>
              )}
            </CardContent>
          </Card>

          {/* Score Chart */}
          {renderScoreChart()}
        </div>
    </div>
  );
}
