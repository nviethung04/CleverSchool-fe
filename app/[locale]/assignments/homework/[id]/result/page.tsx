"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  User,
  FileText,
  Mic,
  PenTool,
  Volume2,
  CheckCircle2,
  Clock,
  Target,
  Award,
  Star,
  Download,
  File,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TiptapMathViewer } from "@/components/question-editor/tiptap-math-viewer";
import {
  getHomeworkAnswersByStudent,
  HomeworkFile,
} from "@/lib/api/exam-answers";
import { getQuestions } from "@/lib/api/questions";
import { useTypedTranslations } from "@/lib/i18n/client";
import { LatexText } from "@/components/latex-text";

// Component to render fill in blank question text with blanks
const FillInBlankQuestionText = ({
  question,
}: {
  question: HomeworkQuestion;
}) => {
  const BLANK_PLACEHOLDER = "___BLANK___";
  const htmlWithPlaceholders = question.content.text.replace(
    /\[blank\]/g,
    BLANK_PLACEHOLDER
  );
  const blanksCount = (
    htmlWithPlaceholders.match(new RegExp(BLANK_PLACEHOLDER, "g")) || []
  ).length;

  // Create content with blanks
  const createContentWithBlanks = () => {
    let content = htmlWithPlaceholders;
    let blankIndex = 0;

    // Replace each placeholder with a blank input
    content = content.replace(new RegExp(BLANK_PLACEHOLDER, "g"), () => {
      blankIndex++;
      return `<input type="text" disabled placeholder="__" class="placeholder-transparent text-lg lg:text-xl xl:text-2xl bg-transparent text-left font-medium leading-tight mx-0.5 inline-block" style="border-bottom: 2px solid #ccc; background: transparent; padding: 0 2px; width: 30px; display: inline-block; vertical-align: baseline; position: relative; top: -1px;" />`;
    });

    return content;
  };

  return (
    <div
      className="text-gray-700 text-lg leading-relaxed"
      dangerouslySetInnerHTML={{
        __html: createContentWithBlanks(),
      }}
    />
  );
};

interface HomeworkOverview {
  student_name: string;
  homework_name: string;
  homework_description: string;
  homework_status: number;
  homework_cover_image: string;
  total_questions: number;
  questions_completed: string;
  last_question_id_completed: string;
  manual_questions_count: number;
  ratio?: number;
  latest_comment?: string;
  homework_question_form: string;
  question_files?: HomeworkFile[];
}

interface HomeworkQuestion {
  id: string;
  type: string;
  content: {
    media?: { type: string; url: string; file?: string };
    text: string;
  };
  options?: {
    answers?: Array<any>;
    sources?: Array<any>;
    targets?: Array<any>;
    labels?: Array<any>;
    blanks?: Array<any>;
    items?: Array<any>;
    categories?: Array<any>;
    questions?: Array<any>;
    groups?: Array<any>;
  };
  correct_answers?: any;
  answer_fill_in_blank?: {
    answers?: Array<{
      answer: string;
      true_answer: string;
      is_correct: boolean;
      score?: number;
    }>;
    is_all_correct?: boolean;
  };
  metadata?: {
    instructions?: string;
    description?: string;
    points?: number;
    time?: number;
    is_random?: boolean;
  };
  status?: boolean;
  sort_position?: number;
  image_width?: number;
  image_height?: number;
  source_question_id?: string;
  source?: any;
  attributes?: Array<any>;
  subject_id?: string;
  subject?: any;
  created_at?: string;
  updated_at?: string;
}

interface ManualAnswer {
  id: string;
  type: string;
  source: string;
  status: boolean;
  content: string;
  answer: string;
  file_url: string;
  content_struct: any;
  is_scored?: boolean;
  manual_score?: number;
}

interface StudentAnswer {
  questionId: string;
  answer: any;
  isCorrect?: boolean;
}

