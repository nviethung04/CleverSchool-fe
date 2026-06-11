"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Users,
  Activity,
  CheckCircle,
  Star,
  Brain,
  Shield,
  ChevronDown,
  Check,
} from "lucide-react";
import ExportData from "@/components/ui/export-data";
import { exportAdminDashboard } from "@/lib/api/export-import";
import OverviewSection from "./components/OverviewSection";
import LearningSection from "./components/LearningSection";
import BehaviorSection from "./components/BehaviorSection";
import GradingSection from "./components/GradingSection";
import QuestionsSection from "./components/QuestionsSection";
import AlertsSection from "./components/AlertsSection";
import WeeklyReportSection from "./components/WeeklyReportSection";
import { useEffect, useRef, useState } from "react";
import {
  getAdminDashboard,
  getListSchool,
  getListProgram,
  getListCourse,
  getListTeacher,
  getActiveUsersList,
} from "@/lib/api/dashboard";
import { cn, sortAlphabetGeneric, sortByNumberAndAlphabetFromSecondGeneric } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/context/auth-context";

export default function AdminDashboard() {
  const { user } = useAuth()
  const t = useTranslations("admin.dashboard");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [onlineUsers24hCount, setOnlineUsers24hCount] = useState<number>(0);
  const [onlineUsers1wCount, setOnlineUsers1wCount] = useState<number>(0);
  const [onlineUsers1mCount, setOnlineUsers1mCount] = useState<number>(0);
  // Hàm để lấy thời gian hiện tại
  const getCurrentTimeFilters = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // getMonth() trả về 0-11

    return {
      year: currentYear,
      month: currentMonth,
    };
  };

  // State cho các filter
  const [filters, setFilters] = useState(() => {
    const currentTime = getCurrentTimeFilters();
    return {
      school_id: "all-school",
      course_id: "all-course",
      teacher_id: "all-teacher",
      program_id: 'all-program',
      role_id: 'all-role',
      year: currentTime.year,
      month: currentTime.month,
      activeTab: "overview"
    };
  });

  // State cho danh sách trường học
  const [schools, setSchools] = useState<{ value: string; label: string }[]>([
    { value: "all-school", label: t("filters.allSchools") },
  ]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);

  // State cho danh sách chương trình
  const [programs, setPrograms] = useState<{ value: string; label: string }[]>([
    { value: "all-program", label: t("filters.allPrograms") },
  ]);
  const [programsLoading, setProgramsLoading] = useState(false);

  // State cho danh sách khóa học
  const [courses, setCourses] = useState<{ value: string; label: string }[]>([
    { value: "all-course", label: t("filters.allCourses") },
  ]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // State cho danh sách giáo viên
  const [teachers, setTeachers] = useState<{ value: string; label: string }[]>([
    { value: "all-teacher", label: t("filters.allTeachers") },
  ]);
  const [teachersLoading, setTeachersLoading] = useState(false);

  // Lấy số lượng user hoạt động trong 24h (1440 phút)
  useEffect(() => {
    async function fetchOnlineUsers24h() {
      try {
        const res = await getActiveUsersList({
          minutes: 1440,
          page: 1,
          limit: 20,
        });

        if (res.code === 200 && res.data) {
          const total =
            typeof res.data.total_active_users === "string"
              ? parseInt(res.data.total_active_users, 10)
              : Number(res.data.total_active_users || 0);
          if (!isNaN(total)) {
            setOnlineUsers24hCount(total);
          }
        }
      } catch (error) {
        console.error("Error fetching 24h online users:", error);
      }
    }

    fetchOnlineUsers24h();
  }, []);

  // Lấy số lượng user hoạt động trong 7 ngày (10080 phút)
  useEffect(() => {
    async function fetchOnlineUsers1w() {
      try {
        const res = await getActiveUsersList({
          minutes: 10080,
          page: 1,
          limit: 20,
        });

        if (res.code === 200 && res.data) {
          const total =
            typeof res.data.total_active_users === "string"
              ? parseInt(res.data.total_active_users, 10)
              : Number(res.data.total_active_users || 0);
          if (!isNaN(total)) {
            setOnlineUsers1wCount(total);
          }
        }
      } catch (error) {
        console.error("Error fetching 1w online users:", error);
      }
    }

    fetchOnlineUsers1w();
  }, []);

  // Lấy số lượng user hoạt động trong 30 ngày (43200 phút)
  useEffect(() => {
    async function fetchOnlineUsers1m() {
      try {
        const res = await getActiveUsersList({
          minutes: 43200,
          page: 1,
          limit: 20,
        });

        if (res.code === 200 && res.data) {
          const total =
            typeof res.data.total_active_users === "string"
              ? parseInt(res.data.total_active_users, 10)
              : Number(res.data.total_active_users || 0);
          if (!isNaN(total)) {
            setOnlineUsers1mCount(total);
          }
        }
      } catch (error) {
        console.error("Error fetching 1m online users:", error);
      }
    }

    fetchOnlineUsers1m();
  }, []);

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);
      try {
        // Chỉ gọi API khi không phải là "all-*" values
        const params = {
          course_id:
            filters.course_id !== "all-course" ? filters.course_id : "",
          school_id:
            filters.school_id !== "all-school" ? filters.school_id : "",
          teacher_id:
            filters.teacher_id !== "all-teacher" ? filters.teacher_id : "",
          program_id:
            filters.program_id !== "all-program" ? filters.program_id : "",
          role_id:
            filters.role_id !== "all-role" ? filters.role_id : "",
          year: filters.year,
          month: filters.month,
          tab: filters.activeTab,
        };
        const res = await getAdminDashboard(params);
        // Đảm bảo lấy đúng data từ response
        const apiData = res.data?.data || res.data || res;
        setDashboardData(apiData);
        setError("");
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [filters]);

  // Fetch danh sách trường học
  useEffect(() => {
    async function fetchSchools() {
      setSchoolsLoading(true);
      try {
        const res = await getListSchool();
        if (res.code === 200 && res.data?.schools) {
          const schoolOptions = [
            { value: "all-school", label: t("filters.allSchools") },
            ...res.data.schools.map((school: any) => ({
              value: school.id,
              label: `${school.school_name} (${school.ward_name})`,
            })),
          ];
          setSchools(schoolOptions);
        }
      } catch (err: any) {
        console.error("Error fetching schools:", err);
      } finally {
        setSchoolsLoading(false);
      }
    }
    fetchSchools();
  }, []);

  // Fetch danh sách khóa học
  useEffect(() => {
    async function fetchCourses() {
      setCoursesLoading(true);
      try {
        const res = await getListCourse({
          school_id:
            filters.school_id !== "all-school" ? filters.school_id : "",
          program_id:
            filters.program_id !== "all-program" ? filters.program_id : "",
        });
        if (res.code === 200 && res.data?.courses) {
          const courseOptions = [
            { value: "all-course", label: t("filters.allCourses") },
            ...res.data.courses.map((course: any) => ({
              value: course.id,
              label: `${course.name}${course.object_title ? ' _ ' + course.object_title : ''}`,
            })),
          ];
          setCourses(courseOptions);
        }
      } catch (err: any) {
        console.error("Error fetching courses:", err);
      } finally {
        setCoursesLoading(false);
      }
    }
    fetchCourses();
  }, [filters.school_id, filters.program_id]); // Re-fetch khi school_id hoặc program_id thay đổi

  // Fetch danh sách chương trình
  useEffect(() => {
    async function fetchPrograms() {
      setProgramsLoading(true);
      try {
        const res = await getListProgram({
          school_id:
            filters.school_id !== "all-school" ? filters.school_id : "",
        });
        if (res.code === 200 && res.data?.programs) {
          const programOptions = [
            { value: "all-program", label: t("filters.allPrograms") },
            ...res.data.programs.map((program: any) => ({
              value: program.id,
              label: program.name,
            })),
          ];
          setPrograms(programOptions);
        }
      } catch (err: any) {
        console.error("Error fetching programs:", err);
      } finally {
        setProgramsLoading(false);
      }
    }
    fetchPrograms();
  }, [filters.school_id]); // Re-fetch khi school_id thay đổi

  // Fetch danh sách giáo viên
  useEffect(() => {
    async function fetchTeachers() {
      setTeachersLoading(true);
      try {
        const res = await getListTeacher({
          course_id:
            filters.course_id !== "all-course" ? filters.course_id : "",
          school_id:
            filters.school_id !== "all-school" ? filters.school_id : "",
        });
        if (res.code === 200 && res.data?.teachers) {
          const teacherOptions = [
            { value: "all-teacher", label: t("filters.allTeachers") },
            ...res.data.teachers.map((teacher: any) => ({
              value: teacher.id,
              label: teacher.name,
            })),
          ];
          setTeachers(teacherOptions);
        }
      } catch (err: any) {
        console.error("Error fetching teachers:", err);
      } finally {
        setTeachersLoading(false);
      }
    }
    fetchTeachers();
  }, [filters.school_id, filters.course_id]); // Re-fetch khi school_id hoặc course_id thay đổi

  // auto select school when user type = school
  const schoolAutoSelectedRef = useRef(false);
  useEffect(() => {
    if (
      schoolAutoSelectedRef.current ||
      user?.sub_type !== "school" ||
      filters.school_id !== "all-school" ||
      schools.length <= 1
    ) return;

    const first = schools.find(s => s.value !== "all-school");
    if (first) {
      schoolAutoSelectedRef.current = true;
      handleFilterChange("school_id", first.value);
    }
  }, [schools, user?.sub_type, filters.school_id]);

  // Component SearchableCombobox
  const SearchableCombobox = ({
    options,
    value,
    onValueChange,
    placeholder,
    className,
    loading = false
  }: {
    options: { value: string; label: string }[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder: string;
    className?: string;
    loading?: boolean;
  }) => {
    const [open, setOpen] = useState(false);
    const selectedOption = options.find((option) => option.value === value);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between border-gray-200 bg-white hover:bg-gray-50 min-h-[40px]",
              className
            )}
          >
            <span className="truncate text-left">
              {loading
                ? t("filters.loading")
                : selectedOption
                  ? selectedOption.label
                  : placeholder}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder={`${t(
                "filters.loading"
              )} ${placeholder.toLowerCase()}...`}
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>
                {loading ? t("filters.loading") : t("filters.noResults")}
              </CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onValueChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  // Handler để cập nhật filters
  const handleFilterChange = (filterType: string, value: string | number) => {
    setFilters((prev) => {
      const newFilters = {
        ...prev,
        [filterType]: value,
      };

      // Reset course_id khi school_id thay đổi
      if (filterType === "school_id") {
        newFilters.course_id = "all-course";
        newFilters.teacher_id = "all-teacher";
        newFilters.program_id = "all-program"
      }

      // Reset teacher_id khi course_id thay đổi
      if (filterType === "course_id") {
        newFilters.teacher_id = "all-teacher";
      }

      if (filterType === "program_id") {
        newFilters.course_id = "all-course";
        newFilters.teacher_id = "all-teacher";
      }

      return newFilters;
    });
  };

  // Mapping dữ liệu cho OverviewSection
  let overviewMetrics = null;
  let courseMetrics = null;
  if (dashboardData && dashboardData.user_overview) {
    const u = dashboardData.user_overview;
    overviewMetrics = {
      totalUsers: {
        value: u.user.total_number,
        change: u.user.change_value,
        label: u.user.title,
        message: u.user.message,
        status: u.user.status,
      },
      totalSchools: {
        value: u.school.total_number,
        change: u.school.change_value,
        label: u.school.title,
        message: u.school.message,
        status: u.school.status,
      },
      totalStudents: {
        value: u.student.total_number,
        change: u.student.change_value,
        label: u.student.title,
        message: u.student.message,
        status: u.student.status,
      },
      totalTeachers: {
        value: u.teacher.total_number,
        change: u.teacher.change_value,
        label: u.teacher.title,
        message: u.teacher.message,
        status: u.teacher.status,
      },
      activeToday: {
        value: u.activity.total_number,
        change: u.activity.change_value,
        label: u.activity.title,
        message: u.activity.message,
        status: u.activity.status,
      },
      onlineUsers: {
        value: u.user_online?.total_number ?? 0,
        change: u.user_online?.change_value ?? 0,
        label: u.user_online?.title ?? t("overview.onlineUsers"),
        message: u.user_online?.message ?? t("overview.onlineUsersUnavailable"),
        status: u.user_online?.status ?? "same",
      },
      onlineUsers24h: {
        value: onlineUsers24hCount,
      },
      onlineUsers1w: {
        value: onlineUsers1wCount,
      },
      onlineUsers1m: {
        value: onlineUsers1mCount,
      },
    };
    // Chuyển đổi course overview
    courseMetrics = {
      overviews: dashboardData.course_overview?.overviews || [],
      rates: dashboardData.course_overview?.rates || [],
    };
  }

  // Khi truyền props vào các section, ưu tiên dùng dữ liệu từ backend, nếu không có thì mới dùng mock data.
  // Mapping dữ liệu cho LearningSection
  let learningSectionProps: any = {};
  if (
    dashboardData &&
    dashboardData.overview_learning &&
    dashboardData.score_distribution_overview
  ) {
    const overviewLearning = dashboardData.overview_learning;
    const scoreDistributionOverview = dashboardData.score_distribution_overview;
    // Trung bình điểm số theo tuần
    learningSectionProps.weeklyProgress = (
      overviewLearning.avg_scores_by_week || []
    ).map((item: any) => ({
      week: item.week_label,
      score: item.avg_score,
      // Có thể bổ sung students nếu backend trả về
    }));
    // Gem theo tuần
    learningSectionProps.gemsByWeek = (overviewLearning.gems_by_week || []).map(
      (item: any) => ({
        week: item.week_label,
        gem: item.gem_count,
      })
    );
    // Top học sinh xuất sắc
    learningSectionProps.topStudents = overviewLearning.top_highest || [];
    // Top học sinh kém nhất
    learningSectionProps.lowStudents = overviewLearning.top_lowest || [];
    //Điểm trung bình
    learningSectionProps.averageScore = overviewLearning.average_score || [];
    // Tỉ lệ cao
    learningSectionProps.highestPercent = overviewLearning.highest_percent || [];
    // Tỉ lệ thấp
    learningSectionProps.lowestPercent = overviewLearning.lowest_percent || [];
    // Tỉ lệ trung bình
    learningSectionProps.behaviorPercent = overviewLearning.behavior_percent || [];
    // Phân bố điểm số - tạo nhiều biểu đồ cho từng khối
    learningSectionProps.scoreDistributions = (
      scoreDistributionOverview.distributions || []
    ).map((distribution: any) => ({
      grade: distribution.grade,
      data: distribution.scores.map((score: number, idx: number) => ({
        range: `${score}`,
        count: distribution.counts[idx] || 0,
      })),
    }));
  }

  // Mapping dữ liệu cho BehaviorSection
  let behaviorSectionProps: any = {};
  if (dashboardData && dashboardData.system_usage_overview) {
    const sysUsage = dashboardData.system_usage_overview;

    // Sử dụng dữ liệu từ average_used nếu có
    if (sysUsage.average_used && Array.isArray(sysUsage.average_used)) {
      const averageUsed = sysUsage.average_used;

      // Tìm các giá trị theo key
      const minutesPerSession = averageUsed.find(
        (item: any) => item.key === "daily_active_users"
      );
      const dailyActiveUsers = averageUsed.find(
        (item: any) => item.key === "minutes_per_session"
      );
      const returningRate = averageUsed.find(
        (item: any) => item.key === "returning_rate"
      );
      const engagementRate = averageUsed.find(
        (item: any) => item.key === "engagement_rate"
      );
      const completeCount = averageUsed.find(
        (item: any) => item.key === "complete_count"
      )
      const completeRate = averageUsed.find(
        (item: any) => item.key === "complete_rate"
      )

      // Metrics cho các card
      behaviorSectionProps.metrics = {
        avgSessionTime: {
          value: minutesPerSession?.value ?? 0,
          change: 0, // Không có thông tin change trong average_used
          label: minutesPerSession?.title,
        },
        dailyActiveUsers: {
          value: dailyActiveUsers?.value ?? 0,
          change: 0, // Không có thông tin change trong average_used
          label: dailyActiveUsers?.title,
        },
        weeklyRetention: {
          value: returningRate?.value
            ? parseFloat(returningRate.value.replace("%", ""))
            : 0,
          change: 0, // Không có thông tin change trong average_used
          label: returningRate?.title,
        },
        engagementRate: {
          value: engagementRate?.value
            ? parseFloat(engagementRate.value.replace("%", ""))
            : 0,
          change: 0, // Không có thông tin change trong average_used
          label: engagementRate?.title,
        },
        completeCount: {
          value: completeCount?.value ?? 0,
          change: 0, // Không có thông tin change trong average_used
          label: completeCount?.title,
        },
        completeRate: {
          value: completeRate?.value
            ? parseFloat(completeRate.value.replace("%", ""))
            : 0,
          change: 0, // Không có thông tin change trong average_used
          label: completeRate?.title,
        },
      };
    }

    // Biểu đồ thời lượng sử dụng trung bình theo tuần
    behaviorSectionProps.weeklyUsage = (sysUsage.weekly_usage || []).map(
      (item: any) => ({
        week: item.week_label,
        averageDuration: item.average_duration,
        averageDurationMinute: item.average_duration_minute,
      })
    );
    // Biểu đồ thiết bị truy cập phổ biến
    behaviorSectionProps.deviceUsage = (sysUsage.device_usages || []).map(
      (item: any) => ({
        device: item.device_name,
        users: item.user_count,
        percentage: item.percentage,
      })
    );
  }
  

  // Mapping dữ liệu cho GradingSection
  let gradingSectionProps: any = {};
  if (dashboardData && dashboardData.teacher_performance_overview) {
    const perf = dashboardData.teacher_performance_overview;
    // 6 card
    gradingSectionProps.metrics = {
      // Tổng số bài tập
      totalAssignments: {
        value: perf.grading_summary?.total_exercise ?? 0,
        change: 0,
        label: t("grading.totalAssignments"),
      },
      // Tổng bài đã giao
      totalAssigned: {
        value: perf.grading_summary?.total_assigned ?? 0,
        change: 0,
        label: t("grading.totalAssigned"),
      },
      // Tổng bài đã nộp (chấm tự động)
      totalSubmissions: {
        value: perf.grading_summary?.total_submissions - perf.grading_summary?.graded_submissions,
        change: 0,
        label: t("grading.totalSubmissions"),
      },
      // Tổng bài đã nộp (Speking / Writing)
      totalSubmissionsSaW: {
        value: perf.grading_summary?.graded_submissions ?? 0,
        change: 0,
        label: t("grading.totalSubmissionsSaW"),
      },
      // Tổng bài đã chấm (Speaking / Writing)
      gradedSubmissionsSaW: {
        value: perf.grading_summary?.graded_submissions - perf.grading_summary?.ungraded_submissions,
        change: 0,
        label: t("grading.gradedSubmissionsSaW"),
      },
      // Tổng bài chưa chấm (Speaking / Writing)
      ungradedSubmissionsSaW: {
        value: perf.grading_summary?.ungraded_submissions ?? 0,
        change: 0,
        label: t("grading.ungradedSubmissionsSaW"),
      },
    };
    // Biểu đồ tình trạng giao bài
    gradingSectionProps.weeklyAssignAssignmentRates = (
      perf.weekly_assign_assignment_rates || []
    ).map((item: any) => ({
      week: item.week_label,
      total: item.total,
      assign_assignment: item.assign_assignment
    }));
    // Biểu đồ tổng bài đã nộp và tổng bài chưa chấm
    gradingSectionProps.weeklySubmitRates = (
      perf.weekly_submit_rates || []
    ).map((item: any) => ({
      week: item.week_label,
      total: item.total,
      not_graded: item.not_graded
    }));
    // Biểu đồ tỉ lệ giao bài, nộp bài, chấm bài
    gradingSectionProps.weeklyPerformanceOverviewRates = (
      perf.weekly_performance_overview_rates || []
    ).map((item: any) => ({
      week: item.week_label,
      assign_assignment_percent: item.assign_assignment_percent,
      submit_percent: item.submit_percent,
      not_graded_percent: item.not_graded_percent
    }));
    // Bài chưa chấm
    gradingSectionProps.notGraded = (
      perf.weekly_submit_rates || []
    ).map((item: any) => ({
      week: item.week_label,
      not_graded_exams: item.not_graded_exams || [],
      not_graded_homeworks: item.not_graded_homeworks || [],
      not_graded_exercises: item.not_graded_exercises || []
    }))
  }

  // Mapping dữ liệu cho AlertsSection
  let alertsSectionProps: any = {};
  if (dashboardData && dashboardData.risk_and_warning) {
    const risk = dashboardData.risk_and_warning;
    alertsSectionProps.inactiveStudents = risk.inactive_students || [];
    alertsSectionProps.decliningStudents = risk.declining_students || [];
    alertsSectionProps.slowGradingTeachers = risk.slow_grading_teachers || [];
  }

  // Mapping dữ liệu cho QuestionsSection
  let questionSectionProps: any = {};
  if (dashboardData && dashboardData.question_bank_overview) {
    const q = dashboardData.question_bank_overview;
    // 5 card đầu
    questionSectionProps.mediaMetrics = {
      totalQuestions: {
        value: q.media_usage?.total_questions ?? 0,
        label: "Tổng câu hỏi",
      },
      audioPercent: {
        value: q.media_usage?.audio_percent ?? 0,
        label: "Tỷ lệ câu hỏi có audio",
        suffix: "%",
      },
      imagePercent: {
        value: q.media_usage?.image_percent ?? 0,
        label: "Tỷ lệ câu hỏi có ảnh",
        suffix: "%",
      },
      withAudio: {
        value: q.media_usage?.with_audio ?? 0,
        label: "Câu hỏi có audio",
      },
      withImage: {
        value: q.media_usage?.with_image ?? 0,
        label: "Câu hỏi có ảnh",
      },
    };
    // 4 card cũ nếu có (metrics)
    if (dashboardData.question_overview) {
      const qo = dashboardData.question_overview;
      questionSectionProps.metrics = {
        totalQuestions: {
          value: qo.total_questions ?? 0,
          change: qo.total_questions_change ?? 0,
          label: "Tổng câu hỏi",
        },
        usedQuestions: {
          value: qo.used_questions ?? 0,
          change: qo.used_questions_change ?? 0,
          label: "Đã sử dụng",
        },
        usageRate: {
          value: qo.usage_rate ?? 0,
          change: qo.usage_rate_change ?? 0,
          label: "Tỉ lệ sử dụng",
        },
        newQuestions: {
          value: qo.new_questions ?? 0,
          change: qo.new_questions_change ?? 0,
          label: "Câu hỏi mới/tuần",
        },
      };
    }
    // Thống kê theo dạng câu hỏi
    questionSectionProps.questionsByType = (q.types || []).map((item: any) => ({
      type: item.type,
      count: item.total,
      percentage: item.percent,
    }));
    // attributes: truyền động, không hardcode
    questionSectionProps.attributes = (q.attributes || []).map((attr: any) => ({
      name: attr.name,
      items: (attr.items || []).map((item: any) => ({
        name: item.name,
        count: item.count,
        percentage: item.percent,
      })),
    }));
  }

  return (
    <div className="min-h-screen">
      <div className="space-y-6 p-6">
        {/* Global Filters - Đứng trên tabs */}
        <Card className="shadow-sm border-0">
          <CardContent className="pt-6">
            <div className="space-y-2">
              {/* Filters Grid - Responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {/* School Filter */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">
                    {t("filters.school")}
                  </label>
                  <SearchableCombobox
                    options={sortAlphabetGeneric(schools, item => item.label, false)}
                    value={filters.school_id}
                    onValueChange={(value) =>
                      handleFilterChange("school_id", value)
                    }
                    placeholder={t("filters.selectSchool")}
                    loading={schoolsLoading}
                    className="w-full"
                  />
                </div>

                {/* Program Filter */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">
                    {t("filters.program")}
                  </label>
                  <SearchableCombobox
                    options={sortByNumberAndAlphabetFromSecondGeneric(programs, programs => programs.label, false)}
                    value={filters.program_id}
                    onValueChange={(value) =>
                      handleFilterChange("program_id", value)
                    }
                    placeholder={t("filters.selectProgram")}
                    loading={programsLoading}
                    className="w-full"
                  />
                </div>

                {/* Course Filter */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">
                    {t("filters.course")}
                  </label>
                  <SearchableCombobox
                    options={sortByNumberAndAlphabetFromSecondGeneric(courses, courses => courses.label, false)}
                    value={filters.course_id}
                    onValueChange={(value) =>
                      handleFilterChange("course_id", value)
                    }
                    placeholder={t("filters.selectCourse")}
                    loading={coursesLoading}
                    className="w-full"
                  />
                </div>

                {/* Teacher Filter */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">
                    {t("filters.teacher")}
                  </label>
                  <SearchableCombobox
                    options={sortAlphabetGeneric(teachers, teachers => teachers.label, false)}
                    value={filters.teacher_id}
                    onValueChange={(value) =>
                      handleFilterChange("teacher_id", value)
                    }
                    placeholder={t("filters.selectTeacher")}
                    loading={teachersLoading}
                    className="w-full"
                  />
                </div>

                {/* Year Filter */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">
                    {t("filters.year")}
                  </label>
                  <Select
                    value={filters.year.toString()}
                    onValueChange={(value) =>
                      handleFilterChange("year", parseInt(value))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("filters.selectYear")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={(filters.year - 1).toString()}>
                        {filters.year - 1}
                      </SelectItem>
                      <SelectItem value={filters.year.toString()}>
                        {filters.year}
                      </SelectItem>
                      <SelectItem value={(filters.year + 1).toString()}>
                        {filters.year + 1}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Month Filter */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">
                    {t("filters.month")}
                  </label>
                  <Select
                    value={
                      filters.month === 0
                        ? "all-month"
                        : filters.month.toString()
                    }
                    onValueChange={(value) => {
                      const monthValue =
                        value === "all-month" ? 0 : parseInt(value);
                      handleFilterChange("month", monthValue);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("filters.selectMonth")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-month">
                        {t("filters.allMonths")}
                      </SelectItem>
                      <SelectItem value="1">{t("filters.month1")}</SelectItem>
                      <SelectItem value="2">{t("filters.month2")}</SelectItem>
                      <SelectItem value="3">{t("filters.month3")}</SelectItem>
                      <SelectItem value="4">{t("filters.month4")}</SelectItem>
                      <SelectItem value="5">{t("filters.month5")}</SelectItem>
                      <SelectItem value="6">{t("filters.month6")}</SelectItem>
                      <SelectItem value="7">{t("filters.month7")}</SelectItem>
                      <SelectItem value="8">{t("filters.month8")}</SelectItem>
                      <SelectItem value="9">{t("filters.month9")}</SelectItem>
                      <SelectItem value="10">{t("filters.month10")}</SelectItem>
                      <SelectItem value="11">{t("filters.month11")}</SelectItem>
                      <SelectItem value="12">{t("filters.month12")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Role Filter */}
                {filters.activeTab === 'behavior' &&
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-600">
                      {t("filters.role")}
                    </label>
                    <Select
                      value={filters.role_id}
                      onValueChange={(value) => {
                        handleFilterChange("role_id", value);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("filters.selectRole")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-role">
                          {t("filters.allRoles")}
                        </SelectItem>
                        <SelectItem value="2">{t("filters.roleTeacher")}</SelectItem>
                        <SelectItem value="3">{t("filters.roleStudent")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                }
              </div>

              {/* Export Button */}
              <div className="flex justify-end pt-2">
                <ExportData
                  onExport={async () => {
                    try {
                      const params = {
                        course_id:
                          filters.course_id !== "all-course"
                            ? filters.course_id
                            : "",
                        school_id:
                          filters.school_id !== "all-school"
                            ? filters.school_id
                            : "",
                        teacher_id:
                          filters.teacher_id !== "all-teacher"
                            ? filters.teacher_id
                            : "",
                        program_id:
                          filters.program_id !== "all-program"
                            ? filters.program_id : "",
                        role_id:
                          filters.role_id !== "all-role"
                            ? filters.role_id : "",
                        year: filters.year,
                        month: filters.month,
                      };

                      const response = await exportAdminDashboard(params);

                      // Lấy URL từ response và download file
                      if (response.data && response.data.url) {
                        const link = document.createElement("a");
                        link.href = response.data.url;
                        link.download = `admin_dashboard_${new Date().toISOString().split("T")[0]
                          }.xlsx`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }
                    } catch (error) {
                      console.error("Export failed:", error);
                      alert("Export failed. Please try again.");
                    }
                  }}
                  label={t("filters.exportReport")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Tabs */}
        <Tabs
          defaultValue="overview"
          className="space-y-6"
          onValueChange={(value) => {
            let tab = value
            if (value === "learning") {
              tab = "quality"
            }
            if (value === "alerts") {
              tab = "warning"
            }
            if (value === "questions") {
              tab = "question"
            }
            if (value === "report") {
              tab = ""
            }
            setFilters((prev) => ({ ...prev, role_id: 'all-role', activeTab: tab }))
          }}
        >
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 bg-white shadow-lg border border-gray-200 rounded-lg p-1 h-auto">
            <TabsTrigger
              value="overview"
              className="flex flex-col sm:flex-row gap-1 h-12 sm:h-12 rounded-md transition-all data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-blue-50"
            >
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium">{t("tabs.overview")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="learning"
              className="flex flex-col sm:flex-row gap-1 h-12 sm:h-12 rounded-md transition-all data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-green-50"
            >
              <Star className="h-4 w-4" />
              <span className="text-xs font-medium">{t("tabs.learning")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="behavior"
              className="flex flex-col sm:flex-row gap-1 h-12 sm:h-12 rounded-md transition-all data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-purple-50"
            >
              <Activity className="h-4 w-4" />
              <span className="text-xs font-medium">{t("tabs.behavior")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="grading"
              className="flex flex-col sm:flex-row gap-1 h-12 sm:h-12 rounded-md transition-all data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-orange-50"
            >
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs font-medium">{t("tabs.grading")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="questions"
              className="flex flex-col sm:flex-row gap-1 h-12 sm:h-12 rounded-md transition-all data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-cyan-50"
            >
              <Brain className="h-4 w-4" />
              <span className="text-xs font-medium">{t("tabs.questions")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="alerts"
              className="flex flex-col sm:flex-row gap-1 h-12 sm:h-12 rounded-md transition-all data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-red-50"
            >
              <Shield className="h-4 w-4" />
              <span className="text-xs font-medium">{t("tabs.alerts")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="report"
              className="flex flex-col sm:flex-row gap-1 h-12 sm:h-12 rounded-md transition-all data-[state=active]:bg-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-indigo-50"
            >
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Báo cáo</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {loading ? (
              <div>{t("filters.loading")}</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : dashboardData.user_overview && (
              <OverviewSection
                metrics={overviewMetrics}
                courseMetrics={courseMetrics}
              />
            )}
          </TabsContent>

          <TabsContent value="learning" className="space-y-6">
            {loading ? (
              <div>{t("filters.loading")}</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : dashboardData.overview_learning &&
            dashboardData.score_distribution_overview && (
              <LearningSection
                metrics={learningSectionProps.weeklyProgress || undefined}
                scoreDistributions={
                  learningSectionProps.scoreDistributions || undefined
                }
                weeklyProgress={learningSectionProps.weeklyProgress || undefined}
                topStudents={learningSectionProps.topStudents || undefined}
                gemsByWeek={learningSectionProps.gemsByWeek || undefined}
                lowStudents={learningSectionProps.lowStudents || undefined}
                averageScore={learningSectionProps.averageScore || undefined}
                highestPercent={learningSectionProps.highestPercent || undefined}
                lowestPercent={learningSectionProps.lowestPercent || undefined}
                behaviorPercent={learningSectionProps.behaviorPercent || undefined}
              />
            )}
          </TabsContent>

          <TabsContent value="behavior" className="space-y-6">
            {loading ? (
              <div>{t("filters.loading")}</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : dashboardData.system_usage_overview && (
              <BehaviorSection
                metrics={behaviorSectionProps.metrics || undefined}
                deviceUsage={behaviorSectionProps.deviceUsage || undefined}
                weeklyUsage={behaviorSectionProps.weeklyUsage || undefined}
              />
            )}
          </TabsContent>

          <TabsContent value="grading" className="space-y-6">
            {loading ? (
              <div>{t("filters.loading")}</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : dashboardData.teacher_performance_overview && (
              <GradingSection
                metrics={gradingSectionProps.metrics || undefined}
                notGraded={
                  gradingSectionProps.notGraded || undefined
                }
                weeklyAssignAssignmentRates={
                  gradingSectionProps.weeklyAssignAssignmentRates || undefined
                }
                weeklySubmitRates={
                  gradingSectionProps.weeklySubmitRates || undefined
                }
                weeklyPerformanceOverviewRates={
                  gradingSectionProps.weeklyPerformanceOverviewRates
                }
              />
            )}
          </TabsContent>

          <TabsContent value="questions" className="space-y-6">
            {loading ? (
              <div>{t("filters.loading")}</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : dashboardData.question_bank_overview && (
              <QuestionsSection
                mediaMetrics={questionSectionProps.mediaMetrics || {}}
                metrics={questionSectionProps.metrics || {}}
                questionsByType={questionSectionProps.questionsByType || []}
                attributes={questionSectionProps.attributes || []}
              />
            )}
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            {loading ? (
              <div>{t("filters.loading")}</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : dashboardData.risk_and_warning && (
              <AlertsSection
                metrics={gradingSectionProps.alertMetrics || undefined}
                riskTrend={gradingSectionProps.riskTrend || undefined}
                inactiveStudents={
                  alertsSectionProps.inactiveStudents || undefined
                }
                decliningStudents={
                  alertsSectionProps.decliningStudents || undefined
                }
                slowGradingTeachers={
                  alertsSectionProps.slowGradingTeachers || undefined
                }
              />
            )}
          </TabsContent>

          <TabsContent value="report" className="space-y-6">
            {loading ? (
              <div>{t("filters.loading")}</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : (
              <WeeklyReportSection />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
