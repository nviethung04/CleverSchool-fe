"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import ProfessionalPagination from "@/components/ui/professional-pagination";
import { RoleBasedHeaderSidebar } from "@/components/layout/role-based-header-sidebar";
import { GetLessons, DeleteLesson } from "@/lib/api/lessons";
import { GetCourseList } from "@/lib/api/courses";
import { GetProgramList } from "@/lib/api/programs";
import { GetChapters } from "@/lib/api/chapters";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTypedTranslations } from "@/lib/i18n/client";
import {
  Loader2,
  BookOpen,
  Edit,
  Eye,
  ChevronDown,
  Search,
  Plus,
  Trash2,
  Info,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuth } from "@/lib/context/auth-context";
import { BRAND_COLORS } from "@/lib/constants/colors";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { useQueryString } from "@/hooks/use-query-string";
import { sortByNumberAndAlphabetFromSecondGeneric } from "@/lib/utils";

// Shimmer effect component for loading cards
function LessonCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col h-full w-full max-w-[360px]">
      <div className="p-4 sm:p-6 flex flex-col flex-grow">
        <div className="flex items-start gap-4 mb-3">
          <div className="w-12 h-12 bg-gray-200 rounded-2xl animate-pulse flex-shrink-0"></div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-6 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-3/4"></div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-6 w-12 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
        </div>

        {/* Course/Chapter Info Skeleton */}
        <div className="bg-gray-100 rounded-xl p-3 mb-3">
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="space-y-2 mb-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-100 rounded-lg p-2">
              <div className="h-3 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
            <div className="bg-gray-100 rounded-lg p-2">
              <div className="h-3 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-100 rounded-lg p-2">
              <div className="h-3 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
            </div>
            <div className="bg-gray-100 rounded-lg p-2">
              <div className="h-3 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
            </div>
          </div>
        </div>

        {/* Button Skeleton */}
        <div className="flex gap-2 mt-auto">
          <div className="flex-1 h-8 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="flex-1 h-8 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

