"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RoleBasedHeaderSidebar } from "@/components/layout/role-based-header-sidebar";
import Image from "next/image";
import Link from "next/link";
import {
  LucideBookOpen,
  LucideHeadphones,
  LucideMic,
  LucideBookText,
  LucideSearch,
  LucideClock,
  LucidePlus,
  LucideEdit,
  LucideTrash2,
  LucideUsers,
  Info,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { GetCourseList, DeleteCourse } from "@/lib/api/courses";
import { getListSchool } from "@/lib/api/dashboard";
import { GetSubjectsList } from "@/lib/api/subjects";
import { useRouter, useParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/context/auth-context";
import { useDebounce } from "@/hooks/use-debounce";
import { useTypedTranslations } from "@/lib/i18n/client";
import ProfessionalPagination from "@/components/ui/professional-pagination";
import { useQueryString } from "@/hooks/use-query-string";
import { sortAlphabetGeneric } from "@/lib/utils";

// Shimmer effect component for loading cards
function CourseCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col h-full w-[360px]">
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse flex-shrink-0">
        <div className="absolute top-4 right-4">
          <div className="h-6 w-16 bg-white/50 rounded-full animate-pulse"></div>
        </div>
        <div className="absolute top-4 left-4">
          <div className="h-6 w-20 bg-white/50 rounded-full animate-pulse"></div>
        </div>
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <div className="space-y-3 mb-4 flex-shrink-0">
          <div className="h-6 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-3/4"></div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
          <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-6 w-12 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
        <div className="flex-grow"></div>
        {/* Không cần skeleton cho button nữa vì teacher không có button ở dưới */}
      </div>
    </div>
  );
}

