"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LucideFileText,
  LucideSearch,
  LucideFilter,
  LucidePlus,
  LucideEdit,
  LucideTrash2,
  LucideEye,
  LucideChevronDown,
  LucideCalendar,
  LucideLoader2,
  LucideBookOpen,
  LucideClock,
  LucideInfo,
  ChevronDown,
  LucideListChecks,
  Info,
  ClipboardList,
  SlidersHorizontal,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GetExamList,
  DeleteExam,
  type Exam,
  type ExamFilters,
} from "@/lib/api/exams";
import { GetCourseList } from "@/lib/api/courses";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useParams, useRouter } from "next/navigation";
import { useTypedTranslations } from "@/lib/i18n/client";
import {
  GetHomeworkList,
  DeleteHomework,
  type Homework,
  type HomeworkFilters,
} from "@/lib/api/homeworks";
import { DeleteAssessment, type AssessmentFilters, type Assessment } from "@/lib/api/assessment";
import { useExamsQuery } from "@/hooks/use-exams-query";
import { useHomeworksQuery } from "@/hooks/use-homeworks-query";
import { useAssessmentQuery } from "@/hooks/use-assessment-query";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/context/auth-context";
import {
  getCreateAssignmentRoute,
  getCreateHomeworkRoute,
  getCreateAssessmentRoute,
  getCreateExerciseRoute,
  getEditAssignmentRoute,
  getEditHomeworkRoute,
  getEditAssessmentRoute,
  getEditExerciseRoute,
  doHomeworkRoute,
  doHomeworkWithLessonIdRoute,
  doExamRoute,
  doExamWithLessonIdRoute,
  doExerciseRoute,
  doExerciseWithLessonIdRoute,
} from "@/lib/utils/route-utils";
import { useDebounce } from "@/hooks/use-debounce";
import { BRAND_COLORS } from "@/lib/constants/colors";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  getListLesson,
  getListSchool,
  getListCourse,
} from "@/lib/api/dashboard";
import { CloneExam, CloneHomework, CloneExercise } from "@/lib/api/clones";
import {
  getExercisesList,
  DeleteExercise,
  type Exercise,
} from "@/lib/api/exercises";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import ProfessionalPagination from "@/components/ui/professional-pagination";

// Utility function to format Unix timestamp to readable date
const formatTimestamp = (
  timestamp: string | number,
  currentLocale: string
): string => {
  if (!timestamp) return "";

  const numericTimestamp =
    typeof timestamp === "string" ? Number(timestamp) : timestamp;

  // Tạo date từ timestamp nhưng giữ UTC
  const date = new Date(numericTimestamp * 1000);

  if (isNaN(date.getTime())) return "";

  const formatter = new Intl.DateTimeFormat(currentLocale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC", // Ngăn trình duyệt tự cộng múi giờ
  });

  return formatter.format(date);
};

