"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoleBasedHeaderSidebar } from "@/components/layout/role-based-header-sidebar";
import {
  ArrowLeft,
  Edit,
  Trash2,
  ListFilter,
  BookOpen,
  Layers,
  PenTool,
  Shuffle,
  Tag,
  MoveHorizontal,
  GripHorizontal,
  MessageSquare,
  Clock,
  ImageIcon,
  Music,
  Video,
  Check,
  X,
  HelpCircle,
  Loader2,
  LucideArrowLeft,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getQuestionById, QuestionMedia } from "@/lib/api/questions";
import { useToast } from "@/components/ui/use-toast";
import { TiptapMathViewer } from "@/components/question-editor/tiptap-math-viewer";
import { LatexText } from "@/components/latex-text";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useCurrentLocale, useTypedTranslations } from "@/lib/i18n/client";
import {
  QUESTION_TYPES as SHARED_QUESTION_TYPES,
  DIFFICULTY_LEVELS as SHARED_DIFFICULTY_LEVELS,
  CATEGORIES as SHARED_CATEGORIES,
  getQuestionTypeLabel,
  getDifficultyLabel,
  getCategoryLabel,
} from "@/lib/constants/questionTypes";

// Use shared constants for icon/color; names will be localized via helpers
const QUESTION_TYPES = SHARED_QUESTION_TYPES;
const DIFFICULTY_LEVELS = SHARED_DIFFICULTY_LEVELS;
const CATEGORIES = SHARED_CATEGORIES;

