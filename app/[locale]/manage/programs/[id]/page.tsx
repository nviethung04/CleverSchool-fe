"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LucideBookOpen,
  LucideChevronLeft,
  LucideEdit,
  LucideClock,
  LucideCalendar,
  LucidePlus,
  School,
  Target,
  LucideUsers,
  LucideEye,
  LucideX,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/lib/context/auth-context";
import { RoleBasedHeaderSidebar } from "@/components/layout/role-based-header-sidebar";
import { useRouter, useParams } from "next/navigation";
import { GetProgramDetail } from "@/lib/api/programs";
import type { Chapter } from "@/lib/api/chapters";
import { ExpandableDescription } from "@/components/ui/expandable-description";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrangeCoursesFamilyDialog } from "@/components/manage/arrange-courses-family-dialog";
import { LucideMove } from "lucide-react";

interface Course {
  id: string;
  name: string;
  description: string;
  duration: number;
  image: string;
  current_students: number;
  target: string;
  object_title: string;
  start_date: string;
  end_date: string;
  progress: string;
  created_at: string;
  updated_at: string;
}

interface ProgramData {
  id: number;
  name: string;
  description: string;
  target: string;
  image: string;
  duration: number;
  chapters: Chapter[];
  courses: Course[];
  schools?: Array<{
    id: number;
    name: string;
  }>;
  created_at: string;
  updated_at: string;
}

// Skeleton components for loading state
function ProgramDetailSkeleton() {
  return (
    <main className="min-h-screen py-8">
      <div className="container mx-auto px-6">
        {/* Breadcrumb skeleton */}
        <div className="mb-8 flex items-center justify-between">
          <div className="h-10 w-48 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>

        {/* Main content skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <div>
            <Card className="border-0 shadow-sm rounded-2xl bg-white">
              <div className="p-6">
                <div className="h-8 bg-gray-200 rounded-xl animate-pulse mb-6"></div>

                {/* Badges skeleton */}
                <div className="flex flex-wrap gap-3 mb-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-8 w-20 bg-gray-200 rounded-full animate-pulse"
                    ></div>
                  ))}
                </div>

                {/* Description skeleton */}
                <div className="space-y-6">
                  <div>
                    <div className="h-6 w-32 bg-gray-200 rounded-xl animate-pulse mb-3"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded-xl animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded-xl animate-pulse w-3/4"></div>
                    </div>
                  </div>

                  <div>
                    <div className="h-6 w-40 bg-gray-200 rounded-xl animate-pulse mb-3"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded-xl animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded-xl animate-pulse w-2/3"></div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Stats card skeleton */}
          <div>
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white">
              {/* Image skeleton with 16:9 aspect ratio */}
              <div className="relative w-full aspect-[16/9] bg-gray-200 animate-pulse">
                <div className="absolute top-4 right-4">
                  <div className="h-6 w-16 bg-gray-300 rounded-full animate-pulse"></div>
                </div>
                <div className="absolute top-4 left-4">
                  <div className="h-6 w-24 bg-gray-300 rounded-full animate-pulse"></div>
                </div>
              </div>
              <CardHeader className="pb-4">
                <div className="h-6 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-gray-100 rounded-xl">
                  <div className="flex justify-between text-sm mb-2">
                    <div className="h-4 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
                    <div className="h-4 w-8 bg-gray-200 rounded-xl animate-pulse"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-xl animate-pulse"></div>
                </div>

                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center py-3"
                    >
                      <div className="h-4 w-24 bg-gray-200 rounded-xl animate-pulse"></div>
                      <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

