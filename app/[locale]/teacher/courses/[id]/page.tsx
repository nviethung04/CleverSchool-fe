"use client";

import React, { useEffect, useState, use as usePromise } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { GetCourseDetail, GetUsersInCourse } from "@/lib/api/courses";
import { useAuth } from "@/lib/context/auth-context";
import { useSetting } from "@/hooks/use-setting";
import { RoleBasedHeaderSidebar } from "@/components/layout/role-based-header-sidebar";
import { useRouter, useParams } from "next/navigation";
import { useTypedTranslations } from "@/lib/i18n/client";

import {
  LucideBookOpen,
  LucideChevronLeft,
  LucideEdit,
  LucideUsers,
  LucideClock,
  LucideCalendar,
  LucidePlus,
  LucideHeadphones,
  LucideBookText,
  LucideMic,
  LucideChevronUp,
  Video,
  FileQuestion,
  ClipboardList,
  FileText,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getGravatarUrl } from "@/utils/avatar";

// Skeleton components for loading state
function CourseDetailSkeleton() {
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

        {/* Tabs skeleton */}
        <div className="mb-8">
          <div className="bg-gray-100 rounded-xl p-1 mb-6">
            <div className="grid grid-cols-4 gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 bg-gray-200 rounded-lg animate-pulse"
                ></div>
              ))}
            </div>
          </div>

          {/* Content skeleton */}
          <Card className="border-0 shadow-sm rounded-2xl bg-white">
            <CardHeader className="pb-4">
              <div className="h-6 w-40 bg-gray-200 rounded-xl animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="border border-gray-200 rounded-xl p-6"
                  >
                    <div className="h-6 w-48 bg-gray-200 rounded-xl animate-pulse mb-4"></div>
                    <div className="space-y-3">
                      {Array.from({ length: 2 }).map((_, j) => (
                        <div
                          key={j}
                          className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl"
                        >
                          <div className="h-5 w-5 bg-gray-200 rounded-lg animate-pulse"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded-xl animate-pulse mb-2"></div>
                            <div className="h-3 w-2/3 bg-gray-200 rounded-xl animate-pulse"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

// Định nghĩa type cho student và teacher
interface Student {
  id: string;
  name: string;
  email: string;
  school: string;
  class?: string;
}
interface Teacher {
  id: string;
  name: string;
  email: string;
  school: string;
}

function CourseDetailContent({
  course,
  courseId,
  students,
  teachers,
  totalLessons,
  getCourseIcon,
  getGravatarUrl,
}: {
  course: any;
  courseId: string;
  students: Student[];
  teachers: Teacher[];
  totalLessons: number;
  getCourseIcon: (type: string) => React.ReactNode;
  getGravatarUrl: (
    name: string,
    size?: number,
    bgColor?: string,
    color?: string
  ) => string;
}) {
  const t = useTypedTranslations("teacherCourses");
  const { user } = useAuth();
  const { isEnabled: isChatCourseEnabled } = useSetting("chat_course");
  const router = useRouter();
  const urlParams = useParams() as { locale?: string };
  const locale = urlParams?.locale || "vi";
  // Thêm state cho clamp và expand description từng chương
  const [expandedDescriptions, setExpandedDescriptions] = useState<{
    [key: string]: boolean;
  }>({});
  const [shouldClampDescription, setShouldClampDescription] = useState<{
    [key: string]: boolean;
  }>({});

  return (
    <main className="min-h-screen py-8">
      <div className="container mx-auto px-6">
        {/* Breadcrumb và nút quay lại + chỉnh sửa + duplicate */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-2">
          {window.history.length > 1 && <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backButton")}
          </Button>}
          <div className="flex gap-2">
            {user?.type === "admin" && (
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl shadow-sm transition-all hover:shadow-md"
                asChild
              >
                <Link href={`/${locale}/manage/courses/${courseId}/edit`}>
                  <LucideEdit className="h-4 w-4 mr-2" />
                  {t("editCourse")}
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Thông tin khóa học */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <div>
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white">
              {/* Cover image with 16:9 aspect ratio */}
              <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-blue-50 to-indigo-100">
                <Image
                  src={course.image || "/placeholder.svg"}
                  alt={course.name || "Ảnh khóa học"}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-white/90 backdrop-blur text-orange-600 border-0 shadow-sm rounded-full px-3 py-1 font-medium text-xs">
                    {course.level}
                  </Badge>
                </div>
                <div className="absolute top-4 left-4">
                  <Badge
                    className={`border-0 shadow-sm rounded-full px-3 py-1 font-medium text-xs text-white ${course.status === "active"
                      ? "bg-green-500"
                      : course.status === "draft"
                        ? "bg-amber-500"
                        : "bg-gray-500"
                      }`}
                  >
                    {course.status === "active"
                      ? t("statusActive")
                      : course.status === "draft"
                        ? t("statusDraft")
                        : t("statusArchived")}
                  </Badge>
                </div>
              </div>

              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-gray-900">
                  {t("courseInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 text-sm">
                    <span className="text-gray-700">{t("students")}</span>
                    <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                      <LucideUsers className="h-4 w-4" />
                      <span className="font-semibold">{students.length}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 text-sm">
                    <span className="text-gray-700">{t("lessons")}</span>
                    <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs">
                      <LucideBookOpen className="h-4 w-4" />
                      <span className="font-semibold">{totalLessons}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 text-sm">
                    <span className="text-gray-700">{t("duration")}</span>
                    <div className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full text-xs">
                      <LucideClock className="h-4 w-4" />
                      <span className="font-semibold">{course.duration}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 text-sm">
                    <span className="text-gray-700">{t("start")}</span>
                    <div className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full font-semibold text-xs">
                      {course.start_date
                        ? course.start_date
                        : t("notAvailable")}
                    </div>
                  </div>
                </div>
                {(user?.type === "admin" ||
                  (user?.type === "teacher" && isChatCourseEnabled)) && (
                    <div className="pt-4 border-t border-gray-100">
                      <Button
                        variant="outline"
                        className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 hover:text-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
                        asChild
                      >
                        <Link
                          href={`/${locale}/courses/${courseId}/chat`}
                          className="flex items-center justify-center gap-2"
                        >
                          <MessageSquare className="h-4 w-4" />
                          {t("discussion")}
                        </Link>
                      </Button>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-0 shadow-sm rounded-2xl bg-white">
              <div className="p-6">
                {/* Tiêu đề khóa học với badge mã nếu có */}
                {(() => {
                  const match = /^(.*?)(\s*\(([^)]+)\))?$/.exec(
                    course.name || ""
                  );
                  const mainName = match ? match[1].trim() : course.name;
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
                      {t("detailedDescription")}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">
                      {t("target")}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {course.target}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Tabs nội dung khóa học */}
        <Tabs defaultValue="content" className="mb-8">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-xl p-1">
            <TabsTrigger
              value="content"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
            >
              {t("tabContent")}
            </TabsTrigger>
            <TabsTrigger
              value="students"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
            >
              {t("tabStudents")}
            </TabsTrigger>
            <TabsTrigger
              value="teachers"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
            >
              {t("tabTeachers")}
            </TabsTrigger>
            {/*<TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium">
              Phân tích
            </TabsTrigger>*/}
          </TabsList>

          <TabsContent value="content" className="mt-6">
            <Card className="border-0 shadow-sm rounded-2xl bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-900">
                  {t("courseContent")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <style jsx global>{`
                  .course-detail-accordion .AccordionTrigger svg {
                    display: none !important;
                  }
                  .course-detail-accordion .AccordionTrigger {
                    pointer-events: none;
                    cursor: default;
                  }
                `}</style>
                <Accordion
                  type="multiple"
                  className="w-full course-detail-accordion space-y-4"
                  defaultValue={course.chapters?.map(
                    (chapter: any) => `chapter-${chapter.id}`
                  )}
                >
                  {(course.chapters as any[])
                    .slice()
                    .map((chapter: any, index: number) => (
                      <AccordionItem
                        key={chapter.id}
                        value={`chapter-${chapter.id}`}
                        className="border border-gray-200 rounded-xl"
                      >
                        <AccordionTrigger className="hover:no-underline AccordionTrigger px-6 py-4 rounded-xl">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <div className="flex items-center gap-2">
                              {(() => {
                                const match = /^(.*?)(\s*\(([^)]+)\))?$/.exec(
                                  chapter.title || ""
                                );
                                const mainTitle = match
                                  ? match[1].trim()
                                  : chapter.title;
                                const badge =
                                  match && match[3] ? match[3] : null;
                                return (
                                  <>
                                    <span className="font-semibold text-gray-900">
                                      {mainTitle}
                                    </span>
                                    {badge && (
                                      <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap">
                                        {badge}
                                      </span>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200 rounded-full px-3 py-1"
                            >
                              {chapter.lessons.length} {t("lessonsLower")}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent forceMount className="px-6 pb-4">
                          {/* Hiển thị description với logic xem thêm/thu gọn */}
                          {chapter.description && (
                            <div className="mb-3">
                              <p
                                id={`desc-chapter-detail-${chapter.id}`}
                                ref={(el) => {
                                  if (
                                    el &&
                                    shouldClampDescription[chapter.id] ===
                                    undefined
                                  ) {
                                    el.classList.remove("line-clamp-3");
                                    const lineHeight = parseFloat(
                                      getComputedStyle(el).lineHeight
                                    );
                                    const height = el.offsetHeight;
                                    const lines = Math.round(
                                      height / lineHeight
                                    );
                                    setShouldClampDescription((prev) => ({
                                      ...prev,
                                      [chapter.id]: lines > 3,
                                    }));
                                  }
                                }}
                                className={
                                  "text-gray-600 text-sm leading-relaxed whitespace-pre-line " +
                                  (expandedDescriptions[chapter.id] ||
                                    !shouldClampDescription[chapter.id]
                                    ? ""
                                    : "line-clamp-3")
                                }
                                style={{
                                  cursor: shouldClampDescription[chapter.id]
                                    ? "pointer"
                                    : "default",
                                }}
                              >
                                {chapter.description}
                              </p>
                              {shouldClampDescription[chapter.id] && (
                                <button
                                  className="text-blue-600 hover:underline text-xs mt-1 focus:outline-none"
                                  type="button"
                                  onClick={() =>
                                    setExpandedDescriptions((prev) => ({
                                      ...prev,
                                      [chapter.id]: !prev[chapter.id],
                                    }))
                                  }
                                >
                                  {expandedDescriptions[chapter.id]
                                    ? t("collapse")
                                    : t("seeMore")}
                                </button>
                              )}
                            </div>
                          )}
                          <div className="space-y-3 pt-2">
                            {(chapter.lessons as any[])
                              .slice()
                              .map((lesson: any, idx: number) => (
                                <Link
                                  key={lesson.id}
                                  href={`/${locale}/manage/lessons/${lesson.id}?course_id=${courseId}`}
                                  className="flex gap-3 p-4 hover:bg-gray-50 rounded-xl transition-all border border-gray-100 hover:border-gray-200 hover:shadow-sm flex-col sm:flex-row items-start sm:items-center"
                                >
                                  <span className="font-bold text-blue-600 text-sm bg-blue-50 px-2 py-1 rounded-lg">
                                    {t("lesson")} {idx + 1}
                                  </span>
                                  <div className="flex items-center gap-3">
                                    {(() => {
                                      const match =
                                        /^(.*?)(\s*\(([^)]+)\))?$/.exec(
                                          lesson.title || ""
                                        );
                                      const mainTitle = match
                                        ? match[1].trim()
                                        : lesson.title;
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
                              ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="mt-6">
            <Card className="border-0 shadow-sm rounded-2xl bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-900">
                  {t("studentsList")}
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  {t("studentsCount", { count: students.length })}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {students.length === 0 ? (
                    <div className="text-center py-12">
                      <LucideUsers className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">
                        {t("noStudents")}
                      </p>
                    </div>
                  ) : (
                    students.map((student: Student) => (
                      <div
                        key={student.id}
                        className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 overflow-hidden flex-shrink-0">
                          <Image
                            src={getGravatarUrl(student.name, 48)}
                            alt={student.name}
                            width={48}
                            height={48}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">
                            {student.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {student.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            {student.school}
                            {student.class ? ` - ${student.class}` : ""}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teachers" className="mt-6">
            <Card className="border-0 shadow-sm rounded-2xl bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-900">
                  {t("teachersList")}
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  {t("teachersCount", { count: teachers.length })}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teachers.length === 0 ? (
                    <div className="text-center py-12">
                      <LucideUsers className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">
                        {t("noTeachers")}
                      </p>
                    </div>
                  ) : (
                    teachers.map((teacher: Teacher) => (
                      <div
                        key={teacher.id}
                        className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-100 to-emerald-200 overflow-hidden flex-shrink-0">
                          <Image
                            src={getGravatarUrl(teacher.name, 48)}
                            alt={teacher.name}
                            width={48}
                            height={48}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">
                            {teacher.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {teacher.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            {teacher.school}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card className="border-0 shadow-sm rounded-2xl bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-900">
                  Phân tích khóa học
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  Thống kê và phân tích về tiến độ học tập của học sinh trong
                  khóa học
                </p>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">
                    Tiến độ hoàn thành theo chương
                  </h3>
                  <div className="space-y-4">
                    {(course.chapters as any[]).map(
                      (chapter: any, index: number) => (
                        <div
                          key={chapter.id}
                          className="p-4 bg-gray-50 rounded-xl"
                        >
                          <div className="flex justify-between text-sm font-medium mb-2">
                            <span className="text-gray-700">
                              Chương {index + 1}:{" "}
                              {chapter.title?.split(":")[1]?.trim() ||
                                chapter.title}
                            </span>
                            <span className="text-blue-600 font-bold">
                              {Math.round(
                                (chapter.completed / chapter.lessons.length) *
                                100
                              )}
                              %
                            </span>
                          </div>
                          <Progress
                            value={Math.round(
                              (chapter.completed / chapter.lessons.length) * 100
                            )}
                            className="h-3 bg-white"
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-blue-700 mb-2">
                        {course.completion}%
                      </div>
                      <p className="text-sm text-blue-600 font-medium">
                        Tỷ lệ hoàn thành
                      </p>
                      <p className="text-xs text-blue-500 mt-1">
                        Trung bình của tất cả học sinh
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-green-700 mb-2">
                        45 phút
                      </div>
                      <p className="text-sm text-green-600 font-medium">
                        Thời gian học trung bình
                      </p>
                      <p className="text-xs text-green-500 mt-1">Mỗi ngày</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-purple-700 mb-2">
                        8.5/10
                      </div>
                      <p className="text-sm text-purple-600 font-medium">
                        Điểm trung bình
                      </p>
                      <p className="text-xs text-purple-500 mt-1">
                        Trong các bài kiểm tra
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = useAuth();
  const { id: courseId } = usePromise(params);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  useEffect(() => {
    // Nếu không có cache, gọi API với minimum loading time
    const startTime = Date.now();
    GetCourseDetail(courseId)
      .then((res) => {
        setCourse(res.data);
      })
      .finally(() => {
        // Đảm bảo shimmer effect hiển thị ít nhất 500ms
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);

        setTimeout(() => {
          setLoading(false);
        }, remainingTime);
      });
  }, [courseId]);

  useEffect(() => {
    if (!courseId) return;

    const startTime = Date.now();

    // Lấy danh sách học sinh và giáo viên trong khóa học
    const studentsPromise = GetUsersInCourse(3, Number(courseId)).then(
      (res) => {
        const arr = Array.isArray(res?.data.users) ? res.data.users : [];
        return arr.map((u: any) => ({
          id: String(u.id),
          name: u.name || u.username || "",
          email: u.email || "",
          school:
            typeof u.user_info?.school === "object"
              ? u.user_info?.school?.name || ""
              : u.user_info?.school || "",
          class:
            typeof u.user_info?.class === "object"
              ? u.user_info?.class?.name || ""
              : u.user_info?.class || "",
        }));
      }
    );

    const teachersPromise = GetUsersInCourse(2, Number(courseId)).then(
      (res) => {
        const arr = Array.isArray(res?.data.users) ? res.data.users : [];
        return arr.map((u: any) => ({
          id: String(u.id),
          name: u.name || u.username || "",
          email: u.email || "",
          school:
            typeof u.user_info?.school === "object"
              ? u.user_info?.school?.name || ""
              : u.user_info?.school || "",
        }));
      }
    );

    Promise.all([studentsPromise, teachersPromise]).then(
      ([students, teachers]) => {
        // Đảm bảo loading tối thiểu 300ms cho users data
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 300 - elapsedTime);

        setTimeout(() => {
          setStudents(students);
          setTeachers(teachers);
        }, remainingTime);
      }
    );
  }, [courseId]);

  const [expandedLesson, setExpandedLesson] = useState<{
    chapterId: number | null;
    lessonIndex: number | null;
  }>({
    chapterId: null,
    lessonIndex: null,
  });

  const toggleLessonDetail = (chapterId: number, lessonIndex: number) => {
    if (
      expandedLesson.chapterId === chapterId &&
      expandedLesson.lessonIndex === lessonIndex
    ) {
      setExpandedLesson({ chapterId: null, lessonIndex: null });
    } else {
      setExpandedLesson({ chapterId, lessonIndex });
    }
  };

  const getCourseIcon = (type: string) => {
    switch (type) {
      case "listening":
        return <LucideHeadphones className="h-5 w-5" />;
      case "speaking":
        return <LucideMic className="h-5 w-5" />;
      case "reading":
        return <LucideBookText className="h-5 w-5" />;
      case "writing":
        return <LucideBookOpen className="h-5 w-5" />;
      default:
        return <LucideBookOpen className="h-5 w-5" />;
    }
  };
  const totalLessons = Array.isArray(course?.chapters)
    ? course.chapters.reduce(
      (sum: number, chapter: any) =>
        sum + (Array.isArray(chapter.lessons) ? chapter.lessons.length : 0),
      0
    )
    : 0;

  if (!user) return null;

  return (
    <RoleBasedHeaderSidebar>
      {loading || !course ? (
        <CourseDetailSkeleton />
      ) : (
        <CourseDetailContent
          course={course}
          courseId={courseId}
          students={students}
          teachers={teachers}
          totalLessons={totalLessons}
          getCourseIcon={getCourseIcon}
          getGravatarUrl={getGravatarUrl}
        />
      )}
    </RoleBasedHeaderSidebar>
  );
}