export default function QuestionDetailPage() {
  const router = useRouter()
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const t = useTypedTranslations("questionBank");
  const currentLocale = useCurrentLocale();
  const localePrefix = `/${currentLocale}`;

  // Lấy thông tin chi tiết câu hỏi từ API
  useEffect(() => {
    const fetchQuestionDetail = async () => {
      try {
        setLoading(true);
        const questionData = await getQuestionById(Number(id));

        if (!questionData) {
          toast({
            title: t("errorTitle"),
            description: t("loadQuestionError"),
            variant: "destructive",
          });
          return;
        }

        console.log("Question Detail:", questionData);
        setQuestion(questionData);
      } catch (error) {
        console.error("Error fetching question detail:", error);
        toast({
          title: t("errorTitle"),
          description: t("loadQuestionError"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionDetail();
  }, [id, toast]);

  // Lấy thông tin loại câu hỏi
  const questionType = question?.type
    ? QUESTION_TYPES[question.type as keyof typeof QUESTION_TYPES]
    : {
        name: t("unknown"),
        icon: HelpCircle,
        color: "bg-gray-100 text-gray-600",
      };

  // Lấy thông tin độ khó
  const difficulty = question?.level
    ? DIFFICULTY_LEVELS[question.level as keyof typeof DIFFICULTY_LEVELS]
    : {
        name: t("unknown"),
        color: "bg-gray-100 text-gray-600",
      };

  // Lấy thông tin danh mục
  const category = question?.topic
    ? CATEGORIES[question.topic as keyof typeof CATEGORIES]
    : {
        name: t("unknown"),
        color: "bg-gray-50 text-gray-600",
      };

  // Localized labels for type and category
  const localizedTypeName = question?.type
    ? getQuestionTypeLabel(String(question.type), t)
    : t("unknown");

  // Resolve icon component from shared constants
  const TypeIconComponent =
    (questionType && (questionType as any).icon) || HelpCircle;

  const localizedCategoryName = question?.topic
    ? getCategoryLabel(String(question.topic), t)
    : t("unknown");

  // Định dạng thời gian
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Helper: render HTML via Tiptap when value is HTML, otherwise render LaTeX via KaTeX
  const renderInline = (text?: string, className = "") => {
    const value = (text || "").trim();
    if (!value) return <span className={className} />;
    if (/<[^>]+>/.test(value)) {
      return (
        <TiptapMathViewer
          value={value}
          className={`inline ${className}`}
          isHtml
        />
      );
    }
    return <LatexText value={value} className={className} inline />;
  };

  // Hiển thị media của câu hỏi
  const renderQuestionMedia = () => {
    if (question && question.content.medias) {
      return question.content.medias.map((media: QuestionMedia, index: number) => {
        if (media.type === 'image') {
          return (
            <div
              key={media.url || media.type + index}
              className="mt-4 w-full max-w-md h-60 relative rounded overflow-hidden"
            >
              <Image
                src={
                  media?.url ||
                  '/icons/placeholder.svg?height=240&width=480&query=question image'
                }
                alt={'media content'}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )
        }
        if (media.type === 'audio') {
          return (
            <div
              key={media.url || media.type + index}
              className="mt-4 p-4 bg-purple-50 rounded-md border border-purple-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <Music className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium text-purple-700">
                  {t('mediaAudio')}
                </span>
              </div>
              <audio controls className="w-full max-w-md">
                <source src={media?.url} type="audio/mpeg" />
                Trình duyệt của bạn không hỗ trợ phát âm thanh.
              </audio>
            </div>
          )
        }
        if (media.type === 'video') {
          return (
            <div
              key={media.url || media.type + index}
              className="mt-4 p-4 bg-amber-50 rounded-md border border-amber-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <Video className="h-5 w-5 text-amber-500" />
                <span className="text-sm font-medium text-amber-700">
                  {t('mediaVideo')}
                </span>
              </div>
              <div className="relative w-full max-w-md aspect-video rounded overflow-hidden">
                <video
                  controls
                  className="w-full h-full object-cover"
                  poster="/video-thumbnail.png"
                >
                  <source src={media?.url} type="video/mp4" />
                  Trình duyệt của bạn không hỗ trợ phát video.
                </video>
              </div>
            </div>
          )
        }
      })
    } else {
      return null
    }
  }


  // Hiển thị đáp án dựa trên loại câu hỏi
  const renderAnswers = () => {
    if (!question) return null;

    switch (question.type) {
      case "multiple_choice":
        return (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-3">{t("optionsHeader")}</h3>
            <div className="space-y-3">
              {question.options?.answers?.map((answer: any, index: number) => (
                <div
                  key={index}
                  className={`flex items-start p-3 rounded-lg ${
                    answer.is_correct
                      ? "bg-green-50 border border-green-200"
                      : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center mt-0.5 mr-3 ${
                      answer.is_correct ? "bg-green-100" : "bg-gray-100"
                    }`}
                  >
                    {answer.is_correct ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {renderInline(answer.text, "text-sm font-medium")}
                    </p>
                    {answer.media?.url && answer.media.type === "image" && (
                      <div className="mt-2 w-24 h-24 relative rounded overflow-hidden">
                        <Image
                          src={
                            answer.media.url ||
                            "/placeholder.svg?height=96&width=96&query=answer image"
                          }
                          alt={answer.text}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </div>
                    )}
                    {answer.media?.url && answer.media.type === "audio" && (
                      <div className="mt-2 w-full max-w-xs">
                        <audio controls className="w-full">
                          <source src={answer.media.url} />
                        </audio>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "fill_in_blanks":
        return (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-3">{t("blanksHeader")}</h3>
            <p className="text-base mb-4 flex flex-col gap-0.5">
              {(question.content?.text || "")
                .replace(/<p>|<\/p>/g, "\n")
                .split(/\n+/)
                .filter((line: string) => line.trim() !== "")
                .map((line: string, lineIdx: number) => (
                  <span
                    key={lineIdx}
                    className="flex flex-wrap items-center gap-y-1"
                  >
                    {line
                      .split(/(\[blank\d*\])/)
                      .map((part: string, idx: number) => {
                        const blankMatch = part.match(/\[blank(\d*)\]/);
                        return blankMatch ? (
                          <span
                            key={idx}
                            className="inline-block px-3 py-1 bg-purple-100 rounded mx-1 align-middle"
                          >
                            ___
                          </span>
                        ) : part.trim() !== "" ? (
                          <span key={idx} className="inline align-middle">
                            <TiptapMathViewer
                              value={part}
                              className="inline"
                              isHtml
                            />
                          </span>
                        ) : null;
                      })}
                  </span>
                ))}
            </p>
            <div className="space-y-3">
              {question.options?.answers?.map((answer: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center p-3 bg-purple-50 rounded-lg border border-purple-200"
                >
                  <Badge className="bg-purple-200 text-purple-800 mr-3">
                    {t("blankLabel", {
                      n: String(answer.correct_position || index + 1),
                    })}
                  </Badge>
                  <span className="font-medium">
                    {renderInline(answer.text, "font-medium")}
                  </span>
                  {answer.media?.url && answer.media.type === "image" && (
                    <div className="ml-auto w-12 h-12 relative rounded overflow-hidden">
                      <Image
                        src={
                          answer.media.url ||
                          "/placeholder.svg?height=48&width=48&query=answer image"
                        }
                        alt={answer.text}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "ordering":
        return (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-3">{t("orderingHeader")}</h3>
            <div className="space-y-2">
              {question.options?.answers?.map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200"
                >
                  <div className="w-8 h-8 flex items-center justify-center bg-amber-200 rounded-full text-amber-800 font-medium">
                    {index + 1}
                  </div>
                  <span className="font-medium">
                    {renderInline(item.text, "font-medium")}
                  </span>
                  {item.media?.url && item.media.type === "image" && (
                    <div className="ml-auto w-12 h-12 relative rounded overflow-hidden">
                      <Image
                        src={
                          item.media.url ||
                          "/placeholder.svg?height=48&width=48&query=item image"
                        }
                        alt={item.text}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  )}
                  {item.media?.url && item.media.type === "audio" && (
                    <div className="ml-auto w-40">
                      <audio controls className="w-full">
                        <source src={item.media.url} />
                      </audio>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "matching":
        return (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-3">{t("matchingHeader")}</h3>
            <div className="space-y-3">
              {question.options?.sources?.map((source: any, index: number) => {
                const target = question.options?.targets?.[index];
                if (!target) return null;

                return (
                  <div key={index} className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="font-medium">
                        {renderInline(source.content?.text, "font-medium")}
                      </p>
                      {source.content?.media?.url &&
                        source.content.media.type === "image" && (
                          <div className="mt-2 w-20 h-20 relative rounded overflow-hidden">
                            <Image
                              src={
                                source.content.media.url ||
                                "/placeholder.svg?height=80&width=80&query=source image"
                              }
                              alt={source.content.text}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          </div>
                        )}
                      {source.content?.media?.url &&
                        source.content.media.type === "audio" && (
                          <div className="mt-2">
                            <audio controls className="w-full max-w-xs">
                              <source src={source.content.media.url} />
                            </audio>
                          </div>
                        )}
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="font-medium">
                        {renderInline(target.content?.text, "font-medium")}
                      </p>
                      {target.content?.media?.url &&
                        target.content.media.type === "image" && (
                          <div className="mt-2 w-20 h-20 relative rounded overflow-hidden">
                            <Image
                              src={
                                target.content.media.url ||
                                "/placeholder.svg?height=80&width=80&query=target image"
                              }
                              alt={target.content.text}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          </div>
                        )}
                      {target.content?.media?.url &&
                        target.content.media.type === "audio" && (
                          <div className="mt-2">
                            <audio controls className="w-full max-w-xs">
                              <source src={target.content.media.url} />
                            </audio>
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "drag_drop":
        return (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-3">{t("dragDropHeader")}</h3>
            <p className="text-base mb-4 flex flex-col gap-0.5">
              {(question.content?.text || "")
                .replace(/<p>|<\/p>/g, "\n")
                .split(/\n+/)
                .filter((line: string) => line.trim() !== "")
                .map((line: string, lineIdx: number) => (
                  <span
                    key={lineIdx}
                    className="flex flex-wrap items-center gap-y-1"
                  >
                    {line
                      .split(/(\[blank\d*\])/)
                      .map((part: string, index: number) => {
                        const blankMatch = part.match(/\[blank(\d*)\]/);
                        return blankMatch ? (
                          <span
                            key={index}
                            className="inline-block px-3 py-1 bg-cyan-100 rounded mx-1 align-middle"
                          >
                            ___
                          </span>
                        ) : part.trim() !== "" ? (
                          <span key={index} className="inline align-middle">
                            <TiptapMathViewer
                              value={part}
                              className="inline"
                              isHtml
                            />
                          </span>
                        ) : null;
                      })}
                  </span>
                ))}
            </p>
            <div className="mt-4">
              <h4 className="text-base font-medium mb-2">
                {t("optionsHeader")}
              </h4>
              <div className="flex flex-wrap gap-2">
                {question.options?.answers?.map(
                  (option: any, index: number) => (
                    <div
                      key={index}
                      className={`px-3 py-2 rounded-md text-sm ${
                        option.correct_position
                          ? "bg-cyan-100 border border-cyan-200 text-cyan-800"
                          : "bg-gray-100 border border-gray-200 text-gray-700"
                      }`}
                    >
                      {renderInline(option.text, "text-sm")}
                      {option.correct_position && (
                        <span className="ml-2 text-xs text-cyan-600">
                          {option.correct_position > 0
                            ? t("positionLabel", {
                                seconds: String(option.correct_position),
                                pos: String(option.correct_position),
                              })
                            : ""}
                        </span>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        );

      case "labeling":
        return (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-3">{t("labelingHeader")}</h3>
            {/* Hiển thị hình ảnh và các ô trống */}
            <div className="relative w-full max-w-md h-60 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
              {question.content?.media?.url ? (
                <div className="relative w-full h-full">
                  <Image
                    src={
                      question.content.media.url ||
                      "/placeholder.svg?height=240&width=480&query=labeling image"
                    }
                    alt="Labeling image"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />

                  {/* Hiển thị các ô trống dựa trên tọa độ */}
                  {question.options?.blanks?.map(
                    (blank: any, index: number) => {
                      if (!blank.coordinates) return null;
                      const { x, y, w, h } = blank.coordinates;

                      return (
                        <div
                          key={index}
                          className="absolute border-2 border-solid border-pink-500 rounded-md bg-pink-100 bg-opacity-40"
                          style={{
                            left: `${x / 10}%`,
                            top: `${y / 10}%`,
                            width: `${w / 10}%`,
                            height: `${h / 10}%`,
                            zIndex: 10,
                          }}
                        >
                          <div className="absolute -top-6 left-0 text-xs font-medium bg-pink-100 px-1.5 py-0.5 rounded text-pink-800 border border-pink-300">
                            {index + 1}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="h-16 w-16 text-gray-300" />
                </div>
              )}
            </div>

            {/* Hiển thị danh sách nhãn */}
            <div className="mt-4">
              <h4 className="text-base font-medium mb-2">
                {t("labelsHeader")}
              </h4>
              <div className="flex flex-wrap gap-2">
                {question.options?.labels?.map((label: any, index: number) => (
                  <div
                    key={index}
                    className="px-3 py-1.5 rounded-full bg-pink-100 text-pink-800 text-sm border border-pink-200 flex items-center gap-1"
                  >
                    <span className="w-5 h-5 flex items-center justify-center bg-pink-200 rounded-full text-pink-800 text-xs font-medium">
                      {label.correct_position || index + 1}
                    </span>
                    {renderInline(label.text, "text-sm")}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "category":
        return (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-3">{t("categoryHeader")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {question.options?.categories?.map(
                (category: any, catIndex: number) => {
                  // Lấy ID của category
                  const categoryId = category.id || `cat-${catIndex + 1}`;

                  // Tìm các items thuộc về category này dựa vào correct_answers.list
                  const categoryItems = question.options?.items?.filter(
                    (item: any) => {
                      // Kiểm tra xem item này có thuộc category này không
                      const itemId = item.id;
                      const itemCategoryId =
                        question.correct_answers?.list?.[itemId];
                      return itemCategoryId === categoryId;
                    }
                  );

                  return (
                    <div
                      key={catIndex}
                      className="border rounded-lg overflow-hidden"
                    >
                      <div className="bg-orange-100 p-3 font-medium border-b">
                        {category.media?.url &&
                          category.media.type === "image" && (
                            <div className="w-6 h-6 inline-block mr-2 relative">
                              <Image
                                src={
                                  category.media.url ||
                                  "/placeholder.svg?height=24&width=24&query=category image"
                                }
                                alt={category.name}
                                fill
                                className="object-cover rounded"
                                sizes="24px"
                              />
                            </div>
                          )}
                        {category.media?.url &&
                          category.media.type === "audio" && (
                            <div className="mt-2">
                              <audio controls className="w-full max-w-xs">
                                <source src={category.media.url} />
                              </audio>
                            </div>
                          )}
                        {category.name}
                      </div>
                      <div className="p-3 bg-white">
                        {categoryItems && categoryItems.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {categoryItems.map(
                              (item: any, itemIndex: number) => (
                                <div
                                  key={itemIndex}
                                  className="px-2 py-1 bg-orange-50 text-sm rounded border border-orange-200 flex items-center gap-1"
                                >
                                  {renderInline(item.text, "text-sm")}
                                  {item.media?.url &&
                                    item.media.type === "image" && (
                                      <div className="w-4 h-4 relative">
                                        <Image
                                          src={
                                            item.media.url ||
                                            "/placeholder.svg?height=16&width=16&query=item image"
                                          }
                                          alt={item.text}
                                          fill
                                          className="object-cover rounded"
                                          sizes="16px"
                                        />
                                      </div>
                                    )}
                                  {item.media?.url &&
                                    item.media.type === "audio" && (
                                      <div className="w-28">
                                        <audio controls className="w-full">
                                          <source src={item.media.url} />
                                        </audio>
                                      </div>
                                    )}
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic">
                            {t("noItems")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        );

      case "writing":
        return (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-3">{t("essayHeader")}</h3>
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-5 w-5 text-indigo-500" />
                <span className="font-medium text-indigo-700">
                  {t("guidance")}
                </span>
              </div>
              <p className="text-gray-700 mb-3">
                {question.metadata?.instructions ||
                  t("defaultEssayInstruction")}
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="px-3 py-1 bg-indigo-100 rounded-full text-indigo-600">
                  <Clock className="h-4 w-4 inline-block mr-1" />{" "}
                  {t("timeLabel")}
                  {formatTime(question.metadata?.time || 60)}
                </div>
                {question.metadata?.max_characters && (
                  <div className="px-3 py-1 bg-indigo-100 rounded-full text-indigo-600">
                    {t("charLimit", {
                      count: String(question.metadata.max_characters),
                    })}
                  </div>
                )}
                {question.metadata?.allow_image_upload && (
                  <div className="px-3 py-1 bg-indigo-100 rounded-full text-indigo-600">
                    <ImageIcon className="h-4 w-4 inline-block mr-1" />{" "}
                    {t("allowImageUpload")}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-gray-500 italic text-sm">
                {t("essayPlaceholder")}
              </p>
            </div>
          </div>
        );

      case "speaking":
        return (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-3">{t("speakingHeader")}</h3>
            <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-5 w-5 text-rose-500" />
                <span className="font-medium text-rose-700">
                  {t("guidance")}
                </span>
              </div>
              <p className="text-gray-700 mb-3">
                {question.metadata?.instructions ||
                  t("defaultSpeakingInstruction")}
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="px-3 py-1 bg-rose-100 rounded-full text-rose-600">
                  <Clock className="h-4 w-4 inline-block mr-1" />{" "}
                  {t("timeLabel")} {formatTime(question.metadata?.time || 60)}
                </div>
                {question.metadata?.max_recording_time && (
                  <div className="px-3 py-1 bg-rose-100 rounded-full text-rose-600">
                    {t("maxRecordingTime", {
                      seconds: String(question.metadata.max_recording_time),
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-gray-500 italic text-sm">
                {t("speakingPlaceholder")}
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500 italic">{t("noAnswerDetail")}</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <RoleBasedHeaderSidebar>
          <main className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <Loader2 className="h-12 w-12 text-enspire-green mx-auto mb-4 animate-spin" />
                <h3 className="text-xl font-medium text-gray-700">
                  {t("loadingQuestion")}
                </h3>
                <p className="text-gray-500 mt-2">{t("pleaseWait")}</p>
              </div>
            </div>
          </main>
        </RoleBasedHeaderSidebar>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50">
        <RoleBasedHeaderSidebar>
          <main className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-700">
                  {t("notFoundTitle")}
                </h3>
                <p className="text-gray-500 mt-2">{t("notFoundDesc")}</p>
              </div>
            </div>
          </main>
        </RoleBasedHeaderSidebar>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <RoleBasedHeaderSidebar>
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" asChild>
              <p onClick={() => router.back()} className="cursor-pointer">
                <LucideArrowLeft className="h-5 w-5" />
              </p>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {t("detailTitle")}
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="border-enspire-green">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{t("basicInfo")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-full ${questionType.color}`}>
                        <TypeIconComponent className="h-5 w-5" />
                      </div>
                      <span className="font-medium">{localizedTypeName}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge className={difficulty.color}>
                        {question.level === "easy"
                          ? t("level.easy")
                          : question.level === "medium"
                          ? t("level.medium")
                          : t("level.hard")}
                      </Badge>
                      <Badge variant="outline">{localizedCategoryName}</Badge>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">{t("skillLabel")}</p>
                    <p className="font-medium">
                      {question.skill || t("unknown")}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">{t("pointsLabel")}</p>
                    <p className="font-medium">
                      {question.metadata?.points || 10}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">
                      {t("timeLimitLabel")}
                    </p>
                    <p className="font-medium">
                      {formatTime(question.metadata?.time || 60)}
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button variant="outline" className="w-full" asChild>
                      <Link
                        href={`${localePrefix}/manage/question-bank/edit/${id}`}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {t("actions.edit")}
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full mt-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t("actions.delete")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main content */}
            <div className="lg:col-span-3">
              <Card className="border-enspire-green">
                <CardHeader>
                  <CardTitle>{t("questionContent")}</CardTitle>
                  <CardDescription>
                    {question.metadata?.instructions || t("defaultInstruction")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-medium mb-2">
                        {t("questionHeader")}
                      </h2>
                      <TiptapMathViewer
                        value={
                          question.content?.text
                            ? question.content.text.split("\n").join("<br />")
                            : ""
                        }
                        className="text-base"
                        isHtml
                      />
                      {renderQuestionMedia()}
                    </div>

                    {renderAnswers()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </RoleBasedHeaderSidebar>
    </div>
  );
}