function CourseManagementContent({
  courses,
  handleCourseDetail,
  handleCourseDeleted,
  onSearch,
  onSubjectFilterChange,
  selectedSubjectId,
  subjects,
  loadingSubjects,
  loading,
  schoolList,
  selectedSchoolId,
  onSchoolChange,
  currentPage,
  totalCount,
  perPage,
  onPageChange,
  onPageSizeChange,
}: {
  courses: any[];
  handleCourseDetail: (course: any) => void;
  handleCourseDeleted: (id: string) => void;
  onSearch: (keyword: string) => void;
  onSubjectFilterChange: (subjectId: string) => void;
  selectedSubjectId: string;
  subjects: any[];
  loadingSubjects: boolean;
  loading: boolean;
  schoolList: { id: string; school_name: string }[];
  selectedSchoolId: string;
  onSchoolChange: (id: string) => void;
  currentPage: number;
  totalCount: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const { user } = useAuth(); // Lấy thông tin user để kiểm tra role
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearchTerm = useDebounce(searchInput, 500); // Debounce 500ms
  const t = useTypedTranslations("teacherCourses");
  const params = useParams() as { locale?: string };
  const locale = params?.locale || "vi";

  // Kiểm tra xem user có phải là admin không
  const canManageCourse = user?.type === "admin";

  // Gọi onSearch khi debouncedSearchTerm thay đổi
  useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header Section - Mobile First */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col space-y-4 sm:space-y-6">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                {canManageCourse ? t("manageTitle") : t("myCoursesTitle")}
              </h1>
              <p className="text-gray-500 font-medium text-sm sm:text-base mt-1">
                {canManageCourse ? t("manageSubtitle") : t("myCoursesSubtitle")}
              </p>
            </div>
            {/* Thêm dropdown chọn trường */}
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              {/* Filter Row: Search left, dropdown + button right */}
              <div className="flex flex-col sm:flex-row w-full gap-4 sm:items-center">
                {/* Search Bar - left */}
                <div className="relative flex-1 max-w-md">
                  <LucideSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                  <Input
                    placeholder={t("searchPlaceholder")}
                    className="pl-11 sm:pl-12 pr-4 py-3 rounded-2xl border-0 bg-white shadow-sm focus:shadow-md transition-shadow text-gray-700 placeholder:text-gray-400 text-sm sm:text-base"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-auto sm:ml-4">
                  <Select
                    value={selectedSubjectId}
                    onValueChange={onSubjectFilterChange}
                    disabled={loadingSubjects}
                  >
                    <SelectTrigger className="w-full sm:w-48 rounded-2xl border-0 bg-white shadow-sm focus:shadow-md transition-shadow text-sm sm:text-base">
                      <SelectValue placeholder="Tất cả môn học" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả môn học</SelectItem>
                      {loadingSubjects ? (
                        <SelectItem value="loading" disabled>
                          Đang tải...
                        </SelectItem>
                      ) : (
                        sortAlphabetGeneric(subjects, item => item.name, true).map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 sm:ml-4">
                  <Info className="h-4 w-4" />
                  <span className="font-medium">
                    {t("totalCourses")}: {totalCount}
                  </span>
                </div>
                {/* Khoảng trống flex-grow ở giữa */}
                <div className="flex-1 hidden sm:block"></div>
                {/* Dropdown + Button - right */}
                <div className="flex gap-2 items-center sm:ml-auto">
                  <div className="flex items-center gap-2">
                    <select
                      id="school-select"
                      className="border rounded-xl px-3 py-2 text-sm"
                      value={selectedSchoolId}
                      onChange={(e) => onSchoolChange(e.target.value)}
                    >
                      <option value="">{t("allSchool")}</option>
                      {sortAlphabetGeneric(schoolList, item => item.school_name, true).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.school_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {canManageCourse && (
                    <Button
                      className="bg-[#EB8922] hover:bg-[#d97a1a] text-white rounded-2xl px-4 sm:px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm sm:text-base w-full sm:w-auto"
                      asChild
                    >
                      <Link href={`/${locale}/manage/courses/create`}>
                        <LucidePlus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline">
                          {t("createCourse")}
                        </span>
                        <span className="sm:hidden">{t("createShort")}</span>
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid - Responsive */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex flex-wrap gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <CourseCardSkeleton key={index} />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-16 sm:py-20 px-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <LucideBookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                {canManageCourse
                  ? t("noCoursesAdminTitle")
                  : t("noCoursesTeacherTitle")}
              </h3>
              <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base max-w-md mx-auto">
                {canManageCourse
                  ? t("noCoursesAdminSubtitle")
                  : t("noCoursesTeacherSubtitle")}
              </p>
              {/* Create Course Button - Only for admin */}
              {canManageCourse && (
                <Button
                  className="bg-[#EB8922] hover:bg-[#d97a1a] text-white rounded-2xl px-6 py-3 text-sm sm:text-base"
                  asChild
                >
                  <Link href={`/${locale}/manage/courses/create`}>
                    <LucidePlus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    {t("createCourse")}
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onDetail={handleCourseDetail}
                  onDeleted={handleCourseDeleted}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        <ProfessionalPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={perPage}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={[20, 40, 60, 80, 100]}
          itemName="khóa học"
        />
      </div>
    </main>
  );
}

export default function TeacherCoursesPage() {
  const { searchParamsUrl, setQueryParams, getValueFromQueryString } = useQueryString()
  const { user } = useAuth();
  const params = useParams() as { locale?: string };
  const locale = params?.locale || "vi";
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [schoolList, setSchoolList] = useState<
    { id: string; school_name: string }[]
  >([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(20); // 20 courses per page

  const router = useRouter();

  useEffect(() => {
    // Lấy danh sách trường học khi load trang
    getListSchool().then((res) => {
      if (Array.isArray(res?.data?.schools)) {
        setSchoolList(
          res.data.schools.map((s: any) => ({
            id: String(s.id),
            school_name: s.school_name,
          }))
        );
      }
    });
  }, []);

  // Fetch subjects on component mount
  useEffect(() => {
    async function fetchSubjects() {
      setLoadingSubjects(true);
      try {
        const res = await GetSubjectsList();
        // Handle different response structures
        if (res?.data?.data?.subjects) {
          setSubjects(res.data.data.subjects);
        } else if (res?.data?.subjects) {
          setSubjects(res.data.subjects);
        } else if (Array.isArray(res?.data)) {
          setSubjects(res.data);
        } else if (Array.isArray(res)) {
          setSubjects(res);
        } else {
          setSubjects([]);
        }
      } catch (err) {
        console.error("Lỗi khi lấy danh sách môn học:", err);
        setSubjects([]);
      } finally {
        setLoadingSubjects(false);
      }
    }
    fetchSubjects();
  }, []);

  useEffect(() => {
    async function fetchCourses(
      keyword?: string,
      school_id?: string,
      subject_id?: string,
      page: number = 1
    ) {
      setLoading(true);
      const startTime = Date.now();
      try {
        const params: any = {
          page,
          per_page: pageSize,
        };
        if (keyword) params.keyword = keyword;
        if (school_id) params.school_id = school_id;
        if (subject_id && subject_id !== "all") params.subject_id = subject_id;

        const res = await GetCourseList(params);
        setAllCourses(res.data.courses || []);
        setTotalCount(res.data.total_count || 0);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách khóa học:", err);
      } finally {
        // Đảm bảo shimmer effect hiển thị ít nhất 500ms
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);
        setTimeout(() => {
          setLoading(false);
        }, remainingTime);
      }
    }
    fetchCourses(
      searchKeyword,
      selectedSchoolId,
      selectedSubjectId,
      currentPage
    );
  }, [
    searchKeyword,
    selectedSchoolId,
    selectedSubjectId,
    currentPage,
    pageSize,
  ]);

  // Since we're using server-side pagination, we don't need client-side filtering
  useEffect(() => {
    setFilteredCourses(allCourses);
  }, [allCourses]);

  const handleSearch = useCallback((keyword: string) => {
    setSearchKeyword(keyword);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handleSchoolChange = ((id: string) => {
    setSelectedSchoolId(id);
    setQueryParams((params) => {
      params.set("schoolId", id);
    });
    setCurrentPage(1); // Reset to first page when changing school
  });

  const handleSubjectFilterChange = ((subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setQueryParams((params) => {
      params.set("subjectId", subjectId);
    });
    setCurrentPage(1); // Reset to first page when filtering
  });

  function handleCourseDetail(course: any) {
    // Lưu dữ liệu vào sessionStorage để truyền sang trang chi tiết
    if (typeof window !== "undefined") {
      sessionStorage.setItem("courseDetail", JSON.stringify(course));
      router.push(`/${locale}/manage/courses/${course.id}`)
    }
  }

  function handleCourseDeleted(id: string) {
    setAllCourses((prev) => prev.filter((c) => String(c.id) !== String(id)));
  }

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  useEffect(() => {
    if (getValueFromQueryString('schoolId')) {
      setSelectedSchoolId(getValueFromQueryString('schoolId') as string)
    }
    if (getValueFromQueryString('subjectId')) {
      setSelectedSubjectId(getValueFromQueryString('subjectId') as string)
    }
  }, [searchParamsUrl])

  if (!user) return null;

  return (
    <RoleBasedHeaderSidebar>
      {" "}
      <CourseManagementContent
        courses={filteredCourses}
        handleCourseDetail={handleCourseDetail}
        handleCourseDeleted={handleCourseDeleted}
        onSearch={handleSearch}
        onSubjectFilterChange={handleSubjectFilterChange}
        selectedSubjectId={selectedSubjectId}
        subjects={subjects}
        loadingSubjects={loadingSubjects}
        loading={loading}
        schoolList={schoolList}
        selectedSchoolId={selectedSchoolId}
        onSchoolChange={handleSchoolChange}
        currentPage={currentPage}
        totalCount={totalCount}
        perPage={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </RoleBasedHeaderSidebar>
  );
}

function CourseCard({
  course,
  onDetail,
  onDeleted,
}: {
  course: any;
  onDetail?: (course: any) => void;
  onDeleted?: (id: string) => void;
}) {
  const { user } = useAuth(); // Lấy thông tin user để kiểm tra role
  const t = useTypedTranslations("teacherCourses");
  const params = useParams() as { locale?: string };
  const locale = params?.locale || "vi";

  const getCourseIcon = (type: string) => {
    switch (type) {
      case "listening":
        return <LucideHeadphones className="h-3 w-3 sm:h-4 sm:w-4" />;
      case "speaking":
        return <LucideMic className="h-3 w-3 sm:h-4 sm:w-4" />;
      case "reading":
        return <LucideBookText className="h-3 w-3 sm:h-4 sm:w-4" />;
      case "writing":
        return <LucideBookOpen className="h-3 w-3 sm:h-4 sm:w-4" />;
      default:
        return <LucideBookOpen className="h-3 w-3 sm:h-4 sm:w-4" />;
    }
  };

  const [showDelete, setShowDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Kiểm tra xem user có phải là admin không (chỉ admin mới được chỉnh sửa/xóa)
  const canManageCourse = user?.type === "admin";

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await DeleteCourse(course.id);
      console.log("DeleteCourse response:", res);
      if (res && res.status === 200) {
        toast({ title: t("deleteSuccess") });
        onDeleted?.(course.id);
      } else {
        toast({ title: t("deleteError"), variant: "destructive" });
      }
    } catch (err) {
      toast({ title: t("deleteError"), variant: "destructive" });
    } finally {
      setLoading(false);
      setShowDelete(false);
    }
  };

  const lessonCount = Array.isArray(course.chapters)
    ? course.chapters.reduce(
      (sum: number, chapter: any) => sum + (chapter.lessons?.length || 0),
      0
    )
    : 0;
  return (
    <div className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:border-emerald-200 flex flex-col w-full h-fit max-w-[360px]">
      {/* Course Image */}
      <div className="relative h-40 sm:h-48 overflow-hidden flex-shrink-0">
        <Image
          src={course.image || "/placeholder.svg"}
          alt={course.title || course.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Status and Level Badges */}
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
          <Badge
            className={`text-xs font-medium px-2 sm:px-3 py-1 rounded-full ${course.status === "active"
                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                : course.status === "draft"
                  ? "bg-amber-100 text-amber-700 border-amber-200"
                  : "bg-gray-100 text-gray-700 border-gray-200"
              }`}
          >
            {course.status === "active"
              ? t("statusActive")
              : course.status === "draft"
                ? t("statusDraft")
                : t("statusArchived")}
          </Badge>
        </div>

        <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
          <Badge className="bg-white/90 text-emerald-600 text-xs font-medium px-2 sm:px-3 py-1 rounded-full border border-white/50">
            {course.level}
          </Badge>
        </div>

        {/* Mobile Action Button - Always visible on mobile */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 sm:transition-opacity sm:duration-300 flex items-center justify-center">
          <Button
            onClick={() => onDetail?.(course)}
            className="bg-white hover:bg-emerald-50 text-emerald-600 rounded-2xl px-4 sm:px-6 py-2 font-semibold shadow-lg text-sm sm:text-base"
          >
            <LucideBookOpen className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{t("viewDetails")}</span>
            <span className="sm:hidden">{t("detailsShort")}</span>
          </Button>
        </div>
      </div>

      {/* Course Content - Flexible height with buttons always at bottom */}
      <div className="px-4 sm:px-6 py-6 flex flex-col flex-grow">
        {/* Title and Description */}
        <div className="space-y-2 mb-3 sm:mb-4 flex-shrink-0">
          {/* Tách badge nếu có dạng (CODE) ở cuối tên */}
          {(() => {
            const match = /^(.*?)(\s*\(([^)]+)\))?$/.exec(course.name || "");
            const mainName = match ? match[1].trim() : course.name;
            const badge = match && match[3] ? match[3] : null;
            return (
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-emerald-600 transition-colors leading-tight flex-1">
                  {mainName}
                </h3>
                {badge && (
                  <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2 py-0.5 text-xs font-semibold ml-2 whitespace-nowrap">
                    {badge}
                  </span>
                )}
              </div>
            );
          })()}

          {/* Hiển thị trường học và object_title - responsive layout */}
          {user?.type !== "student" &&
            (course.school?.name || course.object_title) && (
              <div className="flex flex-wrap gap-2 items-center mb-2">
                {course.school?.name && (
                  <Badge
                    variant="outline"
                    className="bg-orange-100 text-gray-600 border-gray-200 text-xs font-medium py-0.5 rounded-full"
                  >
                    {course.school.name}
                  </Badge>
                )}
                {course.object_title && (
                  <Badge
                    variant="outline"
                    className="bg-emerald-100 text-emerald-600 border-emerald-200 text-xs font-medium py-0.5 rounded-full"
                  >
                    {course.object_title}
                  </Badge>
                )}
              </div>
            )}

          <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        </div>

        {/* Course Stats - More mobile friendly */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-shrink-0">
          <Badge
            variant="outline"
            className="text-xs flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-full bg-gray-50 text-gray-600 border-gray-200"
          >
            <LucideClock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline">
              {(course.duration || t("notAvailable")) + " tuần"}
            </span>
            <span className="sm:hidden">
              {course.duration ? course.duration : "0"}
            </span>
          </Badge>
          <Badge
            variant="outline"
            className="text-xs px-2 sm:px-3 py-1 rounded-full bg-purple-50 text-purple-600 border-purple-200"
          >
            <span className="inline">
              {lessonCount} {t("lessonsLower")}
            </span>
          </Badge>
          <Badge
            variant="outline"
            className="text-xs flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-full bg-orange-50 text-orange-600 border-orange-200"
          >
            <LucideUsers className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            {course.current_students}
          </Badge>
        </div>

        {/* Flexible spacer - pushes buttons to bottom */}
        <div className="flex-grow"></div>

        {/* Action Buttons - Mobile optimized */}
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 mt-auto flex-shrink-0">
          {/* Mobile: Show detail button for all users, Edit/Delete for admin only */}
          <Button
            onClick={() => onDetail?.(course)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm py-2.5 font-medium transition-colors sm:hidden"
          >
            <LucideBookOpen className="mr-1 h-3 w-3" />
            {t("detailsShort")}
          </Button>

          {/* Admin Controls - Show on all screen sizes for admin */}
          {canManageCourse && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-auto rounded-xl border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 transition-colors text-xs sm:text-sm py-2 sm:py-2.5 hidden sm:flex"
                asChild
              >
                <Link href={`/${locale}/manage/courses/${course.id}/edit`}>
                  <LucideEdit className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{t("edit")}</span>
                  <span className="sm:hidden">{t("editShort")}</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-red-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-colors px-2 sm:px-4 py-2 sm:py-2.5 order-2"
                onClick={() => setShowDelete(true)}
              >
                <LucideTrash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>

              {/* Mobile Edit Button */}
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 transition-colors text-xs py-2 sm:hidden order-1"
                asChild
              >
                <Link href={`/${locale}/manage/courses/${course.id}/edit`}>
                  <LucideEdit className="mr-1 h-3 w-3" />
                  {t("editShort")}
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog - Mobile optimized */}
      {canManageCourse && (
        <Dialog open={showDelete} onOpenChange={setShowDelete}>
          <DialogContent className="rounded-3xl border-0 shadow-2xl mx-4 max-w-sm sm:max-w-md">
            <DialogHeader className="text-center pb-4 sm:pb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <LucideTrash2 className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              </div>
              <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900">
                {t("deleteCourseTitle")}
              </DialogTitle>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                {t("deleteCourseConfirm", { name: course.name })}
              </p>
              <p className="text-xs sm:text-sm text-red-600 mt-1">
                {t("irreversible")}
              </p>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6">
              <Button
                variant="outline"
                onClick={() => setShowDelete(false)}
                disabled={loading}
                className="flex-1 rounded-xl text-sm sm:text-base"
              >
                {t("cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-sm sm:text-base"
              >
                {loading ? t("deleting") : t("deleteCourse")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
