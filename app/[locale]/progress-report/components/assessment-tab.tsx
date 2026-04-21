"use client";

import { useState, useEffect, useMemo, Fragment, useRef } from "react";
import { useTypedTranslations, useCurrentLocale } from "@/lib/i18n/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Calendar,
  CalendarClock,
  GraduationCap,
  FileText,
  Eye,
  ArrowRight,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { GetCourseList } from "@/lib/api/courses";
import { GetSubjectsList } from "@/lib/api/subjects";
import {
  GetAssessmentList,
  Assessment,
  GetDashboardStudentAssessments,
  DashboardStudentAssessmentItem,
} from "@/lib/api/assessment";
import {
  GetStudyReports,
  StudyReportsListResponse,
  StudyReportStarSkill,
  StudyReportCheckSkill,
} from "@/lib/api/study-report";
import { useToast } from "@/components/ui/use-toast";
import Loading from "@/app/loading";
import { sortAlphabetGeneric, sortByNumberAndAlphabetFromSecondGeneric } from "@/lib/utils";

const ASSESSMENT_FILTERS_STORAGE_KEY = "progress-report-assessment-filters";

interface AssessmentFilters {
  selectedSubject: string;
  selectedCourse: string;
  reportType: "final_exam" | "mini_test";
  reportValue: string;
}