// Lesson Card Component
function LessonCard({
  lesson,
  onDelete,
  userType,
  locale,
  t,
}: {
  lesson: any;
  onDelete: (lessonId: string) => void;
  userType?: string;
  locale: string;
  t: (key: string) => string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await DeleteLesson(lesson.id);
      onDelete(lesson.id);
      setShowDeleteModal(false);
    } catch (err) {
      console.error("Error deleting lesson:", err);
      alert(t("deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  return (
    <>
      <Card
        className="bg-white rounded-3xl border border-gray-100 hover:shadow-xl transition-all duration-300 group flex flex-col h-full overflow-hidden cursor-pointer p-2 sm:p-0"
        onClick={() =>
          window.open(`/${locale}/manage/lessons/${lesson.id}`, "_blank")
        }
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = BRAND_COLORS.orange + "50";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "";
        }}
      >
        {/* Card Header */}
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4 mb-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:opacity-90 transition-colors flex-shrink-0"
              style={{ backgroundColor: BRAND_COLORS.orange + "20" }}
            >
              <BookOpen
                className="h-6 w-6"
                style={{ color: BRAND_COLORS.orange }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle
                className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-2 leading-snug transition-colors"
                style={{
                  minHeight: "3.5rem",
                  maxHeight: "3.5rem",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  alignItems: "center",
                }}
                title={lesson.title}
              >
                {lesson.title}
              </CardTitle>
              {/* Hiển thị object_title nếu có - responsive layout */}
              {userType !== "student" && lesson.object_title && (
                <div className="mt-1">
                  <Badge
                    variant="outline"
                    className="bg-emerald-100 text-emerald-600 border-emerald-200 text-xs font-medium py-0.5 px-2 rounded-full"
                  >
                    {lesson.object_title}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          {/* Description with line break, clamp 2 lines, and expand button */}
          <CardDescription className="text-sm text-gray-600 mb-3 relative">
            <LessonDescription description={lesson.description} />
          </CardDescription>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {lesson.tags?.slice(0, 3).map((tag: any) => (
              <Badge
                key={tag.id}
                className="bg-blue-50 text-blue-600 border-none text-xs px-2 py-1 rounded-lg"
              >
                #{tag.name}
              </Badge>
            ))}
            {lesson.topics?.slice(0, 2).map((topic: any) => (
              <Badge
                key={topic.id}
                className="bg-purple-50 text-purple-600 border-none text-xs px-2 py-1 rounded-lg"
              >
                {topic.name}
              </Badge>
            ))}
            {lesson.skill?.slice(0, 2).map((skill: any) => (
              <Badge
                key={skill.id}
                className="bg-green-50 text-green-600 border-none text-xs px-2 py-1 rounded-lg"
              >
                {skill.name}
              </Badge>
            ))}
          </div>
        </CardHeader>

        {/* Card Content */}
        <CardContent className="flex-1 flex flex-col pb-4">
          <div className="space-y-3">
            {/* Course and Chapter Info */}
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex flex-row gap-4 items-center">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("program")}
                  </span>
                  <p className="text-sm font-semibold text-gray-900 mt-1 truncate">
                    {lesson.program?.name ?? "--"}
                  </p>
                </div>
                {lesson.chapter && lesson.chapter.id !== "0" && (
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("chapter")}
                    </span>
                    <p
                      className="text-sm font-semibold text-gray-900 mt-1 truncate"
                      title={lesson.chapter.title}
                    >
                      {lesson.chapter.title}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Lesson Content Stats */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-blue-50 rounded-lg p-2">
                  <span className="text-blue-600 font-medium">
                    {t("lectures")}
                  </span>
                  <p className="text-blue-800 font-semibold">
                    {lesson.lesson_plans?.length || 0}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-2">
                  <span className="text-green-600 font-medium">
                    {t("homeworks")}
                  </span>
                  <p className="text-green-800 font-semibold">
                    {lesson.homeworks?.length || 0}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-orange-50 rounded-lg p-2">
                  <span className="text-orange-600 font-medium">
                    {t("exams")}
                  </span>
                  <p className="text-orange-800 font-semibold">
                    {lesson.exams?.length || 0}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-2">
                  <span className="text-purple-600 font-medium">
                    {t("exercises")}
                  </span>
                  <p className="text-purple-800 font-semibold">
                    {lesson.exercises?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Card Footer */}
        <CardFooter className="pt-0 px-4 sm:px-6 pb-6 sm:pb-8 mt-auto">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-xl border-gray-200 transition-colors text-xs sm:text-sm py-2 sm:py-2.5"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  BRAND_COLORS.orange + "10";
                e.currentTarget.style.borderColor = BRAND_COLORS.orange + "50";
                e.currentTarget.style.color = BRAND_COLORS.orange;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "";
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.color = "";
              }}
              onClick={(e) => {
                e.stopPropagation();
                window.open(`/${locale}/manage/lessons/${lesson.id}`, "_blank");
              }}
            >
              <Eye className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{t("viewDetails")}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-xl border-gray-200 transition-colors text-xs sm:text-sm py-2 sm:py-2.5"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  BRAND_COLORS.orange + "10";
                e.currentTarget.style.borderColor = BRAND_COLORS.orange + "50";
                e.currentTarget.style.color = BRAND_COLORS.orange;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "";
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.color = "";
              }}
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/${locale}/manage/lessons/${lesson.id}/edit`;
              }}
            >
              <Edit className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{t("edit")}</span>
            </Button>
            {userType === "admin" && (
              <Button
                variant="ghost"
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-md sm:rounded-xl w-full sm:w-auto sm:ml-1 mb-2 sm:mb-0"
                disabled={isDeleting}
                onClick={handleDeleteClick}
                title={t("deleteLesson")}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-1 sm:mr-0" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
      {/* Custom Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-sm mx-auto text-center">
          <div className="font-bold text-lg mb-2">
            {t("confirmDeleteTitle")}
          </div>
          <div className="mb-4 text-gray-700">
            {t("confirmDeleteMessage").replace("{title}", lesson.title)}
          </div>
          <DialogFooter className="flex gap-2 justify-center">
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              {t("cancel")}
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("confirm")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function TeacherLessonsPage() {
  const { setQueryParams, getValueFromQueryString, searchParamsUrl } = useQueryString()
  const { user } = useAuth();
  const params = useParams();
  const locale = (params as any)?.locale || "vi";
  const router = useRouter();
  const t = useTypedTranslations("teacherLessons");
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [lessonChapterStatus, setLessonChapterStatus] = useState<string>("");
  const [courses, setCourses] = useState<any[]>([]);
  const [programList, setProgramList] = useState<any[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [chapterList, setChapterList] = useState<any[]>([]);

  // Debug: Log programList changes
  useEffect(() => {
    console.log("Program list updated:", programList);
    console.log("Program list length:", programList.length);
  }, [programList]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [perPage, setPerPage] = useState(20);
  const [isCheckNoChapter, setIsCheckNoChapter] = useState(false);
  const debouncedKeyword = useDebounce(keyword, 800);

  useEffect(() => {
    if(getValueFromQueryString('programId')) {
      setSelectedProgramId(getValueFromQueryString('programId') as string);
    }
    if(getValueFromQueryString('chapterId')) {
      setSelectedChapterId(getValueFromQueryString('chapterId') as string);
    }
  }, [searchParamsUrl])

  // Fetch course list on mount
  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await GetCourseList();
        if (res.code === 200 && res.data) {
          setCourses(res.data.courses || []);
        }
      } catch (err) {
        // Ignore error for course list
      }
    }
    fetchCourses();
  }, []);

  // Fetch program list on mount
  useEffect(() => {
    async function fetchPrograms() {
      try {
        console.log("Fetching programs...");
        const res = await GetProgramList({ page: 1, per_page: 100 });
        console.log("Programs API response:", res);
        console.log("Response data:", res?.data);
        console.log("Response programs:", res?.data?.programs);

        // Try different possible response structures
        let programs = null;
        if (res?.data?.programs) {
          programs = res.data.programs;
          console.log("Found programs in res.data.programs");
        } else if (res?.data && Array.isArray(res.data)) {
          programs = res.data;
          console.log("Found programs as direct array in res.data");
        } else if (res?.programs) {
          programs = res.programs;
          console.log("Found programs in res.programs");
        } else if (Array.isArray(res)) {
          programs = res;
          console.log("Found programs as direct response array");
        }

        if (programs && Array.isArray(programs)) {
          console.log("Setting program list:", programs);
          setProgramList(programs);
        } else {
          console.log("No programs found in response");
          console.log(
            "Available keys in response.data:",
            res?.data ? Object.keys(res.data) : "No data"
          );
          console.log("Response structure:", JSON.stringify(res, null, 2));
        }
      } catch (error) {
        console.error("Error fetching programs:", error);
      }
    }
    fetchPrograms();
  }, []);

  // Fetch chapters when program is selected
  useEffect(() => {
    async function fetchChapters() {
      if (selectedProgramId) {
        try {
          const res = await GetChapters({ program_id: selectedProgramId });
          if (res?.data?.chapters) {
            setChapterList(res.data.chapters);
          }
        } catch (error) {
          console.error("Error fetching chapters:", error);
        }
      } else {
        setChapterList([]);
      }
    }
    fetchChapters();
  }, [selectedProgramId]);

  // Hàm xóa lesson
  const handleDeleteLesson = (lessonId: string) => {
    setLessons((prevLessons) =>
      prevLessons.filter((lesson) => lesson.id !== lessonId)
    );
  };

  // Handler for program change
  const handleProgramChange = (programId: string) => {
    setSelectedProgramId(programId);
    setSelectedChapterId(""); // Reset chapter selection
    setCurrentPage(1); // Reset to first page
    setQueryParams({
      programId,
      chapterId: null
    })
  };

  // Handler for chapter change
  const handleChapterChange = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setCurrentPage(1); // Reset to first page
    setQueryParams({chapterId})
  };

  useEffect(() => {
    async function fetchLessons() {
      setLoading(true);
      setError(null);
      try {
        const params: any = {
          page: currentPage,
          per_page: perPage,
        };
        if (debouncedKeyword) params.keyword = debouncedKeyword;
        if (isCheckNoChapter) {
          params.chapter_id = 0;
        } else {
          if (selectedCourseId) params.course_id = selectedCourseId;
          if (selectedChapterId) params.chapter_id = selectedChapterId;
          if (selectedProgramId) params.program_id = selectedProgramId;
        }
        const res = await GetLessons(params);
        console.log("Lessons API response:", res);
        console.log("Response data:", res?.data);
        console.log("Total count from API:", res?.data?.total_count);
        console.log("Total from API:", res?.data?.total);

        if (res.code === 200 && res.data) {
          let filteredLessons = res.data.lessons || [];
          setLessons(filteredLessons);
          setTotalItems(
            res.data.total_count || res.data.total || filteredLessons.length
          );
          setTotalCount(
            res.data.total_count || res.data.total || filteredLessons.length
          );
          setCurrentPage(res.data.current_page || currentPage);
          setHasNextPage(filteredLessons.length === perPage);
        } else {
          setError(t("cannotLoadLessons"));
        }
      } catch (err) {
        console.error("Error fetching lessons:", err);
        setError(t("errorLoadingLessons"));
      } finally {
        setLoading(false);
      }
    }
    fetchLessons();
  }, [
    debouncedKeyword,
    selectedCourseId,
    selectedChapterId,
    selectedProgramId,
    isCheckNoChapter,
    currentPage,
    perPage,
  ]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPerPage(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleKeywordChange = (newKeyword: string) => {
    setKeyword(newKeyword);
    setCurrentPage(1);
  };
  const handleLessonChapterStatusChange = (status: string) => {
    setLessonChapterStatus(status);
    setCurrentPage(1);
  };
  const handleCheckNoChapter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsCheckNoChapter(checked);
    if (checked) {
      setSelectedCourseId("");
      setSelectedChapterId("");
    }
    setCurrentPage(1);
  };

  return (
    <RoleBasedHeaderSidebar>
      <main className="min-h-screen overflow-x-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header Section - Mobile First */}
          <div className="mb-8 sm:mb-12">
            <div className="flex flex-col space-y-4 sm:space-y-6">
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
                  {t("manageLessons")}
                </h1>
                <p className="text-gray-500 font-medium text-sm sm:text-base mt-1">
                  {t("manageLessonsSubtitle")}
                </p>
              </div>

              {/* Search and Action Section */}
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                  <Input
                    placeholder={t("searchLessonsPlaceholder")}
                    className="pl-11 sm:pl-12 pr-4 py-3 rounded-2xl border-0 bg-white shadow-sm focus:shadow-md transition-shadow text-gray-700 placeholder:text-gray-400 text-sm sm:text-base w-full"
                    value={keyword}
                    onChange={(e) => handleKeywordChange(e.target.value)}
                  />
                </div>

                {/* Total Count Info */}
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 text-sm sm:text-base">
                  <Info className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium whitespace-nowrap">
                    {t("totalLessons")}: {totalCount}
                  </span>
                </div>

                {/* Right controls: dropdowns + button */}
                <div className="flex flex-col sm:flex-row gap-3 lg:items-center">
                  {/* Program Filter Dropdown */}
                  <div className="relative w-full sm:w-auto lg:w-[200px]">
                    <select
                      className="w-full px-4 py-3 rounded-2xl border-0 bg-white shadow-sm focus:shadow-md transition-shadow text-gray-700 text-sm sm:text-base appearance-none pr-10"
                      value={selectedProgramId}
                      onChange={(e) => handleProgramChange(e.target.value)}
                    >
                      <option value="">Tất cả chương trình</option>
                      {sortByNumberAndAlphabetFromSecondGeneric(programList, item => item.name, true).map((program: any) => (
                        <option key={program.id} value={program.id}>
                          {program.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  {/* Chapter Filter Dropdown */}
                  <div className="relative w-full sm:w-auto lg:w-[200px]">
                    <select
                      className="w-full px-4 py-3 rounded-2xl border-0 bg-white shadow-sm focus:shadow-md transition-shadow text-gray-700 text-sm sm:text-base appearance-none pr-10"
                      value={selectedChapterId}
                      onChange={(e) => handleChapterChange(e.target.value)}
                      disabled={!selectedProgramId}
                    >
                      <option value="">Tất cả chương</option>
                      {chapterList.map((chapter: any) => (
                        <option key={chapter.id} value={chapter.id}>
                          {chapter.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  {/* Create Lesson Button - Only for admin */}
                  {user?.type === "admin" && (
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
                        e.currentTarget.style.backgroundColor =
                          BRAND_COLORS.orange;
                      }}
                      asChild
                    >
                      <Link href={`/${locale}/manage/lessons/create`}>
                        <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline">
                          {t("createNewLesson")}
                        </span>
                        <span className="sm:hidden">{t("createNew")}</span>
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid - Responsive */}
          <div className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="min-h-[420px]">
                    <LessonCardSkeleton />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-16 sm:py-20 px-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-red-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  {t("anErrorOccurred")}
                </h3>
                <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base max-w-md mx-auto">
                  {error}
                </p>
              </div>
            ) : lessons.length === 0 ? (
              <div className="text-center py-16 sm:py-20 px-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  {t("noLessons")}
                </h3>
                <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base max-w-md mx-auto">
                  {t("noLessonsDescription")}
                </p>
                {user?.type === "admin" && (
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
                      e.currentTarget.style.backgroundColor =
                        BRAND_COLORS.orange;
                    }}
                    asChild
                  >
                    <Link href={`/${locale}/manage/lessons/create`}>
                      <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      {t("createNewLesson")}
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
                {lessons.map((lesson: any) => (
                  <div key={lesson.id} className="min-h-[420px]">
                    <LessonCard
                      lesson={lesson}
                      onDelete={handleDeleteLesson}
                      userType={user?.type}
                      locale={locale}
                      t={t}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Professional Pagination */}
            {!loading && !error && lessons.length > 0 && (
              <div className="flex justify-center mt-8 pt-4">
                <ProfessionalPagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(totalCount / perPage)}
                  totalCount={totalCount}
                  pageSize={perPage}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  pageSizeOptions={[20, 40, 60, 80, 100]}
                  itemName="bài học"
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </RoleBasedHeaderSidebar>
  );
}

// Thêm component phụ bên dưới file
function LessonDescription({ description }: { description: string }) {
  if (!description) return <span>Không có mô tả</span>;
  return (
    <span
      className="line-clamp-2 block whitespace-pre-line cursor-pointer"
      title={description}
      style={{
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {description}
    </span>
  );
}
