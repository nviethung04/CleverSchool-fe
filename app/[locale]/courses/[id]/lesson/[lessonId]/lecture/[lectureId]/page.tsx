"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getLessonPlanById,
  getLessonPlanParts,
  LessonPlan,
  LessonPlanPart,
} from "@/lib/api/lectures";
import PreviewLecture from "@/app/[locale]/manage/lecture-bank/components/preview-lecture";
import MobileOrientationGuard from "@/components/MobileOrientationGuard";

export default function LecturePreviewPage() {
  const params = useParams() as {
    id: string;
    lessonId: string;
    lectureId: string;
  };
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [lessonParts, setLessonParts] = useState<LessonPlanPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const plan = await getLessonPlanById(
          Number(params.lectureId),
          Number(params.id)
        );
        // Ép kiểu id về number cho khớp interface
        setLessonPlan(plan ? { ...plan, id: Number(plan.id) } : null);
        const parts = await getLessonPlanParts(
          Number(params.lectureId),
          Number(params.id)
        );
        setLessonParts(
          parts.map((p) => ({
            ...p,
            id: Number(p.id),
            lesson_plan_id: Number(p.lesson_plan_id),
            sort_position: Number(p.sort_position),
            time: Number(p.time),
          }))
        );
      } catch (e: any) {
        setError(e?.message || "Lỗi tải dữ liệu bài giảng");
      } finally {
        setLoading(false);
      }
    }
    if (params.lectureId) fetchData();
  }, [params.lectureId]);

  return (
    <MobileOrientationGuard requireLandscape={true}>
      <PreviewLecture
        lessonPlanId={params.lectureId}
        lessonId={params.lessonId}
        lessonPlan={lessonPlan as any}
        lessonParts={lessonParts as any}
        loading={loading}
        error={error}
      />
    </MobileOrientationGuard>
  );
}
