"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TiptapMathViewer } from "@/components/question-editor/tiptap-math-viewer";
import { QuestionDetailDialog } from "@/components/question-detail-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  LucideArrowLeft,
  LucideCheck,
  LucideImage,
  LucideLoader2,
  LucidePlus,
  LucideSearch,
  LucideX,
  LucideEye,
  LucideBookOpen,
  LucideChevronLeft,
  LucideChevronRight,
  LucideAlertCircle,
  LucideEdit,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { QuestionType } from "@/lib/api/questions";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import dynamic from "next/dynamic";
import { QuestionBankDialog } from "@/components/QuestionBankDialog";
import { LatexText } from "@/components/latex-text";
import { CreateQuestionDialog } from "@/components/ui/dialog";
import { useTypedTranslations } from "@/lib/i18n/client";
import { useParams } from "next/navigation";
import { CLONE_QUESTION_EDIT_ENABLED } from "@/config/hiddenModules";
const CreateQuestionModal = dynamic(
  () =>
    import("@/components/question-editor/create-question-modal").then(
      (mod) => mod.CreateQuestionModal
    ),
  { ssr: false }
);

interface HomeworkFormProps {
  // Basic homework info
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  status: number;
  setStatus: (status: number) => void;

  // Cover image
  coverImageUrl: string;
  uploadingCover: boolean;
  handleCoverImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveCoverImage: () => void;

  // Questions
  selectedQuestions: string[];
  selectedQuestionsData: QuestionType[];
  questionScores: Record<string, number>;
  handleQuestionToggle: (questionId: string, defaultPoints?: number) => void;
  handleScoreChange: (questionId: string, score: number) => void;
  getSelectedQuestionsList: () => (QuestionType | undefined)[];

  // Question bank
  questionBankOpen: boolean;
  setQuestionBankOpen: (open: boolean) => void;
  questions: QuestionType[];
  questionLoading: boolean;
  questionError: string | null;
  questionFilters: {
    page: number;
    limit: number;
    search: string;
    type?: string;
  };
  hasMoreQuestions: boolean;
  handleQuestionPageChange: (newPage: number) => void;
  handleQuestionFilterChange: (key: string, value: string) => void;
  handleQuestionSearch: (e: React.FormEvent) => void;
  getCurrentPageQuestions: () => QuestionType[];

  // Question detail
  selectedQuestionId: string | number | null;
  questionDetailOpen: boolean;
  handleViewQuestionDetail: (questionId: string | number) => void;
  setQuestionDetailOpen: (open: boolean) => void;

  // Actions
  handleSave: (extra: {
    question_form: "question" | "write";
    question_files?: { type: string; url: string }[];
  }) => void;
  isSaving: boolean;

  // Utils
  formatQuestionType: (type: string) => string;

  // Mode
  mode: "create" | "edit";

  // Navigation
  backUrl?: string;

  // Homework ID for edit mode
  homeworkId?: string | number;
  exerciseId?: string | number;

  // Đóng modal chọn câu hỏi và lưu localStorage
  handleCloseQuestionBank?: () => void;

  // State setters for questions
  setSelectedQuestions: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedQuestionsData: React.Dispatch<
    React.SetStateAction<QuestionType[]>
  >;
  setQuestionScores: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
}

