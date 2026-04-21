"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  PenTool,
  Edit,
  Trash2,
  Eye,
  Users,
  Clock,
  Award,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "next/navigation";
import { useTypedTranslations } from "@/lib/i18n/client";
import { GetExamDetail } from "@/lib/api/exams";
import { getQuestions } from "@/lib/api/questions";
import { TiptapMathViewer } from "@/components/question-editor/tiptap-math-viewer";
import MediaContent from "@/components/ui/media-content";

export default function ExamDetailPage() {
  const params = useParams();
  const lessonId = params?.id as string;
  const examId = params?.examId as string;
  const locale = (params as any)?.locale || "vi";
  const t = useTypedTranslations("examDetail");

  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!examId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const examRes = await GetExamDetail(examId);
        const examData = examRes;
        setExam(examData);

        // Fetch questions for this exam
        const questionsRes = await getQuestions({ exam_id: parseInt(examId) });
        setQuestions(questionsRes?.questions || []);
      } catch (error) {
        console.error("Error fetching exam details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [examId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <PenTool className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t("notFoundTitle")}
          </h3>
          <p className="text-gray-600 mb-6">{t("notFoundDescription")}</p>
          <Button asChild>
            <Link href={`/${locale}/teacher/lessons/${lessonId}`}>
              {t("backToLesson")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Common Header */}
        <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{exam.name}</h1>
            <p className="text-gray-600 mt-1">{t("subtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              className={`px-3 py-1 rounded-full font-medium ${
                exam.status === 1
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {exam.status === 1 ? t("published") : t("draft")}
            </Badge>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Left: Exam Info */}
          <div className="md:col-span-1 md:sticky md:top-8 h-fit">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 mb-6">
              <div className="p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {t("infoTitle")}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {t("description")}
                      </h4>
                      <p className="text-gray-700 leading-relaxed">
                        {exam.description || t("noDescription")}
                      </p>
                    </div>
                    {exam.deadline && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {t("deadline")}
                        </h4>
                        <p className="text-red-600 font-medium">
                          {new Date(exam.deadline).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Timer className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-600">
                            {t("createdAt")}
                          </p>
                          <p className="font-semibold text-gray-900">
                            {exam.created_at
                              ? new Date(
                                  Number(exam.created_at) * 1000
                                ).toLocaleString("vi-VN")
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <PenTool className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-600">
                            {t("questionCount")}
                          </p>
                          <p className="font-semibold text-gray-900">
                            {questions.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Right: Questions List */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100">
              <div className="p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  {t("questionsList", { count: questions.length })}
                </h2>
                {questions.length > 0 ? (
                  <div className="space-y-6">
                    {questions.map((question: any, index: number) => {
                      // Helper: render media if present (reuse logic from homework-form)
                      const renderMediaContent = (media: any) => {
                        if (!media?.url) return null;
                        const mediaType = media.type || media.media_type;
                        const mediaUrl = media.url;
                        if (mediaType === "image") {
                          return (
                            <div className="mt-2 mb-3">
                              <img
                                src={mediaUrl}
                                alt="media"
                                className="max-w-[200px] w-full h-auto"
                              />
                            </div>
                          );
                        } else if (mediaType === "audio") {
                          return (
                            <div className="mt-2 mb-3">
                              <audio controls className="h-8 flex-1">
                                <source src={mediaUrl} type="audio/mpeg" />
                                <source src={mediaUrl} type="audio/wav" />
                                <source src={mediaUrl} type="audio/ogg" />
                                Your browser does not support the audio element.
                              </audio>
                            </div>
                          );
                        } else if (mediaType === "video") {
                          return (
                            <div className="mt-2 mb-3">
                              <video
                                controls
                                className="w-32 h-20 rounded-lg border border-gray-200"
                              >
                                <source src={mediaUrl} type="video/mp4" />
                                <source src={mediaUrl} type="video/webm" />
                                <source src={mediaUrl} type="video/ogg" />
                                Your browser does not support the video tag.
                              </video>
                            </div>
                          );
                        }
                        return null;
                      };

                      return (
                        <div
                          key={question.id}
                          className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-6"
                        >
                          <div className="flex items-center gap-4 mb-2">
                            <Badge className="bg-blue-100 text-blue-700">
                              {t("questionBadge")} {index + 1}
                            </Badge>
                            <span className="text-gray-700 font-semibold">
                              {question.type}
                            </span>
                          </div>
                          <div className="mb-3">
                            <TiptapMathViewer
                              value={
                                question.content?.text
                                  ?.split("\n")
                                  .join("<br />") || ""
                              }
                              isHtml
                            />
                            {/* Question Media - ưu tiên medias array */}
                            {question.content?.medias &&
                            question.content.medias.length > 0 ? (
                              // Hiển thị tất cả media từ medias array
                              <div className="space-y-2">
                                {question.content.medias.map(
                                  (media: any, idx: number) => (
                                    <div key={idx}>
                                      {renderMediaContent(media)}
                                    </div>
                                  )
                                )}
                              </div>
                            ) : (
                              // Fallback về media cũ
                              renderMediaContent(question.content?.media)
                            )}
                          </div>
                          {/* Multiple Choice */}
                          {question.type === "multiple_choice" &&
                            question.options?.answers && (
                              <div className="mb-4">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                  {t("answers")}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  {question.options.answers.map(
                                    (answer: any, idx: number) => {
                                      // Use is_correct if present, otherwise fallback to correct_answers.ids
                                      const isCorrect =
                                        typeof answer.is_correct === "boolean"
                                          ? answer.is_correct
                                          : question.correct_answers?.ids?.includes(
                                              idx
                                            );
                                      return (
                                        <div
                                          key={idx}
                                          className={`p-3 rounded-xl border text-sm flex items-start gap-2 ${
                                            isCorrect
                                              ? "bg-green-100 border-green-400 text-green-800"
                                              : "bg-gray-50 border-gray-200 text-gray-700"
                                          }`}
                                        >
                                          <span
                                            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                                              isCorrect
                                                ? "bg-green-200 text-green-800 border-green-400 border"
                                                : "bg-gray-200 text-gray-600"
                                            }`}
                                          >
                                            {String.fromCharCode(65 + idx)}
                                          </span>
                                          <div className="flex-1">
                                            <div className="break-words">
                                              {answer.text}
                                            </div>
                                            {answer.media &&
                                              renderMediaContent(answer.media)}
                                          </div>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            )}
                          {/* Fill in Blanks */}
                          {question.type === "fill_in_blanks" &&
                            question.correct_answers?.list && (
                              <div className="mb-4">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                  {t("correctAnswers")}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(
                                    question.correct_answers.list
                                  ).map(([key, value], idx) => (
                                    <div
                                      key={idx}
                                      className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg"
                                    >
                                      <span className="text-xs font-medium text-blue-600">
                                        {key}:
                                      </span>
                                      <span className="text-sm text-blue-800 ml-1">
                                        {String(value)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          {/* Matching */}
                          {question.type === "matching" &&
                            question.options?.sources &&
                            question.options?.targets && (
                              <div className="mb-4">
                                <div className="grid grid-cols-1 gap-2">
                                  {(() => {
                                    const maxLen = Math.max(
                                      question.options.sources.length,
                                      question.options.targets.length
                                    );
                                    return Array.from({ length: maxLen }).map(
                                      (_, idx) => {
                                        const source =
                                          question.options.sources[idx];
                                        const target =
                                          question.options.targets[idx];
                                        return (
                                          <div
                                            key={idx}
                                            className="flex items-center gap-4 p-2 bg-purple-50 border border-purple-200 rounded-lg"
                                          >
                                            {/* Source */}
                                            <div className="flex-1 flex items-center gap-2 min-w-0">
                                              {source ? (
                                                <>
                                                  <span className="text-purple-800 font-medium break-words">
                                                    {source.content?.text}
                                                  </span>
                                                  {source.content?.media &&
                                                    renderMediaContent(
                                                      source.content.media
                                                    )}
                                                </>
                                              ) : (
                                                <span className="text-gray-400">
                                                  -
                                                </span>
                                              )}
                                            </div>
                                            <span className="mx-2 text-gray-400">
                                              ↔
                                            </span>
                                            {/* Target */}
                                            <div className="flex-1 flex items-center gap-2 min-w-0">
                                              {target ? (
                                                <>
                                                  <span className="text-pink-800 font-medium break-words">
                                                    {target.content?.text}
                                                  </span>
                                                  {target.content?.media &&
                                                    renderMediaContent(
                                                      target.content.media
                                                    )}
                                                </>
                                              ) : (
                                                <span className="text-gray-400">
                                                  -
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      }
                                    );
                                  })()}
                                </div>
                              </div>
                            )}
                          {/* Ordering */}
                          {question.type === "ordering" &&
                            question.options?.answers && (
                              <div className="mb-4">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                  {t("correctOrder")}
                                </div>
                                <div className="space-y-2">
                                  {question.options.answers.map(
                                    (answer: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg"
                                      >
                                        <span className="w-6 h-6 bg-orange-200 text-orange-800 rounded-full flex items-center justify-center text-xs font-medium">
                                          {answer.correct_position || idx + 1}
                                        </span>
                                        <div className="flex-1">
                                          <div className="text-sm text-orange-800">
                                            {answer.text}
                                          </div>
                                          {answer.media &&
                                            renderMediaContent(answer.media)}
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          {/* Labeling */}
                          {question.type === "labeling" &&
                            question.options?.labels && (
                              <div className="mb-4">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                  {t("labels")}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {question.options.labels.map(
                                    (label: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className="px-3 py-2 bg-cyan-50 border border-cyan-200 rounded-lg flex items-center gap-2"
                                      >
                                        <span className="text-sm text-cyan-800">
                                          {label.text}
                                        </span>
                                        {label.media &&
                                          renderMediaContent(label.media)}
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          {/* Category */}
                          {question.type === "category" &&
                            question.options?.categories &&
                            question.options?.items && (
                              <div className="mb-4">
                                {/* Đáp án đúng */}
                                {question.correct_answers?.list && (
                                  <div className="mt-4">
                                    <div className="font-medium text-green-700 mb-2">
                                      {t("correctAnswers")}
                                    </div>
                                    <div className="space-y-4">
                                      {question.options.categories.map(
                                        (category: any) => {
                                          const categoryId = String(
                                            category.id
                                          );
                                          // Find all itemIds mapped to this category in correct_answers.list
                                          const itemIds = Object.entries(
                                            question.correct_answers.list
                                          )
                                            .filter(
                                              ([, catId]) =>
                                                String(catId) === categoryId
                                            )
                                            .map(([itemId]) => itemId);
                                          if (itemIds.length === 0) return null;
                                          const categoryLabel =
                                            category.text ||
                                            category.name ||
                                            `Category ${categoryId}`;
                                          return (
                                            <div key={categoryId}>
                                              <div className="flex items-center gap-2 mb-2">
                                                <span className="font-semibold text-blue-800">
                                                  {categoryLabel}
                                                </span>
                                                {category.media &&
                                                  renderMediaContent(
                                                    category.media
                                                  )}
                                              </div>
                                              <div className="flex flex-wrap gap-2 ml-2">
                                                {itemIds.map((itemId) => {
                                                  const item =
                                                    question.options.items.find(
                                                      (it: any) =>
                                                        String(it.id) ===
                                                        String(itemId)
                                                    );
                                                  if (!item) return null;
                                                  return (
                                                    <span
                                                      key={itemId}
                                                      className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium text-sm border border-blue-200"
                                                    >
                                                      {item.text}
                                                      {item.media &&
                                                        item.media.type !==
                                                          "text" && (
                                                          <span className="ml-1">
                                                            {renderMediaContent(
                                                              item.media
                                                            )}
                                                          </span>
                                                        )}
                                                    </span>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          );
                                        }
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          {/* Drag & Drop */}
                          {question.type === "drag_drop" &&
                            question.options?.answers &&
                            question.options.answers.length > 0 && (
                              <div className="mb-4">
                                <div className="font-medium text-blue-700 mb-1">
                                  {t("allAnswers")}
                                </div>
                                <div className="space-y-2">
                                  {question.options.answers.map(
                                    (answer: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className={`flex items-center gap-2 p-2 rounded border ${
                                          answer.correct_position > 0
                                            ? "bg-green-50 border-green-200"
                                            : "bg-gray-50 border-gray-200"
                                        }`}
                                      >
                                        <span className="font-medium text-gray-700">
                                          {answer.correct_position > 0
                                            ? `${t("position")} ${
                                                answer.correct_position
                                              }:`
                                            : t("wrongAnswer")}
                                        </span>
                                        <span
                                          className={`inline-flex items-center ${
                                            answer.correct_position > 0
                                              ? "bg-green-100 text-green-800 border-green-200"
                                              : "bg-gray-100 text-gray-600 border-gray-200"
                                          } px-3 py-1 rounded-full font-medium text-sm border`}
                                        >
                                          {answer.text}
                                          {answer.media &&
                                            answer.media.type !== "text" && (
                                              <span className="ml-1">
                                                {renderMediaContent(
                                                  answer.media
                                                )}
                                              </span>
                                            )}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          {/* Writing/Speaking */}
                          {(question.type === "writing" ||
                            question.type === "speaking") && (
                            <div className="mb-4">
                              <div className="px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                  <span className="text-sm font-medium text-indigo-800">
                                    {t("essayQuestion")} -{" "}
                                    {question.type === "writing"
                                      ? t("writing")
                                      : t("speaking")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <PenTool className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-600">{t("noQuestions")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
