"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import { useToast } from "@/components/ui/use-toast";
import PreviewLecture from "@/app/[locale]/manage/lecture-bank/components/preview-lecture";
import {
  getLessonPlanById,
  getLessonPlanParts,
  updateLessonPlanComplete,
} from "@/lib/api/lectures";
import { GetLessonDetail } from "@/lib/api/lessons";
import { useTypedTranslations } from "@/lib/i18n/client";
import MobileOrientationGuard from "@/components/MobileOrientationGuard";

export default function PreviewLessonPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const t = useTypedTranslations("previewLecture");

  const lessonPlanId = params.id as string;
  // Read lesson_id and course_id from query parameters
  const lessonId = searchParams.get("lesson_id") || undefined;
  const courseId = searchParams.get("course_id") || undefined;

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
        const lessonPlanData = await getLessonPlanById(
          Number(lessonPlanId),
          courseId ? Number(courseId) : undefined
        );
        setLessonPlan(lessonPlanData);

        // Initialize completion status based on API response
        setIsCompleted(lessonPlanData.is_complete || false);

        const parts = await getLessonPlanParts(
          Number(lessonPlanId),
          courseId ? Number(courseId) : undefined
        );
        setLessonParts(parts);
      } catch (err) {
        console.error("Error fetching lesson plan:", err);
        setError(t("page.loadLessonError"));
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
        await updateLessonPlanComplete(
          lessonPlanId,
          false,
          courseId ? Number(courseId) : undefined
        ); // false means not completed
        setIsCompleted(false);
        toast({
          title: t("page.successTitle"),
          description: t("page.undoCompleteDesc"),
        });
      } else {
        await updateLessonPlanComplete(
          lessonPlanId,
          true,
          courseId ? Number(courseId) : undefined
        ); // true means completed
        setIsCompleted(true);
        toast({
          title: t("page.successTitle"),
          description: t("page.completeDesc"),
        });
      }
    } catch (err) {
      console.error("Error completing lesson:", err);
      toast({
        title: t("page.errorTitle"),
        description: t("page.completeErrorDesc"),
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <MobileOrientationGuard requireLandscape={true}>
        <PreviewLecture
          lessonPlanId={lessonPlanId}
          lessonId={lessonId}
          courseId={courseId}
          lessonPlan={lessonPlan as any}
          lessonParts={lessonParts as any}
          loading={loading}
          error={error}
          onCompleteLesson={handleCompleteLesson}
          isCompleting={isCompleting}
          isCompleted={isCompleted}
        />
      </MobileOrientationGuard>
    </div>
  );
}