// Component hiển thị modal danh sách khóa học
function CoursesListModal({ courses }: { courses: Course[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const params = useParams();
  const locale = params.locale;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <LucideEye className="h-4 w-4 mr-1" />
          Xem danh sách
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Danh sách khóa học ({courses.length})
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/${locale}/manage/courses/${course.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="border border-gray-200 hover:shadow-md transition-all duration-300 cursor-pointer relative group">
                {/* Button Xem chi tiết - hiển thị khi hover */}
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 rounded-lg">
                  <Button className="bg-white text-gray-900 hover:bg-gray-100 shadow-lg">
                    <LucideEye className="h-4 w-4 mr-2" />
                    Xem chi tiết
                  </Button>
                </div>

                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Ảnh khóa học */}
                    <div className="flex-shrink-0 w-full sm:w-20">
                      <div className="w-full sm:w-20 h-32 sm:h-20 rounded-lg overflow-hidden bg-gray-100">
                        {course.image ? (
                          <Image
                            src={course.image}
                            alt={course.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <LucideBookOpen className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Thông tin khóa học */}
                    <div className="flex-1 min-w-0">
                      <div className="mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 break-words">
                          {course.name}
                        </h3>
                      </div>

                      {/* Thông tin chi tiết */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <LucideUsers className="h-4 w-4 text-blue-500" />
                          <span className="text-gray-600">Học viên:</span>
                          <span className="font-medium">
                            {course.current_students}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <LucideClock className="h-4 w-4 text-green-500" />
                          <span className="text-gray-600">Thời gian:</span>
                          <span className="font-medium">
                            {course.duration} tuần
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <LucideCalendar className="h-4 w-4 text-purple-500" />
                          <span className="text-gray-600">Bắt đầu:</span>
                          <span className="font-medium">
                            {new Date(course.start_date).toLocaleDateString(
                              "vi-VN"
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-orange-500" />
                          <span className="text-gray-600">Lớp:</span>
                          <span className="font-medium truncate">
                            {course.object_title || "Chưa xác định"}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">Tiến độ</span>
                          <span className="text-sm font-medium text-gray-900">
                            {course.progress}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: course.progress }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {courses.length === 0 && (
            <div className="text-center py-8">
              <LucideBookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Chưa có khóa học nào sử dụng chương trình này
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ProgramDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const programIdParam = params.id;
  const programId = Array.isArray(programIdParam)
    ? programIdParam[0]
    : programIdParam;
  const locale = params.locale;

  const [program, setProgram] = useState<ProgramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!programId) return;

    const fetchProgramDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await GetProgramDetail(programId);
        if (response?.data) {
          setProgram(response.data);
        } else {
          setError("Không thể tải thông tin chương trình");
        }
      } catch (err) {
        console.error("Error fetching program detail:", err);
        setError("Có lỗi xảy ra khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchProgramDetail();
  }, [programId]);

  if (!user) {
    return null;
  }

  if (loading || !program) {
    return (
      <RoleBasedHeaderSidebar>
        <ProgramDetailSkeleton />
      </RoleBasedHeaderSidebar>
    );
  }

  if (error) {
    return (
      <RoleBasedHeaderSidebar>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-4">⚠️</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <Button onClick={() => router.back()} variant="outline">
              <LucideChevronLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách
            </Button>
          </div>
        </div>
      </RoleBasedHeaderSidebar>
    );
  }

  // Tính toán thống kê
  const totalLessons =
    program.chapters?.reduce((total, chapter) => {
      return total + (chapter.lessons?.length || 0);
    }, 0) || 0;

  return (
    <RoleBasedHeaderSidebar>
      <main className="min-h-screen py-8">
        <div className="container mx-auto px-6">
          {/* Breadcrumb và nút quay lại + chỉnh sửa */}
          <div className="mb-8 flex items-center justify-between flex-wrap gap-2">
            <Button
              variant="ghost"
              asChild
              className="p-0 hover:bg-transparent"
            >
              {window.history.length > 1 && (
                <Button
                  onClick={() => router.back()}
                  className="flex px-4 text-white items-center hover:bg-blue-700 hover:text-white transition-colors w-full sm:w-auto"
                >
                  <LucideChevronLeft className="h-4 w-4 mr-2" />
                  Quay lại danh sách chương trình
                </Button>
              )}
            </Button>
            <div className="flex gap-2">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl shadow-sm transition-all hover:shadow-md"
                asChild
              >
                <Link href={`/${locale}/manage/programs/${programId}/edit`}>
                  <LucideEdit className="h-4 w-4 mr-2" />
                  Chỉnh sửa chương trình
                </Link>
              </Button>
            </div>
          </div>

          {/* Nội dung chính */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            {/* Cột trái: Thống kê và ảnh bìa */}
            <div>
              <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white">
                {/* Ảnh bìa với aspect ratio 16:9 */}
                {program.image && (
                  <div className="relative w-full aspect-[16/9] bg-gray-100">
                    <Image
                      src={program.image}
                      alt={program.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Thông tin chương trình
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Thời gian học */}
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600">
                      <LucideClock className="h-4 w-4" />
                      Thời gian học
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {program.duration} tuần
                    </Badge>
                  </div>

                  {/* Số chương */}
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600">
                      <LucideBookOpen className="h-4 w-4" />
                      Số chương
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      {program.chapters?.length || 0} chương
                    </Badge>
                  </div>

                  {/* Tổng bài học */}
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600">
                      <LucideBookOpen className="h-4 w-4" />
                      Tổng bài học
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-purple-50 text-purple-700 border-purple-200"
                    >
                      {totalLessons} bài
                    </Badge>
                  </div>

                  {/* Số khóa học đã dùng chương trình */}
                  <div className="py-3 border-b border-gray-100">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-gray-600">
                        <LucideUsers className="h-4 w-4" />
                        Khóa học đã sử dụng
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-indigo-50 text-indigo-700 border-indigo-200 whitespace-nowrap"
                        >
                          {program.courses?.length || 0} khóa
                        </Badge>
                        {program.courses && program.courses.length > 0 && (
                          <div className="hidden sm:block">
                            <CoursesListModal courses={program.courses} />
                          </div>
                        )}
                      </div>
                    </div>
                    {program.courses && program.courses.length > 0 && (
                      <div className="mt-2 sm:hidden">
                        <CoursesListModal courses={program.courses} />
                      </div>
                    )}
                  </div>

                  {/* Trường học */}
                  {program.schools && program.schools.length > 0 && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <div className="flex items-center gap-2 text-gray-600">
                        <School className="h-4 w-4" />
                        Trường học
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-orange-50 text-orange-700 border-orange-200"
                      >
                        {program.schools[0].name}
                      </Badge>
                    </div>
                  )}

                  {/* Sắp xếp nhóm khóa học */}
                  <div className="flex justify-between items-center py-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <LucideMove className="h-4 w-4" />
                      Chia nhóm khóa học
                    </div>
                    <ArrangeCoursesFamilyDialog programId={String(programId)} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cột phải: Thông tin chi tiết */}
            <div>
              <Card className="border-0 shadow-sm rounded-2xl bg-white">
                <div className="p-6">
                  {/* Tiêu đề chương trình với badge mã nếu có */}
                  {(() => {
                    const match = /^(.*?)(\s*\(([^)]+)\))?$/.exec(
                      program.name || ""
                    );
                    const mainName = match ? match[1].trim() : program.name;
                    const badge = match && match[3] ? match[3] : null;
                    return (
                      <div className="flex items-center gap-3 mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 flex-1">
                          {mainName}
                        </h1>
                        {badge && (
                          <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-3 py-1 text-base font-semibold whitespace-nowrap">
                            {badge}
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-gray-900">
                        Mô tả chi tiết
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {program.description}
                      </p>
                    </div>

                    {program.target && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-gray-900">
                          Mục tiêu
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          {program.target}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Nội dung chương trình */}
          <Card className="border-0 shadow-sm rounded-2xl bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-gray-900">
                Nội dung chương trình
              </CardTitle>
            </CardHeader>
            <CardContent>
              <style jsx global>{`
                .program-detail-accordion .AccordionTrigger svg {
                  display: none !important;
                }
                .program-detail-accordion .AccordionTrigger {
                  pointer-events: none;
                  cursor: default;
                }
              `}</style>
              <Accordion
                type="multiple"
                className="w-full program-detail-accordion space-y-4"
                defaultValue={program.chapters?.map(
                  (chapter: any) => `chapter-${chapter.id}`
                )}
              >
                {(program.chapters as any[])
                  .slice()
                  .map((chapter: any, index: number) => (
                    <AccordionItem
                      key={chapter.id}
                      value={`chapter-${chapter.id}`}
                      className="border border-gray-200 rounded-2xl p-0 overflow-hidden"
                    >
                      <AccordionTrigger className="px-6 py-4 hover:no-underline bg-gray-50 text-left">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
                            Chương {index + 1}
                          </Badge>
                          <div className="flex-1 text-left">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {chapter.title}
                            </h3>
                            {chapter.description && (
                              <ExpandableDescription
                                description={chapter.description}
                                maxLines={3}
                                className="mt-1"
                              />
                            )}
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-gray-100 text-gray-600"
                          >
                            {chapter.lessons?.length || 0} bài
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 py-4 bg-white">
                        <div className="space-y-3">
                          {chapter.lessons && chapter.lessons.length > 0 ? (
                            chapter.lessons.map((lesson: any, idx: number) => {
                              const lessonTitle =
                                typeof lesson === "object" && lesson.title
                                  ? lesson.title
                                  : `Bài học #${lesson}`;
                              const lessonId =
                                typeof lesson === "object" ? lesson.id : lesson;

                              return (
                                <Link
                                  key={lessonId}
                                  href={`/${locale}/manage/programs/${programId}/lessons/${lessonId}`}
                                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 hover:bg-gray-50 rounded-xl transition-all border border-gray-100 hover:border-gray-200 hover:shadow-sm"
                                >
                                  <span className="font-bold text-blue-600 text-sm bg-blue-50 px-2 py-1 rounded-lg">
                                    Bài {idx + 1}
                                  </span>
                                  <div className="flex items-center gap-3">
                                    {(() => {
                                      const match =
                                        /^(.*?)(\s*\(([^)]+)\))?$/.exec(
                                          lessonTitle || ""
                                        );
                                      const mainTitle = match
                                        ? match[1].trim()
                                        : lessonTitle;
                                      const badge =
                                        match && match[3] ? match[3] : null;
                                      return (
                                        <div className="flex items-center gap-2 font-medium text-gray-900">
                                          <span>{mainTitle}</span>
                                          {badge && (
                                            <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap">
                                              {badge}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </Link>
                              );
                            })
                          ) : (
                            <div className="text-center py-8 text-gray-400">
                              <LucideBookOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                              <p>Chưa có bài học nào trong chương này</p>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
              </Accordion>

              {(!program.chapters || program.chapters.length === 0) && (
                <div className="text-center py-12">
                  <LucideBookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium mb-2">
                    Chưa có chương học nào
                  </p>
                  <p className="text-gray-400 text-sm mb-6">
                    Nhấn "Chỉnh sửa" để thêm nội dung cho chương trình
                  </p>
                  <Button asChild>
                    <Link href={`/${locale}/manage/programs/${programId}/edit`}>
                      <LucidePlus className="h-4 w-4 mr-2" />
                      Thêm chương đầu tiên
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </RoleBasedHeaderSidebar>
  );
}