export function AssessmentTab() {
  const t = useTypedTranslations("progressReport.assessmentTab");
  const currentLocale = useCurrentLocale();
  const router = useRouter();
  const { toast } = useToast();

  // Helper: Lấy filters từ localStorage
  const getStoredFilters = (): AssessmentFilters | null => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(ASSESSMENT_FILTERS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Error reading filters from localStorage:", error);
      return null;
    }
  };

  // Helper: Lưu filters vào localStorage
  const saveFiltersToStorage = (filters: AssessmentFilters) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        ASSESSMENT_FILTERS_STORAGE_KEY,
        JSON.stringify(filters)
      );
    } catch (error) {
      console.error("Error saving filters to localStorage:", error);
    }
  };

  // Khôi phục filters từ localStorage một lần khi component mount
  const storedFiltersRef = useRef<AssessmentFilters | null>(null);
  const hasStoredFiltersRef = useRef<boolean>(false);
  if (storedFiltersRef.current === null) {
    storedFiltersRef.current = getStoredFilters();
    hasStoredFiltersRef.current = !!storedFiltersRef.current;
  }

  // Filter states - khôi phục từ localStorage nếu có
  const [selectedSubject, setSelectedSubject] = useState<string>(
    () => storedFiltersRef.current?.selectedSubject || ""
  );
  const [selectedCourse, setSelectedCourse] = useState<string>(
    () => storedFiltersRef.current?.selectedCourse || ""
  );
  const [reportType, setReportType] = useState<"final_exam" | "mini_test">(() =>
    storedFiltersRef.current?.reportType === "final_exam" ||
    storedFiltersRef.current?.reportType === "mini_test"
      ? storedFiltersRef.current.reportType
      : "final_exam"
  );
  const [reportValue, setReportValue] = useState<string>(
    () => storedFiltersRef.current?.reportValue || ""
  );

  // Track xem component đã mount chưa để tránh save khi đang restore
  const isMountedRef = useRef(false);

  // Data states
  const [subjects, setSubjects] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [dashboardAssessments, setDashboardAssessments] = useState<
    DashboardStudentAssessmentItem[]
  >([]);
  const [studyReports, setStudyReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingDashboardAssessments, setLoadingDashboardAssessments] =
    useState(false);
  const [loadingStudyReports, setLoadingStudyReports] = useState(false);

  // Fetch subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoadingSubjects(true);
        const response = await GetSubjectsList();
        if (response?.data?.subjects) {
          const subjectsList = response.data.subjects;
          setSubjects(subjectsList);

          // Auto-select first subject nếu chưa có giá trị được chọn
          // (đã ưu tiên localStorage ở useState init)
          if (subjectsList.length > 0 && !selectedSubject) {
            setSelectedSubject(String(subjectsList[0].id));
          }
          // Nếu có giá trị từ localStorage nhưng không còn trong danh sách, chọn giá trị đầu tiên
          else if (
            selectedSubject &&
            !subjectsList.find((s: any) => String(s.id) === selectedSubject)
          ) {
            setSelectedSubject(String(subjectsList[0].id));
          }
        }
      } catch (error) {
        console.error("Error fetching subjects:", error);
        toast({
          title: t("errors.error"),
          description: t("errors.failedToLoadSubjects"),
          variant: "destructive",
        });
      } finally {
        setLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, [toast, selectedSubject]);

  // Fetch courses when subject changes
  useEffect(() => {
    const fetchCourses = async () => {
      if (!selectedSubject) {
        setCourses([]);
        setSelectedCourse("");
        setAssessments([]);
        setReportValue("");
        return;
      }

      try {
        setLoadingCourses(true);
        const params: Record<string, any> = {
          subject_id: selectedSubject,
          by_user: true, // Lấy courses của user hiện tại (student)
        };

        const response = await GetCourseList(params);
        if (
          response &&
          ((response.code === 200 && response.data?.courses) ||
            (response.data?.courses && Array.isArray(response.data.courses)))
        ) {
          const coursesList = response.data.courses;
          setCourses(coursesList);

          // Auto-select first course nếu chưa có giá trị được chọn
          if (coursesList.length > 0 && !selectedCourse) {
            const firstCourse = coursesList[0];
            const courseId = String(firstCourse?.id || firstCourse?.course_id);
            if (courseId) {
              setSelectedCourse(courseId);
            }
          }
          // Nếu có giá trị từ localStorage nhưng không còn trong danh sách, chọn giá trị đầu tiên
          else if (
            selectedCourse &&
            coursesList.length > 0 &&
            !coursesList.find(
              (c: any) => String(c?.id || c?.course_id) === selectedCourse
            )
          ) {
            const firstCourse = coursesList[0];
            const courseId = String(firstCourse?.id || firstCourse?.course_id);
            if (courseId) {
              setSelectedCourse(courseId);
            }
          }
          // Nếu không có course nào, reset các filter phụ thuộc
          else if (coursesList.length === 0) {
            setSelectedCourse("");
            setAssessments([]);
            setReportValue("");
          }
        } else {
          setCourses([]);
          setSelectedCourse("");
          setAssessments([]);
          setReportValue("");
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        toast({
          title: t("errors.error"),
          description: t("errors.failedToLoadCourses"),
          variant: "destructive",
        });
        setCourses([]);
        setSelectedCourse("");
        setAssessments([]);
        setReportValue("");
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, [selectedSubject, toast, selectedCourse]);

  // Fetch assessments when course / subject / type changes
  useEffect(() => {
    const fetchAssessments = async () => {
      if (!selectedCourse) {
        setAssessments([]);
        setReportValue("");
        return;
      }

      try {
        const filters: any = {
          course_id: selectedCourse,
          limit: 1000,
        };

        if (selectedSubject) {
          filters.subject_id = selectedSubject;
        }

        if (reportType) {
          filters.type = reportType;
        }

        const result = await GetAssessmentList(filters);
        const list = result.assessment || [];
        setAssessments(list);

        if (list.length > 0) {
          // Auto-select first assessment nếu chưa có giá trị được chọn
          if (!reportValue) {
            setReportValue(String(list[0].id));
          }
          // Nếu có giá trị từ localStorage nhưng không còn trong danh sách, chọn giá trị đầu tiên
          else if (!list.find((a) => String(a.id) === reportValue)) {
            setReportValue(String(list[0].id));
          }
        } else {
          setReportValue("");
        }
      } catch (error) {
        console.error("Error fetching assessments:", error);
        toast({
          title: t("errors.error"),
          description: t("errors.failedToLoadAssessments"),
          variant: "destructive",
        });
        setAssessments([]);
        setReportValue("");
      }
    };

    fetchAssessments();
  }, [selectedCourse, selectedSubject, reportType, toast]);

  // Fetch dashboard assessments
  useEffect(() => {
    const fetchDashboardAssessments = async () => {
      if (!selectedCourse) {
        setDashboardAssessments([]);
        return;
      }

      try {
        setLoadingDashboardAssessments(true);
        const params: any = {
          course_id: selectedCourse,
          page: 1,
          limit: 1000,
        };

        if (reportValue) {
          params.assessment_id = reportValue;
        }

        const response = await GetDashboardStudentAssessments(params);
        if (response?.code === 200 && response?.data?.assessments) {
          setDashboardAssessments(response.data.assessments);
        } else {
          setDashboardAssessments([]);
        }
      } catch (error: any) {
        console.error("Error fetching dashboard assessments:", error);
        toast({
          title: t("errors.error"),
          description:
            error?.response?.data?.message ||
            error?.message ||
            t("errors.failedToLoadDashboardAssessments"),
          variant: "destructive",
        });
        setDashboardAssessments([]);
      } finally {
        setLoadingDashboardAssessments(false);
      }
    };

    fetchDashboardAssessments();
  }, [selectedCourse, reportValue, toast]);

  // Fetch study reports
  useEffect(() => {
    const fetchStudyReports = async () => {
      if (!selectedCourse) {
        setStudyReports([]);
        return;
      }

      try {
        setLoadingStudyReports(true);
        const params: any = {
          course_id: selectedCourse,
          page: 1,
          per_page: 1000,
        };

        if (reportValue) {
          params.assessment_id = reportValue;
        }

        const response = await GetStudyReports(params);
        let reportsList: any[] = [];

        // Handle different response structures
        if (response?.code === 200) {
          if (Array.isArray(response.data)) {
            reportsList = response.data;
          } else if (
            response.data &&
            typeof response.data === "object" &&
            "study_reports" in response.data
          ) {
            // Type guard for StudyReportsListResponseData
            const listData = response.data as {
              study_reports?: any[];
            };
            reportsList = listData.study_reports || [];
          } else if (response.data && typeof response.data === "object") {
            // Single study report
            reportsList = [response.data];
          }
        }

        setStudyReports(reportsList);
      } catch (error: any) {
        console.error("Error fetching study reports:", error);
        toast({
          title: t("errors.error"),
          description:
            error?.response?.data?.message ||
            error?.message ||
            t("errors.failedToLoadStudyReports"),
          variant: "destructive",
        });
        setStudyReports([]);
      } finally {
        setLoadingStudyReports(false);
      }
    };

    fetchStudyReports();
  }, [selectedCourse, selectedSubject, reportValue, toast]);

  // Đánh dấu component đã mount
  useEffect(() => {
    isMountedRef.current = true;
  }, []);

  // Tự động lưu filters vào localStorage mỗi khi các filter thay đổi
  // (chỉ sau khi component đã mount để tránh save khi restore)
  useEffect(() => {
    if (!isMountedRef.current) return;

    saveFiltersToStorage({
      selectedSubject,
      selectedCourse,
      reportType,
      reportValue,
    });
  }, [selectedSubject, selectedCourse, reportType, reportValue]);

  // Tính tổng điểm từ criteria và subcriteria
  const calculateTotalScore = (item: DashboardStudentAssessmentItem) => {
    if (item.is_scored) {
      return item.total_score;
    }
    // Nếu chưa chấm điểm, tính từ criteria
    let total = 0;
    item.assessment?.criteria?.forEach((criterion) => {
      criterion.subcriteria?.forEach((sub) => {
        total += typeof sub.score === "number" ? sub.score : 0;
      });
    });
    return total;
  };

  // Tính tổng điểm của một criteria
  const calculateCriterionScore = (
    item: DashboardStudentAssessmentItem,
    criteriaId: string
  ) => {
    const criterion = item.assessment?.criteria?.find(
      (c) => c.id === criteriaId
    );
    if (!criterion) return 0;

    // Ưu tiên dùng score trực tiếp của criterion nếu có
    if (typeof criterion.score === "number") {
      return criterion.score;
    }

    // Nếu không có score trực tiếp, tính từ subcriteria
    return (
      criterion.subcriteria?.reduce((sum, sub) => {
        return sum + (typeof sub.score === "number" ? sub.score : 0);
      }, 0) || 0
    );
  };

  // Mảng màu cho các kỹ năng (criteria) - dùng cho UI final_exam
  const skillColors = [
    // Xanh lam
    {
      text: "text-[#33438e]",
      border: "border-[#33438e]/30",
      textScore: "text-[#33438e]",
    },

    // Cam
    {
      text: "text-[#f0a222]",
      border: "border-[#f0a222]/30",
      textScore: "text-[#f0a222]",
    },

    // Xanh cốm
    {
      text: "text-[#73a106]",
      border: "border-[#73a106]/30",
      textScore: "text-[#73a106]",
    },

    // Xám
    {
      text: "text-[#929292]",
      border: "border-[#929292]/30",
      textScore: "text-[#929292]",
    },

    // Đỏ
    {
      text: "text-[#d84839]",
      border: "border-[#d84839]/30",
      textScore: "text-[#d84839]",
    },
  ];

  // Tính toán các cột động từ criteria và subcriteria
  const scoreColumns = useMemo(() => {
    const firstItem = dashboardAssessments[0];
    if (!firstItem) {
      return { criteria: [] as any[], subcriteria: [] as any[] };
    }

    const criteria =
      firstItem.assessment?.criteria?.map((c) => ({
        id: c.id,
        name: c.name,
        max_score: c.max_score,
        subcriteria:
          c.subcriteria?.map((s) => ({
            id: s.id,
            name: s.name,
            max_score: s.max_score,
          })) || [],
      })) || [];

    const subcriteria = criteria.flatMap((c) =>
      c.subcriteria.map((s: any) => ({
        ...s,
        criteriaId: c.id,
        criteriaName: c.name,
      }))
    );

    return { criteria, subcriteria };
  }, [dashboardAssessments]);

  // Tính toán các cột động từ star_skills và check_skills cho bảng Study Reports
  const studyReportColumns = useMemo(() => {
    const starSkillsMap = new Map<string, { id: string; name_vn: string }>();
    const checkSkillsMap = new Map<string, { id: string; name_vn: string }>();

    // Thu thập tất cả star_skills và check_skills từ tất cả reports
    studyReports.forEach((report: any) => {
      report.star_skills?.forEach((skill: StudyReportStarSkill) => {
        if (skill.id && skill.name_vn) {
          starSkillsMap.set(skill.id, {
            id: skill.id,
            name_vn: skill.name_vn,
          });
        }
      });

      report.check_skills?.forEach((skill: StudyReportCheckSkill) => {
        if (skill.id && skill.name_vn) {
          checkSkillsMap.set(skill.id, {
            id: skill.id,
            name_vn: skill.name_vn,
          });
        }
      });
    });

    return {
      starSkills: Array.from(starSkillsMap.values()),
      checkSkills: Array.from(checkSkillsMap.values()),
    };
  }, [studyReports]);

  // Tính toán gridTemplateColumns động để xử lý trường hợp check_skills rỗng
  const gridTemplateColumns = useMemo(() => {
    const parts = [
      "2fr",
      `repeat(${studyReportColumns.starSkills.length}, 1fr)`,
    ];

    // Chỉ thêm check_skills columns nếu có dữ liệu
    if (studyReportColumns.checkSkills.length > 0) {
      parts.push(`repeat(${studyReportColumns.checkSkills.length}, 2fr)`);
    }

    parts.push("3fr", "1fr");

    return parts.join(" ");
  }, [studyReportColumns]);

  const normalizeQuarterStar = (value: number) => {
    const fixed = Number(value.toFixed(2));
    const integer = Math.floor(fixed);
    const decimal = +(fixed - integer).toFixed(2);

    let extra = 0;

    if (decimal >= 0.01 && decimal <= 0.25) extra = 0.25;
    else if (decimal >= 0.26 && decimal <= 0.5) extra = 0.5;
    else if (decimal >= 0.51 && decimal <= 0.75) extra = 0.75;
    else if (decimal >= 0.76) extra = 1;

    return integer + extra;
  };

  const QuarterStar = ({ percent }: { percent: number }) => (
    <div className="relative w-4 h-4">
      <Star className="absolute inset-0 w-4 h-4 text-gray-300" />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${percent}%` }}
      >
        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
      </div>
    </div>
  );

  const renderAverageStars = (value: number, maxStar: number) => {
    const normalized = normalizeQuarterStar(value);

    return Array.from({ length: maxStar }, (_, i) => {
      const starIndex = i + 1;
      let percent = 0;

      if (normalized >= starIndex) {
        percent = 100;
      } else if (normalized > i) {
        percent = (normalized - i) * 100; // 25 / 50 / 75
      }

      return <QuarterStar key={i} percent={percent} />;
    });
  };

  if (loadingSubjects) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-white rounded-2xl border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Subject Filter */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-emerald-600" />
                {t("filters.subject")}
              </label>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
                disabled={loadingSubjects}
              >
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue placeholder={t("filters.selectSubject")}>
                    {(() => {
                      const subject = subjects.find(
                        (s) => String(s?.id) === selectedSubject
                      );
                      return subject?.name || t("filters.selectSubject");
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  {sortAlphabetGeneric(subjects, item => item.name, true).map((subject) => (
                    <SelectItem
                      key={subject.id}
                      value={String(subject.id)}
                      className="rounded-lg"
                    >
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Course Filter */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                {t("filters.course")}
              </label>
              <Select
                value={selectedCourse}
                onValueChange={setSelectedCourse}
                disabled={!selectedSubject || loadingCourses}
              >
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue placeholder={t("filters.selectCourse")}>
                    {(() => {
                      const course = courses.find(
                        (c) => String(c?.id) === selectedCourse
                      );

                      if (!course) return t("filters.selectCourse");

                      return course.object_title
                        ? `${course.name} (${course.object_title})`
                        : course.name;
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  {courses.length === 0 ? (
                    <SelectItem
                      value="no-courses"
                      disabled
                      className="rounded-lg text-gray-400"
                    >
                      {loadingCourses
                        ? t("filters.loading")
                        : !selectedSubject
                        ? t("filters.pleaseSelectSubject")
                        : t("filters.noCourses")}
                    </SelectItem>
                  ) : (
                    sortByNumberAndAlphabetFromSecondGeneric(courses, item => item.name, true).map((course) => {
                      const courseId = course?.id;
                      const courseName = course?.name;
                      return (
                        <SelectItem
                          key={courseId}
                          value={String(courseId)}
                          className="rounded-lg"
                        >
                          {course.object_title
                            ? `${courseName} (${course.object_title})`
                            : courseName}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Report Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" />
                {t("filters.type")}
              </label>
              <Select
                value={reportType}
                onValueChange={(value) =>
                  setReportType(value as "mini_test" | "final_exam")
                }
              >
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors">
                  <SelectValue placeholder={t("filters.allTypes")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  <SelectItem value="mini_test" className="rounded-lg">
                    {t("filters.month")}
                  </SelectItem>
                  <SelectItem value="final_exam" className="rounded-lg">
                    {t("filters.term")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assessment Filter */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-emerald-600" />
                {t("filters.assessment")}
              </label>
              <Select
                value={reportValue}
                onValueChange={setReportValue}
                disabled={!selectedCourse || assessments.length === 0}
              >
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue placeholder={t("filters.selectAssessment")}>
                    {(() => {
                      const assessment = assessments.find(
                        (a) => String(a.id) === reportValue
                      );
                      return assessment?.name || t("filters.selectAssessment");
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  {assessments.length === 0 ? (
                    <SelectItem
                      value="no-assessments"
                      disabled
                      className="rounded-lg text-gray-400"
                    >
                      {!selectedCourse
                        ? t("filters.pleaseSelectCourse")
                        : t("filters.noAssessments")}
                    </SelectItem>
                  ) : (
                    assessments.map((assessment) => (
                      <SelectItem
                        key={assessment.id}
                        value={String(assessment.id)}
                        className="rounded-lg"
                      >
                        {assessment.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table 1: Dashboard Student Assessments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            {t("scoresTable.title", { count: dashboardAssessments.length })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingDashboardAssessments ? (
            <Loading />
          ) : dashboardAssessments.length > 0 ? (
            reportType === "final_exam" ? (
              // UI cho loại "Kỳ"
              <div className="overflow-x-auto bg-white flex justify-center">
                {/* KHUNG VÔ HÌNH – co theo nội dung */}
                <div className="inline-flex flex-col w-max border p-3">
                  {/* Header với tên các assessment */}
                  <div className="sticky top-0 bg-white z-20">
                    <div className="flex mb-2 w-max">
                      <div className="min-w-[200px]"></div>
                      {dashboardAssessments.map((item) => (
                        <div
                          key={item.assessment.id}
                          className="min-w-[150px] flex justify-center"
                        >
                          <div
                            className="px-4 py-2 rounded-lg bg-white border 
                           font-bold text-sm text-blue-800
                           w-fit text-center whitespace-nowrap"
                          >
                            {item.assessment.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tổng điểm */}
                  <div className="flex w-max">
                    <div className="sticky left-0 bg-white z-10 min-w-[200px] px-4 py-3 font-bold text-lg whitespace-nowrap">
                      Tổng điểm
                    </div>
                    {dashboardAssessments.map((item) => {
                      const totalScore = calculateTotalScore(item);
                      const maxTotalScore = scoreColumns.criteria.reduce(
                        (sum, c) => sum + c.max_score,
                        0
                      );
                      const displayScore = Math.max(totalScore, 0);
                      return (
                        <div
                          key={`total-${item.assessment.id}`}
                          className="min-w-[150px] px-4 py-3 text-center whitespace-nowrap"
                        >
                          <span className="text-red-600 font-bold text-xl">
                            {displayScore}
                          </span>
                          <span className="text-gray-400 font-normal">
                            {" "}
                            /{maxTotalScore}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Các kỹ năng (criteria) */}
                  {scoreColumns.criteria.map((criterion, criterionIndex) => {
                    const colorIndex = criterionIndex % skillColors.length;
                    const colors = skillColors[colorIndex];
                    const criterionMaxScore = criterion.max_score;

                    return (
                      <div
                        key={`criteria-${criterion.id}`}
                        className="mb-2 w-max"
                      >
                        {/* Header kỹ năng */}
                        <div className="flex rounded-lg mb-1 w-max">
                          <div
                            className={`sticky left-0 z-10 min-w-[200px] px-4 font-bold 
                            rounded-l-lg border-l-2 border-t-2 border-b-2 
                            ${colors.border} ${colors.text} whitespace-nowrap`}
                          >
                            {criterion.name}
                          </div>

                          {dashboardAssessments.map((item, idx) => {
                            const criterionScore = calculateCriterionScore(
                              item,
                              criterion.id
                            );
                            const isLast =
                              idx === dashboardAssessments.length - 1;
                            return (
                              <div
                                key={`criteria-header-${item.assessment.id}`}
                                className={`min-w-[150px] px-4 text-center font-semibold 
                                border-t-2 border-b-2 ${colors.border} 
                                ${colors.textScore} whitespace-nowrap
                                ${isLast ? "rounded-r-lg border-r-2" : ""}`}
                              >
                                <span className="font-bold text-xl">
                                  {criterionScore}
                                </span>
                                <span className="text-gray-400 font-normal text-sm">
                                  {" "}
                                  /{criterionMaxScore}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Subcriteria */}
                        {criterion.subcriteria.map((sub: any) => (
                          <div key={`sub-${sub.id}`} className="flex w-max">
                            <div
                              className={`sticky left-0 z-10 min-w-[200px] px-4 py-2 pl-8 
                              ${colors.textScore} font-medium whitespace-nowrap`}
                            >
                              {sub.name}
                            </div>

                            {dashboardAssessments.map((item) => {
                              const criterionData =
                                item.assessment?.criteria?.find(
                                  (c) => c.id === criterion.id
                                );
                              const subcriteriaData =
                                criterionData?.subcriteria?.find(
                                  (s) => s.id === sub.id
                                );
                              const score =
                                typeof subcriteriaData?.score === "number"
                                  ? subcriteriaData.score
                                  : 0;

                              return (
                                <div
                                  key={`sub-score-${item.assessment.id}-${sub.id}`}
                                  className={`min-w-[150px] px-4 py-2 text-center 
                                  ${colors.textScore} whitespace-nowrap`}
                                >
                                  <span className="font-bold text-xl">
                                    {score}
                                  </span>
                                  <span className="text-gray-400 font-normal text-sm">
                                    {" "}
                                    /{sub.max_score}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    );
                  })}

                  {/* Section Bài thi */}
                  {dashboardAssessments.some(
                    (item) => Array.isArray(item.files) && item.files.length > 0
                  ) && (
                    <div className="flex w-max">
                      <div className="sticky left-0 bg-white z-10 min-w-[200px] px-4 py-3 font-bold text-lg text-blue-800 whitespace-nowrap">
                        Bài thi
                      </div>

                      {dashboardAssessments.map((item) => (
                        <div
                          key={`files-${item.assessment.id}`}
                          className="min-w-[150px] px-4 py-3"
                        >
                          {item.files && item.files.length > 0 ? (
                            <div className="flex flex-wrap gap-2 justify-center">
                              {item.files.map((url, idx) => (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-blue-800 underline whitespace-nowrap"
                                >
                                  {t("scoresTable.image", { index: idx + 1 })}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <div className="w-16 h-12 rounded-lg bg-gray-100 mx-auto"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // UI cho loại "Tháng" - bảng 2 cột 2 dòng không có border
              <div className="space-y-4 max-w-lg mx-auto">
                {/* Header - Dòng 1 */}
                <div className="grid grid-cols-[1fr_auto] gap-4">
                  <div></div>
                  {dashboardAssessments.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {item.files?.length > 0 && (
                        <div className="font-bold text-blue-800 text-sm w-[60px]">
                          {t("scoresTable.submission")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Body - Dòng 2 cho mỗi assessment */}
                {dashboardAssessments.map((item, index) => {
                  const totalScore = calculateTotalScore(item);
                  const maxTotalScore = scoreColumns.criteria.reduce(
                    (sum, c) => sum + c.max_score,
                    0
                  );
                  const displayScore = Math.max(totalScore, 0);
                  
                  return (
                    <div
                      key={item.assessment.id}
                      className="grid grid-cols-[1fr_auto] gap-4"
                    >
                      {/* Cột 1: Container bo góc chứa tên và điểm */}
                      <div className="rounded-2xl border border-[#33438e]/30 bg-white p-2 flex items-center justify-between">
                        <div className="font-bold text-blue-800 text-base">
                          {item.assessment.name}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-[#f0a222] font-bold text-xl">
                            {displayScore}
                          </span>
                          <span className="text-gray-400 font-normal text-sm">
                            /{maxTotalScore}
                          </span>
                        </div>
                      </div>
                      
                      {/* Cột 2: Link bài thi */}
                      <div className="flex gap-2 items-center w-[60px]">
                        {item.files && item.files.length > 0 ? (
                          item.files.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-800 underline whitespace-nowrap"
                            >
                              {t("scoresTable.image", { index: idx + 1 })}
                            </a>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs"></span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="text-center py-8 text-gray-500">
              {t("scoresTable.noData")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table 2: Study Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-emerald-600" />
            {t("studyReportsTable.title", { count: studyReports.length })}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loadingStudyReports ? (
            <Loading />
          ) : studyReports.length > 0 ? (
            <div className="overflow-x-auto">
              {/* GRID FULL WIDTH */}
              <div
                className="
                  grid
                  w-full
                  gap-[2px]
                  p-[2px]
                "
                style={{
                  gridTemplateColumns: gridTemplateColumns,
                }}
              >
                {/* ===== HEADER ===== */}
                <div className="cell font-bold text-center">
                  {t("studyReportsTable.nameAssessment")}
                </div>

                {studyReportColumns.starSkills.map((skill) => (
                  <div
                    key={`h-star-${skill.id}`}
                    className="cell font-bold text-center text-[#73a106]"
                  >
                    {skill.name_vn}
                  </div>
                ))}

                {studyReportColumns.checkSkills.map((skill) => (
                  <div
                    key={`h-check-${skill.id}`}
                    className="cell font-bold text-center text-[#33438e]"
                  >
                    {skill.name_vn}
                  </div>
                ))}

                <div className="cell font-bold text-center text-[#f0a222]">
                  {t("studyReportsTable.generalComment")}
                </div>

                <div className="cell font-bold text-center text-[#6ba3ff]">
                  {t("studyReportsTable.action")}
                </div>

                {/* ===== BODY ===== */}
                {studyReports.map((report: any) => {
                  const starSkillsMap = new Map<string, StudyReportStarSkill>(
                    report.star_skills?.map((s: StudyReportStarSkill) => [
                      s.id,
                      s,
                    ]) || []
                  );
                  const checkSkillsMap = new Map<string, StudyReportCheckSkill>(
                    report.check_skills?.map((s: StudyReportCheckSkill) => [
                      s.id,
                      s,
                    ]) || []
                  );

                  return (
                    <Fragment key={report.id}>
                      {/* Assessment name */}
                      <div className="cell text-center">
                        {report.assessment.name}
                      </div>

                      {/* Star skills */}
                      {studyReportColumns.starSkills.map((skill) => {
                        const starSkill = starSkillsMap.get(skill.id);
                        const maxStar = report.max_star || 5;
                        return (
                          <div
                            key={`star-${report.id}-${skill.id}`}
                            className="cell justify-center"
                          >
                            {renderAverageStars(
                              starSkill?.average_star ?? 0,
                              maxStar
                            )}
                          </div>
                        );
                      })}

                      {/* Check skills */}
                      {studyReportColumns.checkSkills.map((skill) => {
                        const checkSkill = checkSkillsMap.get(skill.id);
                        const checkedTypes =
                          checkSkill?.types
                            ?.filter((t: any) => t.is_check)
                            .map((t: any) => t.name_vn) || [];

                        return (
                          <div
                            key={`check-${report.id}-${skill.id}`}
                            className="cell justify-center"
                          >
                            {checkedTypes.length > 0 ? (
                              <div className="flex flex-wrap gap-1 justify-center">
                                {checkedTypes.map(
                                  (name: string, idx: number) => (
                                    <Badge
                                      key={idx}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {name}
                                    </Badge>
                                  )
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </div>
                        );
                      })}

                      {/* General comment */}
                      <div className="cell">
                        {report.general_comment ? (
                          <p className="text-sm text-gray-600 break-words">
                            {report.general_comment}
                          </p>
                        ) : (
                          <Badge variant="secondary">
                            {t("studyReportsTable.noComment")}
                          </Badge>
                        )}
                      </div>

                      {/* Action */}
                      <div className="cell justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const params = new URLSearchParams({
                              course_id: selectedCourse,
                              assessment_id: reportValue || "",
                            });
                            router.push(
                              `/${currentLocale}/progress-report/study-report/${
                                report.id
                              }?${params.toString()}`
                            );
                          }}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </Fragment>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {t("studyReportsTable.noData")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
