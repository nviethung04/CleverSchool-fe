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
import { useRouter } from "next/navigation";
import {
  GetHomeworkList,
  DeleteHomework,
  type Homework,
  type HomeworkFilters,
} from "@/lib/api/homeworks";
import { useExamsQuery } from "@/hooks/use-exams-query";
import { useHomeworksQuery } from "@/hooks/use-homeworks-query";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/context/auth-context";
import {
  getCreateAssignmentRoute,
  getCreateHomeworkRoute,
  getEditAssignmentRoute,
  getEditHomeworkRoute,
  doHomeworkRoute,
  doExamRoute,
} from "@/lib/utils/route-utils";
import { useDebounce } from "@/hooks/use-debounce";
import { BRAND_COLORS } from "@/lib/constants/colors";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getListLesson,
  getListSchool,
  getListCourse,
} from "@/lib/api/dashboard";
import { CloneExam, CloneHomework } from "@/lib/api/clones";
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

// Utility function to format Unix timestamp to readable date
const formatTimestamp = (timestamp: string | number): string => {
  if (!timestamp) return "Chưa có thông tin";

  // Convert to number if it's a string
  const numericTimestamp =
    typeof timestamp === "string" ? Number.parseInt(timestamp) : timestamp;

  // Create date object from Unix timestamp (multiply by 1000 to convert to milliseconds)
  const date = new Date(numericTimestamp * 1000);

  // Check if date is valid
  if (isNaN(date.getTime())) return "Ngày không hợp lệ";

  // Format date to Vietnamese locale
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Utility function to format deadline with time
const formatDeadline = (timestamp: string | number): string => {
  if (!timestamp) return "";

  const numericTimestamp =
    typeof timestamp === "string" ? Number.parseInt(timestamp) : timestamp;
  const date = new Date(numericTimestamp * 1000);

  if (isNaN(date.getTime())) return "";

  return date.toLocaleDateString("vi-VN", {
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createTypeDialogOpen, setCreateTypeDialogOpen] = useState(false);
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [isCreatingHomework, setIsCreatingHomework] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [cloneType, setCloneType] = useState<"homework" | "exam" | null>(null);
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
  >([{ value: "all-school", label: "Tất cả trường" }]);
  const [courseOptions, setCourseOptions] = useState<
    { value: string; label: string }[]
  >([{ value: "all-course", label: "Tất cả khóa học" }]);
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
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  // React Query hooks
  const {
    data: examsData,
    isLoading: examsLoading,
    error: examsError,
  } = useExamsQuery({
    ...filters,
    keyword:
      activeTab === "all" && debouncedSearchTerm
        ? debouncedSearchTerm
        : undefined,
  }) as {
    data: { exams: any[]; totalPages: number } | undefined;
    isLoading: boolean;
    error: any;
  };
  const {
    data: homeworksData,
    isLoading: homeworksLoading,
    error: homeworksError,
  } = useHomeworksQuery({
    ...homeworkFilters,
    keyword:
      activeTab === "homework" && debouncedSearchTerm
        ? debouncedSearchTerm
        : undefined,
  }) as {
    data: { homeworks: any[]; totalPages: number } | undefined;
    isLoading: boolean;
    error: any;
  };

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
          title: "Lỗi",
          description: "Không thể tải dữ liệu ban đầu. Vui lòng thử lại sau.",
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

  // Use loading and error states from React Query based on active tab
  const loading = activeTab === "homework" ? homeworksLoading : examsLoading;
  const error =
    activeTab === "homework"
      ? homeworksError
        ? "Không thể tải danh sách bài tập về nhà. Vui lòng thử lại sau."
        : null
      : examsError
        ? "Không thể tải danh sách bài kiểm tra. Vui lòng thử lại sau."
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
        title: "Thành công",
        description: "Đã xóa bài kiểm tra thành công.",
      });
    } catch (err) {
      console.error("Error deleting exam:", err);
      toast({
        title: "Lỗi",
        description: "Không thể xóa bài kiểm tra. Vui lòng thử lại sau.",
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
        title: "Thành công",
        description: "Đã xóa bài tập về nhà thành công.",
      });
    } catch (err) {
      console.error("Error deleting homework:", err);
      toast({
        title: "Lỗi",
        description: "Không thể xóa bài tập về nhà. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setHomeworkToDelete(null);
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

    window.open(getCreateAssignmentRoute(user), "_blank");

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

    window.open(getCreateHomeworkRoute(user), "_blank");

    setTimeout(() => {
      setIsCreatingHomework(false);
    }, 500);
  };

  // Clone handlers
  const openCloneDialog = async (
    type: "homework" | "exam",
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
      } else {
        const res = await CloneExam(cloneTargetId, body);
        if (res.code !== 200)
          throw new Error(res.message || res.error || "Clone exam failed");
        await queryClient.invalidateQueries({ queryKey: ["exams"] });
        toast({
          title: "Thành công",
          description: "Đã nhân bản bài kiểm tra.",
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
                ? "Đang tải..."
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
                {loading ? "Đang tải..." : "Không tìm thấy kết quả."}
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
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header Section - Mobile First */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col space-y-4 sm:space-y-6">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Quản lý bài tập & kiểm tra
              </h1>
              <p className="text-gray-500 font-medium text-sm sm:text-base mt-1">
                Tạo và quản lý bài tập về nhà, bài kiểm tra cho học sinh
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
              <TabsList className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 py-7">
                <TabsTrigger
                  value="homework"
                  className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-green-200 rounded-xl px-6 py-3 font-medium transition-all duration-200"
                >
                  <LucideBookOpen className="h-4 w-4 mr-2" />
                  Bài tập về nhà
                </TabsTrigger>
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 rounded-xl px-6 py-3 font-medium transition-all duration-200"
                >
                  <LucideFileText className="h-4 w-4 mr-2" />
                  Bài kiểm tra
                </TabsTrigger>
              </TabsList>

              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <LucideSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                <Input
                  type="text"
                  placeholder={
                    activeTab === "homework"
                      ? "Tìm kiếm bài tập về nhà..."
                      : "Tìm kiếm bài kiểm tra..."
                  }
                  className="pl-11 sm:pl-12 pr-4 py-3 rounded-2xl border-0 bg-white shadow-sm focus:shadow-md transition-shadow text-gray-700 placeholder:text-gray-400 text-sm sm:text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Create Button */}
            <Button
              className="w-full sm:w-auto px-4 sm:px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm sm:text-base rounded-2xl"
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
              <span className="hidden sm:inline">Tạo mới</span>
              <span className="sm:hidden">Tạo</span>
            </Button>
          </div>

          <TabsContent value="homework">
            {/* Homework Cards */}
            {homeworksLoading ? (
              <div className="flex flex-wrap gap-6">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-pulse flex flex-col w-[360px] min-h-[320px]"
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
              <div className="flex flex-wrap gap-6">
                {homeworks.map((homework: any) => (
                  <div
                    key={homework.id}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col w-[360px] min-h-[280px]"
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
                            {/* Hiển thị object_title nếu có - chỉ cho non-student users */}
                            {user?.type !== "student" && (
                              <Badge
                                variant="outline"
                                className="bg-emerald-100 text-emerald-600 border-emerald-200 text-xs font-medium py-0.5 px-2 rounded-full mt-1"
                              >
                                {homework.object_title || "XXX"}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-3">
                          <Badge
                            className={`px-2 py-1 rounded-full text-xs font-medium ${homework.is_assigned
                                ? "bg-blue-100 text-blue-700 border-blue-200"
                                : "bg-orange-100 text-orange-700 border-orange-200"
                              }`}
                          >
                            {homework.is_assigned
                              ? "Đã giao bài"
                              : "Chưa giao bài"}
                          </Badge>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {(homework.description || "Không có mô tả") +
                            " " +
                            homework.id}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="space-y-3 mb-4 flex-1">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <LucideCalendar className="h-4 w-4 text-gray-400" />
                          <span className="truncate">
                            {formatTimestamp(homework.created_at)}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <LucideBookOpen className="h-4 w-4 text-gray-400" />
                          <span>{homework.max_score} điểm</span>
                        </div>
                        {/* Total Questions - highlight */}
                        <div className="flex items-center gap-3 text-sm">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                            <LucideInfo className="h-4 w-4 mr-1 text-yellow-500" />
                            {homework.total_questions ?? 0} câu hỏi
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
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl border-gray-200 hover:border-green-300 hover:bg-green-50 hover:text-green-600 flex-1 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(
                                    getEditHomeworkRoute(user, homework.id),
                                    "_blank"
                                  );
                                }}
                              >
                                <LucideEdit className="h-3 w-3 mr-1" />
                                Sửa
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
                                Nhân bản
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
                                Xóa
                              </Button>
                            </div>

                            <div className="w-full">
                              <Button
                                size="sm"
                                className="w-full font-semibold rounded-xl bg-blue-500 text-white hover:bg-blue-700 text-xs flex items-center justify-center"
                                style={{ boxShadow: "0 2px 8px 0 #2563eb22" }}
                                onClick={() =>
                                  window.open(
                                    doHomeworkRoute(user, homework.id),
                                    "_blank"
                                  )
                                }
                              >
                                <LucideEye className="h-4 w-4 mr-1" />
                                Chế độ làm bài của học sinh
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
                                doHomeworkRoute(user, homework.id),
                                "_blank"
                              )
                            }
                          >
                            <LucideEye className="h-4 w-4 mr-1" />
                            Chế độ làm bài của học sinh
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
                  Không có bài tập về nhà nào
                </h3>
                <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base max-w-md mx-auto">
                  Bạn chưa có bài tập về nhà nào. Hãy tạo bài tập về nhà mới để
                  bắt đầu.
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
                  Tạo bài tập về nhà mới
                </Button>
              </div>
            )}

            {/* Pagination */}
            {homeworks.length > 0 && (
              <div className="flex justify-center mt-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl hover:bg-gray-50 hover:border-gray-300"
                      onClick={() =>
                        handleHomeworkPageChange(homeworkFilters.page! - 1)
                      }
                      disabled={homeworkFilters.page === 1}
                    >
                      Trước
                    </Button>
                    <span className="text-sm font-medium text-gray-700 px-3">
                      Trang {homeworkFilters.page} / {homeworksTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl hover:bg-gray-50 hover:border-gray-300"
                      onClick={() =>
                        handleHomeworkPageChange(homeworkFilters.page! + 1)
                      }
                      disabled={homeworkFilters.page === homeworksTotalPages}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="all">
            {/* Exam Cards */}
            {loading ? (
              <div className="flex flex-wrap gap-6">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse flex flex-col w-[360px] min-h-[320px]"
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
              <div className="flex flex-wrap gap-6">
                {exams.map((exam: any) => (
                  <div
                    key={exam.id}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col h-full w-[360px] min-h-[350px]"
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
                            {/* Hiển thị object_title nếu có - chỉ cho non-student users */}
                            {user?.type !== "student" && (
                              <Badge
                                variant="outline"
                                className="bg-emerald-100 text-emerald-600 border-emerald-200 text-xs font-medium py-0.5 px-2 rounded-full mt-1"
                              >
                                {exam.object_title || "XXX"}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-3">
                          <Badge
                            className={`px-2 py-1 rounded-full text-xs font-medium ${exam.is_assigned
                                ? "bg-blue-100 text-blue-700 border-blue-200"
                                : "bg-orange-100 text-orange-700 border-orange-200"
                              }`}
                          >
                            {exam.is_assigned ? "Đã giao" : "Chưa giao"}
                          </Badge>
                        </div>
                      </div>
                      {/* Description */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {(exam.description || "Không có mô tả") +
                            " " +
                            exam.id}
                        </p>
                      </div>

                      {/* Stats Grid */}
                      <div className="space-y-3 mb-4 flex-1">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <LucideCalendar className="h-4 w-4 text-gray-400" />
                          <span className="truncate">
                            {formatTimestamp(exam.created_at)}
                          </span>
                        </div>

                        {exam.deadline && (
                          <div className="flex items-center gap-3 text-sm text-red-600">
                            <LucideClock className="h-4 w-4 text-red-400" />
                            <span className="truncate">
                              {formatDeadline(exam.deadline)}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <LucideClock className="h-4 w-4 text-gray-400" />
                          <span>{exam.time_limit} phút</span>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <LucideBookOpen className="h-4 w-4 text-gray-400" />
                          <span>{exam.max_score} điểm</span>
                        </div>
                        {/* Total Questions */}
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <LucideInfo className="h-4 w-4 text-gray-400" />
                          <span>{exam.total_questions ?? 0} câu hỏi</span>
                        </div>

                        {/*  {!exam.is_assigned && (
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
                            {/* Hàng trên: Sửa và Xóa */}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl border-gray-200 hover:border-green-300 hover:bg-green-50 hover:text-green-600 flex-1 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(
                                    getEditAssignmentRoute(user, exam.id),
                                    "_blank"
                                  );
                                }}
                              >
                                <LucideEdit className="h-3 w-3 mr-1" />
                                Sửa
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
                                Nhân bản
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
                                Xóa
                              </Button>
                            </div>

                            <div className="w-full">
                              <Button
                                size="sm"
                                className="w-full font-semibold rounded-xl bg-blue-500 text-white hover:bg-blue-700 text-xs flex items-center justify-center"
                                style={{ boxShadow: "0 2px 8px 0 #2563eb22" }}
                                onClick={() =>
                                  window.open(
                                    doExamRoute(user, exam.id),
                                    "_blank"
                                  )
                                }
                              >
                                <LucideEye className="h-4 w-4 mr-1" />
                                Chế độ làm bài của học sinh
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
                              window.open(doExamRoute(user, exam.id), "_blank")
                            }
                          >
                            <LucideEye className="h-4 w-4 mr-1" />
                            Chế độ làm bài của học sinh
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
                  Không có bài kiểm tra nào
                </h3>
                <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base max-w-md mx-auto">
                  Bạn chưa có bài kiểm tra nào. Hãy tạo bài kiểm tra mới để bắt
                  đầu.
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
                  Tạo bài kiểm tra mới
                </Button>
              </div>
            )}

            {/* Pagination */}
            {exams.length > 0 && (
              <div className="flex justify-center mt-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl hover:bg-gray-50 hover:border-gray-300"
                      onClick={() => handlePageChange(filters.page! - 1)}
                      disabled={filters.page === 1}
                    >
                      Trước
                    </Button>
                    <span className="text-sm font-medium text-gray-700 px-3">
                      Trang {filters.page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl hover:bg-gray-50 hover:border-gray-300"
                      onClick={() => handlePageChange(filters.page! + 1)}
                      disabled={filters.page === totalPages}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Clone Dialog */}
        <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl border-0 shadow-xl">
            <DialogHeader className="pb-4 border-b border-gray-100">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Nhân bản{" "}
                {cloneType === "exam" ? "bài kiểm tra" : "bài tập về nhà"}
              </DialogTitle>
              <DialogDescription className="text-gray-500">
                Nhập thông tin cho bản sao mới
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Tên
                </label>
                <Input
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  placeholder="Nhập tên"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Mô tả
                </label>
                <Textarea
                  value={cloneDescription}
                  onChange={(e) => setCloneDescription(e.target.value)}
                  placeholder="Nhập mô tả"
                />
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Trường học
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
                    placeholder="Chọn trường học"
                    loading={schoolsLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Khóa học
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
                    placeholder="Chọn khóa học"
                    loading={coursesLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Bài học (tuỳ chọn)
                  </label>
                  <SearchableCombobox
                    options={[
                      { value: "none", label: "Không chọn bài học" },
                      ...availableLessons.map((l) => ({
                        value: l.id,
                        label: l.chapter_name
                          ? `${l.title} - ${l.chapter_name}`
                          : l.title,
                      })),
                    ]}
                    value={cloneLessonId}
                    onValueChange={(val) => setCloneLessonId(val)}
                    placeholder="Chọn bài học"
                    loading={loadingLessons}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => setCloneDialogOpen(false)}
                disabled={isCloning}
              >
                Hủy
              </Button>
              <Button
                className="rounded-2xl"
                onClick={handleConfirmClone}
                disabled={isCloning}
              >
                {isCloning ? (
                  <>
                    <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang nhân bản...
                  </>
                ) : (
                  "Xác nhận"
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
                Chọn loại tạo mới
              </DialogTitle>
              <DialogDescription className="text-gray-500">
                Chọn loại nội dung bạn muốn tạo
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-6">
              <Button
                className="flex items-center gap-4 h-auto py-6 px-6 text-white rounded-2xl transition-all duration-200"
                style={{
                  backgroundColor: BRAND_COLORS.orange,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#d97a1a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = BRAND_COLORS.orange;
                }}
                onClick={handleCreateExam}
                disabled={isCreatingExam}
              >
                {isCreatingExam ? (
                  <>
                    <div className="w-12 h-12 bg-orange-700 rounded-2xl flex items-center justify-center">
                      <LucideLoader2 className="h-6 w-6 animate-spin" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Đang chuyển hướng...</div>
                      <div className="text-sm text-orange-100">
                        Vui lòng đợi
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-orange-700 rounded-2xl flex items-center justify-center">
                      <LucideFileText className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Tạo bài kiểm tra</div>
                      <div className="text-sm text-orange-100">
                        Tạo bài kiểm tra mới cho học sinh
                      </div>
                    </div>
                  </>
                )}
              </Button>
              <Button
                className="flex items-center gap-4 h-auto py-6 px-6 bg-green-600 hover:bg-green-700 text-white rounded-2xl transition-all duration-200"
                onClick={handleCreateHomework}
                disabled={isCreatingHomework}
              >
                {isCreatingHomework ? (
                  <>
                    <div className="w-12 h-12 bg-green-700 rounded-2xl flex items-center justify-center">
                      <LucideLoader2 className="h-6 w-6 animate-spin" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Đang chuyển hướng...</div>
                      <div className="text-sm text-green-100">Vui lòng đợi</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-green-700 rounded-2xl flex items-center justify-center">
                      <LucideBookOpen className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Tạo bài tập về nhà</div>
                      <div className="text-sm text-green-100">
                        Tạo bài tập về nhà mới cho học sinh
                      </div>
                    </div>
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl border-0 shadow-xl">
            <DialogHeader className="pb-4 border-b border-gray-100">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Xác nhận xóa
              </DialogTitle>
              <DialogDescription className="text-gray-500 mt-2">
                {examToDelete && (
                  <>
                    Bạn có chắc chắn muốn xóa bài kiểm tra{" "}
                    <span className="font-medium text-gray-700">
                      "{examToDelete.name}"
                    </span>
                    ?
                    <br />
                    <span className="text-red-500 text-sm">
                      Hành động này không thể hoàn tác.
                    </span>
                  </>
                )}
                {homeworkToDelete && (
                  <>
                    Bạn có chắc chắn muốn xóa bài tập về nhà{" "}
                    <span className="font-medium text-gray-700">
                      "{homeworkToDelete.name}"
                    </span>
                    ?
                    <br />
                    <span className="text-red-500 text-sm">
                      Hành động này không thể hoàn tác.
                    </span>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-4">
              <Button
                variant="outline"
                className="rounded-2xl border-gray-200 hover:border-gray-300"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Hủy
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white rounded-2xl"
                onClick={examToDelete ? handleDeleteExam : handleDeleteHomework}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xóa...
                  </>
                ) : examToDelete ? (
                  "Xóa bài kiểm tra"
                ) : (
                  "Xóa bài tập về nhà"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