// Utility function to format deadline with time
const formatDeadline = (
  timestamp: string | number,
  currentLocale: string
): string => {
  if (!timestamp) return "";

  const numericTimestamp =
    typeof timestamp === "string" ? Number.parseInt(timestamp) : timestamp;
  const date = new Date(numericTimestamp * 1000);

  if (isNaN(date.getTime())) return "";

  return date.toLocaleDateString(currentLocale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ExamsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const locale = (params as any)?.locale || "vi";
  const t = useTypedTranslations("manageAssignments");
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // State cho dữ liệu
  const [courses, setCourses] = useState<
    Array<{ id: string | number; name: string }>
  >([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [homeworkToDelete, setHomeworkToDelete] = useState<Homework | null>(
    null
  );
  const [assessmentToDelete, setAssessmentToDelete] = useState<Assessment | null>(
    null
  );
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createTypeDialogOpen, setCreateTypeDialogOpen] = useState(false);
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [isCreatingHomework, setIsCreatingHomework] = useState(false);
  const [isCreatingAssessment, setIsCreatingAssessment] = useState(false);
  const [isCreatingExercise, setIsCreatingExercise] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [cloneType, setCloneType] = useState<
    "homework" | "exam" | "exercise" | null
  >(null);
  const [cloneTargetId, setCloneTargetId] = useState<string | number | null>(
    null
  );
  const [cloneName, setCloneName] = useState("");
  const [cloneDescription, setCloneDescription] = useState("");
  const [cloneLessonId, setCloneLessonId] = useState<string>("none");
  const [availableLessons, setAvailableLessons] = useState<
    Array<{ id: string; title: string; chapter_name?: string }>
  >([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  // Clone dialog filters
  const [cloneSchoolId, setCloneSchoolId] = useState<string>("all-school");
  const [cloneCourseId, setCloneCourseId] = useState<string>("all-course");
  const [schoolOptions, setSchoolOptions] = useState<
    { value: string; label: string }[]
  >([{ value: "all-school", label: t("allSchools") }]);
  const [courseOptions, setCourseOptions] = useState<
    { value: string; label: string }[]
  >([{ value: "all-course", label: t("allCourses") }]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("homework");
  const [filters, setFilters] = useState<ExamFilters>({
    status: undefined,
    lesson_id: undefined,
    page: 1,
    limit: 20,
  });
  const [homeworkFilters, setHomeworkFilters] = useState<HomeworkFilters>({
    status: undefined,
    lesson_id: undefined,
    page: 1,
    limit: 20,
  });
  const [assessmentFilters, setAssessmentFilters] = useState<AssessmentFilters>({
    page: 1,
    limit: 20,
  });
  const [exerciseFilters, setExerciseFilters] = useState<{
    page: number;
    limit: number;
  }>({
    page: 1,
    limit: 20,
  });

  // Page size states for each tab
  const [homeworkPageSize, setHomeworkPageSize] = useState(20);
  const [assessmentPageSize, setAssessmentPageSize] = useState(20);
  const [examPageSize, setExamPageSize] = useState(20);
  const [exercisePageSize, setExercisePageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  // React Query hooks
  const {
    data: examsData,
    isLoading: examsLoading,
    error: examsError,
  } = useExamsQuery({
    ...filters,
    limit: examPageSize,
    keyword:
      activeTab === "all" && debouncedSearchTerm
        ? debouncedSearchTerm
        : undefined,
  }) as {
    data: { exams: any[]; totalPages: number; total: number } | undefined;
    isLoading: boolean;
    error: any;
  };

  // Homeworks query
  const {
    data: homeworksData,
    isLoading: homeworksLoading,
    error: homeworksError,
  } = useHomeworksQuery({
    ...homeworkFilters,
    limit: homeworkPageSize,
    keyword:
      activeTab === "homework" && debouncedSearchTerm
        ? debouncedSearchTerm
        : undefined,
  }) as {
    data: { homeworks: any[]; totalPages: number; total: number } | undefined;
    isLoading: boolean;
    error: any;
  };
  
  //Assessment query
  const {
    data: assessmentData,
    isLoading: assessmentLoading,
    error: assessmentError,
  } = useAssessmentQuery({
    ...assessmentFilters,
    limit: assessmentPageSize,
    keyword:
      activeTab === "assessment" && debouncedSearchTerm
        ? debouncedSearchTerm
        : undefined,
  }) as {
    data: { assessment: any[]; totalPages: number; total: number } | undefined;
    isLoading: boolean;
    error: any;
  };

  // Exercises query
  const {
    data: exercisesResponse,
    isLoading: exercisesLoading,
    error: exercisesError,
  } = useQuery({
    queryKey: ["exercises", exerciseFilters.page, exercisePageSize],
    queryFn: async () =>
      await getExercisesList({
        page: exerciseFilters.page,
        limit: exercisePageSize,
      }),
    enabled: activeTab === "exercise",
  });
  const exercisesData = exercisesResponse as any;
  const exerciseList = exercisesData?.exercises ?? [];
  const exerciseTotalPages = exercisesData?.totalPages ?? 1;

  // Fetch dữ liệu ban đầu
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch danh sách khóa học
        const coursesResponse = await GetCourseList();
        if (
          coursesResponse.code === 200 &&
          coursesResponse.data &&
          coursesResponse.data.courses
        ) {
          setCourses(coursesResponse.data.courses);
        } else {
          console.error(
            "Unexpected courses response structure:",
            coursesResponse
          );
        }
      } catch (err) {
        console.error("Error fetching initial data:", err);
        toast({
          title: t("error"),
          description: t("cannotLoadInitialData"),
          variant: "destructive",
        });
      }
    };

    fetchInitialData();
  }, []);

  // Reset page về 1 khi search hoặc đổi tab
  useEffect(() => {
    if (activeTab === "homework") {
      setHomeworkFilters((prev) => ({
        ...prev,
        page: 1,
        keyword: debouncedSearchTerm || undefined,
      }));
    } else if (activeTab === "exercise") {
      setExerciseFilters((prev) => ({
        ...prev,
        page: 1,
      }));
    } else if (activeTab === "assessment") {
      setAssessmentFilters((prev) => ({
        ...prev,
        page: 1,
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        page: 1,
        keyword: debouncedSearchTerm || undefined,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, activeTab]);

  // Fix types for examsData and homeworksData
  const exams = examsData?.exams ?? [];
  const totalPages = examsData?.totalPages ?? 1;
  const homeworks = homeworksData?.homeworks ?? [];
  const homeworksTotalPages = homeworksData?.totalPages ?? 1;
  const assessment = assessmentData?.assessment ?? [];
  const assessmentTotalPages = assessmentData?.totalPages ?? 1;
  // Exercises query
  const exercises = exerciseList;
  const exercisesTotal = exercisesData?.total ?? 0;

  // Use loading and error states from React Query based on active tab
  const loading = activeTab === "homework" ? homeworksLoading : examsLoading;
  const error =
    activeTab === "homework"
      ? homeworksError
        ? t("cannotLoadHomeworkList")
        : null
      : examsError
      ? t("cannotLoadExamList")
      : null;

  // Xử lý thay đổi bộ lọc
  const handleFilterChange = (key: keyof ExamFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
      page: 1, // Reset về trang 1 khi thay đổi bộ lọc
    }));
  };

  // Xử lý thay đổi bộ lọc cho bài tập về nhà
  const handleHomeworkFilterChange = (
    key: keyof HomeworkFilters,
    value: string
  ) => {
    setHomeworkFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
      page: 1, // Reset về trang 1 khi thay đổi bộ lọc
    }));
  };

  // Xử lý thay đổi trang
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setFilters((prev) => ({
        ...prev,
        page: newPage,
      }));
    }
  };

  // Xử lý thay đổi trang cho bài tập về nhà
  const handleHomeworkPageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= homeworksTotalPages) {
      setHomeworkFilters((prev) => ({
        ...prev,
        page: newPage,
      }));
    }
  };
  const handleAssessmentPageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= assessmentTotalPages) {
      setAssessmentFilters((prev) => ({
        ...prev,
        page: newPage,
      }));
    }
  };
  const handleExercisePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= exerciseTotalPages) {
      setExerciseFilters((prev) => ({
        ...prev,
        page: newPage,
      }));
    }
  };

  // Page size change handlers
  const handleHomeworkPageSizeChange = (newSize: number) => {
    setHomeworkPageSize(newSize);
    setHomeworkFilters((prev) => ({
      ...prev,
      limit: newSize,
      page: 1, // Reset to first page when changing page size
    }));
  };

  const handleAssessmentPageSizeChange = (newSize: number) => {
    setAssessmentPageSize(newSize);
    setAssessmentFilters((prev) => ({
      ...prev,
      limit: newSize,
      page: 1, // Reset to first page when changing page size
    }));
  };

  const handleExamPageSizeChange = (newSize: number) => {
    setExamPageSize(newSize);
    setFilters((prev) => ({
      ...prev,
      limit: newSize,
      page: 1, // Reset to first page when changing page size
    }));
  };

  const handleExercisePageSizeChange = (newSize: number) => {
    setExercisePageSize(newSize);
    setExerciseFilters((prev) => ({
      ...prev,
      limit: newSize,
      page: 1, // Reset to first page when changing page size
    }));
  };

  // Xử lý tìm kiếm
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Tìm kiếm sẽ được xử lý bởi useEffect
  };

  // Xử lý xóa bài kiểm tra
  const handleDeleteExam = async () => {
    if (!examToDelete) return;

    setIsDeleting(true);
    try {
      await DeleteExam(examToDelete.id);
      setTimeout(async () => {
        await queryClient.invalidateQueries({ queryKey: ["exams"] });
      }, 500);

      toast({
        title: t("success"),
        description: t("deleteExamSuccess"),
      });
    } catch (err) {
      console.error("Error deleting exam:", err);
      toast({
        title: t("error"),
        description: t("deleteExamError"),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setExamToDelete(null);
    }
  };

  // Xử lý xóa bài tập về nhà
  const handleDeleteHomework = async () => {
    if (!homeworkToDelete) return;

    setIsDeleting(true);
    try {
      await DeleteHomework(homeworkToDelete.id);
      setTimeout(async () => {
        await queryClient.invalidateQueries({ queryKey: ["homeworks"] });
      }, 500);

      toast({
        title: t("success"),
        description: t("deleteHomeworkSuccess"),
      });
    } catch (err) {
      console.error("Error deleting homework:", err);
      toast({
        title: t("error"),
        description: t("deleteHomeworkError"),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setHomeworkToDelete(null);
    }
  };

  // Xử lý xóa bài kiểm tra đánh giá
  const handleDeleteAssessment = async () => {
    if (!assessmentToDelete) return;

    setIsDeleting(true);
    try {
      await DeleteAssessment(assessmentToDelete.id);
      setTimeout(async () => {
        await queryClient.invalidateQueries({ queryKey: ["assessment"] });
      }, 500);

      toast({
        title: t("success"),
        description: t("deleteAssessmentSuccess"),
      });
    } catch (err) {
      console.error("Error deleting assessment:", err);
      toast({
        title: t("error"),
        description: t("deleteAssessmentError"),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setAssessmentToDelete(null);
    }
  };

  // Xử lý xóa bài tập
  const handleDeleteExercise = async () => {
    if (!exerciseToDelete) return;

    setIsDeleting(true);
    try {
      await DeleteExercise(exerciseToDelete.id);
      setTimeout(async () => {
        await queryClient.invalidateQueries({ queryKey: ["exercises"] });
      }, 500);

      toast({
        title: t("success"),
        description: t("deleteExerciseSuccess"),
      });
    } catch (err) {
      console.error("Error deleting exercise:", err);
      toast({
        title: t("error"),
        description: t("deleteExerciseError"),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setExerciseToDelete(null);
    }
  };

  // Xử lý mở dialog chọn loại tạo mới
  const handleOpenCreateTypeDialog = () => {
    setCreateTypeDialogOpen(true);
  };

  // Xử lý chuyển hướng tạo bài kiểm tra mới
  const handleCreateExam = async () => {
    setIsCreatingExam(true);
    setCreateTypeDialogOpen(false);

    // Simulate loading delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    router.push(getCreateAssignmentRoute(user));

    setTimeout(() => {
      setIsCreatingExam(false);
    }, 500);
  };

  // Xử lý chuyển hướng tạo bài tập về nhà mới
  const handleCreateHomework = async () => {
    setIsCreatingHomework(true);
    setCreateTypeDialogOpen(false);

    // Simulate loading delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    router.push(getCreateHomeworkRoute(user));

    setTimeout(() => {
      setIsCreatingHomework(false);
    }, 500);
  };

  // Xử lý chuyển hướng tạo bài kiểm tra đánh giá mới
  const handleCreateAssessment = async () => {
    setIsCreatingAssessment(true);
    setCreateTypeDialogOpen(false);

    // Simulate loading delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    router.push(getCreateAssessmentRoute(user));

    setTimeout(() => {
      setIsCreatingAssessment(false);
    }, 500);
  };

  // Xử lý chuyển hướng tạo bài tập mới
  const handleCreateExercise = async () => {
    setIsCreatingExercise(true);
    setCreateTypeDialogOpen(false);

    // Simulate loading delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    router.push(getCreateExerciseRoute(user));

    setTimeout(() => {
      setIsCreatingExercise(false);
    }, 500);
  };

  // Clone handlers
  const openCloneDialog = async (
    type: "homework" | "exam" | "exercise",
    id: string | number,
    currentName: string,
    currentDescription?: string
  ) => {
    setCloneType(type);
    setCloneTargetId(id);
    setCloneName(`${currentName}`);
    setCloneDescription(currentDescription || "");
    // Reset filters each time dialog opens
    setCloneSchoolId("all-school");
    setCloneCourseId("all-course");
    setCloneLessonId("none");
    setCloneDialogOpen(true);
    // Load schools, courses, and lessons for filtering
    try {
      setSchoolsLoading(true);
      const sres = await getListSchool();
      const schools = sres?.data?.schools || [];
      setSchoolOptions([
        { value: "all-school", label: "Tất cả trường" },
        ...schools.map((s: any) => ({
          value: String(s.id),
          label: `${s.school_name} (${s.ward_name})`,
        })),
      ]);
    } catch (e) {
      console.error("Error loading schools:", e);
    } finally {
      setSchoolsLoading(false);
    }
    // Load all courses (no school filter) and all lessons initially
    try {
      await loadCoursesForSchool("all-school");
    } catch (e) {
      // ignore, already logged in helper
    }
    try {
      await loadLessons({});
    } catch (e) {
      // ignore, already logged in helper
    }
  };

  const handleConfirmClone = async () => {
    if (!cloneType || !cloneTargetId || !cloneName.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên.",
        variant: "destructive",
      });
      return;
    }
    setIsCloning(true);
    try {
      const body: any = { name: cloneName.trim() };
      if (cloneDescription.trim()) body.description = cloneDescription.trim();
      if (cloneLessonId && cloneLessonId !== "none")
        body.lesson_id = cloneLessonId;

      if (cloneType === "homework") {
        const res = await CloneHomework(cloneTargetId, body);
        if (res.code !== 200)
          throw new Error(res.message || res.error || "Clone homework failed");
        await queryClient.invalidateQueries({ queryKey: ["homeworks"] });
        toast({
          title: "Thành công",
          description: "Đã nhân bản bài tập về nhà.",
        });
      } else if (cloneType === "exam") {
        const res = await CloneExam(cloneTargetId, body);
        if (res.code !== 200)
          throw new Error(res.message || res.error || "Clone exam failed");
        await queryClient.invalidateQueries({ queryKey: ["exams"] });
        toast({
          title: "Thành công",
          description: "Đã nhân bản bài kiểm tra.",
        });
      } else if (cloneType === "exercise") {
        const res = await CloneExercise(cloneTargetId, body);
        if (res.code !== 200)
          throw new Error(res.message || res.error || "Clone exercise failed");
        await queryClient.invalidateQueries({ queryKey: ["exercises"] });
        toast({
          title: "Thành công",
          description: "Đã nhân bản bài luyện tập.",
        });
      }
      setCloneDialogOpen(false);
    } catch (e: any) {
      console.error("Clone error:", e);
      toast({
        title: "Lỗi",
        description: e?.message || "Không thể nhân bản.",
        variant: "destructive",
      });
    } finally {
      setIsCloning(false);
    }
  };

  // Helpers to load dependent dropdowns
  const loadCoursesForSchool = async (schoolId: string) => {
    try {
      setCoursesLoading(true);
      const res = await getListCourse({
        school_id: schoolId !== "all-school" ? schoolId : undefined,
      });
      const courses = res?.data?.courses || [];
      setCourseOptions([
        { value: "all-course", label: "Tất cả khóa học" },
        ...courses.map((c: any) => ({
          value: String(c.id),
          label: String(c.name),
        })),
      ]);
    } catch (e) {
      console.error("Error loading courses:", e);
    } finally {
      setCoursesLoading(false);
    }
  };

  const loadLessons = async (params: {
    school_id?: string;
    course_id?: string;
  }) => {
    try {
      setLoadingLessons(true);
      const res = await getListLesson(params);
      const lessons = res?.data?.lessons || [];
      const mapped = lessons.map((l: any) => ({
        id: String(l.id),
        title: String(l.title ?? l.name ?? l.id),
        chapter_name: l.chapter_name ? String(l.chapter_name) : undefined,
      }));
      setAvailableLessons(mapped);
    } catch (e) {
      console.error("Error loading lessons:", e);
    } finally {
      setLoadingLessons(false);
    }
  };

  const SearchableCombobox = ({
    options,
    value,
    onValueChange,
    placeholder,
    className,
    loading = false,
  }: {
    options: { value: string; label: string }[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder: string;
    className?: string;
    loading?: boolean;
  }) => {
    const [open, setOpen] = useState(false);
    const selectedOption = options.find((o) => o.value === value);
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between border-gray-200 bg-white hover:bg-gray-50",
              className
            )}
          >
            <span className="truncate">
              {loading
                ? t("loading")
                : selectedOption
                ? selectedOption.label
                : placeholder}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput
              placeholder={`Tìm kiếm ${placeholder.toLowerCase()}...`}
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>
                {loading ? t("loading") : t("noResults")}
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

  // Render loading state
  if (
    loading &&
    ((activeTab === "homework" && homeworks.length === 0) ||
      (activeTab === "all" && exams.length === 0))
  ) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse"></div>
                <div className="p-4 sm:p-6">
                  <div className="space-y-3 mb-4">
                    <div className="h-6 bg-gray-200 rounded-xl w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded-lg w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded-lg w-2/3 animate-pulse"></div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-20 bg-gray-200 rounded-xl animate-pulse"></div>
                    <div className="h-8 w-20 bg-gray-200 rounded-xl animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header Section - Mobile First */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col space-y-4 sm:space-y-6">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                {t("headerTitle")}
              </h1>
              <p className="text-gray-500 font-medium text-sm sm:text-base mt-1">
                {t("headerSubtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8">
            <p className="font-semibold">Đã xảy ra lỗi</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Tabs with integrated Search and Create Button */}
        <Tabs
          defaultValue="homework"
          value={activeTab}
          onValueChange={setActiveTab}
          className="mb-8 sm:mb-12"
        >
          <div className="flex flex-col xl:flex-row flex-wrap items-start xl:items-center justify-between mb-8 gap-4">
            <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 flex-1 w-full">
              <TabsList className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 md:py-7 gap-y-2 md:gap-y-0 flex flex-col md:flex-row items-start md:items-center justify-between h-fit md:h-3">
                <TabsTrigger
                  value="homework"
                  className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-green-200 rounded-xl px-6 py-3 font-medium transition-all duration-200 max-md:flex max-md:justify-start w-full md:w-auto"
                >
                  <LucideBookOpen className="h-4 w-4 mr-2" />
                  {t("tabHomework")}
                </TabsTrigger>

                {user?.type === "admin" && (
                  <TabsTrigger
                    value="exercise"
                    className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:border-purple-200 rounded-xl px-6 py-3 font-medium transition-all duration-200 max-md:flex max-md:justify-start w-full md:w-auto"
                  >
                    <LucideListChecks className="h-4 w-4 mr-2" />
                    {t("tabExercises")}
                  </TabsTrigger>
                )}

                {user?.type === "admin" && (
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 rounded-xl px-6 py-3 font-medium transition-all duration-200 max-md:flex max-md:justify-start w-full md:w-auto"
                  >
                    <LucideFileText className="h-4 w-4 mr-2" />
                    {t("tabExams")}
                  </TabsTrigger>
                )}

                {user?.type === "admin" && (
                  <TabsTrigger
                    value="assessment"
                    className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:border-orange-200 rounded-xl px-6 py-3 font-medium transition-all duration-200 max-md:flex max-md:justify-start w-full md:w-auto"
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    {t("tabAssessment")}
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Search Bar and Total Count */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-3 flex-1 w-full md:w-auto">
                <div className="relative flex-1 md:max-w-md w-full md:w-auto">
                  <LucideSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                  <Input
                    type="text"
                    placeholder={
                      activeTab === "homework"
                        ? t("searchHomeworkPlaceholder")
                        : activeTab === "exercise"
                        ? t("searchExercisePlaceholder")
                        : activeTab === "assessment"
                        ? t("searchAssessmentPlaceholder") 
                        : t("searchExamPlaceholder")
                    }
                    className="pl-11 sm:pl-12 pr-4 py-3 rounded-2xl border-0 bg-white shadow-sm focus:shadow-md transition-shadow text-gray-700 placeholder:text-gray-400 text-sm sm:text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Total Count Display */}
                {(() => {
                  let totalCount = 0;
                  let bgColor = "bg-blue-50";
                  let textColor = "text-blue-700";
                  let borderColor = "border-blue-200";

                  if (activeTab === "homework") {
                    totalCount = homeworksData?.total || 0;
                    bgColor = "bg-green-50";
                    textColor = "text-green-700";
                    borderColor = "border-green-200";
                  } else if (activeTab === "exercise") {
                    totalCount = exercisesData?.total || 0;
                    bgColor = "bg-purple-50";
                    textColor = "text-purple-700";
                    borderColor = "border-purple-200";
                  } else if (activeTab === "all") {
                    totalCount = examsData?.total || 0;
                    bgColor = "bg-blue-50";
                    textColor = "text-blue-700";
                    borderColor = "border-blue-200";
                  } else if (activeTab === "assessment") {
                    totalCount = assessmentData?.total || 0;
                    bgColor = "bg-orange-50";
                    textColor = "text-orange-700";
                    borderColor = "border-orange-200";
                  }

                  return (
                    <div
                      className={`inline-flex items-center gap-2 px-4 py-2 w-full md:w-auto ${bgColor} ${textColor} rounded-lg border ${borderColor}`}
                    >
                      <Info className="h-4 w-4" />
                      <span className="font-medium">
                        {t("total")}: {totalCount}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Create Button */}
            <Button
              className="w-full md:w-auto px-4 sm:px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm sm:text-base rounded-2xl"
              style={{
                backgroundColor: BRAND_COLORS.orange,
                color: "white",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#d97a1a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = BRAND_COLORS.orange;
              }}
              onClick={handleOpenCreateTypeDialog}
            >
              <LucidePlus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">{t("createNewFull")}</span>
              <span className="sm:hidden">{t("createNewShort")}</span>
            </Button>
          </div>

          <TabsContent value="homework">
            {/* Homework Cards */}
            {homeworksLoading ? (
              <div className="flex flex-wrap gap-6">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-pulse flex flex-col"
                  >
                    <div className="h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200"></div>
                    <div className="p-4 sm:p-6">
                      <div className="space-y-3 mb-4">
                        <div className="h-6 bg-gray-200 rounded-xl w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded-lg w-full"></div>
                        <div className="h-4 bg-gray-200 rounded-lg w-2/3"></div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                        <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 w-20 bg-gray-200 rounded-xl"></div>
                        <div className="h-8 w-20 bg-gray-200 rounded-xl"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : homeworks.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
                {homeworks.map((homework: any) => (
                  <div
                    key={homework.id}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor =
                        BRAND_COLORS.orange + "30";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "";
                    }}
                  >
                    {/* Content */}
                    <div className="p-4 sm:p-6 flex-1 flex flex-col">
                      {/* Header with title and status badges */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <LucideBookOpen className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
                              {homework.name}
                            </h3>
                            {/* Hiển thị object_title nếu có - responsive layout */}
                            {user?.type !== "student" &&
                              homework.object_title && (
                                <div className="mt-1">
                                  <Badge
                                    variant="outline"
                                    className="bg-emerald-100 text-emerald-600 border-emerald-200 text-xs font-medium py-0.5 px-2 rounded-full"
                                  >
                                    {homework.object_title}
                                  </Badge>
                                </div>
                              )}
                          </div>
                        </div>
                        {/* <div className="flex flex-col gap-2 ml-3">
                          <Badge
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              homework.is_assigned
                                ? "bg-blue-100 text-blue-700 border-blue-200"
                                : "bg-orange-100 text-orange-700 border-orange-200"
                            }`}
                          >
                            {homework.is_assigned
                              ? t("assigned")
                              : t("notAssigned")}
                          </Badge>
                        </div> */}
                      </div>

                      {/* Description */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {(homework.description || t("noDescription")) +
                            " " +
                            homework.id}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="space-y-3 mb-4 flex-1">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <LucideCalendar className="h-4 w-4 text-gray-400" />
                          <span className="truncate">
                            {formatTimestamp(
                              homework.created_at,
                              String(locale)
                            )}
                          </span>
                        </div>

                        {/* Total Questions - highlight */}
                        <div className="flex items-center gap-3 text-sm">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                            <LucideInfo className="h-4 w-4 mr-1 text-yellow-500" />
                            {homework.total_questions ?? 0} {t("questionsUnit")}
                          </span>
                        </div>

                        {/* {!homework.is_assigned && (
                          <div className="bg-orange-50 px-3 py-2 rounded-lg">
                            <div className="flex items-center gap-2 text-xs text-orange-600">
                              <LucideInfo className="h-3 w-3" />
                              <span>Cần giao bài</span>
                            </div>
                          </div>
                        )} */}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 mt-auto">
                        {user?.type === "admin" && (
                          <>
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl border-gray-200 hover:border-green-300 hover:bg-green-50 hover:text-green-600 flex-1 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    getEditHomeworkRoute(user, homework.id)
                                  );
                                }}
                              >
                                <LucideEdit className="h-3 w-3 mr-1" />
                                {t("edit")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl border-blue-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 flex-1 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCloneDialog(
                                    "homework",
                                    homework.id,
                                    homework.name,
                                    homework.description
                                  );
                                }}
                              >
                                {t("clone")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl border-red-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 text-red-500 flex-1 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setHomeworkToDelete(homework);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <LucideTrash2 className="h-3 w-3 mr-1" />
                                {t("delete")}
                              </Button>
                            </div>

                            <div className="w-full">
                              <Button
                                size="sm"
                                className="w-full font-semibold rounded-xl bg-blue-500 text-white hover:bg-blue-700 text-xs flex items-center justify-center"
                                style={{ boxShadow: "0 2px 8px 0 #2563eb22" }}
                                onClick={() =>
                                  window.open(
                                    doHomeworkWithLessonIdRoute(
                                      user,
                                      homework.id,
                                      homework.lesson_id
                                    ),
                                    "_blank"
                                  )
                                }
                              >
                                <LucideEye className="h-4 w-4 mr-1" />
                                {t("studentView")}
                              </Button>
                            </div>
                          </>
                        )}

                        {user?.type === "teacher" && (
                          <Button
                            size="sm"
                            className="w-full font-semibold rounded-xl bg-blue-500 text-white hover:bg-blue-700 text-xs flex items-center justify-center"
                            style={{
                              boxShadow: "0 2px 8px 0 #2563eb22",
                              marginTop: 0,
                            }}
                            onClick={() =>
                              window.open(
                                doHomeworkWithLessonIdRoute(
                                  user,
                                  homework.id,
                                  homework.lesson_id
                                ),
                                "_blank"
                              )
                            }
                          >
                            <LucideEye className="h-4 w-4 mr-1" />
                            {t("studentView")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 sm:py-20 px-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <LucideBookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-green-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  {t("noHomeworksTitle")}
                </h3>
                <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base max-w-md mx-auto">
                  {t("noHomeworksSubtitle")}
                </p>
                <Button
                  className="px-6 py-3 text-sm sm:text-base rounded-2xl"
                  style={{
                    backgroundColor: BRAND_COLORS.orange,
                    color: "white",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#d97a1a";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = BRAND_COLORS.orange;
                  }}
                  onClick={handleCreateHomework}
                >
                  <LucidePlus className="h-4 w-4 mr-2" />
                  {t("createHomeworkCta")}
                </Button>
              </div>
            )}

            {/* Professional Pagination */}
            {homeworks.length > 0 && (
              <ProfessionalPagination
                currentPage={homeworkFilters.page || 1}
                totalPages={homeworksTotalPages}
                totalCount={homeworksData?.total || 0}
                pageSize={homeworkPageSize}
                onPageChange={handleHomeworkPageChange}
                onPageSizeChange={handleHomeworkPageSizeChange}
                pageSizeOptions={[6, 12, 20, 40, 60]}
                showPageSizeSelector={true}
                showPaginationInfo={true}
                itemName="bài tập về nhà"
              />
            )}
          </TabsContent>

          <TabsContent value="all">
            {/* Exam Cards */}
            {loading ? (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse flex flex-col"
                  >
                    <div className="p-4 sm:p-6">
                      {/* Header skeleton */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                          <div className="flex-1">
                            <div className="h-6 bg-gray-200 rounded-xl w-3/4 mb-1"></div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-3">
                          <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                          <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                        </div>
                      </div>

                      {/* Description skeleton */}
                      <div className="space-y-2 mb-4">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>

                      {/* Stats skeleton */}
                      <div className="space-y-3 mb-4">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>

                      {/* Actions skeleton */}
                      <div className="flex gap-2">
                        <div className="h-8 w-20 bg-gray-200 rounded-xl"></div>
                        <div className="h-8 w-20 bg-gray-200 rounded-xl"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : exams.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
                {exams.map((exam: any) => (
                  <div
                    key={exam.id}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col h-full"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor =
                        BRAND_COLORS.orange + "30";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "";
                    }}
                  >
                    {/* Content */}
                    <div className="p-4 sm:p-6 flex-1 flex flex-col">
                      {/* Header with title and status badges */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <LucideFileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
                              {exam.name}
                            </h3>
                            {/* Hiển thị object_title nếu có - responsive layout */}
                            {user?.type !== "student" && exam.object_title && (
                              <div className="mt-1">
                                <Badge
                                  variant="outline"
                                  className="bg-emerald-100 text-emerald-600 border-emerald-200 text-xs font-medium py-0.5 px-2 rounded-full"
                                >
                                  {exam.object_title}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Description */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {(exam.description || t("noDescription")) +
                            " " +
                            exam.id}
                        </p>
                      </div>

                      {/* Stats Grid */}
                      <div className="space-y-3 mb-4 flex-1">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <LucideCalendar className="h-4 w-4 text-gray-400" />
                          <span className="truncate">
                            {formatTimestamp(exam.created_at, String(locale))}
                          </span>
                        </div>

                        {exam.deadline && (
                          <div className="flex items-center gap-3 text-sm text-red-600">
                            <LucideClock className="h-4 w-4 text-red-400" />
                            <span className="truncate">
                              {formatDeadline(exam.deadline, String(locale))}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <LucideClock className="h-4 w-4 text-gray-400" />
                          <span>
                            {exam.time_limit} {t("minutesUnit")}
                          </span>
                        </div>

                        {/* Total Questions */}
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <LucideInfo className="h-4 w-4 text-gray-400" />
                          <span>
                            {exam.total_questions ?? 0} {t("questionsUnit")}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 mt-auto">
                        {user?.type === "admin" && (
                          <>
                            {/* Hàng trên: Sửa và Xóa */}
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl border-gray-200 hover:border-green-300 hover:bg-green-50 hover:text-green-600 flex-1 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    getEditAssignmentRoute(user, exam.id)
                                  );
                                }}
                              >
                                <LucideEdit className="h-3 w-3 mr-1" />
                                {t("edit")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl border-blue-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 flex-1 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCloneDialog(
                                    "exam",
                                    exam.id,
                                    exam.name,
                                    exam.description
                                  );
                                }}
                              >
                                {t("clone")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl border-red-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 text-red-500 flex-1 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExamToDelete(exam);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <LucideTrash2 className="h-3 w-3 mr-1" />
                                {t("delete")}
                              </Button>
                            </div>

                            <div className="w-full">
                              <Button
                                size="sm"
                                className="w-full font-semibold rounded-xl bg-blue-500 text-white hover:bg-blue-700 text-xs flex items-center justify-center"
                                style={{ boxShadow: "0 2px 8px 0 #2563eb22" }}
                                onClick={() =>
                                  window.open(
                                    doExamWithLessonIdRoute(
                                      user,
                                      exam.id,
                                      exam.lesson_id
                                    ),
                                    "_blank"
                                  )
                                }
                              >
                                <LucideEye className="h-4 w-4 mr-1" />
                                {t("studentView")}
                              </Button>
                            </div>
                          </>
                        )}

                        {user?.type === "teacher" && (
                          <Button
                            size="sm"
                            className="w-full font-semibold rounded-xl bg-blue-500 text-white hover:bg-blue-700 text-xs flex items-center justify-center"
                            style={{
                              boxShadow: "0 2px 8px 0 #2563eb22",
                              marginTop: 0,
                            }}
                            onClick={() =>
                              window.open(
                                doExamWithLessonIdRoute(
                                  user,
                                  exam.id,
                                  exam.lesson_id
                                ),
                                "_blank"
                              )
                            }
                          >
                            <LucideEye className="h-4 w-4 mr-1" />
                            {t("studentView")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 sm:py-20 px-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <LucideFileText className="h-10 w-10 sm:h-12 sm:w-12 text-blue-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  {t("noExamsTitle")}
                </h3>
                <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base max-w-md mx-auto">
                  {t("noExamsSubtitle")}
                </p>
                <Button
                  className="px-6 py-3 text-sm sm:text-base rounded-2xl"
                  style={{
                    backgroundColor: BRAND_COLORS.orange,
                    color: "white",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#d97a1a";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = BRAND_COLORS.orange;
                  }}
                  onClick={handleOpenCreateTypeDialog}
                >
                  <LucidePlus className="h-4 w-4 mr-2" />
                  {t("createExamCta")}
                </Button>
              </div>
            )}

            {/* Professional Pagination */}
            {exams.length > 0 && (
              <ProfessionalPagination
                currentPage={filters.page || 1}
                totalPages={totalPages}
                totalCount={examsData?.total || 0}
                pageSize={examPageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handleExamPageSizeChange}
                pageSizeOptions={[6, 12, 20, 40, 60]}
                showPageSizeSelector={true}
                showPaginationInfo={true}
                itemName="bài kiểm tra"
              />
            )}
          </TabsContent>

          <TabsContent value="exercise">
            {/* Exercise Cards - same UI as Exam */}
            {exercisesLoading ? (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse flex flex-col"
                  >
                    <div className="p-4 sm:p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                          <div className="flex-1">
                            <div className="h-6 bg-gray-200 rounded-xl w-3/4 mb-1"></div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-3">
                          <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                          <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                      <div className="space-y-3 mb-4">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 w-20 bg-gray-200 rounded-xl"></div>
                        <div className="h-8 w-20 bg-gray-200 rounded-xl"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : exerciseList.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
                {exerciseList.map((exercise: any) => (
                  <div
                    key={exercise.id}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col h-full"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor =
                        BRAND_COLORS.orange + "30";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "";
                    }}
                  >
                    <div className="p-4 sm:p-6 flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <LucideListChecks className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
                              {exercise.name}
                            </h3>
                            {user?.type !== "student" &&
                              exercise.object_title && (
                                <div className="mt-1">
                                  <Badge
                                    variant="outline"
                                    className="bg-purple-100 text-purple-700 border-purple-200 text-xs font-medium py-0.5 px-2 rounded-full"
                                  >
                                    {exercise.object_title}
                                  </Badge>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {(exercise.description || t("noDescription")) +
                            " " +
                            exercise.id}
                        </p>
                      </div>
                      <div className="space-y-3 mb-4 flex-1">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <LucideCalendar className="h-4 w-4 text-gray-400" />
                          <span className="truncate">
                            {formatTimestamp(
                              exercise.created_at,
                              String(locale)
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <LucideInfo className="h-4 w-4 text-gray-400" />
                          <span>
                            {exercise.total_questions ?? 0} {t("questionsUnit")}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 mt-auto">
                        {user?.type === "admin" && (
                          <>
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl border-gray-200 hover:border-green-300 hover:bg-green-50 hover:text-green-600 flex-1 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    getEditExerciseRoute(user, exercise.id)
                                  );
                                }}
                              >
                                <LucideEdit className="h-3 w-3 mr-1" />
                                {t("edit")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl border-blue-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 flex-1 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCloneDialog(
                                    "exercise",
                                    exercise.id,
                                    exercise.name,
                                    exercise.description
                                  );
                                }}
                              >
                                {t("clone")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl border-red-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 text-red-500 flex-1 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExerciseToDelete(exercise);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <LucideTrash2 className="h-3 w-3 mr-1" />
                                {t("delete")}
                              </Button>
                            </div>
                            <div className="w-full">
                              <Button
                                size="sm"
                                className="w-full font-semibold rounded-xl bg-blue-500 text-white hover:bg-blue-700 text-xs flex items-center justify-center"
                                style={{ boxShadow: "0 2px 8px 0 #2563eb22" }}
                                onClick={() =>
                                  window.open(
                                    doExerciseWithLessonIdRoute(
                                      user,
                                      exercise.id,
                                      exercise.lesson_id
                                    ),
                                    "_blank"
                                  )
                                }
                              >
                                <LucideEye className="h-4 w-4 mr-1" />
                                {t("studentView")}
                              </Button>
                            </div>
                          </>
                        )}
                        {user?.type === "teacher" && (
                          <Button
                            size="sm"
                            className="w-full font-semibold rounded-xl bg-blue-500 text-white hover:bg-blue-700 text-xs flex items-center justify-center"
                            style={{
                              boxShadow: "0 2px 8px 0 #2563eb22",
                              marginTop: 0,
                            }}
                            onClick={() =>
                              window.open(
                                doExerciseWithLessonIdRoute(
                                  user,
                                  exercise.id,
                                  exercise.lesson_id
                                ),
                                "_blank"
                              )
                            }
                          >
                            <LucideEye className="h-4 w-4 mr-1" />
                            {t("studentView")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : exercisesError ? (
              <div className="text-center py-16 sm:py-20 px-4 text-red-600">
                {t("cannotLoadExamList")}
              </div>
            ) : (
              <div className="text-center py-16 sm:py-20 px-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <LucideListChecks className="h-10 w-10 sm:h-12 sm:w-12 text-purple-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  {t("noExercisesTitle")}
                </h3>
                <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base max-w-md mx-auto">
                  {t("noExercisesSubtitle")}
                </p>
              </div>
            )}

            {exerciseList.length > 0 && (
              <ProfessionalPagination
                currentPage={exerciseFilters.page}
                totalPages={exerciseTotalPages}
                totalCount={exercisesData?.total || 0}
                pageSize={exercisePageSize}
                onPageChange={handleExercisePageChange}
                onPageSizeChange={handleExercisePageSizeChange}
                pageSizeOptions={[6, 12, 20, 40, 60]}
                showPageSizeSelector={true}
                showPaginationInfo={true}
                itemName="bài luyện tập"
              />
            )}
          </TabsContent>

          <TabsContent value="assessment">
            {/* Assessment Cards */}
            {assessmentLoading ? (
              <div className="flex flex-wrap gap-6">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-pulse flex flex-col"
                  >
                    <div className="h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200"></div>
                    <div className="p-4 sm:p-6">
                      <div className="space-y-3 mb-4">
                        <div className="h-6 bg-gray-200 rounded-xl w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded-lg w-full"></div>
                        <div className="h-4 bg-gray-200 rounded-lg w-2/3"></div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                        <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 w-20 bg-gray-200 rounded-xl"></div>
                        <div className="h-8 w-20 bg-gray-200 rounded-xl"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : assessment.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
                {assessment.map((assessment: any) => (
                  <div
                    key={assessment.id}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor =
                        BRAND_COLORS.orange + "30";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "";
                    }}
                  >
                    {/* Content */}
                    <div className="p-4 sm:p-6 flex-1 flex flex-col">
                      {/* Header with title and status badges */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <LucideBookOpen className="h-5 w-5 text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
                              {assessment.name}
                            </h3>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {(assessment.description || t("noDescription")) +
                            " " +
                            assessment.id}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="space-y-3 mb-4 flex-1">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <LucideCalendar className="h-4 w-4 text-gray-400" />
                          <span className="truncate">
                            {formatTimestamp(
                              assessment.created_at,
                              String(locale)
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <LucideBookOpen className="h-4 w-4 text-gray-400" />
                          <span>
                            {assessment.type === "mini_test"
                              ? "Bài kiểm tra tháng"
                              : assessment.type === "final_exam"
                              ? "Bài kiểm tra cuối kỳ"
                              : assessment.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <SlidersHorizontal className="h-4 w-4 text-gray-400" />
                          <span>
                            {assessment.assessment_criteria_group_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <ClipboardList className="h-4 w-4 text-gray-400" />
                          <span>
                            {assessment.study_report_criteria_name}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 mt-auto">
                        {user?.type === "admin" && (
                          <>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl border-gray-200 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 flex-1 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    getEditAssessmentRoute(user, assessment.id)
                                  );
                                }}
                              >
                                <LucideEdit className="h-3 w-3 mr-1" />
                                {t("edit")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl border-red-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 text-red-500 flex-1 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAssessmentToDelete(assessment);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <LucideTrash2 className="h-3 w-3 mr-1" />
                                {t("delete")}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 sm:py-20 px-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <LucideBookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-green-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  {t("noAssessmentTitle")}
                </h3>
                <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base max-w-md mx-auto">
                  {t("noAssessmentSubtitle")}
                </p>
                <Button
                  className="px-6 py-3 text-sm sm:text-base rounded-2xl"
                  style={{
                    backgroundColor: BRAND_COLORS.orange,
                    color: "white",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#d97a1a";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = BRAND_COLORS.orange;
                  }}
                  onClick={handleCreateAssessment}
                >
                  <LucidePlus className="h-4 w-4 mr-2" />
                  {t("createAssessmentCta")}
                </Button>
              </div>
            )}

            {/* Professional Pagination */}
            {assessment.length > 0 && (
              <ProfessionalPagination
                currentPage={assessmentFilters.page || 1}
                totalPages={assessmentTotalPages}
                totalCount={assessmentData?.total || 0}
                pageSize={assessmentPageSize}
                onPageChange={handleAssessmentPageChange}
                onPageSizeChange={handleAssessmentPageSizeChange}
                pageSizeOptions={[6, 12, 20, 40, 60]}
                showPageSizeSelector={true}
                showPaginationInfo={true}
                itemName="bài kiểm tra đánh giá"
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Clone Dialog */}
        <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl border-0 shadow-xl">
            <DialogHeader className="pb-4 border-b border-gray-100">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {cloneType === "exam"
                  ? t("cloneExamTitle")
                  : t("cloneHomeworkTitle")}
              </DialogTitle>
              <DialogDescription className="text-gray-500">
                {t("cloneDescription")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("nameLabel")}
                </label>
                <Input
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  placeholder={t("enterName")}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("descriptionLabel")}
                </label>
                <Textarea
                  value={cloneDescription}
                  onChange={(e) => setCloneDescription(e.target.value)}
                  placeholder={t("enterDescription")}
                />
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {t("schoolLabel")}
                  </label>
                  <SearchableCombobox
                    options={schoolOptions}
                    value={cloneSchoolId}
                    onValueChange={async (val) => {
                      setCloneSchoolId(val);
                      setCloneCourseId("all-course");
                      setCloneLessonId("none");
                      await loadCoursesForSchool(val);
                      await loadLessons({
                        school_id: val !== "all-school" ? val : undefined,
                      });
                    }}
                    placeholder={t("selectSchool")}
                    loading={schoolsLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {t("courseLabel")}
                  </label>
                  <SearchableCombobox
                    options={courseOptions}
                    value={cloneCourseId}
                    onValueChange={async (val) => {
                      setCloneCourseId(val);
                      setCloneLessonId("none");
                      await loadLessons({
                        school_id:
                          cloneSchoolId !== "all-school"
                            ? cloneSchoolId
                            : undefined,
                        course_id: val !== "all-course" ? val : undefined,
                      });
                    }}
                    placeholder={t("selectCourse")}
                    loading={coursesLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {t("lessonOptionalLabel")}
                  </label>
                  <SearchableCombobox
                    options={[
                      { value: "none", label: t("noLessonSelected") },
                      ...availableLessons.map((l) => ({
                        value: l.id,
                        label: l.chapter_name
                          ? `${l.title} - ${l.chapter_name}`
                          : l.title,
                      })),
                    ]}
                    value={cloneLessonId}
                    onValueChange={(val) => setCloneLessonId(val)}
                    placeholder={t("selectLesson")}
                    loading={loadingLessons}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => setCloneDialogOpen(false)}
                disabled={isCloning}
              >
                {t("cancel")}
              </Button>
              <Button
                className="rounded-2xl"
                onClick={handleConfirmClone}
                disabled={isCloning}
              >
                {isCloning ? (
                  <>
                    <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("cloning")}
                  </>
                ) : (
                  t("confirm")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Type Dialog */}
        <Dialog
          open={createTypeDialogOpen}
          onOpenChange={setCreateTypeDialogOpen}
        >
          <DialogContent className="sm:max-w-md rounded-3xl border-0 shadow-xl">
            <DialogHeader className="pb-4 border-b border-gray-100">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {t("chooseCreateTypeTitle")}
              </DialogTitle>
              <DialogDescription className="text-gray-500">
                {t("chooseCreateTypeDescription")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-6">
              {user?.type === "admin" && (
                <Button
                  className="flex items-center gap-4 h-auto py-6 px-6 text-white rounded-2xl transition-all duration-200"
                  style={{
                    backgroundColor: "#2b40c7ff",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#142596ff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#2b40c7ff";
                  }}
                  onClick={handleCreateExam}
                  disabled={isCreatingExam}
                >
                  {isCreatingExam ? (
                    <>
                      <div className="hidden w-12 h-12 bg-blue-700 rounded-2xl sm:flex items-center justify-center">
                        <LucideLoader2 className="h-6 w-6 animate-spin" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">{t("redirecting")}</div>
                        <div className="text-sm text-blue-100">
                          {t("pleaseWait")}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="hidden w-12 h-12 bg-blue-700 rounded-2xl sm:flex items-center justify-center">
                        <LucideFileText className="h-6 w-6" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">
                          {t("createExamTitle")}
                        </div>
                        <div className="text-sm text-blue-100">
                          {t("createExamSubtitle")}
                        </div>
                      </div>
                    </>
                  )}
                </Button>
              )}
              <Button
                className="flex items-center gap-4 h-auto py-6 px-6 bg-green-600 hover:bg-green-700 text-white rounded-2xl transition-all duration-200"
                onClick={handleCreateHomework}
                disabled={isCreatingHomework}
              >
                {isCreatingHomework ? (
                  <>
                    <div className="hidden w-12 h-12 bg-green-700 rounded-2xl sm:flex items-center justify-center">
                      <LucideLoader2 className="h-6 w-6 animate-spin" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{t("redirecting")}</div>
                      <div className="text-sm text-green-100">
                        {t("pleaseWait")}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="hidden w-12 h-12 bg-green-700 rounded-2xl sm:flex items-center justify-center">
                      <LucideBookOpen className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">
                        {t("createHomeworkTitle")}
                      </div>
                      <div className="text-sm text-green-100">
                        {t("createHomeworkSubtitle")}
                      </div>
                    </div>
                  </>
                )}
              </Button>
              {user?.type === "admin" && (
                <Button
                  className="flex items-center gap-4 h-auto py-6 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl transition-all duration-200"
                  onClick={handleCreateExercise}
                  disabled={isCreatingExercise}
                >
                  {isCreatingExercise ? (
                    <>
                      <div className="hidden w-12 h-12 bg-purple-700 rounded-2xl sm:flex items-center justify-center">
                        <LucideLoader2 className="h-6 w-6 animate-spin" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">{t("redirecting")}</div>
                        <div className="text-sm text-purple-100">
                          {t("pleaseWait")}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="hidden w-12 h-12 bg-purple-700 rounded-2xl sm:flex items-center justify-center">
                        <LucideListChecks className="h-6 w-6" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">
                          {t("createExerciseTitle")}
                        </div>
                        <div className="text-sm text-purple-100">
                          {t("createExerciseSubtitle")}
                        </div>
                      </div>
                    </>
                  )}
                </Button>
              )}
              {user?.type === "admin" && (
                <Button
                  className="flex items-center gap-4 h-auto py-6 px-6 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl transition-all duration-200"
                  onClick={handleCreateAssessment}
                  disabled={isCreatingAssessment}
                >
                  {isCreatingAssessment ? (
                    <>
                      <div className="hidden w-12 h-12 bg-orange-700 rounded-2xl sm:flex items-center justify-center">
                        <LucideLoader2 className="h-6 w-6 animate-spin" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">{t("redirecting")}</div>
                        <div className="text-sm text-orange-100">
                          {t("pleaseWait")}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="hidden w-12 h-12 bg-orange-700 rounded-2xl sm:flex items-center justify-center">
                        <LucideListChecks className="h-6 w-6" />
                      </div>
                      <div className="text-left whitespace-pre-line">
                        <div className="font-semibold">
                          {t("createAssessmentTitle")}
                        </div>
                        <div className="text-sm text-orange-100">
                          {t("createAssessmentSubtitle")}
                        </div>
                      </div>
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl border-0 shadow-xl">
            <DialogHeader className="pb-4 border-b border-gray-100">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {t("confirmDelete")}
              </DialogTitle>
              <DialogDescription className="text-gray-500 mt-2">
                {examToDelete && (
                  <>
                    {t("deleteExamConfirm", { name: examToDelete.name })}
                    <br />
                    <span className="text-red-500 text-sm">
                      {t("irreversible")}
                    </span>
                  </>
                )}
                {homeworkToDelete && (
                  <>
                    {t("deleteHomeworkConfirm", {
                      name: homeworkToDelete.name,
                    })}
                    <br />
                    <span className="text-red-500 text-sm">
                      {t("irreversible")}
                    </span>
                  </>
                )}
                {assessmentToDelete && (
                  <>
                    {t("deleteAssessmentConfirm", {
                      name: assessmentToDelete.name,
                    })}
                    <br />
                    <span className="text-red-500 text-sm">
                      {t("irreversible")}
                    </span>
                  </>
                )}
                {exerciseToDelete && (
                  <>
                    {t("deleteExerciseConfirm", {
                      name: exerciseToDelete.name,
                    })}
                    <br />
                    <span className="text-red-500 text-sm">
                      {t("irreversible")}
                    </span>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-4">
              <Button
                className="bg-red-600 hover:bg-red-700 text-white rounded-2xl"
                onClick={
                  examToDelete
                    ? handleDeleteExam
                    : homeworkToDelete
                    ? handleDeleteHomework
                    : assessmentToDelete
                    ? handleDeleteAssessment
                    : handleDeleteExercise
                }
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("deleting")}
                  </>
                ) : examToDelete ? (
                  t("deleteExam")
                ) : homeworkToDelete ? (
                  t("deleteHomework")
                ) : assessmentToDelete ? (
                  t("deleteAssessment")
                ) : (
                  t("deleteExercise")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
