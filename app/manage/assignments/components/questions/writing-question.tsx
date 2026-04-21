"use client";
import { useState, useEffect } from "react";
import { TiptapMathViewer } from "@/components/question-editor/tiptap-math-viewer";
import { MediaDisplay } from "@/app/manage/assignments/components/media-display";

interface WritingQuestionProps {
  question: {
    id: string;
    text?: string;
    kind: string;
    type: string;
    skill: string;
    level: string;
    topic: string;
    metadata: {
      instructions: string;
      points: number;
      time: number;
    };
    content: {
      text: string;
      media?: {
        type: "image" | "audio" | "video" | "text";
        url: string;
      };
      prompt?: string;
    };
    options: {
      maxCharacters?: number;
      allowRichText?: boolean;
      allowImageUpload?: boolean;
    };
  };
  userAnswer?: {
    text: string;
    richText?: string;
    image?: string;
    isAnswered: boolean;
  };
  onAnswerUpdate: (answer: any) => void;
  onSkip?: () => void;
  onCheck?: () => void;
  onFeedback?: (state: "correct" | "incorrect" | "initial") => void;
  isSubmitted?: boolean;
  className?: string;
  studentAnswer?: any;
}

export function WritingQuestion({
  question,
  userAnswer,
  onAnswerUpdate,
  onSkip,
  onCheck,
  onFeedback,
  isSubmitted = false,
  className = "",
  studentAnswer,
}: WritingQuestionProps) {
  const [text, setText] = useState(userAnswer?.text || "");

  useEffect(() => {
    // Ưu tiên hiển thị đáp án đã làm nếu có
    if (studentAnswer?.answer) {
      setText(studentAnswer.answer);
    } else {
      setText(userAnswer?.text || "");
    }
  }, [question.id, studentAnswer?.answer]);

  // Update answer when content changes
  useEffect(() => {
    onAnswerUpdate({
      text,
      isAnswered: text.trim().length > 0,
      wordCount: text.trim() ? text.trim().split(/\s+/).length : 0,
      characterCount: text.length,
    });
  }, [text, onAnswerUpdate]);

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {/* QUESTION LAYOUT (TOP) */}
      <div
        className="w-full max-w-5xl mx-auto"
        style={{ minHeight: 260, height: "min(320px, 30vw)" }}
      >
        {question.content.media && question.content.media?.type !== "text" ? (
          <div className="flex flex-row items-stretch h-full gap-12">
            {/* Media cột trái */}
            <div className="flex-1 flex items-center justify-center">
              <MediaDisplay
                media={question.content.media}
                className="w-full h-full object-contain"
                showControls={true}
              />
            </div>
            {/* Text cột phải */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-[#32428D] font-medium leading-relaxed text-center text-xl lg:text-2xl px-4">
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
            <div className="text-[#32428D] font-medium leading-relaxed text-center text-xl lg:text-2xl px-4">
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
        className="w-full max-w-5xl mx-auto flex items-center justify-center"
        style={{ minHeight: 180 }}
      >
        <div className="w-full max-w-3xl mx-auto">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isSubmitted}
            placeholder="Viết đáp án của bạn..."
            className="w-full h-64 p-4 text-[#32428D] text-lg font-medium border-2 border-[#60A5FA] rounded-xl resize-none focus:outline-none focus:border-[#60A5FA] focus:ring-2 focus:ring-[#60A5FA] placeholder-gray-400 bg-white"
            maxLength={question.options?.maxCharacters || 1000}
          />
          <div className="mt-2 text-right">
            <span className="text-[#32428D] text-sm">
              {text.length}/{question.options?.maxCharacters || 1000}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
