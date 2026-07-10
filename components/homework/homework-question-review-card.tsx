"use client";

import { CheckCircle2, Clock, FileText, Mic, PenTool } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TiptapMathViewer } from "@/components/question-editor/tiptap-math-viewer";
import { LatexText } from "@/components/latex-text";
import type { HomeworkQuestion } from "@/lib/api/exam-answers";

type ReviewLabels = {
  question: string;
  correctAnswers: string;
  correctOrder: string;
  position: string;
  labels: string;
  allItems: string;
  allAnswers: string;
  wrongAnswer: string;
  completed: string;
  graded: string;
  pendingGrading: string;
};

const defaultLabels: ReviewLabels = {
  question: "Câu hỏi",
  correctAnswers: "Đáp án đúng",
  correctOrder: "Thứ tự đúng",
  position: "Vị trí",
  labels: "Nhãn",
  allItems: "Tất cả mục",
  allAnswers: "Tất cả đáp án",
  wrongAnswer: "Đáp án sai",
  completed: "Đã hoàn thành",
  graded: "Đã chấm",
  pendingGrading: "Chờ chấm điểm",
};

function renderMedia(media: { type?: string; url?: string }) {
  if (!media?.url) return null;
  if (media.type === "image") {
    return (
      <img
        src={media.url}
        alt=""
        className="max-w-[200px] w-full h-auto mt-2 rounded border"
      />
    );
  }
  if (media.type === "audio") {
    return <audio controls src={media.url} className="mt-2 w-full max-w-md" />;
  }
  if (media.type === "video") {
    return (
      <video
        controls
        src={media.url}
        className="mt-2 max-w-xs rounded border"
      />
    );
  }
  return null;
}

function renderCorrectAnswers(question: HomeworkQuestion, labels: ReviewLabels) {
  if (question.type === "writing" || question.type === "speaking") {
    return null;
  }

  switch (question.type) {
    case "multiple_choice":
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {question.options?.answers?.map((answer: any, idx: number) => {
            const isCorrect =
              typeof answer.is_correct === "boolean"
                ? answer.is_correct
                : question.correct_answers?.ids?.includes(String(answer.id));
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-sm ${
                  isCorrect
                    ? "bg-green-100 border-green-400 text-green-800"
                    : "bg-gray-50 border-gray-200 text-gray-700"
                }`}
              >
                <LatexText value={answer.text} />
                {answer.media && renderMedia(answer.media)}
              </div>
            );
          })}
        </div>
      );

    case "fill_in_blanks":
      return (
        <div className="flex flex-wrap gap-2">
          {question.options?.answers?.map((answer: any, idx: number) => {
            if (!answer.correct_position || answer.correct_position <= 0) {
              return null;
            }
            return (
              <div
                key={idx}
                className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm"
              >
                <span className="text-blue-600 font-medium">
                  {labels.position} {answer.correct_position}:
                </span>{" "}
                <LatexText value={answer.text} />
              </div>
            );
          })}
        </div>
      );

    case "matching":
      return (
        <div className="space-y-2">
          {Array.from({
            length: Math.max(
              question.options?.sources?.length || 0,
              question.options?.targets?.length || 0
            ),
          }).map((_, idx) => {
            const source = question.options?.sources?.[idx];
            const target = question.options?.targets?.[idx];
            return (
              <div
                key={idx}
                className="flex items-center gap-3 p-2 bg-purple-50 border border-purple-200 rounded-lg text-sm"
              >
                <LatexText value={source?.content?.text || "-"} />
                <span className="text-gray-400">↔</span>
                <LatexText value={target?.content?.text || "-"} />
              </div>
            );
          })}
        </div>
      );

    case "ordering":
      return (
        <div className="space-y-2">
          {[...(question.options?.answers || [])]
            .sort(
              (a: any, b: any) =>
                (a.correct_position || 0) - (b.correct_position || 0)
            )
            .map((answer: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm"
              >
                <span className="w-6 h-6 bg-orange-200 text-orange-800 rounded-full flex items-center justify-center text-xs font-medium">
                  {answer.correct_position || idx + 1}
                </span>
                <LatexText value={answer.text} />
              </div>
            ))}
        </div>
      );

    case "drag_drop":
      return (
        <div className="space-y-2">
          {question.options?.answers?.map((answer: any, idx: number) => (
            <div
              key={idx}
              className={`p-2 rounded border text-sm ${
                answer.correct_position > 0
                  ? "bg-green-50 border-green-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              {answer.correct_position > 0
                ? `${labels.position} ${answer.correct_position}: `
                : `${labels.wrongAnswer}: `}
              <LatexText value={answer.text} />
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}

function getQuestionIcon(type: string) {
  switch (type) {
    case "speaking":
      return <Mic className="h-4 w-4" />;
    case "writing":
      return <PenTool className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

export function HomeworkQuestionReviewCard({
  question,
  index,
  labels = defaultLabels,
  manualPending = false,
}: {
  question: HomeworkQuestion;
  index: number;
  labels?: Partial<ReviewLabels>;
  manualPending?: boolean;
}) {
  const t = { ...defaultLabels, ...labels };
  const isManual = question.type === "writing" || question.type === "speaking";

  return (
    <Card
      className="overflow-hidden rounded-2xl shadow-lg border-0 bg-white"
      id={`question-${index}`}
    >
      <CardHeader className="bg-gray-50 py-4 rounded-t-2xl">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center text-xl flex-wrap">
            {getQuestionIcon(question.type)}
            <span className="ml-2">
              {t.question} {index + 1}
            </span>
            <Badge variant="outline" className="ml-2 capitalize">
              {question.type.replace(/_/g, " ")}
            </Badge>
          </CardTitle>
          {isManual ? (
            manualPending ? (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                <Clock className="h-3 w-3 mr-1" />
                {t.pendingGrading}
              </Badge>
            ) : (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {t.graded}
              </Badge>
            )
          ) : (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {t.completed}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-2">{t.question}:</h4>
          <TiptapMathViewer value={question.content?.text || ""} />
          {question.content?.media?.url && renderMedia(question.content.media)}
          {question.metadata?.instructions && (
            <p className="text-sm text-gray-600 mt-2 italic">
              {question.metadata.instructions}
            </p>
          )}
        </div>

        {!isManual && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              {question.type === "ordering" ? t.correctOrder : t.correctAnswers}
            </h4>
            {renderCorrectAnswers(question, t)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
