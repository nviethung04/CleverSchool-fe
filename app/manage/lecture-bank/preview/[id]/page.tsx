"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import { useToast } from "@/components/ui/use-toast";
import PreviewLecture from "@/app/manage/lecture-bank/components/preview-lecture";
import {
  getLessonPlanById,
  getLessonPlanParts,
  updateLessonPlanComplete,
} from "@/lib/api/lectures";
import { GetLessonDetail } from "@/lib/api/lessons";

export default function PreviewLessonPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  const lessonPlanId = params.id as string;
  // Read lesson_id from query parameters
  const lessonId = searchParams.get("lesson_id") || undefined;

  const [lessonPlan, setLessonPlan] = useState<any>(null);
  const [lessonParts, setLessonParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Fetch lesson plan data
  useEffect(() => {
    const fetchLessonPlan = async () => {
      try {
        setLoading(true);
        const lessonPlanData = await getLessonPlanById(Number(lessonPlanId));
        setLessonPlan(lessonPlanData);

        // Initialize completion status based on API response
        setIsCompleted(lessonPlanData.is_complete || false);

        const parts = await getLessonPlanParts(Number(lessonPlanId));
        setLessonParts(parts);
      } catch (err) {
        console.error("Error fetching lesson plan:", err);
        setError("Không thể tải dữ liệu bài giảng");
      } finally {
        setLoading(false);
      }
    };

    if (lessonPlanId) {
      fetchLessonPlan();
    }
  }, [lessonPlanId]);

  const handleCompleteLesson = async () => {
    setIsCompleting(true);
    try {
      if (isCompleted) {
        await updateLessonPlanComplete(lessonPlanId, false); // false means not completed
        setIsCompleted(false);
        toast({
          title: "Thành công",
          description: "Đã hoàn tác hoàn thành bài giảng.",
        });
      } else {
        await updateLessonPlanComplete(lessonPlanId, true); // true means completed
        setIsCompleted(true);
        toast({ title: "Thành công", description: "Đã hoàn thành bài giảng." });
      }
    } catch (err) {
      console.error("Error completing lesson:", err);
      toast({
        title: "Lỗi",
        description: "Không thể hoàn thành bài giảng. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <PreviewLecture
        lessonPlanId={lessonPlanId}
        lessonId={lessonId}
        lessonPlan={lessonPlan as any}
        lessonParts={lessonParts as any}
        loading={loading}
        error={error}
        onCompleteLesson={handleCompleteLesson}
        isCompleting={isCompleting}
        isCompleted={isCompleted}
      />
    </div>
  );
}
