"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import LectureForm from "@/app/[locale]/manage/lecture-bank/components/lecture-form";
import {
  updateLessonPlan,
  updateLessonPlanPart,
  createLessonPlanPart,
  deleteLessonPlanPart,
  getLessonPlanById,
  getLessonPlanParts,
  type LessonPlanPart,
} from "@/lib/api/lectures";
import { useToast } from "@/components/ui/use-toast";
import { getLectureRoute } from "@/lib/utils/route-utils";

interface LessonSection {
  id: string;
  title: string;
  type: string;
  contentType: string;
  url: string;
  teacherNotes: string;
  studentInstructions: string;
  files: File[];
  time: number;
  tags: string[];
  fileUrl?: string;
  originalId?: number;
  sortPosition?: number;
  is_program?: boolean;
}

export default function EditLecturePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const lectureId = params.id as string;
  const courseId = searchParams.get("course_id");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [initialData, setInitialData] = useState<{
    title: string;
    description: string;
    status: "1" | "2";
    coverImageUrl: string;
    sections: LessonSection[];
  } | null>(null);
  const [originalParts, setOriginalParts] = useState<LessonPlanPart[]>([]);

  // Load existing lecture data
  useEffect(() => {
    const loadLectureData = async () => {
      try {
        setIsLoadingData(true);
        const lessonPlan = await getLessonPlanById(
          Number.parseInt(lectureId),
          courseId || undefined
        );

        if (lessonPlan) {
          // Get lesson plan parts
          try {
            const parts = await getLessonPlanParts(
              Number.parseInt(lectureId),
              courseId || undefined
            );

            // Lưu trữ danh sách parts ban đầu để so sánh khi submit
            setOriginalParts(parts || []);

            let sections: LessonSection[] = [];
            if (parts && parts.length > 0) {
              // Sort parts by sort_position to maintain order
              const sortedParts = parts.sort((a, b) => {
                const posA =
                  typeof a.sort_position === "string"
                    ? Number.parseInt(a.sort_position)
                    : a.sort_position || 0;
                const posB =
                  typeof b.sort_position === "string"
                    ? Number.parseInt(b.sort_position)
                    : b.sort_position || 0;
                return posA - posB;
              });

              sections = sortedParts.map((part: any, index: number) => ({
                id: `section-${part.id}`, // Use original ID to maintain consistency
                originalId: part.id,
                title: part.title || `Phần ${index + 1}`,
                type: part.file_type || "video",
                contentType: part.link_type || "youtube",
                url: part.link || "",
                teacherNotes: part.guide_teacher || "",
                studentInstructions: part.guide_student || "",
                files: [],
                time:
                  typeof part.time === "string"
                    ? Number.parseInt(part.time, 10)
                    : part.time || 10,
                tags: part.tag
                  ? part.tag
                      .split(",")
                      .map((t: string) => t.trim())
                      .filter(Boolean)
                  : [],
                fileUrl: part.link || "",
                sortPosition:
                  typeof part.sort_position === "string"
                    ? Number.parseInt(part.sort_position)
                    : part.sort_position || index + 1,
                is_program: part.is_program || false,
              }));
            } else {
              // Default sections if none exist
              sections = [
                {
                  id: "section-new-1",
                  title: "Warm Up",
                  type: "video",
                  contentType: "youtube",
                  url: "",
                  teacherNotes:
                    "Bắt đầu bài học bằng video để thu hút sự chú ý của học sinh.",
                  studentInstructions:
                    "Xem video và chuẩn bị trả lời các câu hỏi.",
                  files: [],
                  time: 10,
                  tags: ["warm-up", "introduction"],
                  sortPosition: 1,
                  is_program: false,
                },
                {
                  id: "section-new-2",
                  title: "Presentation",
                  type: "slides",
                  contentType: "powerpoint",
                  url: "",
                  teacherNotes:
                    "Sử dụng các slide để giới thiệu từ vựng và cấu trúc ngữ pháp mới.",
                  studentInstructions:
                    "Ghi chú các từ vựng và cấu trúc ngữ pháp mới.",
                  files: [],
                  time: 15,
                  tags: ["presentation", "vocabulary"],
                  sortPosition: 2,
                  is_program: false,
                },
                {
                  id: "section-new-3",
                  title: "Practice",
                  type: "interactive",
                  contentType: "quiz",
                  url: "",
                  teacherNotes:
                    "Hướng dẫn học sinh thực hành với các hoạt động tương tác.",
                  studentInstructions:
                    "Hoàn thành các hoạt động theo hướng dẫn.",
                  files: [],
                  time: 15,
                  tags: ["practice", "activity"],
                  sortPosition: 3,
                  is_program: false,
                },
              ];
            }

            setInitialData({
              title: lessonPlan.name || "",
              description: lessonPlan.description || "",
              status: lessonPlan.status === 1 ? "1" : "2",
              coverImageUrl: lessonPlan.cover_image || "",
              sections,
            });
          } catch (partError) {
            console.warn("Error loading lesson parts:", partError);
            // Set default data if parts loading fails
            setInitialData({
              title: lessonPlan.name || "",
              description: lessonPlan.description || "",
              status: lessonPlan.status === 1 ? "1" : "2",
              coverImageUrl: lessonPlan.cover_image || "",
              sections: [
                {
                  id: "section-new-1",
                  title: "Warm Up",
                  type: "video",
                  contentType: "youtube",
                  url: "",
                  teacherNotes:
                    "Bắt đầu bài học bằng video để thu hút sự chú ý của học sinh.",
                  studentInstructions:
                    "Xem video và chuẩn bị trả lời các câu hỏi.",
                  files: [],
                  time: 10,
                  tags: ["warm-up", "introduction"],
                  sortPosition: 1,
                  is_program: false,
                },
                {
                  id: "section-new-2",
                  title: "Presentation",
                  type: "slides",
                  contentType: "powerpoint",
                  url: "",
                  teacherNotes:
                    "Sử dụng các slide để giới thiệu từ vựng và cấu trúc ngữ pháp mới.",
                  studentInstructions:
                    "Ghi chú các từ vựng và cấu trúc ngữ pháp mới.",
                  files: [],
                  time: 15,
                  tags: ["presentation", "vocabulary"],
                  sortPosition: 2,
                  is_program: false,
                },
                {
                  id: "section-new-3",
                  title: "Practice",
                  type: "interactive",
                  contentType: "quiz",
                  url: "",
                  teacherNotes:
                    "Hướng dẫn học sinh thực hành với các hoạt động tương tác.",
                  studentInstructions:
                    "Hoàn thành các hoạt động theo hướng dẫn.",
                  files: [],
                  time: 15,
                  tags: ["practice", "activity"],
                  sortPosition: 3,
                  is_program: false,
                },
              ],
            });
          }
        }
      } catch (error) {
        console.error("Error loading lecture data:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu bài giảng",
          variant: "destructive",
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    if (lectureId) {
      loadLectureData();
    }
  }, [lectureId, toast]);

  const handleSubmit = async (data: {
    title: string;
    description: string;
    status: "1" | "2";
    coverImageUrl: string;
    sections: LessonSection[];
    totalTime: number;
  }) => {
    setIsSubmitting(true);
    setSubmitStatus("uploading");
    setSubmitProgress(10);

    try {
      const statusValue = Number.parseInt(data.status, 10);
      const lessonPlanData = {
        name: data.title,
        description: data.description,
        status: statusValue,
        sort_position: 1,
        total_time: data.totalTime,
        lesson_id: 1,
        cover_image: data.coverImageUrl || "",
      };

      setSubmitProgress(30);
      const lessonPlanResponse = await updateLessonPlan(
        Number.parseInt(lectureId),
        lessonPlanData
      );

      if (!lessonPlanResponse) {
        throw new Error(
          "Không nhận được phản hồi từ server khi cập nhật bài giảng"
        );
      }

      setSubmitProgress(50);

      // Tạo danh sách IDs của sections hiện tại (cả existing và new)
      const currentSectionIds = new Set<number>();
      data.sections.forEach((section) => {
        if (section.originalId) {
          currentSectionIds.add(section.originalId);
        }
      });

      // Xác định các parts cần xóa (có trong original nhưng không có trong current)
      const partsToDelete = originalParts.filter(
        (part) => !currentSectionIds.has(part.id as number)
      );

      // Xóa các parts không còn tồn tại
      for (const part of partsToDelete) {
        try {
          await deleteLessonPlanPart(part.id as number, courseId || undefined);
        } catch (error) {
          console.warn(`Failed to delete part ${part.id}:`, error);
        }
      }

      setSubmitProgress(60);

      // Handle lesson plan parts with proper ordering
      for (let i = 0; i < data.sections.length; i++) {
        const section = data.sections[i];
        const partData = {
          lesson_plan_id: Number.parseInt(lectureId),
          title: section.title,
          tag: section.tags.join(","),
          cover_image: "",
          file: section.files.length > 0 ? section.files[0].name : "",
          sort_position: i + 1, // Use array index + 1 to maintain order
          time: section.time,
          is_classwork: true,
          file_type: section.type,
          link: section.fileUrl || section.url,
          link_type: section.contentType,
          guide_teacher: section.teacherNotes,
          guide_student: section.studentInstructions,
        };

        if (section.originalId) {
          // Update existing part
          await updateLessonPlanPart(
            section.originalId,
            partData,
            courseId || undefined
          );
        } else {
          // Create new part
          await createLessonPlanPart(partData, courseId || undefined);
        }

        setSubmitProgress(
          60 + Math.floor(((i + 1) / data.sections.length) * 40)
        );
      }

      setSubmitStatus("success");
      setSubmitProgress(100);
      toast({
        title: "Thành công",
        description: "Bài giảng đã được cập nhật thành công!",
        variant: "default",
      });

      // Redirect to lecture bank after successful update
      setTimeout(() => {
        router.push(getLectureRoute(user));
      }, 1500);
    } catch (error: any) {
      setSubmitStatus("error");
      toast({
        title: "Lỗi",
        description:
          error.message ||
          "Đã xảy ra lỗi khi cập nhật bài giảng. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(getLectureRoute(user));
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen">
        <div className="resp-container resp-py-6">
          <div className="min-h-screen bg-gray-50/30">
            <main className="container mx-auto px-6 py-8">
              <div className="mb-12">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Chỉnh sửa bài giảng
                  </h1>
                  <p className="text-gray-500 font-medium">
                    Đang tải dữ liệu bài giảng...
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-xl flex items-center justify-center">
                    <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-sm font-medium text-blue-900">
                    Đang tải...
                  </span>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="min-h-screen">
        <div className="resp-container resp-py-6">
          <div className="min-h-screen bg-gray-50/30">
            <main className="container mx-auto px-6 py-8">
              <div className="mb-12">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Chỉnh sửa bài giảng
                  </h1>
                  <p className="text-gray-500 font-medium">
                    Không thể tải dữ liệu bài giảng
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-red-600 mb-4">
                    Đã xảy ra lỗi khi tải dữ liệu bài giảng.
                  </p>
                  <button
                    onClick={() => router.push(getLectureRoute(user))}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Quay lại danh sách
                  </button>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="resp-container resp-py-6">
        <LectureForm
          mode="edit"
          lectureId={lectureId}
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          submitProgress={submitProgress}
          submitStatus={submitStatus}
          courseId={courseId}
          isReadonly={false}
          hasCourseId={Boolean(courseId)}
        />
      </div>
    </div>
  );
}