// Component to render media content
const MediaContent = ({ media }: { media?: { type: string; url: string } }) => {
  if (!media) return null;

  switch (media.type) {
    case "image":
      return (
        <div className="mt-2">
          <img
            src={media.url || "/placeholder.svg?height=120&width=180"}
            alt="Question media"
            className="max-w-full h-auto rounded border max-h-32"
          />
        </div>
      );
    case "video":
      return (
        <div className="mt-2">
          <video
            controls
            className="max-w-full h-auto rounded border max-h-32"
            src={media.url}
          />
        </div>
      );
    case "audio":
      return (
        <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded mt-2">
          <Volume2 className="h-4 w-4" />
          <audio controls src={media.url} className="flex-1" />
        </div>
      );
    default:
      return null;
  }
};

// Component to render file item
const FileItem = ({
  file,
  index,
  isQuestionFile = false,
}: {
  file: HomeworkFile;
  index: number;
  isQuestionFile?: boolean;
}) => {
  const getFileIcon = (type: string) => {
    if (type === "image") return <ImageIcon className="h-5 w-5" />;
    if (type === "pdf") return <File className="h-5 w-5 text-red-500" />;
    return <File className="h-5 w-5" />;
  };

  const getFileName = (url: string) => {
    try {
      const urlParts = url.split("/");
      return urlParts[urlParts.length - 1];
    } catch {
      return `File ${index + 1}`;
    }
  };

  const openFile = (url: string) => {
    window.open(url, "_blank");
  };

  // For question files: always show file name with view button
  if (isQuestionFile) {
    return (
      <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {getFileIcon(file.type)}
            <span className="text-sm font-medium truncate">
              {getFileName(file.url)}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openFile(file.url)}
          >
            Xem
          </Button>
        </div>
      </div>
    );
  }

  // For submitted files: images display, others show filename with view button
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      {file.type === "image" ? (
        <img
          src={file.url}
          alt={`File ${index + 1}`}
          className="w-full h-auto rounded-lg"
        />
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {getFileIcon(file.type)}
            <span className="text-sm font-medium truncate">
              {getFileName(file.url)}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openFile(file.url)}
          >
            Xem
          </Button>
        </div>
      )}
    </div>
  );
};

