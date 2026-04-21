"use client"

import { useState } from "react"
import { useAuth } from "@/lib/context/auth-context"
import { useRouter } from "next/navigation"
import LectureForm from "@/app/[locale]/manage/lecture-bank/components/lecture-form"
import { createLessonPlan, createLessonPlanPart } from "@/lib/api/lectures"
import { useToast } from "@/components/ui/use-toast"
import { getLectureRoute } from "@/lib/utils/route-utils"

export default function CreateLecturePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitProgress, setSubmitProgress] = useState(0)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")

  const handleSubmit = async (data: {
    title: string
    description: string
    status: "1" | "2"
    coverImageUrl: string
    sections: any[]
    totalTime: number
  }) => {
    setIsSubmitting(true)
    setSubmitStatus("uploading")
    setSubmitProgress(10)

    try {
      const statusValue = Number.parseInt(data.status, 10)
      const lessonPlanData = {
        name: data.title,
        description: data.description,
        status: statusValue,
        sort_position: 1,
        total_time: data.totalTime,
        lesson_id: 1,
        cover_image: data.coverImageUrl || "",
      }

      setSubmitProgress(30)
      const lessonPlanResponse = await createLessonPlan(lessonPlanData)
      const lessonPlanId =
        lessonPlanResponse?.Data?.id ||
        lessonPlanResponse?.data?.id ||
        lessonPlanResponse?.id ||
        (typeof lessonPlanResponse === "object" && lessonPlanResponse !== null
          ? (() => {
              const first = Object.values(lessonPlanResponse)[0]
              return first && typeof first === "object" && first !== null && "id" in first
                ? (first as { id: string | number }).id
                : null
            })()
          : null)

      if (!lessonPlanId) {
        throw new Error("Không nhận được ID bài giảng từ server")
      }

      setSubmitProgress(50)

      for (let i = 0; i < data.sections.length; i++) {
        const section = data.sections[i]
        const partData = {
          lesson_plan_id: lessonPlanId,
          title: section.title,
          tag: section.tags.join(","),
          cover_image: "",
          file: section.files.length > 0 ? section.files[0].name : "",
          sort_position: i + 1,
          time: section.time,
          is_classwork: true,
          file_type: section.type,
          link: section.fileUrl || section.url,
          link_type: section.contentType,
          guide_teacher: section.teacherNotes,
          guide_student: section.studentInstructions,
        }

        await createLessonPlanPart(partData)
        setSubmitProgress(50 + Math.floor(((i + 1) / data.sections.length) * 50))
      }

      setSubmitStatus("success")
      setSubmitProgress(100)
      toast({
        title: "Thành công",
        description: "Bài giảng đã được tạo thành công!",
        variant: "default",
      })

      // Redirect to lecture bank after successful creation
      setTimeout(() => {
        router.push(getLectureRoute(user));
      }, 1500)
    } catch (error: any) {
      setSubmitStatus("error")
      toast({
        title: "Lỗi",
        description: error.message || "Đã xảy ra lỗi khi tạo bài giảng. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push(getLectureRoute(user));
  }

  return (
      <div className="min-h-screen">
        <div className="resp-container resp-py-6">
          <LectureForm
            mode="create"
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            submitProgress={submitProgress}
            submitStatus={submitStatus}
          />
        </div>
      </div>
  )
}
