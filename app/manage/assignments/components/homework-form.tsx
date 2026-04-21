"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TiptapMathViewer } from "@/components/question-editor/tiptap-math-viewer";
import { QuestionDetailDialog } from "@/components/question-detail-dialog";
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
import { CreateQuestionDialog } from "@/components/ui/dialog";
import LatexText from "@/components/latex-text";
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
  handleSave: () => void;
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
  exerciseId,
  handleCloseQuestionBank,
  setSelectedQuestions,
  setSelectedQuestionsData,
  setQuestionScores,
}: HomeworkFormProps) {
  const title =
    mode === "create" ? "Tạo bài tập về nhà" : "Chỉnh sửa bài tập về nhà";
  const subtitle =
    mode === "create"
      ? "Tạo bài tập về nhà mới cho học sinh"
      : "Cập nhật thông tin và câu hỏi cho bài tập về nhà";
  const saveButtonText =
    mode === "create" ? "Tạo bài tập về nhà" : "Lưu thay đổi";

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
              alt="Question media"
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
              Your browser does not support the audio element.
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
            Your browser does not support the video element.
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
      <div className="container mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
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
              <div className="p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Thông tin bài tập về nhà
                  </h2>
                  <p className="text-gray-500">
                    Nhập thông tin chi tiết cho bài tập về nhà
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-sm font-medium text-gray-700"
                    >
                      Tên bài tập về nhà <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Nhập tên bài tập về nhà"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-2xl border-gray-200 focus:border-green-300 focus:ring-green-200 py-3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="description"
                      className="text-sm font-medium text-gray-700"
                    >
                      Mô tả bài tập về nhà
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Nhập mô tả chi tiết về bài tập về nhà"
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="rounded-2xl border-gray-200 focus:border-green-300 focus:ring-green-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="status"
                      className="text-sm font-medium text-gray-700"
                    >
                      Trạng thái
                    </Label>
                    <Select
                      value={status.toString()}
                      onValueChange={(value) => setStatus(Number(value))}
                    >
                      <SelectTrigger
                        id="status"
                        className="rounded-2xl border-gray-200 focus:border-green-300 focus:ring-green-200"
                      >
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-gray-200">
                        <SelectItem value="1" className="rounded-xl">
                          Xuất bản
                        </SelectItem>
                        <SelectItem value="0" className="rounded-xl">
                          Bản nháp
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Cover Image Upload */}
                  {/* <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Ảnh cover (tùy chọn)
                    </Label>
                    <div className="space-y-4">
                      {coverImageUrl ? (
                        <div className="relative">
                          <div className="w-full h-48 rounded-2xl overflow-hidden border border-gray-200">
                            <Image
                              src={coverImageUrl || "/placeholder.svg"}
                              alt="Cover image"
                              fill
                              className="object-cover"
                            />
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 rounded-xl"
                            onClick={handleRemoveCoverImage}
                          >
                            <LucideX className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="relative border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-green-400 transition-colors">
                          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <LucideImage className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-900">
                              Tải lên ảnh cover
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, GIF tối đa 10MB
                            </p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverImageChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={uploadingCover}
                          />
                          {uploadingCover && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
                              <LucideLoader2 className="h-6 w-6 animate-spin text-green-600" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div> */}
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Câu hỏi (tùy chọn)
                  </h2>
                  <p className="text-gray-500">
                    Thêm câu hỏi vào bài tập về nhà
                  </p>
                </div>

                <Tabs defaultValue="bank">
                  <TabsList className="bg-gray-50 rounded-2xl shadow-sm border border-gray-100 p-1.5 py-7 mb-6">
                    <TabsTrigger
                      value="bank"
                      className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm rounded-xl px-6 py-3 font-medium transition-all duration-200"
                    >
                      Lấy từ ngân hàng câu hỏi
                    </TabsTrigger>
                    <TabsTrigger
                      value="new"
                      className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm rounded-xl px-6 py-3 font-medium transition-all duration-200"
                    >
                      Tạo câu hỏi mới
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="bank">
                    <div className="space-y-6">
                      <Button
                        className="w-full py-12 flex flex-col items-center gap-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl transition-all duration-200"
                        onClick={() => setQuestionBankOpen(true)}
                      >
                        <div className="w-12 h-12 bg-green-700 rounded-2xl flex items-center justify-center">
                          <LucideBookOpen className="h-6 w-6" />
                        </div>
                        <div className="text-center">
                          <span className="text-lg font-semibold block">
                            Mở ngân hàng câu hỏi
                          </span>
                          <span className="text-sm text-green-100">
                            Chọn câu hỏi từ ngân hàng câu hỏi có sẵn
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
                              Câu hỏi đã chọn ({selectedQuestions.length})
                            </h3>
                          </div>
                          <div className="bg-gray-50 rounded-2xl border border-gray-200 divide-y divide-gray-200">
                            {getSelectedQuestionsList().map(
                              (question, index) => {
                                if (!question) {
                                  console.log(
                                    "⚠️ Null question at index:",
                                    index
                                  );
                                  return null;
                                }
                                console.log("🎯 Rendering question:", {
                                  id: question.id,
                                  type: question.type,
                                  index,
                                });
                                return (
                                  <div
                                    key={question.id}
                                    className="p-6 hover:bg-gray-25 transition-colors"
                                  >
                                    <div className="flex gap-4">
                                      <div className="flex-1">
                                        {/* Question Title */}
                                        <div className="mb-3">
                                          <h4 className="text-lg font-semibold text-gray-900">
                                            Question {index + 1}:
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

                                          {/* Question Media */}
                                          {question.content?.media &&
                                            renderMediaContent(
                                              question.content.media
                                            )}
                                        </div>

                                        {/* Enhanced Answer Options Display */}
                                        {question.type === "multiple_choice" &&
                                          question.options?.answers && (
                                            <div className="mb-4">
                                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                                Đáp án:
                                              </div>
                                              <div className="grid grid-cols-2 gap-2">
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
                                                              {answer.text}
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
                                                Đáp án đúng:
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

                                        {question.type === "matching" &&
                                          (question.options as any)?.sources &&
                                          (question.options as any)
                                            ?.targets && (
                                            <div className="mb-4">
                                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                                Ghép đôi:
                                              </div>
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                  <div className="text-xs font-medium text-purple-600 mb-2">
                                                    Nguồn:
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
                                                            {
                                                              source.content
                                                                ?.text
                                                            }
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
                                                        items nữa
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                                <div>
                                                  <div className="text-xs font-medium text-pink-600 mb-2">
                                                    Đích:
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
                                                            {
                                                              target.content
                                                                ?.text
                                                            }
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
                                                        items nữa
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
                                                Thứ tự đúng:
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
                                                          {answer.text}
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
                                                Nhãn:
                                              </div>
                                              <div className="flex flex-wrap gap-2">
                                                {question.options.labels.map(
                                                  (label: any, idx: number) => (
                                                    <div
                                                      key={idx}
                                                      className="px-3 py-2 bg-cyan-50 border border-cyan-200 rounded-lg"
                                                    >
                                                      <span className="text-sm text-cyan-800">
                                                        {label.text}
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
                                                Phân loại:
                                              </div>
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                  <div className="text-xs font-medium text-teal-600 mb-2">
                                                    Danh mục:
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
                                                Kéo thả:
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
                                                              {answer.text}
                                                            </span>
                                                            {correctPosition >
                                                              0 && (
                                                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                                Vị trí{" "}
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
                                                    items nữa
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
                                                  Câu hỏi tự luận -{" "}
                                                  {question.type === "writing"
                                                    ? "Viết"
                                                    : "Nói"}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                        {/* Question Type Badge */}
                                        <div className="flex items-center gap-3">
                                          <Badge className="bg-green-50 text-green-600 border border-green-200 px-3 py-1 rounded-full text-xs font-medium">
                                            {formatQuestionType(question.type)}
                                          </Badge>
                                          {question.level && (
                                            <Badge
                                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                question.level === "easy"
                                                  ? "bg-green-100 text-green-700 border border-green-200"
                                                  : question.level === "medium"
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
                                            Điểm:
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
                                                : question.metadata?.points || 0
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
                                              href={`/manage/question-bank/edit/${
                                                question.id
                                              }${
                                                mode === "edit" && homeworkId
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
                                                "🗑️ Remove button clicked for question:",
                                                question.id,
                                                question.id.toString()
                                              );
                                              console.log(
                                                "🗑️ Current selected questions:",
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
                        Tạo câu hỏi mới
                      </h3>
                      <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                        Tạo câu hỏi mới để thêm vào bài tập về nhà. Câu hỏi sẽ
                        được lưu vào ngân hàng câu hỏi để sử dụng lại sau này.
                      </p>
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 py-3"
                        onClick={() => setShowCreateQuestion(true)}
                      >
                        <LucidePlus className="h-4 w-4 mr-2" />
                        Tạo câu hỏi mới
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
                                  "[HomeworkForm] onSuccess callback nhận:",
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
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                className="rounded-2xl border-gray-200 hover:border-gray-300 px-6 py-3 bg-transparent"
                asChild
              >
                <Link href={backUrl}>Hủy</Link>
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white rounded-2xl px-6 py-3"
                onClick={() => {
                  console.log("🔘 Save button clicked in HomeworkForm");
                  console.log("📝 Current form state:", {
                    name,
                    description,
                    status,
                    selectedQuestions,
                    selectedQuestionsData,
                    questionScores,
                  });
                  handleSave();
                }}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
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
                    Hướng dẫn
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {mode === "create"
                      ? "Các bước tạo bài tập về nhà"
                      : "Các bước chỉnh sửa bài tập về nhà"}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 mb-1">
                        {mode === "create"
                          ? "Nhập thông tin bài tập về nhà"
                          : "Cập nhật thông tin bài tập về nhà"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {mode === "create"
                          ? "Nhập tên, mô tả và các thông tin cơ bản của bài tập về nhà."
                          : "Chỉnh sửa tên, mô tả và các thông tin cơ bản của bài tập về nhà."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 mb-1">
                        {mode === "create"
                          ? "Thêm ảnh cover"
                          : "Cập nhật ảnh cover"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {mode === "create"
                          ? "Tải lên ảnh cover để bài tập về nhà trở nên hấp dẫn hơn."
                          : "Thay đổi hoặc thêm ảnh cover để bài tập về nhà trở nên hấp dẫn hơn."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 mb-1">
                        {mode === "create"
                          ? "Thêm câu hỏi"
                          : "Cập nhật câu hỏi"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {mode === "create"
                          ? "Chọn câu hỏi từ ngân hàng câu hỏi hoặc tạo câu hỏi mới."
                          : "Thêm hoặc xóa câu hỏi từ ngân hàng câu hỏi hoặc tạo câu hỏi mới."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                      4
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 mb-1">
                        {mode === "create"
                          ? "Tạo bài tập về nhà"
                          : "Lưu thay đổi"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {mode === "create"
                          ? 'Kiểm tra lại thông tin và nhấn nút "Tạo bài tập về nhà" để hoàn tất.'
                          : 'Kiểm tra lại thông tin và nhấn nút "Lưu thay đổi" để cập nhật bài tập về nhà.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Lưu ý quan trọng
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <LucideAlertCircle className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-sm text-blue-700">
                        Tất cả các trường thông tin đều có thể để trống, ngoại
                        trừ tên bài tập về nhà.
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
                          Khi thay đổi danh sách câu hỏi, hệ thống sẽ cập nhật
                          toàn bộ danh sách. Hãy đảm bảo rằng bạn đã chọn đầy đủ
                          tất cả các câu hỏi mà bạn muốn giữ lại.
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