// Component to render different question types
const QuestionAnswerDisplay = ({
  question,
  manualAnswer,
  index,
  t,
}: {
  question: HomeworkQuestion;
  manualAnswer?: ManualAnswer;
  index: number;
  t: any;
}) => {
  const getQuestionIcon = (type: string) => {
    switch (type) {
      case "speaking":
        return <Mic className="h-4 w-4" />;
      case "writing":
        return <PenTool className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getQuestionStatusBadge = () => {
    if (question.type === "writing" || question.type === "speaking") {
      if (manualAnswer?.is_scored === true) {
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t("graded")}
          </Badge>
        );
      } else {
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            {t("pendingGrading")}
          </Badge>
        );
      }
    }

    return (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        {t("completed")}
      </Badge>
    );
  };

  // Render media content helper (from HomeworkDetailPage)
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

  const renderCorrectAnswers = () => {
    // Don't show correct answers for writing/speaking questions
    if (question.type === "writing" || question.type === "speaking") {
      return null;
    }

    switch (question.type) {
      case "multiple_choice":
        return (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              {t("correctAnswers")}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {question.options?.answers?.map((answer: any, idx: number) => {
                const isCorrect =
                  typeof answer.is_correct === "boolean"
                    ? answer.is_correct
                    : question.correct_answers?.ids?.includes(idx);
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
                        <LatexText value={answer.text} />
                      </div>
                      {answer.media && renderMediaContent(answer.media)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "fill_in_blanks":
        return (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              {t("correctAnswers")}
            </div>
            <div className="flex flex-wrap gap-2">
              {question.options?.answers?.map((answer: any, idx: number) => {
                if (answer.correct_position > 0) {
                  return (
                    <div
                      key={idx}
                      className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                      <span className="text-xs font-medium text-blue-600">
                        {t("position")} {answer.correct_position}:
                      </span>
                      <span className="text-sm text-blue-800 ml-1">
                        <LatexText value={answer.text} />
                      </span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        );

      case "matching":
        return (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              {t("correctAnswers")}
            </div>
            <div className="grid grid-cols-1 gap-2">
              {(() => {
                const maxLen = Math.max(
                  question.options?.sources?.length || 0,
                  question.options?.targets?.length || 0
                );
                return Array.from({ length: maxLen }).map((_, idx) => {
                  const source = question.options?.sources?.[idx];
                  const target = question.options?.targets?.[idx];
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
                              <LatexText value={source.content?.text} />
                            </span>
                            {source.content?.media &&
                              renderMediaContent(source.content.media)}
                          </>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                      <span className="mx-2 text-gray-400">↔</span>
                      {/* Target */}
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        {target ? (
                          <>
                            <span className="text-pink-800 font-medium break-words">
                              <LatexText value={target.content?.text} />
                            </span>
                            {target.content?.media &&
                              renderMediaContent(target.content.media)}
                          </>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        );

      case "ordering":
        return (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              {t("correctOrder")}
            </div>
            <div className="space-y-2">
              {question.options?.answers
                ?.sort(
                  (a: any, b: any) =>
                    (a.correct_position || 0) - (b.correct_position || 0)
                )
                ?.map((answer: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg"
                  >
                    <span className="w-6 h-6 bg-orange-200 text-orange-800 rounded-full flex items-center justify-center text-xs font-medium">
                      {answer.correct_position || idx + 1}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm text-orange-800">
                        <LatexText value={answer.text} />
                      </div>
                      {answer.media && renderMediaContent(answer.media)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        );

      case "labeling":
        return (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              {t("labels")}
            </div>
            <div className="flex flex-wrap gap-2">
              {question.options?.labels?.map((label: any, idx: number) => (
                <div
                  key={idx}
                  className="px-3 py-2 bg-cyan-50 border border-cyan-200 rounded-lg flex items-center gap-2"
                >
                  <span className="text-sm text-cyan-800">
                    <LatexText value={label.text} />
                  </span>
                  {label.media && renderMediaContent(label.media)}
                </div>
              ))}
            </div>
          </div>
        );

      case "category":
        return (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">
              {t("correctAnswers")}
            </div>
            <div className="space-y-6">
              {question.options?.categories?.map(
                (category: any, categoryIndex: number) => {
                  const categoryId = String(category.id);
                  const groupPosition = categoryIndex + 1; // group_position starts from 1

                  // Find items that belong to this category based on group_position
                  const itemsInCategory =
                    question.options?.items?.filter(
                      (item: any) => item.group_position === groupPosition
                    ) || [];

                  if (itemsInCategory.length === 0) {
                    return null;
                  }

                  return (
                    <div
                      key={categoryId}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200"
                    >
                      {/* Category Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {String.fromCharCode(65 + categoryIndex)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-900 text-lg">
                            <LatexText value={category.name || category.text} />
                          </h4>
                          {category.media && (
                            <div className="mt-1">
                              {renderMediaContent(category.media)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Items in this category */}
                      <div className="ml-11">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {itemsInCategory.map((item: any, idx: number) => (
                            <div
                              key={item.id}
                              className="bg-white border border-blue-300 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                                  {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-800 break-words">
                                    <LatexText value={item.text} />
                                  </div>
                                  {item.media && item.media.type !== "text" && (
                                    <div className="mt-1">
                                      {renderMediaContent(item.media)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }
              )}

              {/* Fallback: If no categories or items, show simple list */}
              {(!question.options?.categories ||
                question.options.categories.length === 0) && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-800 mb-3 text-lg">
                    {t("allItems")}:
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {question.options?.items?.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-800 break-words">
                              <LatexText value={item.text} />
                            </span>
                            {item.media && item.media.type !== "text" && (
                              <div className="mt-1">
                                {renderMediaContent(item.media)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case "drag_drop":
        return (
          <div className="mb-4">
            <div className="font-medium text-blue-700 mb-1">
              {t("allAnswers")}
            </div>
            <div className="space-y-2">
              {question.options?.answers?.map((answer: any, idx: number) => (
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
                      ? `${t("position")} ${answer.correct_position}:`
                      : t("wrongAnswer")}
                  </span>
                  <span
                    className={`inline-flex items-center ${
                      answer.correct_position > 0
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    } px-3 py-1 rounded-full font-medium text-sm border`}
                  >
                    <LatexText value={answer.text} />
                    {answer.media && answer.media.type !== "text" && (
                      <span className="ml-1">
                        {renderMediaContent(answer.media)}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderManualAnswer = () => {
    if (!manualAnswer) return null;

    return (
      <div className="space-y-4">
        {/* Student's Answer */}
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">{t("yourAnswer")}:</h4>
          <div className="text-gray-700">
            {manualAnswer.type === "speaking" ? (
              manualAnswer.file_url ? (
                <div className="flex items-center space-x-3">
                  <Mic className="h-5 w-5 text-blue-600" />
                  <audio
                    controls
                    src={manualAnswer.file_url}
                    className="flex-1"
                  />
                </div>
              ) : (
                <span className="italic text-gray-500">
                  {t("noRecordingSubmitted")}
                </span>
              )
            ) : manualAnswer.type === "writing" ? (
              manualAnswer.answer ? (
                <div className="whitespace-pre-wrap">{manualAnswer.answer}</div>
              ) : (
                <span className="italic text-gray-500">
                  {t("noWrittenAnswerSubmitted")}
                </span>
              )
            ) : null}
          </div>

          {/* Score Display based on is_scored */}
          <div className="mt-4">
            {manualAnswer.is_scored === true ? (
              <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">
                    {t("score")}:
                  </span>
                  <span className="text-lg font-bold text-green-700">
                    {manualAnswer.manual_score || 0}/10
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                  <span className="text-yellow-700 font-medium">
                    {t("pendingGrading")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden rounded-2xl shadow-lg border-0 bg-white">
      <CardHeader className="bg-gray-50 py-4 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-md md:text-xl">
            {getQuestionIcon(question.type)}
            <span className="ml-2">
              {t("question")} {index + 1}
            </span>
            <Badge variant="outline" className="ml-2 capitalize">
              {question.type.replace("_", " ")}
            </Badge>
          </CardTitle>
          {getQuestionStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="p-8">
        {/* Question text */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-2">{t("question")}:</h4>
          <div className="text-gray-700 space-y-2">
            {question.type === "fill_in_blanks" ? (
              <FillInBlankQuestionText question={question} />
            ) : (
              <TiptapMathViewer value={question.content.text || ""} />
            )}
            {/* Display main media */}
            {question.content.media?.type && question.content.media?.url && (
              <MediaContent media={question.content.media} />
            )}
          </div>
          {question.metadata?.instructions && (
            <p className="text-sm text-gray-600 mt-2 italic">
              {question.metadata.instructions}
            </p>
          )}
        </div>

        {/* Correct Answers (only for non-manual questions) */}
        {renderCorrectAnswers()}

        {/* Manual Answer (only for writing/speaking questions) */}
        {renderManualAnswer()}
      </CardContent>
    </Card>
  );
};

export default function HomeworkResultPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const homeworkId = params.id as string;
  const locale = (params as any)?.locale || "vi";
  const from = searchParams.get("from");
  const urlRatio = searchParams.get("ratio");

  const t = useTypedTranslations("homeworkResult");

  const [overview, setOverview] = useState<HomeworkOverview | null>(null);
  const [questions, setQuestions] = useState<HomeworkQuestion[]>([]);
  const [manualAnswers, setManualAnswers] = useState<ManualAnswer[]>([]);
  const [submitFiles, setSubmitFiles] = useState<HomeworkFile[]>([]);
  const [isAllScored, setIsAllScored] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isScored, setIsScored] = useState<boolean>(false);

  const weekParam = searchParams.get("week");
  const courseIdParam = searchParams.get("courseId");

  useEffect(() => {
    const checkDevice = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      const isMobileScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isMobileScreen);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  useEffect(() => {
    fetchSubmission();
  }, []);

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      const response = await getHomeworkAnswersByStudent({
        homework_id: Number(homeworkId),
      });

      if (response && response.data) {
        setOverview(response.data.overview);
        setIsAllScored(response.data.is_all_scored ?? true);
        setSubmitFiles(response.data.submit_files || []);
        setIsSubmitted(response.data.is_submitted ?? false);
        setIsScored(response.data.is_scored ?? false);

        // Fetch questions from getQuestions API only if form type is "question"
        if (response.data.overview.homework_question_form === "question") {
          const questionsResponse = await getQuestions({
            homework_id: Number(homeworkId),
          });
          setQuestions(questionsResponse.questions || []);
        }

        setManualAnswers(response.data.manual_answers || []);
      } else {
        setOverview(null);
        setQuestions([]);
        setManualAnswers([]);
        setSubmitFiles([]);
        setIsSubmitted(false);
        setIsScored(false);
      }
    } catch (error) {
      console.error("Error fetching submission:", error);
      setOverview(null);
      setQuestions([]);
      setManualAnswers([]);
      setSubmitFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOkClick = () => {
    if (from === "lesson-detail") {
      const courseId = courseIdParam || searchParams.get("courseId");
      const lessonId = searchParams.get("lessonId");
      if (courseId && lessonId) {
        let url = `/${locale}/courses/${courseId}/lesson/${lessonId}?tab=homework`;
        if (courseId) {
          url += `&courseId=${courseId}`;
        }
        router.push(url);
      } else {
        let url = `/${locale}/assignments`;
        if (courseId) {
          url += `?courseId=${courseId}`;
        }
        router.push(url);
      }
    } else if (from === "progress-report") {
      router.push(`/${locale}/progress-report`);
    } else {
      let url = `/${locale}/assignments`;
      if (weekParam) {
        url += `?week=${weekParam}`;
      }
      if (courseIdParam) {
        url += `${url.includes("?") ? "&" : "?"}courseId=${courseIdParam}`;
      }
      router.push(url);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("loadingResults")}</p>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{t("resultsNotFound")}</p>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("goBack")}
          </Button>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const writingSpeakingCount = Number(overview.manual_questions_count || 0);
  const questionsCompleted = Number(overview.questions_completed || 0);
  const otherCount = Math.max(questionsCompleted - writingSpeakingCount, 0);
  const totalQuestions = Number(overview.total_questions || 0);
  const completionRate =
    totalQuestions > 0
      ? Math.round((questionsCompleted / totalQuestions) * 100)
      : 0;

  // Create a map of manual answers by question ID
  const manualAnswersMap = new Map(manualAnswers.map((ma) => [ma.id, ma]));

  // Sort questions: writing and speaking first, then others
  const sortedQuestions = [...questions].sort((a, b) => {
    const aIsManual = a.type === "writing" || a.type === "speaking";
    const bIsManual = b.type === "writing" || b.type === "speaking";

    if (aIsManual && !bIsManual) return -1;
    if (!aIsManual && bIsManual) return 1;
    return 0;
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-lg border-b rounded-b-3xl sticky top-0 z-30">
        <div className="max-w-full mx-auto px-4 sm:px-8 lg:px-12">
          {isMobile ? (
            // Mobile Layout
            <div className="py-4">
              <div className="landscape:flex landscape:items-center landscape:justify-between landscape:h-16">
                {/* Back button */}
                <div className="flex items-center justify-start mb-3 landscape:mb-0">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={handleOkClick}
                    className="text-gray-600 hover:text-gray-900 rounded-full shadow-md transition-all hover:bg-blue-100"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    {t("backToAssignments")}
                  </Button>
                </div>

                {/* Separator - only show in landscape */}
                <Separator
                  orientation="vertical"
                  className="h-8 hidden landscape:block landscape:mx-6"
                />

                {/* Title and score row */}
                <div className="flex items-center justify-between landscape:flex-1">
                  <div className="flex-1 min-w-0 mr-3">
                    <h1 className="text-lg font-bold text-gray-800 truncate">
                      {overview.homework_name}
                    </h1>
                    {overview.homework_description && (
                      <p className="text-sm text-gray-500 truncate">
                        {overview.homework_description}
                      </p>
                    )}
                  </div>

                  {/* Compact score display */}
                  {(overview?.ratio !== undefined || urlRatio) && (
                    <div className="flex items-center bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-3 py-2 rounded-full shadow-lg">
                      <Award className="h-4 w-4 mr-1" />
                      <span className="text-sm font-bold">
                        {overview?.ratio ?? urlRatio}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Desktop Layout
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-6">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleOkClick}
                  className="text-gray-600 hover:text-gray-900 rounded-full shadow-md transition-all hover:bg-blue-100"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  {t("backToAssignments")}
                </Button>
                <Separator orientation="vertical" className="h-8" />
                <div>
                  <h1 className="text-2xl font-extrabold text-blue-600 drop-shadow-lg">
                    {t("homeworkResults")}
                  </h1>
                  <p className="text-base text-gray-500 font-medium">
                    {overview.homework_name}
                    {overview.homework_description
                      ? ` - ${overview.homework_description}`
                      : ""}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-full mx-auto px-4 sm:px-8 lg:px-12 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar: Student Info & Statistics */}
          <div className="lg:col-span-1">
            <div
              className={`${
                isMobile ? "space-y-4" : "sticky top-28 h-auto space-y-8"
              } scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100`}
            >
              {/* Student Info */}
              <Card className="rounded-2xl shadow-xl border-0 bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center text-blue-700">
                    <User className="h-5 w-5 mr-2 text-blue-500" />
                    {t("studentInformation")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={"/placeholder.svg?height=40&width=40"}
                      alt={overview.student_name}
                      className="h-12 w-12 rounded-full border-2 border-blue-200 shadow"
                    />
                    <div>
                      <p className="font-bold text-lg text-gray-900">
                        {overview.student_name}
                      </p>
                    </div>
                  </div>

                  {/* Score Display - Only show on desktop since mobile has it in header */}
                  {!isMobile && (overview?.ratio !== undefined || urlRatio) && (
                    <>
                      <Separator />
                      <div className="text-center p-3 bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 rounded-2xl border border-emerald-200 shadow-lg">
                        <div className="flex items-center justify-center mb-3">
                          <div className="p-3 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full shadow-lg">
                            <Award className="h-8 w-8 text-white" />
                          </div>
                        </div>
                        <div className="mb-2">
                          <span className="text-lg font-semibold text-gray-700">
                            {t("totalScore")}
                          </span>
                        </div>
                        <div className="text-5xl font-extrabold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2">
                          {overview?.ratio ?? urlRatio}%
                        </div>
                      </div>
                    </>
                  )}

                  {overview?.homework_question_form === "write" ? (
                    // Stats for write form
                    <div className="space-y-2 text-base">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {t("questionFiles")}:
                        </span>
                        <span className="font-semibold text-blue-700">
                          {overview.question_files?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {t("submittedFiles")}:
                        </span>
                        <span className="font-semibold text-green-700">
                          {submitFiles.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t("status")}:</span>
                        <span
                          className={`font-semibold ${
                            isSubmitted ? "text-green-700" : "text-red-700"
                          }`}
                        >
                          {isSubmitted ? t("submitted") : t("notSubmitted")}
                        </span>
                      </div>
                    </div>
                  ) : (
                    // Stats for question form
                    <div className="space-y-2 text-base">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {t("writingSpeaking")}:
                        </span>
                        <span className="font-semibold text-blue-700">
                          {writingSpeakingCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {t("otherQuestions")}:
                        </span>
                        <span className="font-semibold text-green-700">
                          {otherCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {t("completedTotal")}:
                        </span>
                        <span className="font-semibold text-gray-800">
                          {questionsCompleted} / {totalQuestions}
                        </span>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Teacher Comment */}
                  {overview.latest_comment && (
                    <div className="space-y-2">
                      <p className="font-medium text-gray-700">
                        {t("teacherComment")}:
                      </p>
                      <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                        <p className="text-sm text-gray-700 italic">
                          "{overview.latest_comment}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Note about waiting for grading - for write form */}
                  {overview?.homework_question_form === "write" &&
                    isSubmitted &&
                    !isScored && (
                      <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <p className="text-sm text-blue-700">
                          <Clock className="h-4 w-4 inline mr-1" />
                          {t("waitingForGrading")}
                        </p>
                      </div>
                    )}

                  {/* Note about manual grading - only for question form */}
                  {overview?.homework_question_form !== "write" &&
                    writingSpeakingCount > 0 &&
                    !isAllScored && (
                      <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <p className="text-sm text-blue-700">
                          <Clock className="h-4 w-4 inline mr-1" />
                          {t("manualGradingNote")}
                        </p>
                      </div>
                    )}

                  {/* Question List - only for question form */}
                  {overview?.homework_question_form !== "write" &&
                    sortedQuestions.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          {t("questionList")}
                        </h4>
                        <div className="grid grid-cols-5 gap-2">
                          {sortedQuestions.map((question, index) => {
                            const isManual =
                              question.type === "writing" ||
                              question.type === "speaking";
                            const manualAnswer = manualAnswersMap.get(
                              question.id
                            );

                            let bgColor = "";
                            let textColor = "";
                            let borderColor = "";

                            if (isManual) {
                              if (manualAnswer?.is_scored === true) {
                                bgColor = "bg-green-100";
                                textColor = "text-green-800";
                                borderColor = "border-green-200";
                              } else {
                                bgColor = "bg-yellow-100";
                                textColor = "text-yellow-800";
                                borderColor = "border-yellow-200";
                              }
                            } else {
                              bgColor = "bg-green-100";
                              textColor = "text-green-800";
                              borderColor = "border-green-200";
                            }

                            return (
                              <div
                                key={question.id}
                                className={`${bgColor} ${textColor} ${borderColor} border rounded-lg p-2 text-center text-sm font-medium hover:scale-105 transition-transform cursor-pointer`}
                                onClick={() => {
                                  const element = document.getElementById(
                                    `question-${index}`
                                  );
                                  if (element) {
                                    element.scrollIntoView({
                                      behavior: "smooth",
                                      block: "start",
                                    });
                                  }
                                }}
                              >
                                {index + 1}
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded mr-2"></div>
                            <span className="text-gray-600">
                              {t("completed")}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded mr-2"></div>
                            <span className="text-gray-600">
                              {t("teacherGraded")}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content: Questions & Answers or File-based Homework */}
          <div className="lg:col-span-3">
            {overview?.homework_question_form === "write" ? (
              // File-based homework display
              <div className="space-y-8">
                {/* Question Files Section */}
                {overview.question_files &&
                  overview.question_files.length > 0 && (
                    <Card className="rounded-2xl shadow-lg border-0 bg-white">
                      <CardHeader className="bg-blue-50 py-4 rounded-t-2xl">
                        <CardTitle className="flex items-center text-md md:text-xl">
                          <FileText className="h-5 w-5 mr-2" />
                          {t("questionFiles")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {overview.question_files.map((file, index) => (
                            <FileItem
                              key={index}
                              file={file}
                              index={index}
                              isQuestionFile={true}
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Submit Files Section */}
                <Card className="rounded-2xl shadow-lg border-0 bg-white">
                  <CardHeader className="bg-green-50 py-4 rounded-t-2xl">
                    <CardTitle className="flex items-center text-md md:text-xl">
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      {t("submittedFiles")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {submitFiles.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {submitFiles.map((file, index) => (
                          <FileItem key={index} file={file} index={index} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">{t("noFilesSubmitted")}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Teacher Comment Section for Write Form */}
                {overview.latest_comment && (
                  <Card className="rounded-2xl shadow-lg border-0 bg-white">
                    <CardHeader className="bg-yellow-50 py-4 rounded-t-2xl">
                      <CardTitle className="flex items-center text-md md:text-xl">
                        <Star className="h-5 w-5 mr-2" />
                        {t("teacherComment")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                        <p className="text-gray-700 italic">
                          "{overview.latest_comment}"
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              // Question-based homework display (original logic)
              <div className="space-y-8">
                {sortedQuestions.length > 0 ? (
                  sortedQuestions.map((question, index) => (
                    <QuestionAnswerDisplay
                      key={question.id}
                      question={question}
                      manualAnswer={manualAnswersMap.get(question.id)}
                      index={index}
                      t={t}
                    />
                  ))
                ) : (
                  <Card className="rounded-2xl shadow-lg border-0 bg-white">
                    <CardContent className="p-8 text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {t("noQuestionsFound")}
                      </h3>
                      <p className="text-gray-600">
                        {t("noQuestionsDescription")}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
