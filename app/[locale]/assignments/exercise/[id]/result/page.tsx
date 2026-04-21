"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getExerciseAnswersByStudent } from "@/lib/api/exercises";
import { useAuth } from "@/lib/context/auth-context";
import ExerciseResultLayout from "@/components/ui/exercise-result-layout";
import {
  convertApiDataToDisplay,
  DisplayExerciseResult,
} from "@/lib/utils/exercise-convert";

export default function ExerciseResultPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [result, setResult] = useState<DisplayExerciseResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchResult();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!params.id) {
        setError("Thiếu thông tin cần thiết");
        return;
      }
      const exerciseId = Number.parseInt(params.id as string);
      const response = await getExerciseAnswersByStudent({
        exercise_id: exerciseId,
        user_id: user?.id || 0,
      });
      const resultData = convertApiDataToDisplay(
        response.data.questions,
        response.data.overview,
        params.id as string,
        { includeFeedback: true, includePercentage: true }
      );
      setResult(resultData);
    } catch (error) {
      setError("Không thể tải kết quả. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ExerciseResultLayout
      result={result}
      loading={loading}
      error={error}
      onBack={() => router.back()}
      showFeedback={true}
      showSummary={true}
      summaryTitle="Kết quả bài kiểm tra"
    />
  );
}
