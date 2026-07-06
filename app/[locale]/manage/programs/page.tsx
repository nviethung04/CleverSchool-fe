"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RoleBasedHeaderSidebar } from "@/components/layout/role-based-header-sidebar";
import Image from "next/image";
import Link from "next/link";
import {
  LucideBookOpen,
  LucideSearch,
  LucideClock,
  LucidePlus,
  LucideEdit,
  LucideTrash2,
  LucideUsers,
  Info,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { GetProgramList, DeleteProgram } from "@/lib/api/programs";
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
function ProgramCardSkeleton() {
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
      </div>
    </div>
  );
}

function ProgramManagementContent({
  programs,
  handleProgramDetail,
  handleProgramDeleted,
  onSearch,
  onSubjectFilterChange,
  selectedSubjectId,
  subjects,
  loadingSubjects,
  loading,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  programs: any[];
  handleProgramDetail: (program: any) => void;
  handleProgramDeleted: (id: string) => void;
  onSearch: (keyword: string) => void;
  onSubjectFilterChange: (subjectId: string) => void;
  selectedSubjectId: string;
  subjects: any[];
  loadingSubjects: boolean;
  loading: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const { user } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearchTerm = useDebounce(searchInput, 500);
  const t = useTypedTranslations("teacherCourses");
  const params = useParams() as { locale?: string };
  const locale = params?.locale || "vi";

  const canManageProgram = user?.type === "admin";

  useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col space-y-4 sm:space-y-6">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                {canManageProgram
                  ? "Quản lý chương trình"
                  : "Chương trình của tôi"}
              </h1>
              <p className="text-gray-500 font-medium text-sm sm:text-base mt-1">
                {canManageProgram
                  ? "Quản lý tất cả chương trình trong hệ thống"
                  : "Xem các chương trình được giao"}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <div className="flex flex-col sm:flex-row w-full gap-4 sm:items-center">
                <div className="relative flex-1 max-w-md">
                  <LucideSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                  <Input
                    placeholder="Tìm kiếm chương trình..."
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
                    {t("totalPrograms")}: {totalCount}
                  </span>
                </div>
                <div className="flex-1 hidden sm:block"></div>
                <div className="flex gap-2 items-center sm:ml-auto">
                  {canManageProgram && (
                    <Button
                      className="bg-[#EB8922] hover:bg-[#d97a1a] text-white rounded-2xl px-4 sm:px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm sm:text-base w-full sm:w-auto"
                      asChild
                    >
                      <Link href={`/${locale}/manage/programs/create`}>
                        <LucidePlus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline">
                          Tạo chương trình
                        </span>
                        <span className="sm:hidden">Tạo</span>
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="flex flex-wrap gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProgramCardSkeleton key={index} />
              ))}
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-16 sm:py-20 px-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <LucideBookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                {canManageProgram
                  ? "Chưa có chương trình nào"
                  : "Bạn chưa có chương trình nào"}
              </h3>
              <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base max-w-md mx-auto">
                {canManageProgram
                  ? "Tạo chương trình đầu tiên để bắt đầu"
                  : "Liên hệ quản trị viên để được giao chương trình"}
              </p>
              {canManageProgram && (
                <Button
                  className="bg-[#EB8922] hover:bg-[#d97a1a] text-white rounded-2xl px-6 py-3 text-sm sm:text-base"
                  asChild
                >
                  <Link href={`/${locale}/manage/programs/create`}>
                    <LucidePlus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Tạo chương trình
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
              {programs.map((program) => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  onDetail={handleProgramDetail}
                  onDeleted={handleProgramDeleted}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        <ProfessionalPagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalCount / pageSize)}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          itemName="chương trình"
        />
      </div>
    </main>
  );
}

