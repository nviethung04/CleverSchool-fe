"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  getLessonPlans,
  deleteLessonPlan,
  type LessonPlan,
  type LectureFilters,
} from "@/lib/api/lectures";
import {
  Clock,
  MoreVertical,
  Plus,
  Search,
  Trash,
  Edit,
  Eye,
  Download,
  Copy,
  Calendar,
  Users,
  SortAsc,
  SortDesc,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/context/auth-context";
import type { User } from "@/lib/types/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getLectureRoute,
  getEditLectureRoute,
  getCreateLectureRoute,
  getPreviewLectureRoute,
} from "@/lib/utils/route-utils";
import { BRAND_COLORS } from "@/lib/constants/colors";
import { useDebounce } from "@/hooks/use-debounce";
import { Skeleton } from "@/components/ui/skeleton";

// Cập nhật component LectureBank để thêm TeacherDashboardHeader
export default function LectureBank() {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("course_id");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<LectureFilters>({
    subject: "",
    grade: "",
    keyword: "",
    status: "all",
    sort_id: undefined,
    sort_created_at: undefined,
    page: 1,
    limit: 20,
  });

  const debouncedKeyword = useDebounce(filters.keyword, 800);

  // Replace fetchLessonPlans and useEffect with React Query
  const {
    data: lessonPlanData,
    isLoading,
    isError,
    refetch,
  } = useQuery<
    { lessonPlans: LessonPlan[]; totalPages: number; page: number },
    Error
  >({
    queryKey: ["lessonPlans", { ...filters, keyword: debouncedKeyword }],
    queryFn: async () =>
      await getLessonPlans({ ...filters, keyword: debouncedKeyword }),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const lessonPlans: LessonPlan[] = lessonPlanData?.lessonPlans || [];
  const totalPages: number = lessonPlanData?.totalPages || 1;
  const currentPage: number = lessonPlanData?.page ?? filters.page ?? 1;

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleFilterChange = useCallback(
    (key: keyof LectureFilters, value: string) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value === "" ? undefined : value,
        page: 1,
      }));
    },
    []
  );

  const handleStatusChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value === "all" ? undefined : value,
      page: 1,
    }));
  }, []);

  // Hàm xử lý sắp xếp theo ID
  const handleSortById = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      sort_id: value === "none" ? undefined : (value as "asc" | "desc"),
      page: 1,
    }));
  }, []);

  // Hàm xử lý sắp xếp theo ngày tạo
  const handleSortByCreatedAt = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      sort_created_at:
        value === "none" ? undefined : (value as "newest" | "oldest"),
      page: 1,
    }));
  }, []);

  // Hàm xử lý xóa bài giảng
  const handleDeleteLessonPlan = async (id: number) => {
    try {
      const success = await deleteLessonPlan(id);
      if (success) {
        toast({
          title: "Thành công",
          description: "Đã xóa bài giảng thành công",
        });
        // Thêm timeout 2 giây trước khi refresh danh sách bài giảng
        setTimeout(() => {
          refetch();
        }, 1000);
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể xóa bài giảng. Vui lòng thử lại sau.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting lesson plan:", error);
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi xóa bài giảng. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  };

  // Function to format Unix timestamp to readable date
  const formatDate = useCallback((timestamp: string | number) => {
    const ts =
      typeof timestamp === "string"
        ? Number.parseInt(timestamp, 10)
        : timestamp;
    const date = new Date(ts * 1000);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }, []);

  return (
    <>
      <div className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header Section - Mobile First */}
          <div className="mb-8 sm:mb-12">
            <div className="flex flex-col space-y-4 sm:space-y-6">
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  Ngân hàng bài giảng
                </h1>
                <p className="text-gray-500 font-medium text-sm sm:text-base mt-1">
                  Quản lý và tìm kiếm các bài giảng của bạn một cách hiệu quả
                </p>
              </div>

              {/* Search and Action Section */}
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                  <Input
                    placeholder="Tìm kiếm bài giảng..."
                    className="pl-11 sm:pl-12 pr-4 py-3 rounded-2xl border-0 bg-white shadow-sm focus:shadow-md transition-shadow text-gray-700 placeholder:text-gray-400 text-sm sm:text-base"
                    value={filters.keyword}
                    onChange={(e) =>
                      handleFilterChange("keyword", e.target.value)
                    }
                  />
                </div>

                {/* Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  {/* Subject Filter */}
                  {/* <div className="relative">
                    <select
                      className="w-full sm:w-auto px-4 py-3 rounded-2xl border-0 bg-white shadow-sm focus:shadow-md transition-shadow text-gray-700 text-sm sm:text-base appearance-none pr-10 min-w-[140px]"
                      value={filters.subject || "all"}
                      onChange={(e) => handleFilterChange("subject", e.target.value === "all" ? "" : e.target.value)}
                    >
                      <option value="all">Tất cả môn học</option>
                      <option value="Tiếng Anh">Tiếng Anh</option>
                      <option value="Toán">Toán</option>
                      <option value="Khoa học">Khoa học</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div> */}

                  {/* Grade Filter */}
                  {/* <div className="relative">
                    <select
                      className="w-full sm:w-auto px-4 py-3 rounded-2xl border-0 bg-white shadow-sm focus:shadow-md transition-shadow text-gray-700 text-sm sm:text-base appearance-none pr-10 min-w-[120px]"
                      value={filters.grade || "all"}
                      onChange={(e) => handleFilterChange("grade", e.target.value === "all" ? "" : e.target.value)}
                    >
                      <option value="all">Tất cả khối lớp</option>
                      <option value="Lớp 1">Lớp 1</option>
                      <option value="Lớp 2">Lớp 2</option>
                      <option value="Lớp 3">Lớp 3</option>
                      <option value="Lớp 4">Lớp 4</option>
                      <option value="Lớp 5">Lớp 5</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div> */}

                  {/* Sort Dropdown */}
                  <div className="relative">
                    <select
                      className="w-full sm:w-auto px-4 py-3 rounded-2xl border-0 bg-white shadow-sm focus:shadow-md transition-shadow text-gray-700 text-sm sm:text-base appearance-none pr-10 min-w-[120px]"
                      value={filters.sort_created_at || "newest"}
                      onChange={(e) => handleSortByCreatedAt(e.target.value)}
                    >
                      <option value="newest">Mới nhất</option>
                      <option value="oldest">Cũ nhất</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Create Lecture Button */}
                  <Button
                    onClick={() => router.push(getCreateLectureRoute(user))}
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
                  >
                    <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">Tạo bài giảng mới</span>
                    <span className="sm:hidden">Tạo mới</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Status Tabs */}
          <Tabs
            defaultValue="all"
            className="w-full"
            onValueChange={handleStatusChange}
          >
            <TabsContent value="all" className="mt-0">
              {/* Danh sách bài giảng */}
              {isLoading ? (
                <div className="flex flex-wrap gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="border-0 shadow-md bg-slate-50">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Skeleton className="w-10 h-10 rounded-lg" />
                          <div className="flex-1">
                            <Skeleton className="h-6 w-32 mb-2" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                        <div className="mb-4">
                          <Skeleton className="h-5 w-40 mb-2" />
                          <Skeleton className="h-4 w-28" />
                        </div>
                        <div className="flex gap-2 mb-4">
                          <Skeleton className="h-8 w-24 rounded-full" />
                          <Skeleton className="h-8 w-16 rounded-full" />
                        </div>
                        <div className="flex justify-end">
                          <Skeleton className="h-10 w-32 rounded-full" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-6">
                  {/*
                    - Trên màn hình lg trở lên: grid 4 cột
                    - Dưới lg: flex flex-wrap (mỗi card w-full, responsive)
                  */}
                  {lessonPlans.length > 0 ? (
                    lessonPlans.map((lessonPlan: LessonPlan) => (
                      <LessonPlanCard
                        key={lessonPlan.id}
                        lessonPlan={lessonPlan}
                        formatDate={formatDate}
                        onDelete={handleDeleteLessonPlan}
                        user={user}
                      />
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-12">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <Plus className="h-10 w-10 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        Chưa có bài giảng nào
                      </h3>
                      <p className="text-slate-600 mb-6 max-w-md mx-auto">
                        Tạo bài giảng đầu tiên của bạn để bắt đầu chia sẻ kiến
                        thức với học sinh
                      </p>
                      <Button
                        onClick={() => router.push(getCreateLectureRoute(user))}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Plus className="mr-2 h-5 w-5" />
                        Tạo bài giảng mới
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination>
                <PaginationContent className="gap-2">
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) handlePageChange(currentPage - 1);
                      }}
                      className={`rounded-2xl ${
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "hover:bg-blue-50 hover:border-blue-200"
                      }`}
                    />
                  </PaginationItem>

                  {(() => {
                    const getPageNumbers = () => {
                      const pages: (number | string)[] = [];
                      
                      if (totalPages <= 5) {
                        // Show all pages if 5 or fewer
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        // Always show first page
                        pages.push(1);
                        
                        if (currentPage <= 3) {
                          // Near beginning: 1 2 3 ... last
                          for (let i = 2; i <= 3; i++) {
                            pages.push(i);
                          }
                          pages.push('...');
                          pages.push(totalPages);
                        } else if (currentPage >= totalPages - 2) {
                          // Near end: 1 ... (last-2) (last-1) last
                          pages.push('...');
                          for (let i = totalPages - 2; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          // Middle: 1 ... (current-1) current (current+1) ... last
                          pages.push('...');
                          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                            pages.push(i);
                          }
                          pages.push('...');
                          pages.push(totalPages);
                        }
                      }
                      
                      return pages;
                    };

                    return getPageNumbers().map((page, index) => (
                      <PaginationItem key={`${page}-${index}`}>
                        {page === '...' ? (
                          <span className="px-3 py-2 text-gray-500 select-none">
                            ...
                          </span>
                        ) : (
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(page as number);
                            }}
                            isActive={page === currentPage}
                            className={`rounded-2xl ${
                              page === currentPage
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                                : "hover:bg-blue-50 hover:border-blue-200"
                            }`}
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ));
                  })()}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages)
                          handlePageChange(currentPage + 1);
                      }}
                      className={`rounded-2xl ${
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "hover:bg-blue-50 hover:border-blue-200"
                      }`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Updated component for lesson plan cards
const LessonPlanCard = React.memo(function LessonPlanCard({
  lessonPlan,
  formatDate,
  onDelete,
  user,
}: {
  lessonPlan: LessonPlan;
  formatDate: (timestamp: string | number) => string;
  onDelete: (id: number) => Promise<void>;
  user: User | null;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const router = useRouter();
  return (
    <div
      className="group bg-white/60 backdrop-blur-sm rounded-3xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-2xl hover:scale-105 active:scale-100 transition-all duration-300 flex flex-col h-full cursor-pointer w-[350px]"
      onClick={(e) => {
        // Nếu click vào dropdown menu hoặc các nút bên trong, không navigate
        if (
          e.target instanceof HTMLElement &&
          (e.target.closest("[data-dropdown-menu]") ||
            e.target.closest("button") ||
            e.target.closest("a"))
        ) {
          return;
        }
        router.push(getPreviewLectureRoute(user, lessonPlan.id));
      }}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ")
          router.push(getPreviewLectureRoute(user, lessonPlan.id));
      }}
    >
      {/* Cover Image */}
      <div className="relative aspect-[16/9] w-full">
        <Image
          src={
            lessonPlan.cover_image && lessonPlan.cover_image !== ""
              ? lessonPlan.cover_image
              : `/placeholder.svg?height=200&width=400&query=Lesson Plan ${lessonPlan.id}`
          }
          alt={lessonPlan.name || `Bài giảng ${lessonPlan.id}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 256px"
          loading="lazy"
          style={{ maxWidth: 400, maxHeight: 200 }}
        />
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 "></div>
        {/* Lesson Title in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 py-4 md:px-10 md:py-6">
          {(() => {
            // Parse lesson title to extract lesson number and content
            const title = lessonPlan.name || `Bài giảng ${lessonPlan.id}`;
            const lessonMatch = title.match(/^(Lesson\s+\d+):\s*(.+)$/i);

            if (lessonMatch) {
              const [, lessonNumber, content] = lessonMatch;
              return (
                <>
                  <div
                    className="text-xl font-extrabold mb-2 drop-shadow-lg"
                    style={{ color: "#33408F", fontWeight: 800 }}
                  >
                    {lessonNumber}
                  </div>
                  <h3
                    className="text-2xl font-extrabold leading-tight drop-shadow-lg"
                    style={{ color: "#EB8922", fontWeight: 900 }}
                  >
                    {content}
                  </h3>
                </>
              );
            } else {
              return (
                <h3
                  className="text-xl font-bold leading-tight drop-shadow-lg"
                  style={{ color: "#EB8922", fontWeight: 900 }}
                >
                  {title}
                </h3>
              );
            }
          })()}
        </div>
        {/* Status Badge */}
        <div className="absolute top-3 left-3 z-10">
          <Badge
            className={`$${
              lessonPlan.status === 1
                ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg"
                : "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg"
            } rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm`}
          >
            {lessonPlan.status === 1 ? "Đã xuất bản" : "Bản nháp"}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Header Info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {lessonPlan.total_time && (
              <Badge
                className={`text-white border-0 rounded-full px-3 py-1 text-xs font-semibold shadow-sm`}
                style={{ backgroundColor: BRAND_COLORS.green }}
              >
                {lessonPlan.total_time} phút
              </Badge>
            )}
            {/* Views Badge */}
            <Badge
              className={`text-white border-0 rounded-full px-3 py-1 text-xs font-semibold shadow-sm`}
              style={{ backgroundColor: BRAND_COLORS.purple }}
            >
              <Users className="h-3 w-3 mr-1" />
              {lessonPlan.views || 0}
            </Badge>
          </div>

          {/* Dropdown Menu */}
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full"
                data-dropdown-menu
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4 text-slate-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-2xl border-0 shadow-xl bg-white/95 backdrop-blur-sm"
              data-dropdown-menu
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(
                    `/manage/lecture-bank/edit/${lessonPlan.id}${
                      courseId
                        ? `?course_id=${courseId}`
                        : ""
                    }`,
                    "_blank"
                  );
                }}
                className="rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
                data-dropdown-menu
              >
                <Edit className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setAlertDialogOpen(true);
                }}
                className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                data-dropdown-menu
              >
                <Trash className="mr-2 h-4 w-4" />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        <div className="flex-1">
          <p className="text-slate-600 text-sm line-clamp-3 mb-3">
            {lessonPlan.description ||
              "Bài giảng được thiết kế chuyên nghiệp với nội dung phong phú và tương tác cao."}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-200 mt-auto">
          <div className="flex items-center text-sm text-slate-500">
            <Calendar className="h-4 w-4 mr-2 text-slate-400" />
            {formatDate(lessonPlan.created_at)}
          </div>

          <div className="flex items-center text-sm text-slate-500">
            {lessonPlan.total_time ? (
              <>
                <Clock className="h-4 w-4 mr-2 text-slate-400" />
                {lessonPlan.total_time} phút
              </>
            ) : (
              <span>Chưa có thời gian</span>
            )}
          </div>
        </div>
      </div>

      {/* Alert Dialog for Delete Confirmation - Outside of DropdownMenu */}
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-xl font-bold text-slate-900">
              Xác nhận xóa bài giảng
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Bạn có chắc chắn muốn xóa bài giảng "
              {lessonPlan.name || `Bài giảng ${lessonPlan.id}`}"? Hành động này
              không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-2xl border-slate-200 hover:border-slate-300">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(Number(lessonPlan.id));
                setAlertDialogOpen(false);
              }}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-2xl shadow-lg"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});
