"use client";
import { useEffect, useState } from "react";
import {
  getAssessmentRanking,
  getListCourse,
  type AssessmentRankingResponse,
} from "@/lib/api/dashboard";
import { GetAssessmentList, type Assessment } from "@/lib/api/assessment";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Filter, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { sortByNumberAndAlphabetFromSecondGeneric } from "@/lib/utils";

export default function AssessmentTab() {
  const t = useTranslations("ranking");

  const [apiData, setApiData] = useState<AssessmentRankingResponse["data"] | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  // State cho filters
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [assessmentType, setAssessmentType] = useState<"all" | "mini_test" | "final_exam">("all");
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<string>("");
  const [orderBy, setOrderBy] = useState<"score" | "star">("score");
  const [sort, setSort] = useState<"asc" | "desc">("desc");

  // Effect để load courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await getListCourse();
        const coursesData = response?.data?.courses || response?.courses || [];
        setCourses(coursesData);
        if (!selectedCourse && coursesData && coursesData.length > 0) {
          setSelectedCourse(coursesData[0].id);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        setCourses([]);
      }
    };

    fetchCourses();
  }, []);

  // Effect để load assessments khi course hoặc type thay đổi
  useEffect(() => {
    if (!selectedCourse) {
      setAssessments([]);
      setSelectedAssessment("");
      return;
    }

    const fetchAssessments = async () => {
      try {
        const params: any = {
          course_id: selectedCourse,
          limit: 100,
        };
        
        // Chỉ thêm type vào params nếu không phải "all"
        if (assessmentType !== "all") {
          params.type = assessmentType;
        }

        const response = await GetAssessmentList(params);
        const assessmentsData = response?.assessment || [];
        setAssessments(assessmentsData);
        if (assessmentsData.length > 0) {
          setSelectedAssessment(String(assessmentsData[0].id));
        } else {
          setSelectedAssessment("");
        }
      } catch (error) {
        console.error("Error fetching assessments:", error);
        setAssessments([]);
        setSelectedAssessment("");
      }
    };

    fetchAssessments();
  }, [selectedCourse, assessmentType]);

  // Effect để fetch ranking data
  useEffect(() => {
    if (!selectedCourse || !selectedAssessment) return;

    setLoading(true);
    const fetchData = async () => {
      try {
        const res: AssessmentRankingResponse = await getAssessmentRanking({
          course_id: selectedCourse,
          assessment_id: selectedAssessment,
          order_by: orderBy,
          sort: sort,
        });

        setApiData(res?.data || null);
      } catch (error) {
        console.error("Error fetching assessment ranking:", error);
        setApiData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCourse, selectedAssessment, orderBy, sort]);

  // Format số
  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(Number(value)))
      return "0";
    return Number(value).toLocaleString("vi-VN");
  };

  return (
    <div className="container mx-auto px-2 md:px-4 overflow-x-hidden max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filters */}
          <Card className="lg:col-span-3 bg-white/90 shadow border-0 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-purple-700 text-lg">
                <Filter className="h-5 w-5" />
                {t("filters")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col md:flex-row gap-3 md:gap-6 items-center">
                {/* Khóa học */}
                <div className="w-full md:w-48">
                  <Label className="text-sm font-semibold text-purple-600">
                    {t("course")}
                  </Label>
                  <Select
                    value={selectedCourse}
                    onValueChange={(value) => {
                      setSelectedCourse(value);
                      setSelectedAssessment("");
                    }}
                  >
                    <SelectTrigger className="rounded-lg border-purple-200 focus:ring-2 focus:ring-purple-300">
                      <SelectValue placeholder={t("selectCoursePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {sortByNumberAndAlphabetFromSecondGeneric(
                        courses,
                        (item) => item.name,
                        true
                      ).map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Loại */}
                <div className="w-full md:w-48">
                  <Label className="text-sm font-semibold text-purple-600">
                    {t("type")}
                  </Label>
                  <Select
                    value={assessmentType}
                    onValueChange={(value) => {
                      setAssessmentType(value as "all" | "mini_test" | "final_exam");
                      setSelectedAssessment("");
                    }}
                  >
                    <SelectTrigger className="rounded-lg border-purple-200 focus:ring-2 focus:ring-purple-300">
                      <SelectValue placeholder={t("selectType")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("all")}</SelectItem>
                      <SelectItem value="mini_test">{t("monthType")}</SelectItem>
                      <SelectItem value="final_exam">{t("semesterType")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Assessment */}
                <div className="w-full md:w-48">
                  <Label className="text-sm font-semibold text-purple-600">
                    {t("assessment")}
                  </Label>
                  <Select
                    value={selectedAssessment}
                    onValueChange={(value) => setSelectedAssessment(value)}
                    disabled={!assessmentType || assessments.length === 0}
                  >
                    <SelectTrigger className="rounded-lg border-purple-200 focus:ring-2 focus:ring-purple-300">
                      <SelectValue placeholder={t("selectAssessment")} />
                    </SelectTrigger>
                    <SelectContent>
                      {assessments.map((assessment) => (
                        <SelectItem key={assessment.id} value={String(assessment.id)}>
                          {assessment.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sắp xếp theo */}
                <div className="w-full md:w-48">
                  <Label className="text-sm font-semibold text-purple-600">
                    {t("sortBy")}
                  </Label>
                  <Select
                    value={orderBy}
                    onValueChange={(value) => setOrderBy(value as "score" | "star")}
                  >
                    <SelectTrigger className="rounded-lg border-purple-200 focus:ring-2 focus:ring-purple-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="score">{t("score")}</SelectItem>
                      <SelectItem value="star">{t("totalStars")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ranking Table */}
          <Card className="lg:col-span-3 bg-white/90 shadow border-0 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700 text-lg">
                <Trophy className="h-6 w-6 text-purple-500" />
                {t("rankingTitle")}{" "}
                {apiData?.students
                  ? t("studentsCount", { count: apiData.total || apiData.students.length })
                  : ""}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <p className="mt-2 text-gray-600">{t("loadingData")}</p>
                </div>
              ) : apiData?.students && Array.isArray(apiData.students) && apiData.students.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200">
                        <th className="px-2 py-2 text-center text-gray-600 font-semibold text-sm w-20">
                          {t("rank")}
                        </th>
                        <th className="px-2 py-2 text-left text-gray-600 font-semibold text-sm min-w-[150px]">
                          {t("student")}
                        </th>
                        <th className="px-2 py-2 text-left text-gray-600 font-semibold text-sm hidden md:table-cell w-24">
                          {t("class")}
                        </th>
                        <th className="px-2 py-2 text-center text-gray-600 font-semibold text-sm w-30">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-yellow-700 text-sm">{t("totalStars")}</span>
                          </div>
                        </th>
                        <th className="px-2 py-2 text-center text-gray-600 font-semibold text-sm w-40">
                          <span className="text-blue-700 text-sm">{t("score")}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiData.students.map((student) => {
                        const rank = student.rank || 0;
                        const isCurrentUser = student.is_me || false;

                        return (
                          <tr
                            key={student.id}
                            className={`border-b border-gray-100 transition-colors ${
                              isCurrentUser
                                ? "bg-blue-50/80 hover:bg-blue-50"
                                : rank === 1
                                ? "bg-yellow-100/50 hover:bg-yellow-100"
                                : rank === 2
                                ? "bg-gray-100/50 hover:bg-gray-100"
                                : rank === 3
                                ? "bg-amber-100/50 hover:bg-amber-100"
                                : "bg-white hover:bg-blue-50/30"
                            }`}
                          >
                            {/* Rank */}
                            <td className="px-2 py-3">
                              <div className="flex items-center justify-center">
                                {rank <= 3 ? (
                                  <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-xl relative shadow-lg ${
                                      rank === 1
                                        ? "bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 ring-2 ring-yellow-200"
                                        : rank === 2
                                        ? "bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 ring-2 ring-gray-200"
                                        : "bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 ring-2 ring-amber-200"
                                    }`}
                                  >
                                    {rank === 1 && (
                                      <Trophy className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 drop-shadow-lg" />
                                    )}
                                    {rank === 2 && (
                                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                                        <span className="text-gray-600 text-[10px] font-bold">
                                          🥈
                                        </span>
                                      </div>
                                    )}
                                    {rank === 3 && (
                                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-300 rounded-full flex items-center justify-center">
                                        <span className="text-amber-700 text-[10px] font-bold">
                                          🥉
                                        </span>
                                      </div>
                                    )}
                                    <span className="drop-shadow-md">{rank}</span>
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg shadow-sm">
                                    {rank}
                                  </div>
                                )}
                              </div>
                            </td>
                            {/* Student Info */}
                            <td className="px-2 py-3">
                              <div className="flex items-center gap-2">
                                <img
                                  src={student.avatar || `/avatar-kid.png`}
                                  alt={student.name}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 shadow flex-shrink-0"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = `/avatar-kid${
                                      Math.floor(Math.random() * 3) + 1
                                    }.png`;
                                  }}
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4
                                      className={`font-bold truncate text-base ${
                                        isCurrentUser
                                          ? "text-blue-700"
                                          : "text-gray-900"
                                      }`}
                                    >
                                      {student.name}
                                    </h4>
                                    {isCurrentUser && (
                                      <Badge className="bg-blue-100 text-blue-700 text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                                        {t("you")}
                                      </Badge>
                                    )}
                                  </div>
                                  {/* Class - Mobile view */}
                                  <div className="md:hidden mt-0.5">
                                    <span className="text-gray-600 text-xs">
                                      {t("classLabel")}: {student.class || "-"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            {/* Class - Desktop */}
                            <td className="px-2 py-3 hidden md:table-cell">
                              <span className="text-gray-700 font-medium text-sm">
                                {student.class || "-"}
                              </span>
                            </td>
                            {/* Star */}
                            <td className="px-2 py-3 text-center">
                              <div className="font-bold text-yellow-600 text-base">
                                {formatNumber(student.star)}
                              </div>
                            </td>
                            {/* Score */}
                            <td className="px-2 py-3 text-center">
                              <div className="font-bold text-blue-600 text-base">
                                {formatNumber(student.score)}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
