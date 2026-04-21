"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getExamAnswersByStudent } from "@/lib/api/exam-answers";
import { useAuth } from "@/lib/context/auth-context";
import ExamResultLayout from "@/components/ui/exam-result-layout";
import {
  convertApiDataToDisplay,
  DisplayExamResult,
} from "@/lib/utils/exam-convert";

export default function ExamResultPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [result, setResult] = useState<DisplayExamResult | null>(null);
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
      const examId = Number.parseInt(params.id as string);
      const response = await getExamAnswersByStudent({
        exam_id: examId,
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
    <ExamResultLayout
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
