import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Trophy, FileText, Clock, User } from "lucide-react";
import ExamQuestionDisplay from "@/components/ui/exam-question-display";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

import type { DisplayExamResult } from "@/lib/utils/exam-convert";

interface ExamResultLayoutProps {
  result?: DisplayExamResult | null;
  loading?: boolean;
  error?: string | null;
  onBack?: () => void;
  showFeedback?: boolean;
  showSummary?: boolean;
  summaryTitle?: string;
  children?: React.ReactNode;
}

const ExamResultLayout: React.FC<ExamResultLayoutProps> = ({
  result,
  loading,
  error,
  onBack,
  showFeedback = false,
  showSummary = true,
  summaryTitle = "Kết quả tổng quan",
  children,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getGradeColor = (percentage?: number | null) => {
    if (!percentage && percentage !== 0) return "text-gray-600";
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 80) return "text-blue-600";
    if (percentage >= 70) return "text-yellow-600";
    if (percentage >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getGradeText = (percentage?: number | null) => {
    if (!percentage && percentage !== 0) return "";
    if (percentage >= 90) return "Xuất sắc";
    if (percentage >= 80) return "Giỏi";
    if (percentage >= 70) return "Khá";
    if (percentage >= 60) return "Trung bình";
    return "Yếu";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="w-full max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left: Summary Skeleton */}
            <div className="space-y-6">
              <Skeleton className="h-10 w-40 mb-2" />
              <Skeleton className="h-16 w-32 mx-auto mb-4" />
              <Skeleton className="h-6 w-24 mx-auto mb-2" />
              <Skeleton className="h-4 w-32 mx-auto mb-2" />
              <Skeleton className="h-4 w-24 mx-auto mb-2" />
              <Skeleton className="h-4 w-40 mx-auto mb-2" />
              <Skeleton className="h-4 w-32 mx-auto mb-2" />
              <Skeleton className="h-4 w-24 mx-auto mb-2" />
            </div>
            {/* Right: Questions Skeleton */}
            <div className="md:col-span-2 space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-10 w-full mb-2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-32 rounded-full" />
                    <Skeleton className="h-8 w-32 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Không tìm thấy kết quả</p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* Header */}
      <div className="bg-white shadow-md border-b rounded-b-3xl">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="lg"
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900 rounded-full shadow-md transition-all hover:bg-blue-100"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Quay lại
              </Button>
              <Separator orientation="vertical" className="h-8" />
              <div>
                <h1 className="text-lg sm:text-2xl font-extrabold text-blue-600 drop-shadow-lg">
                  {summaryTitle}
                </h1>
                <p className="text-xs sm:text-base text-gray-500 font-medium">
                  {result.examTitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <div className="grid grid-cols-12 gap-6 sm:gap-8 min-w-0">
          {/* Left Sidebar - Result Summary & Teacher Feedback */}
          <div className="col-span-12 md:col-span-4 lg:col-span-3">
            <div className="sticky top-8 max-h-[calc(100vh-6rem)] overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-50 hover:scrollbar-thumb-blue-500 scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
              {/* Score Summary */}
              {showSummary && (
                <Card className="border-2 border-blue-200 rounded-2xl shadow-xl">
                  <CardHeader className="bg-blue-50 pb-3 rounded-t-2xl">
                    <CardTitle className="flex items-center text-lg">
                      <Trophy className="h-5 w-5 mr-2 text-blue-600" />
                      {summaryTitle}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-5">
                    <div className="text-center">
                      <div
                        className={`text-4xl font-bold ${getGradeColor(
                          result.percentage
                        )}`}
                      >
                        {result.totalScore}
                        {result.maxScore ? "/" + result.maxScore : ""}
                      </div>
                      {typeof result.percentage !== "undefined" && (
                        <div
                          className={`text-lg font-medium ${getGradeColor(
                            result.percentage
                          )}`}
                        >
                          {result.percentage}% -{" "}
                          {getGradeText(result.percentage)}
                        </div>
                      )}
                    </div>
                    <Progress
                      value={
                        typeof result?.percentage === "number"
                          ? result.percentage
                          : 0
                      }
                      className="w-full"
                    />
                    <Separator />
                    <div className="space-y-4 text-base">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          Học sinh:
                        </span>
                        <div className="flex items-center space-x-2">
                          <img
                            src="/avatar-kid.png"
                            alt="Avatar"
                            className="w-9 h-9 rounded-full border-2 border-blue-300 shadow"
                          />
                          <span className="font-bold text-blue-700">
                            {result.studentName}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Thời gian làm bài:
                        </span>
                        <span className="font-semibold text-indigo-700">
                          {formatTime(result.timeSpent)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Nộp bài lúc:</span>
                        <span className="font-semibold text-pink-700">
                          {new Date(result.submittedAt).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Tổng câu hỏi:</span>
                        <span className="font-semibold text-blue-700">
                          {result.totalQuestions}
                        </span>
                      </div>
                      {result.overview && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Trạng thái:</span>
                          <Badge
                            variant={
                              result.status === "graded"
                                ? "default"
                                : "secondary"
                            }
                            className={`px-3 py-1 rounded-full shadow ${
                              result.status === "graded"
                                ? "bg-green-200 text-green-800 animate-pulse"
                                : "bg-yellow-200 text-yellow-800"
                            }`}
                          >
                            {result.status === "graded" ? "Đã chấm" : "Đã nộp"}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Teacher Feedback */}
              {result.feedback && (
                <Card className="border-2 border-green-200 rounded-2xl shadow-lg">
                  <CardHeader className="bg-green-50 pb-3 rounded-t-2xl">
                    <CardTitle className="flex items-center text-lg">
                      <FileText className="h-5 w-5 mr-2 text-green-600" />
                      Nhận xét của giáo viên
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-gray-700 text-base leading-relaxed">
                      {result.feedback}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Question Navigation */}
              <Card className="rounded-2xl shadow-lg">
                <CardHeader className="pb-3 rounded-t-2xl">
                  <CardTitle className="text-lg font-bold text-blue-700">
                    Danh sách câu hỏi
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-5 gap-3">
                    {result.answers.map((answer, index) => {
                      let colorClass =
                        "bg-red-100 text-red-700 border-red-300 hover:bg-red-200";
                      // Các dạng dùng is_all_correct (trừ speaking, writing)
                      if (
                        answer.questionType !== "speaking" &&
                        answer.questionType !== "writing"
                      ) {
                        const isAllCorrect =
                          (answer.studentAnswer &&
                          typeof answer.studentAnswer === "object" &&
                          typeof answer.studentAnswer.is_all_correct !==
                            "undefined"
                            ? answer.studentAnswer.is_all_correct
                            : undefined) ?? answer.is_all_correct;
                        if (typeof isAllCorrect !== "undefined") {
                          colorClass = isAllCorrect
                            ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
                            : "bg-red-100 text-red-700 border-red-300 hover:bg-red-200";
                        }
                      } else if (
                        answer.questionType === "writing" ||
                        answer.questionType === "speaking"
                      ) {
                        if (
                          answer.studentAnswer &&
                          typeof answer.studentAnswer === "object" &&
                          typeof answer.studentAnswer.isScored !== "undefined"
                        ) {
                          colorClass =
                            answer.studentAnswer.isScored === true
                              ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
                              : "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200";
                        }
                      }
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            const element = document.getElementById(
                              `question-${index}`
                            );
                            element?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className={`w-12 h-12 rounded-full border-2 font-bold shadow-md transition-all duration-200 transform hover:scale-110 hover:shadow-xl text-lg ${colorClass}`}
                        >
                          {index + 1}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              {children}
            </div>
          </div>

          {/* Right - Question Results */}
          <div className="col-span-12 md:col-span-8 lg:col-span-9 min-w-0">
            <div className="space-y-10">
              {result.answers.map((question, index) => (
                <div
                  key={question.questionId}
                  id={`question-${index}`}
                  className="mb-8"
                >
                  <ExamQuestionDisplay
                    question={question}
                    index={index}
                    showFeedback={showFeedback}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamResultLayout;
