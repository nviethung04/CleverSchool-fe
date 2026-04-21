"use client";

import type React from "react";

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ClipboardCheck,
} from "lucide-react";
import type { Exam } from "@/lib/api/exams";

interface ExamSubmissionPageProps {
  examName: string;
  questions: any[] | null | undefined;
  currentQuestionIndex: number;
  examDetail: Exam | null;
  timeLeft: number | null;
  isLoading: boolean;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
  onQuestionJump: (index: number) => void;
  renderQuestion: () => React.ReactNode;
  formatTime: (seconds: number | null) => string;
  isQuestionAnswered: (questionId: string) => boolean;
}

export default function ExamSubmissionPage({
  questions,
  currentQuestionIndex,
  examDetail,
  timeLeft,
  isLoading,
  onNext,
  onBack,
  onSubmit,
  onQuestionJump,
  renderQuestion,
  formatTime,
  isQuestionAnswered,
  examName,
}: ExamSubmissionPageProps) {
  const currentQuestion = Array.isArray(questions)
    ? questions[currentQuestionIndex]
    : null;

  if (isLoading) {
    return (
      <div className="h-[100dvh] w-screen fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900 overflow-hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Đang tải câu hỏi...</p>
        </div>
      </div>
    );
  }

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="h-[100dvh] w-screen fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900 overflow-hidden">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-white mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Không tìm thấy câu hỏi
          </h1>
          <p className="text-white/80">Bài thi này chưa có câu hỏi nào.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-screen flex overflow-hidden">
      {/* Main Content Area (left side) */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Question Header - Fixed at top */}
        <div className="flex-shrink-0 p-4 md:p-6 lg:p-8">
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-[#32428D] text-center">
            Câu hỏi {currentQuestionIndex + 1}:{" "}
            {currentQuestion?.metadata?.instructions || "Complete the question"}
          </h2>
        </div>

        {/* Question Content - Scrollable area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
          <div className="max-w-7xl mx-auto w-full flex justify-center min-h-full">
            {/* Question Render */}
            <div className="flex-1 flex items-center justify-center py-8">
              {renderQuestion()}
            </div>
          </div>
        </div>

        {/* Navigation Buttons - Fixed positioning */}
        <button
          onClick={onBack}
          disabled={currentQuestionIndex === 0}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#3B82F6] shadow-lg border border-gray-200 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed z-30 flex items-center justify-center transition-all duration-200 hover:scale-110"
          aria-label="Back"
        >
          <ChevronLeft size={24} className="flex-shrink-0" />
        </button>

        <button
          onClick={onNext}
          disabled={
            !Array.isArray(questions) ||
            currentQuestionIndex >= questions.length - 1
          }
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#3B82F6] shadow-lg border border-gray-200 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed z-30 flex items-center justify-center transition-all duration-200 hover:scale-110"
          aria-label="Next"
        >
          <ChevronRight size={24} className="flex-shrink-0" />
        </button>
      </div>

      {/* Sidebar (right side) */}
      <div
        className="w-64 landscape:w-52 md:w-72 lg:w-80 xl:w-96 flex-shrink-0 flex flex-col relative overflow-hidden bg-white"
      // style={{
      //   backgroundImage: "url(/images/sidebar.png)",
      //   backgroundSize: "cover",
      //   backgroundPosition: "center",
      // }}
      >
        {/* Sidebar Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Exam Header - Fixed at top */}
          <div className="flex-shrink-0 p-4 landscape:p-3 md:p-6">
            <h1 className="text-lg landscape:text-base md:text-xl font-bold text-[#32428D] mb-4 landscape:mb-2 text-center flex items-center justify-center gap-2">
              <ClipboardList className="w-5 h-5 landscape:w-4 landscape:h-4 md:w-6 md:h-6" />
              <span>{examName || "Bài kiểm tra"}</span>
            </h1>

            {/* Timer */}
            <div className="px-4 landscape:px-2 py-2 landscape:py-1 mb-4 landscape:mb-2">
              <div className="bg-[#F0F7FF] rounded-2xl px-4 landscape:px-2 py-3 landscape:py-2 flex items-center justify-center shadow-lg">
                <div className="text-2xl landscape:text-lg md:text-3xl font-bold text-[#0078FF]">
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>
          </div>

          {/* Question List Indicator - Scrollable */}
          <div className="flex-1 overflow-y-auto px-4 landscape:px-2 pb-4 landscape:pb-2">
            <div
              className="grid gap-3 landscape:gap-2"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(2.5rem, 1fr))",
              }}
            >
              {Array.isArray(questions) &&
                questions.map((question, index) => {
                  const isAnswered = isQuestionAnswered(question.id);
                  const isCurrent = index === currentQuestionIndex;
                  return (
                    <button
                      key={index}
                      onClick={() => onQuestionJump(index)}
                      className={`
                        w-10 h-10 landscape:w-8 landscape:h-8 rounded-full text-sm landscape:text-xs font-medium transition-all duration-200 hover:scale-110 cursor-pointer shadow-md flex items-center justify-center
                        ${isCurrent && isAnswered
                          ? "bg-[#0078FF] text-white font-bold"
                          : isCurrent && !isAnswered
                            ? "bg-white text-[#0078FF] border-[#0078FF] border-2 font-bold"
                            : isAnswered
                              ? "bg-[#87BDFF] text-white font-bold"
                              : "bg-white text-[#60A5FA] border-[#60A5FA] border font-bold"
                        }
                      `}
                    >
                      {index + 1}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Submit Button - Fixed at bottom */}
          <div
            className="flex-shrink-0 p-4 landscape:p-2 md:p-6"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}
          >
            <button
              onClick={onSubmit}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-full transition-colors duration-200 shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-2"
            >
              <ClipboardCheck className="w-5 h-5 md:w-6 md:h-6" />
              Nộp bài
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
