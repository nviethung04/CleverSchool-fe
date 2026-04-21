"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardHeader } from "@/components/dashboard-header";
import Image from "next/image";
import { Link } from "@/lib/i18n/routing";
import { useTranslations } from "next-intl";
import { LucideBookOpen, LucideClock, LucideCheck } from "lucide-react";
import { GetCourseList } from "@/lib/api/courses";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/context/auth-context";

export default function CoursesPage() {
  const t = useTranslations("coursesPage");
  const tCommon = useTranslations("common");
  const { toast } = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch dữ liệu khóa học theo mẫu bạn gửi
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        // Gọi API để lấy danh sách khóa học
        // GetCourseList sẽ tự động set by_user dựa trên role user:
        // - Admin: by_user = false (xem tất cả khóa học)
        // - Teacher/Student: by_user = true (chỉ xem khóa học đã tham gia)
        const coursesResponse = await GetCourseList();
        if (
          coursesResponse.code === 200 &&
          coursesResponse.data &&
          Array.isArray(coursesResponse.data.courses)
        ) {
          setCourses(coursesResponse.data.courses);
        } else {
          console.error(
            "Unexpected courses response structure:",
            coursesResponse
          );
        }
      } catch (err) {
        console.error("Error fetching courses:", err);
        toast({
          title: tCommon("error"),
          description: t("loadError"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [toast]);

  return (
    <div className="min-h-screen">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Khóa học đã tham gia */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {t("joinedCoursesTitle")}
              </h2>
              <p className="text-gray-600">{t("joinedCoursesSubtitle")}</p>
            </div>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-[360px]">
                  <div className="bg-white rounded-3xl overflow-hidden shadow-sm flex flex-col">
                    <div className="relative h-[160px]">
                      <Skeleton className="absolute inset-0 w-full h-full" />
                      <div className="absolute top-2 right-2">
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                      <div className="absolute top-2 left-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                    </div>
                    <div className="p-4">
                      <Skeleton className="h-6 w-40 mb-2" />
                      <Skeleton className="h-4 w-56 mb-4" />
                      <div className="flex gap-2 mb-4">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                      <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : courses.length > 0 ? (
            <div className="flex flex-wrap gap-6">
              {courses.map((course) => (
                <CourseCard key={course.id || course.Id} course={course} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LucideBookOpen className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("emptyTitle")}
              </h3>
              <p className="text-gray-500 mb-4">{t("emptyDesc")}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function CourseCard({ course }: { course: any }) {
  const { user } = useAuth();
  const t = useTranslations("coursesPage");

  // Lấy các trường dữ liệu, fallback nếu key viết hoa/thường
  const title =
    course.title ||
    course.Title ||
    course.name ||
    course.Name ||
    t("courseNameFallback");
  const description = course.description || course.Description || "";
  const image = course.image || course.Image || "/placeholder.svg";
  const level = course.level || course.Level || "";
  const duration = course.duration || course.Duration || "";
  // Tính tổng số bài học từ các chương
  const lessons = Array.isArray(course.chapters)
    ? course.chapters.reduce(
        (sum: number, chapter: any) =>
          sum + (Array.isArray(chapter.lessons) ? chapter.lessons.length : 0),
        0
      )
    : 0;
  const progress = course.progress ?? course.Progress ?? 0;
  const status = course.status || course.Status || "not-started";
  const id = course.id || course.Id;

  // Ensure progress is 0 for not-started courses
  const displayProgress =
    status === "not-started" || status === "suggested" ? 0 : progress;

  const isEnrolled = status !== "not-started" && status !== "suggested";

  return (
    <Card className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:border-emerald-200 flex flex-col w-[360px]">
      <div className="relative h-[160px]">
        <Image src={image} alt={title} fill className="object-cover" />
        <div className="absolute top-2 right-2">
          <Badge className="bg-white text-orange-500">{level}</Badge>
        </div>
        {status && status !== "suggested" && (
          <div className="absolute top-2 left-2">
            <Badge
              className={
                status === "completed"
                  ? "bg-green-500"
                  : status === "in-progress"
                  ? "bg-blue-500"
                  : "bg-gray-500"
              }
            >
              {status === "completed"
                ? t("statusCompleted")
                : status === "in-progress"
                ? t("statusInProgress")
                : t("statusNotStarted")}
            </Badge>
          </div>
        )}
        {status === "suggested" && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-emerald-500">{t("suggested")}</Badge>
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {(() => {
            const match = /^(.*?)(\s*\(([^)]+)\))?$/.exec(title || "");
            const mainTitle = match ? match[1].trim() : title;
            const badge = match && match[3] ? match[3] : null;
            return (
              <>
                {mainTitle}
                {badge && !(user?.type === "student") && (
                  <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-3 py-1 text-base font-semibold whitespace-nowrap ml-2">
                    {badge}
                  </span>
                )}
              </>
            );
          })()}
        </CardTitle>
        <CardDescription className="min-h-[4.5em] line-clamp-2 overflow-hidden">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <LucideClock className="h-3 w-3" />
            {duration}
          </Badge>

          <Badge variant="outline" className="text-xs">
            {lessons} {t("lessonsUnit")}
          </Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full bg-orange-500 hover:bg-orange-600" asChild>
          <Link href={`/courses/${id}`}>
            {status === "suggested" ? (
              <>
                <LucideBookOpen className="mr-2 h-4 w-4" />
                {t("exploreNow")}
              </>
            ) : displayProgress > 0 ? (
              <>
                <LucideCheck className="mr-2 h-4 w-4" />
                {t("continue")}
              </>
            ) : (
              <>
                <LucideBookOpen className="mr-2 h-4 w-4" />
                {t("details")}
              </>
            )}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
