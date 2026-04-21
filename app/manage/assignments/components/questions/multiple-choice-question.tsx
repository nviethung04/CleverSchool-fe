"use client";

import { useState, useEffect } from "react";
import type { QuestionType } from "@/lib/api/questions";
import { MediaDisplay } from "../media-display";
import { TiptapMathViewer } from "@/components/question-editor/tiptap-math-viewer";

interface MultipleChoiceQuestionProps {
  question: QuestionType;
  selectedAnswerIds?: (string | number)[];
  onAnswerSelect: (answerIds: (string | number)[]) => void;
  isSubmitted: boolean;
  correctAnswer?: any;
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function MultipleChoiceQuestion({
  question,
  selectedAnswerIds = [],
  onAnswerSelect,
  isSubmitted,
  correctAnswer,
}: MultipleChoiceQuestionProps) {
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [shuffledAnswers, setShuffledAnswers] = useState<any[]>([]);

  // Xác định xem câu hỏi này có cho phép chọn nhiều đáp án không
  // Dựa vào correct_answers.ids - nếu có nhiều hơn 1 ID thì cho phép multiple choice
  const isMultipleChoice =
    question.correct_answers?.ids && question.correct_answers.ids.length > 1;

  useEffect(() => {
    setSelectedIds(selectedAnswerIds);
  }, [selectedAnswerIds]);

  // Shuffle answers when component mounts or question changes
  useEffect(() => {
    if (question.options.answers) {
      const shuffled = shuffleArray(question.options.answers);
      setShuffledAnswers(shuffled);
    }
  }, [question.options.answers]);

  const handleOptionSelect = (answerId: string | number) => {
    if (isSubmitted) return;

    let newSelectedIds: (string | number)[];

    if (isMultipleChoice) {
      // Multiple choice: toggle selection
      if (selectedIds.includes(answerId)) {
        newSelectedIds = selectedIds.filter((id) => id !== answerId);
      } else {
        newSelectedIds = [...selectedIds, answerId];
      }
    } else {
      // Single choice: replace selection
      newSelectedIds = [answerId];
    }

    setSelectedIds(newSelectedIds);
    onAnswerSelect(newSelectedIds);
  };

  const hasMedia =
    question.content.media && question.content.media.type !== "text";

  // Helper function to get answer size based on number of answers - Responsive cho iPad landscape
  const getAnswerSize = (answerCount: number) => {
    if (answerCount <= 2) return `w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64`; // Extra large for 2 answers
    if (answerCount <= 4) return `w-44 h-44 md:w-52 md:h-52 lg:w-60 lg:h-60`; // Large for 4 answers
    return `w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56`; // Medium-large for more answers
  };
  const renderOptions = () => {
    const answerCount = shuffledAnswers.length;
    const answerSize = getAnswerSize(answerCount);
    const correctIds = correctAnswer?.ids || [];
    const isShowCorrect = !!correctAnswer;

    return shuffledAnswers.map((option, index) => {
      const isSelected = selectedIds.includes(option.id);
      const hasMedia = option.media && option.media.url;
      const isTextOnly = !hasMedia && option.text;
      const isCorrect = correctIds.includes(option.id);

      return (
        <button
          key={option.id}
          onClick={() => {
            if (!isShowCorrect) handleOptionSelect(option.id);
            // Nếu đang show đáp án đúng thì không làm gì khi click
          }}
          // Không disable button, nhưng không cho click khi show đáp án đúng
          className={`
            relative overflow-hidden transition-all duration-200 flex-shrink-0
            multiple-choice-answer-button
            ${
              isTextOnly
                ? "rounded-[25px] shadow-[0_4px_10px_rgba(0,0,0,0.05)] border px-8 py-4 min-w-[180px] md:min-w-[220px] lg:min-w-[260px] h-auto"
                : `${answerSize} rounded-2xl shadow-lg`
            }
            ${
              isCorrect
                ? "ring-4 ring-green-400 bg-green-50 border-green-400"
                : isSelected && !isShowCorrect
                ? "bg-blue-500 border-blue-500 text-white"
                : isTextOnly
                ? "bg-white border-gray-200"
                : "bg-white border-2 border-gray-200"
            }
            ${
              !isSelected && !isShowCorrect
                ? isTextOnly
                  ? "hover:shadow-md hover:border-blue-300 cursor-pointer"
                  : "hover:scale-110 active:scale-95 cursor-pointer hover:shadow-xl hover:border-blue-300"
                : "cursor-default"
            }
            disabled:opacity-50
          `}
        >
          {hasMedia && (
            <div className="absolute inset-0">
              <MediaDisplay
                media={option.media}
                alt={`Option ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {option.text && (
            <div
              className={`${
                hasMedia
                  ? `absolute inset-x-0 bottom-0 ${
                      isSelected && !isShowCorrect
                        ? "bg-blue-600 bg-opacity-80 text-white"
                        : "bg-white bg-opacity-70 text-[#32428D]"
                    }`
                  : isTextOnly
                  ? `w-full flex items-center justify-center ${
                      isSelected && !isShowCorrect ? "text-white" : ""
                    }`
                  : `w-full h-full flex items-center justify-center ${
                      isSelected && !isShowCorrect ? "text-white" : ""
                    }`
              } ${isCorrect && !hasMedia ? "text-green-700" : ""}`}
            >
              <p
                className={`font-medium text-center ${
                  hasMedia
                    ? "text-lg md:text-xl py-2 px-2"
                    : isTextOnly
                    ? "text-lg md:text-xl lg:text-2xl whitespace-nowrap"
                    : "text-lg md:text-xl lg:text-2xl px-2"
                }`}
              >
                {option.text}
              </p>
            </div>
          )}

          {!option.text && !hasMedia && (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-sm text-gray-400">Không có nội dung</p>
            </div>
          )}
        </button>
      );
    });
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {/* QUESTION LAYOUT (TOP) */}
      <div
        className="w-full max-w-5xl mx-auto"
        style={{ minHeight: 260, height: "min(320px, 30vw)" }}
      >
        {hasMedia ? (
          <div className="flex flex-row items-stretch h-full">
            {/* Media cột trái */}
            <div className="flex-1 flex items-center justify-center">
              <MediaDisplay
                media={question.content.media}
                alt="Question media"
                className="w-full h-full"
              />
            </div>
            {/* Text cột phải */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-[#32428D] font-medium leading-relaxed text-center text-xl lg:text-2xl">
                <TiptapMathViewer
                  value={
                    question.content.text?.split("\n").join("<br />") || ""
                  }
                  isHtml
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-[#32428D] font-medium leading-relaxed text-center text-xl lg:text-2xl">
              <TiptapMathViewer
                value={question.content.text?.split("\n").join("<br />") || ""}
                isHtml
              />
            </div>
          </div>
        )}
      </div>
      {/* KHOẢNG CÁCH GIỮA 2 LAYOUT */}
      <div className="h-24" />
      {/* ANSWER LAYOUT (BOTTOM) */}
      <div
        className="w-full max-w-full mx-auto flex items-center justify-center"
        style={{ minHeight: 180 }}
      >
        <div className="flex flex-wrap justify-center gap-6 md:gap-8 w-full">
          {renderOptions()}
        </div>
      </div>
    </div>
  );
}