export function HomeworkForm({
  name,
  setName,
  description,
  setDescription,
  status,
  setStatus,
  coverImageUrl,
  uploadingCover,
  handleCoverImageChange,
  handleRemoveCoverImage,
  selectedQuestions,
  selectedQuestionsData,
  questionScores,
  handleQuestionToggle,
  handleScoreChange,
  getSelectedQuestionsList,
  questionBankOpen,
  setQuestionBankOpen,
  questions,
  questionLoading,
  questionError,
  questionFilters,
  hasMoreQuestions,
  handleQuestionPageChange,
  handleQuestionFilterChange,
  handleQuestionSearch,
  getCurrentPageQuestions,
  selectedQuestionId,
  questionDetailOpen,
  handleViewQuestionDetail,
  setQuestionDetailOpen,
  handleSave,
  isSaving,
  formatQuestionType,
  mode,
  backUrl = "/teacher/assignments",
  homeworkId,
  handleCloseQuestionBank,
  setSelectedQuestions,
  setSelectedQuestionsData,
  setQuestionScores,
}: HomeworkFormProps) {
  const params = useParams();
  const t = useTypedTranslations("manageAssignments");
  const locale = params?.locale || "vi";
  const title = mode === "create" ? t("form.createTitle") : t("form.editTitle");
  const subtitle =
    mode === "create" ? t("form.createSubtitle") : t("form.editSubtitle");
  const saveButtonText =
    mode === "create" ? t("form.saveCreate") : t("form.saveEdit");

  const { toast } = useToast();
  const [showCreateQuestion, setShowCreateQuestion] = useState(false);

  // Helper function to render media content
  const renderMediaContent = (media: any) => {
    if (!media?.url) return null;

    const mediaType = media.type || media.media_type;
    const mediaUrl = media.url;

    if (mediaType === "image") {
      return (
        <div className="mt-2 mb-3">
          <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
            <Image
              src={mediaUrl}
              alt={t("form.questions.questionMediaAlt")}
              fill
              className="object-cover"
            />
          </div>
        </div>
      );
    } else if (mediaType === "audio") {
      return (
        <div className="mt-2 mb-3">
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <audio controls className="h-8 flex-1">
              <source src={mediaUrl} type="audio/mpeg" />
              <source src={mediaUrl} type="audio/wav" />
              <source src={mediaUrl} type="audio/ogg" />
              {t("form.questions.audioUnsupported")}
            </audio>
          </div>
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
            {t("form.questions.videoUnsupported")}
          </video>
        </div>
      );
    }

    return null;
  };

  if ((mode === "create" && isSaving) || (mode === "edit" && isSaving)) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Skeleton */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-8">
                <div className="mb-6">
                  <Skeleton className="h-8 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                <div className="space-y-6">
                  <Skeleton className="h-12 w-full mb-2" />
                  <Skeleton className="h-20 w-full mb-2" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                  <Skeleton className="h-40 w-full" />
                </div>
              </div>
            </div>
            {/* Sidebar Skeleton */}
            <div className="space-y-6">
              <Skeleton className="h-10 w-40 mb-2" />
              <Skeleton className="h-16 w-32 mb-4" />
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-4 w-40 mb-2" />
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-24 mb-2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-2 sm:px-6 sm:py-8">
        {/* Header Section */}
        <div className="mb-2 sm:mb-12">
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-2xl hover:bg-gray-100"
              asChild
            >
              <Link href={backUrl}>
                <LucideArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                {title}
              </h1>
              <p className="text-gray-500 font-medium">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Homework Information */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 sm:p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {t("form.infoTitle")}
                  </h2>
                  <p className="text-gray-500">{t("form.infoSubtitle")}</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label
                      htmlFor="name"
                      className="text-sm font-medium text-gray-700"
                    >
                      {t("form.nameLabel")}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder={t("form.namePlaceholder")}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-2xl border-gray-200 focus:border-green-300 focus:ring-green-200 py-3"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="description"
                      className="text-sm font-medium text-gray-700"
                    >
                      {t("form.descriptionLabel")}
                    </Label>
                    <Textarea
                      id="description"
                      placeholder={t("form.descriptionPlaceholder")}
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="rounded-2xl border-gray-200 focus:border-green-300 focus:ring-green-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 sm:p-8">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {t("form.questions.title")}
                    </h2>
                    <p className="text-gray-500">
                      {t("form.questions.subtitle")}
                    </p>
                  </div>

                  <Tabs defaultValue="bank">
                    <TabsList className="bg-gray-50 rounded-2xl shadow-sm border border-gray-100 p-1.5 py-7 mb-6 max-sm:flex-col max-sm:h-fit max-sm:py-2 max-sm:space-y-2 max-sm:w-full">
                      <TabsTrigger
                        value="bank"
                        className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm rounded-xl px-6 py-3 font-medium transition-all duration-200 max-sm:w-full"
                      >
                        {t("form.questions.fromBankTab")}
                      </TabsTrigger>
                      <TabsTrigger
                        value="new"
                        className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm rounded-xl px-6 py-3 font-medium transition-all duration-200 max-sm:w-full"
                      >
                        {t("form.questions.createNewTab")}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="bank">
                      <div className="space-y-6">
                        <Button
                          className="w-full py-14 flex flex-col items-center gap-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl transition-all duration-200"
                          onClick={() => setQuestionBankOpen(true)}
                        >
                          <div className="w-12 h-12 bg-green-700 rounded-2xl flex items-center justify-center">
                            <LucideBookOpen className="h-6 w-6" />
                          </div>
                          <div className="text-center">
                            <span className="text-lg font-semibold block">
                              {t("form.questions.openBankCta")}
                            </span>
                            <span className="text-sm text-green-100 whitespace-pre-line">
                              {t("form.questions.openBankDesc")}
                            </span>
                          </div>
                        </Button>

                        {selectedQuestions.length > 0 && (
                          <div>
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                                <LucideCheck className="h-4 w-4 text-green-600" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {t("form.questions.selectedHeader", {
                                  count: String(selectedQuestions.length),
                                })}
                              </h3>
                            </div>
                            <div className="bg-gray-50 rounded-2xl border border-gray-200 divide-y divide-gray-200">
                              {getSelectedQuestionsList().map(
                                (question, index) => {
                                  if (!question) {
                                    console.log(
                                      "âš ï¸ Null question at index:",
                                      index
                                    );
                                    return null;
                                  }
                                  console.log("ðŸŽ¯ Rendering question:", {
                                    id: question.id,
                                    type: question.type,
                                    index,
                                  });
                                  return (
                                    <div
                                      key={question.id}
                                      className="p-6 hover:bg-gray-25 transition-colors"
                                    >
                                      <div className="flex gap-4 flex-wrap">
                                        <div className="flex-1">
                                          {/* Question Title */}
                                          <div className="mb-3">
                                            <h4 className="text-lg font-semibold text-gray-900">
                                              {t("form.questions.questionN", {
                                                n: String(index + 1),
                                              })}
                                            </h4>
                                          </div>

                                          {/* Question Content */}
                                          <div className="mb-4">
                                            <div className="font-medium text-gray-900 text-base leading-relaxed mb-3">
                                              <TiptapMathViewer
                                                value={question.content.text
                                                  .split("\n")
                                                  .join("<br />")}
                                                isHtml
                                              />
                                            </div>

                                            {/* Question Media - ưu tiên medias array */}
                                            {question.content?.medias &&
                                            question.content.medias.length >
                                              0 ? (
                                              // Hiển thị tất cả media từ medias array
                                              <div className="space-y-2">
                                                {question.content.medias.map(
                                                  (media: any, idx: number) => (
                                                    <div key={idx}>
                                                      {renderMediaContent(
                                                        media
                                                      )}
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            ) : (
                                              // Fallback về media cũ
                                              question.content?.media &&
                                              renderMediaContent(
                                                question.content.media
                                              )
                                            )}
                                          </div>

                                          {/* Enhanced Answer Options Display */}
                                          {question.type ===
                                            "multiple_choice" &&
                                            question.options?.answers && (
                                              <div className="mb-4">
                                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                                  {t("form.questions.answers")}
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                  {question.options.answers.map(
                                                    (
                                                      answer: any,
                                                      idx: number
                                                    ) => {
                                                      const isCorrect =
                                                        question.correct_answers?.ids?.includes(
                                                          idx
                                                        );
                                                      return (
                                                        <div
                                                          key={idx}
                                                          className={`p-3 rounded-xl border text-sm ${
                                                            isCorrect
                                                              ? "bg-green-50 border-green-200 text-green-800"
                                                              : "bg-gray-50 border-gray-200 text-gray-700"
                                                          }`}
                                                        >
                                                          <div className="flex items-start gap-2">
                                                            <span
                                                              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                                                                isCorrect
                                                                  ? "bg-green-200 text-green-800"
                                                                  : "bg-gray-200 text-gray-600"
                                                              }`}
                                                            >
                                                              {String.fromCharCode(
                                                                65 + idx
                                                              )}
                                                            </span>
                                                            <div className="flex-1">
                                                              <div className="break-words">
                                                                <LatexText
                                                                  value={
                                                                    answer.text
                                                                  }
                                                                />
                                                              </div>
                                                              {answer.media &&
                                                                renderMediaContent(
                                                                  answer.media
                                                                )}
                                                            </div>
                                                          </div>
                                                        </div>
                                                      );
                                                    }
                                                  )}
                                                </div>
                                              </div>
                                            )}

                                          {question.type === "fill_in_blanks" &&
                                            question.correct_answers?.list && (
                                              <div className="mb-4">
                                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                                  {t(
                                                    "form.questions.correctAnswers"
                                                  )}
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                  {Object.entries(
                                                    question.correct_answers
                                                      .list
                                                  ).map(([key, value], idx) => (
                                                    <div
                                                      key={idx}
                                                      className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg"
                                                    >
                                                      <span className="text-xs font-medium text-blue-600">
                                                        {key}:
                                                      </span>
                                                      <span className="text-sm text-blue-800 ml-1">
                                                        <LatexText
                                                          value={String(value)}
                                                          className="text-sm text-blue-800"
                                                        />
                                                      </span>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}

                                          {question.type === "matching" &&
                                            (question.options as any)
                                              ?.sources &&
                                            (question.options as any)
                                              ?.targets && (
                                              <div className="mb-4">
                                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                                  {t("form.questions.matching")}
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                  <div>
                                                    <div className="text-xs font-medium text-purple-600 mb-2">
                                                      {t(
                                                        "form.questions.sources"
                                                      )}
                                                    </div>
                                                    <div className="space-y-2">
                                                      {(
                                                        question.options as any
                                                      ).sources
                                                        .slice(0, 3)
                                                        .map(
                                                          (
                                                            source: any,
                                                            idx: number
                                                          ) => (
                                                            <div
                                                              key={idx}
                                                              className="p-2 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800"
                                                            >
                                                              <LatexText
                                                                value={
                                                                  source.content
                                                                    ?.text
                                                                }
                                                              />
                                                              {source.content
                                                                ?.media &&
                                                                renderMediaContent(
                                                                  source.content
                                                                    .media
                                                                )}
                                                            </div>
                                                          )
                                                        )}
                                                      {(question.options as any)
                                                        .sources.length > 3 && (
                                                        <div className="text-xs text-gray-500">
                                                          +
                                                          {(
                                                            question.options as any
                                                          ).sources.length -
                                                            3}{" "}
                                                          {t(
                                                            "form.questions.moreItems"
                                                          )}
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <div className="text-xs font-medium text-pink-600 mb-2">
                                                      {t(
                                                        "form.questions.targets"
                                                      )}
                                                    </div>
                                                    <div className="space-y-2">
                                                      {(
                                                        question.options as any
                                                      ).targets
                                                        .slice(0, 3)
                                                        .map(
                                                          (
                                                            target: any,
                                                            idx: number
                                                          ) => (
                                                            <div
                                                              key={idx}
                                                              className="p-2 bg-pink-50 border border-pink-200 rounded-lg text-sm text-pink-800"
                                                            >
                                                              <LatexText
                                                                value={
                                                                  target.content
                                                                    ?.text
                                                                }
                                                              />
                                                              {target.content
                                                                ?.media &&
                                                                renderMediaContent(
                                                                  target.content
                                                                    .media
                                                                )}
                                                            </div>
                                                          )
                                                        )}
                                                      {(question.options as any)
                                                        .targets.length > 3 && (
                                                        <div className="text-xs text-gray-500">
                                                          +
                                                          {(
                                                            question.options as any
                                                          ).targets.length -
                                                            3}{" "}
                                                          {t(
                                                            "form.questions.moreItems"
                                                          )}
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            )}

                                          {question.type === "ordering" &&
                                            question.options?.answers && (
                                              <div className="mb-4">
                                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                                  {t("form.questions.ordering")}
                                                </div>
                                                <div className="space-y-2">
                                                  {question.options.answers.map(
                                                    (
                                                      answer: any,
                                                      idx: number
                                                    ) => (
                                                      <div
                                                        key={idx}
                                                        className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg"
                                                      >
                                                        <span className="w-6 h-6 bg-orange-200 text-orange-800 rounded-full flex items-center justify-center text-xs font-medium">
                                                          {answer.correct_position ||
                                                            idx + 1}
                                                        </span>
                                                        <div className="flex-1">
                                                          <div className="text-sm text-orange-800">
                                                            <LatexText
                                                              value={
                                                                answer.text
                                                              }
                                                              className="text-sm text-orange-800"
                                                            />
                                                          </div>
                                                          {answer.media &&
                                                            renderMediaContent(
                                                              answer.media
                                                            )}
                                                        </div>
                                                      </div>
                                                    )
                                                  )}
                                                </div>
                                              </div>
                                            )}

                                          {question.type === "labeling" &&
                                            question.options?.labels && (
                                              <div className="mb-4">
                                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                                  {t("form.questions.labels")}
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                  {question.options.labels.map(
                                                    (
                                                      label: any,
                                                      idx: number
                                                    ) => (
                                                      <div
                                                        key={idx}
                                                        className="px-3 py-2 bg-cyan-50 border border-cyan-200 rounded-lg"
                                                      >
                                                        <span className="text-sm text-cyan-800">
                                                          <LatexText
                                                            value={label.text}
                                                            className="text-sm text-cyan-800"
                                                          />
                                                        </span>
                                                        {label.media &&
                                                          renderMediaContent(
                                                            label.media
                                                          )}
                                                      </div>
                                                    )
                                                  )}
                                                </div>
                                              </div>
                                            )}

                                          {question.type === "category" &&
                                            question.options?.categories &&
                                            question.options?.items && (
                                              <div className="mb-4">
                                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                                  {t(
                                                    "form.questions.categorization"
                                                  )}
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                  <div>
                                                    <div className="text-xs font-medium text-teal-600 mb-2">
                                                      {t(
                                                        "form.questions.categories"
                                                      )}
                                                    </div>
                                                    <div className="space-y-2">
                                                      {question.options.categories
                                                        .slice(
                                                          0,
                                                          question.options
                                                            .categories.length
                                                        )
                                                        .map(
                                                          (
                                                            category: any,
                                                            idx: number
                                                          ) => (
                                                            <div
                                                              key={idx}
                                                              className="p-3 bg-teal-50 border border-teal-200 rounded-lg"
                                                            >
                                                              <div className="text-sm text-teal-800 mb-2">
                                                                <LatexText
                                                                  value={
                                                                    category.name
                                                                  }
                                                                />
                                                              </div>
                                                              {category.media &&
                                                                renderMediaContent(
                                                                  category.media
                                                                )}
                                                            </div>
                                                          )
                                                        )}
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <div className="text-xs font-medium text-emerald-600 mb-2">
                                                      Items:
                                                    </div>
                                                    <div className="space-y-2">
                                                      {question.options.items
                                                        .slice(
                                                          0,
                                                          question.options.items
                                                            .length
                                                        )
                                                        .map(
                                                          (
                                                            item: any,
                                                            idx: number
                                                          ) => (
                                                            <div
                                                              key={idx}
                                                              className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
                                                            >
                                                              <div className="text-sm text-emerald-800 mb-2">
                                                                <LatexText
                                                                  value={
                                                                    item.text
                                                                  }
                                                                />
                                                              </div>
                                                              {item.media &&
                                                                renderMediaContent(
                                                                  item.media
                                                                )}
                                                            </div>
                                                          )
                                                        )}
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            )}

                                          {question.type === "drag_drop" &&
                                            question.options?.answers && (
                                              <div className="mb-4">
                                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                                  {t("form.questions.dragDrop")}
                                                </div>
                                                <div className="space-y-2">
                                                  {question.options.answers
                                                    .slice(0, 4)
                                                    .map(
                                                      (
                                                        answer: any,
                                                        idx: number
                                                      ) => {
                                                        const correctPosition =
                                                          answer.correct_position ||
                                                          0;
                                                        return (
                                                          <div
                                                            key={idx}
                                                            className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800"
                                                          >
                                                            <div className="flex items-center justify-between">
                                                              <span>
                                                                <LatexText
                                                                  value={
                                                                    answer.text
                                                                  }
                                                                />
                                                              </span>
                                                              {correctPosition >
                                                                0 && (
                                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                                  {t(
                                                                    "form.questions.position"
                                                                  )}{" "}
                                                                  {
                                                                    correctPosition
                                                                  }
                                                                </span>
                                                              )}
                                                            </div>
                                                            {answer.media &&
                                                              renderMediaContent(
                                                                answer.media
                                                              )}
                                                          </div>
                                                        );
                                                      }
                                                    )}
                                                  {question.options.answers
                                                    .length > 4 && (
                                                    <div className="text-xs text-gray-500">
                                                      +
                                                      {question.options.answers
                                                        .length - 4}{" "}
                                                      {t(
                                                        "form.questions.moreItems"
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            )}

                                          {(question.type === "writing" ||
                                            question.type === "speaking") && (
                                            <div className="mb-4">
                                              <div className="px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                                  <span className="text-sm font-medium text-indigo-800">
                                                    {question.type === "writing"
                                                      ? t(
                                                          "form.questions.essayWriting"
                                                        )
                                                      : t(
                                                          "form.questions.essaySpeaking"
                                                        )}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          )}

                                          {/* Question Type Badge */}
                                          <div className="flex items-center gap-3">
                                            <Badge className="bg-green-50 text-green-600 border border-green-200 px-3 py-1 rounded-full text-xs font-medium">
                                              {formatQuestionType(
                                                question.type
                                              )}
                                            </Badge>
                                            {question.level && (
                                              <Badge
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                  question.level === "easy"
                                                    ? "bg-green-100 text-green-700 border border-green-200"
                                                    : question.level ===
                                                      "medium"
                                                    ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                                    : "bg-red-100 text-red-700 border border-red-200"
                                                }`}
                                              >
                                                {question.level
                                                  .charAt(0)
                                                  .toUpperCase() +
                                                  question.level.slice(1)}
                                              </Badge>
                                            )}
                                          </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col items-end gap-4 ml-4">
                                          <div className="flex items-center gap-2">
                                            <Label
                                              htmlFor={`score-${question.id}`}
                                              className="text-sm font-medium text-gray-700"
                                            >
                                              {t("form.questions.points")}
                                            </Label>
                                            <Input
                                              id={`score-${question.id}`}
                                              type="number"
                                              min="0"
                                              step="0.5"
                                              className="w-20 h-8 rounded-xl border-gray-200 focus:border-green-300 focus:ring-green-200"
                                              value={
                                                questionScores[
                                                  question.id.toString()
                                                ] !== undefined
                                                  ? questionScores[
                                                      question.id.toString()
                                                    ]
                                                  : question.metadata?.points ||
                                                    0
                                              }
                                              onChange={(e) =>
                                                handleScoreChange(
                                                  question.id.toString(),
                                                  Number.parseFloat(
                                                    e.target.value
                                                  ) || 0
                                                )
                                              }
                                            />
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-8 w-8 p-0 rounded-xl hover:bg-blue-50"
                                              onClick={() =>
                                                handleViewQuestionDetail(
                                                  question.id
                                                )
                                              }
                                            >
                                              <LucideEye className="h-4 w-4 text-blue-600" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-8 w-8 p-0 rounded-xl hover:bg-green-50"
                                              asChild
                                            >
                                              <Link
                                                href={`/${locale}/manage/question-bank/edit/${
                                                  question.id
                                                }${
                                                  CLONE_QUESTION_EDIT_ENABLED &&
                                                  mode === "edit" &&
                                                  homeworkId
                                                    ? `?homework_id=${homeworkId}`
                                                    : ""
                                                }`}
                                                target="_blank"
                                              >
                                                <LucideEdit className="h-4 w-4 text-green-600" />
                                              </Link>
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-8 w-8 p-0 rounded-xl hover:bg-red-50"
                                              onClick={() => {
                                                console.log(
                                                  "ðŸ—‘ï¸ Remove button clicked for question:",
                                                  question.id,
                                                  question.id.toString()
                                                );
                                                console.log(
                                                  "ðŸ—‘ï¸ Current selected questions:",
                                                  selectedQuestions
                                                );
                                                handleQuestionToggle(
                                                  question.id.toString()
                                                );
                                              }}
                                            >
                                              <LucideX className="h-4 w-4 text-red-600" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="new">
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <LucidePlus className="h-8 w-8 text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {t("form.questions.createNewTab")}
                        </h3>
                        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                          {t("form.questions.createNewDesc")}
                        </p>
                        <Button
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 py-3"
                          onClick={() => setShowCreateQuestion(true)}
                        >
                          <LucidePlus className="h-4 w-4 mr-2" />
                          {t("form.questions.createNewTab")}
                        </Button>
                        {showCreateQuestion && (
                          <Dialog
                            open={showCreateQuestion}
                            onOpenChange={setShowCreateQuestion}
                          >
                            <CreateQuestionDialog className="max-w-8xl h-[90vh] flex flex-col rounded-3xl border-0 shadow-xl">
                              <CreateQuestionModal
                                onCancel={() => setShowCreateQuestion(false)}
                                onSuccess={(question) => {
                                  setShowCreateQuestion(false);
                                  console.log(
                                    "[HomeworkForm] onSuccess callback nháº­n:",
                                    question
                                  );
                                  if (question && question.id) {
                                    setSelectedQuestions((prev: string[]) =>
                                      prev.includes(String(question.id))
                                        ? prev
                                        : [...prev, String(question.id)]
                                    );
                                    setSelectedQuestionsData(
                                      (prev: QuestionType[]) =>
                                        prev.find(
                                          (q: QuestionType) =>
                                            q.id.toString() ===
                                            String(question.id)
                                        )
                                          ? prev
                                          : [...prev, question]
                                    );
                                    setQuestionScores(
                                      (prev: Record<string, number>) => ({
                                        ...prev,
                                        [String(question.id)]:
                                          question?.metadata?.points || 0,
                                      })
                                    );
                                  } else {
                                    console.warn(
                                      "[HomeworkForm] Không có id trong object question:",
                                      question
                                    );
                                  }
                                }}
                              />
                            </CreateQuestionDialog>
                          </Dialog>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 flex-wrap">
              <Button
                variant="outline"
                className="rounded-2xl border-gray-200 hover:border-gray-300 px-6 py-3 bg-transparent w-full md:w-auto"
                asChild
              >
                <Link href={backUrl}>{t("common.cancel")}</Link>
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white rounded-2xl px-6 py-3 w-full md:w-auto"
                onClick={() => {
                  handleSave({ question_form: "question" });
                }}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.saving")}
                  </>
                ) : (
                  <>
                    <LucideCheck className="mr-2 h-4 w-4" />
                    {saveButtonText}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Sidebar - Guidelines */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t("form.sidebar.guidelinesTitle")}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {mode === "create"
                      ? t("form.sidebar.createSteps")
                      : t("form.sidebar.editSteps")}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Bước 1 */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 mb-1">
                        {mode === "create"
                          ? t("form.sidebar.step1TitleCreate")
                          : t("form.sidebar.step1TitleEdit")}
                      </p>
                      <p className="text-sm text-gray-500">
                        {mode === "create"
                          ? t("form.sidebar.step1DescCreate")
                          : t("form.sidebar.step1DescEdit")}
                      </p>
                    </div>
                  </div>

                  {/* Bước 2 - thay đổi theo assignmentMode */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 mb-1">
                        {mode === "create"
                          ? t("form.sidebar.step3TitleCreate")
                          : t("form.sidebar.step3TitleEdit")}
                      </p>
                      <p className="text-sm text-gray-500">
                        {mode === "create"
                          ? t("form.sidebar.step3DescCreate")
                          : t("form.sidebar.step3DescEdit")}
                      </p>
                    </div>
                  </div>

                  {/* Bước 3 - Tạo bài luyện tập */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 mb-1">
                        {mode === "create"
                          ? t("form.sidebar.step4TitleCreate")
                          : t("form.sidebar.step4TitleEdit")}
                      </p>
                      <p className="text-sm text-gray-500">
                        {mode === "create"
                          ? t("form.sidebar.step4DescCreate")
                          : t("form.sidebar.step4DescEdit")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* ...phần Important Notes giữ nguyên... */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t("form.sidebar.importantNotes")}
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <LucideAlertCircle className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-sm text-blue-700">
                        {t("form.sidebar.noteAllFieldsOptionalExceptName")}
                      </p>
                    </div>
                  </div>

                  {mode === "edit" && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <LucideAlertCircle className="h-4 w-4 text-amber-600" />
                        </div>
                        <p className="text-sm text-amber-700">
                          {t("form.sidebar.noteQuestionListUpdate")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Bank Dialog */}
      <QuestionBankDialog
        open={questionBankOpen}
        onOpenChange={setQuestionBankOpen}
        questions={questions}
        questionLoading={questionLoading}
        questionError={questionError}
        questionFilters={questionFilters}
        hasMoreQuestions={hasMoreQuestions}
        selectedQuestions={selectedQuestions}
        handleQuestionToggle={handleQuestionToggle}
        handleQuestionPageChange={handleQuestionPageChange}
        handleQuestionFilterChange={handleQuestionFilterChange}
        handleQuestionSearch={handleQuestionSearch}
        getCurrentPageQuestions={getCurrentPageQuestions}
        handleClose={
          handleCloseQuestionBank || (() => setQuestionBankOpen(false))
        }
        formatQuestionType={formatQuestionType}
        questionScores={questionScores}
        handleScoreChange={handleScoreChange}
        handleViewQuestionDetail={handleViewQuestionDetail}
      />

      {/* Question Detail Dialog */}
      <QuestionDetailDialog
        questionId={selectedQuestionId}
        open={questionDetailOpen}
        onOpenChange={setQuestionDetailOpen}
      />
    </div>
  );
}