export default function ProgramsManagementPage() {
  const { searchParamsUrl, setQueryParams, getValueFromQueryString } = useQueryString()
  const { user } = useAuth();
  const params = useParams() as { locale?: string };
  const locale = params?.locale || "vi";
  const [allPrograms, setAllPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const router = useRouter();

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

  const fetchPrograms = useCallback(
    async (
      keyword?: string,
      subjectId?: string,
      page?: number,
      size?: number
    ) => {
      setLoading(true);
      const startTime = Date.now();
      try {
        const params: any = {
          page: page || currentPage,
          per_page: size || pageSize,
        };
        if (keyword) params.keyword = keyword;
        if (subjectId && subjectId !== "all") params.subject_id = subjectId;
        const res = await GetProgramList(params);

        setAllPrograms(res.data?.programs || []);
        setTotalCount(res.data?.total_count || 0);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách chương trình:", err);
        setAllPrograms([]);
        setTotalCount(0);
      } finally {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);
        setTimeout(() => {
          setLoading(false);
        }, remainingTime);
      }
    },
    [currentPage, pageSize]
  );

  useEffect(() => {
    fetchPrograms(searchKeyword, selectedSubjectId, currentPage, pageSize);
  }, [searchKeyword, selectedSubjectId, currentPage, pageSize, fetchPrograms]);

  const handleSearch = useCallback((keyword: string) => {
    setSearchKeyword(keyword);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handleSubjectFilterChange = useCallback((subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setQueryParams({subjectId})
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  function handleProgramDetail(program: any) {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("programDetail", JSON.stringify(program));
      router.push(`/${locale}/manage/programs/${program.id}`);
    }
  }

  const handleProgramDeleted = useCallback(
    (id: string) => {
      setAllPrograms((prev) => prev.filter((p) => String(p.id) !== String(id)));
      setTotalCount((prev) => Math.max(0, prev - 1));
      fetchPrograms(searchKeyword, selectedSubjectId, currentPage, pageSize);
    },
    [fetchPrograms, searchKeyword, selectedSubjectId, currentPage, pageSize]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
    },
    [currentPage]
  );

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  useEffect(() => {
    if(getValueFromQueryString('subjectId')) {
      setSelectedSubjectId(getValueFromQueryString('subjectId') as string)
    }
  }, [searchParamsUrl])

  if (!user) return null;

  return (
    <RoleBasedHeaderSidebar>
      <ProgramManagementContent
        programs={allPrograms}
        handleProgramDetail={handleProgramDetail}
        handleProgramDeleted={handleProgramDeleted}
        onSearch={handleSearch}
        onSubjectFilterChange={handleSubjectFilterChange}
        selectedSubjectId={selectedSubjectId}
        subjects={subjects}
        loadingSubjects={loadingSubjects}
        loading={loading}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </RoleBasedHeaderSidebar>
  );
}

function ProgramCard({
  program,
  onDetail,
  onDeleted,
}: {
  program: any;
  onDetail?: (program: any) => void;
  onDeleted?: (id: string) => void;
}) {
  const { user } = useAuth();
  const t = useTypedTranslations("teacherCourses");
  const params = useParams() as { locale?: string };
  const locale = params?.locale || "vi";

  const [showDelete, setShowDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const canManageProgram = user?.type === "admin";

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await DeleteProgram(program.id);
      if (res?.code === 200) {
        toast({ title: "Xóa thành công" });
        onDeleted?.(program.id);
      } else {
        toast({ title: "Lỗi khi xóa", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Lỗi khi xóa", variant: "destructive" });
    } finally {
      setLoading(false);
      setShowDelete(false);
    }
  };

  const courseCount = program.courses?.length || 0;

  return (
    <div className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:border-emerald-200 flex flex-col w-full max-w-[360px]">
      <div className="relative h-40 sm:h-48 overflow-hidden flex-shrink-0">
        <Image
          src={program.image || "/placeholder.svg"}
          alt={program.title || program.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
          <Badge
            className={`text-xs font-medium px-2 sm:px-3 py-1 rounded-full ${
              program.status
                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                : "bg-gray-100 text-gray-700 border-gray-200"
            }`}
          >
            {program.status ? "Đang hoạt động" : "Không hoạt động"}
          </Badge>
        </div>

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 sm:transition-opacity sm:duration-300 flex items-center justify-center">
          <Button
            onClick={() => onDetail?.(program)}
            className="bg-white hover:bg-emerald-50 text-emerald-600 rounded-2xl px-4 sm:px-6 py-2 font-semibold shadow-lg text-sm sm:text-base"
          >
            <LucideBookOpen className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Xem chi tiết</span>
            <span className="sm:hidden">Chi tiết</span>
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-6 flex flex-col flex-grow">
        <div className="space-y-2 mb-3 sm:mb-4 flex-shrink-0">
          {(() => {
            const match = /^(.*?)(\s*\(([^)]+)\))?$/.exec(program.name || "");
            const mainName = match ? match[1].trim() : program.name;
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

          {user?.type !== "student" &&
            (program.school?.name || program.object_title) && (
              <div className="flex flex-wrap gap-2 items-center mb-2">
                {program.school?.name && (
                  <Badge
                    variant="outline"
                    className="bg-orange-100 text-gray-600 border-gray-200 text-xs font-medium py-0.5 rounded-full"
                  >
                    {program.school.name}
                  </Badge>
                )}
                {program.object_title && (
                  <Badge
                    variant="outline"
                    className="bg-emerald-100 text-emerald-600 border-emerald-200 text-xs font-medium py-0.5 rounded-full"
                  >
                    {program.object_title}
                  </Badge>
                )}
              </div>
            )}

          <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 leading-relaxed">
            {program.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-shrink-0">
          <Badge
            variant="outline"
            className="text-xs flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-full bg-gray-50 text-gray-600 border-gray-200"
          >
            <LucideClock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline">
              {(program.duration || "Chưa xác định") + " tuần"}
            </span>
            <span className="sm:hidden">
              {program.duration ? program.duration : "0"}
            </span>
          </Badge>
          <Badge
            variant="outline"
            className="text-xs px-2 sm:px-3 py-1 rounded-full bg-purple-50 text-purple-600 border-purple-200"
          >
            <span className="inline">{courseCount} khóa học</span>
          </Badge>
          <Badge
            variant="outline"
            className="text-xs flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-full bg-orange-50 text-orange-600 border-orange-200"
          >
            <LucideUsers className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            {program.current_students || 0}
          </Badge>
        </div>

        <div className="flex-grow"></div>

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 mt-auto flex-shrink-0">
          <Button
            onClick={() => onDetail?.(program)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm py-2.5 font-medium transition-colors sm:hidden"
          >
            <LucideBookOpen className="mr-1 h-3 w-3" />
            Chi tiết
          </Button>

          {canManageProgram && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-auto rounded-xl border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 transition-colors text-xs sm:text-sm py-2 sm:py-2.5 hidden sm:flex"
                asChild
              >
                <Link href={`/${locale}/manage/programs/${program.id}/edit`}>
                  <LucideEdit className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Chỉnh sửa</span>
                  <span className="sm:hidden">Sửa</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 transition-colors text-xs py-2 sm:hidden order-1"
                asChild
              >
                <Link href={`/${locale}/manage/programs/${program.id}/edit`}>
                  <LucideEdit className="mr-1 h-3 w-3" />
                  Sửa
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
            </>
          )}
        </div>
      </div>

      {canManageProgram && (
        <Dialog open={showDelete} onOpenChange={setShowDelete}>
          <DialogContent className="rounded-3xl border-0 shadow-2xl mx-4 max-w-sm sm:max-w-md">
            <DialogHeader className="text-center pb-4 sm:pb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <LucideTrash2 className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              </div>
              <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900">
                Xóa chương trình
              </DialogTitle>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                Bạn có chắc chắn muốn xóa chương trình "{program.name}"?
              </p>
              <p className="text-xs sm:text-sm text-red-600 mt-1">
                Hành động này không thể hoàn tác
              </p>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6">
              <Button
                variant="outline"
                onClick={() => setShowDelete(false)}
                disabled={loading}
                className="flex-1 rounded-xl text-sm sm:text-base"
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-sm sm:text-base"
              >
                {loading ? "Đang xóa..." : "Xóa chương trình"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
